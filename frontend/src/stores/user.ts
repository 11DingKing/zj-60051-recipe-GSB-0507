import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import { authApi } from '@/api/auth';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  async function login(username: string, password: string) {
    const result = await authApi.login({ username, password });
    token.value = result.accessToken;
    user.value = result.user;
    localStorage.setItem('token', result.accessToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  }

  async function register(username: string, email: string, password: string) {
    return authApi.register({ username, email, password });
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function restoreUser() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      user.value = JSON.parse(savedUser);
    }
  }

  async function fetchProfile() {
    if (!token.value) return null;
    try {
      const profile = await authApi.getProfile();
      user.value = profile;
      localStorage.setItem('user', JSON.stringify(profile));
      return profile;
    } catch {
      logout();
      return null;
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    restoreUser,
    fetchProfile,
  };
});
