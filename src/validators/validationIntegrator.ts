import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { PRDData } from '../types/index.js';
import {
  type PRDZeroData,
  validatePRDData,
  calculateMVPReadiness,
  validateTimelineRealism,
  validateTechnicalFeasibility,
} from './prdZeroSchemas.js';
import {
  performComprehensiveScopeValidation,
  analyzeFeatureComplexity,
} from './scopeProtection.js';

/**
 * Main validation integrator that combines all validation systems
 * Provides comprehensive analysis and protection for solo developers
 */

// ==========================================
// DATA TRANSFORMATION
// ==========================================

/**
 * Transform PRDData to PRDZeroData format for validation
 */
export function transformToPRDZeroData(data: PRDData): PRDZeroData {
  const now = new Date();
  
  // Extract tech stack components
  const knownFrameworks = [
    ...(data.techStack.frontend || []),
    ...(data.techStack.backend || []),
  ].join(', ');
  
  const database = data.techStack.database?.join(', ') || 'Not specified';
  const deployment = data.techStack.hosting?.join(', ') || 'Not specified';
  
  // Calculate target date
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + data.timeline.totalWeeks * 7);
  
  // Build PRDZeroData structure
  return {
    metadata: {
      created_at: data.generatedAt.toISOString(),
      tool_version: '1.0.0', // Should be from package.json
      warnings: [],
      session_type: data.sessionDuration <= 15 ? 'quick' : 'complete',
      completion_time_minutes: data.sessionDuration,
    },
    problem: {
      statement: data.mvp.problemStatement || data.project.problemStatement,
      target_user: data.project.targetAudience,
      pain_level: 7, // Default, should be collected in questions
      current_solution: 'Manual process', // Should be collected
    },
    value: {
      proposition: data.project.uniqueValue,
      success_metric: data.mvp.successMetrics[0] || 'Not defined',
      target_value: '100 users', // Should be extracted from success metric
    },
    scope: {
      feature_1: data.mvp.coreFeatures[0] || 'Not defined',
      feature_2: data.mvp.coreFeatures[1] || 'Not defined',
      feature_3: data.mvp.coreFeatures[2] || 'Not defined',
      nice_to_have: data.mvp.coreFeatures.slice(3, 8),
      wont_have_v1: data.mvp.nonGoals || data.mvp.outOfScope || [],
    },
    tech: {
      known_frameworks: knownFrameworks || 'Not specified',
      database_experience: database,
      deployment_experience: deployment,
      performance_requirements: 'Standard web app performance',
      special_requirements: data.mvp.constraints?.join(', ') || 'None',
    },
    launch: {
      target_date: targetDate.toISOString().split('T')[0],
      validation_plan: 'User feedback and metrics tracking',
      marketing_channel: 'Direct outreach',
      pricing_model: 'Freemium',
      success_definition: data.mvp.successMetrics.join(', ') || 'Not defined',
    },
  };
}

// ==========================================
// COMPREHENSIVE VALIDATION REPORT
// ==========================================

export interface ValidationReport {
  valid: boolean;
  shouldProceed: boolean;
  mvpReadinessScore: number;
  
  // Detailed analysis
  scopeAnalysis: {
    featureComplexity: Array<{
      feature: string;
      complexity: number;
      level: string;
      estimatedWeeks: number;
    }>;
    totalComplexity: number;
    recommendedFeatures: number;
  };
  
  timelineAnalysis: {
    realistic: boolean;
    suggestedWeeks: number;
    confidence: number;
    riskLevel: string;
  };
  
  technicalAnalysis: {
    feasible: boolean;
    learningCurveWeeks: number;
    overengineeringDetected: boolean;
    recommendations: string[];
  };
  
  // Warnings and recommendations
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  blockers: string[];
  
  // Formatted output
  summary: string;
}

/**
 * Perform comprehensive validation and generate report
 */
