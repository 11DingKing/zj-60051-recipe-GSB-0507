import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RecipeStatus } from '@prisma/client';

interface PreferenceVector {
  categories: Record<string, number>;
  difficulties: Record<string, number>;
  ingredients: Record<string, number>;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly CACHE_TTL = 300;
  private readonly RECOMMENDATION_LIMIT = 8;
  private readonly ACTIVITY_WINDOW_DAYS = 30;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private getCacheKey(userId: string): string {
    return `recommendation:${userId}`;
  }

  async getRecommendations(userId: string) {
    const cacheKey = this.getCacheKey(userId);
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const preferenceVector = await this.buildPreferenceVector(userId);

    if (!preferenceVector) {
      return this.getHotRecipes();
    }

    const recipes = await this.getRecipesByPreference(userId, preferenceVector);

    await this.redisService.set(
      cacheKey,
      JSON.stringify(recipes),
      this.CACHE_TTL,
    );

    return recipes;
  }

  private async buildPreferenceVector(userId: string): Promise<PreferenceVector | null> {
    const since = new Date();
    since.setDate(since.getDate() - this.ACTIVITY_WINDOW_DAYS);

    const [likedRecipes, favoritedRecipes] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { recipeId: true },
      }),
      this.prisma.collectionItem.findMany({
        where: { collection: { userId }, createdAt: { gte: since } },
        select: { recipeId: true },
      }),
    ]);

    const recipeIds = [
      ...new Set([
        ...likedRecipes.map((l) => l.recipeId),
        ...favoritedRecipes.map((f) => f.recipeId),
      ]),
    ];

    if (recipeIds.length === 0) {
      return null;
    }

    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        categoryId: true,
        difficulty: true,
        ingredients: { select: { name: true } },
      },
    });

    const categories: Record<string, number> = {};
    const difficulties: Record<string, number> = {};
    const ingredients: Record<string, number> = {};

    for (const recipe of recipes) {
      categories[recipe.categoryId] = (categories[recipe.categoryId] || 0) + 1;
      difficulties[recipe.difficulty] = (difficulties[recipe.difficulty] || 0) + 1;
      for (const ing of recipe.ingredients) {
        ingredients[ing.name] = (ingredients[ing.name] || 0) + 1;
      }
    }

    const total = recipes.length;
    for (const key of Object.keys(categories)) {
      categories[key] /= total;
    }
    for (const key of Object.keys(difficulties)) {
      difficulties[key] /= total;
    }
    for (const key of Object.keys(ingredients)) {
      ingredients[key] /= total;
    }

    return { categories, difficulties, ingredients };
  }

  private async getRecipesByPreference(
    userId: string,
    preference: PreferenceVector,
  ) {
    const candidateRecipes = await this.prisma.recipe.findMany({
      where: { status: RecipeStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        coverImage: true,
        cookTime: true,
        difficulty: true,
        servings: true,
        viewCount: true,
        likeCount: true,
        favoriteCount: true,
        categoryId: true,
        authorId: true,
        ingredients: { select: { name: true } },
        author: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        category: { select: { id: true, name: true } },
      },
    });

    const interactedRecipeIds = new Set(
      (
        await this.prisma.like.findMany({
          where: { userId },
          select: { recipeId: true },
        })
      ).map((l) => l.recipeId),
    );

    const favoritedIds = new Set(
      (
        await this.prisma.collectionItem.findMany({
          where: { collection: { userId } },
          select: { recipeId: true },
        })
      ).map((f) => f.recipeId),
    );

    for (const id of favoritedIds) interactedRecipeIds.add(id);

    const scored = candidateRecipes
      .filter((r) => !interactedRecipeIds.has(r.id))
      .map((recipe) => {
        let score = 0;

        score += (preference.categories[recipe.categoryId] || 0) * 3;

        score += (preference.difficulties[recipe.difficulty] || 0) * 2;

        const recipeIngredientNames = recipe.ingredients.map((i) => i.name);
        let ingredientOverlap = 0;
        for (const name of recipeIngredientNames) {
          if (preference.ingredients[name]) {
            ingredientOverlap += preference.ingredients[name];
          }
        }
        if (recipeIngredientNames.length > 0) {
          ingredientOverlap /= recipeIngredientNames.length;
        }
        score += ingredientOverlap * 4;

        score += recipe.likeCount * 0.01;

        return { ...recipe, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, this.RECOMMENDATION_LIMIT)
      .map(({ score, ingredients, authorId, ...rest }) => rest);

    return scored;
  }

  private async getHotRecipes() {
    return this.prisma.recipe.findMany({
      where: { status: RecipeStatus.PUBLISHED },
      orderBy: { likeCount: 'desc' },
      take: this.RECOMMENDATION_LIMIT,
      select: {
        id: true,
        title: true,
        coverImage: true,
        cookTime: true,
        difficulty: true,
        servings: true,
        viewCount: true,
        likeCount: true,
        favoriteCount: true,
        author: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        category: { select: { id: true, name: true } },
      },
    });
  }
}
