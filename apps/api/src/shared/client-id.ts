import { InvalidValueError } from './errors/invalid-value-error';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class ClientId {
  private constructor(readonly value: string) {}

  static fromString(value: string | undefined): ClientId {
    const normalized = (value ?? '').trim().toLowerCase();
    if (!UUID_V4_PATTERN.test(normalized)) {
      throw new InvalidValueError(`Invalid client id '${value ?? ''}', expected a UUID v4`);
    }
    return new ClientId(normalized);
  }

  toString(): string {
    return this.value;
  }
}
