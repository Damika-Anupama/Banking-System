import {
  clearStorage,
  readStorage,
  removeStorage,
  resetSafeStorageForTests,
  writeStorage,
} from './safe-storage';

describe('safe-storage', () => {
  afterEach(() => {
    resetSafeStorageForTests();
    localStorage.removeItem('ss-test');
  });

  it('round-trips through real localStorage when it works', () => {
    writeStorage('ss-test', 'value');
    expect(localStorage.getItem('ss-test')).toBe('value');
    expect(readStorage('ss-test')).toBe('value');

    removeStorage('ss-test');
    expect(localStorage.getItem('ss-test')).toBeNull();
    expect(readStorage('ss-test')).toBeNull();
  });

  describe('when the browser blocks storage', () => {
    beforeEach(() => {
      resetSafeStorageForTests();
      // The probe write throws, as in lockdown/private modes.
      spyOn(Storage.prototype, 'setItem').and.throwError('storage disabled');
      spyOn(Storage.prototype, 'getItem').and.throwError('storage disabled');
    });

    it('keeps the session working from the in-memory fallback', () => {
      writeStorage('ss-test', 'kept');
      expect(readStorage('ss-test')).toBe('kept');
    });

    it('removes and clears from the fallback too', () => {
      writeStorage('ss-test', 'kept');
      removeStorage('ss-test');
      expect(readStorage('ss-test')).toBeNull();

      writeStorage('a', '1');
      writeStorage('b', '2');
      clearStorage();
      expect(readStorage('a')).toBeNull();
      expect(readStorage('b')).toBeNull();
    });

    it('reads miss cleanly instead of throwing', () => {
      expect(readStorage('never-written')).toBeNull();
    });
  });
});
