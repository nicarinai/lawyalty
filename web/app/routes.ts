import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('signup', 'routes/signup.tsx'),
  route('logout', 'routes/logout.tsx'),
  route('auth/pending', 'routes/auth.pending.tsx'),
  route('auth/reset', 'routes/auth.reset.tsx'),
  route('auth/reset/confirm', 'routes/auth.reset.confirm.tsx'),
  route('auth/verify', 'routes/auth.verify.tsx'),
  route('auth/me', 'routes/auth.me.tsx'),
  route('admin', 'routes/admin._index.tsx'),
  route('admin/users/:id', 'routes/admin.users.$id.tsx'),
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
