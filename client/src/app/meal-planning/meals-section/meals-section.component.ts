import { ChangeDetectorRef, Component } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-meals-section',
  imports: [SharedModule],
  templateUrl: './meals-section.component.html',
  styleUrl: './meals-section.component.css'
})
export class MealsSectionComponent {
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.router.navigate(['meals', { outlets: { meals: ['meals-list'] } }])
    .then(() => {
      // Force change detection after navigation.
      this.cdr.detectChanges();
    });
  }
}
