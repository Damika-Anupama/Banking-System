import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Third-party modules
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Shared Components
import { UnifiedDashboardComponent } from './components/unified-dashboard/unified-dashboard.component';

// Shared Pipes
import { FilterPipe } from '../pipes/filter.pipe';

/**
 * Shared Module
 *
 * This module contains reusable components, directives, and pipes that are used
 * across multiple feature modules. It should be imported by any feature module
 * that needs access to these shared resources.
 *
 * Contents:
 * - Reusable UI components (UnifiedDashboard, Preloader)
 * - Custom pipes (FilterPipe)
 * - Common Angular modules (Forms, Router, etc.)
 * - Third-party UI libraries (FontAwesome)
 */
@NgModule({
  declarations: [
    // Shared Components
    UnifiedDashboardComponent,
    // Shared Pipes
    FilterPipe
  ],
  imports: [
    // Angular modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    // Third-party modules
    FontAwesomeModule
  ],
  exports: [
    // Re-export Angular modules for convenience
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    // Re-export third-party modules
    FontAwesomeModule,
    // Export shared components
    UnifiedDashboardComponent,
    // Export shared pipes
    FilterPipe
  ]
})
export class SharedModule { }
