<template>
  <div class="reg-outer">
    <!-- 动态背景 -->
    <div class="bg-layer">
      <div class="orb orb-1" /><div class="orb orb-2" /><div class="orb orb-3" />
      <div class="grid-texture" />
      <div class="particles">
        <div v-for="i in 18" :key="i" class="particle" :style="pStyle(i)" />
      </div>
    </div>

    <!-- 双栏布局 -->
    <div class="reg-wrap">
      <!-- 左侧品牌 -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-icon-wrap">
            <div class="brand-icon-glow" />
            <div class="brand-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L34 12V28L20 36L6 28V12L20 4Z" fill="url(#rg1)" opacity="0.9"/>
                <path d="M20 10L29 15V25L20 30L11 25V15L20 10Z" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>
                <circle cx="20" cy="20" r="4" fill="white" opacity="0.9"/>
                <path d="M20 14V20M20 20L25 23" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="rg1" x1="6" y1="4" x2="34" y2="36">
                    <stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#a78bfa"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <h1 class="brand-title">智慧教育平台</h1>
          <p class="brand-slogan">开启你的 AI 学习之旅</p>

          <div class="step-list">
            <div v-for="(s, i) in steps" :key="i" class="step-item">
              <div class="step-num">{{ i + 1 }}</div>
              <div>
                <div class="step-title">{{ s.title }}</div>
                <div class="step-desc">{{ s.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="form-panel">
        <div class="form-card" :class="{ 'card-shake': shakeErr }">
          <div class="form-header">
            <div class="form-tag">🎉 免费注册</div>
            <h2 class="form-title">创建新账号</h2>
            <p class="form-subtitle">填写以下信息，即刻开始学习</p>
          </div>

          <!-- 密码强度进度 -->
          <div v-if="formData.password" class="pwd-strength">
            <div class="pwd-bars">
              <div
                v-for="i in 4"
                :key="i"
                class="pwd-bar"
                :class="pwdStrength.level >= i ? `bar-${pwdStrength.color}` : ''"
              />
            </div>
            <span class="pwd-label" :class="`txt-${pwdStrength.color}`">{{ pwdStrength.text }}</span>
          </div>

          <form @submit.prevent="handleSubmit" autocomplete="off">
            <!-- 用户名 -->
            <div class="field-group" :class="{ focused: foc.username, error: errors.username }">
              <label class="field-label">用户名</label>
              <div class="field-wrap">
                <span class="field-icon"><i class="fa fa-user" /></span>
                <input
                  v-model="formData.username"
                  type="text"
                  class="field-input"
                  placeholder="3~20个字符"
                  :disabled="isLoading"
                  @focus="foc.username=true" @blur="foc.username=false"
                />
                <span v-if="formData.username && !errors.username" class="field-ok">
                  <i class="fa fa-check-circle" />
                </span>
              </div>
              <transition name="err-fade">
                <p v-if="errors.username" class="err-msg"><i class="fa fa-exclamation-circle" />{{ errors.username }}</p>
              </transition>
            </div>

            <!-- 邮箱 -->
            <div class="field-group" :class="{ focused: foc.email, error: errors.email }">
              <label class="field-label">邮箱地址</label>
              <div class="field-wrap">
                <span class="field-icon"><i class="fa fa-envelope" /></span>
                <input
                  v-model="formData.email"
                  type="email"
                  class="field-input"
                  placeholder="example@edu.com"
                  :disabled="isLoading"
                  @focus="foc.email=true" @blur="foc.email=false"
                />
                <span v-if="formData.email && !errors.email" class="field-ok">
                  <i class="fa fa-check-circle" />
                </span>
              </div>
              <transition name="err-fade">
                <p v-if="errors.email" class="err-msg"><i class="fa fa-exclamation-circle" />{{ errors.email }}</p>
              </transition>
            </div>

            <!-- 密码 -->
            <div class="field-group" :class="{ focused: foc.password, error: errors.password }">
              <label class="field-label">登录密码</label>
              <div class="field-wrap">
                <span class="field-icon"><i class="fa fa-lock" /></span>
                <input
                  v-model="formData.password"
                  :type="showPwd ? 'text' : 'password'"
                  class="field-input"
                  placeholder="至少6个字符"
                  :disabled="isLoading"
                  @focus="foc.password=true" @blur="foc.password=false"
                />
                <button type="button" class="field-eye" @click="showPwd=!showPwd" tabindex="-1">
                  <i :class="showPwd ? 'fa fa-eye-slash' : 'fa fa-eye'" />
                </button>
              </div>
              <transition name="err-fade">
                <p v-if="errors.password" class="err-msg"><i class="fa fa-exclamation-circle" />{{ errors.password }}</p>
              </transition>
            </div>

            <!-- 确认密码 -->
            <div class="field-group" :class="{ focused: foc.confirm, error: errors.confirmPassword }">
              <label class="field-label">确认密码</label>
              <div class="field-wrap">
                <span class="field-icon"><i class="fa fa-shield-alt" /></span>
                <input
                  v-model="formData.confirmPassword"
                  :type="showConfirm ? 'text' : 'password'"
                  class="field-input"
                  placeholder="再次输入密码"
                  :disabled="isLoading"
                  @focus="foc.confirm=true" @blur="foc.confirm=false"
                />
                <button type="button" class="field-eye" @click="showConfirm=!showConfirm" tabindex="-1">
                  <i :class="showConfirm ? 'fa fa-eye-slash' : 'fa fa-eye'" />
                </button>
              </div>
              <transition name="err-fade">
                <p v-if="errors.confirmPassword" class="err-msg"><i class="fa fa-exclamation-circle" />{{ errors.confirmPassword }}</p>
              </transition>
            </div>

            <!-- 角色选择 -->
            <div class="role-select">
              <p class="role-label">我的身份</p>
              <div class="role-opts">
                <label
                  v-for="r in roles"
                  :key="r.val"
                  class="role-opt"
                  :class="{ active: formData.role === r.val }"
                >
                  <input type="radio" v-model="formData.role" :value="r.val" class="sr-only" />
                  <span class="role-emoji">{{ r.emoji }}</span>
                  <span class="role-name">{{ r.name }}</span>
                </label>
              </div>
            </div>

            <!-- 全局错误 -->
            <transition name="err-slide">
              <div v-if="globalErr" class="err-banner">
                <i class="fa fa-exclamation-circle" />{{ globalErr }}
              </div>
            </transition>

            <!-- 提交 -->
            <button
              type="submit"
              class="submit-btn"
              :class="{ loading: isLoading }"
              :disabled="isLoading"
            >
              <span v-if="!isLoading" class="btn-inner">
                <i class="fa fa-user-plus" />立即注册
              </span>
              <span v-else class="btn-inner">
                <span class="spin-ring" />注册中...
              </span>
              <div class="btn-shine" />
            </button>
          </form>

          <div class="login-prompt">
            <span>已有账号?</span>
            <router-link to="/login" class="login-link">立即登录</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student',
});

