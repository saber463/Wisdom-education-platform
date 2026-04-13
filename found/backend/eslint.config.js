import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'data/**', '*.config.js', '*.config.ts', 'logs/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['utils/seed*.js', 'utils/couponGenerator.js', 'utils/emailUtils.js', 'test-*.js', 'server.js', 'services/chatbotService.js', 'services/chatbotServiceEnhanced.js', 'services/qwen3EmbeddingService.js', 'services/qwen3EmbeddingServiceEnhanced.js', 'test_ai_fallback.js', 'controllers/aiController.js', 'controllers/authController.js', 'controllers/testController.js', 'controllers/learningPathController.js', 'controllers/notificationController.js', 'controllers/userController.js', 'routes/*.js', 'middleware/sensitiveCheck.js', 'seeds/achievements.js', 'routes/achievements.js', 'routes/ai.js', 'middleware/auth.js', 'routes/auth.js', 'routes/categories.js', 'routes/categoryController.js', 'routes/db.js', 'routes/diagnose-password.js', 'routes/error.js', 'routes/fix-db.js', 'routes/generateKnowledgeBase.js', 'routes/generate-system-tweets.js', 'routes/getCategoryIds.js', 'routes/groupController.js', 'routes/knowledge-base-seed.js', 'routes/knowledgePointController.js', 'routes/knowledgePoints.js', 'routes/learningProgressController.js', 'routes/membershipController.js', 'routes/redis.js', 'routes/reset_passwords.js', 'routes/reset-passwords.js', 'routes/seedKnowledgeBase.js', 'routes/supplementKnowledgeBase.js', 'routes/tweetController.js', 'routes/upload.js', 'routes/User.js', 'routes/userRoutes.js', 'routes/aiController.js', 'routes/authController.js', 'routes/testController.js', 'routes/userController.js', 'seeds/*.js', 'scripts/*.js', 'config/*.js', 'middleware/*.js', 'diagnose-password.js', 'fix-db.js', 'getCategoryIds.js', 'reset_passwords.js', 'reset-passwords.js', 'seed/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
];
