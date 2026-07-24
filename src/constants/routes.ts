export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  BECOME_DRIVER: '/become-driver',
  FIND_RIDE: '/find-ride',
  DASHBOARD: '/dashboard',
  SELECT_ROLE: '/select-role',
  LOGIN: '/login',
  REGISTER_DRIVER: '/register/driver',
  REGISTER_PASSENGER: '/register/passenger',
  DRIVER_DASHBOARD: '/dashboard/driver',
  PASSENGER_DASHBOARD: '/dashboard/passenger',
  MAPS_DEMO: '/maps-demo',
} as const;

export type RouteKeys = keyof typeof ROUTES;
export type RouteValues = typeof ROUTES[RouteKeys];
