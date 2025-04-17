import { Component, EventEmitter, Input, Output, LOCALE_ID, Inject, TemplateRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Meal } from '../../model/meals';
import { SharedModule } from '../../shared.module';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RecipeDialogComponent } from '../recipe-dialog/recipe-dialog.component';

@Component({
  selector: 'app-meal-card',
  imports: [SharedModule],
  templateUrl: './meal-card.component.html',
  styleUrl: './meal-card.component.css',
  encapsulation: ViewEncapsulation.None // <-- this is critical

})
export class MealCardComponent {
  @Input() title: Date | string;
  @Input() meal: Meal | undefined;
  @Input() public customTemplate!: TemplateRef<HTMLElement>;
  @Input() public noMealPlanned!: TemplateRef<HTMLElement>;
  recipeDialogRef: DynamicDialogRef | undefined;
  @Input() borderHighlightClass: string = ''; // Input to receive the border class


  get recipeName(){
    return this.meal?.recipe?.name || 'Recette inconnue';
  }

  constructor(@Inject(LOCALE_ID) private locale: string, private dialogService: DialogService, ) {
  }
  openRecipeView(){
    this.recipeDialogRef = this.dialogService.open(RecipeDialogComponent, {
        dismissableMask: true,
        width: '90%',
        modal: true,
        contentStyle: {"max-height": "70vh", "overflow": "auto"},
        baseZIndex: 10000,
        data: { // Pass the target date
          recipe: this.meal?.recipe
        }
    });
  }
}
