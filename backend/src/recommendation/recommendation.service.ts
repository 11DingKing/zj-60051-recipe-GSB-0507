import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RecipeStatus, Difficulty } from '@prisma/client';

interface UserPreference {
  categories: Map<string, number>;
  difficulties: Map<Difficulty, number>;
  ingredients: Map<string, number>;
  totalInteractions: number;
}

interface RecipeScore {
  recipe: any;
  score: number;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly CACHE_TTL = 300;
  private readonly DAYS_LOOKBACK = 30;
  private readonly RECOMMENDATION_LIMIT = 8;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private getCacheKey(userId: string): string {
    return `zj60051:recommend:${userId}`;
  }

  async getPersonalizedRecommendations(userId: string, excludeRecipeId?: string): Promise<any[]> {
    const cacheKey = this.getCacheKey(userId);
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      this.logger.log(`Cache hit for recommendations: ${userId}`);
      let recipes = JSON.parse(cached);
      if (excludeRecipeId) {
        recipes = recipes.filter((r: any) => r.id !== excludeRecipeId);
      }
      return recipes.slice(0, this.RECOMMENDATION_LIMIT);
    }

    this.logger.log(`Generating recommendations for user: ${userId}`);

    const recipes = await this.generateRecommendations(userId);

    await this.redisService.set(
      cacheKey,
      JSON.stringify(recipes),
      this.CACHE_TTL,
    );

    let result = recipes;
    if (excludeRecipeId) {
      result = result.filter((r: any) => r.id !== excludeRecipeId);
    }

    return result.slice(0, this.RECOMMENDATION_LIMIT);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    await this.redisService.del(cacheKey);
    this.logger.log(`Invalidated recommendation cache for user: ${userId}`);
  }

  private async generateRecommendations(userId: string): Promise<any[]> {
    const preference = await this.calculateUserPreference(userId);

    if (preference.totalInteractions === 0) {
      this.logger.log(`Cold start: user ${userId} has no recent interactions, using hot recipes`);
      return this.getHotRecipes();
    }

    return this.getScoredRecipes(userId, preference);
  }

  private async calculateUserPreference(userId: string): Promise<UserPreference> {
    const categories = new Map<string, number>();
    const difficulties = new Map<Difficulty, number>();
    const ingredients = new Map<string, number>();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.DAYS_LOOKBACK);

    const [likes, collectionItems] = await Promise.all([
      this.prisma.like.findMany({
        where: {
          userId,
          createdAt: { gte: cutoffDate },
        },
        include: {
          recipe: {
            include: {
              category: true,
              ingredients: true,
            },
          },
        },
      }),
      this.prisma.collectionItem.findMany({
        where: {
          collection: { userId },
          createdAt: { gte: cutoffDate },
        },
        include: {
          recipe: {
            include: {
              category: true,
              ingredients: true,
            },
          },
        },
      }),
    ]);

    const allInteractions = [
      ...likes.map((l) => l.recipe),
      ...collectionItems.map((c) => c.recipe),
    ];

    const uniqueRecipes = new Map<string, any>();
    for (const recipe of allInteractions) {
      if (!uniqueRecipes.has(recipe.id)) {
        uniqueRecipes.set(recipe.id, recipe);
      }
    }

    for (const recipe of uniqueRecipes.values()) {
      if (!recipe) continue;

      categories.set(
        recipe.categoryId,
        (categories.get(recipe.categoryId) || 0) + 1,
      );

      difficulties.set(
        recipe.difficulty,
        (difficulties.get(recipe.difficulty) || 0) + 1,
      );

      for (const ingredient of recipe.ingredients) {
        const normalizedName = ingredient.name.toLowerCase().trim();
        ingredients.set(
          normalizedName,
          (ingredients.get(normalizedName) || 0) + 1,
        );
      }
    }

    return {
      categories,
      difficulties,
      ingredients,
      totalInteractions: uniqueRecipes.size,
    };
  }

  private async getScoredRecipes(
    userId: string,
    preference: UserPreference,
  ): Promise<any[]> {
    const userCollections = await this.prisma.collection.findMany({
      where: { userId },
      select: { id: true },
    });

    const userCollectionIds = userCollections.map((c) => c.id);

    const userCollectionItems = await this.prisma.collectionItem.findMany({
      where: {
        collectionId: { in: userCollectionIds },
      },
      select: { recipeId: true },
    });

    const userLikedIds = await this.prisma.like.findMany({
      where: { userId },
      select: { recipeId: true },
    });

    const excludeRecipeIds = new Set([
      ...userCollectionItems.map((i) => i.recipeId),
      ...userLikedIds.map((l) => l.recipeId),
    ]);

    const candidateRecipes = await this.prisma.recipe.findMany({
      where: {
        status: RecipeStatus.PUBLISHED,
        id: { notIn: Array.from(excludeRecipeIds) },
      },
      include: {
        author: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        category: { select: { id: true, name: true } },
        ingredients: true,
      },
      take: 200,
      orderBy: { likeCount: 'desc' },
    });

    const scored = candidateRecipes.map((recipe) => ({
      recipe,
      score: this.calculateScore(recipe, preference),
    }));

    scored.sort((a, b) => b.score - a.score);

    const topScored = scored.slice(0, this.RECOMMENDATION_LIMIT * 2);

    if (topScored.length < this.RECOMMENDATION_LIMIT) {
      const hotRecipes = await this.getHotRecipes();
      const existingIds = new Set(topScored.map((s) => s.recipe.id));
      for (const hr of hotRecipes) {
        if (!existingIds.has(hr.id) && topScored.length < this.RECOMMENDATION_LIMIT * 2) {
          topScored.push({ recipe: hr, score: 0 });
        }
      }
    }

    return topScored.slice(0, this.RECOMMENDATION_LIMIT).map((s) => {
      const r = s.recipe;
      return {
        ...r,
        ingredients: undefined,
      };
    });
  }

  private calculateScore(recipe: any, preference: UserPreference): number {
    let score = 0;
    const total = Math.max(preference.totalInteractions, 1);

    const categoryWeight = 0.4;
    const difficultyWeight = 0.25;
    const ingredientWeight = 0.35;

    const categoryScore = preference.categories.get(recipe.categoryId) || 0;
    score += (categoryScore / total) * categoryWeight * 100;

    const difficultyScore = preference.difficulties.get(recipe.difficulty) || 0;
    score += (difficultyScore / total) * difficultyWeight * 100;

    const recipeIngredients = recipe.ingredients.map((i: any) =>
      i.name.toLowerCase().trim(),
    );
    let ingredientMatches = 0;
    for (const ing of recipeIngredients) {
      if (preference.ingredients.has(ing)) {
        ingredientMatches += preference.ingredients.get(ing)!;
      }
    }

    const totalIngredientInteractions = Array.from(
      preference.ingredients.values(),
    ).reduce((sum, v) => sum + v, 0);

    if (totalIngredientInteractions > 0) {
      score +=
        (ingredientMatches / totalIngredientInteractions) * ingredientWeight * 100;
    }

    score += Math.min(recipe.likeCount / 100, 10);

    return score;
  }

  private async getHotRecipes(): Promise<any[]> {
    return this.prisma.recipe.findMany({
      where: { status: RecipeStatus.PUBLISHED },
      orderBy: { likeCount: 'desc' },
      take: this.RECOMMENDATION_LIMIT,
      include: {
        author: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        category: { select: { id: true, name: true } },
      },
    });
  }
}
