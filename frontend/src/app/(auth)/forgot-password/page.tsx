import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata = { title: 'Reset password' };
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage(): JSX.Element {
  return (
    <AuthShell variant="reset">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
