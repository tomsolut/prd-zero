import inquirer from 'inquirer';
import { MVPScope } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { Validator } from '../validators/index.js';
import { validateScope } from './coreQuestions.js';

export async function askMVPQuestions(prefilled?: Partial<MVPScope>): Promise<MVPScope> {
  Logger.section('MVP Scope Definition');
  
  // If we have prefilled success metrics from core questions, show them
  if (prefilled?.successMetrics && prefilled.successMetrics.length > 0) {
    Logger.info('Based on your core answers:');
    Logger.item(`Success Metric: ${prefilled.successMetrics[0]}`);
  }

  const featureAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'featureCount',
      message: 'How many core features will your MVP have? (3-5 recommended for true MVP):',
      default: '3',
      validate: (input: string) => {
        const num = parseInt(input, 10);
        if (isNaN(num) || num < 1 || num > 10) {
          return 'Please enter a number between 1 and 10';
        }
        if (num > 5) {
          Logger.warning('⚠️ More than 5 features might be too ambitious for an MVP!');
        }
        return true;
      },
    },
  ]);

  const coreFeatures: string[] = prefilled?.coreFeatures || [];
  const featureCount = Math.min(parseInt(featureAnswers.featureCount, 10), 5); // Scope protection

  for (let i = 0; i < featureCount; i++) {
    const feature = await inquirer.prompt([
      {
        type: 'input',
        name: 'feature',
        message: `Core feature ${i + 1}:`,
        validate: (input: string) => {
          if (input.trim().length < 5) return 'Feature description must be at least 5 characters';
          if (input.length > 200) return 'Feature description must be less than 200 characters';
          return true;
        },
        filter: (input: string) => Validator.sanitizeString(input),
      },
    ]);
    coreFeatures.push(feature.feature);
  }

  const scopeAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasNonGoals',
      message: 'Do you want to define non-goals (things NOT in the MVP)?',
      default: true,
    },
  ]);

  let nonGoals: string[] = [];
  if (scopeAnswers.hasNonGoals) {
    const nonGoalInput = await inquirer.prompt([
      {
        type: 'editor',
        name: 'nonGoals',
        message: 'List non-goals (one per line, max 10 items, press Enter to open editor):',
        default: '# Things NOT in the MVP\n# One per line\n# Be specific about what you\'re excluding\n',
      },
    ]);
    // Use scope protection to limit non-goals
    const parsedNonGoals = nonGoalInput.nonGoals
      .split('\n')
      .map((s: string) => Validator.sanitizeString(s))
      .filter((s: string) => s.length > 0 && !s.startsWith('#'));
    
    nonGoals = validateScope(parsedNonGoals.join('\n'), 10, 'non-goals');
  }

  const metricsAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'metricCount',
      message: 'How many success metrics will you track? (2-5 recommended):',
      default: '3',
      validate: (input: string) => {
        const num = parseInt(input, 10);
        if (isNaN(num) || num < 1 || num > 10) {
          return 'Please enter a number between 1 and 10';
        }
        return true;
      },
    },
  ]);

  // Start with prefilled metrics if available
  const successMetrics: string[] = prefilled?.successMetrics || [];
  const metricCount = parseInt(metricsAnswers.metricCount, 10);

  // If we have a prefilled metric, start from index 1
  const startIndex = successMetrics.length;
  
  for (let i = startIndex; i < metricCount; i++) {
    const metric = await inquirer.prompt([
      {
        type: 'input',
        name: 'metric',
        message: `Success metric ${i + 1}:`,
        validate: (input: string) => {
          if (input.trim().length < 5) return 'Metric must be at least 5 characters';
          if (input.length > 200) return 'Metric must be less than 200 characters';
          return true;
        },
        filter: (input: string) => Validator.sanitizeString(input),
      },
    ]);
    successMetrics.push(metric.metric);
  }

  const constraintAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasConstraints',
      message: 'Do you have any constraints (budget, time, technical)?',
      default: true,
    },
  ]);

  let constraints: string[] = [];
  if (constraintAnswers.hasConstraints) {
    const constraintInput = await inquirer.prompt([
      {
        type: 'editor',
        name: 'constraints',
        message: 'List constraints (one per line, press Enter to open editor):',
      },
    ]);
    constraints = constraintInput.constraints
      .split('\n')
      .map((s: string) => Validator.sanitizeString(s))
      .filter((s: string) => s.length > 0);
  }

  Logger.success('MVP scope defined');

  return {
    problemStatement: prefilled?.problemStatement || '',
    solutionApproach: prefilled?.solutionApproach || '',
    coreFeatures,
    nonGoals,
    successMetrics,
    constraints,
    outOfScope: nonGoals, // Alias for compatibility
  };
}