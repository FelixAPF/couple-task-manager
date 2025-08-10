import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripListComponent } from '../trip-list/trip-list.component';
import { TravelTemplateComponent } from '../travel-template/travel-template.component';
// PrimeNG Imports
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-travel-checklist',
  imports: [ CommonModule, TripListComponent, TravelTemplateComponent, SelectButtonModule, FormsModule ],
  templateUrl: './travel-checklist.component.html',
})
export class TravelChecklistComponent {
  viewOptions: any[] = [
    { label: 'Mes voyages', value: 'trips' },
    { label: 'Gérer template', value: 'template' }
  ];
  currentView: 'trips' | 'template' = 'trips';
}