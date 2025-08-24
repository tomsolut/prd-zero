import { PRDData } from '../types/index.js';
import { AIService } from '../services/aiService.js';
import type { SessionAnalytics as ISessionAnalytics } from '../services/sessionAnalytics.js';
import { OptimizedAIResponse, Warning } from '../types/ai.js';
import { QuestionTypeDetector } from '../services/questionTypeDetector.js';
import { ContextMemoryService } from '../services/contextMemory.js';
import { QuestionCategory } from '../types/contextMemory.js';

// Simple SessionAnalytics implementation for AI tracking
class SessionAnalytics implements Partial<ISessionAnalytics> {
  sessionId: string = '';
  questionsAnswered: number = 0;
  aiInterventions: number = 0;
  totalDuration: number = 0;
  validationScore: number = 0;
  filesGenerated: string[] = [];
}
import type { FlexibleInputOptions } from '../utils/flexibleInput.js';
import { Logger } from '../utils/logger.js';
import { askFlexibleInput, askListInput } from '../utils/flexibleInput.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

export class AIEnhancedQuestions {
  private aiService: AIService;
  private analytics: SessionAnalytics;
  private contextMemory: ContextMemoryService;
  private aiMode: 'active' | 'passive' | 'off';
  private showCosts: boolean;

  constructor(
    sessionId: string,
    aiMode: 'active' | 'passive' | 'off' = 'passive',
    showCosts: boolean = true
  ) {
    this.aiService = new AIService();
    this.analytics = new SessionAnalytics();
    this.contextMemory = new ContextMemoryService();
    this.analytics.sessionId = sessionId;
    this.aiMode = aiMode;
    this.showCosts = showCosts;
  }

  /**
   * Detect question category based on keywords
   */
  private detectCategory(question: string): QuestionCategory {
    const q = question.toLowerCase();
    
    if (q.includes('name') || q.includes('beschreib') || q.includes('zielgruppe') || q.includes('target')) {
      return 'project';
    }
    if (q.includes('feature') || q.includes('funktion') || q.includes('mvp') || q.includes('scope')) {
      return 'mvp';
    }
    if (q.includes('tech') || q.includes('stack') || q.includes('framework')) {
      return 'tech';
    }
    if (q.includes('zeit') || q.includes('timeline') || q.includes('wochen') || q.includes('weeks')) {
      return 'timeline';
    }
    if (q.includes('launch') || q.includes('release') || q.includes('go-to-market')) {
      return 'launch';
    }
    
    return 'other';
  }

