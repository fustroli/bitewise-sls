import { ISignIn } from '@/app/(modules)/(auth)/interfaces/sign-in.interface';

export interface ISignUp extends ISignIn {
  confirmPassword: string;
}
