import request from "@/utils/request";
import type {
  Recipe,
  PaginatedResponse,
  SearchRecipeParams,
  Difficulty,
  RecipeStatus,
  Ingredient,
  Step,
} from "@/types";

export interface CreateRecipeData {
  title: string;
  coverImage?: string;
  cookTime: number;
  difficulty: Difficulty;
  servings: number;
  status?: RecipeStatus;
  categoryId: string;
  ingredients: { name: string; amount: string; sortOrder?: number }[];
  steps: { description: string; image?: string; stepNumber: number }[];
}

export interface UpdateRecipeData extends Partial<
  Omit<CreateRecipeData, "ingredients" | "steps">
> {
  ingredients?: {
    id?: string;
    name?: string;
    amount?: string;
    sortOrder?: number;
  }[];
  steps?: {
    id?: string;
    description?: string;
    image?: string;
    stepNumber?: number;
  }[];
}

export const recipeApi = {
  getHot(limit: number = 8): Promise<Recipe[]> {
    return request.get("/api/recipes/hot", { params: { limit } });
  },

  getLatest(params: SearchRecipeParams): Promise<PaginatedResponse<Recipe>> {
    return request.get("/api/recipes/latest", { params });
  },

  getById(id: string): Promise<Recipe> {
    return request.get(`/api/recipes/${id}`);
  },

  getMyRecipes(status?: RecipeStatus): Promise<Recipe[]> {
    return request.get("/api/recipes/my", { params: { status } });
  },

  getMyFavorites(): Promise<Recipe[]> {
    return request.get("/api/recipes/favorites");
  },

  getRelated(
    categoryId: string,
    recipeId: string,
    limit: number = 6,
  ): Promise<Recipe[]> {
    return request.get(`/api/recipes/${recipeId}/related`, {
      params: { categoryId, limit },
    });
  },

  create(data: CreateRecipeData): Promise<Recipe> {
    return request.post("/api/recipes", data);
  },

  update(id: string, data: UpdateRecipeData): Promise<Recipe> {
    return request.patch(`/api/recipes/${id}`, data);
  },

  delete(id: string): Promise<{ message: string }> {
    return request.delete(`/api/recipes/${id}`);
  },

  toggleLike(id: string): Promise<{ isLiked: boolean; likeCount: number }> {
    return request.post(`/api/recipes/${id}/like`);
  },

  toggleFavorite(
    id: string,
    collectionId?: string,
  ): Promise<{
    isFavorited: boolean;
    favoriteCount: number;
    collectionId?: string;
  }> {
    return request.post(`/api/recipes/${id}/favorite`, { collectionId });
  },
};
