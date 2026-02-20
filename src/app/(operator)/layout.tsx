import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import OperatorLogoutButton from './OperatorLogoutButton';

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <header className="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-lg">MES 현장 입력</span>
          <span className="ml-3 text-gray-400 text-sm">{session.user?.name}</span>
        </div>
        <OperatorLogoutButton />
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
