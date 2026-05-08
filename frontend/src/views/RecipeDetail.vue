<template>
  <div class="recipe-detail-page" v-loading="loading">
    <div class="breadcrumb-nav">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>
          <router-link to="/">首页</router-link>
        </el-breadcrumb-item>
        <el-breadcrumb-item>
          <router-link :to="`/search?categoryId=${recipe?.categoryId}`">
            {{ recipe?.category?.name }}
          </router-link>
        </el-breadcrumb-item>
        <el-breadcrumb-item>{{ recipe?.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="recipe-header" v-if="recipe">
      <div class="recipe-cover">
        <img
          :src="recipe.coverImage || 'https://picsum.photos/600/400'"
          :alt="recipe.title"
        />
      </div>
      <div class="recipe-info">
        <h1 class="recipe-title">{{ recipe.title }}</h1>
        <div class="recipe-author">
          <el-avatar :size="40" :src="recipe.author.avatar">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <span class="author-name">{{ recipe.author.nickname }}</span>
          <span class="publish-time"
            >发布于 {{ formatDate(recipe.createdAt) }}</span
          >
        </div>
        <div class="recipe-stats">
          <div class="stat-item">
            <el-icon><View /></el-icon>
            <span>{{ recipe.viewCount }} 浏览</span>
          </div>
          <div class="stat-item">
            <el-icon><Star /></el-icon>
            <span>{{ recipe.likeCount }} 点赞</span>
          </div>
          <div class="stat-item">
            <el-icon><Collection /></el-icon>
            <span>{{ recipe.favoriteCount }} 收藏</span>
          </div>
          <div class="stat-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ recipe.commentCount }} 评论</span>
          </div>
        </div>
        <div class="recipe-meta">
          <div class="meta-item">
            <span class="meta-label">难度</span>
            <span class="difficulty" :class="recipe.difficulty.toLowerCase()">
              {{ getDifficultyText(recipe.difficulty) }}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">烹饪时间</span>
            <span class="meta-value">
              <el-icon><Timer /></el-icon>
              {{ recipe.cookTime }} 分钟
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">份量</span>
            <span class="meta-value">
              <el-icon><User /></el-icon>
              {{ recipe.servings }} 人份
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">菜系</span>
            <el-tag type="warning">{{ recipe.category.name }}</el-tag>
          </div>
        </div>
        <div class="action-buttons">
          <el-button
            :type="recipe.isLiked ? 'primary' : 'default'"
            :icon="recipe.isLiked ? 'StarFilled' : 'Star'"
            @click="handleLike"
          >
            {{ recipe.isLiked ? "已点赞" : "点赞" }}
            <span class="count">({{ recipe.likeCount }})</span>
          </el-button>
          <el-button
            :type="recipe.isFavorited ? 'danger' : 'default'"
            :icon="recipe.isFavorited ? 'CollectionFilled' : 'Collection'"
            @click="handleFavorite"
          >
            {{ recipe.isFavorited ? "已收藏" : "收藏" }}
            <span class="count">({{ recipe.favoriteCount }})</span>
          </el-button>
          <el-button type="success" icon="Share" @click="handleShare"
            >分享</el-button
          >
        </div>
      </div>
    </div>

    <div class="recipe-content" v-if="recipe">
      <div class="main-content">
        <div class="section ingredients-section">
          <h3 class="section-title">
            <el-icon><ShoppingCart /></el-icon>
            食材清单
          </h3>
          <div class="ingredients-list">
            <div
              v-for="(ingredient, index) in recipe.ingredients"
              :key="ingredient.id"
              class="ingredient-item"
            >
              <span class="ingredient-name">{{ ingredient.name }}</span>
              <span class="ingredient-amount">{{ ingredient.amount }}</span>
            </div>
          </div>
        </div>

        <div class="section steps-section">
          <h3 class="section-title">
            <el-icon><List /></el-icon>
            烹饪步骤
          </h3>
          <div class="steps-list">
            <div
              v-for="(step, index) in recipe.steps"
              :key="step.id"
              class="step-item"
            >
              <div class="step-number">
                <span>{{ step.stepNumber }}</span>
              </div>
              <div class="step-content">
                <p class="step-description">{{ step.description }}</p>
                <img
                  v-if="step.image"
                  :src="step.image"
                  :alt="`步骤${step.stepNumber}`"
                  class="step-image"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="section comments-section">
          <h3 class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            评论 ({{ commentsTotal }})
          </h3>

          <div class="comment-form" v-if="userStore.isLoggedIn">
            <el-avatar :size="36" :src="userStore.user?.avatar">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <div class="form-content">
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="3"
                placeholder="发表你的评论..."
              />
              <div class="form-actions">
                <el-button
                  type="primary"
                  @click="submitComment"
                  :loading="submitting"
                >
                  发表评论
                </el-button>
              </div>
            </div>
          </div>

          <div class="comments-list" v-loading="commentsLoading">
            <div v-if="comments.length === 0" class="no-comments">
              <el-empty description="暂无评论，快来发表第一条评论吧！" />
            </div>
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-item"
            >
              <el-avatar :size="36" :src="comment.user.avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{
                    comment.user.nickname
                  }}</span>
                  <span class="comment-time">{{
                    formatDate(comment.createdAt)
                  }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                <div class="comment-actions">
                  <el-button
                    link
                    type="primary"
                    size="small"
                    @click="replyTo(comment)"
                  >
                    回复
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="reportComment(comment.id)"
                  >
                    举报
                  </el-button>
                </div>

                <div
                  v-if="comment.replies && comment.replies.length > 0"
                  class="replies"
                >
                  <div
                    v-for="reply in comment.replies"
                    :key="reply.id"
                    class="reply-item"
                  >
                    <el-avatar :size="24" :src="reply.user.avatar">
                      <el-icon><UserFilled /></el-icon>
                    </el-avatar>
                    <div class="reply-content">
                      <span class="reply-author">{{
                        reply.user.nickname
                      }}</span>
                      <span class="reply-text">{{ reply.content }}</span>
                      <span class="reply-time">{{
                        formatDate(reply.createdAt)
                      }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="replyingTo === comment.id" class="reply-form">
                  <el-input
                    v-model="replyContent"
                    placeholder="回复评论..."
                    size="small"
                  />
                  <div class="reply-actions">
                    <el-button size="small" @click="cancelReply"
                      >取消</el-button
                    >
                    <el-button
                      size="small"
                      type="primary"
                      @click="submitReply"
                      :loading="submitting"
                    >
                      发送
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-container" v-if="totalCommentPages > 1">
            <el-pagination
              v-model:current-page="commentPage"
              :page-size="10"
              :total="commentsTotal"
              layout="prev, pager, next"
              @current-change="fetchComments"
            />
          </div>
        </div>
      </div>

      <div class="sidebar">
        <div class="sidebar-section">
          <h4 class="sidebar-title">猜你喜欢</h4>
          <div class="related-recipes">
            <div
              v-for="item in forYouRecipes"
              :key="item.id"
              class="related-item"
              @click="goToDetail(item.id)"
            >
              <img
                :src="item.coverImage || 'https://picsum.photos/120/90'"
                :alt="item.title"
              />
              <div class="related-info">
                <span class="related-title">{{ item.title }}</span>
                <span class="related-meta"
                  >{{ item.category.name }} · {{ item.likeCount }}赞</span
                >
              </div>
            </div>
            <div v-if="forYouRecipes.length === 0" class="empty-recommend">
              <el-empty description="暂无推荐" :image-size="60" />
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h4 class="sidebar-title">相关推荐</h4>
          <div class="related-recipes">
            <div
              v-for="related in relatedRecipes"
              :key="related.id"
              class="related-item"
              @click="goToDetail(related.id)"
            >
              <img
                :src="related.coverImage || 'https://picsum.photos/120/90'"
                :alt="related.title"
              />
              <div class="related-info">
                <span class="related-title">{{ related.title }}</span>
                <span class="related-meta"
                  >{{ related.category.name }} · {{ related.likeCount }}赞</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";
import { recipeApi } from "@/api/recipe";
import { commentApi } from "@/api/comment";
import { collectionsApi } from "@/api/collections";
import { recommendationApi } from "@/api/recommendation";
import type { Recipe, Comment, Difficulty, Collection } from "@/types";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const recipe = ref<Recipe | null>(null);
const loading = ref(false);
const relatedRecipes = ref<Recipe[]>([]);
const forYouRecipes = ref<Recipe[]>([]);

const comments = ref<Comment[]>([]);
const commentsLoading = ref(false);
const commentsTotal = ref(0);
const commentPage = ref(1);
const totalCommentPages = computed(() => Math.ceil(commentsTotal.value / 10));

const newComment = ref("");
const replyContent = ref("");
const replyingTo = ref<string | null>(null);
const submitting = ref(false);

const collections = ref<Collection[]>([]);
const selectCollectionDialogVisible = ref(false);
const selectedCollectionId = ref<string>("");
const selectingCollection = ref(false);
const isAddingToCollection = ref(false);

const getDifficultyText = (difficulty: Difficulty) => {
  const map: Record<Difficulty, string> = {
    EASY: "简单",
    MEDIUM: "中等",
    HARD: "困难",
  };
  return map[difficulty];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN");
};

const goToDetail = (id: string) => {
  router.push(`/recipe/${id}`);
};

const handleShare = async () => {
  if (!recipe.value) return;

  const url = window.location.href;
  const title = recipe.value.title;

  try {
    if (navigator.share) {
      await navigator.share({
        title: title,
        url: url,
      });
      ElMessage.success("分享成功");
    } else {
      await navigator.clipboard.writeText(url);
      ElMessage.success("链接已复制到剪贴板");
    }
  } catch (error) {
    try {
      await navigator.clipboard.writeText(url);
      ElMessage.success("链接已复制到剪贴板");
    } catch {
      ElMessage.error("分享失败，请手动复制链接");
    }
  }
};

const fetchRecipe = async () => {
  const id = route.params.id as string;
  if (!id) return;

  loading.value = true;
  try {
    recipe.value = await recipeApi.getById(id);
  } catch (error) {
    ElMessage.error("获取菜谱详情失败");
  } finally {
    loading.value = false;
  }
};

const fetchRelatedRecipes = async () => {
  const id = route.params.id as string;
  if (!id || !recipe.value) return;

  try {
    relatedRecipes.value = await recipeApi.getRelated(
      recipe.value.categoryId,
      id,
      6,
    );
  } catch (error) {
    ElMessage.error("获取相关推荐失败");
  }
};

const fetchForYouRecipes = async () => {
  if (!userStore.isLoggedIn) return;

  const id = route.params.id as string;
  try {
    forYouRecipes.value = await recommendationApi.getForYou(id);
  } catch (error) {
    forYouRecipes.value = [];
  }
};

const fetchCollections = async () => {
  if (!userStore.isLoggedIn) return;
  try {
    collections.value = await collectionsApi.getAll();
  } catch (error) {
    ElMessage.error("获取收藏夹失败");
  }
};

const fetchComments = async () => {
  const id = route.params.id as string;
  if (!id) return;

  commentsLoading.value = true;
  try {
    const result = await commentApi.getByRecipe(id, commentPage.value, 10);
    comments.value = result.data;
    commentsTotal.value = result.total;
  } catch (error) {
    ElMessage.error("获取评论失败");
  } finally {
    commentsLoading.value = false;
  }
};

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning("请先登录");
    router.push({ path: "/login", query: { redirect: route.fullPath } });
    return;
  }

  if (!recipe.value) return;

  try {
    const result = await recipeApi.toggleLike(recipe.value.id);
    recipe.value.isLiked = result.isLiked;
    recipe.value.likeCount = result.likeCount;
    ElMessage.success(result.isLiked ? "点赞成功" : "取消点赞");
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning("请先登录");
    router.push({ path: "/login", query: { redirect: route.fullPath } });
    return;
  }

  if (!recipe.value) return;

  if (recipe.value.isFavorited) {
    try {
      const recipeCollections = await collectionsApi.getRecipeCollections(
        recipe.value.id,
      );
      for (const col of recipeCollections) {
        await collectionsApi.removeRecipe(col.id, recipe.value.id);
      }
      recipe.value.isFavorited = false;
      recipe.value.favoriteCount = Math.max(0, recipe.value.favoriteCount - 1);
      ElMessage.success("已取消收藏");
    } catch (error) {
      ElMessage.error("操作失败");
    }
  } else {
    isAddingToCollection.value = true;
    await fetchCollections();
    selectedCollectionId.value =
      collections.value.find((c) => c.isDefault)?.id ||
      collections.value[0]?.id ||
      "";
    selectCollectionDialogVisible.value = true;
  }
};

