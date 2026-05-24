/**
 * Unit Tests for CustomJsonInterceptor
 *
 * Tests custom JSON parsing, response type handling
 * Target coverage: 95%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { CustomJsonInterceptor, JsonParser } from './custom-json-interceptor.interceptor';

// Mock JsonParser implementation
class MockJsonParser extends JsonParser {
  parse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error('JSON parse error');
    }
  }
}

describe('CustomJsonInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let jsonParser: MockJsonParser;
  let interceptor: CustomJsonInterceptor;

  const TEST_URL = 'http://localhost:3000/api/test';

  beforeEach(() => {
    jsonParser = new MockJsonParser();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CustomJsonInterceptor,
        { provide: JsonParser, useValue: jsonParser },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: CustomJsonInterceptor,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    interceptor = TestBed.inject(CustomJsonInterceptor);

    spyOn(jsonParser, 'parse').and.callThrough();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Interceptor Creation', () => {
    it('should create', () => {
      expect(interceptor).toBeTruthy();
    });

    it('should have jsonParser', () => {
      expect((interceptor as any).jsonParser).toBeTruthy();
    });
  });

  describe('JSON Response Handling', () => {
    it('should parse JSON response', (done) => {
      const responseData = { id: 1, name: 'Test', items: [1, 2, 3] };

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual(responseData);
        expect(jsonParser.parse).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(responseData));
    });

    it('should handle simple JSON objects', (done) => {
      const simpleObject = { success: true };

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual(simpleObject);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(simpleObject));
    });

    it('should handle nested JSON objects', (done) => {
      const nestedObject = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            address: {
              city: 'New York',
              zip: '10001'
            }
          }
        }
      };

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual(nestedObject);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(nestedObject));
    });

    it('should handle JSON arrays', (done) => {
      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual(arrayData);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(arrayData));
    });

    it('should handle empty JSON object', (done) => {
      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual({});
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify({}));
    });

    it('should handle empty JSON array', (done) => {
      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify([]));
    });

    it('should handle JSON with null values', (done) => {
      const dataWithNull = { id: 1, value: null, optional: null };

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual(dataWithNull);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(dataWithNull));
    });

    it('should handle JSON with boolean values', (done) => {
      const dataWithBooleans = { isActive: true, isDeleted: false };

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual(dataWithBooleans);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(dataWithBooleans));
    });

    it('should handle JSON with numbers', (done) => {
      const dataWithNumbers = { count: 42, price: 19.99, negative: -10 };

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual(dataWithNumbers);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(dataWithNumbers));
    });
  });

  describe('Non-JSON Response Handling', () => {
    it('should not intercept non-JSON responseType', (done) => {
      httpClient.get(TEST_URL, { responseType: 'text' }).subscribe((response) => {
        expect(jsonParser.parse).not.toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush('Plain text response');
    });

    it('should not intercept blob responseType', (done) => {
      httpClient.get(TEST_URL, { responseType: 'blob' }).subscribe((response) => {
        expect(jsonParser.parse).not.toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(new Blob(['test']));
    });

    it('should not intercept arraybuffer responseType', (done) => {
      httpClient.get(TEST_URL, { responseType: 'arraybuffer' }).subscribe((response) => {
        expect(jsonParser.parse).not.toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(new ArrayBuffer(8));
    });
  });

  describe('Response Type Conversion', () => {
    it('should convert JSON responseType to text', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      // The interceptor changes responseType to 'text' internally
      expect(req.request.responseType).toBe('text');
      req.flush('{"data":"test"}');
    });

    it('should handle HttpResponse events', (done) => {
      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush('{"success":true}');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', (done) => {
      (jsonParser.parse as jasmine.Spy).and.throwError('Invalid JSON');

      httpClient.get(TEST_URL).subscribe({
        next: () => {},
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush('invalid json {]');
    });

    it('should handle empty response body', (done) => {
      // Configure parser to handle empty string gracefully
      (jsonParser.parse as jasmine.Spy).and.callFake((text: string) => {
        if (!text || text.trim() === '') {
          return null; // Return null for empty strings
        }
        return JSON.parse(text);
      });

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toBeNull();
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush('');
    });

    it('should handle HTTP errors', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('HTTP Methods', () => {
    it('should handle GET requests', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('GET');
      req.flush('{"data":"test"}');
    });

    it('should handle POST requests', (done) => {
      httpClient.post(TEST_URL, { input: 'test' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('POST');
      req.flush('{"created":true}');
    });

    it('should handle PUT requests', (done) => {
      httpClient.put(TEST_URL, { id: 1, name: 'Updated' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('PUT');
      req.flush('{"updated":true}');
    });

    it('should handle DELETE requests', (done) => {
      httpClient.delete(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('DELETE');
      req.flush('{"deleted":true}');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large JSON responses', (done) => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: `Data for item ${i}`
      }));

      httpClient.get(TEST_URL).subscribe((response: any) => {
        expect(Array.isArray(response)).toBe(true);
        expect(response.length).toBe(1000);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(largeArray));
    });

    it('should handle JSON with special characters', (done) => {
      const dataWithSpecialChars = {
        text: 'Hello "World" with \'quotes\'',
        symbols: '!@#$%^&*()',
        unicode: 'Hello 世界 🌍'
      };

      httpClient.get(TEST_URL).subscribe((response) => {
        expect(response).toEqual(dataWithSpecialChars);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(JSON.stringify(dataWithSpecialChars));
    });

    it('should handle multiple concurrent requests', (done) => {
      let completed = 0;
      const total = 3;
      const checkDone = () => {
        completed++;
        if (completed === total) done();
      };

      httpClient.get(TEST_URL + '/1').subscribe(() => checkDone());
      httpClient.get(TEST_URL + '/2').subscribe(() => checkDone());
      httpClient.get(TEST_URL + '/3').subscribe(() => checkDone());

      const req1 = httpMock.expectOne(TEST_URL + '/1');
      const req2 = httpMock.expectOne(TEST_URL + '/2');
      const req3 = httpMock.expectOne(TEST_URL + '/3');

      req1.flush('{"id":1}');
      req2.flush('{"id":2}');
      req3.flush('{"id":3}');
    });

    it('should handle request with headers', (done) => {
      const headers = { 'Content-Type': 'application/json' };

      httpClient.get(TEST_URL, { headers }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush('{"success":true}');
    });

    it('should handle request with query params', (done) => {
      httpClient.get(TEST_URL, { params: { page: '1', limit: '10' } }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(request => request.url === TEST_URL);
      req.flush('{"items":[]}');
    });
  });

  describe('JsonParser Integration', () => {
    it('should use injected JsonParser', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        expect(jsonParser.parse).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush('{"test":true}');
    });

    it('should pass string to JsonParser.parse', (done) => {
      const testData = '{"message":"test"}';

      httpClient.get(TEST_URL).subscribe(() => {
        expect(jsonParser.parse).toHaveBeenCalledWith(testData);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush(testData);
    });
  });
});
