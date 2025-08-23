import chalk from 'chalk';
import inquirer from 'inquirer';
import { Logger } from '../utils/logger.js';
import { Spinner } from '../utils/spinner.js';
import { SessionTimer } from '../utils/timer.js';
import { collectAllQuestions, askQuickStartQuestions } from '../questions/index.js';
import { PRDGenerator } from '../generators/prd.js';
import { RoadmapGenerator } from '../generators/roadmap.js';
import { PRDData } from '../types/index.js';
import { Validator } from '../validators/index.js';

interface InitOptions {
  output: string;
  timeLimit: string;
  ai: boolean;
  skipIntro: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  try {
    const sessionStartTime = new Date();
    const timeLimit = Validator.validateTimeLimit(options.timeLimit);
    
    if (!options.skipIntro) {
      showIntro();
      await pressEnterToContinue();
    }

    // Initialize session timer
    const timer = new SessionTimer(timeLimit);

    // Start timer with status updates
    timer.start((_elapsed, remaining) => {
      if (remaining % 5 === 0 && remaining > 0 && remaining !== timeLimit) {
        process.stdout.write(`\r${Logger.timer(Math.floor(remaining), Math.floor((remaining % 1) * 60))}`);
      }
    });

    Logger.title('MVP Planning Session');
    Logger.info(`Time limit: ${timeLimit} minutes`);
    Logger.info(`Output directory: ${options.output}`);
    
    if (options.ai) {
      Logger.warning('AI assistance is enabled (requires ANTHROPIC_API_KEY environment variable)');
    }

    // Ask for session type
    const sessionType = await askSessionType();
    
    let prdData: PRDData;

    if (sessionType === 'quick') {
      prdData = await askQuickStartQuestions() as PRDData;
    } else {
      prdData = await collectAllQuestions(sessionStartTime);
    }

    // Stop the timer
    timer.stop();

    // Generate outputs
    Logger.title('Generating Documents');
    
    Spinner.start('Creating PRD document...');
    const prdGenerator = new PRDGenerator();
    const prdPath = await prdGenerator.save(prdData, options.output);
    Spinner.succeed('PRD document created');

    Spinner.start('Creating development roadmap...');
    const roadmapGenerator = new RoadmapGenerator();
    const roadmapPath = await roadmapGenerator.save(prdData, options.output);
    Spinner.succeed('Roadmap created');

    // Show summary
    showSummary(prdData, prdPath, roadmapPath);

    // Ask for feedback
    await askForFeedback();

    Logger.success('Session completed successfully!');
    
  } catch (error) {
    Spinner.fail();
    Logger.error('Session failed:');
    if (error instanceof Error) {
      Logger.error(error.message);
      if (process.env.DEBUG === 'true') {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

function showIntro(): void {
  console.clear();
  Logger.box('PRD-ZERO', [
    'MVP Planning Tool for Solo Developers',
    '',
    'Transform your idea into a structured plan',
    'in 70 minutes or less!',
    '',
    'This session will guide you through:',
    '• Project definition',
    '• MVP scope',
    '• Timeline planning',
    '• Technical decisions',
    '• Risk assessment',
    '',
    'Tips for success:',
    '• Be specific but concise',
    '• Focus on core features only',
    '• Set realistic timelines',
    '• Document assumptions',
  ]);
}

async function pressEnterToContinue(): Promise<void> {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: chalk.cyan('Press Enter to begin your planning session...'),
    },
  ]);
}

async function askSessionType(): Promise<string> {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Choose session type:',
      choices: [
        {
          name: 'Complete Planning (45-70 minutes) - Comprehensive PRD with all details',
          value: 'complete',
        },
        {
          name: 'Quick Start (10-15 minutes) - Essential information only',
          value: 'quick',
        },
      ],
    },
  ]);
  return answer.type;
}

function showSummary(data: PRDData, prdPath: string, roadmapPath: string): void {
  Logger.title('Planning Complete!');
  
  Logger.section('Project Summary');
  Logger.item(`Name: ${chalk.bold(data.project.name)}`);
  Logger.item(`Duration: ${chalk.bold(data.timeline.totalWeeks + ' weeks')}`);
  Logger.item(`Core Features: ${chalk.bold(data.mvp.coreFeatures.length.toString())}`);
  Logger.item(`Success Metrics: ${chalk.bold(data.mvp.successMetrics.length.toString())}`);
  
  if (data.risks.length > 0) {
    const highRisks = data.risks.filter(r => r.impact === 'high' || r.likelihood === 'high');
    if (highRisks.length > 0) {
      Logger.warning(`High priority risks identified: ${highRisks.length}`);
    }
  }

  Logger.section('Generated Files');
  Logger.success(`PRD: ${prdPath}`);
  Logger.success(`Roadmap: ${roadmapPath}`);
  
  Logger.section('Next Steps');
  Logger.item('1. Review the generated PRD and roadmap');
  Logger.item('2. Share with stakeholders for feedback');
  Logger.item('3. Set up your development environment');
  Logger.item('4. Create detailed technical specifications');
  Logger.item('5. Start building!');
}

async function askForFeedback(): Promise<void> {
  const feedback = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'helpful',
      message: 'Was this planning session helpful?',
      default: true,
    },
  ]);

  if (feedback.helpful) {
    Logger.highlight('Thank you! Consider starring the repo:');
    Logger.info('https://github.com/tomsolut/prd-zero');
  } else {
    Logger.info('Sorry to hear that. Please open an issue with your feedback:');
    Logger.info('https://github.com/tomsolut/prd-zero/issues');
  }
}