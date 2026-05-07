<template>
  <div class="search-page">
    <div class="search-container">
      <div class="search-header">
        <h2>搜索菜谱</h2>
        <div class="search-input-wrapper">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索菜谱名称或食材..."
            size="large"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
      </div>

      <div class="filter-section">
        <h3>筛选条件</h3>
        <div class="filter-row">
          <div class="filter-item">
            <span class="filter-label">菜系分类：</span>
            <el-select
              v-model="searchForm.categoryId"
              placeholder="全部菜系"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="cat in categoryStore.categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">难度：</span>
            <el-select
              v-model="searchForm.difficulty"
              placeholder="全部难度"
              clearable
              @change="handleSearch"
            >
              <el-option label="简单" value="EASY" />
              <el-option label="中等" value="MEDIUM" />
              <el-option label="困难" value="HARD" />
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">烹饪时间：</span>
            <el-select
              v-model="cookTimeRange"
              placeholder="全部时间"
              clearable
              @change="handleCookTimeChange"
            >
              <el-option label="30分钟以内" value="0-30" />
              <el-option label="30-60分钟" value="30-60" />
              <el-option label="60分钟以上" value="60-" />
            </el-select>
          </div>
        </div>
        <el-button type="primary" @click="resetFilters" :icon="Refresh">
          重置筛选
        </el-button>
      </div>

      <div class="results-section">
        <div class="results-header">
          <span v-if="total > 0">共找到 {{ total }} 个菜谱</span>
          <span v-else>暂无匹配的菜谱</span>
        </div>
        <div class="recipes-grid" v-loading="loading">
          <div
            v-for="recipe in recipes"
            :key="recipe.id"
            class="recipe-card"
            @click="goToDetail(recipe.id)"
          >
            <div class="recipe-cover">
              <img :src="recipe.coverImage || 'https://picsum.photos/400/300'" :alt="recipe.title" />
              <el-tag :type="getDifficultyType(recipe.difficulty)" size="small" class="difficulty-tag">
                {{ getDifficultyText(recipe.difficulty) }}
              </el-tag>
            </div>
            <div class="recipe-info">
              <h3 class="recipe-title">{{ recipe.title }}</h3>
              <div class="recipe-meta">
                <span><el-icon><Timer /></el-icon> {{ recipe.cookTime }}分钟</span>
                <span><el-icon><User /></el-icon> {{ recipe.servings }}人份</span>
                <el-tag size="small" type="warning">{{ recipe.category.name }}</el-tag>
              </div>
              <div class="recipe-stats">
                <span><el-icon><View /></el-icon> {{ recipe.viewCount }}</span>
                <span><el-icon><Star /></el-icon> {{ recipe.likeCount }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="pagination-container" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="12"
            :total="total"
            layout="prev, pager, next, jumper"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCategoryStore } from '@/stores/category';
import { recipeApi } from '@/api/recipe';
import type { Recipe, Difficulty, SearchRecipeParams } from '@/types';

const router = useRouter();
const route = useRoute();
const categoryStore = useCategoryStore();

const loading = ref(false);
const recipes = ref<Recipe[]>([]);
const total = ref(0);
const currentPage = ref(1);
const cookTimeRange = ref<string>('');

const searchForm = reactive<SearchRecipeParams>({
  keyword: '',
  categoryId: '',
  difficulty: undefined,
  minCookTime: undefined,
  maxCookTime: undefined,
  page: 1,
  limit: 12,
});

const getDifficultyText = (difficulty: Difficulty) => {
  const map: Record<Difficulty, string> = {
    EASY: '简单',
    MEDIUM: '中等',
    HARD: '困难',
  };
  return map[difficulty];
};

const getDifficultyType = (difficulty: Difficulty) => {
  const map: Record<Difficulty, string> = {
    EASY: 'success',
    MEDIUM: 'warning',
    HARD: 'danger',
  };
  return map[difficulty];
};

const goToDetail = (id: string) => {
  router.push(`/recipe/${id}`);
};

const fetchRecipes = async () => {
  loading.value = true;
  try {
    const result = await recipeApi.getLatest({
      ...searchForm,
      page: currentPage.value,
    });
    recipes.value = result.data;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchRecipes();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchRecipes();
};

const handleCookTimeChange = (val: string) => {
  if (val === '0-30') {
    searchForm.minCookTime = 0;
    searchForm.maxCookTime = 30;
  } else if (val === '30-60') {
    searchForm.minCookTime = 30;
    searchForm.maxCookTime = 60;
  } else if (val === '60-') {
    searchForm.minCookTime = 60;
    searchForm.maxCookTime = undefined;
  } else {
    searchForm.minCookTime = undefined;
    searchForm.maxCookTime = undefined;
  }
  handleSearch();
};

const resetFilters = () => {
  searchForm.keyword = '';
  searchForm.categoryId = '';
  searchForm.difficulty = undefined;
  searchForm.minCookTime = undefined;
  searchForm.maxCookTime = undefined;
  cookTimeRange.value = '';
  currentPage.value = 1;
  fetchRecipes();
};

onMounted(async () => {
  await categoryStore.fetchCategories();
  const keyword = route.query.keyword as string;
  const categoryId = route.query.categoryId as string;
  if (keyword) {
    searchForm.keyword = keyword;
  }
  if (categoryId) {
    searchForm.categoryId = categoryId;
  }
  fetchRecipes();
});
</script>

<style lang="scss" scoped>
.search-page {
  padding: 24px;
  min-height: 100vh;
}

.search-container {
  max-width: 1400px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .search-input-wrapper {
    max-width: 600px;
  }
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .filter-label {
      color: #666;
      font-size: 14px;
    }
  }
}

.results-section {
  .results-header {
    margin-bottom: 16px;
    font-size: 14px;
    color: #666;
  }
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.recipe-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .recipe-cover {
    position: relative;
    height: 180px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .difficulty-tag {
      position: absolute;
      top: 12px;
      left: 12px;
    }
  }

  .recipe-info {
    padding: 16px;

    .recipe-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .recipe-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #666;
      margin-bottom: 12px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .recipe-stats {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #999;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
