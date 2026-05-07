<template>
  <div class="recipe-form-page">
    <div class="page-header">
      <h1>{{ isEdit ? '编辑菜谱' : '发布新菜谱' }}</h1>
      <p class="page-subtitle">分享你的美食制作秘籍</p>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="recipe-form"
      v-loading="loading"
    >
      <el-card class="form-card">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>

        <el-form-item label="菜谱名称" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入菜谱名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="封面图片" prop="coverImage">
          <el-input
            v-model="form.coverImage"
            placeholder="请输入封面图片URL"
          />
          <div class="image-preview" v-if="form.coverImage">
            <img :src="form.coverImage" alt="封面预览" />
          </div>
        </el-form-item>

        <el-form-item label="菜系分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择菜系分类" style="width: 200px">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="烹饪时长" prop="cookTime">
          <el-input-number
            v-model="form.cookTime"
            :min="1"
            :max="999"
            controls-position="right"
          />
          <span class="unit">分钟</span>
        </el-form-item>

        <el-form-item label="难度等级" prop="difficulty">
          <el-radio-group v-model="form.difficulty">
            <el-radio label="EASY">简单</el-radio>
            <el-radio label="MEDIUM">中等</el-radio>
            <el-radio label="HARD">困难</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="份量" prop="servings">
          <el-input-number
            v-model="form.servings"
            :min="1"
            :max="99"
            controls-position="right"
          />
          <span class="unit">人份</span>
        </el-form-item>
      </el-card>

      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">食材清单</span>
            <el-button type="primary" link @click="addIngredient">
              <el-icon><Plus /></el-icon>
              添加食材
            </el-button>
          </div>
        </template>

        <div class="ingredients-list">
          <div
            v-for="(ingredient, index) in form.ingredients"
            :key="index"
            class="ingredient-item"
          >
            <span class="index">{{ index + 1 }}.</span>
            <el-input
              v-model="ingredient.name"
              placeholder="食材名称"
              style="width: 180px"
            />
            <el-input
              v-model="ingredient.amount"
              placeholder="用量"
              style="width: 120px"
            />
            <el-button type="danger" link @click="removeIngredient(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <div v-if="form.ingredients.length === 0" class="empty-ingredients">
            <el-empty description="暂无食材，点击上方按钮添加" :image-size="60" />
          </div>
        </div>
      </el-card>

      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">烹饪步骤</span>
            <el-button type="primary" link @click="addStep">
              <el-icon><Plus /></el-icon>
              添加步骤
            </el-button>
          </div>
        </template>

        <div class="steps-list">
          <div
            v-for="(step, index) in form.steps"
            :key="index"
            class="step-item"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <el-form-item label="步骤描述" :prop="`steps.${index}.description`" :rules="{ required: true, message: '请输入步骤描述' }">
                <el-input
                  v-model="step.description"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入步骤描述"
                />
              </el-form-item>
              <el-form-item label="步骤图片">
                <el-input
                  v-model="step.image"
                  placeholder="请输入步骤图片URL（可选）"
                />
                <div class="step-image-preview" v-if="step.image">
                  <img :src="step.image" :alt="`步骤${index + 1}`" />
                </div>
              </el-form-item>
            </div>
            <el-button type="danger" link class="remove-btn" @click="removeStep(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <div v-if="form.steps.length === 0" class="empty-steps">
            <el-empty description="暂无步骤，点击上方按钮添加" :image-size="60" />
          </div>
        </div>
      </el-card>

      <div class="form-actions">
        <el-button @click="goBack">取消</el-button>
        <el-button type="warning" :loading="submitting" @click="saveDraft">
          保存草稿
        </el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEdit ? '保存修改' : '发布菜谱' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { categoryApi } from '@/api/category';
import { recipeApi, type CreateRecipeData, type UpdateRecipeData } from '@/api/recipe';
import type { Category, Recipe, Difficulty, RecipeStatus, Ingredient, Step } from '@/types';

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const submitting = ref(false);
const categories = ref<Category[]>([]);

interface FormIngredient {
  id?: string;
  name: string;
  amount: string;
  sortOrder: number;
}

interface FormStep {
  id?: string;
  description: string;
  image?: string;
  stepNumber: number;
}

const form = reactive<{
  title: string;
  coverImage: string;
  categoryId: string;
  cookTime: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: FormIngredient[];
  steps: FormStep[];
}>({
  title: '',
  coverImage: '',
  categoryId: '',
  cookTime: 30,
  difficulty: 'MEDIUM',
  servings: 2,
  ingredients: [],
  steps: [],
});

