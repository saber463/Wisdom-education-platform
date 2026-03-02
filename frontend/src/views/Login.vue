<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>智慧教育学习平台</h1>
        <p>教师 · 学生 · 家长</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>测试账号：</p>
        <div class="test-accounts">
          <el-tag type="primary" @click="fillTestAccount('teacher')">教师: teacher001</el-tag>
          <el-tag type="success" @click="fillTestAccount('student')">学生: student001</el-tag>
          <el-tag type="warning" @click="fillTestAccount('parent')">家长: parent001</el-tag>
        </div>
        <p class="password-hint">密码: teacher123 / student123 / parent123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页面
 * 
 * 需求：1.1, 5.1, 8.1 - 三角色登录
 */
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 加载状态
const loading = ref(false)

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在3-50个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在6-50个字符', trigger: 'blur' }
  ]
}

// 填充测试账号
function fillTestAccount(role: 'teacher' | 'student' | 'parent') {
  const accounts = {
    teacher: 'teacher001',
    student: 'student001',
    parent: 'parent001'
  }
  const passwords = {
    teacher: 'teacher123',
    student: 'student123',
    parent: 'parent123'
  }
  loginForm.username = accounts[role]
  loginForm.password = passwords[role]
}

// 处理登录
async function handleLogin() {
  if (!loginFormRef.value) return
  
  try {
    // 表单验证
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    loading.value = true
    
    // 调用登录接口
    const response = await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    ElMessage.success(`欢迎回来，${response.user.realName}！`)
    
    // 跳转到对应角色的首页或重定向页面
    const redirect = route.query.redirect as string
    const homePath = userStore.getHomePath()
    router.push(redirect || homePath)
    
  } catch (error: any) {
    console.error('[登录] 失败:', error)
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
}

.login-footer {
  text-align: center;
  color: #999;
  font-size: 12px;
}

.login-footer p {
  margin-bottom: 10px;
}

.test-accounts {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.test-accounts .el-tag {
  cursor: pointer;
}

.test-accounts .el-tag:hover {
  opacity: 0.8;
}

.password-hint {
  color: #ccc;
}
</style>
