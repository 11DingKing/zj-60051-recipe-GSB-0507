import request from '@/utils/request';
import type { Recipe } from '@/types';

export const recommendationApi = {
  getForYou(excludeRecipeId?: string): Promise<Recipe[]> {
    return request.get('/api/recommendations/for-you', {
      params: { excludeRecipeId },
    });
  },
};
