import request from '@/utils/request';
import type { User, PaginatedResponse, Recipe } from '@/types';

export interface DashboardStats {
  totalUsers: number;
  totalRecipes: number;
  totalComments: number;
  totalCategories: number;
  recentRecipes: Recipe[];
}

export interface CategoryRecipeCount {
  name: string;
  count: number;
}

export interface DailyRecipeCount {
  date: string;
  count: number;
}

export interface UserActivity {
  date: string;
  recipes: number;
  comments: number;
  favorites: number;
}

export const adminApi = {
  getDashboardStats(): Promise<DashboardStats> {
    return request.get('/api/admin/dashboard');
  },

  getRecipesByCategory(): Promise<CategoryRecipeCount[]> {
    return request.get('/api/admin/recipes-by-category');
  },

  getRecipesLast30Days(): Promise<DailyRecipeCount[]> {
    return request.get('/api/admin/recipes-last-30-days');
  },

  getTopRecipes(limit: number = 10): Promise<Recipe[]> {
    return request.get('/api/admin/top-recipes', { params: { limit } });
  },

  getUserActivityLast7Days(): Promise<UserActivity[]> {
    return request.get('/api/admin/user-activity');
  },

  getUsers(page: number = 1, limit: number = 20): Promise<PaginatedResponse<User>> {
    return request.get('/api/users', { params: { page, limit } });
  },

  getUserById(id: string): Promise<User> {
    return request.get(`/api/users/${id}`);
  },
};
