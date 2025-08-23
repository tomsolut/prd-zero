import { z } from 'zod';

/**
 * Comprehensive validation schemas for PRD-ZERO
 * Implements scope protection and business logic validation
 * to protect solo developers from common pitfalls
 */

// ==========================================
// METADATA SCHEMA
// ==========================================
const MetadataSchema = z.object({
  created_at: z.string().datetime(),
  tool_version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z'),
  warnings: z.array(z.string()).default([]),
  session_type: z.enum(['quick', 'complete']).optional(),
  completion_time_minutes: z.number().min(10).max(180).optional(),
});

// ==========================================
// PROBLEM VALIDATION WITH BUSINESS LOGIC
// ==========================================
const ProblemSchema = z.object({
  statement: z.string()
    .min(20, 'Problem statement too vague - be specific!')
    .max(200, 'Problem statement too complex - focus on ONE core problem')
    .refine((val) => !val.toLowerCase().includes('everything'), 
      'Avoid trying to solve "everything" - focus on one specific problem')
    .refine((val) => !val.toLowerCase().includes('all'), 
      'Too broad - pick a specific aspect to solve'),
  
  target_user: z.string()
    .min(10, 'Be more specific about your target user')
    .max(150, 'Target user description too long - be concise')
    .refine((val) => !val.toLowerCase().includes('everyone'), 
      'Cannot target "everyone" - pick a specific user group')
    .refine((val) => !val.toLowerCase().includes('anybody'), 
      '"Anybody" is not a target - be specific'),
  
  pain_level: z.number()
    .min(1)
    .max(10)
    .refine((val) => val >= 7, {
      message: 'Warning: Pain level below 7 - is this problem urgent enough?'
    }),
  
  current_solution: z.string()
    .min(10, 'Describe how users currently solve this')
    .max(200)
    .refine((val) => val.toLowerCase() !== 'none' && val.toLowerCase() !== 'nothing',
      'Users always have some workaround - what is it?'),
});

// ==========================================
// VALUE PROPOSITION VALIDATION
// ==========================================
const ValueSchema = z.object({
  proposition: z.string()
    .min(20, 'Value proposition too short')
    .max(200, 'Value proposition too long - be concise')
    .refine((val) => {
      const buzzwords = ['revolutionary', 'disruptive', 'game-changing', 'uber for', 'airbnb for'];
      return !buzzwords.some(word => val.toLowerCase().includes(word));
    }, 'Avoid buzzwords - be specific about the value'),
  
  success_metric: z.string()
    .min(10)
    .max(100)
    .refine((val) => {
      const measurableTerms = ['users', 'revenue', 'time', 'rate', 'number', '%', 'daily', 'weekly', 'monthly', 'conversion'];
      return measurableTerms.some(term => val.toLowerCase().includes(term));
    }, 'Metric must be measurable (include numbers/percentages)'),
  
  target_value: z.string()
    .regex(/\d+/, 'Must include a specific number')
    .max(50)
    .refine((val) => {
      const num = parseInt(val.match(/\d+/)?.[0] || '0');
      return num > 0 && num <= 10000;
    }, 'Target seems unrealistic for MVP - start smaller'),
});

// ==========================================
// SCOPE PROTECTION - CRITICAL FOR SOLO DEVS
// ==========================================
const ScopeSchema = z.object({
  // Core features - STRICT LIMIT OF 3
  feature_1: z.string()
    .min(10, 'Feature description too vague')
    .max(100, 'Feature too complex - break it down')
    .refine((val) => {
      const complexTerms = ['AI', 'ML', 'blockchain', 'real-time', 'scalable'];
      return !complexTerms.some(term => val.toLowerCase().includes(term));
    }, 'Warning: This feature might be too complex for MVP'),
  
  feature_2: z.string()
    .min(10)
    .max(100),
  
  feature_3: z.string()
    .min(10)
    .max(100),
  
  // Nice to have - LIMITED
  nice_to_have: z.array(z.string())
    .max(5, 'Too many nice-to-haves - save for v2')
    .refine((arr) => arr.every(item => item.length <= 50), 
      'Keep nice-to-haves simple and brief'),
  
  // Won't have in v1 - IMPORTANT FOR SCOPE CONTROL
  wont_have_v1: z.array(z.string())
    .min(3, 'Define at least 3 things you WON\'T build - crucial for focus')
    .max(10)
    .refine((arr) => arr.length >= 3, 
      'Be explicit about what you\'re NOT building - prevents scope creep'),
});

