import { Component, OnInit, OnChanges, SimpleChanges, LOCALE_ID, Inject, EventEmitter, Output, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { HammerModule } from '@angular/platform-browser';

export interface WeekDayContext {
  id: number;
  date: Date;
  formattedDate: string;
  isoDate: string;
  isBirthday: boolean;
  isToday: boolean;
}

export interface WeekRangeEvent {
  startDate: Date;
  endDate: Date;
  days: WeekDayContext[];
}

@Component({
  selector: 'app-week-navigation-control',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    TranslateModule,
    HammerModule
  ],
  templateUrl: './week-navigation-control.component.html',
  styleUrls: ['./week-navigation-control.component.css'],
  providers: [DatePipe]
})
export class WeekNavigationControlComponent implements OnInit, OnChanges {
  @Input() initialDate: Date | null = null;
  @Input() birthdays: Date[] | undefined = [];
  
  @Output() weekChanged: EventEmitter<WeekRangeEvent> = new EventEmitter();

  @ContentChild(TemplateRef) dayTemplate!: TemplateRef<any>;

  weekDays: WeekDayContext[] = [];
  currentWeekStartDate!: Date;
  formattedWeekRange: string = '';
  swipeTransform = 'translateX(0)';

  constructor(
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    this.goToWeek(this.initialDate || new Date());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['birthdays'] && !changes['birthdays'].firstChange) {
      this.generateWeekDays();
    }
    if (changes['initialDate'] && !changes['initialDate'].firstChange && this.initialDate) {
      this.goToWeek(this.initialDate);
    }
  }

  displayWeek(): void {
    this.generateWeekDays();
    this.weekChanged.emit({
      startDate: this.weekDays[0].date,
      endDate: this.weekDays[6].date,
      days: this.weekDays
    });
  }

  goToCurrentWeek(): void {
    this.goToWeek(new Date());
  }

  previousWeek(): void {
    this.currentWeekStartDate.setDate(this.currentWeekStartDate.getDate() - 7);
    this.currentWeekStartDate = new Date(this.currentWeekStartDate);
    this.displayWeek();
  }

  nextWeek(): void {
    this.currentWeekStartDate.setDate(this.currentWeekStartDate.getDate() + 7);
    this.currentWeekStartDate = new Date(this.currentWeekStartDate);
    this.displayWeek();
  }

  goToWeek(date: Date): void {
    const today = new Date(date);
    const currentDayOfWeek = (today.getDay() + 6) % 7; // 0=Mon, 1=Tue, ..., 6=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek);
    monday.setHours(0, 0, 0, 0); // Normalize to start of day
    this.currentWeekStartDate = monday;
    this.displayWeek();
  }

  generateWeekDays(): void {
    this.weekDays = [];
    const monday = new Date(this.currentWeekStartDate);
    monday.setHours(0, 0, 0, 0);

    let weekEndDate: Date | null = null;
    const todayIso = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      dayDate.setHours(0, 0, 0, 0);

      const formatted = this.datePipe.transform(dayDate, 'EEEE d MMMM', this.locale) || '';
      const iso = this.datePipe.transform(dayDate, 'yyyy-MM-dd') || '';
      const isToday = iso === todayIso;

      let isBirthday = false;
      if (this.birthdays && this.birthdays.length > 0) {
        const currentMonth = dayDate.getMonth();
        const currentDayOfMonth = dayDate.getDate();
        isBirthday = this.birthdays.some(birthday => 
            birthday.getMonth() === currentMonth && birthday.getDate() === currentDayOfMonth
        );
      }

      this.weekDays.push({
        id: i,
        date: dayDate,
        formattedDate: formatted.charAt(0).toUpperCase() + formatted.slice(1),
        isoDate: iso,
        isBirthday,
        isToday
      }); 

      if (i === 6) {
        weekEndDate = dayDate;
      }
    } 

    const startFormatted = this.datePipe.transform(this.currentWeekStartDate, 'd MMM', this.locale);
    const endFormatted = this.datePipe.transform(weekEndDate, 'd MMM', this.locale);
    this.formattedWeekRange = `Semaine du ${startFormatted} au ${endFormatted}`;
  }

  swipeNavigation(event: any) {
    switch (event.direction) {
      case 4:
        this.previousWeek();
        break;
      case 2:
        this.nextWeek();
        break;
      default:
        break;
    }
  }
}