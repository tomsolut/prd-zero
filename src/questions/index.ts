import { PRDData } from '../types/index.js';
import { askProjectQuestions } from './project.js';
import { askMVPQuestions } from './mvp.js';
import { askTimelineQuestions } from './timeline.js';
import { askTechnicalQuestions } from './technical.js';
import { askCoreQuestions, coreAnswersToProjectData, enforceTimeBox } from './coreQuestions.js';
import { askListInput } from '../utils/flexibleInput.js';
import inquirer from 'inquirer';
import { Logger } from '../utils/logger.js';

export async function collectAllQuestions(sessionStartTime: Date): Promise<PRDData> {
  // Start with core questions (Phase 2)
  const coreAnswers = await askCoreQuestions();
  const { project: coreProject, mvp: coreMvp } = coreAnswersToProjectData(coreAnswers);
  
  // Check time box after core questions
  if (enforceTimeBox(sessionStartTime, 15)) {
    Logger.warning('Core questions took too long. Switching to rapid mode.');
  }
  
  // Continue with detailed questions, pre-filling with core answers
  const project = await askProjectQuestions(coreProject);
  const mvp = await askMVPQuestions(coreMvp);
  const timeline = await askTimelineQuestions();
  const { techStack, risks } = await askTechnicalQuestions();

  Logger.section('Final Details');

  // Use flexible list input for final details
  const assumptions = await askListInput(
    'List key assumptions (what you assume to be true):',
    {
      minItems: 1,
      maxItems: 10,
      itemMinLength: 5,
      defaultItems: ['Users have internet access', 'Target users use smartphones', 'Users are willing to pay for quality'],
    }
  );

  const openQuestions = await askListInput(
    'List open questions to research:',
    {
      minItems: 1,
      maxItems: 10,
      itemMinLength: 5,
      defaultItems: ['What is the exact market size?', 'Which payment provider to use?', 'How to handle user support?'],
    }
  );

  const nextSteps = await askListInput(
    'List immediate next steps:',
    {
      minItems: 3,
      maxItems: 10,
      itemMinLength: 5,
      defaultItems: ['Set up development environment', 'Create technical design', 'Start with authentication'],
    }
  );

  const sessionDuration = (Date.now() - sessionStartTime.getTime()) / 60000;

  return {
    project,
    mvp,
    timeline,
    techStack,
    risks,
    assumptions,
    openQuestions,
    nextSteps,
    generatedAt: new Date(),
    sessionDuration: Math.round(sessionDuration),
  };
}

export async function askQuickStartQuestions(): Promise<Partial<PRDData>> {
  Logger.title('Quick Start Mode');
  
  const project = await askProjectQuestions();
  const mvp = await askMVPQuestions();

  const quickAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'duration',
      message: 'Estimated development time:',
      choices: [
        { name: '2-4 weeks', value: 3 },
        { name: '1-2 months', value: 6 },
        { name: '2-3 months', value: 10 },
      ],
    },
    {
      type: 'checkbox',
      name: 'techStack',
      message: 'Primary technologies (select all that apply):',
      choices: [
        'React/Next.js',
        'Node.js',
        'PostgreSQL',
        'TypeScript',
        'Tailwind CSS',
        'AWS/Vercel',
      ],
    },
  ]);

  return {
    project,
    mvp,
    timeline: {
      totalWeeks: quickAnswers.duration,
      phases: [
        {
          name: 'Planning',
          duration: Math.ceil(quickAnswers.duration * 0.2),
          deliverables: ['Design', 'Architecture'],
        },
        {
          name: 'Development',
          duration: Math.ceil(quickAnswers.duration * 0.6),
          deliverables: ['Core features'],
        },
        {
          name: 'Launch',
          duration: Math.ceil(quickAnswers.duration * 0.2),
          deliverables: ['Deployment', 'Documentation'],
        },
      ],
      milestones: [],
    },
    techStack: {
      frontend: quickAnswers.techStack.filter((t: string) => ['React/Next.js', 'TypeScript', 'Tailwind CSS'].includes(t)),
      backend: quickAnswers.techStack.filter((t: string) => ['Node.js', 'TypeScript'].includes(t)),
      database: quickAnswers.techStack.filter((t: string) => t === 'PostgreSQL'),
      hosting: quickAnswers.techStack.filter((t: string) => t === 'AWS/Vercel'),
    },
    risks: [],
    assumptions: [],
    openQuestions: [],
    nextSteps: ['Set up development environment', 'Create detailed technical design', 'Start development'],
    generatedAt: new Date(),
    sessionDuration: 15,
  };
}