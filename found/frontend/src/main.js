import { createApp } from 'vue';
import { pinia } from './store';
import router from './router';
import './assets/main.css';
import App from './App.vue';
import { useUserStore } from './store/user';
import VueLazyload from 'vue-lazyload';
import { setupCsrfInterceptor } from './utils/csrf';

import '@fortawesome/fontawesome-free/css/all.min.css';

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(VueLazyload, {
  loading:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  attempt: 1,
});

setupCsrfInterceptor();

async function initApp() {
  try {
    const userStore = useUserStore();
    await userStore.loadUserData();
    app.mount('#app');
  } catch (error) {
    console.error('应用初始化失败:', error);
    app.mount('#app');
  }
}

initApp();
