import chalk from 'chalk';
import { Logger } from '../utils/logger.js';

/**
 * Advanced scope protection mechanisms for solo developers
 * Prevents common pitfalls: feature creep, over-engineering, unrealistic goals
 */

// ==========================================
// ANTI-PATTERNS DETECTION
// ==========================================

export const COMPLEXITY_KEYWORDS = {
  high: [
    'AI', 'ML', 'machine learning', 'artificial intelligence',
    'blockchain', 'crypto', 'web3', 'NFT',
    'real-time', 'websocket', 'streaming',
    'scalable', 'microservices', 'distributed',
    '3D', 'VR', 'AR', 'metaverse',
    'marketplace', 'platform', 'ecosystem',
    'social network', 'community platform',
  ],
  medium: [
    'payment', 'subscription', 'billing',
    'authentication', 'authorization', 'SSO',
    'notification', 'email', 'SMS',
    'file upload', 'image processing',
    'search', 'filtering', 'sorting',
    'dashboard', 'analytics', 'reporting',
  ],
  low: [
    'form', 'CRUD', 'list', 'display',
    'static', 'landing page', 'blog',
    'contact', 'about', 'FAQ',
  ],
};

export const SCOPE_CREEP_PHRASES = [
  'and also',
  'plus',
  'in addition',
  'furthermore',
  'as well as',
  'along with',
  'everything',
  'all features',
  'complete solution',
  'full platform',
];

// ==========================================
// FEATURE COMPLEXITY ANALYZER
// ==========================================

export interface ComplexityScore {
  score: number; // 1-10
  level: 'low' | 'medium' | 'high' | 'extreme';
  warnings: string[];
  estimatedWeeks: number;
}

export function analyzeFeatureComplexity(feature: string): ComplexityScore {
  const featureLower = feature.toLowerCase();
  const warnings: string[] = [];
  let score = 1; // Base score
  
  // Check for high complexity keywords
  const highComplexityMatches = COMPLEXITY_KEYWORDS.high.filter(keyword => 
    featureLower.includes(keyword.toLowerCase())
  );
  
  if (highComplexityMatches.length > 0) {
    score += highComplexityMatches.length * 3;
    warnings.push(`High complexity detected: ${highComplexityMatches.join(', ')}`);
  }
  
  // Check for medium complexity
  const mediumComplexityMatches = COMPLEXITY_KEYWORDS.medium.filter(keyword => 
    featureLower.includes(keyword.toLowerCase())
  );
  
  if (mediumComplexityMatches.length > 0) {
    score += mediumComplexityMatches.length * 1.5;
    warnings.push(`Medium complexity elements: ${mediumComplexityMatches.join(', ')}`);
  }
  
  // Check for scope creep indicators
  const scopeCreepDetected = SCOPE_CREEP_PHRASES.some(phrase => 
    featureLower.includes(phrase)
  );
  
  if (scopeCreepDetected) {
    score += 2;
    warnings.push('Multiple sub-features detected - consider splitting');
  }
  
  // Check feature length (longer = more complex usually)
  if (feature.length > 100) {
    score += 1;
    warnings.push('Feature description too detailed - might be multiple features');
  }
  
  // Cap score at 10
  score = Math.min(10, score);
  
  // Determine level
  let level: 'low' | 'medium' | 'high' | 'extreme';
  if (score <= 3) level = 'low';
  else if (score <= 5) level = 'medium';
  else if (score <= 8) level = 'high';
  else level = 'extreme';
  
  // Estimate weeks based on complexity
  const estimatedWeeks = Math.ceil(score / 2);
  
  return {
    score,
    level,
    warnings,
    estimatedWeeks,
  };
}

// ==========================================
// SOLO DEVELOPER CAPACITY VALIDATOR
// ==========================================

export interface CapacityAnalysis {
  feasible: boolean;
  totalComplexity: number;
  estimatedWeeks: number;
  availableWeeks: number;
  utilizationPercent: number;
  recommendations: string[];
}

