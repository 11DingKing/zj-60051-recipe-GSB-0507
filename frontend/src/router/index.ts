import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', guest: true },
  },
  {
    path: '/recipe/:id',
    name: 'RecipeDetail',
    component: () => import('@/views/RecipeDetail.vue'),
    meta: { title: '菜谱详情' },
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
    meta: { title: '搜索' },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true },
  },
  {
    path: '/recipe/create',
    name: 'CreateRecipe',
    component: () => import('@/views/RecipeForm.vue'),
    meta: { title: '发布菜谱', requiresAuth: true },
  },
  {
    path: '/recipe/edit/:id',
    name: 'EditRecipe',
    component: () => import('@/views/RecipeForm.vue'),
    meta: { title: '编辑菜谱', requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据看板' },
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/Categories.vue'),
        meta: { title: '菜系管理' },
      },
      {
        path: 'comments',
        name: 'AdminComments',
        component: () => import('@/views/admin/Comments.vue'),
        meta: { title: '评论管理' },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();
  document.title = to.meta.title ? `${to.meta.title} - 菜谱分享社区` : '菜谱分享社区';

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next({ path: '/' });
    return;
  }

  if (to.meta.guest && userStore.isLoggedIn) {
    next({ path: '/' });
    return;
  }

  next();
});

export default router;
