import axios from 'axios';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY = 'csrf_token_expiry';

const getCsrfTokenFromCookie = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return value;
    }
  }
  return null;
};

const getCsrfToken = () => {
  const token = getCsrfTokenFromCookie();
  if (token) {
    return token;
  }

  const storedToken = localStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = localStorage.getItem(CSRF_TOKEN_EXPIRY);

  if (storedToken && expiry && Date.now() < parseInt(expiry)) {
    return storedToken;
  }

  return null;
};

const fetchCsrfToken = async () => {
  try {
    await axios.get('/api/csrf-token', {
      withCredentials: true,
    });

    const token = getCsrfTokenFromCookie();
    if (token) {
      localStorage.setItem(CSRF_TOKEN_KEY, token);
      localStorage.setItem(CSRF_TOKEN_EXPIRY, (Date.now() + 3600000).toString());
      return token;
    }

    return null;
  } catch (_error) {
    console.error('获取CSRF Token失败:', _error);
    return null;
  }
};

const clearCsrfToken = () => {
  localStorage.removeItem(CSRF_TOKEN_KEY);
  localStorage.removeItem(CSRF_TOKEN_EXPIRY);
};

const setupCsrfInterceptor = () => {
  axios.interceptors.request.use(
    async config => {
      const token = getCsrfToken();

      if (token && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
        config.headers['X-CSRF-Token'] = token;
      }

      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      if (
        error.response?.status === 403 &&
        error.response?.data?.message?.includes('CSRF') &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        const newToken = await fetchCsrfToken();

        if (newToken) {
          originalRequest.headers['X-CSRF-Token'] = newToken;
          return axios(originalRequest);
        }
      }

      return Promise.reject(error);
    }
  );
};

export { getCsrfToken, fetchCsrfToken, clearCsrfToken, setupCsrfInterceptor };
