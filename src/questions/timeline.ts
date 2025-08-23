import inquirer from 'inquirer';
import { Timeline, Phase, Milestone } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export async function askTimelineQuestions(): Promise<Timeline> {
  Logger.section('Timeline & Milestones');

  const timelineAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'duration',
      message: 'How long do you estimate for MVP development?',
      choices: [
        { name: '2-4 weeks (Rapid prototype)', value: 3 },
        { name: '1-2 months (Standard MVP)', value: 6 },
        { name: '2-3 months (Complex MVP)', value: 10 },
        { name: '3-6 months (Full-featured MVP)', value: 20 },
        { name: 'Custom duration', value: 0 },
      ],
    },
  ]);

  let totalWeeks = timelineAnswers.duration;
  
  if (totalWeeks === 0) {
    const customDuration = await inquirer.prompt([
      {
        type: 'input',
        name: 'weeks',
        message: 'Enter duration in weeks:',
        validate: (input: string) => {
          const num = parseInt(input, 10);
          if (isNaN(num) || num < 1 || num > 52) {
            return 'Please enter a number between 1 and 52 weeks';
          }
          return true;
        },
      },
    ]);
    totalWeeks = parseInt(customDuration.weeks, 10);
  }

  const phaseAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'phaseCount',
      message: 'How many development phases?',
      choices: [
        { name: '3 phases (Planning, Development, Launch)', value: 3 },
        { name: '4 phases (Planning, Development, Testing, Launch)', value: 4 },
        { name: '5 phases (Research, Planning, Development, Testing, Launch)', value: 5 },
        { name: 'Custom phases', value: 0 },
      ],
    },
  ]);

  let phases: Phase[] = [];
  
  if (phaseAnswers.phaseCount === 3) {
    phases = [
      {
        name: 'Planning & Design',
        duration: Math.ceil(totalWeeks * 0.2),
        deliverables: ['Technical architecture', 'UI/UX designs', 'Project setup'],
      },
      {
        name: 'Development',
        duration: Math.ceil(totalWeeks * 0.6),
        deliverables: ['Core features', 'Basic testing', 'Documentation'],
      },
      {
        name: 'Launch Preparation',
        duration: Math.ceil(totalWeeks * 0.2),
        deliverables: ['Deployment', 'User onboarding', 'Launch materials'],
      },
    ];
  } else if (phaseAnswers.phaseCount === 4) {
    phases = [
      {
        name: 'Planning & Design',
        duration: Math.ceil(totalWeeks * 0.2),
        deliverables: ['Technical architecture', 'UI/UX designs'],
      },
      {
        name: 'Development',
        duration: Math.ceil(totalWeeks * 0.5),
        deliverables: ['Core features implementation'],
      },
      {
        name: 'Testing & Refinement',
        duration: Math.ceil(totalWeeks * 0.2),
        deliverables: ['Bug fixes', 'Performance optimization'],
      },
      {
        name: 'Launch',
        duration: Math.ceil(totalWeeks * 0.1),
        deliverables: ['Deployment', 'Launch campaign'],
      },
    ];
  } else if (phaseAnswers.phaseCount === 5) {
    phases = [
      {
        name: 'Research',
        duration: Math.ceil(totalWeeks * 0.1),
        deliverables: ['Market research', 'User interviews'],
      },
      {
        name: 'Planning',
        duration: Math.ceil(totalWeeks * 0.15),
        deliverables: ['Technical architecture', 'UI/UX designs'],
      },
      {
        name: 'Development',
        duration: Math.ceil(totalWeeks * 0.45),
        deliverables: ['Core features implementation'],
      },
      {
        name: 'Testing',
        duration: Math.ceil(totalWeeks * 0.2),
        deliverables: ['QA testing', 'User testing'],
      },
      {
        name: 'Launch',
        duration: Math.ceil(totalWeeks * 0.1),
        deliverables: ['Deployment', 'Marketing launch'],
      },
    ];
  } else {
    const customPhaseCount = await inquirer.prompt([
      {
        type: 'input',
        name: 'count',
        message: 'How many phases?',
        validate: (input: string) => {
          const num = parseInt(input, 10);
          if (isNaN(num) || num < 2 || num > 10) {
            return 'Please enter a number between 2 and 10';
          }
          return true;
        },
      },
    ]);

    const count = parseInt(customPhaseCount.count, 10);
    const weekPerPhase = Math.ceil(totalWeeks / count);

    for (let i = 0; i < count; i++) {
      const phaseInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: `Phase ${i + 1} name:`,
          validate: (input: string) => input.trim().length > 0 || 'Phase name is required',
        },
        {
          type: 'input',
          name: 'duration',
          message: `Duration in weeks (remaining: ${totalWeeks - phases.reduce((sum, p) => sum + p.duration, 0)}):`,
          default: weekPerPhase.toString(),
          validate: (input: string) => {
            const num = parseInt(input, 10);
            if (isNaN(num) || num < 1) return 'Duration must be at least 1 week';
            return true;
          },
        },
      ]);

      phases.push({
        name: phaseInfo.name,
        duration: parseInt(phaseInfo.duration, 10),
        deliverables: [`${phaseInfo.name} deliverables`],
      });
    }
  }

  const milestoneAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasMilestones',
      message: 'Do you want to define specific milestones?',
      default: true,
    },
  ]);

  let milestones: Milestone[] = [];
  if (milestoneAnswers.hasMilestones) {
    const startDate = new Date();
    milestones = phases.map((phase, index) => {
      const weeksSoFar = phases.slice(0, index + 1).reduce((sum, p) => sum + p.duration, 0);
      const milestoneDate = new Date(startDate);
      milestoneDate.setDate(milestoneDate.getDate() + weeksSoFar * 7);
      
      return {
        name: `${phase.name} Complete`,
        date: milestoneDate.toISOString().split('T')[0],
        criteria: phase.deliverables,
      };
    });
  }

  Logger.success('Timeline created');

  return {
    totalWeeks,
    phases,
    milestones,
  };
}