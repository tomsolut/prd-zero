import { PRDData } from '../types/index.js';
import { askProjectQuestions } from './project.js';
import { askMVPQuestions } from './mvp.js';
import { askTimelineQuestions } from './timeline.js';
import { askTechnicalQuestions } from './technical.js';
import inquirer from 'inquirer';
import { Logger } from '../utils/logger.js';

export async function collectAllQuestions(sessionStartTime: Date): Promise<PRDData> {
  const project = await askProjectQuestions();
  const mvp = await askMVPQuestions();
  const timeline = await askTimelineQuestions();
  const { techStack, risks } = await askTechnicalQuestions();

  Logger.section('Final Details');

  const finalAnswers = await inquirer.prompt([
    {
      type: 'editor',
      name: 'assumptions',
      message: 'List key assumptions (one per line, press Enter to open editor):',
      default: '# List your assumptions here\n# One per line\n',
    },
    {
      type: 'editor',
      name: 'openQuestions',
      message: 'List open questions to research (one per line, press Enter to open editor):',
      default: '# List open questions here\n# One per line\n',
    },
    {
      type: 'editor',
      name: 'nextSteps',
      message: 'List immediate next steps (one per line, press Enter to open editor):',
      default: '# List next steps here\n# One per line\n',
    },
  ]);

  const parseLines = (text: string): string[] => {
    return text
      .split('\n')
      .filter(line => !line.trim().startsWith('#') && line.trim().length > 0)
      .map(line => line.trim());
  };

  const sessionDuration = (Date.now() - sessionStartTime.getTime()) / 60000;

  return {
    project,
    mvp,
    timeline,
    techStack,
    risks,
    assumptions: parseLines(finalAnswers.assumptions),
    openQuestions: parseLines(finalAnswers.openQuestions),
    nextSteps: parseLines(finalAnswers.nextSteps),
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
      frontend: quickAnswers.techStack.filter(t => ['React/Next.js', 'TypeScript', 'Tailwind CSS'].includes(t)),
      backend: quickAnswers.techStack.filter(t => ['Node.js', 'TypeScript'].includes(t)),
      database: quickAnswers.techStack.filter(t => t === 'PostgreSQL'),
      hosting: quickAnswers.techStack.filter(t => t === 'AWS/Vercel'),
    },
    risks: [],
    assumptions: [],
    openQuestions: [],
    nextSteps: ['Set up development environment', 'Create detailed technical design', 'Start development'],
    generatedAt: new Date(),
    sessionDuration: 15,
  };
}