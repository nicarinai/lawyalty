import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('signup', 'routes/signup.tsx'),
  route('logout', 'routes/logout.tsx'),
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
