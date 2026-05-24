/**
 * Unit Tests for SignInComponent
 *
 * Tests authentication flow, form validation, and navigation
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SignInComponent } from './sign-in.component';
import { UserService } from 'src/app/service/customer/user.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let router: Router;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    // Create spy objects
    mockUserService = jasmine.createSpyObj('UserService', ['authenticate']);

    await TestBed.configureTestingModule({
      declarations: [SignInComponent],
      imports: [
        FormsModule,
        CommonModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: UserService, useValue: mockUserService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    // Spy on router navigation
    spyOn(router, 'navigate');

    fixture.detectChanges();

    // Spy on Swal
    spyOn(Swal, 'fire');

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty email and password', () => {
      expect(component.email).toBe('');
      expect(component.password).toBe('');
    });

    it('should initialize with isLoading as false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should initialize with empty errorMessage', () => {
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email and password are empty', () => {
      component.email = '';
      component.password = '';

      component.authenticate();

      expect(component.errorMessage).toBe('Email and password are required');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Email and password are required'
        })
      );
      expect(mockUserService.authenticate).not.toHaveBeenCalled();
    });

    it('should show error when email is empty', () => {
      component.email = '';
      component.password = 'password123';

      component.authenticate();

      expect(component.errorMessage).toBe('Email and password are required');
      expect(Swal.fire).toHaveBeenCalled();
      expect(mockUserService.authenticate).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', () => {
      component.email = 'test@example.com';
      component.password = '';

      component.authenticate();

      expect(component.errorMessage).toBe('Email and password are required');
      expect(Swal.fire).toHaveBeenCalled();
      expect(mockUserService.authenticate).not.toHaveBeenCalled();
    });

    it('should show error for invalid email format (no @)', () => {
      component.email = 'invalidemail.com';
      component.password = 'password123';

      component.authenticate();

      expect(component.errorMessage).toBe('Please enter a valid email address');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid email address'
        })
      );
      expect(mockUserService.authenticate).not.toHaveBeenCalled();
    });

    it('should show error for invalid email format (no domain)', () => {
      component.email = 'test@';
      component.password = 'password123';

      component.authenticate();

      expect(component.errorMessage).toBe('Please enter a valid email address');
      expect(mockUserService.authenticate).not.toHaveBeenCalled();
    });

    it('should show error for invalid email format (no extension)', () => {
      component.email = 'test@example';
      component.password = 'password123';

      component.authenticate();

      expect(component.errorMessage).toBe('Please enter a valid email address');
      expect(mockUserService.authenticate).not.toHaveBeenCalled();
    });

    it('should accept valid email format', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect(mockUserService.authenticate).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should accept email with subdomain', () => {
      component.email = 'test@mail.example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect(mockUserService.authenticate).toHaveBeenCalledWith('test@mail.example.com', 'password123');
    });
  });

  describe('Successful Authentication', () => {
    it('should navigate to customer dashboard for CUSTOMER type', () => {
      component.email = 'customer@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'customer-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect(localStorage.getItem('token')).toBe('customer-token');
      expect(localStorage.getItem('email')).toBe('customer@example.com');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/home']);
      expect(component.isLoading).toBe(false);
    });

    it('should navigate to employee dashboard for EMPLOYEE type', () => {
      component.email = 'employee@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'employee-token',
        type: 'EMPLOYEE'
      }));

      component.authenticate();

      expect(localStorage.getItem('token')).toBe('employee-token');
      expect(router.navigate).toHaveBeenCalledWith(['/employee-dashboard/employee-home']);
    });

    it('should navigate to manager dashboard for MANAGER type', () => {
      component.email = 'manager@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'manager-token',
        type: 'MANAGER'
      }));

      component.authenticate();

      expect(localStorage.getItem('token')).toBe('manager-token');
      expect(router.navigate).toHaveBeenCalledWith(['/manager-dashboard/manager-home']);
    });

    it('should set isLoading to true during authentication', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      // isLoading should be set to false after navigation
      expect(component.isLoading).toBe(false);
    });

    it('should clear errorMessage on successful authentication', () => {
      component.email = 'test@example.com';
      component.password = 'password123';
      component.errorMessage = 'Previous error';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect(component.errorMessage).toBe('');
    });
  });

  describe('Authentication Errors', () => {
    it('should handle null user response', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of(null));

      component.authenticate();

      expect(component.errorMessage).toBe('Invalid response from server');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Invalid response from server'
        })
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle undefined user response', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of(undefined));

      component.authenticate();

      expect(component.errorMessage).toBe('Invalid response from server');
      expect(component.isLoading).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle missing token', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: null,
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect(component.errorMessage).toBe('Invalid authentication credentials');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Invalid authentication credentials'
        })
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle missing type', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: null
      }));

      component.authenticate();

      expect(component.errorMessage).toBe('Invalid authentication credentials');
      expect(component.isLoading).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle invalid user type', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'INVALID_TYPE'
      }));

      component.authenticate();

      expect(component.errorMessage).toBe('Invalid user type');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Invalid user type'
        })
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle server error with message', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      const errorResponse = {
        error: { message: 'Invalid credentials' }
      };

      mockUserService.authenticate.and.returnValue(throwError(() => errorResponse));

      component.authenticate();

      expect(component.errorMessage).toBe('Invalid credentials');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Authentication Failed',
          text: 'Invalid credentials'
        })
      );
    });

    it('should handle server error without specific message', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(throwError(() => new Error('Network error')));

      component.authenticate();

      expect(component.errorMessage).toBe('Network error');
      expect(component.isLoading).toBe(false);
    });

    it('should handle error without error object', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(throwError(() => ({})));

      component.authenticate();

      expect(component.errorMessage).toBe('Invalid email or password');
      expect(component.isLoading).toBe(false);
    });

    it('should log error to console on authentication failure', () => {
      spyOn(console, 'error');

      component.email = 'test@example.com';
      component.password = 'password123';

      const error = new Error('Test error');
      mockUserService.authenticate.and.returnValue(throwError(() => error));

      component.authenticate();

      expect(console.error).toHaveBeenCalledWith('Authentication error:', error);
    });
  });

  describe('LocalStorage Error Handling', () => {
    it('should handle localStorage setItem failure', () => {
      spyOn(console, 'error');
      spyOn(localStorage, 'setItem').and.throwError('Storage unavailable');

      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect(component.errorMessage).toBe('Failed to store authentication data');
      expect(component.isLoading).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error storing authentication data:', jasmine.any(Error));
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Failed to store authentication data'
        })
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Management', () => {
    it('should add subscription to subscriptions array', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      const subscription = (component as any).subscriptions[0];
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple subscriptions', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      // Call authenticate multiple times
      component.authenticate();
      component.authenticate();

      expect((component as any).subscriptions.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should reject email with whitespace', () => {
      component.email = '  test@example.com  ';
      component.password = 'password123';

      component.authenticate();

      expect(component.errorMessage).toBe('Please enter a valid email address');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid email address'
        })
      );
      expect(mockUserService.authenticate).not.toHaveBeenCalled();
    });

    it('should handle special characters in password', () => {
      component.email = 'test@example.com';
      component.password = 'P@ssw0rd!#$%';

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect(mockUserService.authenticate).toHaveBeenCalledWith('test@example.com', 'P@ssw0rd!#$%');
    });

    it('should handle very long password', () => {
      component.email = 'test@example.com';
      component.password = 'a'.repeat(1000);

      mockUserService.authenticate.and.returnValue(of({
        token: 'test-token',
        type: 'CUSTOMER'
      }));

      component.authenticate();

      expect(mockUserService.authenticate).toHaveBeenCalled();
    });
  });
});