export function validateSoloDeveloperCapacity(
  features: string[],
  timelineWeeks: number,
  experienceLevel: 'beginner' | 'intermediate' | 'expert' = 'intermediate'
): CapacityAnalysis {
  const recommendations: string[] = [];
  
  // Analyze each feature
  const complexityScores = features.map(f => analyzeFeatureComplexity(f));
  const totalComplexity = complexityScores.reduce((sum, c) => sum + c.score, 0);
  
  // Calculate estimated weeks
  let estimatedWeeks = complexityScores.reduce((sum, c) => sum + c.estimatedWeeks, 0);
  
  // Adjust for experience level
  const experienceMultiplier = {
    beginner: 1.5,
    intermediate: 1.0,
    expert: 0.8,
  };
  estimatedWeeks *= experienceMultiplier[experienceLevel];
  
  // Add overhead for testing, debugging, deployment (30%)
  estimatedWeeks *= 1.3;
  
  // Calculate utilization
  const utilizationPercent = (estimatedWeeks / timelineWeeks) * 100;
  
  // Determine feasibility
  const feasible = utilizationPercent <= 80; // 80% utilization max for safety
  
  // Generate recommendations
  if (!feasible) {
    recommendations.push('⚠️ Timeline too aggressive for feature set');
    
    if (features.length > 3) {
      recommendations.push('Reduce to 3 core features maximum');
    }
    
    const highComplexityFeatures = complexityScores.filter(c => c.level === 'high' || c.level === 'extreme');
    if (highComplexityFeatures.length > 0) {
      recommendations.push('Simplify or defer high-complexity features');
    }
    
    const suggestedWeeks = Math.ceil(estimatedWeeks / 0.8);
    recommendations.push(`Suggested timeline: ${suggestedWeeks} weeks`);
  } else if (utilizationPercent > 60) {
    recommendations.push('✓ Timeline is tight but achievable');
    recommendations.push('Consider adding 1-2 weeks buffer for unexpected issues');
  } else if (utilizationPercent < 40) {
    recommendations.push('Timeline has good buffer - consider earlier launch');
  }
  
  return {
    feasible,
    totalComplexity,
    estimatedWeeks: Math.ceil(estimatedWeeks),
    availableWeeks: timelineWeeks,
    utilizationPercent: Math.round(utilizationPercent),
    recommendations,
  };
}

// ==========================================
// ANTI-OVERENGINEERING VALIDATOR
// ==========================================

export function detectOverengineering(
  techStack: string[],
  features: string[],
  userCount: number
): {
  detected: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for premature optimization
  if (techStack.some(tech => tech.toLowerCase().includes('kubernetes')) && userCount < 10000) {
    issues.push('Kubernetes is overkill for < 10k users');
    suggestions.push('Use simple VPS or PaaS like Railway/Fly.io');
  }
  
  if (techStack.some(tech => tech.toLowerCase().includes('microservice')) && features.length < 10) {
    issues.push('Microservices unnecessary for small feature set');
    suggestions.push('Start with monolithic architecture');
  }
  
  if (techStack.some(tech => tech.toLowerCase().includes('redis')) && userCount < 1000) {
    issues.push('Redis caching premature for < 1000 users');
    suggestions.push('Use in-memory caching initially');
  }
  
  if (techStack.some(tech => tech.toLowerCase().includes('graphql')) && features.length < 5) {
    issues.push('GraphQL adds complexity for simple APIs');
    suggestions.push('Start with REST API');
  }
  
  // Check for too many databases/services
  const databases = techStack.filter(tech => 
    ['postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb'].some(db => 
      tech.toLowerCase().includes(db)
    )
  );
  
  if (databases.length > 1) {
    issues.push('Multiple databases increase complexity');
    suggestions.push('Start with single database (PostgreSQL recommended)');
  }
  
  // Check for unnecessary real-time features
  if (features.some(f => f.toLowerCase().includes('real-time')) && 
      !features.some(f => f.toLowerCase().includes('chat') || f.toLowerCase().includes('collaboration'))) {
    issues.push('Real-time might be unnecessary');
    suggestions.push('Consider polling or refresh buttons initially');
  }
  
  return {
    detected: issues.length > 0,
    issues,
    suggestions,
  };
}

// ==========================================
// TIMELINE SANITY CHECKER
// ==========================================

export interface TimelineSanity {
  sane: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  adjustedTimeline: number;
  bufferWeeks: number;
  criticalMilestones: string[];
}

