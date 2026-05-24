import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-up',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  constructor(private router: Router) {}

  submitDemoSignup(): void {
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'info',
      title: 'Demo account flow',
      text: 'This frontend demo uses sample data. Choose a demo role on the sign-in page to continue.',
      confirmButtonText: 'Go to sign in'
    }).then(() => this.router.navigate(['/sign-in']));
  }
}
