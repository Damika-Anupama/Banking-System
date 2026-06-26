/**
 * Unit Tests for EmployeeRegisterCustomerComponent
 *
 * Tests customer registration, form validation, and error handling
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmployeeRegisterCustomerComponent } from './employee.register.customer.component';
import { RegisterCustomerService } from 'src/app/service/employee/register.customer.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('EmployeeRegisterCustomerComponent', () => {
  let component: EmployeeRegisterCustomerComponent;
  let fixture: ComponentFixture<EmployeeRegisterCustomerComponent>;
  let mockRegisterCustomerService: jasmine.SpyObj<RegisterCustomerService>;

  beforeEach(async () => {
    // Create spy objects
    mockRegisterCustomerService = jasmine.createSpyObj('RegisterCustomerService', ['registerCustomer']);

    await TestBed.configureTestingModule({
      declarations: [EmployeeRegisterCustomerComponent],
      imports: [FormsModule, CommonModule],
      providers: [
        { provide: RegisterCustomerService, useValue: mockRegisterCustomerService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeRegisterCustomerComponent);
    component = fixture.componentInstance;

    // Spy on Swal
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false, value: true }));

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
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

    it('should initialize with type as CUSTOMER', () => {
      expect(component.type).toBe('CUSTOMER');
    });

    it('should initialize with false isLoading', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should initialize with empty errorMessage', () => {
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Form Validation - Empty Fields', () => {
    it('should show error when all fields are empty', () => {
      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields',
          icon: 'error'
        })
      );
      expect(mockRegisterCustomerService.registerCustomer).not.toHaveBeenCalled();
    });

    it('should show error when username is empty', () => {
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should show error when password is empty', () => {
      component.username = 'johndoe';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should show error when fullname is empty', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should show error when gender is empty', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should show error when dob is empty', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should show error when address is empty', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should show error when email is empty', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should show error when contact_no is empty', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });
  });

  describe('Form Validation - Whitespace Handling', () => {
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

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should reject fullname with only whitespace', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = '   ';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should reject address with only whitespace', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '   ';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should reject email with only whitespace', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = '   ';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });

    it('should reject contact_no with only whitespace', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '   ';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please fill all the required fields'
        })
      );
    });
  });

  describe('Password Validation', () => {
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

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Password must be at least 6 characters long'
        })
      );
    });

    it('should accept password with exactly 6 characters', () => {
      component.username = 'johndoe';
      component.password = '123456';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });

    it('should accept password longer than 6 characters', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });
  });

  describe('Gender Normalization', () => {
    it('should normalize male gender to MALE', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalledWith(
        jasmine.objectContaining({ gender: 'MALE' })
      );
    });

    it('should normalize female gender to FEMALE', () => {
      component.username = 'janedoe';
      component.password = 'password123';
      component.fullname = 'Jane Doe';
      component.gender = 'female';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'jane@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalledWith(
        jasmine.objectContaining({ gender: 'FEMALE' })
      );
    });

    it('should normalize other gender to OTHER', () => {
      component.username = 'alexdoe';
      component.password = 'password123';
      component.fullname = 'Alex Doe';
      component.gender = 'other';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'alex@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalledWith(
        jasmine.objectContaining({ gender: 'OTHER' })
      );
    });

    it('should handle case-insensitive gender (Male)', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'Male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalledWith(
        jasmine.objectContaining({ gender: 'MALE' })
      );
    });

    it('should reject invalid gender value', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'invalid';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      component.submit();

      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Invalid gender selection',
          icon: 'error'
        })
      );
      expect(mockRegisterCustomerService.registerCustomer).not.toHaveBeenCalled();
    });
  });

  describe('Email Validation', () => {
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

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Please enter a valid email address',
          icon: 'error'
        })
      );
    });

    it('should reject invalid email without domain', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Please enter a valid email address'
        })
      );
    });

    it('should reject invalid email without extension', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example';
      component.contact_no = '+1234567890';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Please enter a valid email address'
        })
      );
    });

    it('should accept valid email format', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });
  });

  describe('Contact Number Validation', () => {
    it('should reject contact number with less than 10 digits', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '123456789';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Please enter a valid contact number',
          icon: 'error'
        })
      );
    });

    it('should accept contact number with exactly 10 digits', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });

    it('should accept contact number with + prefix', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });

    it('should accept contact number with spaces', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1 234 567 890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });

    it('should accept contact number with hyphens', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1-234-567-890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });

    it('should reject contact number with letters', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '12345abcde';

      component.submit();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Please enter a valid contact number'
        })
      );
    });
  });

  describe('Successful Registration', () => {
    it('should register customer successfully', async () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Customer registered successfully' }));

      component.submit();

      await Promise.resolve();

      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Success',
          text: 'Customer registered successfully',
          icon: 'success'
        })
      );
    });

    it('should trim whitespace from form fields', () => {
      // Note: email and contact_no validation checks the raw value before trimming
      // So we use values without leading/trailing whitespace for validation-checked fields
      component.username = '  johndoe  ';
      component.password = 'password123';
      component.fullname = '  John Doe  ';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '  123 Main St  ';
      component.email = 'john@example.com'; // No whitespace - validated before trimming
      component.contact_no = '+1234567890'; // No whitespace - validated before trimming

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalledWith(
        jasmine.objectContaining({
          username: 'johndoe',
          fullname: 'John Doe',
          address: '123 Main St',
          email: 'john@example.com',
          contact_no: '+1234567890'
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

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      await Promise.resolve();

      expect(component.username).toBe('');
      expect(component.password).toBe('');
      expect(component.fullname).toBe('');
      expect(component.gender).toBe('');
      expect(component.dob).toBe('');
      expect(component.address).toBe('');
      expect(component.email).toBe('');
      expect(component.contact_no).toBe('');
      expect(component.errorMessage).toBe('');
    });

    it('should use default success message if no message provided', async () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({} as any));

      component.submit();

      await Promise.resolve();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Success',
          text: 'Customer registered successfully',
          icon: 'success'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle null response', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of(null));

      component.submit();

      expect(component.errorMessage).toBe('No response received from server');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'No response received from server',
          icon: 'error'
        })
      );
    });

    it('should handle HTTP error with message', () => {
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

      mockRegisterCustomerService.registerCustomer.and.returnValue(throwError(() => errorResponse));

      component.submit();

      expect(component.errorMessage).toBe('Username already exists');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Username already exists',
          icon: 'error'
        })
      );
    });

    it('should handle error without error.message', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      const error = new Error('Network error');
      mockRegisterCustomerService.registerCustomer.and.returnValue(throwError(() => error));

      component.submit();

      expect(component.errorMessage).toBe('Network error');
      expect(component.isLoading).toBe(false);
    });

    it('should handle error without any message', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(throwError(() => ({})));

      component.submit();

      expect(component.errorMessage).toBe('Failed to register customer');
      expect(component.isLoading).toBe(false);
    });

    it('should log error to console', () => {
      spyOn(console, 'error');

      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      const error = new Error('Test error');
      mockRegisterCustomerService.registerCustomer.and.returnValue(throwError(() => error));

      component.submit();

      expect(console.error).toHaveBeenCalledWith('Error registering customer:', error);
    });
  });

  describe('Subscription Management', () => {
    it('should add subscription to subscriptions array', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      const subscription = (component as any).subscriptions[0];
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Try-Catch Error Handling', () => {
    it('should catch and handle JavaScript errors during submit', () => {
      spyOn(console, 'error');

      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      // Override the service method to throw an error during subscription
      mockRegisterCustomerService.registerCustomer.and.callFake(() => {
        throw new Error('Unexpected error during registration');
      });

      component.submit();

      expect(console.error).toHaveBeenCalledWith('Error in submit process:', jasmine.any(Error));
      expect(component.errorMessage).toBe('An unexpected error occurred');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'An unexpected error occurred',
          icon: 'error'
        })
      );
    });

    it('should catch TypeError during form processing', () => {
      spyOn(console, 'error');

      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      // Simulate TypeError by throwing during service call
      mockRegisterCustomerService.registerCustomer.and.callFake(() => {
        throw new TypeError('Cannot read property of undefined');
      });

      component.submit();

      expect(console.error).toHaveBeenCalledWith('Error in submit process:', jasmine.any(TypeError));
      expect(component.errorMessage).toBe('An unexpected error occurred');
      expect(component.isLoading).toBe(false);
    });

    it('should handle errors during normalizeGender call', () => {
      spyOn(console, 'error');

      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      // Override normalizeGender to throw error
      spyOn<any>(component, 'normalizeGender').and.throwError('Gender processing error');

      component.submit();

      expect(console.error).toHaveBeenCalledWith('Error in submit process:', jasmine.any(Error));
      expect(component.errorMessage).toBe('An unexpected error occurred');
      expect(component.isLoading).toBe(false);
    });

    it('should handle ReferenceError during submit', () => {
      spyOn(console, 'error');

      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.callFake(() => {
        throw new ReferenceError('Variable not defined');
      });

      component.submit();

      expect(console.error).toHaveBeenCalledWith('Error in submit process:', jasmine.any(ReferenceError));
      expect(component.errorMessage).toBe('An unexpected error occurred');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'An unexpected error occurred',
          icon: 'error'
        })
      );
    });
  });

  describe('Private Method Tests', () => {
    describe('normalizeGender', () => {
      it('should return null for empty string', () => {
        const result = (component as any).normalizeGender('');
        expect(result).toBeNull();
      });

      it('should return null for null value', () => {
        const result = (component as any).normalizeGender(null);
        expect(result).toBeNull();
      });

      it('should return null for undefined value', () => {
        const result = (component as any).normalizeGender(undefined);
        expect(result).toBeNull();
      });

      it('should normalize MALE correctly', () => {
        const result = (component as any).normalizeGender('MALE');
        expect(result).toBe('MALE');
      });

      it('should normalize Female correctly', () => {
        const result = (component as any).normalizeGender('Female');
        expect(result).toBe('FEMALE');
      });

      it('should normalize OTHER correctly', () => {
        const result = (component as any).normalizeGender('other');
        expect(result).toBe('OTHER');
      });
    });

    describe('isValidEmail', () => {
      it('should return false for empty string', () => {
        const result = (component as any).isValidEmail('');
        expect(result).toBe(false);
      });

      it('should return false for null', () => {
        const result = (component as any).isValidEmail(null);
        expect(result).toBe(false);
      });

      it('should return false for undefined', () => {
        const result = (component as any).isValidEmail(undefined);
        expect(result).toBe(false);
      });

      it('should return true for valid email', () => {
        const result = (component as any).isValidEmail('test@example.com');
        expect(result).toBe(true);
      });

      it('should return false for email without @', () => {
        const result = (component as any).isValidEmail('testexample.com');
        expect(result).toBe(false);
      });

      it('should return false for email without domain', () => {
        const result = (component as any).isValidEmail('test@');
        expect(result).toBe(false);
      });
    });

    describe('isValidContactNumber', () => {
      it('should return false for empty string', () => {
        const result = (component as any).isValidContactNumber('');
        expect(result).toBe(false);
      });

      it('should return false for null', () => {
        const result = (component as any).isValidContactNumber(null);
        expect(result).toBe(false);
      });

      it('should return false for undefined', () => {
        const result = (component as any).isValidContactNumber(undefined);
        expect(result).toBe(false);
      });

      it('should return true for valid phone with +', () => {
        const result = (component as any).isValidContactNumber('+1234567890');
        expect(result).toBe(true);
      });

      it('should return true for valid phone without +', () => {
        const result = (component as any).isValidContactNumber('1234567890');
        expect(result).toBe(true);
      });

      it('should return true for phone with spaces', () => {
        const result = (component as any).isValidContactNumber('+1 234 567 890');
        expect(result).toBe(true);
      });

      it('should return true for phone with dashes', () => {
        const result = (component as any).isValidContactNumber('+1-234-567-890');
        expect(result).toBe(true);
      });

      it('should return false for phone with less than 10 digits', () => {
        const result = (component as any).isValidContactNumber('123456789');
        expect(result).toBe(false);
      });
    });

    describe('resetForm', () => {
      it('should reset all form fields to empty', () => {
        component.username = 'test';
        component.password = 'test123';
        component.fullname = 'Test User';
        component.gender = 'male';
        component.dob = '1990-01-01';
        component.address = 'Test Address';
        component.email = 'test@example.com';
        component.contact_no = '+1234567890';
        component.errorMessage = 'Some error';

        (component as any).resetForm();

        expect(component.username).toBe('');
        expect(component.password).toBe('');
        expect(component.fullname).toBe('');
        expect(component.gender).toBe('');
        expect(component.dob).toBe('');
        expect(component.address).toBe('');
        expect(component.email).toBe('');
        expect(component.contact_no).toBe('');
        expect(component.errorMessage).toBe('');
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

      it('should return false for form with missing fields', () => {
        component.username = '';
        component.password = 'password123';

        const result = (component as any).validateForm();

        expect(result).toBe(false);
      });

      it('should return false for short password', () => {
        component.username = 'johndoe';
        component.password = '12345'; // Only 5 characters
        component.fullname = 'John Doe';
        component.gender = 'male';
        component.dob = '1990-01-01';
        component.address = '123 Main St';
        component.email = 'john@example.com';
        component.contact_no = '+1234567890';

        const result = (component as any).validateForm();

        expect(result).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in names', () => {
      component.username = "o'brien";
      component.password = 'password123';
      component.fullname = "Patrick O'Brien";
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'obrien@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });

    it('should handle Unicode characters in names', () => {
      component.username = 'jose123';
      component.password = 'password123';
      component.fullname = 'José García';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main St';
      component.email = 'jose@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });

    it('should handle very long addresses', () => {
      component.username = 'johndoe';
      component.password = 'password123';
      component.fullname = 'John Doe';
      component.gender = 'male';
      component.dob = '1990-01-01';
      component.address = '123 Main Street, Apartment 456, Building B, Complex Name, District, City, State, Country - 12345';
      component.email = 'john@example.com';
      component.contact_no = '+1234567890';

      mockRegisterCustomerService.registerCustomer.and.returnValue(of({ message: 'Success' }));

      component.submit();

      expect(mockRegisterCustomerService.registerCustomer).toHaveBeenCalled();
    });
  });
});
