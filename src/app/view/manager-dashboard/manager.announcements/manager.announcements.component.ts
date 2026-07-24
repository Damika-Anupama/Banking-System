import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { focusFirstError } from 'src/app/shared/focus-first-error';
import { demoStore } from 'src/app/shared/demo-store';

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

  announcements: Announcement[] = demoStore.getAnnouncements();

  get sortedAnnouncements(): Announcement[] {
    return [...this.announcements].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.posted).getTime() - new Date(a.posted).getTime();
    });
  }

  get pinnedCount(): number { return this.announcements.filter(a => a.pinned).length; }
  get urgentCount(): number { return this.announcements.filter(a => a.priority === 'Urgent').length; }

  touched: Record<string, boolean> = {};
  private readonly validatedFields = ['title', 'message'];

  get fieldErrors(): Record<string, string | null> {
    return {
      title: this.title.trim() ? null : 'Give the announcement a title.',
      message: this.message.trim() ? null : 'Write the announcement message.',
    };
  }

  get isValid(): boolean {
    return this.validatedFields.every(field => !this.fieldErrors[field]);
  }

  /** The first field the form rejected, so focus can be sent straight to it. */
  get firstErrorField(): string | null {
    for (const field of this.validatedFields) {
      if (this.fieldErrors[field]) return field;
    }
    return null;
  }

  /** An error is only shown once the user has left the field, to avoid nagging mid-type. */
  errorFor(field: string): string | null {
    return this.touched[field] ? this.fieldErrors[field] : null;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  priorityTone(priority: string): string {
    if (priority === 'Urgent') return 'demo-status-danger';
    if (priority === 'Important') return 'demo-status-warning';
    return 'demo-status-info';
  }

  post(): void {
    if (!this.isValid) {
      this.validatedFields.forEach(field => (this.touched[field] = true));
      focusFirstError(this.firstErrorField);
      this.toastService.error('Missing details', 'Fix the highlighted fields to post the announcement.');
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
      demoStore.addAnnouncement(item);
      this.announcements = [...demoStore.getAnnouncements()];
      this.title = '';
      this.message = '';
      this.audience = 'All staff';
      this.priority = 'Normal';
      this.touched = {};
      this.isPosting = false;
      this.toastService.success('Announcement posted');
    }, 500);
  }

  togglePin(item: Announcement): void {
    demoStore.toggleAnnouncementPin(item.id);
    this.announcements = [...demoStore.getAnnouncements()];
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
      demoStore.removeAnnouncement(item.id);
      this.announcements = [...demoStore.getAnnouncements()];
      this.toastService.success('Announcement deleted');
    });
  }
}
