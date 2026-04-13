import mongoose, { Schema, Document } from 'mongoose';

// 代码块接口
interface ICodeBlock {
  language: string;
  code: string;
}

// 社区帖子文档接口
export interface ICommunityPost extends Document {
  user_id: number;
  post_type: 'forum' | 'question' | 'dynamic';
  title: string;
  content: string;
  code_blocks: ICodeBlock[];
  images: string[];
  tags: string[];
  related_course_id?: number;
  related_knowledge_point_id?: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_featured: boolean;
  status: 'published' | 'hidden' | 'deleted';
  created_at: Date;
  updated_at: Date;
}

// 代码块Schema
const CodeBlockSchema = new Schema({
  language: { type: String, required: true },
  code: { type: String, required: true }
}, { _id: false });

// 社区帖子Schema
const CommunityPostSchema = new Schema<ICommunityPost>({
  user_id: { type: Number, required: true, index: true },
  post_type: { 
    type: String, 
    required: true, 
    enum: ['forum', 'question', 'dynamic'],
    index: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  code_blocks: { type: [CodeBlockSchema], default: [] },
  images: { type: [String], default: [] },
  tags: { type: [String], default: [], index: true },
  related_course_id: { type: Number, index: true },
  related_knowledge_point_id: { type: Number },
  view_count: { type: Number, required: true, default: 0 },
  like_count: { type: Number, required: true, default: 0 },
  comment_count: { type: Number, required: true, default: 0 },
  is_pinned: { type: Boolean, required: true, default: false },
  is_featured: { type: Boolean, required: true, default: false },
  status: { 
    type: String, 
    required: true, 
    enum: ['published', 'hidden', 'deleted'],
    default: 'published'
  },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now }
}, {
  collection: 'community_posts',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  bufferCommands: false
});

// 创建索引
CommunityPostSchema.index({ user_id: 1, created_at: -1 });
CommunityPostSchema.index({ post_type: 1, created_at: -1 });
CommunityPostSchema.index({ tags: 1 });
CommunityPostSchema.index({ related_course_id: 1 });

// 导出模型
export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