const errors = reactive({ username: '', email: '', password: '', confirmPassword: '' });
const isLoading = ref(false);
const showPwd = ref(false);
const showConfirm = ref(false);
const globalErr = ref('');
const shakeErr = ref(false);
const foc = reactive({ username: false, email: false, password: false, confirm: false });

const roles = [
  { val: 'student', name: '学生', emoji: '🎒' },
  { val: 'teacher', name: '老师', emoji: '🧑‍🏫' },
  { val: 'parent', name: '家长', emoji: '👪' },
];

const steps = [
  { title: '创建账号', desc: '填写基本信息完成注册' },
  { title: '选择兴趣', desc: '告诉我们你想学什么' },
  { title: '开启学习', desc: 'AI为你生成专属路径' },
];

// 密码强度
const pwdStrength = computed(() => {
  const p = formData.password;
  if (!p) return { level: 0, color: 'gray', text: '' };
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p) || /[!@#$%^&*]/.test(p)) s++;
  if (/[0-9]/.test(p) && /[a-z]/.test(p)) s++;
  const map = [
    { level: 1, color: 'red', text: '弱' },
    { level: 2, color: 'orange', text: '一般' },
    { level: 3, color: 'yellow', text: '较强' },
    { level: 4, color: 'green', text: '强' },
  ];
  return map[Math.min(s, 4) - 1] || map[0];
});

