import { ChangeDetectorRef, Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { ThemeService } from '../../../service/theme.service';
import { DashboardConfig, NavigationItem } from '../../models/navigation-config.model';
import { trapTabKey } from '../../focus-trap';

@Component({
  selector: 'app-unified-dashboard',
  standalone: false,
  templateUrl: './unified-dashboard.component.html',
  styleUrls: ['./unified-dashboard.component.scss']
})
export class UnifiedDashboardComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  isDarkMode$!: Observable<boolean>;
  config!: DashboardConfig;
  navigationItems: NavigationItem[] = [];
  currentYear = new Date().getFullYear();
  notifications: any[] = [];
  unreadCount = 0;
  notificationsRead = false;
  clockDisplay = '';
  showBackToTop = false;
  private scrollEl: HTMLElement | null = null;
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  onContentScroll(event: Event): void {
    this.scrollEl = event.target as HTMLElement;
    this.showBackToTop = this.scrollEl.scrollTop > 300;
  }

  scrollToTop(): void {
    this.scrollEl?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  focusMainContent(): void {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      main.scrollTo?.({ top: 0 });
    }
  }

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
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
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

    this.clockDisplay = this.formatClock();
    this.clockInterval = setInterval(() => {
      this.clockDisplay = this.formatClock();
      this.cdr.markForCheck();
    }, 1000);
  }

  /** Human name for the dashboard the user is inside. */
  get dashboardLabel(): string {
    const type = this.config?.dashboardType;
    if (type === 'employee') return 'Employee dashboard';
    if (type === 'manager') return 'Manager dashboard';
    return 'My accounts';
  }

  /**
   * Nav routes are declared relative ('./transaction'), while router.url is
   * absolute ('/dashboard/transaction'), so they are compared on their final
   * segment. Comparing them directly silently matched nothing, which left the
   * breadcrumb permanently hidden.
   */
  private routeSegment(route: string): string {
    return (route || '').replace(/^\.?\/+/, '').replace(/\/+$/, '');
  }

  /**
   * The nav item matching the current URL. Longest segment wins, so a nested
   * route does not resolve to a shorter sibling that happens to share a prefix.
   */
  get currentPageLabel(): string {
    const url = (this.router.url || '').split(/[?#]/)[0];

    const match = (this.navigationItems || [])
      .filter((item) => {
        const segment = this.routeSegment(item.route);
        return (
          !!segment && (url.endsWith(`/${segment}`) || url.includes(`/${segment}/`))
        );
      })
      .sort(
        (a, b) => this.routeSegment(b.route).length - this.routeSegment(a.route).length
      )[0];

    return match?.label ?? '';
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private formatClock(): string {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `${date} · ${time}`;
  }

  openNotifications(): void {
    const toneColor: Record<string, string> = {
      emerald: '#34d399', amber: '#fbbf24', cyan: '#22d3ee', rose: '#fb7185', blue: '#60a5fa',
    };
    const read = this.notificationsRead;
    const isLight = !document.documentElement.classList.contains('dark');

    // Theme-aware colours so the modal reads correctly in both light and dark mode.
    const titleColor = isLight ? '#0f172a' : '#f8fafc';
    const detailColor = isLight ? '#475569' : '#cbd5e1';
    const metaColor = isLight ? '#64748b' : '#94a3b8';
    const dividerColor = isLight ? 'rgba(15,23,42,0.10)' : 'rgba(148,163,184,0.14)';

    const caughtUpBanner = read
      ? `<div style="display:flex;align-items:center;gap:0.5rem;justify-content:center;margin-bottom:0.75rem;padding:0.5rem 0.75rem;border-radius:0.75rem;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);color:${isLight ? '#047857' : '#a7f3d0'};font-size:0.8rem;font-weight:600">
           <i class="fas fa-circle-check"></i> You're all caught up — no new notifications
         </div>`
      : '';

    const items = this.notifications.length
      ? this.notifications.map(n => `
          <div style="display:flex;gap:0.75rem;align-items:flex-start;padding:0.65rem 0;border-bottom:1px solid ${dividerColor};text-align:left;opacity:${read ? '0.65' : '1'}">
            <i class="fas ${n.icon}" style="color:${toneColor[n.tone] || metaColor};margin-top:0.2rem"></i>
            <div style="flex:1">
              <div style="color:${titleColor};font-weight:600;font-size:0.9rem">${n.title}</div>
              <div style="color:${detailColor};font-size:0.8rem">${n.detail}</div>
            </div>
            <span style="color:${metaColor};font-size:0.7rem;white-space:nowrap;display:flex;flex-direction:column;align-items:flex-end;gap:0.2rem">
              ${n.time}${read ? '<span style="color:#10b981"><i class="fas fa-check"></i> Read</span>' : ''}
            </span>
          </div>`).join('')
      : `<p style="color:${detailColor}">You have no notifications.</p>`;

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: 'Notifications',
      html: `${caughtUpBanner}<div>${items}</div>`,
      showCancelButton: !read && this.notifications.length > 0,
      confirmButtonText: read || this.notifications.length === 0 ? 'Close' : 'Mark all as read',
      cancelButtonText: 'Close'
    }).then((result) => {
      if (!read && this.notifications.length > 0 && result.isConfirmed) {
        this.unreadCount = 0;
        this.notificationsRead = true;
        this.cdr.detectChanges();
      }
    });
  }

  /** Whatever had focus before the drawer opened, so it can be handed back. */
  private sidebarOpener: HTMLElement | null = null;

  toggleSidebar() {
    if (this.isSidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar(): void {
    this.sidebarOpener = document.activeElement as HTMLElement | null;
    this.isSidebarOpen = true;

    // Move focus into the drawer, otherwise a keyboard user opens it and then
    // tabs through the page behind it.
    setTimeout(() => {
      const drawer = document.getElementById('mobile-sidebar');
      drawer?.querySelector<HTMLElement>('a, button')?.focus();
    }, 30);
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;

    const opener = this.sidebarOpener;
    this.sidebarOpener = null;
    if (opener && typeof opener.focus === 'function') {
      opener.focus();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onSidebarKeyDown(event: KeyboardEvent): void {
    if (!this.isSidebarOpen) return;

    // Escape closes the drawer: it covers the page, so there must be a way out
    // that does not require finding the close button by sight.
    if (event.key === 'Escape') {
      this.closeSidebar();
      return;
    }

    trapTabKey(event, document.getElementById('mobile-sidebar'));
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

  private getAbsoluteSettingsRoute(): string {
    switch (this.config?.dashboardType) {
      case 'employee': return '/employee-dashboard/employee-settings';
      case 'manager': return '/manager-dashboard/manager-settings';
      default: return '/dashboard/settings';
    }
  }

  get sessionUser(): { name: string; roleLabel: string; email: string; initials: string } {
    const role = this.config?.dashboardType || 'customer';
    const fallbackNames: Record<string, string> = {
      customer: 'Amara Perera',
      employee: 'Branch Employee',
      manager: 'Branch Manager',
    };
    // Whoever actually signed in — a sign-up stores the typed name, the role
    // launchers store the seeded persona — so the shell never contradicts the
    // identity shown on the Settings page.
    const name = localStorage.getItem('displayName') || fallbackNames[role] || 'User';
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const email = localStorage.getItem('email') || '';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return { name, roleLabel, email, initials };
  }

  openCommandPalette(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  }

  openProfileMenu(): void {
    const u = this.sessionUser;
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: u.name,
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Role</span><strong>${u.roleLabel}</strong></div>
          <div class="demo-detail-row"><span>Email</span><strong>${u.email || '—'}</strong></div>
          <div class="demo-detail-row"><span>Session</span><strong>Demo mode</strong></div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Open settings',
      denyButtonText: 'Sign out',
      cancelButtonText: 'Close'
    }).then(result => {
      if (result.isConfirmed) {
        this.router.navigate([this.getAbsoluteSettingsRoute()]);
      } else if (result.isDenied) {
        this.exit();
      }
    });
  }
}