// ==========================================
// TECHNICAL VALIDATION
// ==========================================
const TechSchema = z.object({
  known_frameworks: z.string()
    .min(5)
    .max(200)
    .refine((val) => {
      const frameworks = val.toLowerCase();
      const knownCount = (frameworks.match(/,/g) || []).length + 1;
      return knownCount <= 3;
    }, 'Stick to max 3 frameworks you know well - avoid learning too many new things'),
  
  database_experience: z.string()
    .min(5)
    .max(100)
    .refine((val) => {
      const dbTypes = ['postgres', 'mysql', 'sqlite', 'mongodb', 'firebase', 'supabase'];
      return dbTypes.some(db => val.toLowerCase().includes(db));
    }, 'Choose a database you have experience with'),
  
  deployment_experience: z.string()
    .min(5)
    .max(100)
    .refine((val) => {
      const platforms = ['vercel', 'netlify', 'heroku', 'railway', 'aws', 'digitalocean', 'fly.io'];
      return platforms.some(p => val.toLowerCase().includes(p));
    }, 'Pick a deployment platform you\'ve used before'),
  
  performance_requirements: z.string()
    .max(200)
    .refine((val) => {
      if (val.toLowerCase().includes('millions') || val.toLowerCase().includes('scale')) {
        return false;
      }
      return true;
    }, 'Don\'t optimize for scale in MVP - focus on working product first'),
  
  special_requirements: z.string()
    .max(200)
    .optional()
    .refine((val) => {
      if (!val) return true;
      const complexReqs = ['real-time', 'blockchain', 'AI', 'ML', '3D', 'VR', 'AR'];
      return !complexReqs.some(req => val.toLowerCase().includes(req.toLowerCase()));
    }, 'Special requirement too complex for MVP - consider simpler alternative'),
});

// ==========================================
// LAUNCH & TIMELINE VALIDATION
// ==========================================
const LaunchSchema = z.object({
  target_date: z.string()
    .refine((val) => {
      const targetDate = new Date(val);
      const today = new Date();
      const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 14 && diffDays <= 90;
    }, 'Timeline should be 2 weeks to 3 months for MVP'),
  
  validation_plan: z.string()
    .min(20, 'How will you validate your MVP?')
    .max(200)
    .refine((val) => {
      const validationMethods = ['users', 'feedback', 'survey', 'interview', 'metrics', 'analytics'];
      return validationMethods.some(method => val.toLowerCase().includes(method));
    }, 'Include specific validation method (user feedback, metrics, etc.)'),
  
  marketing_channel: z.string()
    .min(5)
    .max(100)
    .refine((val) => {
      const channels = val.toLowerCase().split(',').map(c => c.trim());
      return channels.length <= 2;
    }, 'Focus on max 2 marketing channels initially'),
  
  pricing_model: z.string()
    .min(5)
    .max(100)
    .refine((val) => {
      const models = ['free', 'freemium', 'subscription', 'one-time', 'usage-based'];
      return models.some(model => val.toLowerCase().includes(model));
    }, 'Choose a clear pricing model'),
  
  success_definition: z.string()
    .min(20)
    .max(200)
    .refine((val) => /\d+/.test(val), 
      'Success definition must include specific numbers'),
});

// ==========================================
// COMPLETE PRD-ZERO DATA SCHEMA
// ==========================================
export const PRDZeroDataSchema = z.object({
  metadata: MetadataSchema,
  problem: ProblemSchema,
  value: ValueSchema,
  scope: ScopeSchema,
  tech: TechSchema,
  launch: LaunchSchema,
});

// Type export
export type PRDZeroData = z.infer<typeof PRDZeroDataSchema>;

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validates PRD data and returns warnings for risky decisions
 */
export function validatePRDData(data: unknown): {
  valid: boolean;
  data?: PRDZeroData;
  errors?: string[];
  warnings: string[];
} {
  const warnings: string[] = [];
  
  try {
    // Parse and validate
    const validatedData = PRDZeroDataSchema.parse(data);
    
    // Additional business logic warnings
    warnings.push(...generateBusinessWarnings(validatedData));
    
    return {
      valid: true,
      data: validatedData,
      warnings,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        warnings,
      };
    }
    throw error;
  }
}

/**
 * Generate business logic warnings based on validated data
 */
function generateBusinessWarnings(data: PRDZeroData): string[] {
  const warnings: string[] = [];
  
  // Timeline warnings
  const targetDate = new Date(data.launch.target_date);
  const today = new Date();
  const weeks = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7));
  
  if (weeks <= 2) {
    warnings.push('⚠️ CRITICAL: 2 weeks is extremely aggressive - consider extending timeline');
  }
  
  if (weeks <= 4 && data.tech.known_frameworks.split(',').length > 2) {
    warnings.push('⚠️ Too many technologies for short timeline - reduce tech stack');
  }
  
  // Scope warnings
  const totalFeatures = 3 + data.scope.nice_to_have.length;
  if (totalFeatures > 5) {
    warnings.push('⚠️ Feature overload detected - consider moving more to v2');
  }
  
  // Technical complexity warnings
  if (data.tech.database_experience.toLowerCase().includes('none') || 
      data.tech.database_experience.toLowerCase().includes('no')) {
    warnings.push('⚠️ No database experience - consider using a managed solution like Supabase');
  }
  
  // Market validation warnings
  if (data.problem.pain_level < 7) {
    warnings.push('⚡ Low pain level - ensure there\'s real demand before building');
  }
  
  // Success metric warnings
  const targetNum = parseInt(data.value.target_value.match(/\d+/)?.[0] || '0');
  if (targetNum > 1000 && weeks <= 8) {
    warnings.push('⚠️ Ambitious target for timeline - consider reducing initial target');
  }
  
  return warnings;
}

