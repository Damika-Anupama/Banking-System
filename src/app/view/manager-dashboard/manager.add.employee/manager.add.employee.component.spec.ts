/**
 * Unit Tests for ManagerAddEmployeeComponent
 *
 * Tests employee registration, form validation, branch ID handling, and error handling
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ManagerAddEmployeeComponent } from './manager.add.employee.component';
import { AddEmployeeService } from 'src/app/service/manager/add.employee.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';

describe('ManagerAddEmployeeComponent', () => {
  let toastService: ToastService;
  let component: ManagerAddEmployeeComponent;
  let fixture: ComponentFixture<ManagerAddEmployeeComponent>;
  let mockAddEmployeeService: jasmine.SpyObj<AddEmployeeService>;

  beforeEach(async () => {
    mockAddEmployeeService = jasmine.createSpyObj('AddEmployeeService', ['saveEmployee']);

    await TestBed.configureTestingModule({
      declarations: [ManagerAddEmployeeComponent],
      imports: [FormsModule, CommonModule],
      providers: [
        { provide: AddEmployeeService, useValue: mockAddEmployeeService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerAddEmployeeComponent);
    component = fixture.componentInstance;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false, value: true }));

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'success');
    spyOn(toastService, 'error');
  });

  afterEach(() => {
    localStorage.clear();
    fixture.destroy();
  });

  describe('inline field validation', () => {
    it('never opens a dialog: nothing on this form is irreversible', () => {
      component.submit();

      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('reports every problem at once rather than one error at a time', () => {
      component.submit();

      expect(component.errorFor('fullname')).toBe("Enter the employee's full name.");
      expect(component.errorFor('username')).toBe('Choose a username.');
      expect(component.errorFor('password')).toBe('Set a password.');
      expect(component.errorFor('email')).toBe('Enter an email address.');
      expect(component.errorFor('dob')).toBe('Enter a date of birth.');
    });

    it('hides an error until the user has left the field', () => {
      component.email = '';

      // Untouched: the form must not nag before the user has engaged with it.
      expect(component.errorFor('email')).toBeNull();
      expect(component.fieldErrors['email']).toBe('Enter an email address.');

      component.markTouched('email');
      expect(component.errorFor('email')).toBe('Enter an email address.');
    });

    it('clears the error once the field is corrected', () => {
      component.email = 'nope';
      component.markTouched('email');
      expect(component.errorFor('email')).toBe('Enter a valid email address.');

      component.email = 'someone@example.com';
      expect(component.errorFor('email')).toBeNull();
    });

    it('points a touched, invalid field at its error message', () => {
      component.markTouched('email');
      component.email = 'nope';
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('[name="email"]');
      expect(input.getAttribute('aria-invalid')).toBe('true');

      // The message must exist at the id the input points to, or a screen
      // reader announces nothing at all.
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBe('email-error');

      const message = fixture.nativeElement.querySelector(`#${describedBy}`);
      expect(message).not.toBeNull();
      expect(message.getAttribute('role')).toBe('alert');
    });
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form fields', () => {
      expect(component.username).toBe('');
      expect(component.password).toBe('');
      expect(component.fullname).toBe('');
      expect(component.gender).toBe('');
      expect(component.dob).toBe('');
      expect(component.address).toBe('');
      expect(component.email).toBe('');
      expect(component.contact_no).toBe('');
    });

    it('should initialize with type as EMPLOYEE', () => {
      expect(component.type).toBe('EMPLOYEE');
    });

    it('should initialize with null branch_id', () => {
      expect(component.branch_id).toBeNull();
    });

    it('should load branch_id from localStorage on ngOnInit', () => {
      localStorage.setItem('branchId', '123');

      component.ngOnInit();

      expect(component.branch_id).toBe('123');
    });

    it('should show error when branch_id not found in localStorage', () => {
      component.ngOnInit();

      expect(component.branch_id).toBeNull();
      expect(toastService.error).toHaveBeenCalledWith(
        'Branch not found',
        'Branch ID not found. Please log in again.'
      );
    });
  });

  describe('Form Validation - Empty Fields', () => {
    it('should reject when all fields are empty', () => {
      component.submit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Check the highlighted fields',
        jasmine.any(String)
      );
      expect(component.hasFieldErrors).toBe(true);
      expect(mockAddEmployeeService.saveEmployee).not.toHaveBeenCalled();
    });

    it('should reject when username is empty', () => {
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Check the highlighted fields',
        jasmine.any(String)
      );
      expect(component.hasFieldErrors).toBe(true);
    });

    it('should reject password shorter than 6 characters', () => {
      component.username = 'johndoe';
      component.password = '12345';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(component.errorFor('password')).toBe('Use at least 6 characters.');
    });
  });

  describe('Form Validation - Whitespace', () => {
    it('should reject username with only whitespace', () => {
      component.username = '   ';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Check the highlighted fields',
        jasmine.any(String)
      );
      expect(component.hasFieldErrors).toBe(true);
    });
  });

  describe('Branch ID Validation', () => {
    it('should reject when branch_id is missing during submit', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';
      component.branch_id = null;

      component.submit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Branch not found',
        'Branch ID is missing. Please log in again.'
      );
      expect(mockAddEmployeeService.saveEmployee).not.toHaveBeenCalled();
    });
  });

  describe('Gender Normalization', () => {
    beforeEach(() => {
      localStorage.setItem('branchId', '123');
      component.ngOnInit();
    });

    it('should normalize male to MALE', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockAddEmployeeService.saveEmployee.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockAddEmployeeService.saveEmployee).toHaveBeenCalledWith(
        jasmine.objectContaining({ gender: 'MALE' })
      );
    });

    it('should reject invalid gender', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'invalid';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(component.errorFor('gender')).toBe('Select a valid gender.');
    });
  });

  describe('Email Validation', () => {
    beforeEach(() => {
      localStorage.setItem('branchId', '123');
      component.ngOnInit();
    });

    it('should reject invalid email without @', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'invalidemail.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(component.errorFor('email')).toBe('Enter a valid email address.');
    });
  });

  describe('Contact Number Validation', () => {
    beforeEach(() => {
      localStorage.setItem('branchId', '123');
      component.ngOnInit();
    });

    it('should reject contact with less than 10 digits', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '123456789';

      component.submit();

      expect(component.errorFor('contact_no')).toBe('Enter a valid contact number.');
    });
  });

  describe('Successful Employee Registration', () => {
    beforeEach(() => {
      localStorage.setItem('branchId', '123');
      component.ngOnInit();
    });

    it('should register employee successfully', async () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockAddEmployeeService.saveEmployee.and.returnValue(of({ message: 'Employee added successfully' }));

      component.submit();
      await Promise.resolve();

      expect(component.isLoading).toBe(false);
      expect(toastService.success).toHaveBeenCalledWith(
        'Employee added',
        'Employee added successfully'
      );
    });

    it('should include branch_id in request body', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockAddEmployeeService.saveEmployee.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockAddEmployeeService.saveEmployee).toHaveBeenCalledWith(
        jasmine.objectContaining({
          branch_id: '123',
          type: 'EMPLOYEE'
        })
      );
    });

    it('should reset form after successful registration', async () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockAddEmployeeService.saveEmployee.and.returnValue(of({ message: 'Success' }));

      component.submit();
      await Promise.resolve();

      expect(component.username).toBe('');
      expect(component.password).toBe('');
      expect(component.fullname).toBe('');
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorage.setItem('branchId', '123');
      component.ngOnInit();
    });

    it('should handle null response', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockAddEmployeeService.saveEmployee.and.returnValue(of(null));

      component.submit();

      expect(component.errorMessage).toBe('No response received from server');
      expect(toastService.error).toHaveBeenCalledWith(
        'Could not add employee',
        'No response received from server'
      );
    });

    it('should handle HTTP error', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      const errorResponse = {
        error: { message: 'Username already exists' }
      };

      mockAddEmployeeService.saveEmployee.and.returnValue(throwError(() => errorResponse));

      component.submit();

      expect(component.errorMessage).toBe('Username already exists');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Try-Catch Error Handling', () => {
    beforeEach(() => {
      localStorage.setItem('branchId', '123');
      component.ngOnInit();
    });

    it('should catch JavaScript errors during submit', () => {
      spyOn(console, 'error');

      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockAddEmployeeService.saveEmployee.and.callFake(() => {
        throw new Error('Unexpected error');
      });

      component.submit();

      expect(console.error).toHaveBeenCalledWith('Error in submit process:', jasmine.any(Error));
      expect(component.errorMessage).toBe('An unexpected error occurred');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Private Method Tests', () => {
    describe('normalizeGender', () => {
      it('should return null for empty string', () => {
        const result = (component as any).normalizeGender('');
        expect(result).toBeNull();
      });

      it('should normalize male correctly', () => {
        const result = (component as any).normalizeGender('male');
        expect(result).toBe('MALE');
      });

      it('should normalize female correctly', () => {
        const result = (component as any).normalizeGender('female');
        expect(result).toBe('FEMALE');
      });

      it('should normalize other correctly', () => {
        const result = (component as any).normalizeGender('other');
        expect(result).toBe('OTHER');
      });

      it('should return null for invalid gender', () => {
        const result = (component as any).normalizeGender('invalid');
        expect(result).toBeNull();
      });
    });

    describe('isValidEmail', () => {
      it('should return false for empty string', () => {
        const result = (component as any).isValidEmail('');
        expect(result).toBe(false);
      });

      it('should return true for valid email', () => {
        const result = (component as any).isValidEmail('test@example.com');
        expect(result).toBe(true);
      });

      it('should return false for invalid email', () => {
        const result = (component as any).isValidEmail('invalid');
        expect(result).toBe(false);
      });
    });

    describe('isValidContactNumber', () => {
      it('should return false for empty string', () => {
        const result = (component as any).isValidContactNumber('');
        expect(result).toBe(false);
      });

      it('should return true for valid phone', () => {
        const result = (component as any).isValidContactNumber('+1234567890');
        expect(result).toBe(true);
      });

      it('should return false for short phone', () => {
        const result = (component as any).isValidContactNumber('123456789');
        expect(result).toBe(false);
      });
    });

    describe('validateForm', () => {
      it('should return true for valid form', () => {
        component.username = 'johndoe';
        component.password = 'password123';
        component.fullname = 'John Doe';
        component.gender = 'male';
        component.dob = '1990-01-01';
        component.address = '123 Main St';
        component.email = 'john@example.com';
        component.contact_no = '+1234567890';

        const result = (component as any).validateForm();

        expect(result).toBe(true);
      });

      it('should return false for empty fields', () => {
        const result = (component as any).validateForm();

        expect(result).toBe(false);
      });
    });

    describe('resetForm', () => {
      it('should reset all form fields', () => {
        component.username = 'test';
        component.password = 'test123';
        component.fullname = 'Test User';
        component.errorMessage = 'Error';

        (component as any).resetForm();

        expect(component.username).toBe('');
        expect(component.password).toBe('');
        expect(component.fullname).toBe('');
        expect(component.errorMessage).toBe('');
      });
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      localStorage.setItem('branchId', '123');
      component.ngOnInit();
    });

    it('should add subscription to array', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockAddEmployeeService.saveEmployee.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should unsubscribe on ngOnDestroy', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockAddEmployeeService.saveEmployee.and.returnValue(of({ message: 'Success' }));

      component.submit();

      const sub = (component as any).subscriptions[0];
      spyOn(sub, 'unsubscribe');

      component.ngOnDestroy();

      expect(sub.unsubscribe).toHaveBeenCalled();
    });
  });
});
