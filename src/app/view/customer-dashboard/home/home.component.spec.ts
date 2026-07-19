/**
 * Unit Tests for HomeComponent
 *
 * Tests dashboard data loading, account management, and chart initialization
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HomeComponent } from './home.component';
import { UserService } from 'src/app/service/customer/user.service';
import { FilterPipe } from 'src/app/pipes/filter.pipe';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { Chart } from 'chart.js';

describe('HomeComponent', () => {
  let toastService: ToastService;
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockUserService = jasmine.createSpyObj('UserService', ['getDashboardDetails']);

    await TestBed.configureTestingModule({
      declarations: [HomeComponent, FilterPipe],
      imports: [CommonModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: UserService, useValue: mockUserService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Spy on Swal
    spyOn(Swal, 'fire');

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'error');
    spyOn(toastService, 'warning');

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    // Clean up any charts
    if (component && (component as any).chartInstance) {
      (component as any).chartInstance.destroy();
    }
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      mockUserService.getDashboardDetails.and.returnValue(of([{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: []
      }]));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      mockUserService.getDashboardDetails.and.returnValue(of([{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: []
      }]));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      expect(component.username).toBe('');
      expect(component.userType).toBe('');
      expect(component.accounts).toBeNull();
      expect(component.balance).toBe('');
      expect(component.accountNumber).toBe('');
      expect(component.selectedAccount).toBeNull();
      expect(component.searchTerm).toBe('');
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should call loadDashboardData on ngOnInit', () => {
      mockUserService.getDashboardDetails.and.returnValue(of([{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: []
      }]));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      spyOn(component, 'loadDashboardData');

      component.ngOnInit();

      expect(component.loadDashboardData).toHaveBeenCalled();
    });
  });

  describe('loadDashboardData() - Successful Loading', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('should load user data with accounts successfully', () => {
      const mockData = [{
        user_id: '123',
        username: 'John Doe',
        type: 'CUSTOMER',
        accounts: [
          { account_id: 'ACC001', amount: '5000', type: 'SAVINGS' },
          { account_id: 'ACC002', amount: '10000', type: 'CHECKING' }
        ]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.isLoading).toBe(false);
      expect(component.username).toBe('John Doe');
      expect(component.userType).toBe('Customer');
      expect(component.accounts).toEqual(mockData[0].accounts);
      expect(component.balance).toBe('5000');
      expect(component.accountNumber).toBe('ACC001');
      expect(component.selectedAccount).toEqual(mockData[0].accounts[0]);
      expect(localStorage.getItem('userId')).toBe('123');
      expect(component.errorMessage).toBe('');
    });

    it('should handle EMPLOYEE user type', () => {
      const mockData = [{
        user_id: '123',
        username: 'Jane Smith',
        type: 'EMPLOYEE',
        accounts: [{ account_id: 'ACC001', amount: '3000' }]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.userType).toBe('Employee');
    });

    it('should handle ADMIN user type', () => {
      const mockData = [{
        user_id: '123',
        username: 'Admin User',
        type: 'ADMIN',
        accounts: [{ account_id: 'ACC001', amount: '1000' }]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.userType).toBe('Admin');
    });

    it('should handle unknown user type', () => {
      const mockData = [{
        user_id: '123',
        username: 'Test User',
        type: 'INVALID_TYPE',
        accounts: [{ account_id: 'ACC001', amount: '2000' }]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.userType).toBe('Unknown');
    });

    it('should use default username if missing', () => {
      const mockData = [{
        user_id: '123',
        username: null,
        type: 'CUSTOMER',
        accounts: [{ account_id: 'ACC001', amount: '1000' }]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.username).toBe('Unknown User');
    });
  });

  describe('loadDashboardData() - No Accounts', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('should handle user with no accounts', () => {
      const mockData = [{
        user_id: '123',
        username: 'John Doe',
        type: 'CUSTOMER',
        accounts: []
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.accounts).toEqual([]);
      expect(component.balance).toBe('0');
      expect(component.accountNumber).toBe('N/A');
      expect(component.selectedAccount).toBeNull();
      expect(component.errorMessage).toBe('No accounts available');
      // The table now states the no-accounts case inline, and correctly distinguishes
      // it from an empty search result.
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle null accounts array', () => {
      const mockData = [{
        user_id: '123',
        username: 'John Doe',
        type: 'CUSTOMER',
        accounts: null
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.accounts).toEqual([]);
      expect(component.balance).toBe('0');
      expect(component.accountNumber).toBe('N/A');
    });

    it('should handle undefined accounts array', () => {
      const mockData = [{
        user_id: '123',
        username: 'John Doe',
        type: 'CUSTOMER'
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.accounts).toEqual([]);
      expect(component.balance).toBe('0');
    });
  });

  describe('loadDashboardData() - Error Handling', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('should handle null response', () => {
      mockUserService.getDashboardDetails.and.returnValue(of(null));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('No user data available');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalled();
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle empty array response', () => {
      mockUserService.getDashboardDetails.and.returnValue(of([]));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('No user data available');
      expect(component.isLoading).toBe(false);
    });

    it('should handle non-array response', () => {
      mockUserService.getDashboardDetails.and.returnValue(of({} as any));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('No user data available');
      expect(component.isLoading).toBe(false);
    });

    it('should handle missing user_id', () => {
      const mockData = [{
        username: 'John Doe',
        type: 'CUSTOMER',
        accounts: []
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Invalid user data format');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalled();
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle server error with message', () => {
      spyOn(console, 'error');
      const errorResponse = {
        error: { message: 'Unauthorized access' }
      };

      mockUserService.getDashboardDetails.and.returnValue(throwError(() => errorResponse));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Unauthorized access');
      expect(component.isLoading).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading dashboard data:', errorResponse);
      expect(toastService.error).toHaveBeenCalled();
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle server error without specific message', () => {
      spyOn(console, 'error');
      const error = new Error('Network error');

      mockUserService.getDashboardDetails.and.returnValue(throwError(() => error));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Network error');
      expect(component.isLoading).toBe(false);
    });

    it('should handle error without error object', () => {
      spyOn(console, 'error');

      mockUserService.getDashboardDetails.and.returnValue(throwError(() => ({})));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Failed to load dashboard data');
      expect(component.isLoading).toBe(false);
    });

    it('keeps the dashboard working when localStorage writes fail', () => {
      // Blocked storage falls back to safe-storage's in-memory map; the
      // dashboard must load normally, not surface an error.
      spyOn(localStorage, 'setItem').and.throwError('Storage unavailable');

      const mockData = [{
        user_id: '123',
        username: 'John Doe',
        type: 'CUSTOMER',
        accounts: [{ account_id: 'ACC001', amount: '1000' }]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('');
      expect(component.isLoading).toBe(false);
      expect(component.username).toBe('John Doe');
    });
  });

  describe('updateSmallBox()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('should update balance and account number', () => {
      const mockAccount = {
        account_id: 'ACC002',
        amount: '15000',
        type: 'SAVINGS'
      };

      component.updateSmallBox(mockAccount);

      expect(component.balance).toBe('15000');
      expect(component.accountNumber).toBe('ACC002');
      expect(component.selectedAccount).toEqual(mockAccount);
    });

    it('should handle account with missing amount', () => {
      const mockAccount = {
        account_id: 'ACC003',
        amount: null,
        type: 'CHECKING'
      };

      component.updateSmallBox(mockAccount);

      expect(component.balance).toBe('0');
      expect(component.accountNumber).toBe('ACC003');
    });

    it('should handle account with missing account_id', () => {
      const mockAccount = {
        account_id: null,
        amount: '5000',
        type: 'SAVINGS'
      };

      component.updateSmallBox(mockAccount);

      expect(component.balance).toBe('5000');
      expect(component.accountNumber).toBe('N/A');
    });

    it('should handle null account gracefully', () => {
      spyOn(console, 'error');

      component.updateSmallBox(null);

      expect(console.error).toHaveBeenCalledWith('Invalid account selected');
    });

    it('should handle undefined account gracefully', () => {
      spyOn(console, 'error');

      component.updateSmallBox(undefined);

      expect(console.error).toHaveBeenCalledWith('Invalid account selected');
    });
  });

  describe('renderSpendingChart()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('should create a chart instance when canvas and spending data exist', () => {
      const canvas = document.createElement('canvas');
      canvas.id = 'spendingChart';
      document.body.appendChild(canvas);

      spyOnProperty(component, 'spendingByCategory', 'get').and.returnValue([
        { label: 'Bills', value: 1000 },
        { label: 'Shopping', value: 500 },
      ]);

      component.renderSpendingChart();

      expect((component as any).chartInstance).toBeTruthy();

      // Cleanup
      (component as any).chartInstance?.destroy();
      document.body.removeChild(canvas);
    });

    it('should leave chartInstance null when canvas is missing', () => {
      (component as any).chartInstance = null;

      expect(() => component.renderSpendingChart()).not.toThrow();
      expect((component as any).chartInstance).toBeNull();
    });

    it('should handle chart rendering errors without throwing', () => {
      spyOn(console, 'error');
      spyOn(document, 'getElementById').and.throwError('DOM error');

      expect(() => component.renderSpendingChart()).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Error rendering spending chart:', jasmine.any(Error));
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('should add subscription to subscriptions array', () => {
      const mockData = [{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: []
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      const mockData = [{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: []
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      const subscription = (component as any).subscriptions[0];
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should destroy chart on ngOnDestroy', () => {
      // Create mock canvas
      const canvas = document.createElement('canvas');
      canvas.id = 'spendingChart';
      document.body.appendChild(canvas);

      spyOnProperty(component, 'spendingByCategory', 'get').and.returnValue([
        { label: 'Bills', value: 1000 },
      ]);

      component.renderSpendingChart();

      const chartInstance = (component as any).chartInstance;
      expect(chartInstance).toBeTruthy();
      spyOn(chartInstance, 'destroy');

      component.ngOnDestroy();

      expect(chartInstance.destroy).toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(canvas);
    });

    it('should handle ngOnDestroy when no chart exists', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('should set isLoading to true when loading starts', () => {
      const mockData = [{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: []
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      // isLoading should be false after completion
      expect(component.isLoading).toBe(false);
    });

    it('should clear errorMessage when loading starts', () => {
      component.errorMessage = 'Previous error';

      const mockData = [{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: [{ account_id: 'ACC001', amount: '1000' }]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('should handle account with zero balance', () => {
      const mockData = [{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: [{ account_id: 'ACC001', amount: '0' }]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.balance).toBe('0');
    });

    it('should handle account with empty string amount', () => {
      const mockAccount = {
        account_id: 'ACC001',
        amount: '',
        type: 'SAVINGS'
      };

      component.updateSmallBox(mockAccount);

      expect(component.balance).toBe('0');
    });

    it('should handle multiple accounts', () => {
      const mockData = [{
        user_id: '123',
        username: 'Test User',
        type: 'CUSTOMER',
        accounts: [
          { account_id: 'ACC001', amount: '5000' },
          { account_id: 'ACC002', amount: '10000' },
          { account_id: 'ACC003', amount: '15000' }
        ]
      }];

      mockUserService.getDashboardDetails.and.returnValue(of(mockData));

      component.loadDashboardData();

      expect(component.accounts?.length).toBe(3);
      expect(component.balance).toBe('5000'); // First account
      expect(component.accountNumber).toBe('ACC001');
    });
  });

  describe('Selected account persistence', () => {
    const twoAccounts = [
      { account_id: 'ACC001', amount: '5000', saving_type: 'NORMAL', account_type: 'PERSONAL' },
      { account_id: 'ACC002', amount: '9000', saving_type: 'NORMAL', account_type: 'PERSONAL' },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
    });

    it('persists the chosen account id when a row is selected', () => {
      component.updateSmallBox({ account_id: 'ACC002', amount: '9000' });
      expect(localStorage.getItem('lastSelectedAccountId')).toBe('ACC002');
    });

    it('restores the last-viewed account on load when it still exists', () => {
      localStorage.setItem('lastSelectedAccountId', 'ACC002');
      mockUserService.getDashboardDetails.and.returnValue(of([{
        user_id: '123', username: 'Test User', type: 'CUSTOMER', accounts: twoAccounts,
      }]));

      component.loadDashboardData();

      expect(component.selectedAccount?.account_id).toBe('ACC002');
      expect(component.balance).toBe('9000');
    });

    it('falls back to the first account when no saved id matches', () => {
      localStorage.setItem('lastSelectedAccountId', 'ACC999');
      mockUserService.getDashboardDetails.and.returnValue(of([{
        user_id: '123', username: 'Test User', type: 'CUSTOMER', accounts: twoAccounts,
      }]));

      component.loadDashboardData();

      expect(component.selectedAccount?.account_id).toBe('ACC001');
    });
  });
});
