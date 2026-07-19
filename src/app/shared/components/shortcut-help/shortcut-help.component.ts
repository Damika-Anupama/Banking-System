import { Component, HostListener } from '@angular/core';
import { trapTabKey } from '../../focus-trap';

interface ShortcutRow {
  keys: string[];
  description: string;
}

/**
 * The "?" keyboard-shortcuts sheet.
 *
 * The app advertises a command palette, but nothing told the user which keys
 * exist. Pressing ? anywhere (outside a text field) lists them; the sheet
 * follows the same modal contract as the palette: focus trapped, Esc closes,
 * focus returned to the opener.
 */
@Component({
  selector: 'app-shortcut-help',
  standalone: false,
  templateUrl: './shortcut-help.component.html',
  styleUrls: ['./shortcut-help.component.scss'],
})
export class ShortcutHelpComponent {
  isOpen = false;

  readonly shortcuts: ShortcutRow[] = [
    { keys: ['⌘', 'K'], description: 'Open the command palette (Ctrl+K on Windows)' },
    { keys: ['?'], description: 'Show or hide this shortcut sheet' },
    { keys: ['↑', '↓'], description: 'Move through palette results' },
    { keys: ['↵'], description: 'Open the selected result' },
    { keys: ['Esc'], description: 'Close any open dialog' },
  ];

  /** Whatever had focus before the sheet opened, so it can be handed back. */
  private previouslyFocused: HTMLElement | null = null;

  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if (event.key === '?' && !this.isTypingContext(event.target)) {
      event.preventDefault();
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
      return;
    }
    if (!this.isOpen) return;

    if (trapTabKey(event, this.dialogElement())) return;

    if (event.key === 'Escape') {
      // Palette and sheet both listen for Escape; stop it here so closing the
      // top-most dialog does not fall through to anything underneath.
      event.stopPropagation();
      this.close();
    }
  }

  /** Typing "?" into an input, textarea, select, or editable node is content, not a command. */
  private isTypingContext(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    if (el.isContentEditable) return true;
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
  }

  private dialogElement(): HTMLElement | null {
    return document.querySelector<HTMLElement>('.shortcut-modal');
  }

  open(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    this.isOpen = true;
    setTimeout(() => {
      const closeButton = document.getElementById('shortcut-help-close');
      if (closeButton) closeButton.focus();
    }, 30);
  }

  close(): void {
    this.isOpen = false;
    const opener = this.previouslyFocused;
    this.previouslyFocused = null;
    if (opener && typeof opener.focus === 'function') {
      opener.focus();
    }
  }
}
