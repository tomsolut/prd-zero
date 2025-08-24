import { QuestionType } from './questionTypeDetector.js';
import {
  QuestionCategory,
  ContextEntry,
  ProjectContext,
  ConsistencyCheck,
  ContextMemoryExport
} from '../types/contextMemory.js';

export { QuestionCategory, ContextEntry, ProjectContext, ConsistencyCheck };

/**
 * Service for managing context memory across the session
 */
/**
 * Constants for Context Memory Service
 */
const CONTEXT_CONSTANTS = {
  MAX_CONTEXT_LENGTH: 2000,
  CRITICAL_FIELD_PREFIXES: ['Projektname:', 'Zielgruppe:', 'Problem:', 'Features:'],
  CONTEXT_HEADERS: {
    START: '=== BISHERIGER PROJEKT-KONTEXT ===',
    END: '=== ENDE KONTEXT ===',
    IMPORTANT: 'WICHTIG: Neue Antworten müssen zu obigen Definitionen passen und darauf aufbauen.'
  }
} as const;

export class ContextMemoryService {
  private history: ContextEntry[] = [];
  private projectContext: ProjectContext = {};
  private readonly maxContextLength = CONTEXT_CONSTANTS.MAX_CONTEXT_LENGTH;
  private cachedContext: string | null = null;
  private contextDirty = false;

  /**
   * Add a new entry to the context history
   */
  public addEntry(entry: ContextEntry): void {
    this.history.push(entry);
    this.updateProjectContext(entry);
    this.contextDirty = true; // Invalidate cache
  }

  /**
   * Context update strategies based on question patterns
   */
  private readonly contextUpdateStrategies = {
    name: (answer: string) => { this.projectContext.name = answer; },
    description: (answer: string) => { this.projectContext.description = answer; },
    targetAudience: (answer: string) => { this.projectContext.targetAudience = answer; },
    problem: (answer: string) => { this.projectContext.problem = answer; },
    uniqueValue: (answer: string) => { this.projectContext.uniqueValue = answer; },
    solution: (answer: string) => { this.projectContext.solution = answer; },
    features: (answer: string) => { this.projectContext.features = this.parseListAnswer(answer, this.projectContext.features); },
    techStack: (answer: string) => { this.projectContext.techStack = this.parseListAnswer(answer, this.projectContext.techStack); },
    timeline: (answer: string) => { this.projectContext.timeline = answer; },
    risks: (answer: string) => { this.projectContext.risks = this.parseListAnswer(answer, this.projectContext.risks); },
    successMetrics: (answer: string) => { this.projectContext.successMetrics = this.parseListAnswer(answer, this.projectContext.successMetrics); }
  };

  /**
   * Parse list-type answers
   */
  private parseListAnswer(answer: string, existing?: string[]): string[] {
    if (answer.includes('\n') || answer.includes(',')) {
      return answer.split(/[\n,]/).map(item => item.trim()).filter(item => item);
    }
    return existing || [answer];
  }

  /**
   * Detect context type from question
   */
  private detectContextType(question: string): keyof typeof this.contextUpdateStrategies | null {
    const q = question.toLowerCase();
    
    const patterns: Record<keyof typeof this.contextUpdateStrategies, string[]> = {
      name: ['name', 'projekt'],
      description: ['beschreiben', 'describe'],
      targetAudience: ['zielgruppe', 'target', 'audience'],
      problem: ['problem'],
      uniqueValue: ['einzigartig', 'unique'],
      solution: ['lösung', 'solution'],
      features: ['feature', 'funktion'],
      techStack: ['tech', 'stack', 'technologie'],
      timeline: ['zeit', 'timeline', 'wochen', 'weeks'],
      risks: ['risk', 'risiko'],
      successMetrics: ['metrik', 'metric', 'erfolg', 'success']
    };

    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => q.includes(keyword))) {
        // Special handling for problem vs solution
        if (type === 'solution' && q.includes('problem')) continue;
        if (type === 'uniqueValue' && !q.includes('einzigartig') && !q.includes('unique')) continue;
        return type as keyof typeof this.contextUpdateStrategies;
      }
    }
    
    return null;
  }

  /**
   * Update the structured project context based on new entry
   */
  private updateProjectContext(entry: ContextEntry): void {
    const answer = entry.answer.trim();
    const contextType = this.detectContextType(entry.question);
    
    if (contextType && this.contextUpdateStrategies[contextType]) {
      this.contextUpdateStrategies[contextType](answer);
    }
  }

  /**
   * Get formatted context for AI prompts
   */
  public getContextForPrompt(): string {
    // Return cached context if available and not dirty
    if (this.cachedContext && !this.contextDirty) {
      return this.cachedContext;
    }
    
    // Build structured context
    const contextParts: string[] = [];
    
    contextParts.push(CONTEXT_CONSTANTS.CONTEXT_HEADERS.START);
    
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
    
    contextParts.push(CONTEXT_CONSTANTS.CONTEXT_HEADERS.END + '\n');
    contextParts.push(CONTEXT_CONSTANTS.CONTEXT_HEADERS.IMPORTANT);
    
    // Trim to max length to avoid token limits
    const fullContext = contextParts.join('\n');
    const finalContext = fullContext.length > this.maxContextLength 
      ? this.trimContext(fullContext)
      : fullContext;
    
    // Cache the result
    this.cachedContext = finalContext;
    this.contextDirty = false;
    
    return finalContext;
  }

  /**
   * Trim context to fit within token limits while preserving key information
   */
  private trimContext(fullContext: string): string {
    // Keep critical fields and trim others
    const criticalFields = CONTEXT_CONSTANTS.CRITICAL_FIELD_PREFIXES;
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
  public export(): ContextMemoryExport {
    return {
      history: this.history,
      projectContext: this.projectContext,
      exportedAt: new Date()
    };
  }

  /**
   * Import saved context
   */
  public import(data: ContextMemoryExport): void {
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