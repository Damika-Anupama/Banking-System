import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingService } from '../../service/loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-preloader',
  standalone: false,
  templateUrl: './preloader.component.html',
  styleUrls: ['./preloader.component.scss']
})
export class PreloaderComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  private loadingSubscription: Subscription | null = null;

  constructor(private loadingService: LoadingService) { }

  ngOnInit(): void {
    try {
      // Subscribe to loading state with error handling
      this.loadingSubscription = this.loadingService.loading$.subscribe({
        next: (isLoading: boolean) => {
          try {
            this.loading = isLoading;
            // Clear error state when loading starts
            if (isLoading) {
              this.hasError = false;
              this.errorMessage = '';
            }
          } catch (error) {
            console.error('Error updating loading state:', error);
            this.handleError('Failed to update loading state');
          }
        },
        error: (error) => {
          console.error('Error in loading observable:', error);
          this.handleError('Loading service error occurred');
        },
        complete: () => {
          console.log('Loading observable completed');
        }
      });
    } catch (error) {
      console.error('Error initializing preloader component:', error);
      this.handleError('Failed to initialize loading service');
    }
  }

  ngOnDestroy(): void {
    try {
      // Clean up subscription to prevent memory leaks
      if (this.loadingSubscription) {
        this.loadingSubscription.unsubscribe();
        this.loadingSubscription = null;
      }
    } catch (error) {
      console.error('Error during preloader component cleanup:', error);
    }
  }

  /**
   * Handles errors in the preloader component
   */
  private handleError(message: string): void {
    try {
      this.hasError = true;
      this.errorMessage = message;
      this.loading = false;

      // Optionally, hide the error after some time
      setTimeout(() => {
        this.hasError = false;
        this.errorMessage = '';
      }, 5000);
    } catch (error) {
      console.error('Error in error handler:', error);
    }
  }

  /**
   * Manually retry loading (can be called from template)
   */
  public retry(): void {
    try {
      this.hasError = false;
      this.errorMessage = '';
      this.loading = false;
    } catch (error) {
      console.error('Error in retry:', error);
    }
  }

  /**
   * Gets the current loading state
   */
  public isLoading(): boolean {
    return this.loading;
  }

  /**
   * Checks if there's an error
   */
  public hasErrorState(): boolean {
    return this.hasError;
  }

  /**
   * Gets the error message
   */
  public getErrorMessage(): string {
    return this.errorMessage;
  }
}
