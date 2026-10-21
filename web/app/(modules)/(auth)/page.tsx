import AuthGate from '@/app/auth/AuthGate';
import AuthPage from '@/app/(modules)/(auth)/components/AuthPage';

export default function SignIn() {
  return (
    <AuthGate signedIn={false}>
      <AuthPage />
    </AuthGate>
  );
}
