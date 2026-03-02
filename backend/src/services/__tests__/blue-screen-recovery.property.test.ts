/**
 * Property Test: Blue Screen Recovery Integrity
 * Feature: smart-education-platform, Property 44: Blue Screen Recovery Integrity
 * Validates Requirements: 10.9
 * 
 * Property: When system recovers from blue screen restart, it should automatically restore all code, data and service state
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  detectBlueScreenTraces,
  performBlueScreenRecovery,
  createAbnormalShutdownFlag,
  removeAbnormalShutdownFlag,
  shouldPerformRecovery
} from '../blue-screen-recovery.js';

// Test configuration
const TEST_CONFIG = {
  TEMP_DIR: os.tmpdir(),
  ABNORMAL_SHUTDOWN_FLAG: path.join(os.tmpdir(), 'abnormal_shutdown.flag'),
  RECOVERY_COMPLETED_FLAG: path.join(os.tmpdir(), 'recovery_completed.flag'),
  TEST_CRASH_LOG: path.join(__dirname, '../../../logs/crash.log')
};

// Mock console.log to suppress recovery logs during tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('Property 44: Blue Screen Recovery Integrity', () => {
  beforeEach(() => {
    // Clean up test flag files
    if (fs.existsSync(TEST_CONFIG.ABNORMAL_SHUTDOWN_FLAG)) {
      fs.unlinkSync(TEST_CONFIG.ABNORMAL_SHUTDOWN_FLAG);
    }
    if (fs.existsSync(TEST_CONFIG.RECOVERY_COMPLETED_FLAG)) {
      fs.unlinkSync(TEST_CONFIG.RECOVERY_COMPLETED_FLAG);
    }
  });

  afterEach(() => {
    // Clean up test flag files
    if (fs.existsSync(TEST_CONFIG.ABNORMAL_SHUTDOWN_FLAG)) {
      fs.unlinkSync(TEST_CONFIG.ABNORMAL_SHUTDOWN_FLAG);
    }
    if (fs.existsSync(TEST_CONFIG.RECOVERY_COMPLETED_FLAG)) {
      fs.unlinkSync(TEST_CONFIG.RECOVERY_COMPLETED_FLAG);
    }
  });

  it('Property 1: Blue screen detection should return valid detection results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2 }),
        async (iterations) => {
          for (let i = 0; i < iterations; i++) {
            const detection = await detectBlueScreenTraces();
            
            // Verify: Detection result should contain required fields
            expect(detection).toHaveProperty('detected');
            expect(detection).toHaveProperty('traces');
            expect(detection).toHaveProperty('timestamp');
            
            // Verify: Field types are correct
            expect(typeof detection.detected).toBe('boolean');
            expect(Array.isArray(detection.traces)).toBe(true);
            expect(detection.timestamp instanceof Date).toBe(true);
            
            // Verify: If blue screen detected, traces array should not be empty
            if (detection.detected) {
              expect(detection.traces.length).toBeGreaterThan(0);
            }
            
            // Verify: Each element in traces array should be a string
            for (const trace of detection.traces) {
              expect(typeof trace).toBe('string');
              expect(trace.length).toBeGreaterThan(0);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('Property 2: Abnormal shutdown flag should be created and deleted correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (cycles) => {
          for (let i = 0; i < cycles; i++) {
            // Create flag
            createAbnormalShutdownFlag();
            
            // Verify: Flag file should exist
            expect(fs.existsSync(TEST_CONFIG.ABNORMAL_SHUTDOWN_FLAG)).toBe(true);
            
            // Verify: Flag file should contain timestamp
            const content = fs.readFileSync(TEST_CONFIG.ABNORMAL_SHUTDOWN_FLAG, 'utf8');
            expect(content).toContain('Created at');
            expect(content.length).toBeGreaterThan(0);
            
            // Delete flag
            removeAbnormalShutdownFlag();
            
            // Verify: Flag file should be deleted
            expect(fs.existsSync(TEST_CONFIG.ABNORMAL_SHUTDOWN_FLAG)).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 3: Recovery process should return complete recovery results', async () => {
    // Note: This test may take longer as it involves actual recovery operations
    const result = await performBlueScreenRecovery();
    
    // Verify: Recovery result should contain required fields
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('steps');
    expect(result).toHaveProperty('startTime');
    expect(result).toHaveProperty('endTime');
    expect(result).toHaveProperty('duration');
    
    // Verify: Field types are correct
    expect(typeof result.success).toBe('boolean');
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.startTime instanceof Date).toBe(true);
    expect(result.endTime instanceof Date).toBe(true);
    expect(typeof result.duration).toBe('number');
    
    // Verify: Duration should be positive
    expect(result.duration).toBeGreaterThan(0);
    
    // Verify: End time should be later than or equal to start time
    expect(result.endTime.getTime()).toBeGreaterThanOrEqual(result.startTime.getTime());
    
    // Verify: Steps array should not be empty
    expect(result.steps.length).toBeGreaterThan(0);
    
    // Verify: Each step should contain required fields
    for (const step of result.steps) {
      expect(step).toHaveProperty('step');
      expect(step).toHaveProperty('success');
      expect(step).toHaveProperty('message');
      expect(step).toHaveProperty('timestamp');
      
      expect(typeof step.step).toBe('string');
      expect(typeof step.success).toBe('boolean');
      expect(typeof step.message).toBe('string');
      expect(step.timestamp instanceof Date).toBe(true);
    }
  }, 60000); // Set 60 second timeout

  it('Property 4: Recovery process should include all required steps', async () => {
    const result = await performBlueScreenRecovery();
    
    // Verify: Should include detection step
    const detectionStep = result.steps.find(s => s.step === 'detection');
    expect(detectionStep).toBeDefined();
    
    // Verify: Should include code recovery step
    const codeRecoveryStep = result.steps.find(s => s.step === 'code_recovery');
    expect(codeRecoveryStep).toBeDefined();
    
    // Verify: Should include database repair step
    const dbRepairStep = result.steps.find(s => s.step === 'database_repair');
    expect(dbRepairStep).toBeDefined();
    
    // Verify: Should include service restart step
    const serviceRestartStep = result.steps.find(s => s.step === 'service_restart');
    expect(serviceRestartStep).toBeDefined();
    
    // Verify: Steps should be executed in order
    expect(result.steps[0].step).toBe('detection');
    expect(result.steps[1].step).toBe('code_recovery');
    expect(result.steps[2].step).toBe('database_repair');
    expect(result.steps[3].step).toBe('service_restart');
  }, 60000);

  it('Property 5: Recovery completion flag should be created after successful recovery', async () => {
    const result = await performBlueScreenRecovery();
    
    if (result.success) {
      // Verify: Recovery completion flag should exist
      expect(fs.existsSync(TEST_CONFIG.RECOVERY_COMPLETED_FLAG)).toBe(true);
      
      // Verify: Flag file should contain completion time
      const content = fs.readFileSync(TEST_CONFIG.RECOVERY_COMPLETED_FLAG, 'utf8');
      expect(content).toContain('Recovery completed at');
      
      // Verify: Abnormal shutdown flag should be deleted
      expect(fs.existsSync(TEST_CONFIG.ABNORMAL_SHUTDOWN_FLAG)).toBe(false);
    }
  }, 60000);

  it('Property 6: shouldPerformRecovery should return correct value based on detection results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2 }),
        async (iterations) => {
          for (let i = 0; i < iterations; i++) {
            const shouldRecover = await shouldPerformRecovery();
            
            // Verify: Return value should be boolean
            expect(typeof shouldRecover).toBe('boolean');
            
            // Verify: Return value should match detection result
            const detection = await detectBlueScreenTraces();
            expect(shouldRecover).toBe(detection.detected);
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('Property 7: Recovery process should complete within reasonable time', async () => {
    const result = await performBlueScreenRecovery();
    
    // Verify: Recovery process should complete within 5 minutes
    const maxDuration = 5 * 60 * 1000; // 5 minutes
    expect(result.duration).toBeLessThan(maxDuration);
    
    // Verify: Each step's timestamp should be within reasonable range
    for (let i = 1; i < result.steps.length; i++) {
      const prevStep = result.steps[i - 1];
      const currStep = result.steps[i];
      
      // Current step timestamp should be later than or equal to previous step
      expect(currStep.timestamp.getTime()).toBeGreaterThanOrEqual(prevStep.timestamp.getTime());
    }
  }, 60000);

  it('Property 8: Abnormal shutdown flag should trigger recovery detection', async () => {
    // Create abnormal shutdown flag
    createAbnormalShutdownFlag();
    
    // Verify: Should detect need for recovery
    const shouldRecover = await shouldPerformRecovery();
    expect(shouldRecover).toBe(true);
    
    // Verify: Detection result should include abnormal shutdown flag
    const detection = await detectBlueScreenTraces();
    expect(detection.detected).toBe(true);
    expect(detection.traces.some(t => t.includes('异常关机标记'))).toBe(true);
    
    // Cleanup
    removeAbnormalShutdownFlag();
  });

  it('Property 9: Recovery process should set low resource mode environment variables', async () => {
    const result = await performBlueScreenRecovery();
    
    // Verify: Service restart step should succeed
    const serviceRestartStep = result.steps.find(s => s.step === 'service_restart');
    expect(serviceRestartStep).toBeDefined();
    
    if (serviceRestartStep && serviceRestartStep.success) {
      // Verify: Environment variables should be set
      expect(process.env.NODE_OPTIONS).toContain('--max-old-space-size');
      expect(process.env.CARGO_BUILD_JOBS).toBe('1');
      expect(process.env.PYTHONOPTIMIZE).toBe('1');
      expect(process.env.RUST_BACKTRACE).toBe('0');
    }
  }, 60000);

  it('Property 10: Recovery process should log detailed information', async () => {
    const logDir = path.join(__dirname, '../../../logs');
    const logFile = path.join(logDir, 'blue-screen-recovery.log');
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Record initial log file size
    const initialSize = fs.existsSync(logFile) ? fs.statSync(logFile).size : 0;
    
    // Execute recovery process
    await performBlueScreenRecovery();
    
    // Verify: Log file should exist
    expect(fs.existsSync(logFile)).toBe(true);
    
    // Verify: Log file should have new content
    const finalSize = fs.statSync(logFile).size;
    expect(finalSize).toBeGreaterThan(initialSize);
    
    // Verify: Log content should contain key information
    const logContent = fs.readFileSync(logFile, 'utf8');
    expect(logContent).toContain('开始蓝屏恢复流程');
    expect(logContent).toContain('检测蓝屏痕迹');
  }, 60000);
});

