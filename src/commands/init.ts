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
    
    // Initialize AI (default is 'active' now)
    const aiMode = options.aiMode || 'active';
    const aiFlow = await createAIEnhancedFlow(sessionId, {
      aiMode,
      showCosts: process.env.AI_SHOW_COSTS !== 'false'
    });

    // Ask for session type
    const sessionType = await askSessionType();
    
    let prdData: PRDData;

    if (sessionType === 'quick') {
      if (aiMode !== 'off') {
        // Use AI-enhanced quick start questions
        prdData = await askQuickStartQuestionsWithAI(sessionStartTime, aiFlow);
      } else {
        prdData = await askQuickStartQuestions() as PRDData;
      }
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

async function collectAllQuestionsWithAI(sessionStartTime: Date, aiFlow: any): Promise<PRDData> {
  // Import needed functions
  const { enforceTimeBox } = await import('../questions/coreQuestions.js');
  
  // Start with core questions using AI enhancement
  Logger.section('Core Project Definition');
  
  // Use AI-enhanced questions for core questions
  const projectName = await aiFlow.askWithAI(
    'What is the name of your project?',
    (v: string) => v.length >= 2 || 'Project name must be at least 2 characters'
  );
  
  const problem = await aiFlow.askWithAI(
    'What problem does your project solve? (Be specific)',
    (v: string) => v.length >= 20 || 'Please provide a more detailed problem statement (min 20 chars)'
  );
  
  const solution = await aiFlow.askWithAI(
    'How does your project solve this problem?',
    (v: string) => v.length >= 20 || 'Please provide a more detailed solution (min 20 chars)'
  );
  
  const targetAudience = await aiFlow.askWithAI(
    'Who is your target audience? (Be specific about demographics)',
    (v: string) => v.length >= 10 || 'Please be more specific about your target audience'
  );
  
  const uniqueValue = await aiFlow.askWithAI(
    'What makes your solution unique compared to existing alternatives?',
    (v: string) => v.length >= 20 || 'Please provide more detail about your unique value'
  );
  
  // Check time box
  if (enforceTimeBox(sessionStartTime, 15)) {
    Logger.warning('Core questions took too long. Switching to rapid mode.');
  }
  
  // MVP Questions with AI
  Logger.section('MVP Scope');
  
  const coreFeatures = await aiFlow.askListWithAI(
    'List 3-5 core features for your MVP (most essential only):',
    {
      minItems: 3,
      maxItems: 5,
      itemMinLength: 5
    }
  );
  
  const successMetrics = await aiFlow.askListWithAI(
    'List 2-4 success metrics (how will you measure success?):',
    {
      minItems: 2,
      maxItems: 4,
      itemMinLength: 5
    }
  );
  
  const outOfScope = await aiFlow.askListWithAI(
    'List features that are OUT of scope for MVP (save for later):',
    {
      minItems: 2,
      maxItems: 10,
      itemMinLength: 5
    }
  );
  
  // Timeline Questions with AI
  Logger.section('Timeline Planning');
  
  const timelineWeeks = await aiFlow.askWithAI(
    'How many weeks do you estimate for MVP development? (be realistic)',
    (v: string) => {
      const weeks = parseInt(v);
      return (!isNaN(weeks) && weeks >= 2 && weeks <= 52) || 'Please enter a number between 2 and 52 weeks';
    }
  );
  
  // Technical Questions with AI
  Logger.section('Technical Decisions');
  
  const techStackFrontend = await aiFlow.askWithAI(
    'What frontend technology will you use? (e.g., React, Vue, vanilla JS)',
    (v: string) => v.length >= 2 || 'Please specify a frontend technology'
  );
  
  const techStackBackend = await aiFlow.askWithAI(
    'What backend technology will you use? (e.g., Node.js, Python, Rails)',
    (v: string) => v.length >= 2 || 'Please specify a backend technology'
  );
  
  const techStackDatabase = await aiFlow.askWithAI(
    'What database will you use? (e.g., PostgreSQL, MongoDB, Firebase)',
    (v: string) => v.length >= 2 || 'Please specify a database'
  );
  
  // Risk Assessment with AI
  const risks = await aiFlow.askListWithAI(
    'List 2-5 main risks or challenges for this project:',
    {
      minItems: 2,
      maxItems: 5,
      itemMinLength: 10
    }
  );
  
  // Final Details with AI
  Logger.section('Final Details');
  
  const assumptions = await aiFlow.askListWithAI(
    'List key assumptions (what you assume to be true):',
    {
      minItems: 1,
      maxItems: 10,
      itemMinLength: 5
    }
  );
  
  const openQuestions = await aiFlow.askListWithAI(
    'List open questions to research:',
    {
      minItems: 1,
      maxItems: 10,
      itemMinLength: 5
    }
  );
  
  const nextSteps = await aiFlow.askListWithAI(
    'List immediate next steps after this planning session:',
    {
      minItems: 3,
      maxItems: 10,
      itemMinLength: 5
    }
  );
  
  // Construct PRDData object
  const prdData: PRDData = {
    project: {
      name: projectName,
      description: solution,
      targetAudience,
      problemStatement: problem,
      uniqueValue
    },
    mvp: {
      problemStatement: problem,
      solutionApproach: solution,
      coreFeatures,
      successMetrics,
      outOfScope,
      nonGoals: outOfScope.slice(0, 3),
      constraints: [`Time: ${timelineWeeks} weeks`, 'Budget: Solo developer', 'Resources: Limited']
    },
    timeline: {
      totalWeeks: parseInt(timelineWeeks),
      phases: [
        {
          name: 'Setup & Planning',
          duration: 1,
          deliverables: ['Development environment', 'Project structure', 'Initial designs']
        },
        {
          name: 'Core Development',
          duration: Math.max(1, parseInt(timelineWeeks) - 2),
          deliverables: coreFeatures
        },
        {
          name: 'Testing & Launch',
          duration: 1,
          deliverables: ['Testing', 'Bug fixes', 'Deployment']
        }
      ],
      milestones: [
        {
          name: 'Development Start',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          criteria: ['Environment ready', 'Project structure defined']
        },
        {
          name: 'MVP Complete',
          date: new Date(Date.now() + parseInt(timelineWeeks) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          criteria: ['All core features complete', 'Testing passed', 'Ready for deployment']
        }
      ]
    },
    techStack: {
      frontend: [techStackFrontend],
      backend: [techStackBackend],
      database: [techStackDatabase],
      hosting: ['To be decided'],
      tools: []
    },
    risks: risks.map((r: string) => ({
      description: r,
      impact: 'medium' as const,
      likelihood: 'medium' as const,
      mitigation: 'To be defined'
    })),
    assumptions,
    openQuestions,
    nextSteps,
    generatedAt: new Date(),
    sessionDuration: Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)
  };
  
  return prdData;
}

async function askQuickStartQuestionsWithAI(sessionStartTime: Date, aiFlow: any): Promise<PRDData> {
  Logger.title('QUICK START MODE WITH AI');
  
  // Project Questions with AI
  Logger.section('Project Information');
  
  const projectName = await aiFlow.askWithAI(
    'What is the name of your project?',
    (v: string) => v.length >= 2 || 'Project name must be at least 2 characters'
  );
  
  const description = await aiFlow.askWithAI(
    'Describe your project in 2-3 sentences:',
    (v: string) => v.length >= 10 || 'Please provide a more detailed description (min 10 chars)'
  );
  
  const targetAudience = await aiFlow.askWithAI(
    'Who is your target audience?',
    (v: string) => v.length >= 10 || 'Please be more specific about your target audience'
  );
  
  const problem = await aiFlow.askWithAI(
    'What problem does your project solve?',
    (v: string) => v.length >= 20 || 'Please provide a more detailed problem statement (min 20 chars)'
  );
  
  const uniqueValue = await aiFlow.askWithAI(
    'What makes your solution unique?',
    (v: string) => v.length >= 10 || 'Please describe what makes your solution unique'
  );
  
  // MVP Questions with AI
  Logger.section('MVP Scope Definition');
  
  const numFeaturesStr = await aiFlow.askWithAI(
    'How many core features will your MVP have? (3-5 recommended for true MVP):',
    (v: string) => {
      const num = parseInt(v);
      return (!isNaN(num) && num >= 1 && num <= 10) || 'Please enter a number between 1 and 10';
    },
    '3'
  );
  const numFeatures = parseInt(numFeaturesStr);
  
  const coreFeatures = await aiFlow.askListWithAI(
    `List your ${numFeatures} core MVP features:`,
    {
      minItems: numFeatures,
      maxItems: numFeatures,
      itemMinLength: 5
    }
  );
  
  const successMetrics = await aiFlow.askListWithAI(
    'List 2-3 success metrics (how will you measure success?):',
    {
      minItems: 2,
      maxItems: 3,
      itemMinLength: 5
    }
  );
  
  // Timeline with AI
  Logger.section('Timeline');
  
  const timelineWeeks = await aiFlow.askWithAI(
    'How many weeks to build the MVP? (be realistic):',
    (v: string) => {
      const weeks = parseInt(v);
      return (!isNaN(weeks) && weeks >= 2 && weeks <= 52) || 'Please enter a number between 2 and 52 weeks';
    },
    '8'
  );
  
  // Risks with AI
  Logger.section('Risk Assessment');
  
  const risks = await aiFlow.askListWithAI(
    'List 2-3 main risks for this project:',
    {
      minItems: 2,
      maxItems: 3,
      itemMinLength: 10
    }
  );
  
  // Build PRDData
  const prdData: PRDData = {
    project: {
      name: projectName,
      description,
      targetAudience,
      problemStatement: problem,
      uniqueValue
    },
    mvp: {
      problemStatement: problem,
      solutionApproach: description,
      coreFeatures,
      successMetrics,
      outOfScope: [],
      nonGoals: [],
      constraints: [`Time: ${timelineWeeks} weeks`, 'Budget: Solo developer']
    },
    timeline: {
      totalWeeks: parseInt(timelineWeeks),
      phases: [
        {
          name: 'Development',
          duration: parseInt(timelineWeeks),
          deliverables: coreFeatures
        }
      ],
      milestones: [
        {
          name: 'MVP Complete',
          date: new Date(Date.now() + parseInt(timelineWeeks) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          criteria: ['All core features complete']
        }
      ]
    },
    techStack: {
      frontend: ['To be decided'],
      backend: ['To be decided'],
      database: ['To be decided'],
      hosting: ['To be decided']
    },
    risks: risks.map((r: string) => ({
      description: r,
      impact: 'medium' as const,
      likelihood: 'medium' as const,
      mitigation: 'To be defined'
    })),
    assumptions: ['Technical feasibility confirmed', 'Target audience identified'],
    openQuestions: ['Technical implementation details', 'Marketing strategy'],
    nextSteps: ['Set up development environment', 'Create project structure', 'Start with first feature'],
    generatedAt: new Date(),
    sessionDuration: Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)
  };
  
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