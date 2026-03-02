import mysql from 'mysql2/promise';

async function updatePasswords() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'edu_education_platform',
    charset: 'utf8mb4'
  });

  try {
    const conn = await pool.getConnection();
    
    // Update teacher passwords
    await conn.execute(
      'UPDATE users SET password_hash = ? WHERE username LIKE "teacher%"',
      ['$2b$10$YPV2GbpcooWfvP22TDM9Du8pbjZjuFzOIZJOd5XQbbzgpITN1v14y']
    );
    console.log('✓ Updated teacher passwords');
    
    // Update student passwords
    await conn.execute(
      'UPDATE users SET password_hash = ? WHERE username LIKE "student%"',
      ['$2b$10$jfGiiRsRCgBLDvyApuwJre.EMZijqEjHzq49xfRzBX7tt0kmfwqge']
    );
    console.log('✓ Updated student passwords');
    
    // Update parent passwords
    await conn.execute(
      'UPDATE users SET password_hash = ? WHERE username LIKE "parent%"',
      ['$2b$10$4lZetbJifsp1MDu9Ocvq5Ohgrej6/qjbCBMj5CO5DDCs/4mGmvaK6']
    );
    console.log('✓ Updated parent passwords');
    
    console.log('\n✅ All passwords updated successfully!');
    conn.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords();