/**
 * Scope protection validator - prevents feature creep
 */
export function validateScopeProtection(features: string[], timeline: number): {
  valid: boolean;
  message: string;
  recommendation?: string;
} {
  const featureCount = features.length;
  const weeksPerFeature = timeline / featureCount;
  
  if (weeksPerFeature < 1) {
    return {
      valid: false,
      message: 'Impossible timeline - less than 1 week per feature',
      recommendation: 'Reduce features to 3 maximum or extend timeline',
    };
  }
  
  if (weeksPerFeature < 2 && featureCount > 3) {
    return {
      valid: false,
      message: 'Risky timeline - not enough time per feature',
      recommendation: 'Solo developers need 2+ weeks per feature for quality',
    };
  }
  
  if (featureCount > 5) {
    return {
      valid: false,
      message: 'Too many features for MVP',
      recommendation: 'Maximum 3 core features + 2 nice-to-haves',
    };
  }
  
  return {
    valid: true,
    message: 'Scope is reasonable for timeline',
  };
}

/**
 * Technical feasibility validator
 */
export function validateTechnicalFeasibility(
  knownTech: string[],
  requiredTech: string[],
  timelineWeeks: number
): {
  feasible: boolean;
  learningCurveWeeks: number;
  recommendation?: string;
} {
  const newTech = requiredTech.filter(tech => 
    !knownTech.some(known => known.toLowerCase().includes(tech.toLowerCase()))
  );
  
  // Estimate 1-2 weeks learning per new technology
  const learningCurveWeeks = newTech.length * 1.5;
  
  if (learningCurveWeeks > timelineWeeks * 0.3) {
    return {
      feasible: false,
      learningCurveWeeks,
      recommendation: `Too much learning required (${Math.round(learningCurveWeeks)} weeks). Stick to technologies you know.`,
    };
  }
  
  if (newTech.length > 2) {
    return {
      feasible: false,
      learningCurveWeeks,
      recommendation: 'Learning more than 2 new technologies is risky for MVP',
    };
  }
  
  return {
    feasible: true,
    learningCurveWeeks,
  };
}

/**
 * Timeline realism checker
 */
export function validateTimelineRealism(
  features: number,
  timelineWeeks: number,
  isSolodev: boolean = true
): {
  realistic: boolean;
  suggestedWeeks: number;
  confidence: number; // 0-100
} {
  // Base calculation: 2 weeks per feature for solo dev
  const baseWeeksNeeded = features * (isSolodev ? 2 : 1);
  
  // Add overhead for testing, deployment, fixes
  const overheadMultiplier = 1.5;
  const suggestedWeeks = Math.ceil(baseWeeksNeeded * overheadMultiplier);
  
  const realistic = timelineWeeks >= suggestedWeeks * 0.8; // Allow 20% optimism
  
  // Calculate confidence
  let confidence = 100;
  if (timelineWeeks < suggestedWeeks) {
    confidence = Math.max(0, Math.round((timelineWeeks / suggestedWeeks) * 100));
  }
  
  return {
    realistic,
    suggestedWeeks,
    confidence,
  };
}

/**
 * MVP readiness score calculator
 */
export function calculateMVPReadiness(data: PRDZeroData): {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  blockers: string[];
} {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const blockers: string[] = [];
  
  // Problem clarity (20 points)
  if (data.problem.pain_level >= 8) {
    strengths.push('Strong problem validation');
  } else if (data.problem.pain_level < 6) {
    score -= 20;
    weaknesses.push('Weak problem validation');
  } else {
    score -= 10;
  }
  
  // Scope control (30 points)
  const featureCount = 3 + data.scope.nice_to_have.length;
  if (featureCount <= 4) {
    strengths.push('Well-controlled scope');
  } else if (featureCount > 6) {
    score -= 30;
    blockers.push('Scope too large for MVP');
  } else {
    score -= 15;
    weaknesses.push('Scope could be tighter');
  }
  
  // Technical feasibility (25 points)
  const techComplexity = data.tech.known_frameworks.split(',').length;
  if (techComplexity <= 2) {
    strengths.push('Simple tech stack');
  } else if (techComplexity > 4) {
    score -= 25;
    blockers.push('Tech stack too complex');
  } else {
    score -= 12;
    weaknesses.push('Consider simplifying tech stack');
  }
  
  // Timeline realism (25 points)
  const targetDate = new Date(data.launch.target_date);
  const today = new Date();
  const weeks = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7));
  
  if (weeks >= 6 && weeks <= 12) {
    strengths.push('Realistic timeline');
  } else if (weeks < 3) {
    score -= 25;
    blockers.push('Timeline too aggressive');
  } else if (weeks > 20) {
    score -= 15;
    weaknesses.push('Timeline too long - risk losing momentum');
  } else {
    score -= 10;
  }
  
  return {
    score: Math.max(0, score),
    strengths,
    weaknesses,
    blockers,
  };
}