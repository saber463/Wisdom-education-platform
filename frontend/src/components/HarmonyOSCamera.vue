<template>
  <div class="harmonyos-camera">
    <el-button
      v-if="isSupported"
      type="primary"
      :icon="Camera"
      :loading="loading"
      @click="handleCapture"
    >
      {{ isHarmonyOS ? '鸿蒙相机拍照' : '拍照' }}
    </el-button>
    
    <el-button
      v-else
      type="info"
      disabled
    >
      相机不可用
    </el-button>
    
    <!-- 预览图片 -->
    <div
      v-if="previewUrl"
      class="preview-container"
    >
      <el-image
        :src="previewUrl"
        fit="contain"
        class="preview-image"
      >
        <template #error>
          <div class="image-error">
            <el-icon><Picture /></el-icon>
            <span>图片加载失败</span>
          </div>
        </template>
      </el-image>
      
      <div class="preview-actions">
        <el-button
          type="success"
          size="small"
          :loading="uploading"
          @click="handleUpload"
        >
          上传
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="handleClear"
        >
          清除
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Camera, Picture } from '@element-plus/icons-vue';
import { useHarmonyOSCamera } from '@/utils/harmonyos-camera';
import type { CameraOptions } from '@/utils/harmonyos-camera';

interface Props {
  uploadUrl?: string;
  cameraOptions?: CameraOptions;
  autoUpload?: boolean;
}

interface Emits {
  (e: 'capture', file: File, dataUrl: string): void;
  (e: 'upload', url: string): void;
  (e: 'error', error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  uploadUrl: '/api/upload',
  autoUpload: false,
  cameraOptions: () => ({
    quality: 0.9,
    maxWidth: 1920,
    maxHeight: 1080,
    facingMode: 'environment'
  })
});

const emit = defineEmits<Emits>();

const { isSupported, isHarmonyOS, capturePhoto, uploadPhoto } = useHarmonyOSCamera();

const loading = ref(false);
const uploading = ref(false);
const previewUrl = ref<string>();
const capturedFile = ref<File>();

/**
 * 处理拍照
 */
const handleCapture = async () => {
  loading.value = true;
  
  try {
    const result = await capturePhoto(props.cameraOptions);
    
    if (result.success && result.file && result.dataUrl) {
      capturedFile.value = result.file;
      previewUrl.value = result.dataUrl;
      
      emit('capture', result.file, result.dataUrl);
      
      ElMessage.success(isHarmonyOS ? '鸿蒙相机拍照成功' : '拍照成功');
      
      // 如果启用自动上传
      if (props.autoUpload) {
        await handleUpload();
      }
    } else {
      ElMessage.error(result.error || '拍照失败');
      emit('error', result.error || '拍照失败');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '拍照失败';
    ElMessage.error(errorMsg);
    emit('error', errorMsg);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理上传
 */
const handleUpload = async () => {
  if (!capturedFile.value) {
    ElMessage.warning('请先拍照');
    return;
  }
  
  uploading.value = true;
  
  try {
    const result = await uploadPhoto(capturedFile.value, props.uploadUrl);
    
    if (result.success && result.url) {
      ElMessage.success('上传成功');
      emit('upload', result.url);
      handleClear();
    } else {
      ElMessage.error(result.error || '上传失败');
      emit('error', result.error || '上传失败');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '上传失败';
    ElMessage.error(errorMsg);
    emit('error', errorMsg);
  } finally {
    uploading.value = false;
  }
};

/**
 * 清除预览
 */
const handleClear = () => {
  previewUrl.value = undefined;
  capturedFile.value = undefined;
};
</script>

<style scoped>
.harmonyos-camera {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background-color: #f5f7fa;
}

.preview-image {
  width: 100%;
  max-height: 400px;
  border-radius: 4px;
  overflow: hidden;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #909399;
}

.preview-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 鸿蒙设备优化 */
.harmonyos-optimized .harmonyos-camera {
  padding: var(--touch-padding, 12px);
}

.harmonyos-optimized .preview-image {
  max-height: 300px;
}
</style>
