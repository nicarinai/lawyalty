import { Link, redirect, useSearchParams } from 'react-router';
import type { Route } from './+types/admin._index';
import { getSessionUser } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';
import { Q, type UserRow } from '../lib/server/db';

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  const me = await getSessionUser(env.DB, token);
  if (!me) return redirect('/login');
  if (me.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const rows = await env.DB.prepare(Q.listUsersByStatus).bind(status).all<UserRow>();
  return { users: rows.results ?? [], status };
}

export default function AdminIndex({ loaderData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  const active = params.get('status') ?? '';
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">사용자 관리</h1>
      <nav className="flex gap-2 mb-6 text-sm">
        {[
          { value: '', label: '전체' },
          { value: 'pending', label: '승인 대기' },
          { value: 'active', label: '활성' },
          { value: 'suspended', label: '정지' },
        ].map((s) => (
          <Link
            key={s.value || 'all'}
            to={s.value ? `?status=${s.value}` : '/admin'}
            className={`px-3 py-1.5 rounded ${
              active === s.value ? 'bg-ink-700 text-white' : 'bg-silver-100 text-ink-600'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-500">
            <th className="py-2">이메일</th>
            <th>이름</th>
            <th>직무</th>
            <th>상태</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.users.map((u) => (
            <tr key={u.id} className="border-t border-silver-200">
              <td className="py-2">{u.email}</td>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                <Link to={`/admin/users/${u.id}`} className="text-ink-700 underline">
                  관리
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
