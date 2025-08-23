import inquirer from 'inquirer';
import { ProjectInfo } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { Validator } from '../validators/index.js';

export async function askProjectQuestions(prefilled?: Partial<ProjectInfo>): Promise<ProjectInfo> {
  Logger.section('Project Information');

  const answers = await inquirer.prompt([
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
    {
      type: 'editor',
      name: 'description',
      message: 'Describe your project in 2-3 sentences (press Enter to open editor):',
      default: prefilled?.description || '',
      validate: (input: string) => {
        if (input.trim().length < 10) return 'Description must be at least 10 characters';
        if (input.length > 500) return 'Description must be less than 500 characters';
        return true;
      },
      filter: (input: string) => Validator.sanitizeString(input),
    },
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
    {
      type: 'editor',
      name: 'problemStatement',
      message: 'What problem does your project solve? (press Enter to open editor):',
      default: prefilled?.problemStatement || prefilled?.description || '',
      validate: (input: string) => {
        if (input.trim().length < 20) return 'Problem statement must be at least 20 characters';
        if (input.length > 500) return 'Problem statement must be less than 500 characters';
        return true;
      },
      filter: (input: string) => Validator.sanitizeString(input),
    },
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
  return answers as ProjectInfo;
}