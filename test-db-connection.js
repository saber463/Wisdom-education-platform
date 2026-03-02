// 测试数据库连接和表结构
const mysql = require('mysql2/promise');

async function testDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'edu_education_platform'
    });

    console.log('✅ 数据库连接成功');

    // 检查表数量
    const [tables] = await connection.execute(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?',
      ['edu_education_platform']
    );
    console.log(`📊 表数量: ${tables[0].count}`);

    // 列出所有表
    const [tableList] = await connection.execute(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name',
      ['edu_education_platform']
    );
    console.log('\n📋 数据库表列表:');
    tableList.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.TABLE_NAME}`);
    });

    // 检查关键表的记录数
    const keyTables = ['users', 'assignments', 'classes'];
    console.log('\n📈 关键表记录数:');
    for (const table of keyTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${rows[0].count} 条记录`);
      } catch (err) {
        console.log(`  ${table}: 表不存在或查询失败`);
      }
    }

    await connection.end();
    console.log('\n✅ 数据库检查完成');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

testDatabase();