const handleConfirmAddToCollection = async () => {
  if (!recipe.value || !selectedCollectionId.value) return;

  selectingCollection.value = true;
  try {
    await collectionsApi.addRecipe(selectedCollectionId.value, recipe.value.id);
    recipe.value.isFavorited = true;
    recipe.value.favoriteCount = recipe.value.favoriteCount + 1;
    ElMessage.success("收藏成功");
    selectCollectionDialogVisible.value = false;
  } catch (error) {
    ElMessage.error("收藏失败");
  } finally {
    selectingCollection.value = false;
    isAddingToCollection.value = false;
  }
};

const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning("请输入评论内容");
    return;
  }

  if (!userStore.isLoggedIn) {
    ElMessage.warning("请先登录");
    router.push({ path: "/login", query: { redirect: route.fullPath } });
    return;
  }

  const id = route.params.id as string;
  submitting.value = true;
  try {
    await commentApi.create({
      content: newComment.value.trim(),
      recipeId: id,
    });
    newComment.value = "";
    commentPage.value = 1;
    await fetchComments();
    ElMessage.success("评论发表成功");
  } catch (error) {
    ElMessage.error("发表评论失败");
  } finally {
    submitting.value = false;
  }
};

const replyTo = (comment: Comment) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning("请先登录");
    router.push({ path: "/login", query: { redirect: route.fullPath } });
    return;
  }
  replyingTo.value = comment.id;
  replyContent.value = "";
};

