import chalk from 'chalk';
import inquirer from 'inquirer';
import { Logger } from '../utils/logger.js';
import { Spinner } from '../utils/spinner.js';
import { SessionTimer } from '../utils/timer.js';
import { collectAllQuestions, askQuickStartQuestions } from '../questions/index.js';
import { createAIEnhancedFlow } from '../questions/aiEnhanced.js';
import { PRDGenerator } from '../generators/prd.js';
import { RoadmapGenerator } from '../generators/roadmap.js';
import { CostReportGenerator } from '../generators/costReport.js';
import { PRDData } from '../types/index.js';
import { Validator } from '../validators/index.js';
import { runInteractiveValidation } from '../validators/validationIntegrator.js';
import { FileSystem } from '../utils/fileSystem.js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface InitOptions {
  output: string;
  timeLimit: string;
  ai: boolean;
  aiMode?: 'active' | 'passive' | 'off';
  skipIntro: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  try {
    const sessionStartTime = new Date();
    const sessionId = uuidv4();
    const timeLimit = Validator.validateTimeLimit(options.timeLimit);
    
    // Create session-specific output directory
    const sessionDir = FileSystem.createSessionDirectory(options.output);
    
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
    Logger.info(`Session ID: ${sessionId}`);
    Logger.info(`Time limit: ${timeLimit} minutes`);
    Logger.info(`Output directory: ${sessionDir}`);
    
    // Initialize AI if requested
    const aiMode = options.aiMode || (options.ai ? 'passive' : 'off');
    const aiFlow = await createAIEnhancedFlow(sessionId, {
      aiMode,
      showCosts: process.env.AI_SHOW_COSTS !== 'false'
    });

    // Ask for session type
    const sessionType = await askSessionType();
    
    let prdData: PRDData;

    if (sessionType === 'quick') {
      prdData = await askQuickStartQuestions() as PRDData;
    } else {
      if (aiMode !== 'off') {
        // Use AI-enhanced question flow
        prdData = await collectAllQuestionsWithAI(sessionStartTime, aiFlow);
      } else {
        prdData = await collectAllQuestions(sessionStartTime);
      }
    }

    // Stop the timer
    timer.stop();

    // Run validation before generating documents
    Logger.title('Validating Your Plan');
    let validationPassed = await runInteractiveValidation(prdData);
    
    // Additional AI validation if enabled
    if (aiMode !== 'off') {
      const aiValidation = await aiFlow.validateWithAI(prdData);
      if (!aiValidation.isValid) {
        validationPassed = false;
      }
    }
    
    if (!validationPassed) {
      const continueAnyway = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'Do you want to generate documents despite validation warnings?',
          default: false,
        },
      ]);
      
      if (!continueAnyway.continue) {
        Logger.info('Session cancelled. Please refine your plan and try again.');
        return;
      }
    }

    // Generate outputs
    Logger.title('Generating Documents');
    
    Spinner.start('Creating PRD document...');
    const prdGenerator = new PRDGenerator();
    let prdContent = prdGenerator.generate(prdData);
    
    // Optimize PRD with AI if enabled
    if (aiMode !== 'off') {
      prdContent = await aiFlow.optimizePRD(prdContent);
    }
    
    const prdPath = await prdGenerator.saveContent(prdContent, sessionDir, 'PRD.md');
    Spinner.succeed('PRD document created');

    Spinner.start('Creating development roadmap...');
    const roadmapGenerator = new RoadmapGenerator();
    const roadmapPath = await roadmapGenerator.save(prdData, sessionDir);
    Spinner.succeed('Roadmap created');
    
    // Generate cost report if AI was used
    if (aiMode !== 'off') {
      Spinner.start('Creating cost report...');
      const metrics = aiFlow.getMetrics();
      const costReport = CostReportGenerator.generateCostReport(
        metrics.aiMetrics,
        metrics.sessionAnalytics
      );
      const costJson = CostReportGenerator.generateCostJSON(
        metrics.aiMetrics,
        metrics.sessionAnalytics
      );
      
      await FileSystem.saveFile(
        sessionDir,
        'ai-cost-report.md',
        costReport
      );
      await FileSystem.saveFile(
        sessionDir,
        'ai-cost-report.json',
        JSON.stringify(costJson, null, 2)
      );
      Spinner.succeed('Cost report created');
    }

    // Show summary
    showSummary(prdData, prdPath, roadmapPath, aiMode !== 'off' ? aiFlow.getMetrics() : null);

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

async function collectAllQuestionsWithAI(sessionStartTime: Date, _aiFlow: any): Promise<PRDData> {
  // This is a simplified version - in production you would integrate AI into each question
  const prdData = await collectAllQuestions(sessionStartTime);
  
  // The AI flow has already been tracking interactions through the session
  // Here we just return the data as the AI enhancements were applied during collection
  return prdData;
}

function showSummary(data: PRDData, prdPath: string, roadmapPath: string, aiMetrics?: any): void {
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
  
  // Show AI metrics if available
  if (aiMetrics) {
    Logger.section('AI Usage');
    Logger.item(`API Calls: ${aiMetrics.aiMetrics.apiCalls}`);
    Logger.item(`Tokens Used: ${aiMetrics.aiMetrics.totalTokensUsed}`);
    Logger.item(`Total Cost: $${aiMetrics.aiMetrics.estimatedCost.toFixed(4)}`);
    Logger.item(`AI Interventions: ${aiMetrics.sessionAnalytics.aiInterventions}`);
  }
  
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