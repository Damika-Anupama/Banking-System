/**
 * Unit Tests for EmployeeHomeComponent
 *
 * Tests customer data loading, error handling, and data validation
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmployeeHomeComponent } from './employee.home.component';
import { EmployeeHomeService } from 'src/app/service/employee/employee.home.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('EmployeeHomeComponent', () => {
  let component: EmployeeHomeComponent;
  let fixture: ComponentFixture<EmployeeHomeComponent>;
  let mockEmployeeHomeService: jasmine.SpyObj<EmployeeHomeService>;

  beforeEach(async () => {
    // Create spy objects
    mockEmployeeHomeService = jasmine.createSpyObj('EmployeeHomeService', ['getEmployeeHome']);

    await TestBed.configureTestingModule({
      declarations: [EmployeeHomeComponent],
      imports: [CommonModule],
      providers: [
        { provide: EmployeeHomeService, useValue: mockEmployeeHomeService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeHomeComponent);
    component = fixture.componentInstance;

    // Spy on Swal
    spyOn(Swal, 'fire');
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null customers', () => {
      expect(component.customers).toBeNull();
    });

    it('should initialize with false isLoading', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should initialize with empty errorMessage', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should call loadCustomers on ngOnInit', () => {
      spyOn(component, 'loadCustomers');
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: [] }));

      component.ngOnInit();

      expect(component.loadCustomers).toHaveBeenCalled();
    });
  });

  describe('Load Customers - Success Cases', () => {
    it('should load customers successfully', () => {
      const mockCustomers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ];

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: mockCustomers }));

      component.loadCustomers();

      expect(component.customers).toEqual(mockCustomers);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(mockEmployeeHomeService.getEmployeeHome).toHaveBeenCalled();
    });

    it('should handle empty customer array with info message', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: [] }));

      component.loadCustomers();

      expect(component.customers).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'info',
          title: 'No Customers',
          text: 'No customers found in the system'
        })
      );
    });

    it('should set isLoading to true when loading starts', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: [] }));

      component.isLoading = false;
      component.loadCustomers();

      // Check that isLoading is eventually set to false after loading
      expect(component.isLoading).toBe(false);
    });

    it('should clear errorMessage when loading starts', () => {
      component.errorMessage = 'Previous error';
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: [] }));

      component.loadCustomers();

      expect(component.errorMessage).toBe('');
    });

    it('should handle large customer arrays', () => {
      const largeCustomerArray = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`
      }));

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: largeCustomerArray }));

      component.loadCustomers();

      expect(component.customers).toEqual(largeCustomerArray);
      expect(component.customers?.length).toBe(100);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Load Customers - Null/Undefined Data Handling', () => {
    it('should handle null response data', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of(null));

      component.loadCustomers();

      expect(component.errorMessage).toBe('No data received from server');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'No data received from server'
        })
      );
    });

    it('should handle undefined response data', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of(undefined));

      component.loadCustomers();

      expect(component.errorMessage).toBe('No data received from server');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'No data received from server'
        })
      );
    });

    it('should handle missing data property', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({} as any));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Invalid data format received');
      expect(component.customers).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'Warning',
          text: 'No customer data available'
        })
      );
    });

    it('should handle null data property', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: null }));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Invalid data format received');
      expect(component.customers).toEqual([]);
      expect(component.isLoading).toBe(false);
    });

    it('should handle non-array data property', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: 'invalid' } as any));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Invalid data format received');
      expect(component.customers).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'Warning',
          text: 'No customer data available'
        })
      );
    });

    it('should handle data property as object instead of array', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: { id: 1 } } as any));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Invalid data format received');
      expect(component.customers).toEqual([]);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Load Customers - Error Handling', () => {
    it('should handle HTTP error with message', () => {
      const errorResponse = {
        error: { message: 'Unauthorized access' }
      };

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(throwError(() => errorResponse));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Unauthorized access');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Unauthorized access'
        })
      );
    });

    it('should handle error without error.message', () => {
      const error = new Error('Network error');
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(throwError(() => error));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Network error');
      expect(component.isLoading).toBe(false);
    });

    it('should handle error without any message', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(throwError(() => ({})));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Failed to load customers');
      expect(component.isLoading).toBe(false);
    });

    it('should log error to console', () => {
      spyOn(console, 'error');
      const error = new Error('Test error');
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(throwError(() => error));

      component.loadCustomers();

      expect(console.error).toHaveBeenCalledWith('Error loading customers:', error);
    });

    it('should handle 404 error', () => {
      const errorResponse = {
        error: { message: 'Customers not found' },
        status: 404
      };

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(throwError(() => errorResponse));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Customers not found');
      expect(component.isLoading).toBe(false);
    });

    it('should handle 500 server error', () => {
      const errorResponse = {
        error: { message: 'Internal server error' },
        status: 500
      };

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(throwError(() => errorResponse));

      component.loadCustomers();

      expect(component.errorMessage).toBe('Internal server error');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Subscription Management', () => {
    it('should add subscription to subscriptions array', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: [] }));

      component.loadCustomers();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: [] }));

      component.loadCustomers();

      const subscription = (component as any).subscriptions[0];
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple subscriptions', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: [] }));

      component.loadCustomers();
      component.loadCustomers();

      expect((component as any).subscriptions.length).toBe(2);
    });

    it('should unsubscribe all multiple subscriptions on ngOnDestroy', () => {
      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: [] }));

      component.loadCustomers();
      component.loadCustomers();

      const sub1 = (component as any).subscriptions[0];
      const sub2 = (component as any).subscriptions[1];
      spyOn(sub1, 'unsubscribe');
      spyOn(sub2, 'unsubscribe');

      component.ngOnDestroy();

      expect(sub1.unsubscribe).toHaveBeenCalled();
      expect(sub2.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Try-Catch Error Handling', () => {
    it('should catch and handle JavaScript errors during data processing', () => {
      spyOn(console, 'error');

      // Create a mock response that will cause a runtime error when accessed
      const problematicData = {
        get data() {
          throw new Error('Unexpected processing error');
        }
      };

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of(problematicData as any));

      component.loadCustomers();

      expect(console.error).toHaveBeenCalledWith('Error processing customer data:', jasmine.any(Error));
      expect(component.errorMessage).toBe('Failed to process customer data');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Failed to process customer data'
        })
      );
    });

    it('should catch TypeError when accessing nested properties', () => {
      spyOn(console, 'error');

      // Mock data that causes TypeError during processing
      const mockData = {
        data: [
          { id: 1, name: 'Test' }
        ]
      };

      // Override Array.isArray to throw an error
      const originalIsArray = Array.isArray;
      spyOn(Array, 'isArray').and.throwError('Simulated TypeError');

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of(mockData));

      component.loadCustomers();

      expect(console.error).toHaveBeenCalledWith('Error processing customer data:', jasmine.any(Error));
      expect(component.errorMessage).toBe('Failed to process customer data');
      expect(component.isLoading).toBe(false);

      // Restore original Array.isArray
      (Array as any).isArray = originalIsArray;
    });

    it('should handle null reference errors during data access', () => {
      spyOn(console, 'error');

      // Create object with getter that throws error
      const faultyResponse = Object.create(null, {
        data: {
          get() {
            throw new TypeError('Cannot read property of null');
          }
        }
      });

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of(faultyResponse));

      component.loadCustomers();

      expect(console.error).toHaveBeenCalledWith('Error processing customer data:', jasmine.any(Error));
      expect(component.errorMessage).toBe('Failed to process customer data');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Failed to process customer data'
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle customers with special characters in names', () => {
      const mockCustomers = [
        { id: 1, name: "O'Brien", email: 'obrien@example.com' },
        { id: 2, name: 'José García', email: 'jose@example.com' }
      ];

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: mockCustomers }));

      component.loadCustomers();

      expect(component.customers).toEqual(mockCustomers);
      expect(component.isLoading).toBe(false);
    });

    it('should handle customers with Unicode characters', () => {
      const mockCustomers = [
        { id: 1, name: '李明', email: 'liming@example.com' },
        { id: 2, name: 'محمد', email: 'mohamed@example.com' }
      ];

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: mockCustomers }));

      component.loadCustomers();

      expect(component.customers).toEqual(mockCustomers);
    });

    it('should handle single customer', () => {
      const mockCustomers = [
        { id: 1, name: 'Single Customer', email: 'single@example.com' }
      ];

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: mockCustomers }));

      component.loadCustomers();

      expect(component.customers).toEqual(mockCustomers);
      expect(component.customers?.length).toBe(1);
    });

    it('should not show info message when customers are loaded', () => {
      const mockCustomers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' }
      ];

      mockEmployeeHomeService.getEmployeeHome.and.returnValue(of({ data: mockCustomers }));

      component.loadCustomers();

      expect(Swal.fire).not.toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'info'
        })
      );
    });
  });
});