export function validateProject(data: PRDData): ValidationReport {
  // Transform data
  const prdZeroData = transformToPRDZeroData(data);
  
  // Run schema validation
  const schemaValidation = validatePRDData(prdZeroData);
  
  // Calculate MVP readiness
  const mvpReadiness = calculateMVPReadiness(prdZeroData);
  
  // Analyze timeline
  const timelineValidation = validateTimelineRealism(
    data.mvp.coreFeatures.length,
    data.timeline.totalWeeks,
    true // Solo developer
  );
  
  // Analyze technical feasibility
  const techValidation = validateTechnicalFeasibility(
    [], // Known tech (should be collected)
    [...(data.techStack.frontend || []), ...(data.techStack.backend || [])],
    data.timeline.totalWeeks
  );
  
  // Run comprehensive scope validation
  const scopeValidation = performComprehensiveScopeValidation({
    features: data.mvp.coreFeatures,
    timelineWeeks: data.timeline.totalWeeks,
    techStack: [
      ...(data.techStack.frontend || []),
      ...(data.techStack.backend || []),
      ...(data.techStack.database || []),
    ],
    targetUsers: 100, // Default estimate
    experienceLevel: 'intermediate',
    mvpGoal: data.mvp.solutionApproach || data.project.description,
  });
  
  // Analyze each feature
  const featureAnalysis = data.mvp.coreFeatures.map(feature => {
    const complexity = analyzeFeatureComplexity(feature);
    return {
      feature,
      complexity: complexity.score,
      level: complexity.level,
      estimatedWeeks: complexity.estimatedWeeks,
    };
  });
  
  // Compile report
  const report: ValidationReport = {
    valid: schemaValidation.valid && scopeValidation.valid,
    shouldProceed: scopeValidation.shouldProceed && mvpReadiness.score >= 60,
    mvpReadinessScore: mvpReadiness.score,
    
    scopeAnalysis: {
      featureComplexity: featureAnalysis,
      totalComplexity: featureAnalysis.reduce((sum, f) => sum + f.complexity, 0),
      recommendedFeatures: Math.min(3, data.mvp.coreFeatures.length),
    },
    
    timelineAnalysis: {
      realistic: timelineValidation.realistic,
      suggestedWeeks: timelineValidation.suggestedWeeks,
      confidence: timelineValidation.confidence,
      riskLevel: scopeValidation.adjustedScope 
        ? (timelineValidation.confidence >= 80 ? 'low' : 
           timelineValidation.confidence >= 60 ? 'medium' : 
           timelineValidation.confidence >= 40 ? 'high' : 'extreme')
        : 'unknown',
    },
    
    technicalAnalysis: {
      feasible: techValidation.feasible,
      learningCurveWeeks: techValidation.learningCurveWeeks,
      overengineeringDetected: false, // Set based on scope validation
      recommendations: techValidation.recommendation ? [techValidation.recommendation] : [],
    },
    
    criticalIssues: [
      ...mvpReadiness.blockers,
      ...(schemaValidation.errors || []),
    ],
    
    warnings: [
      ...mvpReadiness.weaknesses,
      ...schemaValidation.warnings,
      ...scopeValidation.recommendations,
    ],
    
    recommendations: scopeValidation.recommendations,
    blockers: mvpReadiness.blockers,
    
    summary: generateValidationSummary(
      mvpReadiness.score,
      scopeValidation.shouldProceed,
      timelineValidation.confidence
    ),
  };
  
  return report;
}

/**
 * Generate human-readable validation summary
 */
function generateValidationSummary(
  readinessScore: number,
  shouldProceed: boolean,
  timelineConfidence: number
): string {
  let summary = '';
  
  // Overall assessment
  if (readinessScore >= 80 && shouldProceed) {
    summary = '✅ Project is well-scoped and ready to proceed!';
  } else if (readinessScore >= 60 && shouldProceed) {
    summary = '⚠️ Project is viable but needs some adjustments.';
  } else if (readinessScore >= 40) {
    summary = '🚨 Project has significant risks that need addressing.';
  } else {
    summary = '❌ Project scope needs major revision before proceeding.';
  }
  
  // Add specifics
  summary += '\n\n';
  
  if (readinessScore < 60) {
    summary += `MVP Readiness: ${readinessScore}% (Minimum 60% recommended)\n`;
  } else {
    summary += `MVP Readiness: ${readinessScore}% ✓\n`;
  }
  
  if (timelineConfidence < 60) {
    summary += `Timeline Confidence: ${timelineConfidence}% (High risk)\n`;
  } else {
    summary += `Timeline Confidence: ${timelineConfidence}% ✓\n`;
  }
  
  return summary;
}

