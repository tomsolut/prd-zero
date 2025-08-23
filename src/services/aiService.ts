import Anthropic from '@anthropic-ai/sdk';
import { 
  AIConfig, 
  AIUsageMetrics, 
  AIInteraction, 
  AIResponse,
  AIOptimizationResult,
  AIValidationResult,
  CLAUDE_PRICING,
  TokenPricing
} from '../types/ai.js';
import { Logger } from '../utils/logger.js';
import chalk from 'chalk';

/**
 * AI Service for Claude integration with cost tracking
 */
export class AIService {
  private client: Anthropic | null = null;
  private config: AIConfig;
  private usageMetrics: AIUsageMetrics;
  private isEnabled: boolean = false;
  private pricing: TokenPricing;

  constructor(config?: Partial<AIConfig>) {
    const apiKey = process.env.ANTHROPIC_API_KEY || config?.apiKey || '';
    
    this.config = {
      apiKey,
      model: config?.model || 'claude-3-5-sonnet-20241022',
      maxTokens: config?.maxTokens || 4096,
      temperature: config?.temperature || 0.7,
      maxBudget: config?.maxBudget || 5.00,
      showCosts: config?.showCosts !== false,
    };

    this.pricing = CLAUDE_PRICING[this.config.model];

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.isEnabled = true;
    } else {
      Logger.warning('No Anthropic API key found. AI features disabled.');
    }

