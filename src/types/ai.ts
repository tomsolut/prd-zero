/**
 * AI-related type definitions for Claude integration
 */

export interface AIConfig {
  apiKey: string;
  model: 'claude-3-5-sonnet-latest' | 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229' | 'claude-3-haiku-20240307';
  maxTokens: number;
  temperature: number;
  maxBudget?: number; // Maximum budget in USD
  showCosts?: boolean; // Show costs in real-time
}

export interface AIUsageMetrics {
  sessionId: string;
  totalTokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  apiCalls: number;
  estimatedCost: number; // in USD
  model: string;
  interactions: AIInteraction[];
  startTime: Date;
  endTime?: Date;
}

export interface AIInteraction {
  timestamp: Date;
  type: 'challenge' | 'optimize' | 'suggest' | 'validate' | 'enhance' | 'list_suggestion' | 'validation';
  context: string;
  prompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  accepted?: boolean; // Was the suggestion accepted by user
}

export interface TokenPricing {
  model: string;
  inputPricePerMillion: number; // USD per million tokens
  outputPricePerMillion: number; // USD per million tokens
}

export interface AIResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

export interface AIEnhancedQuestion {
  originalQuestion: string;
  userAnswer: string;
  aiChallenge?: string;
  aiSuggestion?: string;
  finalAnswer: string;
  wasImproved: boolean;
}

export interface SessionCostBreakdown {
  byFeature: {
    questioning: number;
    optimization: number;
    validation: number;
    enhancement: number;
  };
  byPhase: {
    coreQuestions: number;
    projectDetails: number;
    mvpScope: number;
    timeline: number;
    technical: number;
    finalOptimization: number;
  };
  total: number;
  withinBudget: boolean;
  budgetUsedPercent: number;
}

// Claude model pricing (as of 2024)
export const CLAUDE_PRICING: Record<string, TokenPricing> = {
  'claude-3-5-sonnet-latest': {
    model: 'Claude 3.5 Sonnet (Latest)',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
  },
  'claude-3-5-sonnet-20241022': {
    model: 'Claude 3.5 Sonnet',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
  },
  'claude-3-opus-20240229': {
    model: 'Claude 3 Opus',
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
  },
  'claude-3-haiku-20240307': {
    model: 'Claude 3 Haiku',
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
  },
};

export interface AIOptimizationResult {
  original: string;
  content: string; // The optimized content
  optimized: string;
  improvements: string[];
  confidenceScore: number;
  tokensUsed: number;
  cost: number;
}

export interface AIValidationResult {
  isValid: boolean;
  score?: number; // 0-100
  issues: string[];
  suggestions: string[];
  criticalProblems?: string[];
  tokensUsed?: number;
  cost?: number;
}

// Enhanced AI Response Types for Optimized Prompts
export type AssessmentLevel = 'good' | 'warning' | 'critical';
export type WarningSeverity = 'low' | 'medium' | 'high';

export interface Warning {
  type: string;
  severity: WarningSeverity;
  message: string;
}

// Innovation Token Details for Tech Stack
export interface InnovationToken {
  tech: string;
  token_cost: number;
  risk_level: 'low' | 'medium' | 'high';
  reason: string;
}

// Skills Gap Analysis
export interface SkillsGapAnalysis {
  new_technologies: string[];
  learning_hours_estimate: number;
  tutorial_hell_risk: string[];
  timeline_impact_weeks: number;
}

// Tech Stack Recommendation
export interface TechStackRecommendation {
  current: string;
  suggested: string;
  reason: string;
}

// Alternative Stack Option
export interface AlternativeStack {
  name: string;
  tech: string[];
  pros: string[];
  cons: string[];
  learning_curve_weeks: number;
  innovation_tokens: number;
}

export interface OptimizedAIResponse {
  assessment: AssessmentLevel;
  feedback: string;
  warnings: Warning[];
  suggestion?: string;
  next_actions: string[];
  // Question-specific fields
  validation_required?: boolean;
  measurability_score?: number;
  feature_count?: number;
  scope_violation?: boolean;
  parking_lot?: string[];
  innovation_tokens_used?: number;
  complexity_score?: number;
  boring_tech_recommendation?: string;
  timeline_weeks?: number;
  timeline_violation?: boolean;
  validation_gates_missing?: string[];
  realism_score?: number;
  // Enhanced Tech Stack fields
  skills_gap_analysis?: SkillsGapAnalysis;
  compatibility_score?: number;
  solo_developer_score?: number;
  innovation_tokens?: {
    used: number;
    details: InnovationToken[];
  };
  recommendations?: {
    keep: string[];
    replace: TechStackRecommendation[];
    add_missing: string[];
  };
  alternative_stacks?: AlternativeStack[];
  final_recommendation?: string;
}