import request from '@/utils/request';
import type { Comment, PaginatedResponse } from '@/types';

export interface CreateCommentData {
  content: string;
  recipeId: string;
  parentId?: string;
}

export const commentApi = {
  getByRecipe(recipeId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Comment>> {
    return request.get(`/api/comments/recipe/${recipeId}`, { params: { page, limit } });
  },

  getMyComments(): Promise<Comment[]> {
    return request.get('/api/comments/my');
  },

  create(data: CreateCommentData): Promise<Comment> {
    return request.post('/api/comments', data);
  },

  report(id: string): Promise<Comment> {
    return request.post(`/api/comments/${id}/report`);
  },

  delete(id: string): Promise<{ message: string }> {
    return request.delete(`/api/comments/${id}`);
  },

  getReported(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Comment>> {
    return request.get('/api/comments/reported', { params: { page, limit } });
  },

  handleReport(id: string, action: 'hide' | 'dismiss'): Promise<Comment> {
    return request.patch(`/api/comments/${id}/handle-report`, null, { params: { action } });
  },
};
