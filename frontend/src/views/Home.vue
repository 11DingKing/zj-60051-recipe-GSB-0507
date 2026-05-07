<template>
  <div class="home-page">
    <div class="banner-section">
      <div class="banner-content">
        <h1>发现美食的无限可能</h1>
        <p>分享你的菜谱，探索世界各地的美食文化</p>
        <el-button type="primary" size="large" @click="goToSearch">
          开始探索
          <el-icon class="ml-1"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="category-nav">
      <div class="category-container">
        <router-link
          v-for="category in categoryStore.categories"
          :key="category.id"
          :to="`/search?categoryId=${category.id}`"
          class="category-item"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
          <span class="category-count">{{ category.recipeCount }}道菜谱</span>
        </router-link>
      </div>
    </div>

    <div class="section-container">
      <div class="section-header">
        <h2>
          <el-icon><Star /></el-icon>
          热门推荐
        </h2>
        <router-link to="/search" class="more-link">
          查看更多
          <el-icon><ArrowRight /></el-icon>
        </router-link>
      </div>
      <div class="recipes-grid" v-loading="hotLoading">
        <div
          v-for="recipe in hotRecipes"
          :key="recipe.id"
          class="recipe-card"
          @click="goToDetail(recipe.id)"
        >
          <div class="recipe-cover">
            <img :src="recipe.coverImage || 'https://picsum.photos/400/300'" :alt="recipe.title" />
            <div class="recipe-stats">
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ recipe.viewCount }}
              </span>
              <span class="stat-item">
                <el-icon><Star /></el-icon>
                {{ recipe.likeCount }}
              </span>
            </div>
          </div>
          <div class="recipe-info">
            <h3 class="recipe-title">{{ recipe.title }}</h3>
            <div class="recipe-meta">
              <span class="difficulty" :class="recipe.difficulty.toLowerCase()">
                {{ getDifficultyText(recipe.difficulty) }}
              </span>
              <span class="cook-time">
                <el-icon><Timer /></el-icon>
                {{ recipe.cookTime }}分钟
              </span>
              <span class="servings">
                <el-icon><User /></el-icon>
                {{ recipe.servings }}人份
              </span>
            </div>
            <div class="recipe-author">
              <el-avatar :size="24" :src="recipe.author.avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span>{{ recipe.author.nickname }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-container">
      <div class="section-header">
        <h2>
          <el-icon><Clock /></el-icon>
          最新发布
        </h2>
      </div>
      <div class="recipes-grid" v-loading="latestLoading">
        <div
          v-for="recipe in latestRecipes"
          :key="recipe.id"
          class="recipe-card"
          @click="goToDetail(recipe.id)"
        >
          <div class="recipe-cover">
            <img :src="recipe.coverImage || 'https://picsum.photos/400/300'" :alt="recipe.title" />
          </div>
          <div class="recipe-info">
            <h3 class="recipe-title">{{ recipe.title }}</h3>
            <div class="recipe-meta">
              <span class="difficulty" :class="recipe.difficulty.toLowerCase()">
                {{ getDifficultyText(recipe.difficulty) }}
              </span>
              <span class="cook-time">
                <el-icon><Timer /></el-icon>
                {{ recipe.cookTime }}分钟
              </span>
            </div>
            <div class="recipe-category">
              <el-tag size="small" type="warning">{{ recipe.category.name }}</el-tag>
            </div>
          </div>
        </div>
      </div>
      <div class="pagination-container" v-if="totalPages > 1">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="8"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchLatestRecipes"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCategoryStore } from '@/stores/category';
import { recipeApi } from '@/api/recipe';
import type { Recipe, Difficulty } from '@/types';

const router = useRouter();
const categoryStore = useCategoryStore();

const hotRecipes = ref<Recipe[]>([]);
const latestRecipes = ref<Recipe[]>([]);
const hotLoading = ref(false);
const latestLoading = ref(false);
const currentPage = ref(1);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / 8));

const getDifficultyText = (difficulty: Difficulty) => {
  const map: Record<Difficulty, string> = {
    EASY: '简单',
    MEDIUM: '中等',
    HARD: '困难',
  };
  return map[difficulty];
};

const goToDetail = (id: string) => {
  router.push(`/recipe/${id}`);
};

const goToSearch = () => {
  router.push('/search');
};

const fetchHotRecipes = async () => {
  hotLoading.value = true;
  try {
    hotRecipes.value = await recipeApi.getHot(8);
  } finally {
    hotLoading.value = false;
  }
};

const fetchLatestRecipes = async () => {
  latestLoading.value = true;
  try {
    const result = await recipeApi.getLatest({
      page: currentPage.value,
      limit: 8,
    });
    latestRecipes.value = result.data;
    total.value = result.total;
  } finally {
    latestLoading.value = false;
  }
};

onMounted(async () => {
  await categoryStore.fetchCategories();
  fetchHotRecipes();
  fetchLatestRecipes();
});
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
}

.banner-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 24px;
  text-align: center;
  color: white;

  .banner-content {
    max-width: 800px;
    margin: 0 auto;

    h1 {
      font-size: 48px;
      margin-bottom: 16px;
      font-weight: 700;
    }

    p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 32px;
    }
  }
}

.category-nav {
  background: white;
  padding: 24px 0;
  border-bottom: 1px solid #eee;

  .category-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    gap: 32px;
    flex-wrap: wrap;
  }

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    color: #333;
    padding: 12px 24px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: #f5f5f5;
      transform: translateY(-2px);
    }

    .category-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .category-name {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .category-count {
      font-size: 12px;
      color: #999;
    }
  }
}

.section-container {
  max-width: 1400px;
  margin: 48px auto;
  padding: 0 24px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      font-size: 24px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: #ff6b6b;
      }
    }

    .more-link {
      color: #ff6b6b;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;

      &:hover {
        text-decoration: underline;
      }
    }
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

    .recipe-stats {
      position: absolute;
      bottom: 8px;
      right: 8px;
      display: flex;
      gap: 12px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
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
      gap: 12px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #666;

      .difficulty {
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 500;

        &.easy {
          background: #e6f7e6;
          color: #52c41a;
        }

        &.medium {
          background: #fff7e6;
          color: #fa8c16;
        }

        &.hard {
          background: #fff1f0;
          color: #f5222d;
        }
      }

      .cook-time,
      .servings {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .recipe-author {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666;
    }

    .recipe-category {
      margin-top: 8px;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
