import { PRDData } from '../types/index.js';
import { AIUsageMetrics } from '../types/ai.js';

export interface SessionAnalytics {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  
  // Session Type
  sessionType: 'quick' | 'complete';
  
  // Questions Statistics
  questionsAnswered: number;
  questionsSkipped: number;
  totalQuestions: number;
  averageAnswerTime: number; // in seconds
  longestAnswerTime: number;
  shortestAnswerTime: number;
  
  // AI Interactions (if enabled)
  aiEnabled: boolean;
  aiInterventions: number;
  aiSuggestionsAccepted: number;
  aiSuggestionsRejected: number;
  aiOptimizationsPerformed: number;
  
  // Validation Results
  validationScore: number;
  validationPassed: boolean;
  criticalIssues: number;
  warnings: number;
  recommendations: number;
  
  // Output Statistics
  filesGenerated: string[];
  totalFileSize: number; // in KB
  outputDirectory: string;
  
  // Feature Complexity
  featuresCount: number;
  averageFeatureComplexity: number;
  totalProjectComplexity: number;
  
  // Timeline Analysis
  plannedWeeks: number;
  recommendedWeeks: number;
  timelineConfidence: number;
  
  // User Behavior
  editorUsageCount: number;
  directInputCount: number;
  timeoutsOccurred: number;
  revisionsCount: number;
}

export interface QuestionTiming {
  questionId: string;
  question: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  inputMethod: 'direct' | 'editor' | 'timeout';
  wasRevised: boolean;
}

/**
 * Session Analytics Tracker
 */
export class SessionAnalyticsTracker {
  private analytics: SessionAnalytics;
  private questionTimings: QuestionTiming[] = [];
  private currentQuestionStart?: Date;
  private currentQuestionId?: string;

  constructor(sessionId: string, sessionType: 'quick' | 'complete') {
    this.analytics = {
      sessionId,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      sessionType,
      
      questionsAnswered: 0,
      questionsSkipped: 0,
      totalQuestions: 0,
      averageAnswerTime: 0,
      longestAnswerTime: 0,
      shortestAnswerTime: Infinity,
      
      aiEnabled: false,
      aiInterventions: 0,
      aiSuggestionsAccepted: 0,
      aiSuggestionsRejected: 0,
      aiOptimizationsPerformed: 0,
      
      validationScore: 0,
      validationPassed: false,
      criticalIssues: 0,
      warnings: 0,
      recommendations: 0,
      
      filesGenerated: [],
      totalFileSize: 0,
      outputDirectory: '',
      
      featuresCount: 0,
      averageFeatureComplexity: 0,
      totalProjectComplexity: 0,
      
      plannedWeeks: 0,
      recommendedWeeks: 0,
      timelineConfidence: 0,
      
      editorUsageCount: 0,
      directInputCount: 0,
      timeoutsOccurred: 0,
      revisionsCount: 0,
    };
  }

  /**
   * Start tracking a question
   */
  startQuestion(questionId: string, _question: string): void {
    this.currentQuestionStart = new Date();
    this.currentQuestionId = questionId;
    this.analytics.totalQuestions++;
  }

  /**
   * End tracking a question
   */
  endQuestion(inputMethod: 'direct' | 'editor' | 'timeout', wasRevised: boolean = false): void {
    if (!this.currentQuestionStart || !this.currentQuestionId) return;

    const endTime = new Date();
    const duration = (endTime.getTime() - this.currentQuestionStart.getTime()) / 1000; // in seconds

    this.questionTimings.push({
      questionId: this.currentQuestionId,
      question: this.currentQuestionId,
      startTime: this.currentQuestionStart,
      endTime,
      duration,
      inputMethod,
      wasRevised,
    });

    // Update analytics
    this.analytics.questionsAnswered++;
    
    if (inputMethod === 'editor') {
      this.analytics.editorUsageCount++;
    } else if (inputMethod === 'direct') {
      this.analytics.directInputCount++;
    } else if (inputMethod === 'timeout') {
      this.analytics.timeoutsOccurred++;
    }

    if (wasRevised) {
      this.analytics.revisionsCount++;
    }

    // Update timing statistics
    if (duration > this.analytics.longestAnswerTime) {
      this.analytics.longestAnswerTime = duration;
    }
    if (duration < this.analytics.shortestAnswerTime) {
      this.analytics.shortestAnswerTime = duration;
    }

    this.currentQuestionStart = undefined;
    this.currentQuestionId = undefined;
  }

  /**
   * Skip a question
   */
  skipQuestion(): void {
    this.analytics.questionsSkipped++;
  }

  /**
   * Record AI interaction
   */
  recordAIInteraction(accepted: boolean): void {
    this.analytics.aiEnabled = true;
    this.analytics.aiInterventions++;
    
    if (accepted) {
      this.analytics.aiSuggestionsAccepted++;
    } else {
      this.analytics.aiSuggestionsRejected++;
    }
  }

