/**
 * Type definitions for Context Memory Service
 */

import { QuestionType } from '../services/questionTypeDetector.js';

/**
 * Category types for organizing questions
 */
export type QuestionCategory = 'project' | 'mvp' | 'tech' | 'timeline' | 'launch' | 'other';

/**
 * Entry for storing question-answer pairs with metadata
 */
export interface ContextEntry {
  questionType: QuestionType;
  question: string;
  answer: string;
  timestamp: Date;
  category: QuestionCategory;
  improved?: boolean;
}

/**
 * Structured project context built from answers
 */
export interface ProjectContext {
  name?: string;
  description?: string;
  targetAudience?: string;
  problem?: string;
  solution?: string;
  uniqueValue?: string;
  features?: string[];
  techStack?: string[];
  timeline?: string;
  risks?: string[];
  successMetrics?: string[];
}

/**
 * Inconsistency detection result
 */
export interface ConsistencyCheck {
  isConsistent: boolean;
  issues: string[];
  affectedQuestions: string[];
}

/**
 * Context Memory export format
 */
export interface ContextMemoryExport {
  history: ContextEntry[];
  projectContext: ProjectContext;
  exportedAt: Date;
  sessionId?: string;
}

/**
 * Context Memory configuration
 */
export interface ContextMemoryConfig {
  maxContextLength?: number;
  enableInconsistencyDetection?: boolean;
  enableAutoSave?: boolean;
  saveInterval?: number;
}