import { Component } from '@angular/core';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-meals-list',
  imports: [SharedModule],
  templateUrl: './meals-list.component.html',
  styleUrl: './meals-list.component.css'
})
export class MealsListComponent {
  constructor(){
    
  }
}
