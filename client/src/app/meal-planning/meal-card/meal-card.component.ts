import { Component, EventEmitter, Input, Output, LOCALE_ID, Inject, TemplateRef, AfterViewInit, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { Meal } from '../../model/meals';
import { SharedModule } from '../../shared.module';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RecipeDialogComponent } from '../recipe-dialog/recipe-dialog.component';
import { BalloonContainerComponent } from '../../container/balloon-container/balloon-container.component';

@Component({
  selector: 'app-meal-card',
  imports: [SharedModule, BalloonContainerComponent],
  templateUrl: './meal-card.component.html',
  styleUrl: './meal-card.component.css',
  encapsulation: ViewEncapsulation.None // <-- this is critical

})
export class MealCardComponent {
  @Input() title: Date | string;
  @Input() meal: Meal | undefined;
  @Input() public customTemplate!: TemplateRef<HTMLElement>;
  @Input() public noMealPlanned!: TemplateRef<HTMLElement>;
  @Input() public isBirthday: boolean | undefined = false;
  recipeDialogRef: DynamicDialogRef | undefined;
  @Input() borderHighlightClass: string = ''; // Input to receive the border class
  recipeImageLoaded = false;

  isHouseholdMemberBirthday: boolean = false;

  // NEW: Emit when the delete button in the header is clicked
  @Output() removeMealClick: EventEmitter<Event> = new EventEmitter<Event>();


  ngOnChanges(changes: SimpleChanges) {
  if (changes['meal']) {
    const prevUrl = changes['meal'].previousValue?.recipe?.imageUrl;
    const currUrl = changes['meal'].currentValue?.recipe?.imageUrl;
    if (prevUrl !== currUrl) {
      this.recipeImageLoaded = false;
    }
  }
}
  get recipeName(){
    return this.meal?.recipe?.name || 'Recette inconnue';
  }

  constructor(@Inject(LOCALE_ID) private locale: string, private dialogService: DialogService, ) {
  }
  
  openRecipeView(): void {
  this.recipeDialogRef = this.dialogService.open(RecipeDialogComponent, {
    dismissableMask: true,
    width: '92vw',
    style: {
      'max-width': '600px',
      'max-height': '85dvh',
      'margin': 'auto'
    },
    modal: true,
    showHeader: false,
    contentStyle: { 
      'max-height': '85dvh', 
      'height': '85dvh',
      'overflow': 'hidden', 
      'padding': '0', 
      'border-radius': '1.5rem' 
    },
    baseZIndex: 10000,
    data: {
      recipe: this.meal?.recipe
    }
  });
}

  // NEW: Handler to emit the delete event
  onRemoveClick(event: Event) {
      event.stopPropagation(); // Prevent the card from being selected when clicking delete
      this.removeMealClick.emit(event);
  }
}