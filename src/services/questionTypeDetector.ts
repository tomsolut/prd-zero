/**
 * Question Type Detection System for specialized AI prompts
 */

export enum QuestionType {
  PROBLEM_VALIDATION = 'problem_validation',
  VALUE_PROPOSITION = 'value_proposition',
  MVP_SCOPE = 'mvp_scope',
  TECH_STACK = 'tech_stack',
  LAUNCH_PLAN = 'launch_plan',
  GENERIC = 'generic'
}

interface KeywordSet {
  keywords: string[];
  weight: number;
}

interface QuestionTypeConfig {
  type: QuestionType;
  keywordSets: KeywordSet[];
  minScore: number;
}

export class QuestionTypeDetector {
  private static readonly QUESTION_CONFIGS: QuestionTypeConfig[] = [
    {
      type: QuestionType.PROBLEM_VALIDATION,
      keywordSets: [
        { keywords: ['problem', 'issue', 'pain', 'challenge', 'difficulty'], weight: 3 },
        { keywords: ['solve', 'solution', 'address', 'fix'], weight: 2 },
        { keywords: ['target', 'audience', 'user', 'customer'], weight: 2 },
        { keywords: ['why', 'need', 'require'], weight: 1 }
      ],
      minScore: 3
    },
    {
      type: QuestionType.VALUE_PROPOSITION,
      keywordSets: [
        { keywords: ['value', 'benefit', 'proposition', 'unique'], weight: 3 },
        { keywords: ['metric', 'measure', 'success', 'kpi'], weight: 2 },
        { keywords: ['different', 'better', 'compared', 'alternative'], weight: 2 },
        { keywords: ['offer', 'provide', 'deliver'], weight: 1 }
      ],
      minScore: 3
    },
    {
      type: QuestionType.MVP_SCOPE,
      keywordSets: [
        { keywords: ['feature', 'functionality', 'capability'], weight: 3 },
        { keywords: ['mvp', 'minimum', 'core', 'essential'], weight: 3 },
        { keywords: ['scope', 'include', 'exclude', 'out of scope'], weight: 2 },
        { keywords: ['list', 'what', 'which'], weight: 1 }
      ],
      minScore: 3
    },
    {
      type: QuestionType.TECH_STACK,
      keywordSets: [
        { keywords: ['technology', 'tech', 'stack', 'framework'], weight: 3 },
        { keywords: ['database', 'backend', 'frontend', 'api'], weight: 3 },
        { keywords: ['architecture', 'infrastructure', 'platform'], weight: 2 },
        { keywords: ['language', 'tool', 'library', 'service'], weight: 2 },
        { keywords: ['use', 'choose', 'select'], weight: 1 }
      ],
      minScore: 3
    },
    {
      type: QuestionType.LAUNCH_PLAN,
      keywordSets: [
        { keywords: ['launch', 'release', 'deploy', 'ship'], weight: 3 },
        { keywords: ['timeline', 'schedule', 'week', 'month', 'deadline'], weight: 3 },
        { keywords: ['marketing', 'go-to-market', 'gtm', 'strategy'], weight: 2 },
        { keywords: ['milestone', 'phase', 'step'], weight: 2 },
        { keywords: ['when', 'how long', 'duration'], weight: 1 }
      ],
      minScore: 3
    }
  ];

  /**
   * Detect question type from question text
   */
  public static detectType(questionText: string): QuestionType {
    const lowerText = questionText.toLowerCase();
    const scores = new Map<QuestionType, number>();

    // Calculate scores for each question type
    for (const config of this.QUESTION_CONFIGS) {
      let score = 0;
      
      for (const keywordSet of config.keywordSets) {
        const matchCount = keywordSet.keywords.filter(keyword => 
          lowerText.includes(keyword.toLowerCase())
        ).length;
        
        if (matchCount > 0) {
          score += keywordSet.weight * matchCount;
        }
      }
      
      scores.set(config.type, score);
    }

    // Find the highest scoring type that meets minimum threshold
    let bestType = QuestionType.GENERIC;
    let bestScore = 0;

    for (const config of this.QUESTION_CONFIGS) {
      const score = scores.get(config.type) || 0;
      if (score >= config.minScore && score > bestScore) {
        bestScore = score;
        bestType = config.type;
      }
    }

    return bestType;
  }

