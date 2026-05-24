import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { FilterPipe } from 'src/app/pipes/filter.pipe';
import { UserService } from 'src/app/service/customer/user.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit, OnDestroy {
  username = '';
  userType = '';
  accounts: any[] | null = null;
  balance = '';
  accountNumber = '';
  selectedAccount: any = null;
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];
  private chartInstance: Chart | null = null;

  constructor(private router: Router, private userService: UserService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.initializeChart();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.userService.getDashboardDetails().subscribe({
      next: (user) => {
        // Null/undefined checks
        if (!user || !Array.isArray(user) || user.length === 0) {
          this.errorMessage = 'No user data available';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
          return;
        }

        // Check if user[0] exists and has required properties
        if (!user[0] || !user[0]['user_id']) {
          this.errorMessage = 'Invalid user data format';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
          return;
        }

        try {
          localStorage.setItem('userId', user[0]['user_id']);
          this.username = user[0]['username'] || 'Unknown User';

          // Check if accounts exist
          if (!user[0]['accounts'] || !Array.isArray(user[0]['accounts']) || user[0]['accounts'].length === 0) {
            this.errorMessage = 'No accounts available';
            this.accounts = [];
            this.balance = '0';
            this.accountNumber = 'N/A';
            this.selectedAccount = null;
            this.isLoading = false;
            Swal.fire({
              icon: 'warning',
              title: 'No Accounts',
              text: 'You do not have any accounts yet.'
            });
          } else {
            this.accounts = user[0]['accounts'];

            // Safe access to first account
            if (this.accounts[0]) {
              this.balance = this.accounts[0]['amount'] || '0';
              this.accountNumber = this.accounts[0]['account_id'] || 'N/A';
              this.selectedAccount = this.accounts[0];
            }
          }

          // Set user type with null check
          switch (user[0]['type']) {
            case 'CUSTOMER':
              this.userType = 'Customer';
              break;
            case 'EMPLOYEE':
              this.userType = 'Employee';
              break;
            case 'ADMIN':
              this.userType = 'Admin';
              break;
            default:
              this.userType = 'Unknown';
          }

          this.isLoading = false;
        } catch (error) {
          console.error('Error processing dashboard data:', error);
          this.errorMessage = 'Failed to process user data';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
        }
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load dashboard data';
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

  initializeChart() {
    try {
      const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
      if (!canvas) {
        console.warn('Chart canvas not found');
        return;
      }

      this.chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: [
            'August',
            'September',
            'October',
            'November',
            'December',
            'January',
          ],
          datasets: [
            {
              label: 'Monthly Expenses',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error initializing chart:', error);
      // Don't show error to user as chart is not critical
    }
  }

  updateSmallBox(account: any) {
    // Null check for account
    if (!account) {
      console.error('Invalid account selected');
      return;
    }

    // Update the balance value with null check
    this.balance = account.amount || '0';
    // Update the account number value with null check
    this.accountNumber = account.account_id || 'N/A';
    this.selectedAccount = account;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Destroy chart instance
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}
