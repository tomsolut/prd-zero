import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from './logger.js';

export class FileSystem {
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      Logger.debug(`Ensured directory exists: ${dirPath}`);
    } catch (error) {
      Logger.error(`Failed to create directory: ${dirPath}`);
      throw error;
    }
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await this.ensureDirectory(dir);
      await fs.writeFile(filePath, content, 'utf-8');
      Logger.success(`File saved: ${filePath}`);
    } catch (error) {
      Logger.error(`Failed to write file: ${filePath}`);
      throw error;
    }
  }

  static async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      Logger.debug(`File read: ${filePath}`);
      return content;
    } catch (error) {
      Logger.error(`Failed to read file: ${filePath}`);
      throw error;
    }
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async saveJSON(filePath: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.writeFile(filePath, content);
  }

  static async loadJSON<T>(filePath: string): Promise<T> {
    const content = await this.readFile(filePath);
    return JSON.parse(content) as T;
  }

  static generateFileName(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}.${extension}`;
  }

  static getOutputPath(outputDir: string, fileName: string): string {
    return path.join(outputDir, fileName);
  }
}