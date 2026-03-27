const fs = require('fs');
const mysql = require('mysql2/promise');

async function run() {
  try {
    const sql = fs.readFileSync('../docs/sql/test-data.sql', 'utf8');
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'edu_education_platform',
      multipleStatements: true
    });
    console.log('Executing SQL...');
    await conn.query(sql);
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();