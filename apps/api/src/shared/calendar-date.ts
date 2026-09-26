import { InvalidValueError } from './errors/invalid-value-error';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_LENGTH = 10;

export class CalendarDate {
  private constructor(readonly value: string) {}

  static fromIso(value: string): CalendarDate {
    if (!ISO_DATE_PATTERN.test(value) || toIsoDate(parseUtc(value)) !== value) {
      throw new InvalidValueError(`Invalid calendar date '${value}', expected an existing YYYY-MM-DD date`);
    }
    return new CalendarDate(value);
  }

  static fromInstant(instant: Date, timeZone: string): CalendarDate {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    return CalendarDate.fromIso(formatter.format(instant));
  }

  static fromUtcDate(date: Date): CalendarDate {
    return CalendarDate.fromIso(toIsoDate(date));
  }

  toUtcDate(): Date {
    return parseUtc(this.value);
  }

  addDays(days: number): CalendarDate {
    const date = parseUtc(this.value);
    date.setUTCDate(date.getUTCDate() + days);
    return new CalendarDate(toIsoDate(date));
  }

  addMonths(months: number): CalendarDate {
    const date = parseUtc(this.value);
    const targetMonthStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
    const target = new Date(targetMonthStart);
    const lastDayOfTargetMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(date.getUTCDate(), lastDayOfTargetMonth));
    return new CalendarDate(toIsoDate(target));
  }

  isBefore(other: CalendarDate): boolean {
    return this.value < other.value;
  }

  equals(other: CalendarDate): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

function parseUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function toIsoDate(date: Date): string {
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, ISO_DATE_LENGTH);
}
