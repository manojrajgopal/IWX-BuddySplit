import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage(): JSX.Element {
  return (
    <AuthShell variant="login">
      <LoginForm />
    </AuthShell>
  );
}
