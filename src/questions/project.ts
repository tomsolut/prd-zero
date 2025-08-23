import inquirer from 'inquirer';
import { ProjectInfo } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { Validator } from '../validators/index.js';
import { askFlexibleInput } from '../utils/flexibleInput.js';

export async function askProjectQuestions(prefilled?: Partial<ProjectInfo>): Promise<ProjectInfo> {
  Logger.section('Project Information');

  // Get project name (keep as simple input)
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of your project?',
      validate: (input: string) => {
        if (input.trim().length < 1) return 'Project name is required';
        if (input.length > 100) return 'Project name must be less than 100 characters';
        return true;
      },
      filter: (input: string) => Validator.sanitizeString(input),
    },
  ]);

  // Get description using flexible input
  const description = await askFlexibleInput(
    'Describe your project in 2-3 sentences:',
    {
      minLength: 10,
      maxLength: 500,
      multiline: true,
      defaultValue: prefilled?.description || '',
      examples: ['A tool for tracking daily habits; It helps users build consistency; Target audience is productivity enthusiasts'],
      allowEditor: true,
    }
  );

  // Get target audience (simple input - usually short)
  const targetAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'targetAudience',
      message: 'Who is your target audience?',
      default: prefilled?.targetAudience || '',
      validate: (input: string) => {
        if (input.trim().length < 10) return 'Target audience must be at least 10 characters';
        if (input.length > 300) return 'Target audience must be less than 300 characters';
        return true;
      },
      filter: (input: string) => Validator.sanitizeString(input),
    },
  ]);

  // Get problem statement using flexible input
  const problemStatement = await askFlexibleInput(
    'What problem does your project solve?',
    {
      minLength: 20,
      maxLength: 500,
      multiline: true,
      defaultValue: prefilled?.problemStatement || prefilled?.description || '',
      examples: ['Users struggle to maintain consistent habits; Current apps are too complex; People need simple daily reminders'],
      allowEditor: true,
    }
  );

  // Get unique value (simple input - usually short)
  const uniqueAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'uniqueValue',
      message: 'What makes your solution unique?',
      validate: (input: string) => {
        if (input.trim().length < 10) return 'Unique value must be at least 10 characters';
        if (input.length > 300) return 'Unique value must be less than 300 characters';
        return true;
      },
      filter: (input: string) => Validator.sanitizeString(input),
    },
  ]);

  Logger.success('Project information collected');
  
  return {
    name,
    description: Validator.sanitizeString(description),
    targetAudience: targetAnswers.targetAudience,
    problemStatement: Validator.sanitizeString(problemStatement),
    uniqueValue: uniqueAnswers.uniqueValue,
  };
}