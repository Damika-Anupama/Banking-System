import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Interceptors
import { ErrorInterceptor } from '../interceptors/error-interceptor.interceptor';
import { LoadingInterceptorInterceptor } from '../interceptors/loading-interceptor.interceptor';
import { TokenInterceptorService } from '../interceptors/token-interceptor-service.interceptor';
import { LoggingInterceptorService } from '../interceptors/logging-interceptor-service.interceptor';
// import { CustomJsonInterceptor } from '../interceptors/custom-json-interceptor.interceptor'; // Removed - causing circular dependency

// Guards
import { DashboardGuard } from '../guard/dashboard.guard';

// Core Services (singleton services that should only be instantiated once)
import { ErrorHandlerService } from '../service/error-handler.service';
import { LoadingService } from '../service/loading.service';
import { MessageService } from '../service/message.service';
import { ThemeService } from '../service/theme.service';

/**
 * Core Module
 *
 * This module contains singleton services, guards, and interceptors that should
 * only be imported once in the AppModule. It provides core functionality needed
 * throughout the application.
 *
 * Features:
 * - HTTP Interceptors for error handling, authentication, and logging
 * - Route Guards for authentication
 * - Singleton services for app-wide state
 */
@NgModule({
  imports: [CommonModule],
  providers: [
    // HTTP Interceptors (order matters!)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptorService,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptorService,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    // CustomJsonInterceptor removed - was causing circular dependency
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: CustomJsonInterceptor,
    //   multi: true
    // },
    // Guards
    DashboardGuard,
    // Core Services
    ErrorHandlerService,
    LoadingService,
    MessageService,
    ThemeService
  ]
})
export class CoreModule {
  /**
   * Prevents CoreModule from being imported more than once.
   * Throws an error if CoreModule is imported in any module other than AppModule.
   */
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only.'
      );
    }
  }
}
