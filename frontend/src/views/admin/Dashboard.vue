<template>
  <div class="dashboard-page">
    <div class="stats-cards">
      <el-row :gutter="24">
        <el-col :span="6">
          <div class="stat-card users">
            <div class="stat-icon">
              <el-icon size="32"><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboardStats.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card recipes">
            <div class="stat-icon">
              <el-icon size="32"><CookingPot /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboardStats.totalRecipes }}</div>
              <div class="stat-label">总菜谱数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card comments">
            <div class="stat-icon">
              <el-icon size="32"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboardStats.totalComments }}</div>
              <div class="stat-label">总评论数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card categories">
            <div class="stat-icon">
              <el-icon size="32"><Menu /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ dashboardStats.totalCategories }}</div>
              <div class="stat-label">菜系分类</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="24" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">各菜系菜谱数量</span>
          </template>
          <div ref="categoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">热门菜谱 Top10</span>
          </template>
          <div class="top-recipes-list">
            <div
              v-for="(recipe, index) in topRecipes"
              :key="recipe.id"
              class="top-recipe-item"
            >
              <span class="rank" :class="`rank-${index + 1}`">
                {{ index + 1 }}
              </span>
              <img
                :src="recipe.coverImage || 'https://picsum.photos/60/60'"
                :alt="recipe.title"
                class="recipe-cover"
              />
              <div class="recipe-info">
                <span class="recipe-title">{{ recipe.title }}</span>
                <span class="recipe-stats">
                  <el-icon><Star /></el-icon>
                  {{ recipe.likeCount }}赞
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">近30天新增菜谱趋势</span>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">用户活跃度（近7天）</span>
          </template>
          <div ref="activityChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import { adminApi, type DashboardStats, type CategoryRecipeCount, type DailyRecipeCount, type UserActivity } from '@/api/admin';
import type { Recipe } from '@/types';

const categoryChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();
const activityChartRef = ref<HTMLElement>();

let categoryChart: echarts.ECharts | null = null;
let trendChart: echarts.ECharts | null = null;
let activityChart: echarts.ECharts | null = null;

const dashboardStats = ref<DashboardStats>({
  totalUsers: 0,
  totalRecipes: 0,
  totalComments: 0,
  totalCategories: 0,
  recentRecipes: [],
});

const categoryData = ref<CategoryRecipeCount[]>([]);
const trendData = ref<DailyRecipeCount[]>([]);
const topRecipes = ref<Recipe[]>([]);
const activityData = ref<UserActivity[]>([]);

const fetchData = async () => {
  try {
    const [stats, categoryStats, trendStats, topRecipesList, activityStats] = await Promise.all([
      adminApi.getDashboardStats(),
      adminApi.getRecipesByCategory(),
      adminApi.getRecipesLast30Days(),
      adminApi.getTopRecipes(10),
      adminApi.getUserActivityLast7Days(),
    ]);

    dashboardStats.value = stats;
    categoryData.value = categoryStats;
    trendData.value = trendStats;
    topRecipes.value = topRecipesList;
    activityData.value = activityStats;
  } catch (error) {
    ElMessage.error('获取数据失败');
  }
};

const initCategoryChart = () => {
  if (!categoryChartRef.value) return;

  categoryChart = echarts.init(categoryChartRef.value);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categoryData.value.map(item => item.name),
      axisLabel: {
        interval: 0,
        rotate: 25,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '菜谱数量',
        type: 'bar',
        data: categoryData.value.map(item => item.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ff6b6b' },
            { offset: 1, color: '#ffa502' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
      },
    ],
  };

  categoryChart.setOption(option);
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;

  trendChart = echarts.init(trendChartRef.value);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.map(item => item.date.slice(5)),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '新增菜谱',
        type: 'line',
        smooth: true,
        data: trendData.value.map(item => item.count),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
            { offset: 1, color: 'rgba(255, 107, 107, 0.01)' },
          ]),
        },
        lineStyle: {
          color: '#ff6b6b',
          width: 3,
        },
        itemStyle: {
          color: '#ff6b6b',
        },
      },
    ],
  };

  trendChart.setOption(option);
};

const initActivityChart = () => {
  if (!activityChartRef.value) return;

  activityChart = echarts.init(activityChartRef.value);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['发布菜谱', '发表评论', '收藏'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: activityData.value.map(item => item.date.slice(5)),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '发布菜谱',
        type: 'line',
        smooth: true,
        data: activityData.value.map(item => item.recipes),
        lineStyle: {
          color: '#ff6b6b',
        },
        itemStyle: {
          color: '#ff6b6b',
        },
      },
      {
        name: '发表评论',
        type: 'line',
        smooth: true,
        data: activityData.value.map(item => item.comments),
        lineStyle: {
          color: '#409eff',
        },
        itemStyle: {
          color: '#409eff',
        },
      },
      {
        name: '收藏',
        type: 'line',
        smooth: true,
        data: activityData.value.map(item => item.favorites),
        lineStyle: {
          color: '#67c23a',
        },
        itemStyle: {
          color: '#67c23a',
        },
      },
    ],
  };

  activityChart.setOption(option);
};

const handleResize = () => {
  categoryChart?.resize();
  trendChart?.resize();
  activityChart?.resize();
};

onMounted(async () => {
  await fetchData();
  initCategoryChart();
  initTrendChart();
  initActivityChart();

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  categoryChart?.dispose();
  trendChart?.dispose();
  activityChart?.dispose();
});
</script>

<style lang="scss" scoped>
.dashboard-page {
  .stats-cards {
    margin-bottom: 24px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;
    border-radius: 12px;
    color: white;

    &.users {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.recipes {
      background: linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%);
    }

    &.comments {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    &.categories {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-content {
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }

  .chart-row {
    margin-bottom: 24px;
  }

  .chart-card {
    .card-title {
      font-weight: 600;
      color: #333;
    }

    .chart-container {
      height: 350px;
    }
  }

  .top-recipes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .top-recipe-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    background: #f8f9fa;
    transition: background 0.2s;

    &:hover {
      background: #e9ecef;
    }

    .rank {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      border-radius: 4px;
      color: white;

      &.rank-1 {
        background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
      }

      &.rank-2 {
        background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
      }

      &.rank-3 {
        background: linear-gradient(135deg, #cd7f32 0%, #a0522d 100%);
      }

      &:not(.rank-1):not(.rank-2):not(.rank-3) {
        background: #999;
      }
    }

    .recipe-cover {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 6px;
    }

    .recipe-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .recipe-title {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .recipe-stats {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>
