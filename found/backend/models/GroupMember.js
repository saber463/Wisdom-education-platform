import mongoose from 'mongoose';

const GroupMemberSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, '请关联小组ID'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联用户ID'],
  },
  role: {
    type: String,
    enum: ['creator', 'admin', 'member'],
    default: 'member',
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
});

GroupMemberSchema.index({ group: 1, user: 1 }, { unique: true });
GroupMemberSchema.index({ user: 1 });
GroupMemberSchema.index({ group: 1, role: 1 });

export default mongoose.model('GroupMember', GroupMemberSchema);
