'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Factory, Eye, EyeOff, Zap, Shield, User } from 'lucide-react';

// ─── 빠른 로그인 3종 ──────────────────────────────────────────────────────────

const QUICK_LOGINS = [
  {
    label:    'Admin',
    sublabel: '시스템 관리자',
    username: 'admin',
    password: 'admin1234!',
    icon:     Shield,
    gradient: 'from-red-500 to-rose-600',
    ring:     'ring-red-400',
    badge:    'bg-red-500/20 text-red-300 border-red-500/30',
  },
  {
    label:    '관리자',
    sublabel: '생산 관리자',
    username: 'manager1',
    password: 'mgr1234!',
    icon:     Zap,
    gradient: 'from-violet-500 to-purple-600',
    ring:     'ring-violet-400',
    badge:    'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
  {
    label:    '작업자',
    sublabel: '현장 작업자',
    username: 'operator1',
    password: 'oper1234!',
    icon:     User,
    gradient: 'from-blue-500 to-cyan-600',
    ring:     'ring-blue-400',
    badge:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
];

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const doLogin = async (u: string, p: string, quickKey?: string) => {
    setLoading(true);
    setError('');
    if (quickKey) setActiveQuick(quickKey);

    const result = await signIn('credentials', {
      username: u,
      password: p,
      redirect: false,
    });

    if (result?.error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      setActiveQuick(null);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(username, password);
  };

  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* ── 왼쪽 브랜딩 패널 (lg 이상) ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c1445 100%)',
        }}
      >
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute top-1/2 -right-48 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 w-64 h-64 rounded-full bg-cyan-500/8 blur-3xl" />
          {/* 그리드 패턴 */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* 로고 */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Factory size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">Metal-MES</span>
            <span className="block text-blue-400/60 text-xs">Manufacturing Execution System</span>
          </div>
        </div>

        {/* 메인 카피 */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-blue-400 text-sm font-medium tracking-widest uppercase mb-4">
              Smart Factory Solution
            </p>
            <h2 className="text-4xl font-bold text-white leading-tight">
              자동차 부품산업의<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                스마트 실행
              </span>
            </h2>
            <p className="text-slate-400 text-base mt-4 leading-relaxed max-w-xs">
              생산 계획부터 품질 관리, 설비 모니터링까지 — 현장의 모든 데이터를 하나의 시스템으로.
            </p>
          </div>

          {/* 기능 하이라이트 */}
          <ul className="space-y-3">
            {[
              { dot: 'bg-blue-500',   text: '실시간 생산 모니터링 & KPI 대시보드' },
              { dot: 'bg-violet-500', text: '바코드·PLC 인터페이스 연동 관리' },
              { dot: 'bg-cyan-500',   text: '품질 검사 · NCR · SPC 통합 관리' },
            ].map(({ dot, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                <span className="text-slate-300 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 하단 */}
        <div className="relative z-10">
          <p className="text-slate-600 text-xs">© 2026 Metal-MES. All rights reserved.</p>
        </div>
      </div>

      {/* ── 오른쪽 로그인 패널 ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 bg-slate-900">

        {/* 모바일 로고 */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Factory size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg">Metal-MES</span>
            <span className="block text-slate-400 text-xs">Manufacturing Execution System</span>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* 타이틀 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">로그인</h1>
            <p className="text-slate-400 text-sm">계정 정보를 입력하거나 빠른 로그인을 선택하세요.</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-slate-300 mb-1.5">
                아이디
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
                aria-required="true"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 에러 */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 disabled:cursor-not-allowed mt-2"
            >
              {loading && !activeQuick ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </form>

          {/* 빠른 로그인 */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-700/80" />
              <span className="text-slate-500 text-xs font-medium tracking-wide uppercase">빠른 로그인</span>
              <div className="flex-1 h-px bg-slate-700/80" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {QUICK_LOGINS.map(({ label, sublabel, username: u, password: p, icon: Icon, gradient, ring, badge }) => {
                const isActive = activeQuick === u && loading;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => { setUsername(u); setPassword(p); doLogin(u, p, u); }}
                    disabled={loading}
                    className={`
                      relative group flex flex-col items-center gap-2 p-3.5 rounded-xl
                      bg-slate-800 border border-slate-700/60
                      hover:border-slate-500 hover:bg-slate-750
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isActive ? `ring-2 ${ring}` : ''}
                    `}
                  >
                    {/* 아이콘 */}
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}>
                      {isActive ? (
                        <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : (
                        <Icon size={16} className="text-white" />
                      )}
                    </div>
                    {/* 레이블 */}
                    <div className="text-center">
                      <p className="text-white text-xs font-semibold leading-tight">{label}</p>
                      <p className="text-slate-500 text-[10px] leading-tight mt-0.5">{sublabel}</p>
                    </div>
                    {/* 역할 뱃지 */}
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${badge}`}>
                      {u}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 계정 정보 힌트 */}
          <p className="text-slate-600 text-[11px] text-center mt-6">
            데모 계정 비밀번호: admin1234! · mgr1234! · oper1234!
          </p>
        </div>
      </div>
    </div>
  );
}
