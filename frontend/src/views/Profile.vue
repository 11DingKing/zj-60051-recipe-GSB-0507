<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="user-info">
        <el-avatar :size="100" :src="userStore.user?.avatar">
          <el-icon size="60"><UserFilled /></el-icon>
        </el-avatar>
        <div class="user-detail">
          <h1 class="nickname">{{ userStore.user?.nickname }}</h1>
          <p class="username">@{{ userStore.user?.username }}</p>
          <p class="email">{{ userStore.user?.email }}</p>
          <p class="join-date">注册于 {{ formatDate(userStore.user?.createdAt) }}</p>
          <el-tag v-if="userStore.isAdmin" type="danger" effect="dark">管理员</el-tag>
        </div>
      </div>
      <div class="user-stats">
        <div class="stat-card">
          <div class="stat-value">{{ myRecipes.length }}</div>
          <div class="stat-label">发布菜谱</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ myFavorites.length }}</div>
          <div class="stat-label">收藏菜谱</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ myComments.length }}</div>
          <div class="stat-label">发表评论</div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="我发布的菜谱" name="recipes">
          <div class="recipes-section">
            <div class="section-actions">
              <el-button type="primary" @click="goToCreate">
                <el-icon><Plus /></el-icon>
                发布新菜谱
              </el-button>
            </div>
            <div v-if="myRecipes.length === 0" class="empty-state">
              <el-empty description="你还没有发布任何菜谱，快来分享你的第一道菜谱吧！" />
            </div>
            <div v-else class="recipes-grid">
              <div
                v-for="recipe in myRecipes"
                :key="recipe.id"
                class="recipe-card"
                @click="goToDetail(recipe.id)"
              >
                <div class="recipe-cover">
                  <img :src="recipe.coverImage || 'https://picsum.photos/400/300'" :alt="recipe.title" />
                  <el-tag
                    v-if="recipe.status === 'DRAFT'"
                    class="status-tag"
                    type="info"
                    effect="dark"
                  >
                    草稿
                  </el-tag>
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
                  <div class="recipe-stats">
                    <span class="stat">
                      <el-icon><View /></el-icon>
                      {{ recipe.viewCount }}
                    </span>
                    <span class="stat">
                      <el-icon><Star /></el-icon>
                      {{ recipe.likeCount }}
                    </span>
                    <span class="stat">
                      <el-icon><Collection /></el-icon>
                      {{ recipe.favoriteCount }}
                    </span>
                  </div>
                </div>
                <div class="recipe-actions">
                  <el-button type="primary" size="small" link @click.stop="editRecipe(recipe.id)">
                    编辑
                  </el-button>
                  <el-button type="danger" size="small" link @click.stop="deleteRecipe(recipe)">
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的收藏" name="favorites">
          <div class="recipes-section">
            <div v-if="myFavorites.length === 0" class="empty-state">
              <el-empty description="你还没有收藏任何菜谱，快去发现美食吧！" />
            </div>
            <div v-else class="recipes-grid">
              <div
                v-for="recipe in myFavorites"
                :key="recipe.id"
                class="recipe-card"
                @click="goToDetail(recipe.id)"
              >
                <div class="recipe-cover">
                  <img :src="recipe.coverImage || 'https://picsum.photos/400/300'" :alt="recipe.title" />
                </div>
                <div class="recipe-info">
                  <h3 class="recipe-title">{{ recipe.title }}</h3>
                  <div class="recipe-author">
                    <el-avatar :size="20" :src="recipe.author.avatar">
                      <el-icon size="14"><UserFilled /></el-icon>
                    </el-avatar>
                    <span>{{ recipe.author.nickname }}</span>
                  </div>
                  <div class="recipe-meta">
                    <span class="difficulty" :class="recipe.difficulty.toLowerCase()">
                      {{ getDifficultyText(recipe.difficulty) }}
                    </span>
                    <span class="cook-time">
                      <el-icon><Timer /></el-icon>
                      {{ recipe.cookTime }}分钟
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的评论" name="comments">
          <div class="comments-section">
            <div v-if="myComments.length === 0" class="empty-state">
              <el-empty description="你还没有发表任何评论" />
            </div>
            <div v-else class="comments-list">
              <div v-for="comment in myComments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <router-link :to="`/recipe/${comment.recipeId}`" class="recipe-link">
                    <el-icon><Document /></el-icon>
                    查看相关菜谱
                  </router-link>
                  <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="comment-content">{{ comment.content }}</p>
                <div v-if="comment.replies && comment.replies.length > 0" class="replies">
                  <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                    <el-avatar :size="24" :src="reply.user.avatar">
                      <el-icon size="18"><UserFilled /></el-icon>
                    </el-avatar>
                    <div class="reply-content">
                      <span class="reply-author">{{ reply.user.nickname }}</span>
                      <span class="reply-text">{{ reply.content }}</span>
                      <span class="reply-time">{{ formatDate(reply.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除菜谱「{{ recipeToDelete?.title }}」吗？此操作无法撤销。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { recipeApi } from '@/api/recipe';
import { commentApi } from '@/api/comment';
import type { Recipe, Comment, Difficulty } from '@/types';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('recipes');
const myRecipes = ref<Recipe[]>([]);
const myFavorites = ref<Recipe[]>([]);
const myComments = ref<Comment[]>([]);
const loading = ref(false);

const deleteDialogVisible = ref(false);
const recipeToDelete = ref<Recipe | null>(null);
const deleting = ref(false);

const getDifficultyText = (difficulty: Difficulty) => {
  const map: Record<Difficulty, string> = {
    EASY: '简单',
    MEDIUM: '中等',
    HARD: '困难',
  };
  return map[difficulty];
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const goToDetail = (id: string) => {
  router.push(`/recipe/${id}`);
};

const goToCreate = () => {
  router.push('/recipe/create');
};

const editRecipe = (id: string) => {
  router.push(`/recipe/edit/${id}`);
};

const deleteRecipe = (recipe: Recipe) => {
  recipeToDelete.value = recipe;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  if (!recipeToDelete.value) return;

  deleting.value = true;
  try {
    await recipeApi.delete(recipeToDelete.value.id);
    myRecipes.value = myRecipes.value.filter(r => r.id !== recipeToDelete.value!.id);
    ElMessage.success('菜谱已删除');
    deleteDialogVisible.value = false;
  } catch (error) {
    ElMessage.error('删除失败');
  } finally {
    deleting.value = false;
  }
};

const fetchMyRecipes = async () => {
  try {
    myRecipes.value = await recipeApi.getMyRecipes();
  } catch (error) {
    ElMessage.error('获取我的菜谱失败');
  }
};

const fetchMyFavorites = async () => {
  try {
    myFavorites.value = await recipeApi.getMyFavorites();
  } catch (error) {
    ElMessage.error('获取我的收藏失败');
  }
};

const fetchMyComments = async () => {
  try {
    myComments.value = await commentApi.getMyComments();
  } catch (error) {
    ElMessage.error('获取我的评论失败');
  }
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    fetchMyRecipes(),
    fetchMyFavorites(),
    fetchMyComments(),
  ]);
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.profile-header {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.user-info {
  display: flex;
  gap: 24px;
}

.user-detail {
  .nickname {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #333;
  }

  .username {
    font-size: 14px;
    color: #999;
    margin: 0 0 8px 0;
  }

  .email {
    font-size: 14px;
    color: #666;
    margin: 0 0 8px 0;
  }

  .join-date {
    font-size: 13px;
    color: #999;
    margin: 0 0 12px 0;
  }
}

.user-stats {
  display: flex;
  gap: 32px;
}

.stat-card {
  text-align: center;
  padding: 16px 32px;
  background: linear-gradient(135deg, #ff6b6b, #ffa502);
  border-radius: 12px;
  color: white;

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

.profile-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.profile-tabs {
  :deep(.el-tabs__header) {
    padding: 0 24px;
    margin: 0;
  }

  :deep(.el-tabs__content) {
    padding: 24px;
  }
}

.recipes-section {
  .section-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;
  }

  .empty-state {
    padding: 48px 0;
  }

  .recipes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 24px;
  }
}

.recipe-card {
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .recipe-cover {
    position: relative;
    height: 160px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .status-tag {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  }

  .recipe-info {
    padding: 16px;

    .recipe-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .recipe-author {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }

    .recipe-meta {
      display: flex;
      gap: 12px;
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

      .cook-time {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .recipe-stats {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e9ecef;
      font-size: 12px;
      color: #999;

      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .recipe-actions {
    display: flex;
    justify-content: flex-end;
    padding: 0 16px 12px;
  }
}

.comments-section {
  .empty-state {
    padding: 48px 0;
  }

  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .comment-item {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .recipe-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ff6b6b;
      text-decoration: none;
      font-size: 13px;

      &:hover {
        text-decoration: underline;
      }
    }

    .comment-time {
      font-size: 12px;
      color: #999;
    }
  }

  .comment-content {
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    margin: 0;
  }

  .replies {
    margin-top: 16px;
    padding-left: 20px;
    border-left: 2px solid #e9ecef;
  }

  .reply-item {
    display: flex;
    gap: 10px;
    padding: 10px 0;
  }

  .reply-content {
    flex: 1;
    font-size: 13px;

    .reply-author {
      font-weight: 600;
      color: #ff6b6b;
      margin-right: 8px;
    }

    .reply-text {
      color: #333;
    }

    .reply-time {
      margin-left: 8px;
      color: #999;
      font-size: 12px;
    }
  }
}
</style>