  /**
   * Display severity-based feedback with color coding
   */
  private displayOptimizedFeedback(response: OptimizedAIResponse): void {
    // Assessment icon and color
    const assessmentDisplay = {
      good: { icon: '✅', color: chalk.green, label: 'MVP-Ready' },
      warning: { icon: '⚠️', color: chalk.yellow, label: 'Needs Improvement' },
      critical: { icon: '🚨', color: chalk.red, label: 'Critical Issue' }
    };

    const { icon, color, label } = assessmentDisplay[response.assessment];
    
    Logger.info('');
    Logger.info(color(`${icon} ${label}`));
    Logger.info(chalk.gray('─'.repeat(60)));
    
    // Main feedback
    Logger.info(color('Feedback:'));
    Logger.info(response.feedback);
    
    // Warnings if any
    if (response.warnings && response.warnings.length > 0) {
      Logger.info('');
      Logger.info(color('Warnings:'));
      response.warnings.forEach((warning: Warning) => {
        const severityColor = warning.severity === 'high' ? chalk.red :
                             warning.severity === 'medium' ? chalk.yellow :
                             chalk.gray;
        Logger.info(`  ${severityColor('•')} ${warning.message}`);
      });
    }
    
    // Next actions
    if (response.next_actions && response.next_actions.length > 0) {
      Logger.info('');
      Logger.info(chalk.cyan('📋 Next Actions:'));
      response.next_actions.forEach((action, index) => {
        Logger.info(`  ${index + 1}. ${action}`);
      });
    }
    
    // Question-specific metrics
    if (response.measurability_score !== undefined) {
      Logger.info('');
      Logger.info(chalk.gray(`Measurability Score: ${response.measurability_score}/10`));
    }
    
    // Enhanced Tech Stack metrics
    if (response.innovation_tokens !== undefined) {
      const tokenColor = response.innovation_tokens.used > 2 ? chalk.red : chalk.green;
      Logger.info('');
      Logger.info(tokenColor(`💡 Innovation Tokens: ${response.innovation_tokens.used}/2`));
      
      if (response.innovation_tokens.details && response.innovation_tokens.details.length > 0) {
        response.innovation_tokens.details.forEach(token => {
          const riskColor = token.risk_level === 'high' ? chalk.red :
                           token.risk_level === 'medium' ? chalk.yellow :
                           chalk.green;
          Logger.info(`  • ${token.tech}: ${token.token_cost} token (${riskColor(token.risk_level)} risk) - ${token.reason}`);
        });
      }
    } else if (response.innovation_tokens_used !== undefined) {
      // Fallback for simple token count
      const tokenColor = response.innovation_tokens_used > 2 ? chalk.red : chalk.green;
      Logger.info(tokenColor(`Innovation Tokens Used: ${response.innovation_tokens_used}/2`));
    }
    
    // Skills Gap Analysis
    if (response.skills_gap_analysis) {
      Logger.info('');
      Logger.info(chalk.cyan('📚 Skills Gap Analysis:'));
      Logger.info(`  • New Technologies: ${response.skills_gap_analysis.new_technologies.join(', ')}`);
      Logger.info(`  • Learning Hours Estimate: ${response.skills_gap_analysis.learning_hours_estimate}h`);
      if (response.skills_gap_analysis.tutorial_hell_risk.length > 0) {
        Logger.info(chalk.yellow(`  ⚠️ Tutorial Hell Risk: ${response.skills_gap_analysis.tutorial_hell_risk.join(', ')}`));
      }
      Logger.info(`  • Timeline Impact: +${response.skills_gap_analysis.timeline_impact_weeks} weeks`);
    }
    
    // Compatibility and Solo Developer Scores
    if (response.compatibility_score !== undefined) {
      const compatColor = response.compatibility_score >= 7 ? chalk.green :
                         response.compatibility_score >= 5 ? chalk.yellow :
                         chalk.red;
      Logger.info(compatColor(`🔧 Stack Compatibility: ${response.compatibility_score}/10`));
    }
    
    if (response.solo_developer_score !== undefined) {
      const soloColor = response.solo_developer_score >= 7 ? chalk.green :
                        response.solo_developer_score >= 5 ? chalk.yellow :
                        chalk.red;
      Logger.info(soloColor(`👤 Solo Developer Score: ${response.solo_developer_score}/10`));
    }
    
    // Tech Stack Recommendations
    if (response.recommendations) {
      Logger.info('');
      Logger.info(chalk.cyan('🔄 Recommendations:'));
      
      if (response.recommendations.keep && response.recommendations.keep.length > 0) {
        Logger.info(chalk.green('  ✅ Keep:'));
        response.recommendations.keep.forEach(tech => {
          Logger.info(`    • ${tech}`);
        });
      }
      
      if (response.recommendations.replace && response.recommendations.replace.length > 0) {
        Logger.info(chalk.yellow('  🔄 Replace:'));
        response.recommendations.replace.forEach(rec => {
          Logger.info(`    • ${rec.current} → ${rec.suggested}`);
          Logger.info(chalk.gray(`      ${rec.reason}`));
        });
      }
      
      if (response.recommendations.add_missing && response.recommendations.add_missing.length > 0) {
        Logger.info(chalk.blue('  ➕ Add Missing:'));
        response.recommendations.add_missing.forEach(tech => {
          Logger.info(`    • ${tech}`);
        });
      }
    }
    
    // Alternative Stacks
    if (response.alternative_stacks && response.alternative_stacks.length > 0) {
      Logger.info('');
      Logger.info(chalk.cyan('🎯 Alternative Stack Options:'));
      response.alternative_stacks.forEach((stack, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        Logger.info(`  ${medal} ${stack.name}`);
        Logger.info(`     Tech: ${stack.tech.join(', ')}`);
        Logger.info(chalk.green(`     Pros: ${stack.pros.join(', ')}`));
        Logger.info(chalk.yellow(`     Cons: ${stack.cons.join(', ')}`));
        Logger.info(`     Learning: ${stack.learning_curve_weeks} weeks | Tokens: ${stack.innovation_tokens}`);
      });
    }
    
    if (response.timeline_weeks !== undefined) {
      const timelineColor = response.timeline_weeks > 12 ? chalk.red : chalk.green;
      Logger.info(timelineColor(`Timeline: ${response.timeline_weeks} weeks`));
    }
    
    if (response.feature_count !== undefined) {
      const featureColor = response.feature_count > 3 ? chalk.red : chalk.green;
      Logger.info(featureColor(`Feature Count: ${response.feature_count}`));
    }
    
    Logger.info(chalk.gray('─'.repeat(60)));
  }

