import type { IndicatorFrequency } from '../api/indicators';

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

export interface AvailablePeriod {
  readonly year: number;
  readonly months: readonly number[];
}

export type Granularity = 'year' | 'month' | 'history';

export const CALENDAR_GRANULARITIES: readonly Granularity[] = Object.freeze(['year', 'month']);

export type WindowUnit = 'day' | 'month';

export interface HistoryWindow {
  readonly unit: WindowUnit;
  readonly length: number;
}

export interface WindowSelection {
  readonly granularity: 'window';
  readonly window: HistoryWindow;
  readonly from: string;
  readonly to: string;
}

export interface PeriodAxis {
  readonly keys: readonly string[];
  readonly labels: readonly string[];
}

export type PeriodSelection =
  | WindowSelection
  | { readonly granularity: 'year'; readonly year: number }
  | { readonly granularity: 'month'; readonly year: number; readonly month: number }
  | { readonly granularity: 'history'; readonly from: string; readonly to: string };

const FIRST_MONTH = 1;
const MONTHS_IN_YEAR = 12;
const DATE_PART_LENGTH = 2;
const REFERENCE_YEAR = 2000;
const SHORT_YEAR_LENGTH = 2;
const MONTH_KEY_LENGTH = 7;
const ISO_DATE_LENGTH = 10;
const MILLISECONDS_PER_DAY = 86_400_000;

const HISTORY_WINDOWS: Readonly<Record<IndicatorFrequency, HistoryWindow>> = Object.freeze({
  daily: { unit: 'day', length: 90 },
  weekly: { unit: 'day', length: 182 },
  monthly: { unit: 'month', length: 24 },
  quarterly: { unit: 'month', length: 24 },
  annual: { unit: 'month', length: 120 },
});

const WINDOW_UNIT_LABELS: Readonly<Record<WindowUnit, string>> = { day: 'dias', month: 'meses' };

const monthNameFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' });

const monthShortFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });

export function defaultSelection(available: readonly AvailablePeriod[]): PeriodSelection | null {
  const years = yearsOf(available);
  const latestYear = years[0];
  return latestYear === undefined ? null : { granularity: 'year', year: latestYear };
}

export function historyWindowOf(frequency: IndicatorFrequency): HistoryWindow {
  return HISTORY_WINDOWS[frequency];
}

export function windowSelection(frequency: IndicatorFrequency, latestDate: string | null): WindowSelection | null {
  if (latestDate === null) return null;
  const window = historyWindowOf(frequency);
  return { granularity: 'window', window, ...windowRange(window, latestDate) };
}

export function windowLabel(window: HistoryWindow): string {
  return `${window.length} ${WINDOW_UNIT_LABELS[window.unit]}`;
}

export function hasDailyAxis(selection: PeriodSelection): boolean {
  return selection.granularity === 'month' || (selection.granularity === 'window' && selection.window.unit === 'day');
}

export function rangeOfSelection(selection: PeriodSelection): DateRange {
  if (selection.granularity === 'window') return { from: selection.from, to: selection.to };
  if (selection.granularity === 'history') {
    const [year, month] = splitMonthKey(selection.to);
    return { from: `${selection.from}-01`, to: `${selection.to}-${pad(lastDayOfMonth(year, month))}` };
  }
  if (selection.granularity === 'year') {
    return { from: `${selection.year}-01-01`, to: `${selection.year}-12-31` };
  }
  const month = pad(selection.month);
  return { from: `${selection.year}-${month}-01`, to: `${selection.year}-${month}-${pad(lastDayOfMonth(selection.year, selection.month))}` };
}

export function switchGranularity(selection: PeriodSelection, granularity: Granularity, available: readonly AvailablePeriod[]): PeriodSelection {
  if (granularity === 'history') return historySelection(available) ?? selection;
  const year = selection.granularity === 'history' || selection.granularity === 'window' ? splitMonthKey(selection.to)[0] : selection.year;
  if (granularity === 'year') return { granularity: 'year', year };
  if (selection.granularity === 'month') return selection;
  return { granularity: 'month', year, month: latestMonthOf(available, year) };
}

export function selectYear(selection: PeriodSelection, year: number, available: readonly AvailablePeriod[]): PeriodSelection {
  if (selection.granularity !== 'month') return { granularity: 'year', year };
  const keepsMonth = monthsOf(available, year).includes(selection.month);
  return { granularity: 'month', year, month: keepsMonth ? selection.month : latestMonthOf(available, year) };
}

export function selectMonth(selection: PeriodSelection, month: number): PeriodSelection {
  if (selection.granularity === 'history' || selection.granularity === 'window') return selection;
  return { granularity: 'month', year: selection.year, month };
}

export function yearsOf(available: readonly AvailablePeriod[]): number[] {
  return available.map((period) => period.year).sort((left, right) => right - left);
}

