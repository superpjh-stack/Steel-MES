import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user as { name?: string; role?: string };
  const role = user.role ?? 'viewer';
  const name = user.name ?? '';

  return (
    <DashboardShell userName={name} role={role}>
      {children}
    </DashboardShell>
  );
}
