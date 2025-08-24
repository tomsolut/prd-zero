import { QuestionType } from './questionTypeDetector.js';

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
  improved?: boolean; // Was the answer improved by AI?
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
 * Service for managing context memory across the session
 */
export class ContextMemoryService {
  private history: ContextEntry[] = [];
  private projectContext: ProjectContext = {};
  private readonly maxContextLength = 2000; // Max characters for context to avoid token limits

  /**
   * Add a new entry to the context history
   */
  public addEntry(entry: ContextEntry): void {
    this.history.push(entry);
    this.updateProjectContext(entry);
  }

  /**
   * Update the structured project context based on new entry
   */
  private updateProjectContext(entry: ContextEntry): void {
    const answer = entry.answer.trim();
    const question = entry.question.toLowerCase();

    // Project name
    if (question.includes('name') && question.includes('projekt')) {
      this.projectContext.name = answer;
    }
    
    // Description
    if (question.includes('beschreiben') || question.includes('describe')) {
      this.projectContext.description = answer;
    }
    
    // Target audience
    if (question.includes('zielgruppe') || question.includes('target') || question.includes('audience')) {
      this.projectContext.targetAudience = answer;
    }
    
    // Problem statement
    if (question.includes('problem') && !question.includes('lösung')) {
      this.projectContext.problem = answer;
    }
    
    // Solution
    if (question.includes('lösung') || question.includes('solution') || question.includes('einzigartig')) {
      if (question.includes('einzigartig') || question.includes('unique')) {
        this.projectContext.uniqueValue = answer;
      } else {
        this.projectContext.solution = answer;
      }
    }
    
    // Features (handle list answers)
    if (question.includes('feature') || question.includes('funktion')) {
      // Check if answer looks like a list
      if (answer.includes('\n') || answer.includes(',')) {
        this.projectContext.features = answer.split(/[\n,]/).map(f => f.trim()).filter(f => f);
      } else if (!this.projectContext.features) {
        this.projectContext.features = [answer];
      }
    }
    
    // Tech stack
    if (question.includes('tech') || question.includes('stack') || question.includes('technologie')) {
      if (answer.includes('\n') || answer.includes(',')) {
        this.projectContext.techStack = answer.split(/[\n,]/).map(t => t.trim()).filter(t => t);
      } else if (!this.projectContext.techStack) {
        this.projectContext.techStack = [answer];
      }
    }
    
    // Timeline
    if (question.includes('zeit') || question.includes('timeline') || question.includes('wochen') || question.includes('weeks')) {
      this.projectContext.timeline = answer;
    }
    
    // Risks
    if (question.includes('risk') || question.includes('risiko')) {
      if (answer.includes('\n') || answer.includes(',')) {
        this.projectContext.risks = answer.split(/[\n,]/).map(r => r.trim()).filter(r => r);
      } else if (!this.projectContext.risks) {
        this.projectContext.risks = [answer];
      }
    }
    
    // Success metrics
    if (question.includes('metrik') || question.includes('metric') || question.includes('erfolg') || question.includes('success')) {
      if (answer.includes('\n') || answer.includes(',')) {
        this.projectContext.successMetrics = answer.split(/[\n,]/).map(m => m.trim()).filter(m => m);
      } else if (!this.projectContext.successMetrics) {
        this.projectContext.successMetrics = [answer];
      }
    }
  }

  /**
   * Get formatted context for AI prompts
   */
  public getContextForPrompt(): string {
    // Build structured context
    const contextParts: string[] = [];
    
    contextParts.push('=== BISHERIGER PROJEKT-KONTEXT ===');
    
    if (this.projectContext.name) {
      contextParts.push(`Projektname: ${this.projectContext.name}`);
    }
    
    if (this.projectContext.targetAudience) {
      contextParts.push(`Zielgruppe: ${this.projectContext.targetAudience}`);
    }
    
    if (this.projectContext.problem) {
      contextParts.push(`Problem: ${this.projectContext.problem}`);
    }
    
    if (this.projectContext.solution) {
      contextParts.push(`Lösung: ${this.projectContext.solution}`);
    }
    
    if (this.projectContext.uniqueValue) {
      contextParts.push(`Unique Value: ${this.projectContext.uniqueValue}`);
    }
    
    if (this.projectContext.features && this.projectContext.features.length > 0) {
      contextParts.push(`Features: ${this.projectContext.features.join(', ')}`);
    }
    
    if (this.projectContext.techStack && this.projectContext.techStack.length > 0) {
      contextParts.push(`Tech Stack: ${this.projectContext.techStack.join(', ')}`);
    }
    
    if (this.projectContext.timeline) {
      contextParts.push(`Timeline: ${this.projectContext.timeline}`);
    }
    
    if (this.projectContext.risks && this.projectContext.risks.length > 0) {
      contextParts.push(`Risiken: ${this.projectContext.risks.join(', ')}`);
    }
    
    if (this.projectContext.successMetrics && this.projectContext.successMetrics.length > 0) {
      contextParts.push(`Erfolgsmetriken: ${this.projectContext.successMetrics.join(', ')}`);
    }
    
    contextParts.push('=== ENDE KONTEXT ===\n');
    contextParts.push('WICHTIG: Neue Antworten müssen zu obigen Definitionen passen und darauf aufbauen.');
    
    // Trim to max length to avoid token limits
    const fullContext = contextParts.join('\n');
    if (fullContext.length > this.maxContextLength) {
      // Prioritize most recent and most important context
      return this.trimContext(fullContext);
    }
    
    return fullContext;
  }

