import inquirer from 'inquirer';
import { TechStack, Risk } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export async function askTechnicalQuestions(): Promise<{ techStack: TechStack; risks: Risk[] }> {
  Logger.section('Technical Decisions');

  const stackAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'stackType',
      message: 'What type of application are you building?',
      choices: [
        'Web Application',
        'Mobile Application',
        'Desktop Application',
        'API/Backend Service',
        'Full-Stack Application',
        'Other',
      ],
    },
  ]);

  let techStack: TechStack = {};

  if (stackAnswers.stackType === 'Web Application' || stackAnswers.stackType === 'Full-Stack Application') {
    const frontendAnswers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'frontend',
        message: 'Select frontend technologies:',
        choices: [
          'React',
          'Vue.js',
          'Angular',
          'Svelte',
          'Next.js',
          'Nuxt.js',
          'Vanilla JavaScript',
          'TypeScript',
          'Tailwind CSS',
          'Bootstrap',
          'Material-UI',
          'Other',
        ],
      },
    ]);
    techStack.frontend = frontendAnswers.frontend;
  }

  if (stackAnswers.stackType !== 'Web Application') {
    const backendAnswers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'backend',
        message: 'Select backend technologies:',
        choices: [
          'Node.js',
          'Python/Django',
          'Python/FastAPI',
          'Ruby on Rails',
          'PHP/Laravel',
          'Java/Spring',
          'Go',
          'Rust',
          '.NET/C#',
          'Other',
        ],
      },
    ]);
    techStack.backend = backendAnswers.backend;
  }

  const databaseAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'database',
      message: 'Select database technologies:',
      choices: [
        'PostgreSQL',
        'MySQL',
        'MongoDB',
        'Redis',
        'SQLite',
        'Firebase',
        'Supabase',
        'DynamoDB',
        'None',
        'Other',
      ],
    },
  ]);
  
  if (!databaseAnswers.database.includes('None')) {
    techStack.database = databaseAnswers.database;
  }

  const hostingAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'hosting',
      message: 'Select hosting/deployment platforms:',
      choices: [
        'Vercel',
        'Netlify',
        'AWS',
        'Google Cloud',
        'Azure',
        'Heroku',
        'DigitalOcean',
        'Railway',
        'Render',
        'Self-hosted',
        'Other',
      ],
    },
  ]);
  techStack.hosting = hostingAnswers.hosting;

  Logger.section('Risk Assessment');

  const riskAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasRisks',
      message: 'Do you want to identify and assess risks?',
      default: true,
    },
  ]);

  let risks: Risk[] = [];
  if (riskAnswers.hasRisks) {
    const riskCount = await inquirer.prompt([
      {
        type: 'input',
        name: 'count',
        message: 'How many risks to assess? (2-5 recommended):',
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

    const count = parseInt(riskCount.count, 10);
    
    for (let i = 0; i < count; i++) {
      const risk = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: `Risk ${i + 1} description:`,
          validate: (input: string) => input.trim().length >= 10 || 'Risk description must be at least 10 characters',
        },
        {
          type: 'list',
          name: 'impact',
          message: 'Impact if this risk occurs:',
          choices: ['low', 'medium', 'high'],
        },
        {
          type: 'list',
          name: 'likelihood',
          message: 'Likelihood of occurrence:',
          choices: ['low', 'medium', 'high'],
        },
        {
          type: 'input',
          name: 'mitigation',
          message: 'Mitigation strategy:',
          validate: (input: string) => input.trim().length >= 10 || 'Mitigation must be at least 10 characters',
        },
      ]);
      
      risks.push(risk as Risk);
    }
  }

  Logger.success('Technical decisions captured');

  return { techStack, risks };
}