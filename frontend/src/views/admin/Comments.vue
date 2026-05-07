<template>
  <div class="comments-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.tab" @change="handleTabChange" style="width: 180px">
            <el-option label="全部评论" value="all" />
            <el-option label="已举报" value="reported" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="comments" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="评论内容" min-width="250">
          <template #default="{ row }">
            <div class="comment-content">
              <p>{{ row.content }}</p>
              <div class="comment-meta" v-if="row.parentId">
                <el-tag size="small" type="info">回复</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评论用户" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="28" :src="row.user.avatar">
                <el-icon size="18"><UserFilled /></el-icon>
              </el-avatar>
              <span>{{ row.user.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isHidden" type="info">已隐藏</el-tag>
            <el-tag v-else-if="row.isReported" type="danger">已举报</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.isReported && !row.isHidden"
              type="primary"
              link
              size="small"
              @click="handleHide(row)"
            >
              隐藏
            </el-button>
            <el-button
              v-if="row.isReported"
              type="success"
              link
              size="small"
              @click="handleDismiss(row)"
            >
              忽略举报
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container" v-if="totalPages > 1">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="fetchComments"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { commentApi } from '@/api/comment';
import type { Comment } from '@/types';

const loading = ref(false);
const comments = ref<Comment[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const filterForm = ref({
  tab: 'all',
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

const fetchComments = async () => {
  loading.value = true;
  try {
    if (filterForm.value.tab === 'reported') {
      const result = await commentApi.getReported(currentPage.value, pageSize.value);
      comments.value = result.data;
      total.value = result.total;
    } else {
      // 这里暂时没有获取所有评论的接口，使用空数据
      comments.value = [];
      total.value = 0;
    }
  } catch (error) {
    ElMessage.error('获取评论列表失败');
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  currentPage.value = 1;
  fetchComments();
};

const handleHide = async (comment: Comment) => {
  try {
    await ElMessageBox.confirm(
      '确定要隐藏该评论吗？隐藏后用户将无法看到。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await commentApi.handleReport(comment.id, 'hide');
    ElMessage.success('评论已隐藏');
    fetchComments();
  } catch {
    // 用户取消
  }
};

const handleDismiss = async (comment: Comment) => {
  try {
    await ElMessageBox.confirm(
      '确定要忽略该举报吗？评论将保持正常显示。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await commentApi.handleReport(comment.id, 'dismiss');
    ElMessage.success('已忽略举报');
    fetchComments();
  } catch {
    // 用户取消
  }
};

const handleDelete = async (comment: Comment) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该评论吗？此操作无法撤销。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await commentApi.delete(comment.id);
    ElMessage.success('评论已删除');
    fetchComments();
  } catch {
    // 用户取消
  }
};

onMounted(() => {
  fetchComments();
});
</script>

<style lang="scss" scoped>
.comments-page {
  .filter-card {
    margin-bottom: 24px;
  }

  .comment-content {
    p {
      margin: 0 0 8px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #333;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
}
</style>