const validate = () => {
  Object.assign(errors, { username: '', email: '', password: '', confirmPassword: '' });
  let ok = true;
  if (formData.username.length < 3) { errors.username = '用户名至少3个字符'; ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { errors.email = '请输入有效邮箱'; ok = false; }
  if (formData.password.length < 6) { errors.password = '密码至少6个字符'; ok = false; }
  if (formData.password !== formData.confirmPassword) { errors.confirmPassword = '两次密码不一致'; ok = false; }
  return ok;
};

const handleSubmit = async () => {
  if (!validate()) { shakeErr.value = true; setTimeout(() => shakeErr.value = false, 600); return; }
  isLoading.value = true;
  globalErr.value = '';
  try {
    const userInfo = await userStore.register(formData.username, formData.email, formData.password, formData.role);
    if (userInfo) {
      // 注册成功后直接执行类似登录的重定向逻辑，提升体验
      const role = userStore.userRole;
      let redirectPath = '/student';
      if (role === 'parent') redirectPath = '/parent';
      else if (role === 'teacher') redirectPath = '/teacher';
      
      // 强制刷新跳转，确保状态干净
      window.location.href = redirectPath;
    }
  } catch (e) {
    globalErr.value = e.message || '注册失败，请稍后重试';
    shakeErr.value = true;
    setTimeout(() => shakeErr.value = false, 600);
  } finally {
    isLoading.value = false;
  }
};

const pStyle = (i) => {
  const size = (i % 4) + 2;
  return {
    width: size + 'px', height: size + 'px',
    left: ((i * 5.3 + 3) % 100) + '%',
    top: ((i * 7.1 + 5) % 100) + '%',
    animationDelay: (i * 0.45) % 8 + 's',
    animationDuration: (10 + (i % 6) * 3) + 's',
    opacity: (0.2 + (i % 4) * 0.08).toFixed(2),
  };
};
</script>

<style scoped>
/* 浅色主题 - 注册页面 */
.reg-outer {
  min-height: 100vh;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%);
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-layer { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.orb { position: absolute; border-radius: 50%; filter: blur(100px); animation: orbFloat 12s ease-in-out infinite; }
.orb-1 { width: 500px; height: 500px; top: -150px; left: -80px; background: radial-gradient(circle, rgba(59,130,246,0.20) 0%, transparent 70%); animation-delay: 0s; }
.orb-2 { width: 400px; height: 400px; bottom: -100px; right: -80px; background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%); animation-delay: -4s; }
.orb-3 { width: 350px; height: 350px; top: 40%; left: 40%; background: radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%); animation-delay: -8s; }
@keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-15px) scale(1.03)} 66%{transform:translate(-15px,20px) scale(0.97)} }
.grid-texture { position: absolute; inset: 0; background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 50px 50px; }
.particles { position: absolute; inset: 0; }
.particle { position: absolute; border-radius: 50%; background: rgba(59,130,246,0.25); animation: pDrift linear infinite; }
@keyframes pDrift { 0%{transform:translateY(20px) scale(0.8);opacity:0} 10%{opacity:0.6} 90%{opacity:0.4} 100%{transform:translateY(-100vh) scale(1.1);opacity:0} }

/* 主布局 */
.reg-wrap { display: flex; width: 100%; position: relative; z-index: 1; }

/* 左侧品牌 */
.brand-panel { display: none; flex: 1; padding: 60px 48px; justify-content: center; align-items: center; }
@media(min-width:1024px){ .brand-panel{display:flex} }
.brand-content { max-width: 360px; }
.brand-icon-wrap { position: relative; width: 72px; height: 72px; margin-bottom: 24px; }
.brand-icon-glow { position: absolute; inset: -8px; background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%); border-radius: 50%; animation: iconGlow 3s ease-in-out infinite; }
@keyframes iconGlow { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.15);opacity:.7} }
.brand-icon { position: relative; width: 72px; height: 72px; background: rgba(255,255,255,0.8); border: 1px solid rgba(59,130,246,0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); box-shadow: 0 4px 16px rgba(59,130,246,0.1); }
.brand-title { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; }
.brand-slogan { font-size: 14px; color: rgba(30,58,138,0.6); margin-bottom: 40px; }

.step-list { display: flex; flex-direction: column; gap: 20px; }
.step-item { display: flex; align-items: flex-start; gap: 14px; }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }
.step-title { font-size: 14px; font-weight: 600; color: #1e3a8a; margin-bottom: 2px; }
.step-desc { font-size: 12px; color: rgba(30,58,138,0.6); }

/* 右侧表单 */
.form-panel { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px 20px; min-height: 100vh; }
.form-card { width: 100%; max-width: 460px; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px) saturate(180%); border-radius: 24px; padding: 40px 40px 32px; border: 1px solid rgba(59,130,246,0.15); box-shadow: 0 8px 32px rgba(59,130,246,0.1), 0 0 0 1px rgba(255,255,255,0.5) inset; position: relative; overflow: hidden; }
.form-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4); }
.card-shake { animation: shake .5s cubic-bezier(.36,.07,.19,.97); }
@keyframes shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-4px)} 40%,60%{transform:translateX(4px)} }

