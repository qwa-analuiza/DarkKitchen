import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Esqueci } from './esqueci';

describe('Esqueci', () => {
  let component: Esqueci;
  let fixture: ComponentFixture<Esqueci>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Esqueci],
    }).compileComponents();

    fixture = TestBed.createComponent(Esqueci);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
