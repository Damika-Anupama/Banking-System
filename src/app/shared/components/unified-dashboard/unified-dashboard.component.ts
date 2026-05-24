import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
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
    });
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
}
