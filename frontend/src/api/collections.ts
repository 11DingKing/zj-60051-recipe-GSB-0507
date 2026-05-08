import request from '@/utils/request';
import type { Collection, Recipe } from '@/types';

export const collectionsApi = {
  getAll(): Promise<Collection[]> {
    return request.get('/api/collections');
  },

  getById(id: string): Promise<Collection> {
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

  remove(id: string): Promise<{ message: string }> {
    return request.delete(`/api/collections/${id}`);
  },

  addRecipe(collectionId: string, recipeId: string): Promise<{ added: boolean }> {
    return request.post('/api/collections/add-recipe', { collectionId, recipeId });
  },

  removeRecipe(collectionId: string, recipeId: string): Promise<{ removed: boolean }> {
    return request.post('/api/collections/remove-recipe', { collectionId, recipeId });
  },

  getRecipeCollections(recipeId: string): Promise<Collection[]> {
    return request.get(`/api/collections/recipe/${recipeId}/collections`);
  },
};
