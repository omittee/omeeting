import type { RouteConfig } from '@react-router/dev/routes'
import { index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('auth', 'routes/auth.tsx'),
  route('room', 'routes/room.tsx'),
] satisfies RouteConfig
