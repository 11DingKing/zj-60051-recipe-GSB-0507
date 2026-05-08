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
          <p class="join-date">
            注册于 {{ formatDate(userStore.user?.createdAt) }}
          </p>
          <el-tag v-if="userStore.isAdmin" type="danger" effect="dark"
            >管理员</el-tag
          >
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
              <el-empty
                description="你还没有发布任何菜谱，快来分享你的第一道菜谱吧！"
              />
            </div>
            <div v-else class="recipes-grid">
              <div
                v-for="recipe in myRecipes"
                :key="recipe.id"
                class="recipe-card"
                @click="goToDetail(recipe.id)"
              >
                <div class="recipe-cover">
                  <img
                    :src="recipe.coverImage || 'https://picsum.photos/400/300'"
                    :alt="recipe.title"
                  />
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
                    <span
                      class="difficulty"
                      :class="recipe.difficulty.toLowerCase()"
                    >
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
                  <el-button
                    type="primary"
                    size="small"
                    link
                    @click.stop="editRecipe(recipe.id)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    link
                    @click.stop="deleteRecipe(recipe)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的收藏" name="favorites">
          <div class="collections-section">
            <div class="collections-header">
              <div class="section-actions">
                <el-button type="primary" @click="openCreateCollectionDialog">
                  <el-icon><Plus /></el-icon>
                  新建收藏夹
                </el-button>
              </div>
            </div>

            <el-tabs
              v-model="activeCollectionTab"
              class="collection-tabs"
              type="card"
            >
              <el-tab-pane
                v-for="collection in collections"
                :key="collection.id"
                :name="collection.id"
              >
                <template #label>
                  <span class="collection-tab-label">
                    <span>{{ collection.name }}</span>
                    <el-tag
                      size="small"
                      :type="collection.isDefault ? 'info' : 'primary'"
                      effect="light"
                      class="recipe-count-tag"
                    >
                      {{ collection.recipeCount }}
                    </el-tag>
                    <el-dropdown
                      v-if="!collection.isDefault"
                      @command="handleCollectionCommand"
                      trigger="click"
                      class="collection-menu"
                    >
                      <el-icon class="menu-icon"><MoreFilled /></el-icon>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item
                            :command="{ action: 'rename', collection }"
                          >
                            重命名
                          </el-dropdown-item>
                          <el-dropdown-item
                            :command="{ action: 'delete', collection }"
                            divided
                            style="color: #f56c6c"
                          >
                            删除收藏夹
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </span>
                </template>

                <div v-if="loadingCollectionRecipes" class="empty-state">
                  <el-empty description="加载中..." />
                </div>
                <div
                  v-else-if="currentCollectionRecipes.length === 0"
                  class="empty-state"
                >
                  <el-empty
                    :description="`${collection.name} 还没有收藏的菜谱`"
                  />
                </div>
                <div v-else class="recipes-grid">
                  <div
                    v-for="recipe in currentCollectionRecipes"
                    :key="recipe.id"
                    class="recipe-card"
                    @click="goToDetail(recipe.id)"
                  >
                    <div class="recipe-cover">
                      <img
                        :src="
                          recipe.coverImage || 'https://picsum.photos/400/300'
                        "
                        :alt="recipe.title"
                      />
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
                        <span
                          class="difficulty"
                          :class="recipe.difficulty.toLowerCase()"
                        >
                          {{ getDifficultyText(recipe.difficulty) }}
                        </span>
                        <span class="cook-time">
                          <el-icon><Timer /></el-icon>
                          {{ recipe.cookTime }}分钟
                        </span>
                      </div>
                      <el-button
                        v-if="!collection.isDefault"
                        type="danger"
                        size="small"
                        text
                        class="remove-btn"
                        @click.stop="removeFromCollection(recipe.id)"
                      >
                        移出收藏夹
                      </el-button>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的评论" name="comments">
          <div class="comments-section">
            <div v-if="myComments.length === 0" class="empty-state">
              <el-empty description="你还没有发表任何评论" />
            </div>
            <div v-else class="comments-list">
              <div
                v-for="comment in myComments"
                :key="comment.id"
                class="comment-item"
              >
                <div class="comment-header">
                  <router-link
                    :to="`/recipe/${comment.recipeId}`"
                    class="recipe-link"
                  >
                    <el-icon><Document /></el-icon>
                    查看相关菜谱
                  </router-link>
                  <span class="comment-time">{{
                    formatDate(comment.createdAt)
                  }}</span>
                </div>
                <p class="comment-content">{{ comment.content }}</p>
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
                      <el-icon size="18"><UserFilled /></el-icon>
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
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要删除菜谱「{{ recipeToDelete?.title }}」吗？此操作无法撤销。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting"
          >删除</el-button
        >
      </template>
    </el-dialog>

    <el-dialog
      v-model="createCollectionDialogVisible"
      title="新建收藏夹"
      width="400px"
    >
      <el-input
        v-model="newCollectionName"
        placeholder="请输入收藏夹名称"
        maxlength="50"
        show-word-limit
      />
      <template #footer>
        <el-button @click="createCollectionDialogVisible = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          @click="handleCreateCollection"
          :loading="creatingCollection"
        >
          创建
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="renameCollectionDialogVisible"
      title="重命名收藏夹"
      width="400px"
    >
      <el-input
        v-model="renameCollectionName"
        placeholder="请输入新名称"
        maxlength="50"
        show-word-limit
      />
      <template #footer>
        <el-button @click="renameCollectionDialogVisible = false"
          >取消</el-button
        >
        <el-button type="primary" @click="handleRenameCollection">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deleteCollectionDialogVisible"
      title="确认删除收藏夹"
      width="400px"
    >
      <p>
        确定要删除收藏夹「{{ deletingCollection?.name }}」吗？
        里面的菜谱会自动移到「默认收藏夹」。
      </p>
      <template #footer>
        <el-button @click="deleteCollectionDialogVisible = false"
          >取消</el-button
        >
        <el-button type="danger" @click="handleDeleteCollection"
          >删除</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/user";
