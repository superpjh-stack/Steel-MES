'use client';

import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-fade-in flex-1 overflow-y-auto p-3 lg:p-5">
      {children}
    </div>
  );
}
