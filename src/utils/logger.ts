import chalk from 'chalk';

export class Logger {
  private static debugMode = process.env.DEBUG === 'true';

  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  static error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  static warning(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static debug(message: string): void {
    if (this.debugMode) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  }

  static title(message: string): void {
    console.log('');
    console.log(chalk.bold.cyan('═'.repeat(50)));
    console.log(chalk.bold.cyan(message.toUpperCase()));
    console.log(chalk.bold.cyan('═'.repeat(50)));
    console.log('');
  }

  static section(message: string): void {
    console.log('');
    console.log(chalk.bold.blue('▶'), chalk.bold(message));
    console.log(chalk.gray('─'.repeat(40)));
  }

  static item(message: string): void {
    console.log(chalk.gray('  •'), message);
  }

  static progress(current: number, total: number, label: string): void {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    
    console.log(
      chalk.cyan(`[${bar}]`),
      chalk.bold(`${percentage}%`),
      chalk.gray(`- ${label}`)
    );
  }

  static timer(minutes: number, seconds: number): string {
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');
    return chalk.yellow(`⏱  ${m}:${s}`);
  }

  static highlight(message: string): void {
    console.log(chalk.bgCyan.black(` ${message} `));
  }

  static box(title: string, content: string[]): void {
    const maxLength = Math.max(title.length, ...content.map(c => c.length)) + 4;
    const topBorder = '┌' + '─'.repeat(maxLength) + '┐';
    const bottomBorder = '└' + '─'.repeat(maxLength) + '┘';

    console.log(chalk.cyan(topBorder));
    console.log(chalk.cyan('│'), chalk.bold(title.padEnd(maxLength - 2)), chalk.cyan('│'));
    console.log(chalk.cyan('├' + '─'.repeat(maxLength) + '┤'));
    
    content.forEach(line => {
      console.log(chalk.cyan('│'), line.padEnd(maxLength - 2), chalk.cyan('│'));
    });
    
    console.log(chalk.cyan(bottomBorder));
  }
}