/**
 * Unit Tests for EmployeeSettingsComponent
 *
 * Tests employee profile management, form validation, and updates
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmployeeSettingsComponent } from './employee.settings.component';
import { UserService } from 'src/app/service/customer/user.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('EmployeeSettingsComponent', () => {
  let component: EmployeeSettingsComponent;
  let fixture: ComponentFixture<EmployeeSettingsComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', ['getById', 'updateUser']);

    await TestBed.configureTestingModule({
      declarations: [EmployeeSettingsComponent],
      imports: [FormsModule, CommonModule],
      providers: [
        { provide: UserService, useValue: mockUserService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeSettingsComponent);
    component = fixture.componentInstance;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false, value: true }));

    localStorage.setItem('userId', '123');
    localStorage.setItem('email', 'employee@example.com');

    mockUserService.getById.and.returnValue(of({
      data: [{
        username: 'employeeuser',
        fullname: 'Employee User',
        email: 'employee@example.com',
        address: '123 Work St',
        contact_no: '+1234567890',
        dob: '1990-01-01',
        gender: 'MALE'
      }]
    }));
  });

  afterEach(() => {
    localStorage.clear();
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load userId and email from localStorage on ngOnInit', () => {
      component.ngOnInit();

      expect(component.userId).toBe('123');
      expect(component.email).toBe('employee@example.com');
    });

    it('should show error if userId not found in localStorage', () => {
      localStorage.removeItem('userId');

      component.ngOnInit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'User session not found. Please log in again.'
        })
      );
    });

    it('should call loadUserData on ngOnInit if userId exists', () => {
      spyOn(component, 'loadUserData');

      component.ngOnInit();

      expect(component.loadUserData).toHaveBeenCalled();
    });

    it('should initialize with default gender as MALE', () => {
      expect(component.gender).toBe('MALE');
    });

    it('should initialize state flags correctly', () => {
      expect(component.isLoading).toBe(false);
      expect(component.isSaving).toBe(false);
      expect(component.showPassword).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Load User Data', () => {
    it('should load user data successfully', () => {
      component.ngOnInit();

      expect(component.username).toBe('employeeuser');
      expect(component.fullname).toBe('Employee User');
      expect(component.email).toBe('employee@example.com');
      expect(component.address).toBe('123 Work St');
      expect(component.contactNo).toBe('+1234567890');
      expect(component.gender).toBe('MALE');
      expect(component.dob).toBe('1990-01-01');
    });

    it('should store original data for reset', () => {
      component.ngOnInit();

      expect(component.originalData).toEqual({
        username: 'employeeuser',
        fullname: 'Employee User',
        email: 'employee@example.com',
        address: '123 Work St',
        contactNo: '+1234567890',
        dob: '1990-01-01',
        gender: 'MALE'
      });
    });

    it('should handle null data response', () => {
      mockUserService.getById.and.returnValue(of({ data: null }));

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

    it('should handle empty data array', () => {
      mockUserService.getById.and.returnValue(of({ data: [] }));

      component.loadUserData();

      expect(component.errorMessage).toBe('User data not found');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          text: 'Could not load user data'
        })
      );
    });

    it('should handle error loading user data', () => {
      const error = new Error('Network error');
      mockUserService.getById.and.returnValue(throwError(() => error));

      component.loadUserData();

      expect(component.errorMessage).toBe('Network error');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error'
        })
      );
    });
  });

  describe('Save Settings - Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should reject username shorter than 3 characters', () => {
      component.username = 'ab';

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

    it('should reject invalid email without @', () => {
      component.email = 'invalidemail.com';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid email address'
        })
      );
    });

    it('should reject fullname shorter than 2 characters', () => {
      component.fullname = 'A';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter your full name'
        })
      );
    });

    it('should reject password shorter than 6 characters if provided', () => {
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

    it('should allow empty password', () => {
      component.password = '';
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalled();
    });

    it('should accept password with exactly 6 characters', () => {
      component.password = '123456';
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalled();
    });
  });

  describe('Save Settings - Success', () => {
    beforeEach(() => {
      component.ngOnInit();
      mockUserService.updateUser.and.returnValue(of({ message: 'Updated successfully' }));
    });

    it('should save settings successfully', () => {
      component.username = 'newusername';
      component.fullname = 'New Name';

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        '123',
        jasmine.objectContaining({
          username: 'newusername',
          fullname: 'New Name',
          email: 'employee@example.com',
          address: '123 Work St',
          contact_no: '+1234567890',
          dob: '1990-01-01',
          gender: 'MALE',
          password: ''
        })
      );
    });

    it('should update originalData after successful save', async () => {
      component.username = 'updateduser';

      component.saveSettings();
      await Promise.resolve();

      expect(component.originalData.username).toBe('updateduser');
    });

    it('should clear password field after successful save', async () => {
      component.password = 'newpass123';

      component.saveSettings();
      await Promise.resolve();

      expect(component.password).toBe('');
    });

    it('should update localStorage email if changed', async () => {
      component.email = 'newemail@example.com';

      component.saveSettings();
      await Promise.resolve();

      expect(localStorage.getItem('email')).toBe('newemail@example.com');
    });

    it('should not update localStorage email if unchanged', async () => {
      localStorage.setItem('email', 'employee@example.com');
      component.email = 'employee@example.com';

      component.saveSettings();
      await Promise.resolve();

      expect(localStorage.getItem('email')).toBe('employee@example.com');
    });

    it('should show success message', () => {
      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'success',
          title: 'Success',
          text: 'Settings updated successfully'
        })
      );
    });

    it('should trim whitespace from fields', () => {
      component.username = '  trimuser  ';
      component.fullname = '  Trim Name  ';
      component.address = '  123 St  ';

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        '123',
        jasmine.objectContaining({
          username: 'trimuser',
          fullname: 'Trim Name',
          address: '123 St'
        })
      );
    });
  });

  describe('Save Settings - Error Handling', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle update error', () => {
      const error = new Error('Update failed');
      mockUserService.updateUser.and.returnValue(throwError(() => error));

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

    it('should log error to console', () => {
      spyOn(console, 'error');
      const error = new Error('Test error');
      mockUserService.updateUser.and.returnValue(throwError(() => error));

      component.saveSettings();

      expect(console.error).toHaveBeenCalledWith('Error updating settings:', error);
    });
  });

  describe('Toggle Password Visibility', () => {
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

    it('should toggle multiple times', () => {
      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(true);

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(false);

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(true);
    });
  });

  describe('Reset Form', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should reset all fields to original data', () => {
      component.username = 'changed';
      component.fullname = 'Changed Name';
      component.email = 'changed@example.com';
      component.address = 'Changed Address';
      component.contactNo = '9999999999';
      component.dob = '2000-01-01';
      component.gender = 'FEMALE';
      component.password = 'newpassword';
      component.showPassword = true;

      component.resetForm();

      expect(component.username).toBe('employeeuser');
      expect(component.fullname).toBe('Employee User');
      expect(component.email).toBe('employee@example.com');
      expect(component.address).toBe('123 Work St');
      expect(component.contactNo).toBe('+1234567890');
      expect(component.dob).toBe('1990-01-01');
      expect(component.gender).toBe('MALE');
      expect(component.password).toBe('');
      expect(component.showPassword).toBe(false);
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
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should add subscriptions to array', () => {
      expect((component as any).subscriptions.length).toBeGreaterThanOrEqual(1);
    });

    it('should unsubscribe on ngOnDestroy', () => {
      const sub = (component as any).subscriptions[0];
      spyOn(sub, 'unsubscribe');

      component.ngOnDestroy();

      expect(sub.unsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple subscriptions', () => {
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));
      component.saveSettings();

      expect((component as any).subscriptions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Date Formatting', () => {
    it('should format date to YYYY-MM-DD format', () => {
      mockUserService.getById.and.returnValue(of({
        data: [{
          username: 'user',
          fullname: 'User',
          email: 'user@test.com',
          address: 'Address',
          contact_no: '1234567890',
          dob: '2000-12-25T00:00:00.000Z',
          gender: 'MALE'
        }]
      }));

      component.loadUserData();

      expect(component.dob).toBe('2000-12-25');
    });

    it('should handle missing dob gracefully', () => {
      mockUserService.getById.and.returnValue(of({
        data: [{
          username: 'user',
          fullname: 'User',
          email: 'user@test.com',
          address: 'Address',
          contact_no: '1234567890',
          gender: 'MALE'
        }]
      }));

      component.loadUserData();

      expect(component.dob).toBe('');
    });
  });
});
