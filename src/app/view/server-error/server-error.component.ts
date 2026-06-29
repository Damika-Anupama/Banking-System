import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-server-error',
  standalone: false,
  templateUrl: './server-error.component.html',
  styleUrls: ['./server-error.component.scss']
})
export class ServerErrorComponent {
  constructor(private location: Location) {}

  retry(): void {
    window.location.reload();
  }

  goBack(): void {
    this.location.back();
  }
}