  /**
   * Trim context to fit within token limits while preserving key information
   */
  private trimContext(fullContext: string): string {
    // Keep critical fields and trim others
    const criticalFields = ['Projektname:', 'Zielgruppe:', 'Problem:', 'Features:'];
    const lines = fullContext.split('\n');
    const critical: string[] = [];
    const other: string[] = [];
    
    lines.forEach(line => {
      if (criticalFields.some(field => line.startsWith(field))) {
        critical.push(line);
      } else if (line.startsWith('===') || line.startsWith('WICHTIG:')) {
        critical.push(line);
      } else {
        other.push(line);
      }
    });
    
    // Combine critical + as many other lines as fit
    let result = critical.join('\n');
    for (const line of other) {
      if (result.length + line.length < this.maxContextLength) {
        result += '\n' + line;
      }
    }
    
    return result;
  }

  /**
   * Get related answers based on question type
   */
  public getRelatedAnswers(questionType: QuestionType): ContextEntry[] {
    return this.history.filter(entry => entry.questionType === questionType);
  }

  /**
   * Get answers by category
   */
  public getAnswersByCategory(category: QuestionCategory): ContextEntry[] {
    return this.history.filter(entry => entry.category === category);
  }

  /**
   * Detect potential inconsistencies in answers
   */
  public detectInconsistencies(): ConsistencyCheck {
    const issues: string[] = [];
    const affectedQuestions: string[] = [];
    
    // Check if target audience was changed
    const audienceEntries = this.history.filter(e => 
      e.question.toLowerCase().includes('zielgruppe') || 
      e.question.toLowerCase().includes('audience')
    );
    if (audienceEntries.length > 1) {
      const audiences = audienceEntries.map(e => e.answer);
      if (new Set(audiences).size > 1) {
        issues.push('Zielgruppe wurde mehrfach unterschiedlich definiert');
        affectedQuestions.push(...audienceEntries.map(e => e.question));
      }
    }
    
    // Check if problem aligns with audience
    if (this.projectContext.problem && this.projectContext.targetAudience) {
      const problemLower = this.projectContext.problem.toLowerCase();
      const audienceLower = this.projectContext.targetAudience.toLowerCase();
      
      // Check for sport-specific consistency
      if (audienceLower.includes('baseball') && !problemLower.includes('baseball')) {
        // This is okay - problem doesn't need to mention sport explicitly
      }
      
      // Check age consistency
      const ageMatch = audienceLower.match(/(\d+)-(\d+)/);
      if (ageMatch && !problemLower.includes(ageMatch[0])) {
        // Age doesn't need to be repeated in problem
      }
    }
    
    // Check timeline feasibility with feature count
    if (this.projectContext.timeline && this.projectContext.features) {
      const weeks = parseInt(this.projectContext.timeline);
      const featureCount = this.projectContext.features.length;
      if (!isNaN(weeks) && featureCount > 0) {
        const weeksPerFeature = weeks / featureCount;
        if (weeksPerFeature < 2) {
          issues.push(`Timeline sehr knapp: nur ${weeksPerFeature.toFixed(1)} Wochen pro Feature`);
          affectedQuestions.push('Timeline', 'Features');
        }
      }
    }
    
    return {
      isConsistent: issues.length === 0,
      issues,
      affectedQuestions
    };
  }

  /**
   * Get the full history
   */
  public getHistory(): ContextEntry[] {
    return [...this.history];
  }

  /**
   * Get the current project context
   */
  public getProjectContext(): ProjectContext {
    return { ...this.projectContext };
  }

  /**
   * Clear all context (for new session)
   */
  public clear(): void {
    this.history = [];
    this.projectContext = {};
  }

  /**
   * Export context for saving
   */
  public export(): {
    history: ContextEntry[];
    projectContext: ProjectContext;
  } {
    return {
      history: this.history,
      projectContext: this.projectContext
    };
  }

  /**
   * Import saved context
   */
  public import(data: {
    history: ContextEntry[];
    projectContext: ProjectContext;
  }): void {
    this.history = data.history || [];
    this.projectContext = data.projectContext || {};
  }

  /**
   * Get a summary of the project for display
   */
  public getProjectSummary(): string {
    const parts: string[] = [];
    
    if (this.projectContext.name) {
      parts.push(`📋 Projekt: ${this.projectContext.name}`);
    }
    
    if (this.projectContext.targetAudience) {
      parts.push(`👥 Zielgruppe: ${this.projectContext.targetAudience}`);
    }
    
    if (this.projectContext.problem) {
      parts.push(`❗ Problem: ${this.projectContext.problem}`);
    }
    
    if (this.projectContext.features && this.projectContext.features.length > 0) {
      parts.push(`✨ Features: ${this.projectContext.features.length} definiert`);
    }
    
    if (this.projectContext.timeline) {
      parts.push(`⏱️ Timeline: ${this.projectContext.timeline}`);
    }
    
    return parts.join('\n');
  }
}