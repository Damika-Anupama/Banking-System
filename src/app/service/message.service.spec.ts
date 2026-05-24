/**
 * Unit Tests for MessageService
 *
 * Tests message management and queuing
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { MessageService } from './message.service';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService]
    });

    service = TestBed.inject(MessageService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty messages array', () => {
      expect(service.messages).toBeDefined();
      expect(service.messages).toEqual([]);
      expect(service.messages.length).toBe(0);
    });
  });

  describe('add()', () => {
    it('should add a message to the array', () => {
      service.add('Test message');

      expect(service.messages.length).toBe(1);
      expect(service.messages[0]).toBe('Test message');
    });

    it('should add multiple messages', () => {
      service.add('Message 1');
      service.add('Message 2');
      service.add('Message 3');

      expect(service.messages.length).toBe(3);
      expect(service.messages[0]).toBe('Message 1');
      expect(service.messages[1]).toBe('Message 2');
      expect(service.messages[2]).toBe('Message 3');
    });

    it('should maintain message order', () => {
      const messages = ['First', 'Second', 'Third', 'Fourth'];
      messages.forEach(msg => service.add(msg));

      expect(service.messages).toEqual(messages);
    });

    it('should handle empty string message', () => {
      service.add('');

      expect(service.messages.length).toBe(1);
      expect(service.messages[0]).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.add(longMessage);

      expect(service.messages.length).toBe(1);
      expect(service.messages[0]).toBe(longMessage);
      expect(service.messages[0].length).toBe(1000);
    });

    it('should handle messages with special characters', () => {
      const specialMessage = 'Test @#$%^&*() message!';
      service.add(specialMessage);

      expect(service.messages[0]).toBe(specialMessage);
    });

    it('should handle messages with newlines', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      service.add(multilineMessage);

      expect(service.messages[0]).toBe(multilineMessage);
    });

    it('should handle messages with unicode characters', () => {
      const unicodeMessage = 'Test 你好 مرحبا 🎉';
      service.add(unicodeMessage);

      expect(service.messages[0]).toBe(unicodeMessage);
    });

    it('should handle adding many messages', () => {
      for (let i = 0; i < 100; i++) {
        service.add(`Message ${i}`);
      }

      expect(service.messages.length).toBe(100);
      expect(service.messages[0]).toBe('Message 0');
      expect(service.messages[99]).toBe('Message 99');
    });

    it('should handle duplicate messages', () => {
      service.add('Duplicate');
      service.add('Duplicate');
      service.add('Duplicate');

      expect(service.messages.length).toBe(3);
      expect(service.messages.every(msg => msg === 'Duplicate')).toBe(true);
    });

    it('should not modify existing messages when adding new ones', () => {
      service.add('First message');
      const firstMessageRef = service.messages[0];

      service.add('Second message');

      expect(service.messages[0]).toBe(firstMessageRef);
      expect(service.messages[0]).toBe('First message');
    });

    it('should handle whitespace-only messages', () => {
      service.add('   ');

      expect(service.messages.length).toBe(1);
      expect(service.messages[0]).toBe('   ');
    });

    it('should handle messages with HTML tags', () => {
      const htmlMessage = '<div>Test</div>';
      service.add(htmlMessage);

      expect(service.messages[0]).toBe(htmlMessage);
    });

    it('should handle messages with JSON strings', () => {
      const jsonMessage = '{"key": "value", "number": 123}';
      service.add(jsonMessage);

      expect(service.messages[0]).toBe(jsonMessage);
    });
  });

  describe('clear()', () => {
    it('should clear all messages', () => {
      service.add('Message 1');
      service.add('Message 2');
      service.add('Message 3');

      service.clear();

      expect(service.messages).toEqual([]);
      expect(service.messages.length).toBe(0);
    });

    it('should work when messages array is empty', () => {
      service.clear();

      expect(service.messages).toEqual([]);
      expect(service.messages.length).toBe(0);
    });

    it('should clear many messages', () => {
      for (let i = 0; i < 100; i++) {
        service.add(`Message ${i}`);
      }

      service.clear();

      expect(service.messages.length).toBe(0);
    });

    it('should allow adding messages after clear', () => {
      service.add('Before clear');
      service.clear();
      service.add('After clear');

      expect(service.messages.length).toBe(1);
      expect(service.messages[0]).toBe('After clear');
    });

    it('should handle multiple consecutive clears', () => {
      service.add('Message');
      service.clear();
      service.clear();
      service.clear();

      expect(service.messages).toEqual([]);
    });

    it('should reset messages array reference', () => {
      service.add('Message 1');
      const oldArray = service.messages;

      service.clear();

      expect(service.messages).not.toBe(oldArray);
      expect(service.messages).toEqual([]);
    });
  });

  describe('Message queue operations', () => {
    it('should handle add and clear cycles', () => {
      service.add('Cycle 1');
      service.clear();
      service.add('Cycle 2');
      service.clear();
      service.add('Cycle 3');

      expect(service.messages.length).toBe(1);
      expect(service.messages[0]).toBe('Cycle 3');
    });

    it('should handle rapid add operations', () => {
      for (let i = 0; i < 10; i++) {
        service.add(`Rapid ${i}`);
      }

      expect(service.messages.length).toBe(10);
    });

    it('should handle alternating add and clear', () => {
      service.add('Message 1');
      service.clear();
      service.add('Message 2');
      service.add('Message 3');
      service.clear();
      service.add('Message 4');

      expect(service.messages.length).toBe(1);
      expect(service.messages[0]).toBe('Message 4');
    });

    it('should maintain message integrity after operations', () => {
      const testMessage = 'Important message';
      service.add(testMessage);
      service.add('Another message');
      service.clear();
      service.add(testMessage);

      expect(service.messages[0]).toBe(testMessage);
    });
  });

  describe('Messages array manipulation', () => {
    it('should allow direct array access', () => {
      service.add('Message 1');
      service.add('Message 2');

      expect(service.messages[0]).toBe('Message 1');
      expect(service.messages[1]).toBe('Message 2');
    });

    it('should support array iteration', () => {
      service.add('A');
      service.add('B');
      service.add('C');

      const collected: string[] = [];
      for (const msg of service.messages) {
        collected.push(msg);
      }

      expect(collected).toEqual(['A', 'B', 'C']);
    });

    it('should support array methods', () => {
      service.add('Apple');
      service.add('Banana');
      service.add('Cherry');

      const filtered = service.messages.filter(msg => msg.startsWith('B'));
      expect(filtered).toEqual(['Banana']);

      const mapped = service.messages.map(msg => msg.toUpperCase());
      expect(mapped).toEqual(['APPLE', 'BANANA', 'CHERRY']);
    });

    it('should allow checking message existence', () => {
      service.add('Test message');

      expect(service.messages.includes('Test message')).toBe(true);
      expect(service.messages.includes('Non-existent')).toBe(false);
    });

    it('should support finding messages', () => {
      service.add('First');
      service.add('Second');
      service.add('Third');

      const found = service.messages.find(msg => msg === 'Second');
      expect(found).toBe('Second');
    });
  });

  describe('Edge cases', () => {
    it('should handle null coercion in messages', () => {
      // TypeScript won't allow null directly, but JavaScript might
      service.add(null as any);

      expect(service.messages.length).toBe(1);
    });

    it('should handle undefined coercion in messages', () => {
      service.add(undefined as any);

      expect(service.messages.length).toBe(1);
    });

    it('should handle number coercion in messages', () => {
      service.add(123 as any);

      expect(service.messages.length).toBe(1);
    });

    it('should handle object coercion in messages', () => {
      service.add({ key: 'value' } as any);

      expect(service.messages.length).toBe(1);
    });

    it('should maintain array after clearing multiple times', () => {
      service.add('Test');
      service.clear();
      service.clear();
      service.clear();

      expect(Array.isArray(service.messages)).toBe(true);
      expect(service.messages.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should handle large number of messages efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        service.add(`Message ${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(service.messages.length).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should clear large number of messages efficiently', () => {
      for (let i = 0; i < 1000; i++) {
        service.add(`Message ${i}`);
      }

      const startTime = performance.now();
      service.clear();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(service.messages.length).toBe(0);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
