import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SignInComponent } from './sign-in.component';
import Swal from 'sweetalert2';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignInComponent],
      imports: [FormsModule, CommonModule, RouterTestingModule.withRoutes([])],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(Swal, 'fire');
    localStorage.clear();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when email and password are empty', () => {
    component.email = '';
    component.password = '';

    component.authenticate();

    expect(component.errorMessage).toBe('Email and password are required');
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'error',
      title: 'Validation Error',
      text: 'Email and password are required'
    }));
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show error for invalid email format', () => {
    component.email = 'invalidemail.com';
    component.password = 'password123';

    component.authenticate();

    expect(component.errorMessage).toBe('Please enter a valid email address');
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'error',
      title: 'Validation Error',
      text: 'Please enter a valid email address'
    }));
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate valid sign-in details directly to customer dashboard', () => {
    component.email = 'customer@example.com';
    component.password = 'password123';

    component.authenticate(true);

    expect(localStorage.getItem('demoMode')).toBe('true');
    expect(localStorage.getItem('email')).toBe('customer@example.com');
    expect(localStorage.getItem('userType')).toBe('CUSTOMER');
    expect(localStorage.getItem('token')).toBeTruthy();
    expect(component.errorMessage).toBe('');
    expect(component.isLoading).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/home']);
  });

  it('should block submit when Angular form state is invalid', () => {
    component.email = 'customer@example.com';
    component.password = 'password123';

    component.authenticate(false);

    expect(component.errorMessage).toBe('Please enter a valid email address');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle localStorage failure without navigating', () => {
    spyOn(console, 'error');
    spyOn(localStorage, 'setItem').and.throwError('Storage unavailable');
    component.email = 'customer@example.com';
    component.password = 'password123';

    component.authenticate(true);

    expect(component.errorMessage).toBe('Failed to store authentication data');
    expect(component.isLoading).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Error storing authentication data:', jasmine.any(Error));
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'error',
      title: 'Error',
      text: 'Failed to store authentication data'
    }));
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
