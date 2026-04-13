import mongoose, { Schema, Document } from 'mongoose';

// 推荐项目接口
interface IRecommendationItem {
  item_id: number;
  item_type: string;
  score: number;
  reason: string;
  tags: string[];
}

// 推荐结果文档接口
export interface IRecommendation extends Document {
  user_id: number;
  recommendation_type: 'course' | 'learning_path' | 'resource';
  items: IRecommendationItem[];
  algorithm: 'collaborative_filtering' | 'content_based' | 'hybrid';
  generated_at: Date;
  expires_at: Date;
  is_active: boolean;
}

// 推荐项目Schema
const RecommendationItemSchema = new Schema({
  item_id: { type: Number, required: true },
  item_type: { type: String, required: true },
  score: { type: Number, required: true },
  reason: { type: String, required: true },
  tags: { type: [String], default: [] }
}, { _id: false });

// 推荐结果Schema
const RecommendationSchema = new Schema<IRecommendation>({
  user_id: { type: Number, required: true, index: true },
  recommendation_type: { 
    type: String, 
    required: true, 
    enum: ['course', 'learning_path', 'resource'],
    index: true
  },
  items: { type: [RecommendationItemSchema], required: true, default: [] },
  algorithm: { 
    type: String, 
    required: true, 
    enum: ['collaborative_filtering', 'content_based', 'hybrid']
  },
  generated_at: { type: Date, required: true, default: Date.now },
  expires_at: { type: Date, required: true, index: true },
  is_active: { type: Boolean, required: true, default: true, index: true }
}, {
  collection: 'recommendations',
  timestamps: false,
  bufferCommands: false
});

// 创建复合索引
RecommendationSchema.index({ user_id: 1, recommendation_type: 1, is_active: 1 });
RecommendationSchema.index({ expires_at: 1 });

// 导出模型
export const Recommendation = mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
