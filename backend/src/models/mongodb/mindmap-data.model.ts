import mongoose, { Schema, Document } from 'mongoose';

// 节点位置接口
interface IPosition {
  x: number;
  y: number;
}

// 节点样式接口
interface INodeStyle {
  color: string;
  icon?: string;
}

// 思维导图节点接口
interface IMindMapNode {
  id: string;
  label: string;
  type: 'root' | 'branch' | 'leaf';
  step_id?: number;
  status: 'locked' | 'current' | 'completed';
  position: IPosition;
  style: INodeStyle;
}

// 思维导图边接口
interface IMindMapEdge {
  source: string;
  target: string;
  type: 'required' | 'optional' | 'prerequisite';
}

// 思维导图数据文档接口
export interface IMindMapData extends Document {
  learning_path_id: number;
  user_id: number;
  nodes: IMindMapNode[];
  edges: IMindMapEdge[];
  layout: 'tree' | 'radial' | 'force';
  created_at: Date;
  updated_at: Date;
}

// 位置Schema
const PositionSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { _id: false });

// 节点样式Schema
const NodeStyleSchema = new Schema({
  color: { type: String, required: true },
  icon: { type: String }
}, { _id: false });

// 节点Schema
const MindMapNodeSchema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['root', 'branch', 'leaf']
  },
  step_id: { type: Number },
  status: { 
    type: String, 
    required: true, 
    enum: ['locked', 'current', 'completed']
  },
  position: { type: PositionSchema, required: true },
  style: { type: NodeStyleSchema, required: true }
}, { _id: false });

// 边Schema
const MindMapEdgeSchema = new Schema({
  source: { type: String, required: true },
  target: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['required', 'optional', 'prerequisite']
  }
}, { _id: false });

// 思维导图数据Schema
const MindMapDataSchema = new Schema<IMindMapData>({
  learning_path_id: { type: Number, required: true, index: true },
  user_id: { type: Number, required: true, index: true },
  nodes: { type: [MindMapNodeSchema], required: true, default: [] },
  edges: { type: [MindMapEdgeSchema], required: true, default: [] },
  layout: { 
    type: String, 
    required: true, 
    enum: ['tree', 'radial', 'force'],
    default: 'tree'
  },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now }
}, {
  collection: 'mindmap_data',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 创建复合索引
MindMapDataSchema.index({ learning_path_id: 1, user_id: 1 }, { unique: true });
MindMapDataSchema.index({ user_id: 1 });

// 导出模型
export const MindMapData = mongoose.model<IMindMapData>('MindMapData', MindMapDataSchema);
