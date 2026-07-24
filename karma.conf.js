// Karma configuration for the Angular unit suite.
//
// This is the standard Angular karma config (frameworks/plugins/reporters that
// `ng generate config karma` emits) plus a CI-hardened browser launcher.
//
// Why the launcher exists: the suite runs green locally but the Linux CI runner
// killed the browser mid-run — "Disconnected, because no message in 30000 ms"
// at ~test 739/1548 — and reported ~27 unrelated tests as failures as collateral
// (mismatched describe/it names, "Cannot read properties of null (reading
// 'run')" from zone-testing). That is a browser-stability problem on a contended
// shared runner, not a test bug: default ChromeHeadless runs without
// --no-sandbox and the 30s inactivity timeout is too tight (the run showed 33s
// wall for 2.5s of CPU — starved, not crashed on an assertion). CI runs with
// --browsers=ChromeHeadlessCI.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
      clearContext: false, // leave Jasmine Spec Runner output visible in the browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/banking-system'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,

    // --- CI hardening (see file header) ---
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        // ChromeHeadless already passes --headless --disable-gpu
        // --disable-dev-shm-usage; --no-sandbox is the piece the CI runner needs.
        flags: ['--no-sandbox'],
      },
    },
    // A slow/contended runner can fall quiet for longer than the default 30s
    // between tests without having actually died — give it room, and let karma
    // retry a genuinely dropped browser instead of failing the whole run.
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 30000,
    browserDisconnectTolerance: 2,
    captureTimeout: 120000,
  });
};
