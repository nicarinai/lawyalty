import { Form, Link, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/admin.users.$id';
import { getSessionUser, audit } from '../lib/server/auth';
import { readSessionCookie } from '../lib/server/session';
import { Q, type UserRow, type UserRole } from '../lib/server/db';

const ROLES: UserRole[] = ['admin', 'lawyer', 'broker', 'architect', 'user'];

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  const me = await getSessionUser(env.DB, token);
  if (!me) return redirect('/login');
  if (me.role !== 'admin') throw new Response('Forbidden', { status: 403 });
  const target = await env.DB.prepare(Q.selectUserById).bind(params.id).first<UserRow>();
  if (!target) throw new Response('Not found', { status: 404 });
  return { target };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const token = readSessionCookie(request.headers.get('Cookie'));
  const me = await getSessionUser(env.DB, token);
  if (!me || me.role !== 'admin') throw new Response('Forbidden', { status: 403 });

  const form = await request.formData();
  const op = String(form.get('op'));
  const now = Date.now();
  const id = params.id;

  if (op === 'approve') {
    await env.DB.prepare(Q.updateUserStatus).bind('active', now, id).run();
    await audit(env.DB, {
      user_id: me.id, action: 'admin.approve', target_type: 'user', target_id: id,
    });
  } else if (op === 'suspend') {
    await env.DB.prepare(Q.updateUserStatus).bind('suspended', now, id).run();
    await env.DB
      .prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`)
      .bind(now, id).run();
    await audit(env.DB, {
      user_id: me.id, action: 'admin.suspend', target_type: 'user', target_id: id,
    });
  } else if (op === 'reactivate') {
    await env.DB.prepare(Q.updateUserStatus).bind('active', now, id).run();
    await audit(env.DB, {
      user_id: me.id, action: 'admin.reactivate', target_type: 'user', target_id: id,
    });
  } else if (op === 'role') {
    const role = String(form.get('role')) as UserRole;
    if (!ROLES.includes(role)) throw new Response('Bad role', { status: 400 });
    await env.DB.prepare(Q.updateUserRole).bind(role, now, id).run();
    await audit(env.DB, {
      user_id: me.id, action: 'admin.role', target_type: 'user', target_id: id,
      metadata: JSON.stringify({ role }),
    });
  }
  return redirect(`/admin/users/${id}`);
}

export default function AdminUser({ loaderData }: Route.ComponentProps) {
  const u = loaderData.target;
  const nav = useNavigation();
  const busy = nav.state !== 'idle';
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <Link to="/admin" className="text-sm underline text-ink-500">← 목록</Link>
      <h1 className="text-2xl font-semibold">
        {u.name} <span className="text-ink-400 text-base">{u.email}</span>
      </h1>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="text-ink-500">상태</dt><dd>{u.status}</dd>
        <dt className="text-ink-500">직무</dt><dd>{u.role}</dd>
        <dt className="text-ink-500">소속</dt><dd>{u.organization ?? '-'}</dd>
        <dt className="text-ink-500">자격번호</dt><dd>{u.license_number ?? '-'}</dd>
        <dt className="text-ink-500">이메일 인증</dt><dd>{u.email_verified_at ? '✓' : '-'}</dd>
      </dl>
      <div className="flex gap-2">
        {u.status === 'pending' && (
          <Form method="post">
            <input type="hidden" name="op" value="approve" />
            <button disabled={busy} className="px-4 py-2 bg-ink-700 text-white rounded">
              승인
            </button>
          </Form>
        )}
        {u.status === 'active' && (
          <Form method="post">
            <input type="hidden" name="op" value="suspend" />
            <button disabled={busy} className="px-4 py-2 bg-red-600 text-white rounded">
              정지
            </button>
          </Form>
        )}
        {u.status === 'suspended' && (
          <Form method="post">
            <input type="hidden" name="op" value="reactivate" />
            <button disabled={busy} className="px-4 py-2 bg-ink-700 text-white rounded">
              재활성화
            </button>
          </Form>
        )}
      </div>
      <Form method="post" className="flex gap-2 items-end">
        <input type="hidden" name="op" value="role" />
        <label className="text-sm">
          role 변경
          <select
            name="role"
            defaultValue={u.role}
            className="ml-2 border rounded px-2 py-1"
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <button disabled={busy} className="px-3 py-1.5 border rounded">저장</button>
      </Form>
    </div>
  );
}