export function checkTimelineSanity(
  features: string[],
  targetWeeks: number,
  hasExistingCode: boolean = false
): TimelineSanity {
  const complexityScores = features.map(f => analyzeFeatureComplexity(f));
  const baseWeeks = complexityScores.reduce((sum, c) => sum + c.estimatedWeeks, 0);
  
  // Add time for non-coding activities
  const planningWeeks = 0.5;
  const testingWeeks = Math.ceil(baseWeeks * 0.2);
  const deploymentWeeks = 0.5;
  const bufferWeeks = Math.ceil(baseWeeks * 0.3); // 30% buffer
  
  let adjustedTimeline = baseWeeks + planningWeeks + testingWeeks + deploymentWeeks + bufferWeeks;
  
  // Reduce if has existing code
  if (hasExistingCode) {
    adjustedTimeline *= 0.8;
  }
  
  adjustedTimeline = Math.ceil(adjustedTimeline);
  
  // Determine risk level
  const ratio = targetWeeks / adjustedTimeline;
  let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  
  if (ratio >= 1.2) riskLevel = 'low';
  else if (ratio >= 0.9) riskLevel = 'medium';
  else if (ratio >= 0.6) riskLevel = 'high';
  else riskLevel = 'extreme';
  
  // Critical milestones
  const criticalMilestones: string[] = [];
  
  let currentWeek = Math.ceil(planningWeeks);
  criticalMilestones.push(`Week ${currentWeek}: Planning complete, start development`);
  
  currentWeek = Math.ceil(baseWeeks / 2);
  criticalMilestones.push(`Week ${currentWeek}: Core features working (50% complete)`);
  
  currentWeek = Math.ceil(baseWeeks + planningWeeks);
  criticalMilestones.push(`Week ${currentWeek}: All features complete, begin testing`);
  
  currentWeek = Math.ceil(adjustedTimeline - deploymentWeeks);
  criticalMilestones.push(`Week ${currentWeek}: Testing complete, prepare deployment`);
  
  currentWeek = adjustedTimeline;
  criticalMilestones.push(`Week ${currentWeek}: Launch!`);
  
  return {
    sane: riskLevel !== 'extreme',
    riskLevel,
    adjustedTimeline,
    bufferWeeks: Math.ceil(bufferWeeks),
    criticalMilestones,
  };
}

// ==========================================
// FEATURE PRIORITIZATION
// ==========================================

export interface PrioritizedFeature {
  feature: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have' | 'defer';
  complexity: ComplexityScore;
  reasoning: string;
}

export function prioritizeFeatures(
  features: string[],
  timelineWeeks: number,
  mvpGoal: string
): PrioritizedFeature[] {
  const prioritized: PrioritizedFeature[] = [];
  
  // Analyze all features
  const analyzed = features.map(feature => ({
    feature,
    complexity: analyzeFeatureComplexity(feature),
  }));
  
  // Sort by complexity (simple first for quick wins)
  analyzed.sort((a, b) => a.complexity.score - b.complexity.score);
  
  let weeksBudgeted = 0;
  const coreWeeks = timelineWeeks * 0.7; // 70% for must-haves
  
  analyzed.forEach(item => {
    let priority: 'must-have' | 'should-have' | 'nice-to-have' | 'defer';
    let reasoning: string;
    
    // Check if directly related to MVP goal
    const isCore = mvpGoal.toLowerCase().split(' ').some(word => 
      item.feature.toLowerCase().includes(word)
    );
    
    if (isCore && weeksBudgeted + item.complexity.estimatedWeeks <= coreWeeks) {
      priority = 'must-have';
      reasoning = 'Core to MVP goal';
      weeksBudgeted += item.complexity.estimatedWeeks;
    } else if (item.complexity.score <= 3 && weeksBudgeted + item.complexity.estimatedWeeks <= timelineWeeks * 0.9) {
      priority = 'should-have';
      reasoning = 'Low complexity, fits in timeline';
      weeksBudgeted += item.complexity.estimatedWeeks;
    } else if (item.complexity.score <= 5 && weeksBudgeted + item.complexity.estimatedWeeks <= timelineWeeks) {
      priority = 'nice-to-have';
      reasoning = 'Medium complexity, optional for MVP';
    } else {
      priority = 'defer';
      reasoning = item.complexity.score > 7 
        ? 'Too complex for MVP timeline' 
        : 'Insufficient time in current timeline';
    }
    
    prioritized.push({
      feature: item.feature,
      priority,
      complexity: item.complexity,
      reasoning,
    });
  });
  
  return prioritized;
}

// ==========================================
// WARNING SYSTEM
// ==========================================

