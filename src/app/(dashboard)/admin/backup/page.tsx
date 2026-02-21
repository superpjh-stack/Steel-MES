import { auth } from '@/auth';
import { HardDrive, Info } from 'lucide-react';

// 백업 유형 정의
const BACKUP_TYPES = [
  {
    type:     '자동 일일 백업',
    schedule: '매일 오전 02:00',
    retain:   '7일',
    target:   'Cloud SQL PostgreSQL 자동 백업',
    color:    'border-l-4 border-blue-500',
  },
  {
    type:     '자동 주간 백업',
    schedule: '매주 일요일 03:00',
    retain:   '4주',
    target:   'Cloud SQL PostgreSQL 스냅샷',
    color:    'border-l-4 border-green-500',
  },
  {
    type:     '수동 백업',
    schedule: '관리자 수동 실행',
    retain:   '무제한',
    target:   'Cloud SQL 내보내기 (GCS)',
    color:    'border-l-4 border-orange-400',
  },
];

export default async function BackupPage() {
  await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">데이터 백업 이력</h1>
        <p className="text-sm text-slate-500 mt-0.5">시스템 데이터베이스 백업 수행 이력 및 상태 조회</p>
      </div>

      {/* 안내 배너 */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">백업 구성 안내</p>
          <p className="text-xs text-blue-600">
            니즈푸드 MES는 Google Cloud SQL (PostgreSQL) 기반으로 운영됩니다. 아래 백업 정책에 따라
            Cloud SQL 자동 백업이 수행되며, 수동 백업은 GCS(Google Cloud Storage) 내보내기로 실행됩니다.
            실제 백업 이력은 Cloud SQL 콘솔에서 확인할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 백업 정책 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {BACKUP_TYPES.map((b) => (
          <div key={b.type} className={`bg-white rounded-xl border border-slate-200 p-5 ${b.color}`}>
            <div className="flex items-center gap-2 mb-3">
              <HardDrive size={15} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">{b.type}</span>
            </div>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">스케줄</dt>
                <dd className="text-slate-700 font-medium">{b.schedule}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">보존 기간</dt>
                <dd className="text-slate-700 font-medium">{b.retain}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">대상</dt>
                <dd className="text-slate-700 font-medium text-right max-w-[160px]">{b.target}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* 백업 이력 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">백업 수행 이력</h2>
        </div>
        <table className="w-full text-sm">
          <caption className="sr-only">데이터 백업 이력</caption>
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">수행 일시</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">유형</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">파일명</th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">크기</th>
              <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">결과</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="py-16 text-center text-slate-400">
                <HardDrive size={32} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm mb-1">백업 이력이 없습니다.</p>
                <p className="text-xs text-slate-300">운영 환경에서 백업이 수행되면 이력이 기록됩니다.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
