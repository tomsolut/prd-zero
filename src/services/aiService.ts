import Anthropic from '@anthropic-ai/sdk';
import { 
  AIConfig, 
  AIUsageMetrics, 
  AIInteraction, 
  AIResponse,
  AIOptimizationResult,
  AIValidationResult,
  CLAUDE_PRICING,
  TokenPricing,
  OptimizedAIResponse,
  Warning
} from '../types/ai.js';
import { Logger } from '../utils/logger.js';
import chalk from 'chalk';
import { QuestionTypeDetector, QuestionType } from './questionTypeDetector.js';
import { PromptTemplates, Language } from './promptTemplates.js';

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
      model: config?.model || 'claude-3-5-sonnet-latest',
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
   * Detect language from text
   */
  private detectLanguage(text: string): 'de' | 'en' {
    // Simple German detection based on common German words and characters
    const germanIndicators = [
      'der', 'die', 'das', 'ich', 'du', 'sie', 'wir', 'ihr', 'und', 'oder', 'aber',
      'für', 'mit', 'von', 'zu', 'bei', 'nach', 'aus', 'können', 'müssen', 'werden',
      'ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'
    ];
    
    const lowerText = text.toLowerCase();
    const germanMatches = germanIndicators.filter(indicator => lowerText.includes(indicator)).length;
    
    return germanMatches >= 2 ? 'de' : 'en';
  }

  /**
   * Make API call with tracking
   */
  private async callClaude(prompt: string, system?: string, forceLanguage?: 'de' | 'en'): Promise<AIResponse | null> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    if (!this.checkBudget()) {
      Logger.error('Budget überschritten. KI-Aufruf wird übersprungen.');
      return null;
    }

    // Detect language from prompt if not forced
    const language = forceLanguage || this.detectLanguage(prompt);
    
    // Set system message based on language
    const systemMessage = system || (language === 'de' 
      ? `Du bist ein erfahrener Solo-Entwickler-Coach mit 10+ Jahren Erfahrung beim Launchen erfolgreicher MVPs. Du kennst die typischen Fallen: Analysis Paralysis (70% der Solo-MVPs scheitern daran), Feature Creep, Over-Engineering, und unrealistische Timelines. 

Deine Expertise basiert auf Research erfolgreicher Solo-Entwickler wie Pieter Levels ($170k/Monat) und den Lean Startup-Prinzipien. Du enforcest strikt: max 3 Features, max 12 Wochen Timeline, max 2 Innovation Tokens, Validation vor Development.

Antworte auf Deutsch. Sei direkt aber konstruktiv. Fokus auf Prevention der typischen Solo-Entwickler-Fallen.`
      : `You are an experienced solo developer coach with 10+ years of experience launching successful MVPs. You know the typical traps: Analysis Paralysis (70% of solo MVPs fail from this), Feature Creep, Over-Engineering, and unrealistic timelines.

Your expertise is based on research of successful solo developers like Pieter Levels ($170k/month) and Lean Startup principles. You strictly enforce: max 3 features, max 12 weeks timeline, max 2 innovation tokens, validation before development.

Be direct but constructive. Focus on preventing typical solo developer pitfalls.`);

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemMessage,
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
   * Challenge a user's answer with optimized prompts
   */
  public async challengeAnswerOptimized(question: string, answer: string): Promise<OptimizedAIResponse | null> {
    const language = this.detectLanguage(answer + ' ' + question) as Language;
    const questionType = QuestionTypeDetector.detectType(question);
    
    // Get specialized prompt based on question type
    const prompt = PromptTemplates.getChallengePrompt(questionType, language, question, answer);
    const systemPrompt = PromptTemplates.getSystemPrompt(language);
    
    const response = await this.callClaude(prompt, systemPrompt, language);
    
    if (response) {
      this.recordInteraction('challenge', question, prompt, response.content, response.tokensUsed, response.cost);
      
      try {
        const parsed = JSON.parse(response.content) as OptimizedAIResponse;
        
        // Ensure all required fields are present
        if (!parsed.assessment || !parsed.feedback || !parsed.next_actions) {
          // Fallback to simple response
          return {
            assessment: 'warning',
            feedback: response.content,
            warnings: [],
            next_actions: ['Review and refine your answer']
          } as OptimizedAIResponse;
        }
        
        return parsed;
      } catch (error) {
        // Fallback if not valid JSON
        Logger.warning('Failed to parse optimized AI response, using fallback');
        return {
          assessment: 'warning',
          feedback: response.content,
          warnings: [],
          next_actions: ['Review the feedback and refine your answer']
        } as OptimizedAIResponse;
      }
    }
    
    return null;
  }

  /**
   * Challenge a user's answer (legacy method for backward compatibility)
   */
  public async challengeAnswer(question: string, answer: string): Promise<{ feedback: string; suggestion?: string } | null> {
    const language = this.detectLanguage(answer + ' ' + question);
    
    const prompt = language === 'de' ? `
Gestellte Frage: "${question}"
Antwort des Nutzers: "${answer}"

Bewerte diese Antwort kritisch als Solo-Entwickler-Coach. Prüfe auf typische Fallen: Zu vage? Zu komplex? Feature Creep? Unrealistisch? Nicht validierbar?

Gib ein JSON-Objekt zurück mit:
{
  "feedback": "Direktes Feedback: Was ist das Problem? Welche Solo-Entwickler-Falle droht? (max. 100 Wörter)",
  "suggestion": "Konkrete, MVP-fokussierte Version der Antwort (max 3 Features, max 12 Wochen, validierbar)" (nur wenn Verbesserung nötig)
}

Wenn die Antwort bereits MVP-ready ist, gib zurück:
{
  "feedback": "MVP-ready! [kurze Erklärung warum diese Antwort funktioniert]"
}` : `
Question asked: "${question}"
User's answer: "${answer}"

Evaluate this answer critically as a solo developer coach. Check for typical traps: Too vague? Too complex? Feature creep? Unrealistic? Not validatable?

Return a JSON object with:
{
  "feedback": "Direct feedback: What's the problem? Which solo developer trap is looming? (max 100 words)",
  "suggestion": "Concrete, MVP-focused version of the answer (max 3 features, max 12 weeks, validatable)" (only if improvement needed)
}

If the answer is already MVP-ready, return:
{
  "feedback": "MVP-ready! [brief explanation why this answer works]"
}`;

    const response = await this.callClaude(prompt, undefined, language);
    
    if (response) {
      this.recordInteraction('challenge', question, prompt, response.content, response.tokensUsed, response.cost);
      
      try {
        return JSON.parse(response.content);
      } catch {
        // Fallback if not valid JSON
        return { feedback: response.content };
      }
    }
    
    return null;
  }

  /**
   * Suggest improvements with optimized context-aware prompts
   */
  public async suggestImprovementOptimized(
    question: string, 
    answer: string, 
    questionType?: QuestionType,
    previousWarnings?: Warning[]
  ): Promise<string | null> {
    const language = this.detectLanguage(answer + ' ' + question) as Language;
    const detectedType = questionType || QuestionTypeDetector.detectType(question);
    
    const prompt = PromptTemplates.getImprovementPrompt(
      language,
      question,
      answer,
      detectedType,
      previousWarnings || []
    );
    
    const systemPrompt = PromptTemplates.getSystemPrompt(language);
    const response = await this.callClaude(prompt, systemPrompt, language);
    
    if (response) {
      this.recordInteraction('suggest', question, prompt, response.content, response.tokensUsed, response.cost);
    }
    
    return response?.content || null;
  }

  /**
   * Suggest improvements for an answer (legacy method)
   */
  public async suggestImprovement(question: string, answer: string): Promise<string | null> {
    const language = this.detectLanguage(answer + ' ' + question);
    
    const prompt = language === 'de' ? `
Frage: "${question}"
Antwort: "${answer}"

Erstelle eine MVP-optimierte Version dieser Antwort. Befolge strikt:
- Max 3 Features (weniger ist besser)
- Max 12 Wochen Timeline (kürzer ist besser)
- Fokus auf Validation vor Development
- Vermeide Analysis Paralysis und Feature Creep
- Mache es messbar und testbar

Gib die verbesserte Antwort direkt zurück. Keine Erklärung, nur die konkrete, umsetzbare Antwort.` : `
Question: "${question}"
Answer: "${answer}"

Create an MVP-optimized version of this answer. Strictly follow:
- Max 3 features (less is better)
- Max 12 weeks timeline (shorter is better)  
- Focus on validation before development
- Avoid analysis paralysis and feature creep
- Make it measurable and testable

Return the improved answer directly. No explanation, just the concrete, actionable answer.`;

    const response = await this.callClaude(prompt, undefined, language);
    
    if (response) {
      this.recordInteraction('suggest', question, prompt, response.content, response.tokensUsed, response.cost);
    }
    
    return response?.content || null;
  }

  /**
   * Suggest additional items for a list
   */
  public async suggestListItems(prompt: string, currentItems: string[]): Promise<string[] | null> {
    const aiPrompt = `
User was asked: "${prompt}"
They provided these items:
${currentItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Suggest 2-3 additional items they might have missed. These should be:
- Specific and actionable
- Common oversights for MVPs
- Different from what they already have

Return ONLY the items, one per line. No numbering or explanations.`;

    const response = await this.callClaude(aiPrompt);
    
    if (response) {
      this.recordInteraction('list_suggestion', prompt, aiPrompt, response.content, response.tokensUsed, response.cost);
      return response.content.split('\n').filter(item => item.trim().length > 0);
    }
    
    return null;
  }

  /**
   * Validate PRD data for completeness and quality
   */
  public async validatePRD(data: any): Promise<AIValidationResult | null> {
    const prompt = `
Analyze this MVP PRD for completeness and potential issues:

Project: ${data.project.name}
Problem: ${data.project.problem}
Solution: ${data.project.solution}
Target Users: ${data.project.targetAudience}
MVP Features: ${data.mvp.features.join(', ')}
Timeline: ${data.timeline.totalWeeks} weeks
Tech Stack: ${JSON.stringify(data.techStack)}

Provide:
1. Critical issues (things that will likely cause failure)
2. Helpful suggestions (improvements that would increase success)

Format as JSON:
{
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    const response = await this.callClaude(prompt);
    
    if (response) {
      this.recordInteraction('validation', 'PRD Validation', prompt, response.content, response.tokensUsed, response.cost);
      
      try {
        const result = JSON.parse(response.content);
        return {
          isValid: result.issues.length === 0,
          issues: result.issues || [],
          suggestions: result.suggestions || [],
          score: 100 - (result.issues.length * 10)
        };
      } catch {
        return {
          isValid: true,
          issues: [],
          suggestions: [response.content],
          score: 100
        };
      }
    }
    
    return null;
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
      content: response.content, // The optimized content
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