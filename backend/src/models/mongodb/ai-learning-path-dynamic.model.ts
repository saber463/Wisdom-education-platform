import mongoose, { Schema, Document } from 'mongoose';

// 调整详情接口
interface IAdjustmentDetail {
  knowledge_point_id: number;
  knowledge_point_name: string;
  old_mastery_level: 'mastered' | 'consolidating' | 'weak';
  new_mastery_level: 'mastered' | 'consolidating' | 'weak';
  action: 'skip' | 'add_practice' | 'add_micro_lesson' | 'increase_difficulty' | 'decrease_difficulty';
  reason: string;
}

// 路径调整日志文档接口
export interface IAILearningPathDynamic extends Document {
  user_id: number;
  learning_path_id: number;
  adjustment_type: 'knowledge_evaluation' | 'ability_adaptation' | 'progress_optimization';
  trigger_event: string;
  adjustment_details: IAdjustmentDetail[];
  learning_ability_tag: 'efficient' | 'steady' | 'basic';
  evaluation_score: number;
  adjustment_summary: string;
  created_at: Date;
}

// 调整详情Schema
const AdjustmentDetailSchema = new Schema({
  knowledge_point_id: { type: Number, required: true },
  knowledge_point_name: { type: String, required: true },
  old_mastery_level: { 
    type: String, 
    required: true, 
    enum: ['mastered', 'consolidating', 'weak']
  },
  new_mastery_level: { 
    type: String, 
    required: true, 
    enum: ['mastered', 'consolidating', 'weak']
  },
  action: { 
    type: String, 
    required: true, 
    enum: ['skip', 'add_practice', 'add_micro_lesson', 'increase_difficulty', 'decrease_difficulty']
  },
  reason: { type: String, required: true }
}, { _id: false });

// AI学习路径动态调整Schema
const AILearningPathDynamicSchema = new Schema<IAILearningPathDynamic>({
  user_id: { type: Number, required: true, index: true },
  learning_path_id: { type: Number, required: true, index: true },
  adjustment_type: { 
    type: String, 
    required: true, 
    enum: ['knowledge_evaluation', 'ability_adaptation', 'progress_optimization'],
    index: true
  },
  trigger_event: { type: String, required: true },
  adjustment_details: { type: [AdjustmentDetailSchema], required: true, default: [] },
  learning_ability_tag: { 
    type: String, 
    required: true, 
    enum: ['efficient', 'steady', 'basic']
  },
  evaluation_score: { type: Number, required: true },
  adjustment_summary: { type: String, required: true },
  created_at: { type: Date, required: true, default: Date.now }
}, {
  collection: 'ai_learning_path_dynamic',
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// 创建复合索引
AILearningPathDynamicSchema.index({ user_id: 1, learning_path_id: 1, created_at: -1 });
AILearningPathDynamicSchema.index({ user_id: 1, created_at: -1 });
AILearningPathDynamicSchema.index({ adjustment_type: 1, created_at: -1 });

// 导出模型
export const AILearningPathDynamic = mongoose.model<IAILearningPathDynamic>(
  'AILearningPathDynamic', 
  AILearningPathDynamicSchema
);
