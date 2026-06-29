import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule, Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ServerErrorComponent } from './server-error.component';

describe('ServerErrorComponent', () => {
  let component: ServerErrorComponent;
  let fixture: ComponentFixture<ServerErrorComponent>;
  let location: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    location = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      declarations: [ServerErrorComponent],
      imports: [CommonModule],
      providers: [{ provide: Location, useValue: location }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ServerErrorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('goBack() navigates to the previous page', () => {
    component.goBack();
    expect(location.back).toHaveBeenCalledTimes(1);
  });

  it('exposes a retry handler', () => {
    expect(typeof component.retry).toBe('function');
  });
});
