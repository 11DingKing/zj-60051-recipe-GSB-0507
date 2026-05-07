import request from '@/utils/request';
import type { Category } from '@/types';

export const categoryApi = {
  getAll(): Promise<Category[]> {
    return request.get('/api/categories');
  },

  getById(id: string): Promise<Category> {
    return request.get(`/api/categories/${id}`);
  },

  create(data: { name: string; icon?: string; sortOrder?: number }): Promise<Category> {
    return request.post('/api/categories', data);
  },

  update(id: string, data: { name?: string; icon?: string; sortOrder?: number }): Promise<Category> {
    return request.patch(`/api/categories/${id}`, data);
  },

  delete(id: string): Promise<{ message: string }> {
    return request.delete(`/api/categories/${id}`);
  },
};
