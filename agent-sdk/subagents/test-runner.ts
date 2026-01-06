/**
 * Test Runner Subagent
 * Runs tests and reports results
 */

import { Subagent } from '../core/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const testRunnerSubagent: Subagent = {
  name: 'test-runner',
  description: 'Runs tests and reports results',
  type: 'test-runner',
  isolated: true,

  execute: async (task: string, context: Record<string, any>): Promise<any> => {
    const { testCommand, projectPath, testFiles } = context;

    console.log('🧪 Test Runner executing tests...');

    try {
      // Default test command
      const command = testCommand || 'npm test';
      const cwd = projectPath || process.cwd();

      // Run tests
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: 60000, // 1 minute timeout
      });

      // Parse test results
      const results = parseTestOutput(stdout, stderr);

      return {
        success: results.passed,
        results,
        stdout,
        stderr,
        timestamp: new Date(),
        runner: 'test-runner-subagent',
      };
    } catch (error: any) {
      // Tests failed or command error
      const results = parseTestOutput(error.stdout || '', error.stderr || '');

      return {
        success: false,
        results,
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
        timestamp: new Date(),
        runner: 'test-runner-subagent',
      };
    }
  },
};

/**
 * Parse test output to extract results
 */
function parseTestOutput(stdout: string, stderr: string) {
  // Simple parsing - in production, parse specific test framework output
  const output = stdout + stderr;

  const passedMatch = output.match(/(\d+)\s+passed/i);
  const failedMatch = output.match(/(\d+)\s+failed/i);
  const totalMatch = output.match(/(\d+)\s+total/i);

  const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;

  return {
    passed: failed === 0,
    total,
    passedCount: passed,
    failedCount: failed,
    summary: `${passed}/${total} tests passed`,
    details: output,
  };
}
