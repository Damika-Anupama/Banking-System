import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/service/customer/user.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-in',
  standalone: false,
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnDestroy {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, private userService: UserService) {}

  authenticate(): void {
    // Form validation
    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required';
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: this.errorMessage
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: this.errorMessage
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.userService.authenticate(this.email, this.password).subscribe({
      next: (user) => {
        // Null/undefined checks
        if (!user) {
          this.errorMessage = 'Invalid response from server';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: this.errorMessage
          });
          return;
        }

        const token = user.token;
        const type = user.type;

        // Check if token and type exist
        if (!token || !type) {
          this.errorMessage = 'Invalid authentication credentials';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: this.errorMessage
          });
          return;
        }

        try {
          localStorage.setItem('token', token);
          localStorage.setItem('email', this.email);

          this.isLoading = false;

          // Use setTimeout to ensure navigation happens outside SweetAlert's context
          setTimeout(() => {
            switch (type) {
              case 'CUSTOMER':
                this.router.navigate(['/dashboard/home']);
                break;
              case 'EMPLOYEE':
                this.router.navigate(['/employee-dashboard/employee-home']);
                break;
              case 'MANAGER':
                this.router.navigate(['/manager-dashboard/manager-home']);
                break;
              default:
                this.errorMessage = 'Invalid user type';
                Swal.fire({
                  icon: 'error',
                  title: 'Authentication Error',
                  text: this.errorMessage
                });
            }
          }, 0);
        } catch (error) {
          console.error('Error storing authentication data:', error);
          this.errorMessage = 'Failed to store authentication data';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
        }
      },
      error: (err) => {
        console.error('Authentication error:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Invalid email or password';
        this.isLoading = false;

        Swal.fire({
          icon: 'error',
          title: 'Authentication Failed',
          text: this.errorMessage
        });
      }
    });

    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
