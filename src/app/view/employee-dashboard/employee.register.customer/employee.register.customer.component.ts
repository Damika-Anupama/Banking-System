import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterCustomerService } from 'src/app/service/employee/register.customer.service';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/service/toast.service';
import { focusFirstError } from 'src/app/shared/focus-first-error';

@Component({
  selector: 'app-employee.register.customer',
  standalone: false,
  templateUrl: './employee.register.customer.component.html',
  styleUrls: ['./employee.register.customer.component.scss']
})
export class EmployeeRegisterCustomerComponent implements OnDestroy {
  username = '';
  password = '';
  fullname = '';
  type = 'CUSTOMER';
  gender = '';
  dob = '';
  address = '';
  email = '';
  contact_no = '';
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private registerCustomer: RegisterCustomerService,
    private router: Router,
    private toastService: ToastService
  ) { }

  /** Fields the user has left, so errors appear on blur rather than while typing. */
  touched: Record<string, boolean> = {};

  private readonly validatedFields = [
    'fullname',
    'username',
    'password',
    'email',
    'address',
    'contact_no',
    'gender',
    'dob',
  ];

  /**
   * Single source of truth for registration validity, so a rule cannot be
   * enforced on submit but left invisible on the field that broke it.
   */
  get fieldErrors(): Record<string, string | null> {
    return {
      fullname: this.fullname?.trim() ? null : "Enter the customer's full name.",

      username: this.username?.trim() ? null : 'Choose a username.',

      password: !this.password
        ? 'Set a password.'
        : this.password.length < 6
          ? 'Use at least 6 characters.'
          : null,

      email: !this.email?.trim()
        ? 'Enter an email address.'
        : !this.isValidEmail(this.email)
          ? 'Enter a valid email address.'
          : null,

      address: this.address?.trim() ? null : 'Enter an address.',

      contact_no: !this.contact_no?.trim()
        ? 'Enter a contact number.'
        : !this.isValidContactNumber(this.contact_no)
          ? 'Enter a valid contact number.'
          : null,

      gender: !this.gender
        ? 'Select a gender.'
        : !this.normalizeGender(this.gender)
          ? 'Select a valid gender.'
          : null,

      dob: this.dob ? null : 'Enter a date of birth.',
    };
  }

  get hasFieldErrors(): boolean {
    return this.validatedFields.some((field) => this.fieldErrors[field]);
  }

  get firstFieldError(): string | null {
    for (const field of this.validatedFields) {
      const error = this.fieldErrors[field];
      if (error) return error;
    }
    return null;
  }

  /** The first field the form rejected, so focus can be sent straight to it. */
  get firstErrorField(): string | null {
    for (const field of this.validatedFields) {
      if (this.fieldErrors[field]) return field;
    }
    return null;
  }

  errorFor(field: string): string | null {
    return this.touched[field] ? this.fieldErrors[field] : null;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  markAllTouched(): void {
    this.validatedFields.forEach((field) => (this.touched[field] = true));
  }

  submit(): void {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Inside the try: validation reads the field rules, and a rule throwing
      // should be handled here rather than escaping submit().
      if (!this.validateForm()) {
        this.isLoading = false;
        return;
      }

      // validateForm() has already rejected an unmappable gender.
      const normalizedGender = this.normalizeGender(this.gender) as string;

      const body = {
        username: this.username.trim(),
        password: this.password,
        fullname: this.fullname.trim(),
        type: this.type,
        gender: normalizedGender,
        dob: this.dob,
        address: this.address.trim(),
        email: this.email.trim(),
        contact_no: this.contact_no.trim()
      };

      const sub = this.registerCustomer.registerCustomer(body).subscribe({
        next: (res) => {
          this.isLoading = false;

          // Null/undefined check for response
          if (!res) {
            this.errorMessage = 'No response received from server';
            this.toastService.error('Registration failed', this.errorMessage);
            return;
          }

          const isDemo = localStorage.getItem('demoMode') === 'true';
          this.toastService.success(
            'Customer registered',
            res.message || 'Customer registered successfully'
          );
          this.resetForm();
          // In demo mode, jump to the customer directory so the new record is visible.
          if (isDemo) {
            this.router.navigate(['/employee-dashboard/employee-home']);
          }
        },
        error: (err) => {
          console.error('Error registering customer:', err);
          this.isLoading = false;
          this.errorMessage = err?.error?.message || err?.message || 'Failed to register customer';

          this.toastService.error('Registration failed', this.errorMessage);
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Error in submit process:', error);
      this.isLoading = false;
      this.errorMessage = 'An unexpected error occurred';
      this.toastService.error('Registration failed', this.errorMessage);
    }
  }

  private validateForm(): boolean {
    // Surface every problem at once, against the field that caused it.
    this.markAllTouched();

    if (this.hasFieldErrors) {
      this.toastService.error('Check the highlighted fields', this.firstFieldError ?? undefined);
      focusFirstError(this.firstErrorField);
      return false;
    }

    return true;
  }

  private normalizeGender(gender: string): string | null {
    if (!gender) return null;

    switch (gender.toLowerCase()) {
      case 'male':
        return 'MALE';
      case 'female':
        return 'FEMALE';
      case 'other':
        return 'OTHER';
      default:
        return null;
    }
  }

  private isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidContactNumber(contact: string): boolean {
    if (!contact) return false;
    const contactRegex = /^\+?[\d\s-]{10,}$/;
    return contactRegex.test(contact);
  }

  private resetForm(): void {
    this.username = '';
    this.password = '';
    this.fullname = '';
    this.gender = '';
    this.dob = '';
    this.address = '';
    this.email = '';
    this.contact_no = '';
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