import { recipeApi } from "@/api/recipe";
import { commentApi } from "@/api/comment";
import { collectionsApi } from "@/api/collections";
import type { Recipe, Comment, Difficulty, Collection } from "@/types";

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref("recipes");
const myRecipes = ref<Recipe[]>([]);
const myFavorites = ref<Recipe[]>([]);
const myComments = ref<Comment[]>([]);
const loading = ref(false);

const deleteDialogVisible = ref(false);
const recipeToDelete = ref<Recipe | null>(null);
const deleting = ref(false);

const collections = ref<Collection[]>([]);
const activeCollectionTab = ref<string>("");
const collectionRecipesMap = ref<Record<string, Recipe[]>>({});
const loadingCollectionRecipes = ref(false);

const createCollectionDialogVisible = ref(false);
const newCollectionName = ref("");
const creatingCollection = ref(false);

const renameCollectionDialogVisible = ref(false);
const renamingCollection = ref<Collection | null>(null);
const renameCollectionName = ref("");

const deleteCollectionDialogVisible = ref(false);
const deletingCollection = ref<Collection | null>(null);

const getDifficultyText = (difficulty: Difficulty) => {
  const map: Record<Difficulty, string> = {
    EASY: "简单",
    MEDIUM: "中等",
    HARD: "困难",
  };
  return map[difficulty];
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN");
};

const goToDetail = (id: string) => {
  router.push(`/recipe/${id}`);
};

const goToCreate = () => {
  router.push("/recipe/create");
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
    myRecipes.value = myRecipes.value.filter(
      (r) => r.id !== recipeToDelete.value!.id,
    );
    ElMessage.success("菜谱已删除");
    deleteDialogVisible.value = false;
  } catch (error) {
    ElMessage.error("删除失败");
  } finally {
    deleting.value = false;
  }
};

const fetchMyRecipes = async () => {
  try {
    myRecipes.value = await recipeApi.getMyRecipes();
  } catch (error) {
    ElMessage.error("获取我的菜谱失败");
  }
};

const fetchMyFavorites = async () => {
  try {
    myFavorites.value = await recipeApi.getMyFavorites();
  } catch (error) {
    ElMessage.error("获取我的收藏失败");
  }
};

const fetchMyComments = async () => {
  try {
    myComments.value = await commentApi.getMyComments();
  } catch (error) {
    ElMessage.error("获取我的评论失败");
  }
};

const fetchCollections = async () => {
  try {
    collections.value = await collectionsApi.getAll();
    if (collections.value.length > 0 && !activeCollectionTab.value) {
      activeCollectionTab.value = collections.value[0].id;
    }
  } catch (error) {
    ElMessage.error("获取收藏夹失败");
  }
};

const fetchCollectionRecipes = async (collectionId: string) => {
  if (collectionRecipesMap.value[collectionId]) return;

  loadingCollectionRecipes.value = true;
  try {
    const recipes = await collectionsApi.getRecipes(collectionId);
    collectionRecipesMap.value[collectionId] = recipes;
  } catch (error) {
    ElMessage.error("获取收藏夹菜谱失败");
  } finally {
    loadingCollectionRecipes.value = false;
  }
};