.form-header { margin-bottom: 24px; }
.form-tag { display: inline-block; padding: 4px 12px; border-radius: 20px; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15); color: #3b82f6; font-size: 12px; margin-bottom: 12px; }
.form-title { font-size: 24px; font-weight: 700; color: #1e3a8a; margin-bottom: 6px; }
.form-subtitle { font-size: 13px; color: rgba(30,58,138,0.6); }

/* 密码强度 */
.pwd-strength { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.pwd-bars { display: flex; gap: 4px; }
.pwd-bar { width: 32px; height: 4px; border-radius: 2px; background: rgba(59,130,246,0.15); transition: background .3s; }
.bar-red { background: #ef4444; } .bar-orange { background: #f97316; } .bar-yellow { background: #eab308; } .bar-green { background: #22c55e; }
.pwd-label { font-size: 11px; }
.txt-red{color:#dc2626} .txt-orange{color:#ea580c} .txt-yellow{color:#ca8a04} .txt-green{color:#16a34a}

/* 字段 */
.field-group { margin-bottom: 16px; }
.field-label { display: block; font-size: 13px; font-weight: 500; color: #1e3a8a; margin-bottom: 7px; transition: color .2s; }
.field-group.focused .field-label { color: #3b82f6; }
.field-group.error .field-label { color: #dc2626; }
.field-wrap { position: relative; display: flex; align-items: center; }
.field-icon { position: absolute; left: 14px; color: rgba(30,58,138,0.4); font-size: 14px; transition: color .2s; }
.field-group.focused .field-icon { color: #3b82f6; }
.field-group.error .field-icon { color: #dc2626; }
.field-input { width: 100%; padding: 12px 42px 12px 42px; background: rgba(255,255,255,0.8); border: 1px solid rgba(59,130,246,0.2); border-radius: 11px; color: #1e3a8a; font-size: 14px; outline: none; transition: all .25s; box-sizing: border-box; }
.field-input::placeholder { color: rgba(30,58,138,0.35); }
.field-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.field-group.error .field-input { border-color: #ef4444; background: rgba(254,226,226,0.3); }
.field-ok { position: absolute; right: 12px; color: #16a34a; font-size: 15px; }
.field-eye { position: absolute; right: 12px; background: none; border: none; color: rgba(30,58,138,0.4); cursor: pointer; padding: 4px; font-size: 14px; transition: color .2s; line-height: 1; }
.field-eye:hover { color: #3b82f6; }
.err-msg { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #dc2626; margin-top: 5px; }
.err-msg .fa { font-size: 11px; }
.err-fade-enter-active,.err-fade-leave-active{transition:all .2s}
.err-fade-enter-from,.err-fade-leave-to{opacity:0;transform:translateY(-4px)}

/* 角色选择 */
.role-select { margin-bottom: 16px; }
.role-label { font-size: 13px; color: #1e3a8a; margin-bottom: 10px; }
.role-opts { display: flex; gap: 8px; }
.role-opt { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; border-radius: 10px; border: 1.5px solid rgba(59,130,246,0.2); background: rgba(255,255,255,0.6); cursor: pointer; transition: all .2s; user-select: none; }
.role-opt:hover { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.05); }
.role-opt.active { border-color: #3b82f6; background: rgba(59,130,246,0.08); box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.role-emoji { font-size: 20px; }
.role-name { font-size: 12px; color: rgba(30,58,138,0.7); }
.role-opt.active .role-name { color: #3b82f6; font-weight: 600; }
.sr-only { position: absolute; opacity: 0; pointer-events: none; }

/* 全局错误 */
.err-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; font-size: 13px; color: #dc2626; background: rgba(254,226,226,0.5); border: 1px solid rgba(239,68,68,0.25); margin-bottom: 14px; }
.err-slide-enter-active,.err-slide-leave-active{transition:all .25s}
.err-slide-enter-from{opacity:0;transform:translateY(-8px)}
.err-slide-leave-to{opacity:0}

/* 提交按钮 */
.submit-btn { width: 100%; padding: 13px; border: none; border-radius: 12px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; position: relative; overflow: hidden; transition: all .3s cubic-bezier(.16,1,.3,1); letter-spacing: .5px; }
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px -4px rgba(59,130,246,0.35); }
.submit-btn:disabled { cursor: not-allowed; opacity: .8; }
.btn-inner { display: flex; align-items: center; justify-content: center; gap: 8px; position: relative; z-index: 1; }
.btn-shine { position: absolute; top: 0; left: -100%; width: 60%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transform: skewX(-20deg); animation: btnShine 3s ease-in-out infinite; }
@keyframes btnShine { 0%{left:-100%} 50%{left:150%} 100%{left:150%} }
.spin-ring { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
@keyframes spin { to{transform:rotate(360deg)} }

/* 登录引导 */
.login-prompt { text-align: center; margin-top: 18px; font-size: 14px; color: rgba(30,58,138,0.6); }
.login-link { color: #3b82f6; font-weight: 600; text-decoration: none; margin-left: 4px; transition: color .2s; }
.login-link:hover { color: #2563eb; }

@media(max-width:640px){
  .form-card{padding:28px 22px 24px;border-radius:18px}
  .role-opts{flex-wrap:wrap}
  .role-opt{flex:1 1 80px}
}
</style>
