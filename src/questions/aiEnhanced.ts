import { PRDData } from '../types/index.js';
import { AIService } from '../services/aiService.js';
import type { SessionAnalytics as ISessionAnalytics } from '../services/sessionAnalytics.js';

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
  private aiMode: 'active' | 'passive' | 'off';
  private showCosts: boolean;

  constructor(
    sessionId: string,
    aiMode: 'active' | 'passive' | 'off' = 'passive',
    showCosts: boolean = true
  ) {
    this.aiService = new AIService();
    this.analytics = new SessionAnalytics();
    this.analytics.sessionId = sessionId;
    this.aiMode = aiMode;
    this.showCosts = showCosts;
  }

  /**
   * Ask a question with AI enhancement
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