  /**
   * Record AI optimization
   */
  recordAIOptimization(): void {
    this.analytics.aiOptimizationsPerformed++;
  }

  /**
   * Set validation results
   */
  setValidationResults(score: number, passed: boolean, issues: number, warnings: number, recommendations: number): void {
    this.analytics.validationScore = score;
    this.analytics.validationPassed = passed;
    this.analytics.criticalIssues = issues;
    this.analytics.warnings = warnings;
    this.analytics.recommendations = recommendations;
  }

  /**
   * Set project data
   */
  setProjectData(data: PRDData): void {
    this.analytics.featuresCount = data.mvp.coreFeatures.length;
    this.analytics.plannedWeeks = data.timeline.totalWeeks;
    
    // Calculate average complexity (simplified)
    const complexityPerFeature = 1; // Would be calculated based on actual complexity analysis
    this.analytics.averageFeatureComplexity = complexityPerFeature;
    this.analytics.totalProjectComplexity = complexityPerFeature * this.analytics.featuresCount;
  }

  /**
   * Set timeline analysis
   */
  setTimelineAnalysis(recommendedWeeks: number, confidence: number): void {
    this.analytics.recommendedWeeks = recommendedWeeks;
    this.analytics.timelineConfidence = confidence;
  }

  /**
   * Add generated file
   */
  addGeneratedFile(filePath: string, sizeKB: number): void {
    this.analytics.filesGenerated.push(filePath);
    this.analytics.totalFileSize += sizeKB;
  }

  /**
   * Set output directory
   */
  setOutputDirectory(dir: string): void {
    this.analytics.outputDirectory = dir;
  }

  /**
   * Finalize analytics
   */
  finalize(): SessionAnalytics {
    this.analytics.endTime = new Date();
    this.analytics.duration = (this.analytics.endTime.getTime() - this.analytics.startTime.getTime()) / 60000; // in minutes
    
    // Calculate average answer time
    if (this.questionTimings.length > 0) {
      const totalTime = this.questionTimings.reduce((sum, q) => sum + q.duration, 0);
      this.analytics.averageAnswerTime = totalTime / this.questionTimings.length;
    }
    
    return this.analytics;
  }

  /**
   * Merge AI metrics into session analytics
   */
  mergeAIMetrics(aiMetrics: AIUsageMetrics): void {
    this.analytics.aiEnabled = true;
    this.analytics.aiInterventions = aiMetrics.interactions.length;
    
    // Count accepted/rejected based on interaction types
    // const challenges = aiMetrics.interactions.filter(i => i.type === 'challenge');
    // const suggestions = aiMetrics.interactions.filter(i => i.type === 'suggest');
    const optimizations = aiMetrics.interactions.filter(i => i.type === 'optimize');
    
    this.analytics.aiOptimizationsPerformed = optimizations.length;
    // Note: accepted/rejected would need to be tracked separately during the session
  }

  /**
   * Generate analytics summary
   */
  generateSummary(): string {
    const analytics = this.finalize();
    
    return `
📊 Session Analytics Summary
============================
Session ID: ${analytics.sessionId}
Type: ${analytics.sessionType}
Duration: ${analytics.duration.toFixed(1)} minutes

Questions:
  • Answered: ${analytics.questionsAnswered}
  • Skipped: ${analytics.questionsSkipped}
  • Avg Time: ${analytics.averageAnswerTime.toFixed(1)}s

Input Methods:
  • Direct: ${analytics.directInputCount}
  • Editor: ${analytics.editorUsageCount}
  • Timeouts: ${analytics.timeoutsOccurred}

${analytics.aiEnabled ? `
AI Assistance:
  • Interventions: ${analytics.aiInterventions}
  • Accepted: ${analytics.aiSuggestionsAccepted}
  • Rejected: ${analytics.aiSuggestionsRejected}
  • Optimizations: ${analytics.aiOptimizationsPerformed}
` : 'AI: Disabled'}

Validation:
  • Score: ${analytics.validationScore}%
  • Status: ${analytics.validationPassed ? '✅ Passed' : '❌ Failed'}
  • Issues: ${analytics.criticalIssues}
  • Warnings: ${analytics.warnings}

Project:
  • Features: ${analytics.featuresCount}
  • Timeline: ${analytics.plannedWeeks} weeks
  • Recommended: ${analytics.recommendedWeeks} weeks
  • Confidence: ${analytics.timelineConfidence}%

Output:
  • Files: ${analytics.filesGenerated.length}
  • Total Size: ${analytics.totalFileSize.toFixed(2)} KB
  • Directory: ${analytics.outputDirectory}
`;
  }

  /**
   * Export analytics as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.finalize(), null, 2);
  }
}