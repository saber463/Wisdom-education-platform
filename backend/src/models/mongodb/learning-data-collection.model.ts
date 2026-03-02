import mongoose, { Schema, Document } from 'mongoose';

// 视频行为数据接口
interface IVideoData {
  pause_positions: number[];
  rewatch_segments: Array<{ start: number; end: number }>;
  fast_forward_rate: number;
  playback_speed: number;
  total_pauses: number;
  total_rewatch_count: number;
}

// 练习错误数据接口
interface IPracticeData {
  error_type: 'syntax' | 'logic' | 'performance' | 'runtime';
  knowledge_point_ids: number[];
  correct_rate: number;
  error_details: string;
  attempt_count: number;
}

// 完成数据接口
interface ICompletionData {
  completion_time: number; // 秒
  resource_views: number;
  interaction_count: number;
}

// 学习数据采集文档接口
export interface ILearningDataCollection extends Document {
  user_id: number;
  lesson_id: number;
  data_type: 'video' | 'practice' | 'completion';
  video_data?: IVideoData;
  practice_data?: IPracticeData;
  completion_data?: ICompletionData;
  collected_at: Date;
  session_id: string;
}

// 视频数据Schema
const VideoDataSchema = new Schema({
  pause_positions: { type: [Number], default: [] },
  rewatch_segments: [{
    start: { type: Number, required: true },
    end: { type: Number, required: true }
  }],
  fast_forward_rate: { type: Number, default: 0 },
  playback_speed: { type: Number, default: 1.0 },
  total_pauses: { type: Number, default: 0 },
  total_rewatch_count: { type: Number, default: 0 }
}, { _id: false });

// 练习数据Schema
const PracticeDataSchema = new Schema({
  error_type: { 
    type: String, 
    required: true, 
    enum: ['syntax', 'logic', 'performance', 'runtime']
  },
  knowledge_point_ids: { type: [Number], required: true },
  correct_rate: { type: Number, required: true, min: 0, max: 100 },
  error_details: { type: String, default: '' },
  attempt_count: { type: Number, default: 1 }
}, { _id: false });

// 完成数据Schema
const CompletionDataSchema = new Schema({
  completion_time: { type: Number, required: true },
  resource_views: { type: Number, default: 0 },
  interaction_count: { type: Number, default: 0 }
}, { _id: false });

// 学习数据采集Schema
const LearningDataCollectionSchema = new Schema<ILearningDataCollection>({
  user_id: { type: Number, required: true, index: true },
  lesson_id: { type: Number, required: true, index: true },
  data_type: { 
    type: String, 
    required: true, 
    enum: ['video', 'practice', 'completion'],
    index: true
  },
  video_data: { type: VideoDataSchema, default: null },
  practice_data: { type: PracticeDataSchema, default: null },
  completion_data: { type: CompletionDataSchema, default: null },
  collected_at: { type: Date, required: true, default: Date.now, index: true },
  session_id: { type: String, required: true, index: true }
}, {
  collection: 'learning_data_collection',
  timestamps: false
});

// 创建复合索引
LearningDataCollectionSchema.index({ user_id: 1, lesson_id: 1, collected_at: -1 });
LearningDataCollectionSchema.index({ user_id: 1, data_type: 1, collected_at: -1 });
LearningDataCollectionSchema.index({ collected_at: -1 });

// 导出模型
export const LearningDataCollection = mongoose.model<ILearningDataCollection>(
  'LearningDataCollection', 
  LearningDataCollectionSchema
);
