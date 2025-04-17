import { Component, Input, TemplateRef } from '@angular/core';
import { Ingredient, Recipe, RecipeType } from '../../model/recipes';
import { SharedModule } from '../../shared.module';
import { TagSeverity } from '../recipes-list/recipes-list.component';

@Component({
  selector: 'app-recipe-card',
  imports: [SharedModule],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.css'
})
export class RecipeCardComponent {
  @Input() recipe!: Recipe;
  @Input() buttonsTemplate!: TemplateRef<any>;
  @Input() openIngredients: boolean = false;

  // Optional: Map RecipeType enum to severity for p-tag styling
  getCategoryTagSeverity(category: RecipeType): TagSeverity { // Use the specific TagSeverity type
    switch (category) {
      case RecipeType.SANTE: return 'success';
      case RecipeType.VIANDE: return 'danger';
      case RecipeType.PATES: return 'warn';
      // Add cases for other RecipeType values if they exist and map them
      // case RecipeType.POISSON: return 'info';
      // case RecipeType.VEGETARIEN: return 'success';
      default: return 'info'; // Default severity
    }
  }

  // Helper to format ingredient display
  formatIngredient(ingredient: Ingredient): string {
    return `${ingredient.quantity  === 0 ? '' : ingredient.quantity} ${ingredient.unit || ''} ${ingredient.name}`.trim();
  }
}
