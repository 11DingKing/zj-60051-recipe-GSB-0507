<template>
  <div class="admin-layout">
    <el-container>
      <el-aside width="240px" class="sidebar">
        <div class="logo">
          <router-link to="/">
            <el-icon size="32"><CookingPot /></el-icon>
            <span>菜谱管理后台</span>
          </router-link>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#1a1a2e"
          text-color="#b8c7ce"
          active-text-color="#ff6b6b"
          class="side-menu"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="/admin/categories">
            <el-icon><Menu /></el-icon>
            <span>菜系管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/comments">
            <el-icon><ChatDotRound /></el-icon>
            <span>评论管理</span>
            <el-badge :value="reportedCount" class="item" :hidden="reportedCount === 0">
            </el-badge>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>返回前台</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-title">
            <h2>{{ currentPageTitle }}</h2>
          </div>
          <div class="header-user">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userStore.user?.avatar">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <span class="username">{{ userStore.user?.nickname }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { commentApi } from '@/api/comment';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const reportedCount = ref(0);

const activeMenu = computed(() => {
  return route.path;
});

const currentPageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin/dashboard': '数据看板',
    '/admin/categories': '菜系管理',
    '/admin/comments': '评论管理',
    '/admin/users': '用户管理',
  };
  return titles[route.path] || '管理后台';
});

const fetchReportedCount = async () => {
  try {
    const result = await commentApi.getReported(1, 1);
    reportedCount.value = result.total;
  } catch (error) {
    console.error('获取举报评论数失败', error);
  }
};

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile');
      break;
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        userStore.logout();
        router.push('/login');
        ElMessage.success('已退出登录');
      } catch {
        // 用户取消
      }
      break;
  }
};

onMounted(() => {
  fetchReportedCount();
});
</script>

<style lang="scss" scoped>
.admin-layout {
  min-height: 100vh;
}

.sidebar {
  background-color: #1a1a2e;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    a {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
      text-decoration: none;
      font-size: 18px;
      font-weight: 600;

      .el-icon {
        color: #ff6b6b;
      }
    }
  }
}

.side-menu {
  border-right: none;

  :deep(.el-menu-item) {
    height: 50px;
    line-height: 50px;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  :deep(.el-menu-item.is-active) {
    background-color: rgba(255, 107, 107, 0.1);
  }
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;

  .header-title h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .header-user {
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;

      .username {
        font-size: 14px;
        color: #333;
      }

      .el-icon {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.main-content {
  background: #f5f7fa;
  padding: 24px;
}
</style>
