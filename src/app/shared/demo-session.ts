import { demoStore } from './demo-store';

/**
 * Seeding for the no-sign-in demo sessions.
 *
 * Extracted from the sign-in component so the welcome page can offer the same
 * one-click role launchers: the token shape, the localStorage keys, and the
 * "reset to fresh fixtures" rule must stay identical no matter which screen
 * starts the demo.
 */
export type DemoRole = 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER';

export const DEMO_PROFILES: Record<DemoRole, { name: string; email: string; route: string }> = {
  CUSTOMER: { name: 'Amara Perera', email: 'customer@banking-system.app', route: '/dashboard/home' },
  EMPLOYEE: { name: 'Branch Employee', email: 'employee@banking-system.app', route: '/employee-dashboard/employee-home' },
  MANAGER: { name: 'Branch Manager', email: 'manager@banking-system.app', route: '/manager-dashboard/manager-home' },
};

/**
 * Seeds a demo session for the role and returns the route to open.
 *
 * `displayName` lets sign-up carry the name the user just typed into the
 * shell; the role launchers fall back to the seeded persona, so the sidebar
 * and the Settings page always agree on who is signed in.
 */
export function seedDemoSession(
  role: DemoRole,
  email: string = DEMO_PROFILES[role].email,
  displayName: string = DEMO_PROFILES[role].name
): string {
  localStorage.setItem('demoMode', 'true');
  localStorage.setItem('token', createDemoToken(role));
  localStorage.setItem('email', email);
  localStorage.setItem('userType', role);
  localStorage.setItem('displayName', displayName);
  // Start each demo walkthrough from fresh seed data.
  demoStore.reset();
  return DEMO_PROFILES[role].route;
}

function createDemoToken(role: DemoRole): string {
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlEncode({
    sub: `demo-${role.toLowerCase()}`,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });

  return `${header}.${payload}.ZGVtby1zaWduYXR1cmU`;
}

function base64UrlEncode(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
