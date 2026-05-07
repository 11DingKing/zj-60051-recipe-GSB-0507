<template>
  <div class="app-container">
    <el-header v-if="!$route.path.startsWith('/admin')" class="app-header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <el-icon :size="28"><Food /></el-icon>
          <span class="logo-text">菜谱分享社区</span>
        </router-link>
        
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索菜谱或食材..."
            @keyup.enter="handleSearch"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/search" class="nav-link">搜索</router-link>
          
          <template v-if="userStore.isLoggedIn">
            <router-link to="/recipe/create" class="nav-link">
              <el-icon><Plus /></el-icon>
              发布菜谱
            </router-link>
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userStore.user?.avatar">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <span class="username">{{ userStore.user?.nickname }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="admin" v-if="userStore.isAdmin">管理后台</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link">登录</router-link>
            <router-link to="/register" class="nav-link register-btn">注册</router-link>
          </template>
        </div>
      </div>
    </el-header>
    
    <main class="app-main">
      <router-view />
    </main>
    
    <el-footer v-if="!$route.path.startsWith('/admin')" class="app-footer">
      <div class="footer-content">
        <p>菜谱分享社区 © 2024</p>
        <p class="footer-links">
          <a href="#">关于我们</a>
          <a href="#">使用条款</a>
          <a href="#">联系我们</a>
        </p>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useCategoryStore } from '@/stores/category';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const categoryStore = useCategoryStore();
const searchKeyword = ref('');

onMounted(async () => {
  await categoryStore.fetchCategories();
  if (userStore.isLoggedIn) {
    await userStore.fetchProfile();
  }
});

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push(`/search?keyword=${encodeURIComponent(searchKeyword.value)}`);
  }
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile');
      break;
    case 'admin':
      router.push('/admin');
      break;
    case 'logout':
      userStore.logout();
      ElMessage.success('已退出登录');
      router.push('/');
      break;
  }
};
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 64px !important;
  
  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 24px;
  }
  
  .logo {
    display: flex;
    align-items: center;
    color: white;
    text-decoration: none;
    
    .logo-text {
      margin-left: 8px;
      font-size: 20px;
      font-weight: 600;
    }
  }
  
  .search-bar {
    flex: 1;
    max-width: 400px;
    margin: 0 32px;
  }
  
  .nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
    
    .nav-link {
      color: white;
      text-decoration: none;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0.9;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 1;
      }
      
      &.register-btn {
        background: rgba(255, 255, 255, 0.2);
        padding: 6px 16px;
        border-radius: 4px;
        
        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
      cursor: pointer;
      
      .username {
        font-size: 14px;
      }
    }
  }
}

.app-main {
  flex: 1;
  background: #f5f5f5;
}

.app-footer {
  background: #333;
  color: #999;
  padding: 24px 0;
  text-align: center;
  
  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    
    p {
      margin: 4px 0;
      font-size: 13px;
    }
    
    .footer-links {
      margin-top: 12px;
      
      a {
        color: #999;
        text-decoration: none;
        margin: 0 12px;
        
        &:hover {
          color: white;
        }
      }
    }
  }
}
</style>
