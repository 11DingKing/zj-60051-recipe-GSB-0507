import request from '@/utils/request';
import type { Collection, Recipe } from '@/types';

export const collectionApi = {
  getAll(): Promise<Collection[]> {
    return request.get('/api/collections');
  },

  getOne(id: string): Promise<Collection> {
    return request.get(`/api/collections/${id}`);
  },

  getRecipes(id: string): Promise<Recipe[]> {
    return request.get(`/api/collections/${id}/recipes`);
  },

  create(name: string): Promise<Collection> {
    return request.post('/api/collections', { name });
  },

  update(id: string, name: string): Promise<Collection> {
    return request.patch(`/api/collections/${id}`, { name });
  },

  delete(id: string): Promise<{ message: string }> {
    return request.delete(`/api/collections/${id}`);
  },

  addRecipe(recipeId: string, collectionId: string): Promise<{ isFavorited: boolean; collectionId: string }> {
    return request.post(`/api/collections/recipes/${recipeId}`, { collectionId });
  },

  removeRecipe(recipeId: string, collectionId: string): Promise<{ isFavorited: boolean; collectionId: string }> {
    return request.delete(`/api/collections/recipes/${recipeId}/${collectionId}`);
  },
};