// ==========================================
// VALIDATION DISPLAY
// ==========================================

/**
 * Display validation report in terminal
 */
export function displayValidationReport(report: ValidationReport): void {
  Logger.title('Validation Report');
  
  // Overall status
  if (report.shouldProceed) {
    Logger.success(report.summary);
  } else {
    Logger.error(report.summary);
  }
  
  // MVP Readiness Score
  Logger.section('MVP Readiness Score');
  const scoreColor = report.mvpReadinessScore >= 80 ? chalk.green :
                     report.mvpReadinessScore >= 60 ? chalk.yellow :
                     chalk.red;
  Logger.info(`Score: ${scoreColor(report.mvpReadinessScore + '%')}`);
  
  // Scope Analysis
  Logger.section('Scope Analysis');
  Logger.item(`Total Features: ${report.scopeAnalysis.featureComplexity.length}`);
  Logger.item(`Recommended: ${report.scopeAnalysis.recommendedFeatures} core features`);
  Logger.item(`Total Complexity: ${report.scopeAnalysis.totalComplexity}/30`);
  
  report.scopeAnalysis.featureComplexity.forEach((feature, i) => {
    const complexityColor = feature.complexity <= 3 ? chalk.green :
                           feature.complexity <= 6 ? chalk.yellow :
                           chalk.red;
    Logger.item(`  ${i + 1}. ${feature.feature.substring(0, 50)}...`);
    Logger.item(`     Complexity: ${complexityColor(feature.level)} (${feature.estimatedWeeks} weeks)`);
  });
  
  // Timeline Analysis
  Logger.section('Timeline Analysis');
  const timelineColor = report.timelineAnalysis.confidence >= 80 ? chalk.green :
                        report.timelineAnalysis.confidence >= 60 ? chalk.yellow :
                        chalk.red;
  Logger.item(`Confidence: ${timelineColor(report.timelineAnalysis.confidence + '%')}`);
  Logger.item(`Risk Level: ${report.timelineAnalysis.riskLevel}`);
  if (!report.timelineAnalysis.realistic) {
    Logger.warning(`Suggested timeline: ${report.timelineAnalysis.suggestedWeeks} weeks`);
  }
  
  // Critical Issues
  if (report.criticalIssues.length > 0) {
    Logger.section('🚨 Critical Issues');
    report.criticalIssues.forEach(issue => {
      Logger.error(`• ${issue}`);
    });
  }
  
  // Warnings
  if (report.warnings.length > 0) {
    Logger.section('⚠️ Warnings');
    report.warnings.forEach(warning => {
      Logger.warning(`• ${warning}`);
    });
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    Logger.section('💡 Recommendations');
    report.recommendations.forEach(rec => {
      Logger.info(`• ${rec}`);
    });
  }
  
  // Final verdict
  Logger.section('Decision');
  if (report.shouldProceed) {
    Logger.success('✅ You can proceed with this MVP plan');
    Logger.info('Consider the warnings and recommendations above');
  } else {
    Logger.error('❌ This plan needs revision before proceeding');
    Logger.info('Address the critical issues and reduce scope');
  }
}

// ==========================================
// INTERACTIVE VALIDATION
// ==========================================

/**
 * Run interactive validation with user feedback
 */
export async function runInteractiveValidation(data: PRDData): Promise<boolean> {
  Logger.title('Running Comprehensive Validation...');
  
  const report = validateProject(data);
  displayValidationReport(report);
  
  if (!report.shouldProceed) {
    Logger.warning('\nValidation failed. Please revise your plan.');
    return false;
  }
  
  if (report.warnings.length > 0) {
    Logger.info('\nValidation passed with warnings. Review them carefully.');
  } else {
    Logger.success('\nValidation passed! Your MVP plan looks solid.');
  }
  
  return true;
}