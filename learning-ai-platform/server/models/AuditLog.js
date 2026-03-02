import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'error'],
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    username: {
      type: String,
      index: true,
    },

    ipAddress: {
      type: String,
      index: true,
    },

    userAgent: {
      type: String,
    },

    resourceType: {
      type: String,
      index: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    beforeData: {
      type: mongoose.Schema.Types.Mixed,
    },

    afterData: {
      type: mongoose.Schema.Types.Mixed,
    },

    result: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
      index: true,
    },

    errorMessage: {
      type: String,
    },

    path: {
      type: String,
      index: true,
    },

    method: {
      type: String,
      index: true,
    },

    statusCode: {
      type: Number,
      index: true,
    },

    duration: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', AuditLogSchema);