  /**
   * Ask a question with AI enhancement (optimized version)
   */
  async askWithAIOptimized(
    question: string,
    validator?: (value: string) => boolean | string,
    defaultValue?: string
  ): Promise<string> {
    const startTime = Date.now();
    const inputOptions: FlexibleInputOptions = {
      defaultValue
    };
    let answer = await askFlexibleInput(question, inputOptions);
    
    // Store answer in context memory immediately
    const questionType = QuestionTypeDetector.detectType(question);
    const category = this.detectCategory(question);
    
    this.contextMemory.addEntry({
      questionType,
      question,
      answer,
      timestamp: new Date(),
      category,
      improved: false
    });
    
    if (this.aiMode === 'off') {
      this.analytics.questionsAnswered++;
      this.analytics.totalDuration += Date.now() - startTime;
      return answer;
    }
    
    // Get context for AI
    const contextHistory = this.contextMemory.getContextForPrompt();
    
    // AI Challenge in active mode with optimized prompts and context
    if (this.aiMode === 'active') {
      const optimizedResponse = await this.aiService.challengeAnswerOptimized(
        question, 
        answer,
        contextHistory
      );
      
      if (optimizedResponse) {
        this.displayOptimizedFeedback(optimizedResponse);
        this.analytics.aiInterventions++;
        
        // Handle based on assessment level
        if (optimizedResponse.assessment === 'critical') {
          Logger.error('🚨 Diese Antwort hat kritische Probleme und muss überarbeitet werden.');
          
          if (optimizedResponse.suggestion) {
            Logger.info(chalk.yellow('\\n🤖 KI-Optimierte Version:'));
            Logger.info(chalk.gray('─'.repeat(60)));
            Logger.info(optimizedResponse.suggestion);
            Logger.info(chalk.gray('─'.repeat(60)));
            
            const { action } = await inquirer.prompt([{
              type: 'list',
              name: 'action',
              message: chalk.red('Diese Antwort muss überarbeitet werden:'),
              choices: [
                { name: 'Die KI-optimierte Version verwenden', value: 'use' },
                { name: 'Meine Antwort manuell überarbeiten', value: 'edit' }
              ]
            }]);

            if (action === 'use') {
              answer = optimizedResponse.suggestion;
              // Update context memory with improved answer
              this.contextMemory.addEntry({
                questionType,
                question,
                answer,
                timestamp: new Date(),
                category,
                improved: true
              });
              Logger.success('✅ Verwende KI-optimierte Antwort');
            } else {
              const revisedOptions: FlexibleInputOptions = {
                defaultValue: answer
              };
              answer = await askFlexibleInput(
                'Bitte überarbeiten Sie Ihre Antwort:',
                revisedOptions
              );
              // Recursively check the revised answer
              return this.askWithAIOptimized(question, validator, answer);
            }
          } else {
            // No suggestion, user must revise
            const revisedOptions: FlexibleInputOptions = {
              defaultValue: answer
            };
            answer = await askFlexibleInput(
              'Bitte überarbeiten Sie Ihre Antwort basierend auf dem Feedback:',
              revisedOptions
            );
            // Recursively check the revised answer
            return this.askWithAIOptimized(question, validator, answer);
          }
        } else if (optimizedResponse.assessment === 'warning' && optimizedResponse.suggestion) {
          Logger.info(chalk.yellow('\\n🤖 KI-Verbesserte Version:'));
          Logger.info(chalk.gray('─'.repeat(60)));
          Logger.info(optimizedResponse.suggestion);
          Logger.info(chalk.gray('─'.repeat(60)));
          
          const { action } = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: chalk.yellow('Empfehlung: Verwenden Sie die verbesserte Version'),
            choices: [
              { name: 'Die KI-verbesserte Version verwenden', value: 'use' },
              { name: 'Meine ursprüngliche Antwort behalten', value: 'keep' },
              { name: 'Meine Antwort manuell bearbeiten', value: 'edit' }
            ],
            default: 'use'
          }]);

          if (action === 'use') {
            answer = optimizedResponse.suggestion;
            // Update context memory with improved answer
            this.contextMemory.addEntry({
              questionType,
              question,
              answer,
              timestamp: new Date(),
              category,
              improved: true
            });
            Logger.success('✅ Verwende KI-verbesserte Antwort');
          } else if (action === 'edit') {
            const revisedOptions: FlexibleInputOptions = {
              defaultValue: answer
            };
            answer = await askFlexibleInput(
              'Bitte geben Sie Ihre überarbeitete Antwort ein:',
              revisedOptions
            );
          }
        }
        
