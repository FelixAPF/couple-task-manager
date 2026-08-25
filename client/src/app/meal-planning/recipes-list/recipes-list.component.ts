import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { Recipe, RecipeType } from '../../model/recipes';
import { RecipeService } from '../../service/recipe.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RecipeCreationComponent } from '../recipe-creation/recipe-creation.component';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';
import { RecipeRandomDialogComponent } from '../recipe-random-dialog/recipe-random-dialog.component';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

// Export TagSeverity so other components (RecipeCard, ShoppingList) can import it
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

export interface CategoryFilterItem {
  label: string;
  value: string;
  emoji: string;
  count: number;
}

@Component({
  selector: 'app-recipes-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ConfirmDialogModule,
    FormsModule,
    ToastModule,
    AccordionModule,
    RecipeCardComponent,
    RecipeRandomDialogComponent,
    TooltipModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './recipes-list.component.html',
  styleUrls: ['./recipes-list.component.css'],
  providers: [ConfirmationService, MessageService, DialogService]
})
export class RecipesListComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private cdRef = inject(ChangeDetectorRef);

  allRecipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  errorLoading: boolean = false;
  ref: DynamicDialogRef | undefined;

  searchTerm: string = '';
  selectedCategory: string = 'ALL';
  categoriesWithCounts: CategoryFilterItem[] = [];

  categoryEmojis: Record<string, string> = {
    ALL: '🍽️',
    PATES: '🍝',
    POULET: '🍗',
    BOEUF: '🥩',
    VIANDE: '🍖',
    SANTE: '🥗',
    SALADE: '🥬',
    POISSON: '🐟',
    FRUITS_DE_MER: '🦐',
    BURGER: '🍔',
    SANDWICH: '🥪',
    WRAP: '🌯',
    SOUPE: '🍲',
    ENTREE: '🥟',
    TREMPETTE: '🥣',
    AUTRE: '🍳'
  };

  categoryLabels: Record<string, string> = {
    ALL: 'Toutes',
    PATES: 'Pâtes',
    POULET: 'Poulet',
    BOEUF: 'Boeuf',
    VIANDE: 'Viandes',
    SANTE: 'Santé',
    SALADE: 'Salades',
    POISSON: 'Poissons',
    FRUITS_DE_MER: 'Fruits de mer',
    BURGER: 'Burgers',
    SANDWICH: 'Sandwiches',
    WRAP: 'Wraps',
    SOUPE: 'Soupes',
    ENTREE: 'Entrées',
    TREMPETTE: 'Trempettes',
    AUTRE: 'Autres'
  };

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.errorLoading = false;
    this.recipeService.getAllRecipes().subscribe({
      next: (recipes) => {
        this.allRecipes = recipes || [];
        this.buildCategoryCounts();
        this.applyFilters();
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
        this.errorLoading = true;
        this.allRecipes = [];
        this.filteredRecipes = [];
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: 'Impossible de charger les recettes.' 
        });
        this.cdRef.detectChanges();
      }
    });
  }

  buildCategoryCounts(): void {
    const rawCategories = ['ALL', ...Object.keys(RecipeType)];
    this.categoriesWithCounts = rawCategories.map(cat => {
      const count = cat === 'ALL'
        ? this.allRecipes.length
        : this.allRecipes.filter(r => r.category === cat).length;

      return {
        value: cat,
        label: this.categoryLabels[cat] || cat,
        emoji: this.categoryEmojis[cat] || '🍽️',
        count
      };
    }).filter(c => c.value === 'ALL' || c.count > 0);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredRecipes = this.allRecipes.filter(recipe => {
      const matchesCategory = this.selectedCategory === 'ALL' || recipe.category === this.selectedCategory;
      const matchesSearch = !term ||
        recipe.name.toLowerCase().includes(term) ||
        (recipe.description && recipe.description.toLowerCase().includes(term)) ||
        (recipe.ingredients && recipe.ingredients.some(ing => ing.name?.toLowerCase().includes(term)));

      return matchesCategory && matchesSearch;
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  resetAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'ALL';
    this.applyFilters();
  }

  openRandomRecipeCard(): void {
    this.dialogService.open(RecipeRandomDialogComponent, {
      header: 'Recette au hasard 🎲',
      dismissableMask: true,
      modal: true,
      width: '90%',
      style: { maxWidth: '520px' }
    });
  }

  openCreateRecipeDialog(): void {
    this.ref = this.dialogService.open(RecipeCreationComponent, {
      header: 'Créer une nouvelle recette',
      width: '90%',
      contentStyle: { "max-height": "80vh", "overflow": "auto" },
      baseZIndex: 10000
    });

    this.ref.onClose.subscribe((savedRecipe?: Recipe) => {
      if (savedRecipe) {
        this.loadRecipes();
      }
    });
  }

  openEditRecipeDialog(recipe: Recipe): void {
    this.ref = this.dialogService.open(RecipeCreationComponent, {
      header: `Modifier : ${recipe.name}`,
      width: '90%',
      contentStyle: { "max-height": "80vh", "overflow": "auto" },
      baseZIndex: 10000,
      data: { recipe }
    });

    this.ref.onClose.subscribe((savedRecipe?: Recipe) => {
      if (savedRecipe) {
        this.loadRecipes();
      }
    });
  }

  editRecipe(recipe: Recipe): void {
    this.openEditRecipeDialog(recipe);
  }

  confirmDelete(event: Event, recipe: Recipe): void {
    if (!recipe.id) return;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Êtes-vous sûr de vouloir supprimer la recette "${recipe.name}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm font-bold',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm font-bold',
      accept: () => {
        this.deleteRecipe(recipe.id!);
      }
    });
  }

  private deleteRecipe(id: number): void {
    this.recipeService.deleteRecipe(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Supprimée',
          detail: 'Recette supprimée avec succès.'
        });
        this.allRecipes = this.allRecipes.filter(r => r.id !== id);
        this.buildCategoryCounts();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error deleting recipe:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer la recette.'
        });
      }
    });
  }

  trackById(index: number, item: Recipe): number {
    return item.id ?? index;
  }
}