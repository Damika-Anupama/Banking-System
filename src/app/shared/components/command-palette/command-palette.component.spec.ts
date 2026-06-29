/**
 * Unit Tests for CommandPaletteComponent
 *
 * Focus: role-based item filtering and the new quick-action commands
 * (toggle theme, sign out).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import { ThemeService } from '../../../service/theme.service';

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTheme: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockTheme = jasmine.createSpyObj('ThemeService', ['toggleTheme']);

    await TestBed.configureTestingModule({
      declarations: [CommandPaletteComponent],
      imports: [CommonModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ThemeService, useValue: mockTheme },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('role-based items', () => {
    it('shows only public items and the global theme action when signed out', () => {
      component.query = 'theme';
      const labels = component.items.map(i => i.label);
      expect(labels).toContain('Toggle theme');
    });

    it('exposes Sign out for a signed-in customer', () => {
      localStorage.setItem('userType', 'CUSTOMER');
      component.query = 'sign out';
      expect(component.items.some(i => i.label === 'Sign out')).toBeTrue();
    });

    it('does not expose Sign out when signed out', () => {
      component.query = 'sign out';
      expect(component.items.some(i => i.label === 'Sign out')).toBeFalse();
    });
  });

  describe('quick actions', () => {
    it('toggle-theme action calls ThemeService and closes the palette', () => {
      component.isOpen = true;
      component.navigate({
        label: 'Toggle theme', description: '', icon: '', action: 'toggle-theme', roles: ['*'],
      });
      expect(mockTheme.toggleTheme).toHaveBeenCalledTimes(1);
      expect(component.isOpen).toBeFalse();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('sign-out action clears the session and routes to sign-in', () => {
      localStorage.setItem('token', 'abc');
      localStorage.setItem('userType', 'CUSTOMER');
      localStorage.setItem('demoMode', 'true');

      component.navigate({
        label: 'Sign out', description: '', icon: '', action: 'sign-out',
        roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'DEMO'],
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('userType')).toBeNull();
      expect(localStorage.getItem('demoMode')).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
    });

    it('navigation items still route by path', () => {
      component.navigate({
        label: 'Loans', description: '', icon: '', route: '/dashboard/loan', roles: ['CUSTOMER'],
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/loan']);
    });
  });
});
