import { CalendarDate } from '../../shared/calendar-date';
import { InvalidValueError } from '../../shared/errors/invalid-value-error';
import type { CalendarRange } from './sync.types';

const FROM_OPTION = '--from';
const TO_OPTION = '--to';

export function parseBackfillArguments(argv: readonly string[], today: CalendarDate): CalendarRange {
  const from = CalendarDate.fromIso(requiredOption(argv, FROM_OPTION));
  const toValue = optionValue(argv, TO_OPTION);
  const to = toValue === undefined ? today : CalendarDate.fromIso(toValue);
  if (today.isBefore(from)) {
    throw new InvalidValueError(`${FROM_OPTION} (${from.toString()}) must not be in the future`);
  }
  if (to.isBefore(from)) {
    throw new InvalidValueError(`${FROM_OPTION} (${from.toString()}) must not be after ${TO_OPTION} (${to.toString()})`);
  }
  return { from, to };
}

function optionValue(argv: readonly string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

function requiredOption(argv: readonly string[], name: string): string {
  const value = optionValue(argv, name);
  if (value === undefined) {
    throw new InvalidValueError(`Option ${name} YYYY-MM-DD is required`);
  }
  return value;
}