  /**
   * Get context-specific validation requirements for a question type
   */
  public static getValidationRequirements(type: QuestionType): string[] {
    switch (type) {
      case QuestionType.PROBLEM_VALIDATION:
        return [
          'Specific persona (not generic role)',
          'Measurable problem with pain level ≥6',
          'Mom Test compliant formulation',
          'Current pain/cost identifiable'
        ];
      
      case QuestionType.VALUE_PROPOSITION:
        return [
          'Exactly 15 words for value prop',
          'SMART success metrics',
          'Concrete benefits (not vague promises)',
          'Clear differentiation from alternatives'
        ];
      
      case QuestionType.MVP_SCOPE:
        return [
          'Exactly 3 features maximum',
          'User story format',
          'Clear won\'t-have list',
          'Features directly solve core problem'
        ];
      
      case QuestionType.TECH_STACK:
        return [
          'Maximum 2 innovation tokens',
          'Boring tech preference',
          'Skills-based decisions',
          'Monolith over microservices for MVP'
        ];
      
      case QuestionType.LAUNCH_PLAN:
        return [
          'Maximum 12 weeks timeline',
          'Validation gates before development',
          'Realistic go-to-market strategy',
          'Measurable launch metrics'
        ];
      
      default:
        return [
          'Clear and specific answer',
          'Measurable outcomes',
          'Realistic constraints',
          'Actionable next steps'
        ];
    }
  }

  /**
   * Get severity thresholds for a question type
   */
  public static getSeverityThresholds(type: QuestionType): {
    critical: string[];
    warning: string[];
  } {
    switch (type) {
      case QuestionType.PROBLEM_VALIDATION:
        return {
          critical: ['vague_problem', 'no_target_persona', 'solution_first'],
          warning: ['generic_target', 'low_pain', 'unmeasurable']
        };
      
      case QuestionType.VALUE_PROPOSITION:
        return {
          critical: ['too_long', 'unmeasurable_metrics'],
          warning: ['too_vague', 'generic_benefits', 'no_differentiation']
        };
      
      case QuestionType.MVP_SCOPE:
        return {
          critical: ['scope_creep', 'more_than_3_features'],
          warning: ['vague_features', 'missing_user_stories', 'no_parking_lot']
        };
      
      case QuestionType.TECH_STACK:
        return {
          critical: ['over_engineering', 'too_many_innovation_tokens', 'microservices_mvp'],
          warning: ['learning_overhead', 'trendy_tech', 'complex_cicd']
        };
      
      case QuestionType.LAUNCH_PLAN:
        return {
          critical: ['timeline_overrun', 'no_validation_gates'],
          warning: ['vague_marketing', 'unrealistic_pricing', 'missing_metrics']
        };
      
      default:
        return {
          critical: ['completely_invalid', 'major_issue'],
          warning: ['needs_improvement', 'minor_issue']
        };
    }
  }

  /**
   * Check if a question is about listing items
   */
  public static isListQuestion(questionText: string): boolean {
    const listKeywords = ['list', 'enumerate', 'name', 'what are', 'which', 'features', 'metrics', 'risks'];
    const lowerText = questionText.toLowerCase();
    return listKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Get question category for analytics
   */
  public static getQuestionCategory(type: QuestionType): string {
    switch (type) {
      case QuestionType.PROBLEM_VALIDATION:
        return 'problem_definition';
      case QuestionType.VALUE_PROPOSITION:
        return 'value_creation';
      case QuestionType.MVP_SCOPE:
        return 'scope_management';
      case QuestionType.TECH_STACK:
        return 'technical_decisions';
      case QuestionType.LAUNCH_PLAN:
        return 'go_to_market';
      default:
        return 'general';
    }
  }
}