import Joi from 'joi';
import { idSchema, paginationSchema } from './validationUtils.js';

// 获取商品列表验证规则（查询参数）
const getProductsSchema = paginationSchema.keys({
  category: Joi.string().optional().messages({
    'string.base': '分类ID必须是字符串',
  }),
  sort: Joi.string().valid('hot', 'createdAt', 'price').optional().messages({
    'string.base': '排序字段必须是字符串',
    'any.only': '排序字段只能是hot、createdAt或price',
  }),
});

// 获取商品详情验证规则（路径参数）
const getProductByIdSchema = Joi.object({
  id: idSchema.required().messages({
    'any.required': '商品ID是必填项',
  }),
});

export { getProductsSchema, getProductByIdSchema };
