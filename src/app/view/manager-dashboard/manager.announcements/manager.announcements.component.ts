import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'All staff' | 'Tellers' | 'Loan officers' | 'Customer service';
  priority: 'Normal' | 'Important' | 'Urgent';
  posted: string;
  pinned: boolean;
}

@Component({
  selector: 'app-manager.announcements',
  standalone: false,
  templateUrl: './manager.announcements.component.html',
  styleUrls: ['./manager.announcements.component.scss']
})
export class ManagerAnnouncementsComponent {
  constructor(private toastService: ToastService) {}

  // New announcement form
  title = '';
  message = '';
  audience: Announcement['audience'] = 'All staff';
  priority: Announcement['priority'] = 'Normal';
  isPosting = false;

  readonly audiences: Announcement['audience'][] = ['All staff', 'Tellers', 'Loan officers', 'Customer service'];

  announcements: Announcement[] = [
    { id: 'ANN-410', title: 'New FD rates effective Monday', message: 'Updated fixed deposit rates take effect from Monday. Please refer to Product Configuration for the latest tiers before advising customers.', audience: 'All staff', priority: 'Important', posted: '2026-05-24T08:30:00', pinned: true },
    { id: 'ANN-408', title: 'System maintenance window', message: 'Core banking maintenance is scheduled this Saturday 10 PM–12 AM. Online services may be briefly unavailable.', audience: 'All staff', priority: 'Urgent', posted: '2026-05-23T17:10:00', pinned: false },
    { id: 'ANN-405', title: 'KYC re-verification drive', message: 'Please prompt customers with pending KYC to complete re-verification this month. Target: 95% branch compliance.', audience: 'Customer service', priority: 'Normal', posted: '2026-05-22T09:45:00', pinned: false },
    { id: 'ANN-401', title: 'Cash handling refresher', message: 'A short refresher on large-cash dual-authorisation will be held Friday at 4 PM in the branch meeting room.', audience: 'Tellers', priority: 'Normal', posted: '2026-05-21T13:20:00', pinned: false }
  ];

  get sortedAnnouncements(): Announcement[] {
    return [...this.announcements].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.posted).getTime() - new Date(a.posted).getTime();
    });
  }

  get pinnedCount(): number { return this.announcements.filter(a => a.pinned).length; }
  get urgentCount(): number { return this.announcements.filter(a => a.priority === 'Urgent').length; }

  get isValid(): boolean {
    return this.title.trim().length > 0 && this.message.trim().length > 0;
  }

  priorityTone(priority: string): string {
    if (priority === 'Urgent') return 'demo-status-danger';
    if (priority === 'Important') return 'demo-status-warning';
    return 'demo-status-info';
  }

  post(): void {
    if (!this.isValid) {
      this.toastService.info('Missing details', 'Add a title and message.');
      return;
    }
    this.isPosting = true;
    const item: Announcement = {
      id: 'ANN-' + Math.floor(411 + Math.random() * 589),
      title: this.title.trim(),
      message: this.message.trim(),
      audience: this.audience,
      priority: this.priority,
      posted: new Date().toISOString(),
      pinned: false
    };
    setTimeout(() => {
      this.announcements = [item, ...this.announcements];
      this.title = '';
      this.message = '';
      this.audience = 'All staff';
      this.priority = 'Normal';
      this.isPosting = false;
      this.toastService.success('Announcement posted');
    }, 500);
  }

  togglePin(item: Announcement): void {
    item.pinned = !item.pinned;
  }

  remove(item: Announcement): void {
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'warning',
      title: 'Delete announcement?',
      text: item.title,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.announcements = this.announcements.filter(a => a.id !== item.id);
      this.toastService.success('Announcement deleted');
    });
  }
}
