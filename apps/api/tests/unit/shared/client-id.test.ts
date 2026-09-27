import { ClientId } from '../../../src/shared/client-id';
import { InvalidValueError } from '../../../src/shared/errors/invalid-value-error';

describe('ClientId', () => {
  it('should keep a UUID v4 in lowercase when the browser sends one', () => {
    expect(ClientId.fromString('F47AC10B-58CC-4372-A567-0E02B2C3D479').value).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['not a UUID', 'not-a-uuid'],
    ['a UUID of another version', 'a8098c1a-f86e-11da-bd1a-00112444be1e'],
  ])('should throw InvalidValueError asking for a UUID v4 when the value is %s', (_case, value) => {
    const parse = (): unknown => ClientId.fromString(value);

    expect(parse).toThrow(InvalidValueError);
    expect(parse).toThrow(/UUID v4/);
  });
});
