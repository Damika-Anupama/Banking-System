/**
 * Unit Tests for LoadingService
 *
 * Tests loading state management
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService]
    });

    service = TestBed.inject(LoadingService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with loading$ observable', () => {
      expect(service.loading$).toBeDefined();
    });

    it('should start with loading state as false', (done) => {
      service.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });
  });

  describe('show()', () => {
    it('should set loading state to true', (done) => {
      service.show();

      service.loading$.subscribe(loading => {
        expect(loading).toBe(true);
        done();
      });
    });

    it('should emit true immediately when called', (done) => {
      const emissions: boolean[] = [];

      service.loading$.subscribe(loading => {
        emissions.push(loading);
      });

      service.show();

      // Use setTimeout to ensure async emission completes
      setTimeout(() => {
        expect(emissions).toContain(true);
        expect(emissions[emissions.length - 1]).toBe(true);
        done();
      }, 10);
    });

    it('should handle multiple consecutive show calls', (done) => {
      service.show();
      service.show();
      service.show();

      service.loading$.subscribe(loading => {
        expect(loading).toBe(true);
        done();
      });
    });
  });

  describe('hide()', () => {
    it('should set loading state to false', (done) => {
      // First show loading
      service.show();

      // Then hide it
      service.hide();

      service.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });

    it('should emit false immediately when called', (done) => {
      service.show();

      const emissions: boolean[] = [];
      service.loading$.subscribe(loading => {
        emissions.push(loading);
      });

      service.hide();

      setTimeout(() => {
        expect(emissions).toContain(false);
        expect(emissions[emissions.length - 1]).toBe(false);
        done();
      }, 10);
    });

    it('should handle multiple consecutive hide calls', (done) => {
      service.hide();
      service.hide();
      service.hide();

      service.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });

    it('should work when called without prior show', (done) => {
      service.hide();

      service.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });
  });

  describe('show() and hide() sequence', () => {
    it('should toggle loading state correctly', (done) => {
      const emissions: boolean[] = [];

      service.loading$.subscribe(loading => {
        emissions.push(loading);
      });

      service.show();
      setTimeout(() => service.hide(), 10);

      setTimeout(() => {
        expect(emissions[0]).toBe(false); // Initial state
        expect(emissions[1]).toBe(true);  // After show()
        expect(emissions[2]).toBe(false); // After hide()
        done();
      }, 50);
    });

    it('should handle rapid show/hide cycles', (done) => {
      const emissions: boolean[] = [];

      service.loading$.subscribe(loading => {
        emissions.push(loading);
      });

      service.show();
      service.hide();
      service.show();
      service.hide();

      setTimeout(() => {
        expect(emissions[emissions.length - 1]).toBe(false);
        expect(emissions).toContain(true);
        done();
      }, 50);
    });

    it('should emit distinct values only', (done) => {
      let emissionCount = 0;

      service.loading$.subscribe(() => {
        emissionCount++;
      });

      // Initial subscription triggers one emission
      expect(emissionCount).toBe(1);

      service.show();
      setTimeout(() => {
        expect(emissionCount).toBe(2); // Changed to true

        service.hide();
        setTimeout(() => {
          expect(emissionCount).toBe(3); // Changed to false
          done();
        }, 10);
      }, 10);
    });
  });

  describe('Observable behavior', () => {
    it('should allow multiple subscribers', (done) => {
      let subscriber1Value: boolean | undefined;
      let subscriber2Value: boolean | undefined;

      service.loading$.subscribe(loading => {
        subscriber1Value = loading;
      });

      service.loading$.subscribe(loading => {
        subscriber2Value = loading;
      });

      service.show();

      setTimeout(() => {
        expect(subscriber1Value).toBe(true);
        expect(subscriber2Value).toBe(true);
        done();
      }, 10);
    });

    it('should provide current value to new subscribers', (done) => {
      service.show();

      setTimeout(() => {
        service.loading$.subscribe(loading => {
          expect(loading).toBe(true);
          done();
        });
      }, 10);
    });

    it('should maintain state between subscriptions', (done) => {
      service.show();

      const subscription1 = service.loading$.subscribe(loading => {
        expect(loading).toBe(true);
      });

      subscription1.unsubscribe();

      setTimeout(() => {
        service.loading$.subscribe(loading => {
          expect(loading).toBe(true);
          done();
        });
      }, 10);
    });
  });

  describe('Loading state persistence', () => {
    it('should maintain loading state across method calls', (done) => {
      let firstCheck = false;

      service.show();

      setTimeout(() => {
        service.loading$.subscribe(loading => {
          if (!firstCheck) {
            expect(loading).toBe(true);
            firstCheck = true;
          }
        });

        service.hide();

        setTimeout(() => {
          service.loading$.subscribe(loading => {
            expect(loading).toBe(false);
            done();
          });
        }, 20);
      }, 20);
    });

    it('should not reset state on new subscription', (done) => {
      service.show();

      setTimeout(() => {
        service.loading$.subscribe(loading => {
          expect(loading).toBe(true);
          done();
        });
      }, 20);
    });
  });
});
