import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Category } from '@/types';
import { categoryApi } from '@/api/category';

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([]);
  const loading = ref(false);

  async function fetchCategories() {
    if (categories.value.length > 0) return;
    loading.value = true;
    try {
      categories.value = await categoryApi.getAll();
    } finally {
      loading.value = false;
    }
  }

  async function refreshCategories() {
    loading.value = true;
    try {
      categories.value = await categoryApi.getAll();
    } finally {
      loading.value = false;
    }
  }

  return {
    categories,
    loading,
    fetchCategories,
    refreshCategories,
  };
});
