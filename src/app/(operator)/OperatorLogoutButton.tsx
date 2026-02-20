'use client';

import { signOut } from 'next-auth/react';

export default function OperatorLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-gray-400 hover:text-white text-sm"
    >
      로그아웃
    </button>
  );
}
