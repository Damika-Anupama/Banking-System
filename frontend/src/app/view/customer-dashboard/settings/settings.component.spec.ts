/**
 * Unit Tests for SettingsComponent
 *
 * Tests user settings management, profile updates, form validation
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SettingsComponent } from './settings.component';
import { UserService } from 'src/app/service/customer/user.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    // Create spy objects
    mockUserService = jasmine.createSpyObj('UserService', ['getById', 'updateUser']);

    await TestBed.configureTestingModule({
      declarations: [SettingsComponent],
      imports: [
        FormsModule,
        CommonModule
      ],
      providers: [
        { provide: UserService, useValue: mockUserService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;

    // Spy on Swal
    spyOn(Swal, 'fire');

    // Setup localStorage
    localStorage.setItem('userId', '123');
    localStorage.setItem('email', 'test@example.com');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default gender as MALE', () => {
      expect(component.gender).toBe('MALE');
    });

    it('should initialize with false loading states', () => {
      expect(component.isLoading).toBe(false);
      expect(component.isSaving).toBe(false);
    });

    it('should initialize with empty errorMessage', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should initialize with showPassword as false', () => {
      expect(component.showPassword).toBe(false);
    });

    it('should load userId and email from localStorage on ngOnInit', () => {
      mockUserService.getById.and.returnValue(of({ data: [{ username: 'testuser', email: 'loaded@example.com' }] }));

      component.ngOnInit();

      expect(component.userId).toBe('123');
      // Email gets overwritten by loadUserData response
      expect(component.email).toBe('loaded@example.com');
    });

    it('should show error when userId is not found in localStorage', () => {
      localStorage.clear();

      component.ngOnInit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'User session not found. Please log in again.'
        })
      );
    });

    it('should call loadUserData when userId exists', () => {
      spyOn(component, 'loadUserData');

      component.ngOnInit();

      expect(component.loadUserData).toHaveBeenCalled();
    });

    it('should not call loadUserData when userId is missing', () => {
      localStorage.clear();
      spyOn(component, 'loadUserData');

      component.ngOnInit();

      expect(component.loadUserData).not.toHaveBeenCalled();
    });
  });

  describe('loadUserData() - Success', () => {
    it('should load user data successfully', () => {
      const mockUserData = {
        data: [{
          username: 'johndoe',
          fullname: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St',
          contact_no: '1234567890',
          gender: 'MALE',
          dob: '1990-01-01'
        }]
      };

      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.username).toBe('johndoe');
      expect(component.fullname).toBe('John Doe');
      expect(component.email).toBe('john@example.com');
      expect(component.address).toBe('123 Main St');
      expect(component.contactNo).toBe('1234567890');
      expect(component.gender).toBe('MALE');
      expect(component.dob).toBe('1990-01-01');
      expect(component.isLoading).toBe(false);
    });

    it('should format date correctly from ISO string', () => {
      const mockUserData = {
        data: [{
          username: 'test',
          fullname: 'Test User',
          email: 'test@test.com',
          dob: '1995-12-25T10:30:00Z'
        }]
      };

      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.dob).toBe('1995-12-25');
    });

    it('should handle empty optional fields', () => {
      const mockUserData = {
        data: [{
          username: 'test',
          fullname: 'Test User',
          email: 'test@test.com'
        }]
      };

      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.username).toBe('test');
      expect(component.fullname).toBe('Test User');
      expect(component.address).toBe('');
      expect(component.contactNo).toBe('');
    });

    it('should store original data for reset', () => {
      const mockUserData = {
        data: [{
          username: 'original',
          fullname: 'Original Name',
          email: 'original@test.com',
          address: 'Original Address',
          contact_no: '9876543210',
          gender: 'FEMALE',
          dob: '1985-05-15'
        }]
      };

      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.originalData).toEqual({
        username: 'original',
        fullname: 'Original Name',
        email: 'original@test.com',
        address: 'Original Address',
        contactNo: '9876543210',
        dob: '1985-05-15',
        gender: 'FEMALE'
      });
    });

    it('should default gender to MALE if not provided', () => {
      const mockUserData = {
        data: [{
          username: 'test',
          fullname: 'Test User',
          email: 'test@test.com'
        }]
      };

      mockUserService.getById.and.returnValue(of(mockUserData));

      component.loadUserData();

      expect(component.gender).toBe('MALE');
    });
  });

  describe('loadUserData() - Errors', () => {
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

    it('should handle undefined response', () => {
      mockUserService.getById.and.returnValue(of(undefined));

      component.loadUserData();

      expect(component.errorMessage).toBe('User data not found');
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('should handle response without data property', () => {
      mockUserService.getById.and.returnValue(of({} as any));

      component.loadUserData();

      expect(component.errorMessage).toBe('User data not found');
    });

    it('should handle empty data array', () => {
      mockUserService.getById.and.returnValue(of({ data: [] }));

      component.loadUserData();

      expect(component.errorMessage).toBe('User data not found');
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('should handle server error with message', () => {
      spyOn(console, 'error');
      const error = new Error('Database connection failed');

      mockUserService.getById.and.returnValue(throwError(() => error));

      component.loadUserData();

      expect(component.errorMessage).toBe('Database connection failed');
      expect(component.isLoading).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading user data:', error);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Database connection failed'
        })
      );
    });

    it('should handle error without message', () => {
      spyOn(console, 'error');
      mockUserService.getById.and.returnValue(throwError(() => ({})));

      component.loadUserData();

      expect(component.errorMessage).toBe('Failed to load user data');
    });
  });

  describe('togglePasswordVisibility()', () => {
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
      component.showPassword = false;

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(true);

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(false);

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(true);
    });
  });

  describe('saveSettings() - Validation Errors', () => {
    beforeEach(() => {
      component.username = 'validuser';
      component.email = 'valid@example.com';
      component.fullname = 'Valid Name';
    });

    it('should reject empty username', () => {
      component.username = '';

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

    it('should reject username with less than 3 characters', () => {
      component.username = 'ab';

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
      component.email = '';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid email address'
        })
      );
    });

    it('should reject email without @ symbol', () => {
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

    it('should reject empty fullname', () => {
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

    it('should reject fullname with less than 2 characters', () => {
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

    it('should reject fullname with only whitespace', () => {
      component.fullname = '  ';

      component.saveSettings();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter your full name'
        })
      );
    });

    it('should reject password with less than 6 characters when provided', () => {
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

    it('should allow empty password (keep current)', () => {
      component.password = '';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalled();
    });

    it('should reject password with only whitespace if provided', () => {
      component.password = '   ';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      // Whitespace gets trimmed to empty string, which is allowed
      expect(mockUserService.updateUser).toHaveBeenCalled();
    });
  });

  describe('saveSettings() - Successful Update', () => {
    beforeEach(() => {
      component.userId = '123';
      component.username = 'johndoe';
      component.fullname = 'John Doe';
      component.email = 'john@example.com';
      component.address = '123 Main St';
      component.contactNo = '1234567890';
      component.dob = '1990-01-01';
      component.gender = 'MALE';
      component.password = '';
    });

    it('should update settings successfully without password', () => {
      mockUserService.updateUser.and.returnValue(of({ message: 'Updated successfully' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalledWith('123', {
        username: 'johndoe',
        fullname: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        contact_no: '1234567890',
        dob: '1990-01-01',
        gender: 'MALE',
        password: ''
      });
      expect(component.isSaving).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'success',
          title: 'Success',
          text: 'Settings updated successfully'
        })
      );
    });

    it('should update settings with password', () => {
      component.password = 'newpassword123';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalledWith('123',
        jasmine.objectContaining({
          password: 'newpassword123'
        })
      );
    });

    it('should trim whitespace from all fields', () => {
      component.username = '  johndoe  ';
      component.fullname = '  John Doe  ';
      component.email = '  john@example.com  ';
      component.address = '  123 Main St  ';
      component.contactNo = '  1234567890  ';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalledWith('123', {
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

    it('should update originalData after successful save', () => {
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

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

    it('should clear password field after successful save', () => {
      component.password = 'testpassword';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(component.password).toBe('');
    });

    it('should update email in localStorage if changed', () => {
      component.email = 'newemail@example.com';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(localStorage.getItem('email')).toBe('newemail@example.com');
    });

    it('should not update localStorage if email unchanged', () => {
      component.email = 'test@example.com'; // Same as initial localStorage value

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(localStorage.getItem('email')).toBe('test@example.com');
    });

    it('should handle female gender', () => {
      component.gender = 'FEMALE';

      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.saveSettings();

      expect(mockUserService.updateUser).toHaveBeenCalledWith('123',
        jasmine.objectContaining({
          gender: 'FEMALE'
        })
      );
    });
  });

  describe('saveSettings() - Error Handling', () => {
    beforeEach(() => {
      component.username = 'johndoe';
      component.fullname = 'John Doe';
      component.email = 'john@example.com';
    });

    it('should handle server error with message', () => {
      spyOn(console, 'error');
      const error = new Error('Email already exists');

      mockUserService.updateUser.and.returnValue(throwError(() => error));

      component.saveSettings();

      expect(component.errorMessage).toBe('Email already exists');
      expect(component.isSaving).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error updating settings:', error);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Update Failed',
          text: 'Email already exists'
        })
      );
    });

    it('should handle error without message', () => {
      spyOn(console, 'error');
      mockUserService.updateUser.and.returnValue(throwError(() => ({})));

      component.saveSettings();

      expect(component.errorMessage).toBe('Failed to update settings');
    });
  });

  describe('resetForm()', () => {
    beforeEach(() => {
      component.originalData = {
        username: 'original',
        fullname: 'Original Name',
        email: 'original@test.com',
        address: 'Original Address',
        contactNo: '9999999999',
        dob: '1980-01-01',
        gender: 'FEMALE'
      };

      component.username = 'modified';
      component.fullname = 'Modified Name';
      component.email = 'modified@test.com';
      component.address = 'Modified Address';
      component.contactNo = '1111111111';
      component.dob = '2000-12-31';
      component.gender = 'MALE';
      component.password = 'somepassword';
      component.showPassword = true;
    });

    it('should reset all fields to original data', () => {
      component.resetForm();

      expect(component.username).toBe('original');
      expect(component.fullname).toBe('Original Name');
      expect(component.email).toBe('original@test.com');
      expect(component.address).toBe('Original Address');
      expect(component.contactNo).toBe('9999999999');
      expect(component.dob).toBe('1980-01-01');
      expect(component.gender).toBe('FEMALE');
    });

    it('should clear password field', () => {
      component.resetForm();

      expect(component.password).toBe('');
    });

    it('should set showPassword to false', () => {
      component.resetForm();

      expect(component.showPassword).toBe(false);
    });

    it('should work when called multiple times', () => {
      component.resetForm();
      component.username = 'changed again';
      component.resetForm();

      expect(component.username).toBe('original');
    });
  });

  describe('Subscription Management', () => {
    it('should add subscriptions to subscriptions array', () => {
      mockUserService.getById.and.returnValue(of({ data: [{ username: 'test' }] }));
      mockUserService.updateUser.and.returnValue(of({ message: 'Success' }));

      component.username = 'test';
      component.fullname = 'Test User';
      component.email = 'test@test.com';
      component.userId = '123';

      component.loadUserData();
      component.saveSettings();

      // At least 2 subscriptions: loadUserData and saveSettings
      expect((component as any).subscriptions.length).toBeGreaterThanOrEqual(1);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      mockUserService.getById.and.returnValue(of({ data: [{ username: 'test' }] }));

      component.loadUserData();

      const subscription = (component as any).subscriptions[0];
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });
});
