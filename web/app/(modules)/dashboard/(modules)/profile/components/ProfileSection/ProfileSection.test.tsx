// @vitest-environment jsdom

import {
  EActivityLevel,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import BasicInfo from '@/app/(modules)/dashboard/(modules)/profile/components/Profile/BasicInfo';
import BodyStats from '@/app/(modules)/dashboard/(modules)/profile/components/Profile/BodyStats';
import { IUser } from '@/app/(modules)/dashboard/(modules)/_user/interfaces';
import { IUserActions } from '@/app/(modules)/dashboard/(modules)/_user/context';
import { ME_KEY } from '@/app/(modules)/dashboard/(modules)/_user/queries';
import { ReactNode } from 'react';
import SocialProfiles from '@/app/(modules)/dashboard/(modules)/profile/components/Profile/SocialProfiles';
import { TestQueryProvider } from '@/app/utils/testing/test-query-provider';
import { UserProvider } from '@/app/(modules)/dashboard/(modules)/_user/provider';
import { copy as en } from '@/app/copy';
import { toast } from '@/app/hooks/use-toast';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/hooks/use-toast', () => ({ toast: vi.fn() }));

const { common } = en;

const USER: IUser = {
  id: 'user-sub',
  email: 'user@example.com',
  socialProfiles: { facebook: 'https://facebook.com/original' },
};

const renderWithUser = (
  ui: ReactNode,
  user: IUser,
  updateUser: IUserActions['updateUser'],
) =>
  render(
    <TestQueryProvider seed={[[ME_KEY, user]]}>
      <UserProvider actions={{ updateUser }}>{ui}</UserProvider>
    </TestQueryProvider>,
  );

const facebookInput = () => screen.getAllByRole('textbox')[0];

describe('Profile section cycle', () => {
  beforeEach(() => {
    vi.mocked(toast).mockClear();
  });

  afterEach(cleanup);

  it('Cancel restores the original values', async () => {
    const user = userEvent.setup();
    renderWithUser(<SocialProfiles />, USER, vi.fn());

    await user.click(
      screen.getByRole('button', { name: en.profile.socialProfiles.edit }),
    );
    await user.clear(facebookInput());
    await user.type(facebookInput(), 'https://facebook.com/changed');
    await user.click(screen.getByRole('button', { name: common.cancel }));

    expect(screen.getByText('https://facebook.com/original')).toBeTruthy();

    await user.click(
      screen.getByRole('button', { name: en.profile.socialProfiles.edit }),
    );
    expect((facebookInput() as HTMLInputElement).value).toBe(
      'https://facebook.com/original',
    );
  });

  it('a failure stays in edit mode and shows the message', async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      message: 'Backend says no',
    });
    renderWithUser(<SocialProfiles />, USER, updateUser);

    await user.click(
      screen.getByRole('button', { name: en.profile.socialProfiles.edit }),
    );
    await user.clear(facebookInput());
    await user.type(facebookInput(), 'https://facebook.com/changed');
    await user.click(screen.getByRole('button', { name: common.save }));

    expect(toast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Backend says no',
    });
    expect(screen.getByRole('button', { name: common.save })).toBeTruthy();
    expect((facebookInput() as HTMLInputElement).value).toBe(
      'https://facebook.com/changed',
    );
  });

  it('a success updates the User and leaves edit mode', async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        ...USER,
        socialProfiles: { facebook: 'https://facebook.com/changed' },
      },
    });
    renderWithUser(<SocialProfiles />, USER, updateUser);

    await user.click(
      screen.getByRole('button', { name: en.profile.socialProfiles.edit }),
    );
    await user.clear(facebookInput());
    await user.type(facebookInput(), 'https://facebook.com/changed');
    await user.click(screen.getByRole('button', { name: common.save }));

    expect(updateUser).toHaveBeenCalledWith({
      socialProfiles: {
        facebook: 'https://facebook.com/changed',
        twitter: '',
        instagram: '',
        linkedin: '',
      },
    });
    expect(toast).toHaveBeenCalledWith({
      variant: 'success',
      description: common.savedSuccessfully,
    });
    expect(screen.queryByRole('button', { name: common.save })).toBeNull();
    expect(screen.getByText('https://facebook.com/changed')).toBeTruthy();
  });
});

describe('Avatar', () => {
  afterEach(cleanup);

  it('cannot be changed until avatar uploads exist', () => {
    renderWithUser(<BasicInfo />, USER, vi.fn());

    expect(
      screen.getByRole<HTMLButtonElement>('button', {
        name: en.profile.basic.changePhoto,
      }).disabled,
    ).toBe(true);
    expect(screen.getByText(en.profile.basic.avatarSoon)).toBeTruthy();
  });
});

