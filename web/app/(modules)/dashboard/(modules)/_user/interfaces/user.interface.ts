import {
  EActivityLevel,
  ECalorieTarget,
  EMacroPlan,
  ESex,
} from '@/app/(modules)/dashboard/(modules)/_user/enums';

export interface IPersonalInformation {
  userName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  /** A calendar date, `YYYY-MM-DD`. */
  dateOfBirth?: string;
}

export interface ISocialProfiles {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

/** Metric, as currently recorded; any field may be unset. */
export interface IBodyStats {
  sex: ESex | null;
  heightCm: number | null;
  weightKg: number | null;
  neckCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  activityLevel: EActivityLevel | null;
}

/** What the User aims for; unset means Maintenance and Balanced. */
export interface ITargets {
  calorieTarget: ECalorieTarget | null;
  macroPlan: EMacroPlan | null;
}

export interface IUser {
  id: string;
  email: string;
  /** Whether the User has completed Email verification. */
  emailVerified?: boolean;
  /** False for a User who only signs in with Google; they can't change email. */
  hasPassword?: boolean;
  personalInformation?: IPersonalInformation;
  socialProfiles?: ISocialProfiles;
  bodyStats?: IBodyStats;
  targets?: ITargets;
  avatarUrl?: string | null;
}

/** A partial update of the User's Profile, as sent to the backend. */
export interface IUserChange {
  personalInformation?: IPersonalInformation;
  socialProfiles?: ISocialProfiles;
  bodyStats?: Partial<IBodyStats>;
  targets?: Partial<ITargets>;
}
