/**
 * Task 8.3: Verify Test Data Consistency
 * 
 * This script verifies:
 * 1. Username format (no underscores in test usernames)
 * 2. Password hash compatibility (bcrypt with saltRounds=10)
 * 3. Class associations (students properly linked to classes)
 * 4. Assignment data (assignments properly linked to classes and teachers)
 * 
 * Usage: npx ts-node scripts/task8-verify-test-data.ts
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
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

interface ClassStudent {
  class_id: number;
  student_id: number;
  student_username: string;
  class_name: string;
}

interface Assignment {
  id: number;
  title: string;
  class_id: number;
  teacher_id: number;
  class_name: string;
  teacher_username: string;
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
 * Main verification function
 */
async function verifyTestData() {
  let pool: mysql.Pool | null = null;
  let allChecksPassed = true;
  
  try {
    log('='.repeat(80), 'INFO');
    log('Task 8.3: Verify Test Data Consistency', 'INFO');
    log('='.repeat(80), 'INFO');
    log('', 'INFO');
    
    // Create connection pool
    log('Connecting to database...', 'INFO');
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    log(`Connected to database: ${dbConfig.database}`, 'SUCCESS');
    
    // ========================================
    // Check 1: Username Format
    // ========================================
    log('', 'INFO');
    log('Check 1: Verifying username format (no underscores)...', 'INFO');
    log('-'.repeat(80), 'INFO');
    
    const [usersWithUnderscores] = await connection.query<User[]>(
      `SELECT id, username, real_name, role 
       FROM users 
       WHERE username LIKE 'test\\_%' 
       ORDER BY username`
    );
    
    if (usersWithUnderscores.length === 0) {
      log('✓ All test usernames are in correct format (no underscores)', 'SUCCESS');
    } else {
      log(`✗ Found ${usersWithUnderscores.length} test users with underscores:`, 'ERROR');
      usersWithUnderscores.forEach(user => {
        log(`  - ${user.username} (${user.real_name}, ${user.role})`, 'ERROR');
      });
      allChecksPassed = false;
    }
    
    // ========================================
    // Check 2: Password Hash Compatibility
    // ========================================
    log('', 'INFO');
    log('Check 2: Verifying password hash compatibility...', 'INFO');
    log('-'.repeat(80), 'INFO');
    
    const [testUsers] = await connection.query<User[]>(
      `SELECT id, username, password_hash, real_name, role 
       FROM users 
       WHERE username LIKE 'test%' 
       ORDER BY username`
    );
    
    if (testUsers.length === 0) {
      log('⚠️  No test users found', 'WARNING');
    } else {
      log(`Checking ${testUsers.length} test users...`, 'INFO');
      
      let validCount = 0;
      let invalidCount = 0;
      
      for (const user of testUsers) {
        try {
          const isValid = await bcrypt.compare(TEST_PASSWORD, user.password_hash);
          
          if (isValid) {
            log(`  ✓ ${user.username}: Password hash is valid`, 'SUCCESS');
            validCount++;
          } else {
            log(`  ✗ ${user.username}: Password hash is INVALID`, 'ERROR');
            invalidCount++;
            allChecksPassed = false;
          }
        } catch (error) {
          log(`  ✗ ${user.username}: Error verifying hash - ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
          invalidCount++;
          allChecksPassed = false;
        }
      }
      
      log('', 'INFO');
      log(`Password hash verification summary:`, 'INFO');
      log(`  - Total: ${testUsers.length}`, 'INFO');
      log(`  - Valid: ${validCount}`, validCount === testUsers.length ? 'SUCCESS' : 'INFO');
      log(`  - Invalid: ${invalidCount}`, invalidCount === 0 ? 'INFO' : 'ERROR');
    }
    
    // ========================================
    // Check 3: Class Associations
    // ========================================
    log('', 'INFO');
    log('Check 3: Verifying class associations...', 'INFO');
    log('-'.repeat(80), 'INFO');
    
    // Check for orphaned class_students records
    const [orphanedClassStudents] = await connection.query<any[]>(
      `SELECT cs.id, cs.class_id, cs.student_id
       FROM class_students cs
       LEFT JOIN classes c ON cs.class_id = c.id
       LEFT JOIN users u ON cs.student_id = u.id
       WHERE c.id IS NULL OR u.id IS NULL`
    );
    
    if (orphanedClassStudents.length === 0) {
      log('✓ No orphaned class-student associations found', 'SUCCESS');
    } else {
      log(`✗ Found ${orphanedClassStudents.length} orphaned class-student associations:`, 'ERROR');
      orphanedClassStudents.forEach(record => {
        log(`  - Record ID: ${record.id}, Class ID: ${record.class_id}, Student ID: ${record.student_id}`, 'ERROR');
      });
      allChecksPassed = false;
    }
    
    // Check test students in classes
    const [testStudentsInClasses] = await connection.query<ClassStudent[]>(
      `SELECT cs.class_id, cs.student_id, u.username as student_username, c.name as class_name
       FROM class_students cs
       JOIN users u ON cs.student_id = u.id
       JOIN classes c ON cs.class_id = c.id
       WHERE u.username LIKE 'test%' AND u.role = 'student'
       ORDER BY c.name, u.username`
    );
    
    if (testStudentsInClasses.length === 0) {
      log('⚠️  No test students found in classes', 'WARNING');
    } else {
      log(`✓ Found ${testStudentsInClasses.length} test students properly associated with classes`, 'SUCCESS');
      
      // Group by class
      const classCounts: { [key: string]: number } = {};
      testStudentsInClasses.forEach(record => {
        classCounts[record.class_name] = (classCounts[record.class_name] || 0) + 1;
      });
      
      Object.entries(classCounts).forEach(([className, count]) => {
        log(`  - ${className}: ${count} test students`, 'INFO');
      });
    }
    
    // ========================================
    // Check 4: Assignment Data
    // ========================================
    log('', 'INFO');
    log('Check 4: Verifying assignment data...', 'INFO');
    log('-'.repeat(80), 'INFO');
    
    // Check for orphaned assignments
    const [orphanedAssignments] = await connection.query<any[]>(
      `SELECT a.id, a.title, a.class_id, a.teacher_id
       FROM assignments a
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN users u ON a.teacher_id = u.id
       WHERE c.id IS NULL OR u.id IS NULL`
    );
    
    if (orphanedAssignments.length === 0) {
      log('✓ No orphaned assignments found', 'SUCCESS');
    } else {
      log(`✗ Found ${orphanedAssignments.length} orphaned assignments:`, 'ERROR');
      orphanedAssignments.forEach(record => {
        log(`  - Assignment ID: ${record.id}, Title: ${record.title}, Class ID: ${record.class_id}, Teacher ID: ${record.teacher_id}`, 'ERROR');
      });
      allChecksPassed = false;
    }
    
    // Check test assignments
    const [testAssignments] = await connection.query<Assignment[]>(
      `SELECT a.id, a.title, a.class_id, a.teacher_id, c.name as class_name, u.username as teacher_username
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN users u ON a.teacher_id = u.id
       WHERE a.title LIKE '%test%' OR a.title LIKE '%测试%'
       ORDER BY a.id`
    );
    
    if (testAssignments.length === 0) {
      log('⚠️  No test assignments found', 'WARNING');
    } else {
      log(`✓ Found ${testAssignments.length} test assignments properly configured`, 'SUCCESS');
      testAssignments.slice(0, 5).forEach(assignment => {
        log(`  - "${assignment.title}" (Class: ${assignment.class_name}, Teacher: ${assignment.teacher_username})`, 'INFO');
      });
      if (testAssignments.length > 5) {
        log(`  ... and ${testAssignments.length - 5} more`, 'INFO');
      }
    }
    
    // Check for questions without assignments
    const [orphanedQuestions] = await connection.query<any[]>(
      `SELECT q.id, q.assignment_id
       FROM questions q
       LEFT JOIN assignments a ON q.assignment_id = a.id
       WHERE a.id IS NULL`
    );
    
    if (orphanedQuestions.length === 0) {
      log('✓ No orphaned questions found', 'SUCCESS');
    } else {
      log(`✗ Found ${orphanedQuestions.length} orphaned questions:`, 'ERROR');
      orphanedQuestions.slice(0, 5).forEach(record => {
        log(`  - Question ID: ${record.id}, Assignment ID: ${record.assignment_id}`, 'ERROR');
      });
      if (orphanedQuestions.length > 5) {
        log(`  ... and ${orphanedQuestions.length - 5} more`, 'ERROR');
      }
      allChecksPassed = false;
    }
    
    // ========================================
    // Summary
    // ========================================
    log('', 'INFO');
    log('='.repeat(80), 'INFO');
    if (allChecksPassed) {
      log('Task 8.3: ALL CHECKS PASSED ✅', 'SUCCESS');
    } else {
      log('Task 8.3: SOME CHECKS FAILED ❌', 'ERROR');
    }
    log('='.repeat(80), 'INFO');
    log('', 'INFO');
    
    if (!allChecksPassed) {
      log('Please fix the issues above before proceeding to Task 8.4', 'WARNING');
      log('You can re-run the fix script: npx ts-node scripts/task8-fix-test-data.ts', 'INFO');
    } else {
      log('Test data is consistent and ready for testing!', 'SUCCESS');
      log('Next step: Run all test scripts with bash test-scripts/task8-run-all-tests.sh', 'INFO');
    }
    log('', 'INFO');
    
    connection.release();
    
    // Exit with appropriate code
    process.exit(allChecksPassed ? 0 : 1);
    
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
verifyTestData();
