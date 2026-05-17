import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from './RegisterForm';

export const metadata = { title: 'Create your account' };

export default function RegisterPage(): JSX.Element {
  return (
    <AuthShell variant="register">
      <RegisterForm />
    </AuthShell>
  );
}
