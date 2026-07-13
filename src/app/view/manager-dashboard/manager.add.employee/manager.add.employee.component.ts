import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AddEmployeeService } from 'src/app/service/manager/add.employee.service';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/service/toast.service';

@Component({
  selector: 'app-manager.add.employee',
  standalone: false,
  templateUrl: './manager.add.employee.component.html',
  styleUrls: ['./manager.add.employee.component.scss'],
})
export class ManagerAddEmployeeComponent implements OnInit, OnDestroy {
  username = '';
  password = '';
  fullname = '';
  type = 'EMPLOYEE';
  gender = '';
  dob = '';
  address = '';
  email = '';
  contact_no = '';
  branch_id: string | null = null;
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private addEmployee: AddEmployeeService,
    private router: Router,
    private toastService: ToastService
  ) {}

  /** Fields the user has left, so errors appear on blur rather than while typing. */
  touched: Record<string, boolean> = {};

  private readonly validatedFields = [
    'fullname',
    'username',
    'password',
    'email',
    'contact_no',
    'gender',
    'dob',
    'address',
  ];

  /**
   * Single source of truth for validity, so a rule cannot be enforced on submit
   * but left invisible on the field that broke it.
   */
  get fieldErrors(): Record<string, string | null> {
    return {
      fullname: this.fullname?.trim() ? null : "Enter the employee's full name.",

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

      address: this.address?.trim() ? null : 'Enter an address.',
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

  errorFor(field: string): string | null {
    return this.touched[field] ? this.fieldErrors[field] : null;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  markAllTouched(): void {
    this.validatedFields.forEach((field) => (this.touched[field] = true));
  }

  ngOnInit(): void {
    // Load and validate branch_id
    const isDemo = localStorage.getItem('demoMode') === 'true';
    this.branch_id = localStorage.getItem('branchId') || (isDemo ? 'BR-001' : null);
    if (!this.branch_id) {
      this.toastService.error('Branch not found', 'Branch ID not found. Please log in again.');
    }
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

      // Branch comes from the session, not the form, so it is not a field error.
      if (!this.branch_id) {
        this.isLoading = false;
        this.toastService.error('Branch not found', 'Branch ID is missing. Please log in again.');
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
        contact_no: this.contact_no.trim(),
        branch_id: this.branch_id,
      };

      const sub = this.addEmployee.saveEmployee(body).subscribe({
        next: (res) => {
          this.isLoading = false;

          // Null/undefined check for response
          if (!res) {
            this.errorMessage = 'No response received from server';
            this.toastService.error('Could not add employee', this.errorMessage);
            return;
          }

          const isDemo = localStorage.getItem('demoMode') === 'true';
          this.toastService.success(
            'Employee added',
            res.message || 'Employee added successfully'
          );
          this.resetForm();
          // In demo mode, return to home so the updated employee count is visible.
          if (isDemo) {
            this.router.navigate(['/manager-dashboard/manager-home']);
          }
        },
        error: (err) => {
          console.error('Error adding employee:', err);
          this.isLoading = false;
          this.errorMessage = err?.error?.message || err?.message || 'Failed to add employee';

          this.toastService.error('Could not add employee', this.errorMessage);
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Error in submit process:', error);
      this.isLoading = false;
      this.errorMessage = 'An unexpected error occurred';
      this.toastService.error('Could not add employee', this.errorMessage);
    }
  }

  private validateForm(): boolean {
    if (this.hasFieldErrors) {
      // Surface every problem at once, against the field that caused it.
      this.markAllTouched();
      this.toastService.error('Check the highlighted fields', this.firstFieldError ?? undefined);
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