export class ScopeProtectionWarnings {
  private warnings: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    suggestion?: string;
  }> = [];
  
  addInfo(message: string, suggestion?: string) {
    this.warnings.push({ level: 'info', message, suggestion });
  }
  
  addWarning(message: string, suggestion?: string) {
    this.warnings.push({ level: 'warning', message, suggestion });
  }
  
  addCritical(message: string, suggestion?: string) {
    this.warnings.push({ level: 'critical', message, suggestion });
  }
  
  display() {
    if (this.warnings.length === 0) return;
    
    Logger.section('Scope Protection Analysis');
    
    this.warnings.forEach(warning => {
      switch (warning.level) {
        case 'info':
          Logger.info(`ℹ️  ${warning.message}`);
          break;
        case 'warning':
          Logger.warning(`⚠️  ${warning.message}`);
          break;
        case 'critical':
          Logger.error(`🚨 ${warning.message}`);
          break;
      }
      
      if (warning.suggestion) {
        Logger.item(`   💡 ${chalk.italic(warning.suggestion)}`);
      }
    });
  }
  
  getCriticalCount(): number {
    return this.warnings.filter(w => w.level === 'critical').length;
  }
  
  shouldBlock(): boolean {
    return this.getCriticalCount() > 2;
  }
  
  getAll() {
    return [...this.warnings];
  }
}

// ==========================================
// COMPREHENSIVE SCOPE VALIDATOR
// ==========================================

export function performComprehensiveScopeValidation(data: {
  features: string[];
  timelineWeeks: number;
  techStack: string[];
  targetUsers: number;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  mvpGoal: string;
}): {
  valid: boolean;
  shouldProceed: boolean;
  warnings: ScopeProtectionWarnings;
  recommendations: string[];
  adjustedScope?: {
    features: PrioritizedFeature[];
    timeline: number;
  };
} {
  const warnings = new ScopeProtectionWarnings();
  const recommendations: string[] = [];
  
  // 1. Check capacity
  const capacity = validateSoloDeveloperCapacity(
    data.features,
    data.timelineWeeks,
    data.experienceLevel
  );
  
  if (!capacity.feasible) {
    warnings.addCritical(
      `Timeline too aggressive: ${capacity.utilizationPercent}% utilization`,
      `Extend to ${capacity.estimatedWeeks} weeks or reduce scope`
    );
  } else if (capacity.utilizationPercent > 70) {
    warnings.addWarning(
      `High utilization: ${capacity.utilizationPercent}%`,
      'Consider adding buffer time'
    );
  }
  
  // 2. Check for overengineering
  const overengineering = detectOverengineering(
    data.techStack,
    data.features,
    data.targetUsers
  );
  
  if (overengineering.detected) {
    overengineering.issues.forEach((issue, i) => {
      warnings.addWarning(issue, overengineering.suggestions[i]);
    });
  }
  
  // 3. Check timeline sanity
  const timeline = checkTimelineSanity(
    data.features,
    data.timelineWeeks
  );
  
  if (!timeline.sane) {
    warnings.addCritical(
      `Timeline risk level: ${timeline.riskLevel.toUpperCase()}`,
      `Adjust to ${timeline.adjustedTimeline} weeks for safe delivery`
    );
  }
  
  // 4. Prioritize features
  const prioritized = prioritizeFeatures(
    data.features,
    data.timelineWeeks,
    data.mvpGoal
  );
  
  const mustHaves = prioritized.filter(p => p.priority === 'must-have');
  const deferred = prioritized.filter(p => p.priority === 'defer');
  
  if (mustHaves.length === 0) {
    warnings.addCritical(
      'No must-have features identified',
      'Ensure at least one feature directly addresses MVP goal'
    );
  }
  
  if (deferred.length > 0) {
    warnings.addInfo(
      `${deferred.length} features deferred to v2`,
      'Focus on must-haves first'
    );
    recommendations.push(...deferred.map(d => `Defer: ${d.feature} (${d.reasoning})`));
  }
  
  // Generate final recommendations
  if (capacity.recommendations.length > 0) {
    recommendations.push(...capacity.recommendations);
  }
  
  // Determine if should proceed
  const shouldProceed = warnings.getCriticalCount() <= 1 && timeline.riskLevel !== 'extreme';
  const valid = warnings.getCriticalCount() === 0;
  
  return {
    valid,
    shouldProceed,
    warnings,
    recommendations,
    adjustedScope: {
      features: prioritized,
      timeline: timeline.adjustedTimeline,
    },
  };
}