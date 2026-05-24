import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Core Module (singleton services, guards, interceptors)
import { CoreModule } from './core/core.module';

// Root Component
import { AppComponent } from './app.component';

// Error Pages (not lazy loaded - always available)
import { NotFoundComponent } from './view/not-found/not-found.component';
import { ServerErrorComponent } from './view/server-error/server-error.component';

// Preloader Component (used in app.component.html)
import { PreloaderComponent } from './shared/preloader/preloader.component';

/**
 * App Module (Root Module)
 *
 * This is the root module that bootstraps the Angular application.
 * It imports:
 * - Core module (singleton services, guards, interceptors)
 * - Routing module with lazy-loaded feature modules
 * - Global error pages (404, 500)
 *
 * All feature modules are lazy-loaded:
 * - Auth Module (welcome, sign-in, sign-up)
 * - Customer Module (customer dashboard)
 * - Employee Module (employee dashboard)
 * - Manager Module (manager dashboard)
 *
 * This approach improves:
 * - Initial load time (smaller bundle)
 * - Code organization (feature-based modules)
 * - Maintainability (clear separation of concerns)
 */
@NgModule({
  declarations: [
    AppComponent,
    // Global components used in app.component.html
    PreloaderComponent,
    // Global error pages
    NotFoundComponent,
    ServerErrorComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CoreModule,        // Singleton services, guards, interceptors
    AppRoutingModule   // Routing with lazy-loaded modules
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
