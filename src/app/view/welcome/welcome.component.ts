import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: false,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
  constructor(private router: Router) {}

  gotoSignin(): void {
    this.router.navigateByUrl('sign-in');
  }

  // Let users press Enter to continue
  @HostListener('window:keydown.enter', ['$event'])
  onEnterPress(event: KeyboardEvent): void {
    event.preventDefault();
    this.gotoSignin();
  }
}
