import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function reloadTestData() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'edu_education_platform',
    charset: 'utf8mb4'
  });

  try {
    const conn = await pool.getConnection();
    
    // Read the SQL file
    const sqlFile = path.join(process.cwd(), 'docs/sql/test-data.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          await conn.execute(stmt);
          console.log(`✓ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          console.error(`✗ Error executing statement ${i + 1}:`, error instanceof Error ? error.message : error);
        }
      }
    }
    
    console.log('\n✅ Test data reloaded successfully!');
    conn.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

reloadTestData();
