import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { CreateRecipeDto } from "./dto/create-recipe.dto";
import { UpdateRecipeDto } from "./dto/update-recipe.dto";
import { SearchRecipeDto } from "./dto/search-recipe.dto";
import { RecipeStatus, Role } from "@prisma/client";

@Injectable()
export class RecipeService {
  private readonly HOT_RECIPES_CACHE_KEY = "hot_recipes";
  private readonly CACHE_TTL = 1800;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(userId: string, createRecipeDto: CreateRecipeDto) {
    const { ingredients, steps, ...recipeData } = createRecipeDto;

    const recipe = await this.prisma.$transaction(async (tx) => {
      const newRecipe = await tx.recipe.create({
        data: {
          ...recipeData,
          authorId: userId,
          ingredients: {
            create: ingredients.map((ing, idx) => ({
              ...ing,
              sortOrder: ing.sortOrder ?? idx,
            })),
          },
          steps: {
            create: steps.map((step) => ({
              ...step,
            })),
          },
        },
        include: {
          author: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          category: true,
          ingredients: { orderBy: { sortOrder: "asc" } },
          steps: { orderBy: { stepNumber: "asc" } },
        },
      });

      return newRecipe;
    });

    await this.clearHotCache();
    return recipe;
  }

  async findHot(limit: number = 8) {
    const cached = await this.redisService.get(this.HOT_RECIPES_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const recipes = await this.prisma.recipe.findMany({
      where: { status: RecipeStatus.PUBLISHED },
      orderBy: { likeCount: "desc" },
      take: limit,
      include: {
        author: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        category: { select: { id: true, name: true } },
      },
    });

    await this.redisService.set(
      this.HOT_RECIPES_CACHE_KEY,
      JSON.stringify(recipes),
      this.CACHE_TTL,
    );

    return recipes;
  }

  async findLatest(searchDto: SearchRecipeDto) {
    const { page = 1, limit = 10, ...filters } = searchDto;
    const skip = (page - 1) * limit;

    const where: any = { status: RecipeStatus.PUBLISHED };

    if (filters.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: "insensitive" } },
        {
          ingredients: {
            some: { name: { contains: filters.keyword, mode: "insensitive" } },
          },
        },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.minCookTime !== undefined) {
      where.cookTime = { ...where.cookTime, gte: filters.minCookTime };
    }

