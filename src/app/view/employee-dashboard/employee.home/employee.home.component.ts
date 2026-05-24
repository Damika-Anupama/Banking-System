import { Component, OnInit, OnDestroy } from '@angular/core';
import { EmployeeHomeService } from 'src/app/service/employee/employee.home.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee.home',
  standalone: false,
  templateUrl: './employee.home.component.html',
  styleUrls: ['./employee.home.component.scss']
})
export class EmployeeHomeComponent implements OnInit, OnDestroy {
  customers: any[] | null = null;
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private home: EmployeeHomeService) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.home.getEmployeeHome().subscribe({
      next: (data) => {
        try {
          // Null/undefined checks
          if (!data) {
            this.errorMessage = 'No data received from server';
            this.isLoading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.errorMessage
            });
            return;
          }

          // Check if data.data exists and is an array
          if (!data.data || !Array.isArray(data.data)) {
            this.errorMessage = 'Invalid data format received';
            this.customers = [];
            this.isLoading = false;
            Swal.fire({
              icon: 'warning',
              title: 'Warning',
              text: 'No customer data available'
            });
            return;
          }

          this.customers = data.data;
          this.isLoading = false;

          // Show message if no customers found
          if (this.customers && this.customers.length === 0) {
            Swal.fire({
              icon: 'info',
              title: 'No Customers',
              text: 'No customers found in the system'
            });
          }
        } catch (error) {
          console.error('Error processing customer data:', error);
          this.errorMessage = 'Failed to process customer data';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
        }
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load customers';
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

  showCustomerDetails(customer: any): void {
    if (!customer) {
      return;
    }

    Swal.fire({
      title: customer.fullname || customer.username || 'Customer detail',
      html: `
        <div style="text-align:left;line-height:1.8">
          <strong>User ID:</strong> ${customer.user_id || 'N/A'}<br>
          <strong>Email:</strong> ${customer.email || 'N/A'}<br>
          <strong>Contact:</strong> ${customer.contact_no || customer.contact_num || 'N/A'}<br>
          <strong>Address:</strong> ${customer.address || 'N/A'}<br>
          <strong>Accounts:</strong> ${customer.account_count || 0}<br>
          <strong>Status:</strong> ${customer.status || 'Active'}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