        // Handle parking lot for MVP scope questions
        if (optimizedResponse.parking_lot && optimizedResponse.parking_lot.length > 0) {
          Logger.info(chalk.cyan('\\n📦 Features für Version 2 (Parking Lot):'));
          optimizedResponse.parking_lot.forEach((feature, index) => {
            Logger.info(`  ${index + 1}. ${feature}`);
          });
        }
      }
    }

    // Validate with custom validator
    if (validator) {
      const validationResult = validator(answer);
      if (validationResult !== true) {
        Logger.error(validationResult as string);
        return this.askWithAIOptimized(question, validator, answer);
      }
    }

    this.displayCosts();
    return answer;
  }

  /**
   * Ask a question with AI enhancement (legacy version for backward compatibility)
   */
  async askWithAI(
    question: string,
    validator?: (value: string) => boolean | string,
    defaultValue?: string
  ): Promise<string> {
    const startTime = Date.now();
    const inputOptions: FlexibleInputOptions = {
      defaultValue
    };
    let answer = await askFlexibleInput(question, inputOptions);
    
    if (this.aiMode === 'off') {
      // Record question time
      this.analytics.questionsAnswered++;
      this.analytics.totalDuration += Date.now() - startTime;
      return answer;
    }

    // AI Challenge in active mode
    if (this.aiMode === 'active') {
      const challenge = await this.aiService.challengeAnswer(question, answer);
      
      if (challenge && challenge.feedback) {
        Logger.info(chalk.yellow('🤖 KI-Feedback:'));
        Logger.info(challenge.feedback);
        this.analytics.aiInterventions++;
        
        if (challenge.suggestion) {
          Logger.info(chalk.yellow('\n🤖 KI-Verbesserte Version:'));
          Logger.info(chalk.gray('─'.repeat(60)));
          Logger.info(challenge.suggestion);
          Logger.info(chalk.gray('─'.repeat(60)));
          
          const { action } = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: chalk.yellow('Wie möchten Sie fortfahren?'),
            choices: [
              { name: 'Meine ursprüngliche Antwort behalten', value: 'keep' },
              { name: 'Die KI-verbesserte Version verwenden', value: 'use' },
              { name: 'Meine Antwort manuell bearbeiten', value: 'edit' }
            ],
            default: 'keep'
          }]);

          if (action === 'use') {
            answer = challenge.suggestion;
            Logger.success('✅ Verwende KI-verbesserte Antwort');
          } else if (action === 'edit') {
            const revisedOptions: FlexibleInputOptions = {
              defaultValue: answer
            };
            answer = await askFlexibleInput(
              'Bitte geben Sie Ihre überarbeitete Antwort ein:',
              revisedOptions
            );
          }
        }
      }
    }

    // AI Suggestions in both modes
    const suggestion = await this.aiService.suggestImprovement(question, answer);
    if (suggestion) {
      Logger.info(chalk.cyan('🤖 KI-Vorgeschlagene Antwort:'));
      Logger.info(chalk.gray('─'.repeat(60)));
      Logger.info(suggestion);
      Logger.info(chalk.gray('─'.repeat(60)));
      this.analytics.aiInterventions++;
      
      // In both active and passive modes, offer to use the suggestion
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: chalk.cyan('Wie möchten Sie fortfahren?'),
        choices: [
          { name: 'Meine ursprüngliche Antwort behalten', value: 'keep' },
          { name: 'Den KI-Vorschlag verwenden', value: 'use' },
          { name: 'Meine Antwort manuell bearbeiten', value: 'edit' }
        ],
        default: 'keep'
      }]);

      if (action === 'use') {
        answer = suggestion;
        Logger.success('✅ Verwende KI-vorgeschlagene Antwort');
      } else if (action === 'edit') {
        const revisedOptions: FlexibleInputOptions = {
          defaultValue: answer
        };
        answer = await askFlexibleInput(
          'Bitte geben Sie Ihre überarbeitete Antwort ein:',
          revisedOptions
        );
      }
    }

    // Validate with custom validator
    if (validator) {
      const validationResult = validator(answer);
      if (validationResult !== true) {
        Logger.error(validationResult as string);
        return this.askWithAI(question, validator, answer);
      }
    }

    // Record question time (removed duplicate)
    this.displayCosts();
    
    return answer;
  }

  /**
   * Ask for a list with AI enhancement
   */
  async askListWithAI(
    prompt: string,
    options: {
      minItems?: number;
      maxItems?: number;
      itemMinLength?: number;
      defaultItems?: string[];
    } = {}
  ): Promise<string[]> {
    const startTime = Date.now();
    let items = await askListInput(prompt, options);
    
    if (this.aiMode === 'off') {
      // Record question time
      this.analytics.questionsAnswered++;
      this.analytics.totalDuration += Date.now() - startTime;
      return items;
    }

    // AI can suggest additional items
    const suggestions = await this.aiService.suggestListItems(prompt, items);
    
    if (suggestions && suggestions.length > 0) {
      Logger.info(chalk.cyan('🤖 AI Suggested Additional Items:'));
      suggestions.forEach(s => Logger.info(`  • ${s}`));
      this.analytics.aiInterventions++;
      
      if (this.aiMode === 'active') {
        const { additionalItems } = await inquirer.prompt([{
          type: 'checkbox',
          name: 'additionalItems',
          message: chalk.cyan('Select AI suggestions to add:'),
          choices: suggestions.map(s => ({ name: s, value: s }))
        }]);

        items = [...items, ...additionalItems];
      }
    }

    // Record question time (removed duplicate)
    this.displayCosts();
    
    return items;
  }

  /**
   * Validate PRD completeness with AI
   */
  async validateWithAI(data: PRDData): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    if (this.aiMode === 'off') {
      return { isValid: true, issues: [], suggestions: [] };
    }

    Logger.info('🤖 AI is validating your PRD...');
    
    const validation = await this.aiService.validatePRD(data);
    this.analytics.aiInterventions++;
    
    if (validation) {
      if (validation.issues.length > 0) {
        Logger.warning('Validation Issues Found:');
        validation.issues.forEach(issue => Logger.error(`  • ${issue}`));
      }
      
      if (validation.suggestions.length > 0) {
        Logger.info(chalk.cyan('🤖 AI Suggestions:'));
        validation.suggestions.forEach(s => Logger.info(`  • ${s}`));
      }
      
      this.displayCosts();
      return validation;
    }
    
    return { isValid: true, issues: [], suggestions: [] };
  }

  /**
   * Optimize the final PRD with AI
   */
  async optimizePRD(content: string): Promise<string> {
    if (this.aiMode === 'off') {
      return content;
    }

    Logger.info('🤖 AI is optimizing your PRD...');
    
    const result = await this.aiService.optimizePRD(content);
    
    if (result) {
      this.analytics.aiInterventions++;
      
      if (result.improvements.length > 0) {
        Logger.success('AI Improvements Applied:');
        result.improvements.forEach(imp => Logger.info(`  ✨ ${imp}`));
      }
      
      this.displayCosts();
      return result.content;
    }
    
    return content;
  }

  /**
   * Display current costs if enabled
   */
  private displayCosts(): void {
    if (!this.showCosts) return;
    
    const metrics = this.aiService.getUsageMetrics();
    if (metrics.apiCalls > 0) {
      Logger.info(
        chalk.gray(`💰 Bisherige Sitzungskosten: $${metrics.estimatedCost.toFixed(4)} (${metrics.totalTokensUsed} Tokens)`)
      );
    }
  }

  /**
   * Get final metrics
   */
  getMetrics() {
    return {
      aiMetrics: this.aiService.getUsageMetrics(),
      sessionAnalytics: this.analytics
    };
  }

  /**
   * Get AI service instance
   */
  getAIService(): AIService {
    return this.aiService;
  }

  /**
   * Get analytics instance
   */
  getAnalytics(): SessionAnalytics {
    return this.analytics;
  }

  /**
   * Get context memory instance
   */
  getContextMemory(): ContextMemoryService {
    return this.contextMemory;
  }

  /**
   * Display current project context
   */
  displayProjectContext(): void {
    const summary = this.contextMemory.getProjectSummary();
    if (summary) {
      Logger.info(chalk.cyan('\n📋 Aktueller Projekt-Kontext:'));
      Logger.info(chalk.gray('─'.repeat(60)));
      Logger.info(summary);
      Logger.info(chalk.gray('─'.repeat(60)));
    }
  }

  /**
   * Check consistency of answers
   */
  checkConsistency(): void {
    const check = this.contextMemory.detectInconsistencies();
    if (!check.isConsistent) {
      Logger.warning('⚠️ Mögliche Inkonsistenzen gefunden:');
      check.issues.forEach(issue => {
        Logger.warning(`  • ${issue}`);
      });
    }
  }
}

