/**
 * Unit Tests for ManagerSettingsComponent
 *
 * Tests user settings management, form validation, password handling, and error handling
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ManagerSettingsComponent } from './manager.settings.component';
import { UserService } from 'src/app/service/customer/user.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('ManagerSettingsComponent', () => {
  let component: ManagerSettingsComponent;
  let fixture: ComponentFixture<ManagerSettingsComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', ['getById', 'updateUser']);

    await TestBed.configureTestingModule({
      declarations: [ManagerSettingsComponent],
      imports: [FormsModule, CommonModule],
      providers: [
        { provide: UserService, useValue: mockUserService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerSettingsComponent);
    component = fixture.componentInstance;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false, value: true }));
    spyOn(console, 'error');
  });

  afterEach(() => {
    localStorage.clear();
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form fields', () => {
      expect(component.userId).toBe('');
      expect(component.username).toBe('');
      expect(component.fullname).toBe('');
      expect(component.email).toBe('');
      expect(component.password).toBe('');
      expect(component.address).toBe('');
      expect(component.contactNo).toBe('');
      expect(component.dob).toBe('');
    });

    it('should initialize gender to MALE', () => {
      expect(component.gender).toBe('MALE');
    });

    it('should initialize with empty originalData', () => {
      expect(component.originalData).toEqual({});
    });

    it('should initialize state flags correctly', () => {
      expect(component.isLoading).toBe(false);
      expect(component.isSaving).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.showPassword).toBe(false);
    });

    it('should have empty subscriptions array', () => {
      expect((component as any).subscriptions).toEqual([]);
    });
  });

  describe('ngOnInit - localStorage', () => {
    it('should load userId from localStorage', () => {
      localStorage.setItem('userId', 'user123');
      localStorage.setItem('email', 'test@example.com');

      const mockUserData = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'test@example.com',
          address: '123 Main St',
          contact_no: '1234567890',
          gender: 'MALE',
          dob: '1990-01-01T00:00:00.000Z'
        }]
      };
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.ngOnInit();

      expect(component.userId).toBe('user123');
      expect(component.email).toBe('test@example.com');
    });

    it('should load email from localStorage', () => {
      localStorage.setItem('userId', 'user123');
      localStorage.setItem('email', 'manager@example.com');

      const mockUserData = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'manager@example.com',
          address: '123 Main St',
          contact_no: '1234567890',
          gender: 'MALE',
          dob: '1990-01-01T00:00:00.000Z'
        }]
      };
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.ngOnInit();

      expect(component.email).toBe('manager@example.com');
    });

    it('should handle missing userId in localStorage', () => {
      component.ngOnInit();

      expect(component.userId).toBe('');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'User session not found. Please log in again.'
        })
      );
      expect(mockUserService.getById).not.toHaveBeenCalled();
    });

    it('should handle missing email in localStorage', () => {
      localStorage.setItem('userId', 'user123');
      // Don't set email in localStorage

      const mockUserData = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'test@example.com',
          address: '123 Main St',
          contact_no: '1234567890',
          gender: 'MALE',
          dob: '1990-01-01T00:00:00.000Z'
        }]
      };
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.ngOnInit();

      // Email should be loaded from user data after loadUserData() is called
      expect(component.email).toBe('test@example.com');
    });

    it('should call loadUserData when userId exists', () => {
      localStorage.setItem('userId', 'user123');
      spyOn(component, 'loadUserData');

      component.ngOnInit();

      expect(component.loadUserData).toHaveBeenCalled();
    });
  });

  describe('loadUserData - Success', () => {
    const mockUserData = {
      data: [{
        username: 'johndoe',
        fullname: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        contact_no: '1234567890',
        gender: 'MALE',
        dob: '1990-01-01T00:00:00.000Z'
      }]
    };

    beforeEach(() => {
      component.userId = 'user123';
    });

    it('should load user data successfully', () => {
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.username).toBe('johndoe');
      expect(component.fullname).toBe('John Doe');
      expect(component.email).toBe('john@example.com');
      expect(component.address).toBe('123 Main St');
      expect(component.contactNo).toBe('1234567890');
      expect(component.gender).toBe('MALE');
      expect(component.isLoading).toBe(false);
    });

    it('should format dob correctly', () => {
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.dob).toBe('1990-01-01');
    });

    it('should store originalData', () => {
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.originalData).toEqual({
        username: 'johndoe',
        fullname: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        contactNo: '1234567890',
        dob: '1990-01-01',
        gender: 'MALE'
      });
    });

    it('should clear errorMessage when loading starts', () => {
      component.errorMessage = 'Previous error';
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.errorMessage).toBe('');
    });

    it('should use empty strings for missing optional fields', () => {
      const minimalData = {
        data: [{}]
      };
      mockUserService.getById.and.returnValue(of(minimalData));

      component.loadUserData();

      expect(component.username).toBe('');
      expect(component.fullname).toBe('');
      expect(component.email).toBe('');
      expect(component.address).toBe('');
      expect(component.contactNo).toBe('');
    });

    it('should default gender to MALE when not provided', () => {
      const dataWithoutGender = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'john@example.com'
        }]
      };
      mockUserService.getById.and.returnValue(of(dataWithoutGender));

      component.loadUserData();

      expect(component.gender).toBe('MALE');
    });

    it('should handle FEMALE gender', () => {
      const femaleData = {
        data: [{
          username: 'janedoe',
          fullname: 'Jane Doe',
          email: 'jane@example.com',
          gender: 'FEMALE'
        }]
      };
      mockUserService.getById.and.returnValue(of(femaleData));

      component.loadUserData();

      expect(component.gender).toBe('FEMALE');
    });
  });

  describe('loadUserData - Error Handling', () => {
    beforeEach(() => {
      component.userId = 'user123';
    });

    it('should handle null response', () => {
      mockUserService.getById.and.returnValue(of(null));

      component.loadUserData();

      expect(component.errorMessage).toBe('User data not found');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Could not load user data'
        })
      );
    });

    it('should handle response without data property', () => {
      mockUserService.getById.and.returnValue(of({}));

      component.loadUserData();

      expect(component.errorMessage).toBe('User data not found');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Could not load user data'
        })
      );
    });

    it('should handle empty data array', () => {
      mockUserService.getById.and.returnValue(of({ data: [] }));

      component.loadUserData();

      expect(component.errorMessage).toBe('User data not found');
      expect(component.isLoading).toBe(false);
    });

    it('should handle HTTP error', () => {
      const errorResponse = { message: 'Failed to load user' };
      mockUserService.getById.and.returnValue(throwError(() => errorResponse));

      component.loadUserData();

      expect(component.errorMessage).toBe('Failed to load user');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load user'
        })
      );
    });

    it('should handle error without message', () => {
      const errorResponse = {};
      mockUserService.getById.and.returnValue(throwError(() => errorResponse));

      component.loadUserData();

      expect(component.errorMessage).toBe('Failed to load user data');
    });

    it('should log error to console', () => {
      const errorResponse = { message: 'Test error' };
      mockUserService.getById.and.returnValue(throwError(() => errorResponse));

      component.loadUserData();

      expect(console.error).toHaveBeenCalledWith('Error loading user data:', errorResponse);
    });
  });

  describe('togglePasswordVisibility', () => {
    it('should toggle showPassword from false to true', () => {
      component.showPassword = false;

      component.togglePasswordVisibility();

      expect(component.showPassword).toBe(true);
    });

    it('should toggle showPassword from true to false', () => {
      component.showPassword = true;

      component.togglePasswordVisibility();

      expect(component.showPassword).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      component.showPassword = false;

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(true);

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(false);

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(true);
    });
  });

  describe('saveSettings - Validation', () => {
    it('should reject empty username', () => {
      component.username = '';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Username must be at least 3 characters'
        })
      );
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });

    it('should reject username shorter than 3 characters', () => {
      component.username = 'ab';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Username must be at least 3 characters'
        })
      );
    });

    it('should reject username with only whitespace', () => {
      component.username = '   ';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Username must be at least 3 characters'
        })
      );
    });

    it('should reject empty email', () => {
      component.username = 'johndoe';
      component.email = '';
      component.fullname = 'John Doe';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid email address'
        })
      );
    });

    it('should reject invalid email without @', () => {
      component.username = 'johndoe';
      component.email = 'invalidemail.com';
      component.fullname = 'John Doe';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid email address'
        })
      );
    });

    it('should reject empty fullname', () => {
      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = '';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter your full name'
        })
      );
    });

    it('should reject fullname shorter than 2 characters', () => {
      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = 'J';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter your full name'
        })
      );
    });

    it('should reject fullname with only whitespace', () => {
      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = '   ';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter your full name'
        })
      );
    });

    it('should reject password shorter than 6 characters when provided', () => {
      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';
      component.password = '12345';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Password must be at least 6 characters (leave empty to keep current password)'
        })
      );
    });

    it('should accept empty password', () => {
      component.userId = 'user123';
      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';
      component.password = '';
      component.address = '123 Main St';
      component.contactNo = '1234567890';
      component.dob = '1990-01-01';
      component.gender = 'MALE';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalled();
    });

    it('should accept password with 6 or more characters', () => {
      component.userId = 'user123';
      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';
      component.password = '123456';
      component.address = '123 Main St';
      component.contactNo = '1234567890';
      component.dob = '1990-01-01';
      component.gender = 'MALE';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalled();
    });
  });

  describe('saveSettings - Success', () => {
    beforeEach(() => {
      component.userId = 'user123';
      component.username = 'johndoe';
      component.email = 'john@example.com';
      component.fullname = 'John Doe';
      component.password = '';
      component.address = '123 Main St';
      component.contactNo = '1234567890';
      component.dob = '1990-01-01';
      component.gender = 'MALE';
      localStorage.setItem('email', 'old@example.com');
    });

    it('should save settings successfully', async () => {
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();
      await Promise.resolve();

      expect(component.isSaving).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'success',
          title: 'Success',
          text: 'Settings updated successfully'
        })
      );
    });

    it('should call updateUser with correct data', () => {
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
        username: 'johndoe',
        fullname: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        contact_no: '1234567890',
        dob: '1990-01-01',
        gender: 'MALE',
        password: ''
      });
    });

    it('should trim whitespace from fields', () => {
      component.username = '  johndoe  ';
      component.fullname = '  John Doe  ';
      component.email = '  john@example.com  ';
      component.address = '  123 Main St  ';
      component.contactNo = '  1234567890  ';
      component.password = '  password123  ';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123',
        jasmine.objectContaining({
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St',
          contact_no: '1234567890',
          password: 'password123'
        })
      );
    });

    it('should update originalData after successful save', async () => {
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();
      await Promise.resolve();

      expect(component.originalData).toEqual({
        username: 'johndoe',
        fullname: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        contactNo: '1234567890',
        dob: '1990-01-01',
        gender: 'MALE'
      });
    });

    it('should clear password after successful save', async () => {
      component.password = 'newpassword123';
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();
      await Promise.resolve();

      expect(component.password).toBe('');
    });

    it('should update email in localStorage when changed', async () => {
      component.email = 'new@example.com';
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();
      await Promise.resolve();

      expect(localStorage.getItem('email')).toBe('new@example.com');
    });

    it('should not update email in localStorage when unchanged', async () => {
      component.email = 'old@example.com';
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();
      await Promise.resolve();

      expect(localStorage.getItem('email')).toBe('old@example.com');
    });

    it('should clear errorMessage when saving starts', () => {
      component.errorMessage = 'Previous error';
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(component.errorMessage).toBe('');
    });
  });

  describe('saveSettings - Error Handling', () => {
    beforeEach(() => {
      component.userId = 'user123';
      component.username = 'johndoe';
      component.email = 'john@example.com';
      component.fullname = 'John Doe';
      component.password = '';
      component.address = '123 Main St';
      component.contactNo = '1234567890';
      component.dob = '1990-01-01';
      component.gender = 'MALE';
    });

    it('should handle HTTP error', () => {
      const errorResponse = { message: 'Update failed' };
      mockUserService.updateUser.and.returnValue(throwError(() => errorResponse));

      component.saveSettings();

      expect(component.errorMessage).toBe('Update failed');
      expect(component.isSaving).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Update Failed',
          text: 'Update failed'
        })
      );
    });

    it('should handle error without message', () => {
      const errorResponse = {};
      mockUserService.updateUser.and.returnValue(throwError(() => errorResponse));

      component.saveSettings();

      expect(component.errorMessage).toBe('Failed to update settings');
      expect(component.isSaving).toBe(false);
    });

    it('should log error to console', () => {
      const errorResponse = { message: 'Test error' };
      mockUserService.updateUser.and.returnValue(throwError(() => errorResponse));

      component.saveSettings();

      expect(console.error).toHaveBeenCalledWith('Error updating settings:', errorResponse);
    });
  });

  describe('resetForm', () => {
    beforeEach(() => {
      component.originalData = {
        username: 'originaldoe',
        fullname: 'Original Doe',
        email: 'original@example.com',
        address: '456 Original St',
        contactNo: '0987654321',
        dob: '1985-05-05',
        gender: 'FEMALE'
      };
    });

    it('should reset all fields to originalData', () => {
      component.username = 'modified';
      component.fullname = 'Modified Name';
      component.email = 'modified@example.com';
      component.address = 'Modified Address';
      component.contactNo = '1111111111';
      component.dob = '2000-01-01';
      component.gender = 'MALE';
      component.password = 'password123';
      component.showPassword = true;

      component.resetForm();

      expect(component.username).toBe('originaldoe');
      expect(component.fullname).toBe('Original Doe');
      expect(component.email).toBe('original@example.com');
      expect(component.address).toBe('456 Original St');
      expect(component.contactNo).toBe('0987654321');
      expect(component.dob).toBe('1985-05-05');
      expect(component.gender).toBe('FEMALE');
    });

    it('should clear password field', () => {
      component.password = 'somepassword';

      component.resetForm();

      expect(component.password).toBe('');
    });

    it('should hide password', () => {
      component.showPassword = true;

      component.resetForm();

      expect(component.showPassword).toBe(false);
    });

    it('should reset multiple times correctly', () => {
      component.username = 'test1';
      component.resetForm();
      expect(component.username).toBe('originaldoe');

      component.username = 'test2';
      component.resetForm();
      expect(component.username).toBe('originaldoe');
    });

    it('should handle empty originalData', () => {
      component.originalData = {};

      expect(() => component.resetForm()).not.toThrow();
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      component.userId = 'user123';
    });

    it('should add subscription when loading user data', () => {
      const mockUserData = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'john@example.com'
        }]
      };
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should add subscription when saving settings', () => {
      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';
      component.address = '123 Main St';
      component.contactNo = '1234567890';
      component.dob = '1990-01-01';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should add multiple subscriptions', () => {
      const mockUserData = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'john@example.com'
        }]
      };
      mockUserService.getById.and.returnValue(of(mockUserData));
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.loadUserData();

      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';
      component.address = '123 Main St';
      component.contactNo = '1234567890';
      component.dob = '1990-01-01';
      component.saveSettings();

      expect((component as any).subscriptions.length).toBe(2);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      const mockUserData = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'john@example.com'
        }]
      };
      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      const subscriptions = (component as any).subscriptions;
      const sub = subscriptions[0];
      spyOn(sub, 'unsubscribe');

      component.ngOnDestroy();

      expect(sub.unsubscribe).toHaveBeenCalled();
    });

    it('should handle empty subscriptions array on ngOnDestroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe multiple subscriptions on ngOnDestroy', () => {
      const mockUserData = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'john@example.com'
        }]
      };
      mockUserService.getById.and.returnValue(of(mockUserData));
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.loadUserData();

      component.username = 'johndoe';
      component.email = 'test@example.com';
      component.fullname = 'John Doe';
      component.address = '123 Main St';
      component.contactNo = '1234567890';
      component.dob = '1990-01-01';
      component.saveSettings();

      const subscriptions = (component as any).subscriptions;
      subscriptions.forEach((sub: any) => spyOn(sub, 'unsubscribe'));

      component.ngOnDestroy();

      subscriptions.forEach((sub: any) => {
        expect(sub.unsubscribe).toHaveBeenCalled();
      });
    });
  });
});
