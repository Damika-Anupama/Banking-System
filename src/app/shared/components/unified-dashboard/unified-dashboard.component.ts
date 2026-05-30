import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { ThemeService } from '../../../service/theme.service';
import { DashboardConfig, NavigationItem } from '../../models/navigation-config.model';

@Component({
  selector: 'app-unified-dashboard',
  standalone: false,
  templateUrl: './unified-dashboard.component.html',
  styleUrls: ['./unified-dashboard.component.scss']
})
export class UnifiedDashboardComponent implements OnInit {
  isSidebarOpen = false;
  isDarkMode$!: Observable<boolean>;
  config!: DashboardConfig;
  navigationItems: NavigationItem[] = [];
  currentYear = new Date().getFullYear();
  notifications: any[] = [];
  unreadCount = 0;

  private notificationsByRole: Record<string, any[]> = {
    customer: [
      { icon: 'fa-arrow-down', tone: 'emerald', title: 'Salary credited', detail: 'Rs. 185,000 received into ****2810', time: '2h ago' },
      { icon: 'fa-calendar-day', tone: 'amber', title: 'Standing order due soon', detail: 'Apartment Lease · Rs. 95,000 on Jun 1', time: '1d ago' },
      { icon: 'fa-shield-halved', tone: 'cyan', title: 'New device sign-in', detail: 'Login alert from Colombo, LK', time: '2d ago' },
    ],
    employee: [
      { icon: 'fa-user-plus', tone: 'cyan', title: 'Onboarding pending', detail: 'Ishan Jayawardena needs account setup', time: '3h ago' },
      { icon: 'fa-file-invoice-dollar', tone: 'amber', title: 'Loan follow-up', detail: 'Nuwan Silva loan review outstanding', time: '1d ago' },
    ],
    manager: [
      { icon: 'fa-file-signature', tone: 'amber', title: 'Loans awaiting approval', detail: 'Applications pending in your queue', time: '1h ago' },
      { icon: 'fa-triangle-exclamation', tone: 'rose', title: 'Overdue installments', detail: 'Several installments past due', time: '1d ago' },
    ],
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.isDarkMode$ = this.themeService.isDarkMode$;

    // Get configuration from route data
    this.route.data.subscribe(data => {
      this.config = data['config'] as DashboardConfig;
      this.navigationItems = this.config.navigationItems;
      this.notifications = this.notificationsByRole[this.config.dashboardType] || [];
      this.unreadCount = this.notifications.length;
    });
  }

  openNotifications(): void {
    const toneColor: Record<string, string> = {
      emerald: '#34d399', amber: '#fbbf24', cyan: '#22d3ee', rose: '#fb7185', blue: '#60a5fa',
    };
    const items = this.notifications.length
      ? this.notifications.map(n => `
          <div style="display:flex;gap:0.75rem;align-items:flex-start;padding:0.65rem 0;border-bottom:1px solid rgba(148,163,184,0.14);text-align:left">
            <i class="fas ${n.icon}" style="color:${toneColor[n.tone] || '#94a3b8'};margin-top:0.2rem"></i>
            <div style="flex:1">
              <div style="color:#f8fafc;font-weight:600;font-size:0.9rem">${n.title}</div>
              <div style="color:#cbd5e1;font-size:0.8rem">${n.detail}</div>
            </div>
            <span style="color:#94a3b8;font-size:0.7rem;white-space:nowrap">${n.time}</span>
          </div>`).join('')
      : '<p style="color:#cbd5e1">You have no notifications.</p>';

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: 'Notifications',
      html: `<div>${items}</div>`,
      confirmButtonText: 'Mark all as read'
    }).then(() => { this.unreadCount = 0; });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  isSmallScreen(): boolean {
    return window.innerWidth < 768;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  exit() {
    // Save theme preference before clearing localStorage
    const currentTheme = localStorage.getItem('theme');

    // Clear all localStorage except theme
    localStorage.clear();

    // Restore theme preference
    if (currentTheme) {
      localStorage.setItem('theme', currentTheme);
    }

    this.router.navigate(['/welcome']);
  }

  // Check if this is customer dashboard (different layout)
  isCustomerDashboard(): boolean {
    return this.config.dashboardType === 'customer';
  }

  getSettingsRoute(): string {
    if (this.config.dashboardType === 'customer') {
      return './settings';
    }

    return this.config.dashboardType === 'employee' ? './employee-settings' : './manager-settings';
  }
}