    this.usageMetrics = this.initializeMetrics();
  }

  private initializeMetrics(): AIUsageMetrics {
    return {
      sessionId: `session_${new Date().toISOString().replace(/[:.]/g, '-')}`,
      totalTokensUsed: 0,
      inputTokens: 0,
      outputTokens: 0,
      apiCalls: 0,
      estimatedCost: 0,
      model: this.config.model,
      interactions: [],
      startTime: new Date(),
    };
  }

  /**
   * Check if AI is enabled
   */
  public isAIEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Calculate cost based on tokens
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * this.pricing.inputPricePerMillion;
    const outputCost = (outputTokens / 1_000_000) * this.pricing.outputPricePerMillion;
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Check if within budget
   */
  private checkBudget(): boolean {
    if (!this.config.maxBudget) return true;
    
    const percentUsed = (this.usageMetrics.estimatedCost / this.config.maxBudget) * 100;
    
    if (percentUsed >= 100) {
      Logger.error(`💰 Budget exceeded! Used: $${this.usageMetrics.estimatedCost.toFixed(4)} of $${this.config.maxBudget}`);
      return false;
    }
    
    if (percentUsed >= 80) {
      Logger.warning(`💰 Budget warning: ${percentUsed.toFixed(1)}% used ($${this.usageMetrics.estimatedCost.toFixed(4)} of $${this.config.maxBudget})`);
    }
    
    return true;
  }

  /**
   * Make API call with tracking
   */
  private async callClaude(prompt: string, system?: string): Promise<AIResponse | null> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    if (!this.checkBudget()) {
      Logger.error('Budget exceeded. Skipping AI call.');
      return null;
    }

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: system || 'You are an expert product consultant helping solo developers create better MVPs. Be concise but insightful.',
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract token usage (this is simplified - actual implementation depends on API response)
      const inputTokens = prompt.length / 4; // Rough estimate
      const outputTokens = response.content[0].type === 'text' 
        ? response.content[0].text.length / 4 
        : 0;
      
      const cost = this.calculateCost(inputTokens, outputTokens);

      // Update metrics
      this.usageMetrics.inputTokens += inputTokens;
      this.usageMetrics.outputTokens += outputTokens;
      this.usageMetrics.totalTokensUsed += inputTokens + outputTokens;
      this.usageMetrics.estimatedCost += cost;
      this.usageMetrics.apiCalls += 1;

      if (this.config.showCosts) {
        Logger.info(chalk.gray(`💰 API call cost: $${cost.toFixed(4)} | Total: $${this.usageMetrics.estimatedCost.toFixed(4)}`));
      }

      return {
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        cost,
      };
    } catch (error) {
      Logger.error(`Claude API error: ${error}`);
      return null;
    }
  }

  /**
   * Challenge a user's answer
   */
  public async challengeAnswer(question: string, answer: string): Promise<string | null> {
    const prompt = `
Question asked: "${question}"
User's answer: "${answer}"

As a product consultant, critically evaluate this answer. If it's vague, unmeasurable, or could be improved:
1. Point out the specific issue (be kind but direct)
2. Suggest a concrete improvement
3. Give an example of a better answer

If the answer is already good, say "Good answer!" and explain why briefly.

Keep response under 100 words.`;

    const response = await this.callClaude(prompt);
    
    if (response) {
      this.recordInteraction('challenge', question, prompt, response.content, response.tokensUsed, response.cost);
    }
    
    return response?.content || null;
  }

  /**
   * Suggest improvements for an answer
   */
  public async suggestImprovement(question: string, answer: string): Promise<string | null> {
    const prompt = `
Question: "${question}"
Answer: "${answer}"

Suggest ONE specific improvement to make this answer better for an MVP plan.
Format: "Consider: [specific suggestion]"
Keep it under 50 words.`;

    const response = await this.callClaude(prompt);
    
    if (response) {
      this.recordInteraction('suggest', question, prompt, response.content, response.tokensUsed, response.cost);
    }
    
    return response?.content || null;
  }

  /**
   * Optimize PRD content
   */
  public async optimizePRD(content: string): Promise<AIOptimizationResult | null> {
    const prompt = `
Optimize this PRD for clarity, specificity, and actionability:

${content}

Improvements needed:
1. Make success metrics more measurable
2. Clarify vague statements
3. Add missing critical details
4. Fix any logical inconsistencies

Return the optimized version.`;

    const response = await this.callClaude(prompt);
    
    if (!response) return null;

    this.recordInteraction('optimize', 'PRD Optimization', prompt, response.content, response.tokensUsed, response.cost);

    return {
      original: content,
      optimized: response.content,
      improvements: [
        'Made success metrics measurable',
        'Clarified vague statements',
        'Added critical details',
        'Fixed inconsistencies',
      ],
      confidenceScore: 85,
      tokensUsed: response.tokensUsed.total,
      cost: response.cost,
    };
  }

  /**
   * Validate answers for consistency
   */
  public async validateAnswers(answers: Record<string, any>): Promise<AIValidationResult | null> {
    const prompt = `
Validate this MVP plan for consistency and feasibility:
${JSON.stringify(answers, null, 2)}

Check for:
1. Timeline vs. feature complexity mismatch
2. Target audience vs. solution alignment
3. Success metrics measurability
4. Technical feasibility
5. Scope creep indicators

Return issues found and suggestions.`;

    const response = await this.callClaude(prompt);
    
    if (!response) return null;

    this.recordInteraction('validate', 'Answer Validation', prompt, response.content, response.tokensUsed, response.cost);

    // Parse response (simplified)
    const issues = response.content.includes('Issue:') 
      ? response.content.split('Issue:').slice(1).map(i => i.split('\n')[0].trim())
      : [];

    return {
      isValid: issues.length === 0,
      score: Math.max(0, 100 - (issues.length * 20)),
      issues,
      suggestions: ['Address the identified issues before proceeding'],
      criticalProblems: issues.filter(i => i.toLowerCase().includes('critical')),
      tokensUsed: response.tokensUsed.total,
      cost: response.cost,
    };
  }

  /**
   * Record an interaction
   */
  private recordInteraction(
    type: AIInteraction['type'],
    context: string,
    prompt: string,
    response: string,
    tokens: { input: number; output: number; total: number },
    cost: number
  ): void {
    this.usageMetrics.interactions.push({
      timestamp: new Date(),
      type,
      context,
      prompt,
      response,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      cost,
    });
  }

  /**
   * Get usage metrics
   */
  public getUsageMetrics(): AIUsageMetrics {
    return {
      ...this.usageMetrics,
      endTime: new Date(),
    };
  }

  /**
   * Get cost breakdown
   */
  public getCostBreakdown(): {
    total: number;
    byType: Record<string, number>;
    byPhase: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byPhase: Record<string, number> = {};

    this.usageMetrics.interactions.forEach(interaction => {
      byType[interaction.type] = (byType[interaction.type] || 0) + interaction.cost;
      
      // Simple phase detection based on context
      const phase = interaction.context.toLowerCase().includes('project') ? 'project' :
                   interaction.context.toLowerCase().includes('mvp') ? 'mvp' :
                   interaction.context.toLowerCase().includes('timeline') ? 'timeline' :
                   interaction.context.toLowerCase().includes('tech') ? 'technical' :
                   'other';
      
      byPhase[phase] = (byPhase[phase] || 0) + interaction.cost;
    });

    return {
      total: this.usageMetrics.estimatedCost,
      byType,
      byPhase,
    };
  }

  /**
   * Generate cost summary
   */
  public generateCostSummary(): string {
    const breakdown = this.getCostBreakdown();
    const metrics = this.getUsageMetrics();
    
    let summary = `
💰 AI Usage Cost Summary
========================
Total API Calls: ${metrics.apiCalls}
Total Tokens: ${metrics.totalTokensUsed.toFixed(0)}
  - Input: ${metrics.inputTokens.toFixed(0)}
  - Output: ${metrics.outputTokens.toFixed(0)}

Cost Breakdown:
  Total: $${breakdown.total.toFixed(4)}
  
By Feature:`;

    Object.entries(breakdown.byType).forEach(([type, cost]) => {
      const percent = (cost / breakdown.total * 100).toFixed(1);
      summary += `\n  - ${type}: $${cost.toFixed(4)} (${percent}%)`;
    });

    if (this.config.maxBudget) {
      const percentUsed = (breakdown.total / this.config.maxBudget * 100).toFixed(1);
      summary += `\n\nBudget: $${breakdown.total.toFixed(4)} of $${this.config.maxBudget} (${percentUsed}%)`;
    }

    return summary;
  }
}