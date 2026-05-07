import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalRecipes,
      totalComments,
      totalCategories,
      recentRecipes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.recipe.count({ where: { status: RecipeStatus.PUBLISHED } }),
      this.prisma.comment.count(),
      this.prisma.category.count(),
      this.prisma.recipe.findMany({
        where: { status: RecipeStatus.PUBLISHED },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: { select: { id: true, nickname: true } },
          category: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      totalRecipes,
      totalComments,
      totalCategories,
      recentRecipes,
    };
  }

  async getRecipesByCategory() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { recipes: { where: { status: RecipeStatus.PUBLISHED } } },
        },
      },
    });

    return categories.map((cat) => ({
      name: cat.name,
      count: cat._count.recipes,
    }));
  }

  async getRecipesLast30Days() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recipes = await this.prisma.recipe.findMany({
      where: {
        status: RecipeStatus.PUBLISHED,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyStats: { [key: string]: number } = {};
    
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = 0;
    }

    recipes.forEach((recipe) => {
      const dateKey = recipe.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateKey] !== undefined) {
        dailyStats[dateKey]++;
      }
    });

    return Object.entries(dailyStats).map(([date, count]) => ({
      date,
      count,
    }));
  }

  async getTopRecipes(limit: number = 10) {
    return this.prisma.recipe.findMany({
      where: { status: RecipeStatus.PUBLISHED },
      orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
      take: limit,
      include: {
        author: { select: { id: true, nickname: true, avatar: true } },
        category: { select: { id: true, name: true } },
      },
    });
  }

  async getUserActivityLast7Days() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recipes, comments, favorites] = await Promise.all([
      this.prisma.recipe.findMany({
        where: {
          status: RecipeStatus.PUBLISHED,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.comment.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.favorite.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const stats: { [key: string]: { recipes: number; comments: number; favorites: number } } = {};
    
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateKey = date.toISOString().split('T')[0];
      stats[dateKey] = { recipes: 0, comments: 0, favorites: 0 };
    }

    recipes.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split('T')[0];
      if (stats[dateKey]) stats[dateKey].recipes++;
    });

    comments.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split('T')[0];
      if (stats[dateKey]) stats[dateKey].comments++;
    });

    favorites.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split('T')[0];
      if (stats[dateKey]) stats[dateKey].favorites++;
    });

    return Object.entries(stats).map(([date, data]) => ({
      date,
      ...data,
    }));
  }
}
