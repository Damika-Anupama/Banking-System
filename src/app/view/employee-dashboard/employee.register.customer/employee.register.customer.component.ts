import { Component, OnDestroy } from '@angular/core';
import { RegisterCustomerService } from 'src/app/service/employee/register.customer.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

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

  constructor(private registerCustomer: RegisterCustomerService) { }

  submit(): void {
    // Form validation
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Convert gender to uppercase format
      const normalizedGender = this.normalizeGender(this.gender);
      if (!normalizedGender) {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'Invalid gender selection',
          icon: 'error',
        });
        return;
      }

      // Validate email format
      if (!this.isValidEmail(this.email)) {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'Please enter a valid email address',
          icon: 'error',
        });
        return;
      }

      // Validate contact number
      if (!this.isValidContactNumber(this.contact_no)) {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'Please enter a valid contact number',
          icon: 'error',
        });
        return;
      }

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
            Swal.fire({
              title: 'Error',
              text: this.errorMessage,
              icon: 'error',
            });
            return;
          }

          Swal.fire({
            title: 'Success',
            text: res.message || 'Customer registered successfully',
            icon: 'success',
          }).then(() => {
            // Reset form after successful registration
            this.resetForm();
          });
        },
        error: (err) => {
          console.error('Error registering customer:', err);
          this.isLoading = false;
          this.errorMessage = err?.error?.message || err?.message || 'Failed to register customer';

          Swal.fire({
            title: 'Error',
            text: this.errorMessage,
            icon: 'error',
          });
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Error in submit process:', error);
      this.isLoading = false;
      this.errorMessage = 'An unexpected error occurred';
      Swal.fire({
        title: 'Error',
        text: this.errorMessage,
        icon: 'error',
      });
    }
  }

  private validateForm(): boolean {
    // Check for empty fields
    if (
      !this.username?.trim() ||
      !this.password ||
      !this.fullname?.trim() ||
      !this.gender ||
      !this.dob ||
      !this.address?.trim() ||
      !this.email?.trim() ||
      !this.contact_no?.trim()
    ) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all the required fields',
        icon: 'error',
      });
      return false;
    }

    // Validate password length
    if (this.password.length < 6) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Password must be at least 6 characters long',
        icon: 'error',
      });
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
