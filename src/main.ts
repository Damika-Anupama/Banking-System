import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { readStorage, writeStorage } from 'src/app/shared/safe-storage';

// This is a frontend-only portfolio demo with no live backend.
// Force demo mode on at startup so every service serves fixture data and the
// app works from any entry point — deep links, fresh sessions, or a browser
// that still has a stale `demoMode='false'` from an earlier deployment.
// safe-storage keeps this working even where the browser blocks storage.
if (readStorage('demoMode') !== 'true') {
  writeStorage('demoMode', 'true');
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
