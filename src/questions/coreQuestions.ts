import inquirer from 'inquirer';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { ProjectInfo, MVPScope } from '../types/index.js';

interface CoreAnswers {
  problem: string;
  targetUser: string;
  solution: string;
  successMetric: string;
  differentiation: string;
}

interface TimedQuestion {
  name: string;
  message: string;
  type: 'input' | 'editor';
  maxTime: number; // in seconds
  warningTime: number; // when to show warning
  scopeLimit?: number; // max characters or items
  validator?: (input: string) => boolean | string;
}

class QuestionTimer {
  private startTime: number;
  private maxTime: number;
  private warningTime: number;
  private warningShown: boolean = false;
  private timeoutId?: NodeJS.Timeout;

  constructor(maxTime: number, warningTime: number) {
    this.maxTime = maxTime * 1000; // Convert to milliseconds
    this.warningTime = warningTime * 1000;
    this.startTime = Date.now();
  }

  start(onWarning: () => void, onTimeout: () => void): void {
    // Set warning timer
    setTimeout(() => {
      if (!this.warningShown) {
        this.warningShown = true;
        onWarning();
      }
    }, this.warningTime);

    // Set timeout timer
    this.timeoutId = setTimeout(() => {
      onTimeout();
    }, this.maxTime);
  }

  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  getElapsed(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getRemaining(): number {
    return Math.floor((this.maxTime - (Date.now() - this.startTime)) / 1000);
  }
}

export async function askCoreQuestions(): Promise<CoreAnswers> {
  Logger.title('Core MVP Questions');
  Logger.warning('Each question has a time limit to prevent over-thinking!');
  Logger.info('Be concise and focus on the essentials.\n');

  const questions: TimedQuestion[] = [
    {
      name: 'problem',
      message: 'What specific problem are you solving? (Be concrete and specific)',
      type: 'input',
      maxTime: 180, // 3 minutes
      warningTime: 120, // Warning at 2 minutes
      scopeLimit: 200,
      validator: (input: string) => {
        if (input.trim().length < 10) {
          return 'Problem statement must be at least 10 characters';
        }
        if (input.trim().length > 200) {
          return 'Keep it under 200 characters - be specific but concise';
        }
        return true;
      }
    },
    {
      name: 'targetUser',
      message: 'Who is your specific target user? (Describe ONE ideal user)',
      type: 'input',
      maxTime: 120, // 2 minutes
      warningTime: 60, // Warning at 1 minute
      scopeLimit: 150,
      validator: (input: string) => {
        if (input.trim().length < 10) {
          return 'Target user description must be at least 10 characters';
        }
        if (input.trim().length > 150) {
          return 'Keep it under 150 characters - focus on ONE specific user type';
        }
        if (input.toLowerCase().includes('everyone') || input.toLowerCase().includes('anybody')) {
          return 'Be specific - "everyone" is not a target user. Pick ONE type.';
        }
        return true;
      }
    },
    {
      name: 'solution',
      message: 'What is your solution in one sentence? (The core functionality)',
      type: 'input',
      maxTime: 180, // 3 minutes
      warningTime: 120,
      scopeLimit: 200,
      validator: (input: string) => {
        if (input.trim().length < 15) {
          return 'Solution must be at least 15 characters';
        }
        if (input.trim().length > 200) {
          return 'Keep it under 200 characters - focus on the CORE solution';
        }
        return true;
      }
    },
    {
      name: 'successMetric',
      message: 'How will you measure success? (ONE key metric)',
      type: 'input',
      maxTime: 120, // 2 minutes
      warningTime: 60,
      scopeLimit: 100,
      validator: (input: string) => {
        if (input.trim().length < 5) {
          return 'Success metric must be at least 5 characters';
        }
        if (input.trim().length > 100) {
          return 'Keep it under 100 characters - focus on ONE measurable metric';
        }
        // Check for measurable terms
        const measurableTerms = ['users', 'revenue', 'time', 'rate', 'number', 'percentage', '%', 'daily', 'weekly', 'monthly'];
        const hasMeasurable = measurableTerms.some(term => input.toLowerCase().includes(term));
        if (!hasMeasurable) {
          Logger.warning('Tip: Make sure your metric is measurable (e.g., "100 users", "10% conversion")');
        }
        return true;
      }
    },
    {
      name: 'differentiation',
      message: 'What makes this different from existing solutions? (Your unique angle)',
      type: 'input',
      maxTime: 180, // 3 minutes
      warningTime: 120,
      scopeLimit: 200,
      validator: (input: string) => {
        if (input.trim().length < 10) {
          return 'Differentiation must be at least 10 characters';
        }
        if (input.trim().length > 200) {
          return 'Keep it under 200 characters - focus on the KEY differentiator';
        }
        const vagueTerm = ['better', 'easier', 'simpler', 'faster', 'cheaper'];
        const isVague = vagueTerm.every(term => input.toLowerCase().includes(term) && input.length < 30);
        if (isVague) {
          return 'Be specific - HOW is it better/easier/faster?';
        }
        return true;
      }
    }
  ];

  const answers: CoreAnswers = {
    problem: '',
    targetUser: '',
    solution: '',
    successMetric: '',
    differentiation: ''
  };

  for (const [index, question] of questions.entries()) {
    Logger.section(`Question ${index + 1} of 5`);
    Logger.info(`Time limit: ${chalk.yellow(formatTime(question.maxTime))}`);
    if (question.scopeLimit) {
      Logger.info(`Character limit: ${chalk.yellow(question.scopeLimit)}`);
    }

    const timer = new QuestionTimer(question.maxTime, question.warningTime);
    let answered = false;

    // Create a promise that resolves when the question is answered
    const answerPromise = inquirer.prompt([{
      type: question.type,
      name: question.name,
      message: question.message,
      validate: question.validator || (() => true),
    }]);

    // Start the timer
    timer.start(
      () => {
        // Warning callback
        if (!answered) {
          Logger.warning(`\n⏰ ${formatTime(timer.getRemaining())} remaining! Wrap up your answer...`);
        }
      },
      () => {
        // Timeout callback
        if (!answered) {
          Logger.error('\n⏰ Time\'s up! Moving to the next question...');
          // Force the prompt to complete (this is a limitation - we can't truly interrupt inquirer)
          process.stdin.write('\n');
        }
      }
    );

    try {
      // Wait for the answer with a timeout
      const result = await Promise.race([
        answerPromise,
        new Promise((resolve) => setTimeout(() => resolve({ [question.name]: 'Time limit exceeded - no answer provided' }), question.maxTime * 1000))
      ]);

      answered = true;
      timer.stop();

      // Store the answer
      const answer = (result as any)[question.name];
      if (answer && answer !== 'Time limit exceeded - no answer provided') {
        (answers as any)[question.name] = answer;
        Logger.success(`✓ Answered in ${formatTime(timer.getElapsed())}`);
      } else {
        Logger.warning('No answer provided - using default');
        (answers as any)[question.name] = 'Not specified';
      }
    } catch (error) {
      timer.stop();
      Logger.error('Error collecting answer');
      (answers as any)[question.name] = 'Not specified';
    }

    // Brief pause between questions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Show summary
  showCoreSummary(answers);

  return answers;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function showCoreSummary(answers: CoreAnswers): void {
  Logger.title('Core MVP Definition Summary');
  
  Logger.section('Your MVP in a Nutshell');
  Logger.item(`${chalk.bold('Problem:')} ${answers.problem}`);
  Logger.item(`${chalk.bold('Target User:')} ${answers.targetUser}`);
  Logger.item(`${chalk.bold('Solution:')} ${answers.solution}`);
  Logger.item(`${chalk.bold('Success Metric:')} ${answers.successMetric}`);
  Logger.item(`${chalk.bold('Differentiation:')} ${answers.differentiation}`);

  // Generate a one-liner pitch
  const pitch = `A solution for ${answers.targetUser} that ${answers.solution.toLowerCase()}, uniquely ${answers.differentiation.toLowerCase()}.`;
  
  Logger.section('Your Elevator Pitch');
  Logger.highlight(pitch);
}

// Convert core answers to ProjectInfo and partial MVPScope
export function coreAnswersToProjectData(answers: CoreAnswers): { project: Partial<ProjectInfo>, mvp: Partial<MVPScope> } {
  return {
    project: {
      description: answers.problem,
      targetAudience: answers.targetUser,
      // Name will be asked separately
    },
    mvp: {
      problemStatement: answers.problem,
      solutionApproach: answers.solution,
      successMetrics: [answers.successMetric],
      coreFeatures: [], // Will be populated in next phase
      outOfScope: [], // Will be populated in next phase
    }
  };
}

// Scope protection utilities
export function validateScope(input: string, maxItems: number, itemType: string): string[] {
  const items = input.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  if (items.length > maxItems) {
    Logger.warning(`⚠️ Scope creep detected! Limiting to ${maxItems} ${itemType}.`);
    Logger.info(`You provided ${items.length} items. The extra ${items.length - maxItems} items will be saved for future phases.`);
    
    // Save extra items for future reference
    const extraItems = items.slice(maxItems);
    Logger.section('Items saved for future phases:');
    extraItems.forEach(item => Logger.item(item));
    
    return items.slice(0, maxItems);
  }

  return items;
}

export function enforceTimeBox(startTime: Date, maxMinutes: number): boolean {
  const elapsed = (Date.now() - startTime.getTime()) / 60000;
  if (elapsed > maxMinutes) {
    Logger.error(`⏰ Time box exceeded! (${Math.round(elapsed)} minutes > ${maxMinutes} minutes)`);
    Logger.warning('Automatically moving to the next phase to maintain focus.');
    return true;
  }
  return false;
}