const rules: FormRules = {
  title: [
    { required: true, message: '请输入菜谱名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  categoryId: [
    { required: true, message: '请选择菜系分类', trigger: 'change' },
  ],
  cookTime: [
    { required: true, message: '请输入烹饪时长', trigger: 'blur' },
    { type: 'number', min: 1, message: '烹饪时长至少 1 分钟', trigger: 'blur' },
  ],
  difficulty: [
    { required: true, message: '请选择难度等级', trigger: 'change' },
  ],
  servings: [
    { required: true, message: '请输入份量', trigger: 'blur' },
    { type: 'number', min: 1, message: '份量至少 1 人份', trigger: 'blur' },
  ],
};

const fetchCategories = async () => {
  try {
    categories.value = await categoryApi.getAll();
  } catch (error) {
    ElMessage.error('获取分类失败');
  }
};

const fetchRecipe = async () => {
  const id = route.params.id as string;
  if (!id) return;

  loading.value = true;
  try {
    const recipe = await recipeApi.getById(id);
    form.title = recipe.title;
    form.coverImage = recipe.coverImage || '';
    form.categoryId = recipe.categoryId;
    form.cookTime = recipe.cookTime;
    form.difficulty = recipe.difficulty;
    form.servings = recipe.servings;
    form.ingredients = (recipe.ingredients || []).map((ing, idx) => ({
      id: ing.id,
      name: ing.name,
      amount: ing.amount,
      sortOrder: ing.sortOrder || idx,
    }));
    form.steps = (recipe.steps || []).map((step, idx) => ({
      id: step.id,
      description: step.description,
      image: step.image,
      stepNumber: step.stepNumber || idx + 1,
    }));
  } catch (error) {
    ElMessage.error('获取菜谱详情失败');
  } finally {
    loading.value = false;
  }
};

const addIngredient = () => {
  form.ingredients.push({
    name: '',
    amount: '',
    sortOrder: form.ingredients.length,
  });
};

const removeIngredient = (index: number) => {
  form.ingredients.splice(index, 1);
  form.ingredients.forEach((ing, idx) => {
    ing.sortOrder = idx;
  });
};

const addStep = () => {
  form.steps.push({
    description: '',
    image: '',
    stepNumber: form.steps.length + 1,
  });
};

const removeStep = (index: number) => {
  form.steps.splice(index, 1);
  form.steps.forEach((step, idx) => {
    step.stepNumber = idx + 1;
  });
};

const validateForm = async (): Promise<boolean> => {
  if (!formRef.value) return false;

  try {
    await formRef.value.validate();
    return true;
  } catch {
    return false;
  }
};

const prepareData = (status: RecipeStatus = 'PUBLISHED') => {
  const data: CreateRecipeData | UpdateRecipeData = {
    title: form.title.trim(),
    coverImage: form.coverImage.trim() || undefined,
    categoryId: form.categoryId,
    cookTime: form.cookTime,
    difficulty: form.difficulty,
    servings: form.servings,
    status,
    ingredients: form.ingredients
      .filter(ing => ing.name.trim())
      .map((ing, idx) => ({
        id: ing.id,
        name: ing.name.trim(),
        amount: ing.amount.trim(),
        sortOrder: idx,
      })),
    steps: form.steps
      .filter(step => step.description.trim())
      .map((step, idx) => ({
        id: step.id,
        description: step.description.trim(),
        image: step.image?.trim() || undefined,
        stepNumber: idx + 1,
      })),
  };
  return data;
};

const saveDraft = async () => {
  const data = prepareData('DRAFT');

  submitting.value = true;
  try {
    if (isEdit.value) {
      await recipeApi.update(route.params.id as string, data as UpdateRecipeData);
      ElMessage.success('草稿已保存');
    } else {
      await recipeApi.create(data as CreateRecipeData);
      ElMessage.success('草稿已保存');
    }
    router.push('/profile');
  } catch (error) {
    ElMessage.error('保存失败');
  } finally {
    submitting.value = false;
  }
};

const submitForm = async () => {
  const valid = await validateForm();
  if (!valid) return;

  if (form.ingredients.filter(ing => ing.name.trim()).length === 0) {
    ElMessage.warning('请至少添加一种食材');
    return;
  }

  if (form.steps.filter(step => step.description.trim()).length === 0) {
    ElMessage.warning('请至少添加一个步骤');
    return;
  }

  const data = prepareData('PUBLISHED');

  submitting.value = true;
  try {
    if (isEdit.value) {
      await recipeApi.update(route.params.id as string, data as UpdateRecipeData);
      ElMessage.success('修改成功');
    } else {
      await recipeApi.create(data as CreateRecipeData);
      ElMessage.success('发布成功');
    }
    router.push('/profile');
  } catch (error) {
    ElMessage.error(isEdit.value ? '保存失败' : '发布失败');
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  await fetchCategories();
  if (isEdit.value) {
    await fetchRecipe();
  }
});
</script>

<style lang="scss" scoped>
.recipe-form-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #333;
  }

  .page-subtitle {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

.form-card {
  margin-bottom: 24px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-title {
    font-weight: 600;
    color: #333;
  }
}

.unit {
  margin-left: 8px;
  color: #666;
}

.image-preview {
  margin-top: 12px;
  max-width: 300px;

  img {
    width: 100%;
    border-radius: 8px;
  }
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ingredient-item {
  display: flex;
  align-items: center;
  gap: 12px;

  .index {
    width: 24px;
    text-align: right;
    font-weight: 600;
    color: #666;
  }
}

.empty-ingredients,
.empty-steps {
  padding: 24px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  position: relative;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;

  :deep(.el-form-item) {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.step-image-preview {
  margin-top: 8px;
  max-width: 200px;

  img {
    width: 100%;
    border-radius: 8px;
  }
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}
</style>
