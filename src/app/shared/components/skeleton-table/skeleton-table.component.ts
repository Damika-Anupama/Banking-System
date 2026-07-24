import { Component, Input } from '@angular/core';

/**
 * Placeholder that mirrors the shape of a table while its rows load.
 *
 * Replaces the spinner card that used to stand in for a loading table: because
 * the skeleton occupies the same columns and roughly the same height as the
 * real table, the content no longer collapses and snap back when data lands.
 */
@Component({
  selector: 'app-skeleton-table',
  standalone: false,
  templateUrl: './skeleton-table.component.html',
  styleUrls: ['./skeleton-table.component.scss'],
})
export class SkeletonTableComponent {
  /** Column headers to mirror. Drives the width of each shimmer cell. */
  @Input() columns: string[] = [];

  /** How many placeholder rows to draw. */
  @Input() rows = 5;

  /** Announced to assistive tech while the real rows are being fetched. */
  @Input() label = 'Loading results';

  get rowRange(): number[] {
    return Array.from({ length: Math.max(this.rows, 0) }, (_, i) => i);
  }

  get columnRange(): string[] {
    return this.columns.length ? this.columns : ['', '', ''];
  }

  /**
   * Vary the shimmer width per cell so the placeholder reads as text of
   * differing lengths rather than a uniform grid of identical bars.
   */
  widthFor(rowIndex: number, columnIndex: number): string {
    const widths = [92, 70, 84, 58, 76, 64, 88];
    const width = widths[(rowIndex + columnIndex * 3) % widths.length];
    return `${width}%`;
  }
}
