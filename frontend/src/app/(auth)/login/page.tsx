import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Sign in' };
// Auth pages read URL search params (?next=…) and use Google Identity
// Services at runtime — neither benefits from static pre-render.
export const dynamic = 'force-dynamic';

export default function LoginPage(): JSX.Element {
  return (
    <AuthShell variant="login">
      <LoginForm />
    </AuthShell>
  );
}
