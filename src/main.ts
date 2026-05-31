import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// This is a frontend-only portfolio demo with no live backend.
// Force demo mode on at startup so every service serves fixture data and the
// app works from any entry point — deep links, fresh sessions, or a browser
// that still has a stale `demoMode='false'` from an earlier deployment.
try {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('demoMode') !== 'true') {
    localStorage.setItem('demoMode', 'true');
  }
} catch (err) {
  console.warn('Unable to initialise demo mode:', err);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
