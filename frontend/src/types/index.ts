export type Role = "USER" | "ADMIN";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type RecipeStatus = "DRAFT" | "PUBLISHED";

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string;
  avatar?: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
  recipeCount: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  sortOrder: number;
}

export interface Step {
  id: string;
  description: string;
  image?: string;
  stepNumber: number;
}

export interface Recipe {
  id: string;
  title: string;
  coverImage?: string;
  cookTime: number;
  difficulty: Difficulty;
  servings: number;
  status: RecipeStatus;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  authorId: string;
  categoryId: string;
  author: User;
  category: Category;
  ingredients?: Ingredient[];
  steps?: Step[];
  isLiked?: boolean;
  isFavorited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  isReported: boolean;
  isHidden: boolean;
  userId: string;
  recipeId: string;
  parentId?: string;
  user: User;
  replies?: Comment[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
}

export interface SearchRecipeParams {
  keyword?: string;
  categoryId?: string;
  difficulty?: Difficulty;
  minCookTime?: number;
  maxCookTime?: number;
  page?: number;
  limit?: number;
}

export interface Collection {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  recipeCount: number;
  createdAt: string;
  updatedAt: string;
}