export function monthsOf(available: readonly AvailablePeriod[], year: number): number[] {
  const months = available.find((period) => period.year === year)?.months ?? [];
  return [...months].sort((left, right) => left - right);
}

export function monthLabel(month: number): string {
  return capitalize(monthNameFormat.format(monthDate(month)));
}

function latestMonthOf(available: readonly AvailablePeriod[], year: number): number {
  return monthsOf(available, year).at(-1) ?? FIRST_MONTH;
}

function historySelection(available: readonly AvailablePeriod[]): PeriodSelection | null {
  const years = yearsOf(available);
  const firstYear = years.at(-1);
  const lastYear = years[0];
  if (firstYear === undefined || lastYear === undefined) return null;
  const firstMonth = monthsOf(available, firstYear)[0] ?? FIRST_MONTH;
  return { granularity: 'history', from: monthKey(firstYear, firstMonth), to: monthKey(lastYear, latestMonthOf(available, lastYear)) };
}

function windowRange(window: HistoryWindow, latestDate: string): DateRange {
  if (window.unit === 'day') return { from: addDays(latestDate, 1 - window.length), to: latestDate };
  const [year, month] = splitMonthKey(latestDate.slice(0, MONTH_KEY_LENGTH));
  const [firstYear, firstMonth] = shiftMonth(year, month, 1 - window.length);
  return { from: `${monthKey(firstYear, firstMonth)}-01`, to: `${monthKey(year, month)}-${pad(lastDayOfMonth(year, month))}` };
}

function windowAxis(selection: WindowSelection): PeriodAxis {
  if (selection.window.unit === 'day') {
    const keys = daysBetween(selection.from, selection.to);
    return { keys, labels: keys.map(dayMonthLabel) };
  }
  const keys = monthKeysBetween(selection.from.slice(0, MONTH_KEY_LENGTH), selection.to.slice(0, MONTH_KEY_LENGTH));
  return { keys, labels: keys.map(historyLabel) };
}

function daysBetween(from: string, to: string): string[] {
  const count = Math.round((Date.parse(to) - Date.parse(from)) / MILLISECONDS_PER_DAY) + 1;
  return Array.from({ length: Math.max(count, 0) }, (_, index) => addDays(from, index));
}

function addDays(date: string, days: number): string {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, ISO_DATE_LENGTH);
}

function shiftMonth(year: number, month: number, offset: number): [number, number] {
  const index = year * MONTHS_IN_YEAR + month - FIRST_MONTH + offset;
  return [Math.floor(index / MONTHS_IN_YEAR), (index % MONTHS_IN_YEAR) + FIRST_MONTH];
}

function dayMonthLabel(key: string): string {
  const [, month = '', day = ''] = key.split('-');
  return `${day}/${month}`;
}

function monthKeysBetween(from: string, to: string): string[] {
  const [fromYear, fromMonth] = splitMonthKey(from);
  const [toYear, toMonth] = splitMonthKey(to);
  const count = (toYear - fromYear) * MONTHS_IN_YEAR + toMonth - fromMonth + 1;
  return Array.from({ length: Math.max(count, 0) }, (_, index) => {
    const offset = fromMonth - FIRST_MONTH + index;
    return monthKey(fromYear + Math.floor(offset / MONTHS_IN_YEAR), (offset % MONTHS_IN_YEAR) + FIRST_MONTH);
  });
}

function historyLabel(key: string): string {
  const [year, month] = splitMonthKey(key);
  return `${monthShortLabel(month)}/${String(year).slice(-SHORT_YEAR_LENGTH)}`;
}

function monthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

function splitMonthKey(key: string): [number, number] {
  const [year = 0, month = FIRST_MONTH] = key.split('-').map(Number);
  return [year, month];
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function sequence(length: number): number[] {
  return Array.from({ length }, (_, index) => index + 1);
}

function monthDate(month: number): Date {
  return new Date(Date.UTC(REFERENCE_YEAR, month - 1, 1));
}

function capitalize(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function pad(value: number): string {
  return String(value).padStart(DATE_PART_LENGTH, '0');
}

export function periodAxis(selection: PeriodSelection): PeriodAxis {
  if (selection.granularity === 'window') return windowAxis(selection);
  if (selection.granularity === 'history') {
    const keys = monthKeysBetween(selection.from, selection.to);
    return { keys, labels: keys.map(historyLabel) };
  }
  if (selection.granularity === 'year') {
    const months = sequence(MONTHS_IN_YEAR);
    return { keys: months.map((month) => monthKey(selection.year, month)), labels: months.map(monthShortLabel) };
  }
  const days = sequence(lastDayOfMonth(selection.year, selection.month));
  return { keys: days.map((day) => `${selection.year}-${pad(selection.month)}-${pad(day)}`), labels: days.map(String) };
}

export function monthShortLabel(month: number): string {
  return capitalize(monthShortFormat.format(monthDate(month)).replace('.', ''));
}
