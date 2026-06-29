import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'src/app/service/customer/user.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  // User data
  userId: string = '';
  username: string = '';
  fullname: string = '';
  email: string = '';
  password: string = '';
  address: string = '';
  contactNo: string = '';
  dob: string = '';
  gender: string = 'MALE';

  // Original data for reset
  originalData: any = {};

  // State management
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  showPassword = false;
  isEditingProfile = false;
  lastSavedAt = '';
  twoStepEnabled = localStorage.getItem('demo-2fa') !== 'false';
  loginAlertsEnabled = localStorage.getItem('demo-login-alerts') !== 'false';
  private subscriptions: Subscription[] = [];

  toggleTwoStep(): void {
    this.twoStepEnabled = !this.twoStepEnabled;
    localStorage.setItem('demo-2fa', String(this.twoStepEnabled));
  }

  toggleLoginAlerts(): void {
    this.loginAlertsEnabled = !this.loginAlertsEnabled;
    localStorage.setItem('demo-login-alerts', String(this.loginAlertsEnabled));
  }

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || (localStorage.getItem('demoMode') === 'true' ? 'CUS-1001' : '');
    this.email = localStorage.getItem('email') || '';

    if (!this.userId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'User session not found. Please log in again.'
      });
      return;
    }

    this.loadUserData();
  }

  /**
   * Load user data from backend
   */
  loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.userService.getById(this.userId).subscribe({
      next: (data) => {
        if (!data || !data.data || data.data.length === 0) {
          this.errorMessage = 'User data not found';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Could not load user data'
          });
          return;
        }

        const userData = data.data[0];
        this.username = userData.username || '';
        this.fullname = userData.fullname || '';
        this.email = userData.email || '';
        this.address = userData.address || '';
        this.contactNo = userData.contact_no || '';
        this.gender = userData.gender || 'MALE';

        // Format date for input field
        if (userData.dob) {
          const date = new Date(userData.dob);
          this.dob = date.toISOString().split('T')[0];
        }

        // Store original data for reset
        this.originalData = {
          username: this.username,
          fullname: this.fullname,
          email: this.email,
          address: this.address,
          contactNo: this.contactNo,
          dob: this.dob,
          gender: this.gender
        };

        this.isLoading = false;
        this.lastSavedAt = new Date().toLocaleString();
      },
      error: (err) => {
        console.error('Error loading user data:', err);
        this.errorMessage = err.message || 'Failed to load user data';
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessage
        });
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /** Strength scoring for the new-password field (mirrors the sign-up meter). */
  get passwordStrength(): { label: string; width: number; barClass: string; textClass: string } {
    const p = this.password;
    if (!p) return { label: '', width: 0, barClass: '', textClass: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: 'Very weak', width: 20, barClass: 'bg-red-400', textClass: 'text-red-400' },
      { label: 'Weak', width: 40, barClass: 'bg-orange-400', textClass: 'text-orange-400' },
      { label: 'Fair', width: 60, barClass: 'bg-amber-400', textClass: 'text-amber-400' },
      { label: 'Strong', width: 80, barClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
      { label: 'Very strong', width: 100, barClass: 'bg-emerald-300', textClass: 'text-emerald-300' },
    ];
    return levels[Math.min(score - 1, 4)] || levels[0];
  }

  get maskedEmail(): string {
    const [name, domain] = (this.email || '').split('@');
    if (!name || !domain) return this.email || 'Not provided';
    return `${name.slice(0, 2)}•••@${domain}`;
  }

  get maskedContactNo(): string {
    return this.contactNo ? `${this.contactNo.slice(0, 3)}••••${this.contactNo.slice(-2)}` : 'Not provided';
  }

  enableProfileEdit(): void {
    this.isEditingProfile = true;
  }

  cancelProfileEdit(): void {
    this.resetForm();
    this.isEditingProfile = false;
  }

  /**
   * Save user settings
   */
  saveSettings(): void {
    // Validation
    if (!this.username || this.username.trim().length < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Username must be at least 3 characters'
      });
      return;
    }

    if (!this.email || !this.email.includes('@')) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a valid email address'
      });
      return;
    }

    if (!this.fullname || this.fullname.trim().length < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter your full name'
      });
      return;
    }

    // If password is provided, validate it
    if (this.password && this.password.trim().length > 0 && this.password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Password must be at least 6 characters (leave empty to keep current password)'
      });
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const userData = {
      username: this.username.trim(),
      fullname: this.fullname.trim(),
      email: this.email.trim(),
      address: this.address.trim(),
      contact_no: this.contactNo.trim(),
      dob: this.dob,
      gender: this.gender,
      password: this.password.trim() // Empty string if not changing password
    };

    const sub = this.userService.updateUser(this.userId, userData).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.isEditingProfile = false;
        this.lastSavedAt = new Date().toLocaleString();

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Settings updated successfully'
        });

        // Update original data
        this.originalData = {
          username: this.username,
          fullname: this.fullname,
          email: this.email,
          address: this.address,
          contactNo: this.contactNo,
          dob: this.dob,
          gender: this.gender
        };

        // Clear password field
        this.password = '';

        // Update email in localStorage if changed
        if (this.email !== localStorage.getItem('email')) {
          localStorage.setItem('email', this.email);
        }
      },
      error: (err) => {
        console.error('Error updating settings:', err);
        this.errorMessage = err.message || 'Failed to update settings';
        this.isSaving = false;

        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: this.errorMessage
        });
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Reset form to original data
   */
  resetForm(): void {
    this.username = this.originalData.username;
    this.fullname = this.originalData.fullname;
    this.email = this.originalData.email;
    this.address = this.originalData.address;
    this.contactNo = this.originalData.contactNo;
    this.dob = this.originalData.dob;
    this.gender = this.originalData.gender;
    this.password = '';
    this.showPassword = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
