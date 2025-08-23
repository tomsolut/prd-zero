import { z } from 'zod';
import { Logger } from '../utils/logger.js';

export class Validator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        Logger.error('Validation failed:');
        error.issues.forEach((err: z.ZodIssue) => {
          Logger.item(`${err.path.join('.')}: ${err.message}`);
        });
        throw new Error('Validation failed. Please check your inputs.');
      }
      throw error;
    }
  }

  static validatePartial<T>(schema: z.ZodObject<any>, data: unknown): Partial<T> {
    try {
      return schema.partial().parse(data) as Partial<T>;
    } catch (error) {
      if (error instanceof z.ZodError) {
        Logger.error('Partial validation failed:');
        error.issues.forEach((err: z.ZodIssue) => {
          Logger.item(`${err.path.join('.')}: ${err.message}`);
        });
        throw new Error('Validation failed. Please check your inputs.');
      }
      throw error;
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  static sanitizeFileName(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  }

  static validateTimeLimit(minutes: string): number {
    const limit = parseInt(minutes, 10);
    if (isNaN(limit) || limit < 10 || limit > 180) {
      throw new Error('Time limit must be between 10 and 180 minutes');
    }
    return limit;
  }
}