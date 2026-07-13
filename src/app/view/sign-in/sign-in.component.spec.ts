import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SignInComponent } from './sign-in.component';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let router: Router;
  let toastService: ToastService;

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
    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'error');
    localStorage.clear();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('field error accessibility', () => {
    const emailInput = (): HTMLInputElement =>
      fixture.nativeElement.querySelector('#signin-email');

    it('does not mark a pristine field invalid', () => {
      expect(emailInput().getAttribute('aria-invalid')).toBeNull();
      expect(emailInput().getAttribute('aria-describedby')).toBeNull();
    });

    it('points a touched, invalid field at its error message', () => {
      const input = emailInput();
      input.value = 'not-an-email';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(input.getAttribute('aria-invalid')).toBe('true');

      // The message must exist at the id the input points to, or a screen
      // reader announces nothing at all.
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBe('signin-email-error');

      const message = fixture.nativeElement.querySelector(`#${describedBy}`);
      expect(message).not.toBeNull();
      expect(message.getAttribute('role')).toBe('alert');
      expect(message.textContent).toContain('valid email');
    });
  });

  it('should show error when email and password are empty', () => {
    component.email = '';
    component.password = '';

    component.authenticate();

    expect(component.errorMessage).toBe('Email and password are required');
    expect(toastService.error).toHaveBeenCalledWith(
      'Check your details',
      'Email and password are required'
    );
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show error for invalid email format', () => {
    component.email = 'invalidemail.com';
    component.password = 'password123';

    component.authenticate();

    expect(component.errorMessage).toBe('Please enter a valid email address');
    expect(toastService.error).toHaveBeenCalledWith(
      'Check your details',
      'Please enter a valid email address'
    );
    expect(Swal.fire).not.toHaveBeenCalled();
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
    expect(toastService.error).toHaveBeenCalledWith(
      'Sign-in failed',
      'Failed to store authentication data'
    );
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
