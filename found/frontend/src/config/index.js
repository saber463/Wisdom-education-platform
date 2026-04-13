export default {
  storagePrefix: 'learning_ai_',
  aiApi: {
    baseUrl: 'https://spark-api-open.xf-yun.com/v1/chat/completions', // 讯飞星火API地址
    apiKey: 'DnQzajujEfRrXeEpEvVE:uKTApqMClimrqQWcJUhh', // 讯飞星火API密钥
    model: 'spark-pro', // 讯飞星火模型名称
  },
  api: {
    baseUrl: '/api', // 使用相对路径，配合vite.config.js中的代理配置
    tweets: '/tweets', // 推文相关API路径
    aiChat: '/ai/chat', // AI聊天API路径
  },
  // 题库API配置
  questionBankApi: {
    urls: [
      'https://api.julym.com/class/damn.php', // JulyM网课查题API
      'http://api.wkexam.com/api/', // 知寻免费查题API
      'https://apiyyyOOl.com/api/question', // SH-API 直接搜题接口
    ],
  },

  routeWhiteList: ['/login', '/register', '/'],
};
