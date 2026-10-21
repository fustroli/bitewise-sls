import { describe, expect, it } from 'vitest';

import { avatarInitials } from './avatar-initials.helpers';

describe('avatarInitials', () => {
  it("capitalises the username's first two characters", () => {
    expect(
      avatarInitials({
        email: 'jane@example.com',
        personalInformation: { userName: 'roland' },
      }),
    ).toBe('RO');
  });

  it.each([
    ['unset', undefined],
    ['blank', '  '],
  ])("uses the email's local part when the username is %s", (_, userName) => {
    expect(
      avatarInitials({
        email: 'jane@example.com',
        personalInformation: { userName },
      }),
    ).toBe('JA');
  });

  it('keeps a one-character username', () => {
    expect(
      avatarInitials({
        email: 'a@b.c',
        personalInformation: { userName: 'x' },
      }),
    ).toBe('X');
  });
});
