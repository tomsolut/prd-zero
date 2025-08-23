import inquirer from 'inquirer';
import { MVPScope } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { Validator } from '../validators/index.js';

export async function askMVPQuestions(): Promise<MVPScope> {
  Logger.section('MVP Scope Definition');

  const featureAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'featureCount',
      message: 'How many core features will your MVP have? (3-7 recommended):',
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

  const coreFeatures: string[] = [];
  const featureCount = parseInt(featureAnswers.featureCount, 10);

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
        message: 'List non-goals (one per line, press Enter to open editor):',
      },
    ]);
    nonGoals = nonGoalInput.nonGoals
      .split('\n')
      .map((s: string) => Validator.sanitizeString(s))
      .filter((s: string) => s.length > 0);
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

  const successMetrics: string[] = [];
  const metricCount = parseInt(metricsAnswers.metricCount, 10);

  for (let i = 0; i < metricCount; i++) {
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
    coreFeatures,
    nonGoals,
    successMetrics,
    constraints,
  };
}