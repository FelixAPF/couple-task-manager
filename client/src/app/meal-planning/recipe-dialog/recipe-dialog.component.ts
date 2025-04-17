import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SharedModule } from '../../shared.module';
import { Recipe } from '../../model/recipes';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';

@Component({
  selector: 'app-recipe-dialog',
  imports: [SharedModule, RecipeCardComponent],
  templateUrl: './recipe-dialog.component.html',
  styleUrl: './recipe-dialog.component.css'
})
export class RecipeDialogComponent implements OnInit {
  recipe: Recipe;

  constructor(
      public dialogRef: DynamicDialogRef,
      public dialogConfig: DynamicDialogConfig){
        
  }
    
  ngOnInit(): void {
    this.recipe = this.dialogConfig.data.recipe;
  }

    
}
