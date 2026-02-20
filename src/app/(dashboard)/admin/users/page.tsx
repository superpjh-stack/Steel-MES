'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';

type Role = 'admin' | 'manager' | 'supervisor' | 'operator' | 'qc' | 'viewer';
interface User { id: string; email: string; name: string; role: Role; department: string | null; shift: string | null; isActive: boolean; lastLoginAt: string | null; }

const ROLE_LABEL: Record<Role, string> = {
  admin: '시스템관리자', manager: '관리자', supervisor: '감독자',
  operator: '작업자', qc: '품질담당', viewer: '조회자',
};
const ROLES = Object.keys(ROLE_LABEL) as Role[];

const emptyForm = () => ({ email: '', name: '', password: '', role: 'operator' as Role, department: '', shift: '' });

export default function AdminUsersPage() {
  const [items,   setItems]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'create' | 'edit' | null>(null);
  const [target,  setTarget]  = useState<User | null>(null);
  const [form,    setForm]    = useState(emptyForm());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(emptyForm()); setError(''); setModal('create'); }
  function openEdit(u: User) {
    setTarget(u);
    setForm({ email: u.email, name: u.name, password: '', role: u.role, department: u.department ?? '', shift: u.shift ?? '' });
    setError(''); setModal('edit');
  }
  function close() { setModal(null); setTarget(null); }

  async function handleSave() {
    setSaving(true); setError('');
    const url    = modal === 'edit' ? `/api/admin/users/${target!.id}` : '/api/admin/users';
    const method = modal === 'edit' ? 'PUT' : 'POST';
    const body   = modal === 'edit'
      ? { name: form.name, role: form.role, department: form.department, shift: form.shift, ...(form.password ? { password: form.password } : {}) }
      : form;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const d = await res.json(); setError(d.error?.formErrors?.[0] ?? '저장 실패'); setSaving(false); return; }
    await load(); close(); setSaving(false);
  }

  async function toggleActive(u: User) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    await load();
  }

  function setF<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">사용자 관리</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">
          <Plus size={15} /> 사용자 등록
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['이름', '이메일', '역할', '부서', '교대', '상태', '최근 로그인', '관리'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : items.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2.5 font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{ROLE_LABEL[u.role]}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-500">{u.department ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-500">{u.shift ?? '-'}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-'}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="수정"><Pencil size={14} /></button>
                    <button onClick={() => toggleActive(u)} className={`p-1.5 rounded ${u.isActive ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={u.isActive ? '비활성화' : '활성화'}>
                      {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={close} title={modal === 'edit' ? '사용자 수정' : '사용자 등록'}>
        <div className="space-y-3">
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}

          {modal === 'create' && (
            <>
              <Field label="이메일" required value={form.email} onChange={(v) => setF('email', v)} placeholder="예: user@mes.local" />
              <Field label="비밀번호" required type="password" value={form.password} onChange={(v) => setF('password', v)} />
            </>
          )}

          <Field label="이름" required value={form.name} onChange={(v) => setF('name', v)} />

          {modal === 'edit' && (
            <Field label="새 비밀번호 (변경 시만 입력)" type="password" value={form.password} onChange={(v) => setF('password', v)} placeholder="변경 안 할 경우 비워두세요" />
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">역할 <span className="text-red-500">*</span></label>
            <select value={form.role} onChange={(e) => setF('role', e.target.value as Role)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>

          <Field label="부서" value={form.department} onChange={(v) => setF('department', v)} placeholder="예: 생산1팀" />
          <Field label="교대" value={form.shift} onChange={(v) => setF('shift', v)} placeholder="예: 1st / 2nd" />

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, type = 'text' }:
  { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
