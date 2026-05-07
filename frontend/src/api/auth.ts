import request from '@/utils/request';
import type { User, LoginResponse } from '@/types';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const authApi = {
  login(data: LoginData): Promise<LoginResponse> {
    return request.post('/api/auth/login', data);
  },

  register(data: RegisterData): Promise<{ message: string; user: User }> {
    return request.post('/api/auth/register', data);
  },

  getProfile(): Promise<User> {
    return request.get('/api/auth/profile');
  },
};
