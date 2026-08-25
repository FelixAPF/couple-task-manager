import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { SharedModule } from '../../shared.module';
import { Recipe, Ingredient } from '../../model/recipes';
import { ShoppingService } from '../../service/shopping.service';
import { RecipeService } from '../../service/recipe.service';
import { SelectStoreComponent } from '../../shopping-planning/select-store/select-store.component';
import { RecipeCreationComponent } from '../recipe-creation/recipe-creation.component';
import { ItemType, ShoppingItem, Store } from '../../model/shopping-item';

@Component({
  selector: 'app-recipe-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    SharedModule, 
    ToastModule, 
    ButtonModule, 
    TooltipModule
  ],
  templateUrl: './recipe-dialog.component.html',
  styleUrls: ['./recipe-dialog.component.css'],
  providers: [MessageService]
})
export class RecipeDialogComponent implements OnInit {
  public dialogRef = inject(DynamicDialogRef);
  public dialogConfig = inject(DynamicDialogConfig);
  private dialogService = inject(DialogService);
  private shoppingService = inject(ShoppingService);
  private recipeService = inject(RecipeService);
  private messageService = inject(MessageService);

  recipe!: Recipe;
  originalIngredients: Ingredient[] = [];
  scaledIngredients: Ingredient[] = [];
  displayPortionRatio: number = 4;
  checkedIngredients: { [index: number]: boolean } = {};

  ngOnInit(): void {
    if (this.dialogConfig.data?.recipe) {
      this.recipe = this.dialogConfig.data.recipe;
      this.initIngredients();
    }
  }

  private initIngredients(): void {
    if (!this.recipe?.ingredients) return;
    this.originalIngredients = JSON.parse(JSON.stringify(this.recipe.ingredients));
    this.displayPortionRatio = this.recipe.basePortionRatio && this.recipe.basePortionRatio > 0 
      ? this.recipe.basePortionRatio 
      : 4;
    this.recalculateIngredients();
  }

  adjustPortions(delta: number): void {
    const newPortions = this.displayPortionRatio + delta;
    if (newPortions >= 1) {
      this.displayPortionRatio = newPortions;
      this.recalculateIngredients();
    }
  }

  recalculateIngredients(): void {
    const base = this.recipe.basePortionRatio && this.recipe.basePortionRatio > 0 
      ? this.recipe.basePortionRatio 
      : this.displayPortionRatio;
    const factor = this.displayPortionRatio / base;

    this.scaledIngredients = this.originalIngredients.map(ing => {
      const copy: Ingredient = { ...ing };
      if (copy.quantity && copy.quantity > 0) {
        copy.quantity = parseFloat((ing.quantity * factor).toFixed(2));
      }
      return copy;
    });
  }

  toggleIngredientChecked(index: number): void {
    this.checkedIngredients[index] = !this.checkedIngredients[index];
  }

  formatIngredient(ingredient: Ingredient): string {
    let qtyStr = '';
    if (ingredient.quantity && ingredient.quantity > 0) {
      qtyStr = ingredient.quantity % 1 === 0 
        ? ingredient.quantity.toString() 
        : ingredient.quantity.toFixed(1);
    }
    return `${qtyStr} ${ingredient.unit || ''} ${ingredient.name}`.trim().replace(/\s+/g, ' ');
  }

  addSingleIngredientToShopList(ingredient: Ingredient, event?: Event): void {
    if (event) event.stopPropagation();

    this.dialogService.open(SelectStoreComponent, {
      header: 'Choisir un commerce',
      width: '90%',
      style: { maxWidth: '420px' },
      modal: true,
      dismissableMask: true
    }).onClose.subscribe((resp) => {
      if (!resp) return;
      const shoppingItem: ShoppingItem = {
        id: 0,
        bought: false,
        name: `${ingredient.name} ${ingredient.quantity >= 1 ? `x${ingredient.quantity}` : ''}`,
        store: resp.store as Store,
        type: ItemType.GROCERY,
        quantity: resp.quantity || 1
      };

      this.shoppingService.addShoppingItem(shoppingItem).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Ajouté',
            detail: `"${ingredient.name}" ajouté à l'épicerie.`
          });
        }
      });
    });
  }

  addAllIngredientsToShopList(): void {
    this.dialogService.open(SelectStoreComponent, {
      header: 'Choisir le commerce pour tous les articles',
      width: '90%',
      style: { maxWidth: '420px' },
      modal: true,
      dismissableMask: true
    }).onClose.subscribe((resp) => {
      if (!resp) return;
      const store = resp.store as Store;
      
      this.scaledIngredients.forEach(ing => {
        const item: ShoppingItem = {
          id: 0,
          bought: false,
          name: `${ing.name} ${ing.quantity >= 1 ? `x${ing.quantity}` : ''}`,
          store,
          type: ItemType.GROCERY,
          quantity: 1
        };
        this.shoppingService.addShoppingItem(item).subscribe();
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Ajoutés !',
        detail: `Tous les ingrédients ont été ajoutés à la liste.`
      });
    });
  }

  openEditRecipe(): void {
    const editRef = this.dialogService.open(RecipeCreationComponent, {
      header: `Modifier : ${this.recipe.name}`,
      width: '90%',
      contentStyle: { "max-height": "80vh", "overflow": "auto" },
      baseZIndex: 10001,
      data: { recipe: this.recipe }
    });

    editRef.onClose.subscribe((updated?: Recipe) => {
      if (updated && updated.id) {
        this.recipeService.getRecipeById(updated.id).subscribe(refreshed => {
          this.recipe = refreshed;
          this.initIngredients();
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}