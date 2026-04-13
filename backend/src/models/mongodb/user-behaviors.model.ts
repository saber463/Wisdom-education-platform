import mongoose, { Schema, Document } from 'mongoose';

// 元数据接口
interface IMetadata {
  course_id?: number;
  branch_id?: number;
  tags?: string[];
  duration?: number;
  source?: string;
  [key: string]: unknown;
}

// 用户行为文档接口
export interface IUserBehavior extends Document {
  user_id: number;
  behavior_type: 'view' | 'click' | 'search' | 'purchase' | 'complete';
  target_type: 'course' | 'lesson' | 'resource' | 'post';
  target_id: number;
  metadata: IMetadata;
  timestamp: Date;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
}

// 用户行为Schema
const UserBehaviorSchema = new Schema<IUserBehavior>({
  user_id: { type: Number, required: true, index: true },
  behavior_type: { 
    type: String, 
    required: true, 
    enum: ['view', 'click', 'search', 'purchase', 'complete'],
    index: true
  },
  target_type: { 
    type: String, 
    required: true, 
    enum: ['course', 'lesson', 'resource', 'post']
  },
  target_id: { type: Number, required: true },
  metadata: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  session_id: { type: String, required: true },
  ip_address: { type: String },
  user_agent: { type: String }
}, {
  collection: 'user_behaviors',
  timestamps: false,
  bufferCommands: false
});

// 创建复合索引
UserBehaviorSchema.index({ user_id: 1, timestamp: -1 });
UserBehaviorSchema.index({ behavior_type: 1, timestamp: -1 });
UserBehaviorSchema.index({ target_type: 1, target_id: 1 });
UserBehaviorSchema.index({ timestamp: -1 });

// 导出模型
export const UserBehavior = mongoose.model<IUserBehavior>('UserBehavior', UserBehaviorSchema);
