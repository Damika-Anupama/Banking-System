import { DEMO_PROFILES, seedDemoSession } from './demo-session';

describe('seedDemoSession', () => {
  beforeEach(() => localStorage.clear());

  it('stores the session keys and returns the role route', () => {
    const route = seedDemoSession('CUSTOMER');

    expect(route).toBe('/dashboard/home');
    expect(localStorage.getItem('demoMode')).toBe('true');
    expect(localStorage.getItem('userType')).toBe('CUSTOMER');
    expect(localStorage.getItem('email')).toBe(DEMO_PROFILES.CUSTOMER.email);
  });

  it('routes each role to its own dashboard', () => {
    expect(seedDemoSession('EMPLOYEE')).toBe('/employee-dashboard/employee-home');
    expect(seedDemoSession('MANAGER')).toBe('/manager-dashboard/manager-home');
  });

  it('accepts a custom email for credential-style entry', () => {
    seedDemoSession('CUSTOMER', 'amara.perera@example.com');
    expect(localStorage.getItem('email')).toBe('amara.perera@example.com');
  });

  it('writes a decodable JWT-shaped demo token carrying the role', () => {
    seedDemoSession('MANAGER');
    const token = String(localStorage.getItem('token'));
    const [, payload] = token.split('.');
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    expect(claims.role).toBe('MANAGER');
    expect(claims.sub).toBe('demo-manager');
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
  });
});
