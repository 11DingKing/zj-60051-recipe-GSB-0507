<template>
  <div class="categories-page">
    <div class="page-actions">
      <el-button type="primary" @click="openDialog(null)">
        <el-icon><Plus /></el-icon>
        添加菜系
      </el-button>
    </div>

    <el-card>
      <el-table :data="categories" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <span class="category-icon">{{ row.icon || '🍽️' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="菜系名称" min-width="150" />
        <el-table-column prop="sortOrder" label="排序" width="100" />
        <el-table-column prop="recipeCount" label="菜谱数量" width="120">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.recipeCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
              :disabled="row.recipeCount > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜系' : '添加菜系'"
      width="400px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="菜系名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜系名称" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标（emoji）" />
          <div class="icon-hint">
            提示：可以使用 emoji 图标，如 🍜、🍲、🍕 等
          </div>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number
            v-model="form.sortOrder"
            :min="0"
            :max="999"
            controls-position="right"
          />
          <div class="icon-hint">数字越小越靠前</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { categoryApi } from '@/api/category';
import type { Category } from '@/types';

const loading = ref(false);
const submitting = ref(false);
const categories = ref<Category[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref<string | null>(null);
const formRef = ref<FormInstance>();

const form = reactive({
  name: '',
  icon: '',
  sortOrder: 0,
});

const rules: FormRules = {
  name: [
    { required: true, message: '请输入菜系名称', trigger: 'blur' },
    { min: 2, max: 20, message: '名称长度在 2 到 20 个字符', trigger: 'blur' },
  ],
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

const fetchCategories = async () => {
  loading.value = true;
  try {
    categories.value = await categoryApi.getAll();
  } catch (error) {
    ElMessage.error('获取分类列表失败');
  } finally {
    loading.value = false;
  }
};

const openDialog = (category: Category | null) => {
  isEdit.value = !!category;
  editId.value = category?.id || null;

  if (category) {
    form.name = category.name;
    form.icon = category.icon || '';
    form.sortOrder = category.sortOrder;
  } else {
    form.name = '';
    form.icon = '';
    form.sortOrder = categories.value.length;
  }

  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    if (isEdit.value && editId.value) {
      await categoryApi.update(editId.value, {
        name: form.name.trim(),
        icon: form.icon.trim() || undefined,
        sortOrder: form.sortOrder,
      });
      ElMessage.success('编辑成功');
    } else {
      await categoryApi.create({
        name: form.name.trim(),
        icon: form.icon.trim() || undefined,
        sortOrder: form.sortOrder,
      });
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
    fetchCategories();
  } catch (error) {
    ElMessage.error(isEdit.value ? '编辑失败' : '添加失败');
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (category: Category) => {
  if (category.recipeCount > 0) {
    ElMessage.warning('该菜系下有菜谱，无法删除');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除菜系「${category.name}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await categoryApi.delete(category.id);
    ElMessage.success('删除成功');
    fetchCategories();
  } catch {
    // 用户取消
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style lang="scss" scoped>
.categories-page {
  .page-actions {
    margin-bottom: 24px;
  }

  .category-icon {
    font-size: 24px;
  }

  .icon-hint {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
}
</style>