/**
 * Create AI-enhanced question flow
 */
export async function createAIEnhancedFlow(
  sessionId: string,
  options: {
    aiMode?: 'active' | 'passive' | 'off';
    showCosts?: boolean;
  } = {}
): Promise<AIEnhancedQuestions> {
  const aiMode = options.aiMode || 'passive';
  const showCosts = options.showCosts ?? true;
  
  // Check if API key is configured
  if (aiMode !== 'off' && !process.env.ANTHROPIC_API_KEY) {
    Logger.warning('⚠️  Kein ANTHROPIC_API_KEY in der Umgebung gefunden');
    Logger.info('   KI-Funktionen werden deaktiviert. Fügen Sie Ihren Schlüssel zur .env-Datei hinzu.');
    return new AIEnhancedQuestions(sessionId, 'off', false);
  }
  
  if (aiMode !== 'off') {
    Logger.success(`🤖 KI-Modus: ${chalk.cyan(aiMode === 'active' ? 'AKTIV' : 'PASSIV')}`);
    Logger.info(
      aiMode === 'active' 
        ? '   KI wird aktiv Ihre Antworten hinterfragen und Verbesserungen vorschlagen'
        : '   KI wird passiv Verbesserungsvorschläge machen'
    );
  }
  
  return new AIEnhancedQuestions(sessionId, aiMode, showCosts);
}