    if (filters.maxCookTime !== undefined) {
      where.cookTime = { ...where.cookTime, lte: filters.maxCookTime };
    }

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      data: recipes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        category: true,
        ingredients: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { stepNumber: "asc" } },
      },
    });

    if (!recipe) {
      throw new NotFoundException("Recipe not found");
    }

    if (recipe.status !== RecipeStatus.PUBLISHED) {
      if (!userId || recipe.authorId !== userId) {
        throw new NotFoundException("Recipe not found");
      }
    }

    await this.prisma.recipe.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    let isLiked = false;
    let isFavorited = false;

    if (userId) {
      const [like, collectionItem] = await Promise.all([
        this.prisma.like.findUnique({
          where: { userId_recipeId: { userId, recipeId: id } },
        }),
        this.prisma.collectionItem.findFirst({
          where: { recipeId: id, collection: { userId } },
        }),
      ]);
      isLiked = !!like;
      isFavorited = !!collectionItem;
    }

    return {
      ...recipe,
      isLiked,
      isFavorited,
    };
  }

  async findRelated(categoryId: string, recipeId: string, limit: number = 6) {
    return this.prisma.recipe.findMany({
      where: {
        categoryId,
        id: { not: recipeId },
        status: RecipeStatus.PUBLISHED,
      },
      take: limit,
      orderBy: { likeCount: "desc" },
      include: {
        author: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        category: { select: { id: true, name: true } },
      },
    });
  }

  async findMyRecipes(userId: string, status?: RecipeStatus) {
    const where: any = { authorId: userId };
    if (status) {
      where.status = status;
    }

    return this.prisma.recipe.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        _count: {
          select: { likes: true, favorites: true, comments: true },
        },
      },
    });
  }

  async update(id: string, userId: string, updateRecipeDto: UpdateRecipeDto) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException("Recipe not found");
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException("You are not the author of this recipe");
    }

    const { ingredients, steps, ...recipeData } = updateRecipeDto;

    const updatedRecipe = await this.prisma.$transaction(async (tx) => {
      const newRecipe = await tx.recipe.update({
        where: { id },
        data: recipeData,
        include: {
          author: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          category: true,
        },
      });

      if (ingredients) {
        await tx.ingredient.deleteMany({ where: { recipeId: id } });
        await tx.ingredient.createMany({
          data: ingredients.map((ing, idx) => ({
            name: ing.name!,
            amount: ing.amount!,
            recipeId: id,
            sortOrder: ing.sortOrder ?? idx,
          })),
        });
      }

      if (steps) {
        await tx.step.deleteMany({ where: { recipeId: id } });
        await tx.step.createMany({
          data: steps.map((step) => ({
            description: step.description!,
            image: step.image,
            recipeId: id,
            stepNumber: step.stepNumber!,
          })),
        });
      }

      const fullRecipe = await tx.recipe.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          category: true,
          ingredients: { orderBy: { sortOrder: "asc" } },
          steps: { orderBy: { stepNumber: "asc" } },
        },
      });

      return fullRecipe;
    });

    await this.clearHotCache();
    return updatedRecipe;
  }

  async remove(id: string, userId: string, userRole: Role) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new NotFoundException("Recipe not found");
    }

    if (recipe.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException("You cannot delete this recipe");
    }

    await this.prisma.recipe.delete({
      where: { id },
    });

    await this.clearHotCache();
    return { message: "Recipe deleted successfully" };
  }

  async toggleLike(recipeId: string, userId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe || recipe.status !== RecipeStatus.PUBLISHED) {
      throw new NotFoundException("Recipe not found");
    }

    const existingLike = await this.prisma.like.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
    });

    if (existingLike) {
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: { userId_recipeId: { userId, recipeId } },
        }),
        this.prisma.recipe.update({
          where: { id: recipeId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return { isLiked: false, likeCount: recipe.likeCount - 1 };
    } else {
      await this.prisma.$transaction([
        this.prisma.like.create({
          data: { userId, recipeId },
        }),
        this.prisma.recipe.update({
          where: { id: recipeId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      await this.clearHotCache();
      return { isLiked: true, likeCount: recipe.likeCount + 1 };
    }
  }

  async toggleFavorite(
    recipeId: string,
    userId: string,
    collectionId?: string,
  ) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe || recipe.status !== RecipeStatus.PUBLISHED) {
      throw new NotFoundException("Recipe not found");
    }

    const existingItem = await this.prisma.collectionItem.findFirst({
      where: { recipeId, collection: { userId } },
    });

    if (existingItem) {
      await this.prisma.$transaction([
        this.prisma.collectionItem.delete({
          where: { id: existingItem.id },
        }),
        this.prisma.recipe.update({
          where: { id: recipeId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ]);
      return { isFavorited: false, favoriteCount: recipe.favoriteCount - 1 };
    } else {
      let targetCollectionId = collectionId;

      if (!targetCollectionId) {
        let defaultCollection = await this.prisma.collection.findFirst({
          where: { userId, isDefault: true },
        });
        if (!defaultCollection) {
          defaultCollection = await this.prisma.collection.create({
            data: { name: "默认收藏夹", isDefault: true, userId },
          });
        }
        targetCollectionId = defaultCollection.id;
      }

      await this.prisma.$transaction([
        this.prisma.collectionItem.create({
          data: { collectionId: targetCollectionId, recipeId },
        }),
        this.prisma.recipe.update({
          where: { id: recipeId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ]);
      return {
        isFavorited: true,
        favoriteCount: recipe.favoriteCount + 1,
        collectionId: targetCollectionId,
      };
    }
  }

  async findMyFavorites(userId: string) {
    const items = await this.prisma.collectionItem.findMany({
      where: { collection: { userId } },
      orderBy: { createdAt: "desc" },
      include: {
        recipe: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true,
              },
            },
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    const seen = new Set<string>();
    return items
      .filter((item) => {
        if (seen.has(item.recipeId)) return false;
        seen.add(item.recipeId);
        return true;
      })
      .map((item) => item.recipe);
  }

  private async clearHotCache() {
    await this.redisService.del(this.HOT_RECIPES_CACHE_KEY);
  }
}
