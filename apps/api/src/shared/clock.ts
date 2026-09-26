import { CalendarDate } from './calendar-date';

export const APP_TIME_ZONE = 'America/Sao_Paulo';

export const APP_UTC_OFFSET = '-03:00';

export interface Clock {
  now(): Date;
  today(): CalendarDate;
}

export class SystemClock implements Clock {
  constructor(private readonly timeZone: string = APP_TIME_ZONE) {}

  now(): Date {
    return new Date();
  }

  today(): CalendarDate {
    return CalendarDate.fromInstant(this.now(), this.timeZone);
  }
}
