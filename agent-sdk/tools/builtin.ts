/**
 * Built-in Tools
 * These are the standard tools available to all agents
 */

import { z } from 'zod';
import { Tool } from '../core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Read File Tool
 */
export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  category: 'builtin',
  parameters: z.object({
    filePath: z.string().describe('Path to the file to read'),
  }),
  execute: async (params: { filePath: string }) => {
    try {
      const content = await fs.readFile(params.filePath, 'utf-8');
      return {
        success: true,
        content,
        path: params.filePath,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Write File Tool
 */
export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file',
  category: 'builtin',
  parameters: z.object({
    filePath: z.string().describe('Path to the file to write'),
    content: z.string().describe('Content to write to the file'),
  }),
  execute: async (params: { filePath: string; content: string }) => {
    try {
      await fs.writeFile(params.filePath, params.content, 'utf-8');
      return {
        success: true,
        path: params.filePath,
        bytesWritten: params.content.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * List Directory Tool
 */
export const listDirectoryTool: Tool = {
  name: 'list_directory',
  description: 'List files and directories in a given path',
  category: 'builtin',
  parameters: z.object({
    directoryPath: z.string().describe('Path to the directory to list'),
  }),
  execute: async (params: { directoryPath: string }) => {
    try {
      const files = await fs.readdir(params.directoryPath);
      const details = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(params.directoryPath, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime,
          };
        })
      );
      return {
        success: true,
        path: params.directoryPath,
        files: details,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Search Text Tool (Grep-like functionality)
 */
export const searchTextTool: Tool = {
  name: 'search_text',
  description: 'Search for text pattern in a file or directory',
  category: 'builtin',
  parameters: z.object({
    pattern: z.string().describe('Text pattern to search for'),
    path: z.string().describe('File or directory path to search in'),
    recursive: z.boolean().optional().describe('Search recursively in directories'),
  }),
  execute: async (params: { pattern: string; path: string; recursive?: boolean }) => {
    // Simple implementation - in production, use proper grep functionality
    try {
      const stats = await fs.stat(params.path);

      if (stats.isFile()) {
        const content = await fs.readFile(params.path, 'utf-8');
        const lines = content.split('\n');
        const matches = lines
          .map((line, index) => ({ line: index + 1, content: line }))
          .filter((item) => item.content.includes(params.pattern));

        return {
          success: true,
          matches,
          file: params.path,
        };
      }

      return {
        success: false,
        error: 'Directory search not implemented in this example',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * HTTP Request Tool
 */
export const httpRequestTool: Tool = {
  name: 'http_request',
  description: 'Make an HTTP request',
  category: 'builtin',
  parameters: z.object({
    url: z.string().describe('URL to make the request to'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).describe('HTTP method'),
    headers: z.record(z.string()).optional().describe('HTTP headers'),
    body: z.any().optional().describe('Request body'),
  }),
  execute: async (params: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
  }) => {
    try {
      const response = await fetch(params.url, {
        method: params.method,
        headers: {
          'Content-Type': 'application/json',
          ...params.headers,
        },
        body: params.body ? JSON.stringify(params.body) : undefined,
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Get all builtin tools
 */
export function getBuiltinTools(): Tool[] {
  return [
    readFileTool,
    writeFileTool,
    listDirectoryTool,
    searchTextTool,
    httpRequestTool,
  ];
}
