import mongoose, { Schema, Document } from 'mongoose';

// 暂停位置接口
interface IPausePosition {
  position: number;
  pause_duration: number;
  timestamp: Date;
}

// 热力图数据接口
interface IHeatMapData {
  start: number;
  end: number;
  count: number;
}

// 视频进度文档接口
export interface IVideoProgress extends Document {
  user_id: number;
  lesson_id: number;
  video_url: string;
  current_position: number;
  duration: number;
  progress_percentage: number;
  watch_count: number;
  total_watch_time: number;
  playback_speed: number;
  pause_positions: IPausePosition[];
  heat_map: IHeatMapData[];
  is_completed: boolean;
  completed_at?: Date;
  last_watched_at: Date;
  created_at: Date;
  updated_at: Date;
}

// 暂停位置Schema
const PausePositionSchema = new Schema({
  position: { type: Number, required: true },
  pause_duration: { type: Number, required: true },
  timestamp: { type: Date, required: true }
}, { _id: false });

// 热力图数据Schema
const HeatMapDataSchema = new Schema({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  count: { type: Number, required: true }
}, { _id: false });

// 视频进度Schema
const VideoProgressSchema = new Schema<IVideoProgress>({
  user_id: { type: Number, required: true, index: true },
  lesson_id: { type: Number, required: true, index: true },
  video_url: { type: String, required: true },
  current_position: { type: Number, required: true, default: 0 },
  duration: { type: Number, required: true, default: 0 },
  progress_percentage: { type: Number, required: true, default: 0 },
  watch_count: { type: Number, required: true, default: 0 },
  total_watch_time: { type: Number, required: true, default: 0 },
  playback_speed: { type: Number, required: true, default: 1.0 },
  pause_positions: { type: [PausePositionSchema], default: [] },
  heat_map: { type: [HeatMapDataSchema], default: [] },
  is_completed: { type: Boolean, required: true, default: false },
  completed_at: { type: Date },
  last_watched_at: { type: Date, required: true, default: Date.now },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now }
}, {
  collection: 'video_progress',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  bufferCommands: false
});

// 创建复合索引
VideoProgressSchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });
VideoProgressSchema.index({ user_id: 1, last_watched_at: -1 });
VideoProgressSchema.index({ lesson_id: 1 });

// 导出模型
export const VideoProgress = mongoose.model<IVideoProgress>('VideoProgress', VideoProgressSchema);
