import ora, { Ora } from 'ora';
import chalk from 'chalk';

export class Spinner {
  private static instance: Ora | null = null;

  static start(text: string): void {
    this.stop();
    this.instance = ora({
      text: chalk.cyan(text),
      spinner: 'dots',
      color: 'cyan'
    }).start();
  }

  static succeed(text?: string): void {
    if (this.instance) {
      this.instance.succeed(text ? chalk.green(text) : undefined);
      this.instance = null;
    }
  }

  static fail(text?: string): void {
    if (this.instance) {
      this.instance.fail(text ? chalk.red(text) : undefined);
      this.instance = null;
    }
  }

  static warn(text?: string): void {
    if (this.instance) {
      this.instance.warn(text ? chalk.yellow(text) : undefined);
      this.instance = null;
    }
  }

  static info(text?: string): void {
    if (this.instance) {
      this.instance.info(text ? chalk.blue(text) : undefined);
      this.instance = null;
    }
  }

  static update(text: string): void {
    if (this.instance) {
      this.instance.text = chalk.cyan(text);
    }
  }

  static stop(): void {
    if (this.instance) {
      this.instance.stop();
      this.instance = null;
    }
  }

  static isSpinning(): boolean {
    return this.instance !== null && this.instance.isSpinning;
  }
}