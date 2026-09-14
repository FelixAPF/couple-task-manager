import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-timer.component.html',
  styleUrls: ['./countdown-timer.component.css']
})
export class CountdownTimerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() targetDate!: string;

  days = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;
  status: 'upcoming' | 'today' | 'past' = 'upcoming';

  private timerId: any = null;

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['targetDate']) {
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.updateCountdown();
    if (this.status === 'upcoming') {
      this.timerId = setInterval(() => this.updateCountdown(), 1000);
    }
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateCountdown(): void {
    if (!this.targetDate) return;

    const cleanStr = typeof this.targetDate === 'string' ? this.targetDate.split('T')[0] : '';
    const [year, month, day] = cleanStr.split('-').map(Number);
    if (!year || !month || !day) return;

    const targetMidnight = new Date(year, month - 1, day).getTime();
    const now = Date.now();
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetMidnight - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      this.status = 'past';
      this.stopTimer();
      return;
    }

    if (diffDays === 0) {
      this.status = 'today';
      this.stopTimer();
      return;
    }

    this.status = 'upcoming';
    const difference = targetMidnight - now;
    if (difference <= 0) {
      this.status = 'today';
      this.stopTimer();
      return;
    }

    this.days = Math.floor(difference / (1000 * 60 * 60 * 24));
    this.hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    this.minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    this.seconds = Math.floor((difference % (1000 * 60)) / 1000);
  }
}