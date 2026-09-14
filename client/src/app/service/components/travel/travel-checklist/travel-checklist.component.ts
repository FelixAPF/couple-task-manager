import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripListComponent } from '../trip-list/trip-list.component';
import { TravelTemplateComponent } from '../travel-template/travel-template.component';
import { SharedModule } from '../../../../shared.module';

@Component({
  selector: 'app-travel-checklist',
  standalone: true,
  imports: [CommonModule, TripListComponent, TravelTemplateComponent, SharedModule],
  templateUrl: './travel-checklist.component.html',
  styleUrls: ['./travel-checklist.component.css']
})
export class TravelChecklistComponent {
  currentView: 'trips' | 'template' = 'trips';
}