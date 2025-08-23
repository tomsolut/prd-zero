#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('prd-zero')
  .description(chalk.cyan('MVP planning tool for solo developers - from idea to PRD in 70 minutes'))
  .version('1.0.0')
  .option('-d, --debug', 'output extra debugging')
  .option('--no-color', 'disable colored output');

program
  .command('init')
  .description('Start a new MVP planning session (70 minutes max)')
  .option('-o, --output <path>', 'output directory for generated files', './outputs')
  .option('-t, --time-limit <minutes>', 'session time limit in minutes', '70')
  .option('--ai', 'enable AI-powered suggestions (requires API key)')
  .option('--ai-mode <mode>', 'AI interaction mode: active, passive, or off', 'active')
  .option('--skip-intro', 'skip the introduction and get straight to planning')
  .action(initCommand);

program
  .command('resume')
  .description('Resume a previous planning session')
  .argument('<session-file>', 'path to saved session file')
  .action((sessionFile) => {
    console.log(chalk.yellow('Resume feature coming soon!'));
    console.log(`Would resume from: ${sessionFile}`);
  });

program
  .command('templates')
  .description('Manage PRD templates')
  .option('-l, --list', 'list available templates')
  .option('-a, --add <path>', 'add a custom template')
  .action((options) => {
    if (options.list) {
      console.log(chalk.cyan('Available templates:'));
      console.log('  - default: Standard PRD template');
      console.log('  - minimal: Lightweight PRD for quick MVPs');
      console.log('  - detailed: Comprehensive PRD with all sections');
    } else if (options.add) {
      console.log(chalk.yellow('Template management coming soon!'));
    }
  });

program.on('option:debug', () => {
  process.env.DEBUG = 'true';
  console.log(chalk.gray('Debug mode enabled'));
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log('');
  console.log(chalk.cyan('Quick start:'));
  console.log(chalk.gray('  $ prd-zero init              # Start with AI assistance (active mode)'));
  console.log(chalk.gray('  $ prd-zero init --ai-mode off # Start without AI'));
  console.log('');
  console.log(chalk.cyan('For more information:'));
  console.log(chalk.gray('  https://github.com/tomsolut/prd-zero'));
}