import Joi from 'joi';

// 统一的验证中间件生成器
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    // 选择要验证的请求数据来源
    const data = req[source];

    // 验证数据
    const { error, value } = schema.validate(data, {
      abortEarly: false, // 显示所有验证错误
      allowUnknown: true, // 允许存在未定义的字段
      stripUnknown: true, // 移除未定义的字段
    });

    if (error) {
      // 格式化错误信息
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/^"|"$/g, ''), // 移除引号
      }));

      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors,
      });
    }

    // 将验证后的数据放回请求对象
    req[source] = value;
    next();
  };
};

// 通用的ID验证规则
const idSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('无效的ID格式');

// 分页查询验证规则
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export { validate, idSchema, paginationSchema };
