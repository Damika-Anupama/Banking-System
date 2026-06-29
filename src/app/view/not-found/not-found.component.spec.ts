import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule, Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;
  let location: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    location = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      declarations: [NotFoundComponent],
      imports: [CommonModule],
      providers: [{ provide: Location, useValue: location }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('goBack() navigates to the previous page', () => {
    component.goBack();
    expect(location.back).toHaveBeenCalledTimes(1);
  });
});
