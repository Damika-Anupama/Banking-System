export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  title: string;
}

export interface DashboardConfig {
  dashboardType: 'customer' | 'employee' | 'manager';
  navigationItems: NavigationItem[];
  logoRoute: string;
}