describe('Body stats', () => {
  const labels = en.profile.bodyStats;
  const BODY_USER: IUser = {
    ...USER,
    bodyStats: {
      sex: ESex.MALE,
      heightCm: 180,
      weightKg: 80.5,
      neckCm: 38,
      waistCm: 85.5,
      hipCm: null,
      activityLevel: EActivityLevel.MODERATE,
    },
  };
  const savedWith = (bodyStats: IUser['bodyStats']) =>
    vi.fn().mockResolvedValue({ ok: true, data: { ...BODY_USER, bodyStats } });

  const heightInput = () => screen.getAllByRole('spinbutton')[0];
  const weightInput = () => screen.getAllByRole('spinbutton')[1];
  const neckInput = () => screen.getAllByRole('spinbutton')[2];
  const waistInput = () => screen.getAllByRole('spinbutton')[3];
  const hipInput = () => screen.getAllByRole('spinbutton')[4];
  const sexSelect = () => screen.getAllByRole('combobox')[0];
  const activitySelect = () => screen.getAllByRole('combobox')[1];

  beforeEach(() => {
    vi.mocked(toast).mockClear();
    // Radix Select uses pointer capture and scrolling that jsdom lacks.
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.scrollIntoView = () => {};
  });

  afterEach(cleanup);

  it('reads numbers as entered and selects as their labels', () => {
    renderWithUser(<BodyStats />, BODY_USER, vi.fn());

    expect(screen.getByText(labels.sexes.MALE)).toBeTruthy();
    expect(screen.getByText('180 cm')).toBeTruthy();
    expect(screen.getByText('80.5 kg')).toBeTruthy();
    expect(screen.getByText('85.5 cm')).toBeTruthy();
    expect(screen.getByText(labels.hip)).toBeTruthy();
    // A man's empty hip isn't missing.
    expect(screen.getByText(labels.womenOnly)).toBeTruthy();
    expect(screen.getByText(labels.activityLevels.MODERATE)).toBeTruthy();
  });

  it('submits edited numbers and selects, and only those', async () => {
    const user = userEvent.setup();
    const updateUser = savedWith({
      ...BODY_USER.bodyStats!,
      sex: ESex.FEMALE,
      heightCm: 175,
    });
    renderWithUser(<BodyStats />, BODY_USER, updateUser);

    await user.click(
      screen.getByRole('button', { name: en.profile.bodyStats.edit }),
    );
    await user.clear(heightInput());
    await user.type(heightInput(), '175');
    await user.click(sexSelect());
    await user.click(screen.getByRole('option', { name: labels.sexes.FEMALE }));
    await user.click(screen.getByRole('button', { name: common.save }));

    expect(updateUser).toHaveBeenCalledWith({
      bodyStats: { sex: ESex.FEMALE, heightCm: 175 },
    });
    expect(screen.getByText(labels.sexes.FEMALE)).toBeTruthy();
    expect(screen.getByText('175 cm')).toBeTruthy();
  });

  it('submits an emptied number and a cleared select as null', async () => {
    const user = userEvent.setup();
    const updateUser = savedWith({
      ...BODY_USER.bodyStats!,
      weightKg: null,
      activityLevel: null,
    });
    renderWithUser(<BodyStats />, BODY_USER, updateUser);

    await user.click(
      screen.getByRole('button', { name: en.profile.bodyStats.edit }),
    );
    await user.clear(weightInput());
    await user.click(activitySelect());
    await user.click(screen.getByRole('option', { name: labels.notSet }));
    await user.click(screen.getByRole('button', { name: common.save }));

    expect(updateUser).toHaveBeenCalledWith({
      bodyStats: { weightKg: null, activityLevel: null },
    });
  });

  it('rejects an out-of-range number without saving', async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn();
    renderWithUser(<BodyStats />, BODY_USER, updateUser);

    await user.click(
      screen.getByRole('button', { name: en.profile.bodyStats.edit }),
    );
    await user.clear(heightInput());
    await user.type(heightInput(), '90');
    await user.click(screen.getByRole('button', { name: common.save }));

    expect(updateUser).not.toHaveBeenCalled();
    expect(
      screen.getByText('Height must be between 100 and 250 cm'),
    ).toBeTruthy();
  });

  it('saves measurements only once the waist is above the neck', async () => {
    const user = userEvent.setup();
    const updateUser = savedWith({
      ...BODY_USER.bodyStats!,
      neckCm: 45,
      hipCm: 98.5,
    });
    renderWithUser(<BodyStats />, BODY_USER, updateUser);

    await user.click(
      screen.getByRole('button', { name: en.profile.bodyStats.edit }),
    );
    await user.clear(neckInput());
    await user.type(neckInput(), '45');
    await user.clear(waistInput());
    await user.type(waistInput(), '45');
    await user.type(hipInput(), '98.5');
    await user.click(screen.getByRole('button', { name: common.save }));

    expect(updateUser).not.toHaveBeenCalled();
    expect(screen.getByText(en.validation.waistAboveNeck)).toBeTruthy();

    await user.clear(waistInput());
    await user.type(waistInput(), '85.5');
    await user.click(screen.getByRole('button', { name: common.save }));

    expect(updateUser).toHaveBeenCalledWith({
      bodyStats: { neckCm: 45, hipCm: 98.5 },
    });
  });
});
