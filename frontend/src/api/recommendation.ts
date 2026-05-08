import request from '@/utils/request';
import type { Recipe } from '@/types';

export const recommendationApi = {
  getRecommendations(userId: string): Promise<Recipe[]> {
    return request.get(`/api/recommendations/${userId}`);
  },
};
