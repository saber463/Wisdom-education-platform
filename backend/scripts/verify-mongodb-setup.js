/**
 * 验证MongoDB集合设置
 * 此脚本验证所有MongoDB模型和Schema定义是否正确
 */
import { VideoProgress, UserBehavior, Recommendation, CommunityPost, MindMapData, AILearningPathDynamic, VirtualLearningPartner } from '../src/models/mongodb/index.js';
console.log('开始验证MongoDB集合设置...\n');
// 验证模型定义
const models = [
    { name: 'VideoProgress', model: VideoProgress },
    { name: 'UserBehavior', model: UserBehavior },
    { name: 'Recommendation', model: Recommendation },
    { name: 'CommunityPost', model: CommunityPost },
    { name: 'MindMapData', model: MindMapData },
    { name: 'AILearningPathDynamic', model: AILearningPathDynamic },
    { name: 'VirtualLearningPartner', model: VirtualLearningPartner }
];
let allValid = true;
for (const { name, model } of models) {
    try {
        console.log(`验证模型: ${name}`);
        // 检查模型是否正确定义
        if (!model) {
            console.error(`  ✗ 模型未定义`);
            allValid = false;
            continue;
        }
        // 检查集合名称
        const collectionName = model.collection.name;
        console.log(`  ✓ 集合名称: ${collectionName}`);
        // 检查Schema
        const schema = model.schema;
        if (!schema) {
            console.error(`  ✗ Schema未定义`);
            allValid = false;
            continue;
        }
        // 获取Schema路径（字段）
        const paths = Object.keys(schema.paths);
        console.log(`  ✓ 字段数量: ${paths.length}`);
        // 获取索引
        const indexes = schema.indexes();
        console.log(`  ✓ 索引数量: ${indexes.length}`);
        // 显示索引详情
        if (indexes.length > 0) {
            console.log(`  索引详情:`);
            indexes.forEach((index, i) => {
                const fields = Object.keys(index[0]).join(', ');
                const options = index[1];
                const unique = options?.unique ? ' (唯一)' : '';
                console.log(`    ${i + 1}. ${fields}${unique}`);
            });
        }
        console.log('');
    }
    catch (error) {
        console.error(`  ✗ 验证失败:`, error);
        allValid = false;
    }
}
if (allValid) {
    console.log('✓ 所有MongoDB集合设置验证通过！\n');
    console.log('注意事项:');
    console.log('1. 确保MongoDB服务正在运行');
    console.log('2. 运行 tsx backend/scripts/init-mongodb-collections.ts 来初始化集合和索引');
    console.log('3. 配置 .env 文件中的 MONGODB_URI');
    process.exit(0);
}
else {
    console.error('✗ 部分MongoDB集合设置验证失败\n');
    process.exit(1);
}
//# sourceMappingURL=verify-mongodb-setup.js.map