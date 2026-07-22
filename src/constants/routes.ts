export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  BECOME_DRIVER: '/become-driver',
  FIND_RIDE: '/find-ride',
  DASHBOARD: '/dashboard',
} as const;

export type RouteKeys = keyof typeof ROUTES;
export type RouteValues = typeof ROUTES[RouteKeys];
