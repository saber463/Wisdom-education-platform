/**
 * Task 8.1 & 8.2: Fix Test Script Data Mismatch
 * 
 * This script:
 * 1. Unifies username format (removes underscores from test usernames)
 * 2. Fixes password hashes to be compatible with login interface (bcrypt saltRounds=10)
 * 3. Ensures test data consistency
 * 
 * Usage: npx ts-node scripts/task8-fix-test-data.ts
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const SALT_ROUNDS = 10;
const TEST_PASSWORD = 'password123';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edu_education_platform',
  charset: 'utf8mb4'
};

interface User {
  id: number;
  username: string;
  password_hash: string;
  real_name: string;
  role: string;
}

/**
 * Log with ISO timestamp
 */
function log(message: string, level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: '📋',
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '❌'
  }[level];
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Main function to fix test data
 */
async function fixTestData() {
  let pool: mysql.Pool | null = null;
  
  try {
    log('='.repeat(80), 'INFO');
    log('Task 8: Fix Test Script Data Mismatch', 'INFO');
    log('='.repeat(80), 'INFO');
    log('', 'INFO');
    
    // Create connection pool
    log('Connecting to database...', 'INFO');
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    log(`Connected to database: ${dbConfig.database}`, 'SUCCESS');
    
    // ========================================
    // Task 8.1: Unify Username Format
    // ========================================
    log('', 'INFO');
    log('Task 8.1: Unifying username format (removing underscores)...', 'INFO');
    log('-'.repeat(80), 'INFO');
    
    // Find all test users with underscores
    const [usersWithUnderscores] = await connection.query<User[]>(
      `SELECT id, username, real_name, role 
       FROM users 
       WHERE username LIKE 'test\\_%' 
       ORDER BY username`
    );
    
    if (usersWithUnderscores.length === 0) {
      log('No test users with underscores found', 'INFO');
    } else {
      log(`Found ${usersWithUnderscores.length} test users with underscores:`, 'INFO');
      
      for (const user of usersWithUnderscores) {
        const oldUsername = user.username;
        const newUsername = oldUsername.replace(/_/g, '');
        
        try {
          // Check if new username already exists
          const [existing] = await connection.query<User[]>(
            'SELECT id FROM users WHERE username = ?',
            [newUsername]
          );
          
          if (existing.length > 0) {
            log(`  ⚠️  Username ${newUsername} already exists, skipping ${oldUsername}`, 'WARNING');
            continue;
          }
          
          // Update username
          await connection.query(
            'UPDATE users SET username = ? WHERE id = ?',
            [newUsername, user.id]
          );
          
          log(`  ✓ Updated: ${oldUsername} → ${newUsername} (${user.real_name}, ${user.role})`, 'SUCCESS');
        } catch (error) {
          log(`  ✗ Failed to update ${oldUsername}: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
        }
      }
    }
    
    // ========================================
    // Task 8.2: Fix Password Hashes
    // ========================================
    log('', 'INFO');
    log('Task 8.2: Fixing password hashes (bcrypt saltRounds=10)...', 'INFO');
    log('-'.repeat(80), 'INFO');
    
    // Generate correct bcrypt hash
    log(`Generating bcrypt hash for password: "${TEST_PASSWORD}" (saltRounds=${SALT_ROUNDS})...`, 'INFO');
    const correctHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);
    log(`Generated hash: ${correctHash}`, 'INFO');
    
    // Verify the hash works
    const isValid = await bcrypt.compare(TEST_PASSWORD, correctHash);
    if (!isValid) {
      throw new Error('Generated hash verification failed!');
    }
    log('Hash verification: PASSED', 'SUCCESS');
    
    // Find all test users
    const [testUsers] = await connection.query<User[]>(
      `SELECT id, username, password_hash, real_name, role 
       FROM users 
       WHERE username LIKE 'test%' 
       ORDER BY username`
    );
    
    if (testUsers.length === 0) {
      log('No test users found', 'WARNING');
    } else {
      log(`Found ${testUsers.length} test users to update:`, 'INFO');
      
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const user of testUsers) {
        try {
          // Check if current hash is already correct
          const isCurrentHashValid = await bcrypt.compare(TEST_PASSWORD, user.password_hash);
          
          if (isCurrentHashValid) {
            log(`  ⊙ Skipped: ${user.username} (hash already valid)`, 'INFO');
            skippedCount++;
            continue;
          }
          
          // Update password hash
          await connection.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [correctHash, user.id]
          );
          
          log(`  ✓ Updated: ${user.username} (${user.real_name}, ${user.role})`, 'SUCCESS');
          updatedCount++;
        } catch (error) {
          log(`  ✗ Failed to update ${user.username}: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
        }
      }
      
      log('', 'INFO');
      log(`Password hash update summary:`, 'INFO');
      log(`  - Total test users: ${testUsers.length}`, 'INFO');
      log(`  - Updated: ${updatedCount}`, 'SUCCESS');
      log(`  - Skipped (already valid): ${skippedCount}`, 'INFO');
    }
    
    // ========================================
    // Summary
    // ========================================
    log('', 'INFO');
    log('='.repeat(80), 'INFO');
    log('Task 8.1 & 8.2: COMPLETED', 'SUCCESS');
    log('='.repeat(80), 'INFO');
    log('', 'INFO');
    log('Next steps:', 'INFO');
    log('  1. Run verification script: npx ts-node scripts/task8-verify-test-data.ts', 'INFO');
    log('  2. Run all test scripts: bash test-scripts/task8-run-all-tests.sh', 'INFO');
    log('', 'INFO');
    
    connection.release();
    
  } catch (error) {
    log(`Fatal error: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      log('Database connection closed', 'INFO');
    }
  }
}

// Run the script
fixTestData();
