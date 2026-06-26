import { Component } from '@angular/core';
import { ThemeService } from './service/theme.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Bank-Transaction-And-Loan-Processing-System-Frontend';

  constructor(private themeService: ThemeService) {
    // ThemeService is initialized here to ensure theme is applied on app startup
  }
}