const currentCollectionRecipes = computed(() => {
  return collectionRecipesMap.value[activeCollectionTab.value] || [];
});

watch(activeCollectionTab, async (newVal) => {
  if (newVal) {
    await fetchCollectionRecipes(newVal);
  }
});

watch(activeTab, async (newVal) => {
  if (newVal === "favorites" && collections.value.length === 0) {
    await fetchCollections();
  }
});

const openCreateCollectionDialog = () => {
  newCollectionName.value = "";
  createCollectionDialogVisible.value = true;
};

const handleCreateCollection = async () => {
  if (!newCollectionName.value.trim()) {
    ElMessage.warning("请输入收藏夹名称");
    return;
  }

  creatingCollection.value = true;
  try {
    const newCollection = await collectionsApi.create(
      newCollectionName.value.trim(),
    );
    collections.value.push(newCollection);
    ElMessage.success("收藏夹创建成功");
    createCollectionDialogVisible.value = false;
  } catch (error) {
    ElMessage.error("创建收藏夹失败");
  } finally {
    creatingCollection.value = false;
  }
};

const handleCollectionCommand = (command: {
  action: "rename" | "delete";
  collection: Collection;
}) => {
  if (command.action === "rename") {
    renamingCollection.value = command.collection;
    renameCollectionName.value = command.collection.name;
    renameCollectionDialogVisible.value = true;
  } else if (command.action === "delete") {
    deletingCollection.value = command.collection;
    deleteCollectionDialogVisible.value = true;
  }
};

const handleRenameCollection = async () => {
  if (!renamingCollection.value || !renameCollectionName.value.trim()) return;

  try {
    const updated = await collectionsApi.update(
      renamingCollection.value.id,
      renameCollectionName.value.trim(),
    );
    const idx = collections.value.findIndex((c) => c.id === updated.id);
    if (idx !== -1) {
      collections.value[idx] = updated;
    }
    ElMessage.success("重命名成功");
    renameCollectionDialogVisible.value = false;
    renamingCollection.value = null;
  } catch (error) {
    ElMessage.error("重命名失败");
  }
};

const handleDeleteCollection = async () => {
  if (!deletingCollection.value) return;

  try {
    await collectionsApi.remove(deletingCollection.value.id);
    collections.value = collections.value.filter(
      (c) => c.id !== deletingCollection.value!.id,
    );
    delete collectionRecipesMap.value[deletingCollection.value.id];
    if (
      activeCollectionTab.value === deletingCollection.value.id &&
      collections.value.length > 0
    ) {
      activeCollectionTab.value = collections.value[0].id;
    }
    ElMessage.success("收藏夹已删除，里面的菜谱已移到默认收藏夹");
    deleteCollectionDialogVisible.value = false;
    deletingCollection.value = null;
  } catch (error) {
    ElMessage.error("删除失败");
  }
};

const removeFromCollection = async (recipeId: string) => {
  if (!activeCollectionTab.value) return;

  try {
    await ElMessageBox.confirm("确定要将这个菜谱移出收藏夹吗？", "确认移出", {
      confirmButtonText: "移出",
      cancelButtonText: "取消",
      type: "warning",
    });

    await collectionsApi.removeRecipe(activeCollectionTab.value, recipeId);
    collectionRecipesMap.value[activeCollectionTab.value] =
      collectionRecipesMap.value[activeCollectionTab.value].filter(
        (r) => r.id !== recipeId,
      );
    const collection = collections.value.find(
      (c) => c.id === activeCollectionTab.value,
    );
    if (collection) {
      collection.recipeCount--;
    }
    ElMessage.success("已移出收藏夹");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchMyRecipes(), fetchMyFavorites(), fetchMyComments()]);
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

.collections-section {
  .collections-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;

    .section-actions {
      display: flex;
      gap: 12px;
    }
  }

  .collection-tabs {
    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__nav-wrap) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__item) {
      height: 48px;
      line-height: 48px;
    }

    :deep(.el-tabs__content) {
      padding: 24px 0;
    }
  }

  .collection-tab-label {
    display: flex;
    align-items: center;
    gap: 8px;

    .recipe-count-tag {
      margin-left: 4px;
    }

    .collection-menu {
      margin-left: 8px;
      cursor: pointer;

      .menu-icon {
        font-size: 14px;
        color: #999;

        &:hover {
          color: #666;
        }
      }
    }
  }

  .recipes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 24px;
  }

  .remove-btn {
    margin-top: 8px;
  }

  .empty-state {
    padding: 48px 0;
  }
}
</style>