const cancelReply = () => {
  replyingTo.value = null;
  replyContent.value = "";
};

const submitReply = async () => {
  if (!replyContent.value.trim() || !replyingTo.value) return;

  const id = route.params.id as string;
  submitting.value = true;
  try {
    await commentApi.create({
      content: replyContent.value.trim(),
      recipeId: id,
      parentId: replyingTo.value,
    });
    cancelReply();
    await fetchComments();
    ElMessage.success("回复成功");
  } catch (error) {
    ElMessage.error("回复失败");
  } finally {
    submitting.value = false;
  }
};

const reportComment = async (commentId: string) => {
  try {
    await commentApi.report(commentId);
    ElMessage.success("举报已提交，管理员会尽快处理");
  } catch (error) {
    ElMessage.error("举报失败");
  }
};

onMounted(async () => {
  await fetchRecipe();
  await Promise.all([
    fetchRelatedRecipes(),
    fetchForYouRecipes(),
    fetchComments(),
  ]);
});
</script>

<el-dialog
  v-model="selectCollectionDialogVisible"
  title="选择收藏夹"
  width="400px"
>
  <el-radio-group v-model="selectedCollectionId" class="collection-radio-group">
    <el-radio
      v-for="col in collections"
      :key="col.id"
      :label="col.id"
      class="collection-radio"
    >
      <span class="collection-name">
        {{ col.name }}
        <el-tag
          v-if="col.isDefault"
          size="small"
          type="info"
          effect="light"
          style="margin-left: 8px"
        >
          默认
        </el-tag>
      </span>
      <span class="collection-count">({{ col.recipeCount }} 个菜谱)</span>
    </el-radio>
  </el-radio-group>
  <template #footer>
    <el-button @click="selectCollectionDialogVisible = false">取消</el-button>
    <el-button
      type="primary"
      @click="handleConfirmAddToCollection"
      :loading="selectingCollection"
    >
      确认收藏
    </el-button>
  </template>
