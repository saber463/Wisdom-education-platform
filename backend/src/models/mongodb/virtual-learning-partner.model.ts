import mongoose, { Schema, Document } from 'mongoose';

// 消息接口
interface IMessage {
  sender: 'user' | 'partner';
  content: string;
  message_type: 'encouragement' | 'learning_tip' | 'task_reminder' | 'question_answer' | 'celebration';
  related_knowledge_point?: string;
  timestamp: Date;
}

// 任务进度接口
interface ITaskProgress {
  task_id: number;
  task_description: string;
  user_progress: number;
  partner_progress: number;
  target_count: number;
  completed: boolean;
  completed_at?: Date;
}

// 虚拟学习伙伴互动记录文档接口
export interface IVirtualLearningPartner extends Document {
  user_id: number;
  partner_id: number;
  partner_name: string;
  partner_avatar: string;
  partner_signature: string;
  learning_ability_tag: 'efficient' | 'steady' | 'basic';
  partner_level: number;
  interaction_history: IMessage[];
  collaborative_tasks: ITaskProgress[];
  total_interactions: number;
  last_interaction_at: Date;
  created_at: Date;
  updated_at: Date;
}

// 消息Schema
const MessageSchema = new Schema({
  sender: { 
    type: String, 
    required: true, 
    enum: ['user', 'partner']
  },
  content: { type: String, required: true },
  message_type: { 
    type: String, 
    required: true, 
    enum: ['encouragement', 'learning_tip', 'task_reminder', 'question_answer', 'celebration']
  },
  related_knowledge_point: { type: String },
  timestamp: { type: Date, required: true, default: Date.now }
}, { _id: false });

// 任务进度Schema
const TaskProgressSchema = new Schema({
  task_id: { type: Number, required: true },
  task_description: { type: String, required: true },
  user_progress: { type: Number, required: true, default: 0 },
  partner_progress: { type: Number, required: true, default: 0 },
  target_count: { type: Number, required: true },
  completed: { type: Boolean, required: true, default: false },
  completed_at: { type: Date }
}, { _id: false });

// 虚拟学习伙伴Schema
const VirtualLearningPartnerSchema = new Schema<IVirtualLearningPartner>({
  user_id: { type: Number, required: true },
  partner_id: { type: Number, required: true },
  partner_name: { type: String, required: true },
  partner_avatar: { type: String, required: true },
  partner_signature: { type: String, required: true },
  learning_ability_tag: { 
    type: String, 
    required: true, 
    enum: ['efficient', 'steady', 'basic']
  },
  partner_level: { type: Number, required: true, default: 1 },
  interaction_history: { type: [MessageSchema], default: [] },
  collaborative_tasks: { type: [TaskProgressSchema], default: [] },
  total_interactions: { type: Number, required: true, default: 0 },
  last_interaction_at: { type: Date, required: true, default: Date.now },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now }
}, {
  collection: 'virtual_learning_partner',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  bufferCommands: false
});

// 创建索引
VirtualLearningPartnerSchema.index({ user_id: 1 }, { unique: true });
VirtualLearningPartnerSchema.index({ partner_id: 1 });
VirtualLearningPartnerSchema.index({ user_id: 1, last_interaction_at: -1 });

// 导出模型
export const VirtualLearningPartner = mongoose.model<IVirtualLearningPartner>(
  'VirtualLearningPartner', 
  VirtualLearningPartnerSchema
);
