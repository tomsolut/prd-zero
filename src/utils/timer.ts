import { Logger } from './logger.js';

export class SessionTimer {
  private startTime: Date;
  private limitMinutes: number;
  private warningThreshold: number;
  private interval: NodeJS.Timeout | null = null;
  private isPaused: boolean = false;
  private pausedTime: number = 0;
  private pauseStart: Date | null = null;

  constructor(limitMinutes: number = 70) {
    this.startTime = new Date();
    this.limitMinutes = limitMinutes;
    this.warningThreshold = limitMinutes * 0.8;
  }

  start(onUpdate?: (elapsed: number, remaining: number) => void): void {
    this.interval = setInterval(() => {
      if (!this.isPaused) {
        const elapsed = this.getElapsedMinutes();
        const remaining = this.limitMinutes - elapsed;

        if (onUpdate) {
          onUpdate(elapsed, remaining);
        }

        if (remaining <= 10 && remaining > 9.9) {
          Logger.warning('10 minutes remaining!');
        } else if (remaining <= 5 && remaining > 4.9) {
          Logger.warning('5 minutes remaining! Time to wrap up!');
        } else if (remaining <= 0) {
          this.stop();
          Logger.error('Time limit reached! Session ending...');
          process.exit(0);
        }
      }
    }, 1000);
  }

  pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pauseStart = new Date();
      Logger.info('Timer paused');
    }
  }

  resume(): void {
    if (this.isPaused && this.pauseStart) {
      this.pausedTime += Date.now() - this.pauseStart.getTime();
      this.isPaused = false;
      this.pauseStart = null;
      Logger.info('Timer resumed');
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getElapsedMinutes(): number {
    const totalElapsed = Date.now() - this.startTime.getTime() - this.pausedTime;
    return totalElapsed / 60000;
  }

  getRemainingMinutes(): number {
    return Math.max(0, this.limitMinutes - this.getElapsedMinutes());
  }

  getProgress(): number {
    return Math.min(100, (this.getElapsedMinutes() / this.limitMinutes) * 100);
  }

  formatTime(minutes: number): string {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getStatus(): string {
    const elapsed = this.getElapsedMinutes();
    const remaining = this.getRemainingMinutes();
    
    return `Elapsed: ${this.formatTime(elapsed)} | Remaining: ${this.formatTime(remaining)}`;
  }

  isWarning(): boolean {
    return this.getElapsedMinutes() >= this.warningThreshold;
  }

  isExpired(): boolean {
    return this.getRemainingMinutes() <= 0;
  }
}