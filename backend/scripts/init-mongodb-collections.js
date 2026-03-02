import { connectMongoDB, closeMongoConnection } from '../src/config/mongodb.js';
import { VideoProgress, UserBehavior, Recommendation, CommunityPost, MindMapData, AILearningPathDynamic, VirtualLearningPartner } from '../src/models/mongodb/index.js';
/**
 * 初始化MongoDB集合和索引
 */
async function initMongoDBCollections() {
    try {
        console.log('开始初始化MongoDB集合...\n');
        // 连接到MongoDB
        await connectMongoDB();
        console.log('✓ MongoDB连接成功\n');
        // 创建集合和索引
        const collections = [
            { name: 'video_progress', model: VideoProgress },
            { name: 'user_behaviors', model: UserBehavior },
            { name: 'recommendations', model: Recommendation },
            { name: 'community_posts', model: CommunityPost },
            { name: 'mindmap_data', model: MindMapData },
            { name: 'ai_learning_path_dynamic', model: AILearningPathDynamic },
            { name: 'virtual_learning_partner', model: VirtualLearningPartner }
        ];
        for (const collection of collections) {
            console.log(`正在创建集合: ${collection.name}`);
            // 创建集合（如果不存在）
            await collection.model.createCollection();
            console.log(`  ✓ 集合 ${collection.name} 创建成功`);
            // 尝试删除可能冲突的索引
            try {
                const existingIndexes = await collection.model.collection.getIndexes();
                // 对于 virtual_learning_partner 集合，删除旧的 user_id_1 索引
                if (collection.name === 'virtual_learning_partner' && existingIndexes['user_id_1']) {
                    console.log(`  正在删除旧索引: user_id_1`);
                    await collection.model.collection.dropIndex('user_id_1');
                    console.log(`  ✓ 旧索引已删除`);
                }
            }
            catch (error) {
                // 索引不存在或删除失败，继续
                console.log(`  注意: 索引删除跳过 (${error instanceof Error ? error.message : String(error)})`);
            }
            // 创建索引
            try {
                await collection.model.createIndexes();
                console.log(`  ✓ 索引创建成功`);
            }
            catch (error) {
                console.log(`  警告: 索引创建部分失败 (${error instanceof Error ? error.message : String(error)})`);
            }
            // 获取索引信息
            const indexes = await collection.model.collection.getIndexes();
            console.log(`  ✓ 当前索引数量: ${Object.keys(indexes).length}`);
            console.log(`  索引列表:`);
            for (const [indexName, indexSpec] of Object.entries(indexes)) {
                console.log(`    - ${indexName}: ${JSON.stringify(indexSpec.key)}`);
            }
            console.log('');
        }
        console.log('✓ 所有MongoDB集合和索引初始化完成！\n');
        // 显示集合统计信息
        console.log('集合统计信息:');
        for (const collection of collections) {
            const count = await collection.model.countDocuments();
            console.log(`  - ${collection.name}: ${count} 条文档`);
        }
    }
    catch (error) {
        console.error('MongoDB集合初始化失败:', error);
        throw error;
    }
    finally {
        // 关闭连接
        await closeMongoConnection();
    }
}
// 执行初始化
initMongoDBCollections()
    .then(() => {
    console.log('\n初始化脚本执行完成');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n初始化脚本执行失败:', error);
    process.exit(1);
});
//# sourceMappingURL=init-mongodb-collections.js.map