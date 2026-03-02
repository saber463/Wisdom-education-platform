/**
 * 批量优化 property-based 测试的 numRuns 配置
 * 将 numRuns: 100 替换为 numRuns: 20
 */

const fs = require('fs');
const path = require('path');

// 需要处理的文件列表
const files = [
  // Frontend
  'frontend/src/views/teacher/__tests__/assignments.property.test.ts',
  'frontend/src/views/teacher/__tests__/analytics.property.test.ts',
  'frontend/src/views/student/__tests__/result-detail.property.test.ts',
  'frontend/src/views/parent/__tests__/weak-points.property.test.ts',
  'frontend/src/views/parent/__tests__/monitor.property.test.ts',
  'frontend/src/utils/__tests__/harmonyos-push.property.test.ts',
  'frontend/src/utils/__tests__/harmonyos-camera.property.test.ts',
  'frontend/src/utils/__tests__/harmonyos-adaptation.property.test.ts',
  'frontend/src/components/__tests__/push-message-link.property.test.ts',
  // Backend
  'backend/src/services/__tests__/resource-monitor.property.test.ts',
  'backend/src/services/__tests__/health-monitor.property.test.ts',
  'backend/src/services/__tests__/push-service.property.test.ts',
  'backend/src/services/__tests__/blue-screen-recovery.property.test.ts',
  'backend/src/routes/__tests__/analytics-properties.test.ts',
  'backend/src/routes/__tests__/assignments-properties.test.ts',
  'backend/src/routes/__tests__/grading-properties.test.ts',
  'backend/src/routes/__tests__/learning-analytics-reports.property.test.ts',
  'backend/src/routes/__tests__/notification-properties.test.ts',
  'backend/src/routes/__tests__/offline-properties.test.ts',
  'backend/src/routes/__tests__/qa-properties.test.ts',
  'backend/src/routes/__tests__/recommendations-properties.test.ts',
  'backend/src/routes/__tests__/resource-recommendations-properties.test.ts',
  'backend/src/routes/__tests__/speech-assessment.property.test.ts',
  'backend/src/routes/__tests__/teams-property.test.ts',
  'backend/src/routes/__tests__/tiered-teaching-properties.test.ts',
  'backend/src/routes/__tests__/upload-properties.test.ts',
  'backend/scripts/__tests__/database-backup.property.test.ts',
  'backend/scripts/__tests__/demo-data-reset.property.test.ts',
  'backend/scripts/__tests__/emergency-repair.property.test.ts',
  'backend/scripts/__tests__/service-shutdown.property.test.ts',
  'backend/scripts/__tests__/startup-order.property.test.ts',
];

let totalReplacements = 0;
let filesModified = 0;

files.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  文件不存在: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // 替换 numRuns: 100 为 numRuns: 20
    content = content.replace(/numRuns:\s*100/g, 'numRuns: 20');
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      const count = (originalContent.match(/numRuns:\s*100/g) || []).length;
      totalReplacements += count;
      filesModified++;
      console.log(`✅ ${filePath} - 替换了 ${count} 处`);
    } else {
      console.log(`⏭️  ${filePath} - 无需修改`);
    }
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
  }
});

console.log('\n========================================');
console.log(`优化完成！`);
console.log(`修改文件数: ${filesModified}`);
console.log(`总替换次数: ${totalReplacements}`);
console.log('========================================\n');