</el-dialog>

<style lang="scss" scoped>
.recipe-detail-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.breadcrumb-nav {
  margin-bottom: 24px;

  :deep(.el-breadcrumb__inner a) {
    color: #ff6b6b;
  }
}

.recipe-header {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.recipe-cover {
  width: 400px;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.recipe-info {
  flex: 1;
}

.recipe-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #333;
}

.recipe-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .author-name {
    font-weight: 600;
    color: #333;
  }

  .publish-time {
    font-size: 13px;
    color: #999;
  }
}

.recipe-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #666;

    .el-icon {
      color: #ff6b6b;
    }
  }
}

.recipe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .meta-label {
    font-weight: 600;
    color: #333;
  }

  .meta-value {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #666;
  }

  .difficulty {
    padding: 2px 12px;
    border-radius: 12px;
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
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.recipe-content {
  display: flex;
  gap: 32px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    color: #ff6b6b;
  }
}

.ingredients-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;

  .ingredient-name {
    font-weight: 500;
    color: #333;
  }

  .ingredient-amount {
    color: #666;
  }
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-item {
  display: flex;
  gap: 16px;
}

.step-number {
  width: 36px;
  height: 36px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;

  .step-description {
    font-size: 15px;
    line-height: 1.8;
    color: #333;
    margin-bottom: 12px;
  }

  .step-image {
    max-width: 300px;
    border-radius: 8px;
  }
}

.comments-section {
  .comment-form {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .form-content {
    flex: 1;

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }
  }

  .no-comments {
    padding: 32px;
  }

  .comment-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }
  }

  .comment-content {
    flex: 1;
  }

  .comment-header {
    display: flex;
    gap: 12px;
    margin-bottom: 8px;

    .comment-author {
      font-weight: 600;
      color: #333;
    }

    .comment-time {
      font-size: 12px;
      color: #999;
    }
  }

  .comment-text {
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 8px;
  }

  .comment-actions {
    display: flex;
    gap: 8px;
  }

  .replies {
    margin-top: 12px;
    padding-left: 24px;
    border-left: 2px solid #f0f0f0;
  }

  .reply-item {
    display: flex;
    gap: 8px;
    padding: 8px 0;
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

  .reply-form {
    margin-top: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;

    .reply-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.sidebar-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.related-recipes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: #f8f9fa;
  }

  img {
    width: 80px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
  }

  .related-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;

    .related-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .related-meta {
      font-size: 12px;
      color: #999;
    }
  }
}

.count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.collection-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .collection-radio {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin: 0;

    &:hover {
      border-color: #ff6b6b;
    }

    :deep(.el-radio__input) {
      margin-right: 12px;
    }

    .collection-name {
      font-weight: 500;
      color: #333;
    }

    .collection-count {
      margin-left: auto;
      color: #999;
      font-size: 13px;
    }
  }
}

.empty-recommend {
  padding: 20px 0;
}
</style>
