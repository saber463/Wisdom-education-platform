import Joi from 'joi';

// 注册验证规则
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.base': '用户名必须是字符串',
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多30个字符',
    'any.required': '用户名是必填项',
  }),
  email: Joi.string().email().required().messages({
    'string.base': '邮箱必须是字符串',
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱是必填项',
  }),
  password: Joi.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.base': '密码必须是字符串',
      'string.min': '密码至少8个字符',
      'string.pattern.base': '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符',
      'any.required': '密码是必填项',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': '两次输入的密码不一致',
    'any.required': '确认密码是必填项',
  }),
});

// 登录验证规则
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': '邮箱必须是字符串',
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱是必填项',
  }),
  password: Joi.string().required().messages({
    'string.base': '密码必须是字符串',
    'any.required': '密码是必填项',
  }),
});

// 更新用户资料验证规则
const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional().messages({
    'string.base': '用户名必须是字符串',
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多30个字符',
  }),
  avatar: Joi.string().optional().messages({
    'string.base': '头像URL必须是字符串',
  }),
  intro: Joi.string().max(500).optional().messages({
    'string.base': '个人简介必须是字符串',
    'string.max': '个人简介最多500个字符',
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'string.base': '性别必须是字符串',
    'any.only': '性别只能是male、female或other',
  }),
  birthDate: Joi.date().optional().messages({
    'date.base': '出生日期必须是有效的日期格式',
  }),
  learningInterests: Joi.array().items(Joi.string()).optional().messages({
    'array.base': '学习兴趣必须是数组',
    'string.base': '学习兴趣项必须是字符串',
  }),
});

// 检查邮箱验证规则
const checkEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': '邮箱必须是字符串',
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱是必填项',
  }),
});

// 更新密码验证规则
const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.base': '旧密码必须是字符串',
    'any.required': '旧密码是必填项',
  }),
  newPassword: Joi.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.base': '新密码必须是字符串',
      'string.min': '新密码至少8个字符',
      'string.pattern.base': '新密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符',
      'any.required': '新密码是必填项',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': '两次输入的新密码不一致',
    'any.required': '确认密码是必填项',
  }),
});

// 忘记密码验证规则
const forgotPasswordSchema = Joi.object({
  email: Joi.string().required().email().messages({
    'string.empty': '邮箱是必填项',
    'string.email': '请输入有效的邮箱地址',
  }),
});

// 重置密码验证规则
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': '令牌是必填项',
  }),
  password: Joi.string().required().min(6).max(20).messages({
    'string.empty': '密码是必填项',
    'string.min': '密码长度不能少于6个字符',
    'string.max': '密码长度不能超过20个字符',
  }),
  confirmPassword: Joi.ref('password'),
})
  .with('password', 'confirmPassword')
  .messages({
    'any.only': '两次输入的密码不一致',
    'object.missing': '密码和确认密码必须同时提供',
  });

export {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  checkEmailSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
