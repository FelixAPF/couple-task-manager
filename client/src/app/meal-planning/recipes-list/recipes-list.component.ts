import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule directly
import { SharedModule } from '../../shared.module'; // Keep for PrimeNG components etc.
import { Recipe, Ingredient, RecipeType } from '../../model/recipes'; // Use your actual model
import { RecipeService } from '../../service/recipe.service'; // Use your actual service
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // Import specific modules needed
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { ConfirmationService, MessageService } from 'primeng/api'; // For delete confirmation
import { ConfirmDialogModule } from 'primeng/confirmdialog'; // For delete confirmation
import { ToastModule } from 'primeng/toast'; // For feedback messages
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RecipeCreationComponent } from '../recipe-creation/recipe-creation.component';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'app-recipes-list',
  standalone: true, // Mark as standalone
  imports: [
    CommonModule,
    SharedModule,
    ConfirmDialogModule,
    ToastModule,
    AccordionModule,
    RecipeCardComponent
  ],
  templateUrl: './recipes-list.component.html',
  styleUrls: ['./recipes-list.component.css'], // Use styleUrls
  providers: [ConfirmationService, MessageService] // Provide services for dialog/toast
})
export class RecipesListComponent implements OnInit {
  recipes: Recipe[] = [];
  isLoading: boolean = true;
  errorLoading: boolean = false;
  ref: DynamicDialogRef | undefined; // To hold dialog reference


  // Expose Enum to template if needed for specific logic (e.g. styling tags)
  // RecipeType = RecipeType;

  constructor(
    private recipeService: RecipeService,
    private confirmationService: ConfirmationService, // Inject confirmation service
    private messageService: MessageService ,
    private dialogService: DialogService// Inject message service
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.isLoading = true;
    this.errorLoading = false; // Reset error state
    this.recipeService.getAllRecipes().subscribe({
      next: (data: Recipe[]) => {
        this.recipes = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error loading recipes:", err);
        this.isLoading = false;
        this.errorLoading = true; // Set error state
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les recettes.' });
      }
    });
  }

  confirmDelete(event: Event, recipe: Recipe): void {
    if (!recipe.id) return; // Cannot delete if no ID

    this.confirmationService.confirm({
      target: event.target as EventTarget, // Anchor confirmation to the button
      message: `Êtes-vous sûr de vouloir supprimer la recette "${recipe.name}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.deleteRecipe(recipe.id!); // Call actual delete method
      },
      reject: () => {
        this.messageService.add({ severity: 'warn', summary: 'Annulé', detail: 'Suppression annulée.' });
      }
    });
  }

  private deleteRecipe(id: number): void {
    this.isLoading = true; // Optional: show loading indicator during delete
    this.recipeService.deleteRecipe(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Recette supprimée avec succès.' });
        // Remove recipe from the local list
        this.recipes = this.recipes.filter(r => r.id !== id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error deleting recipe:", err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la recette.' });
        this.isLoading = false;
      }
    });
  }



  // Helper for image errors (optional, can be handled in template too)
  onImageError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
    // Find the sibling placeholder and display it (requires specific DOM structure or different approach)
    // Or simply let the *ngIf in the template handle showing the placeholder
  }

  trackById(index: number, item: Recipe): number | number {
    return item?.id ?? index;
  }

  openCreateRecipeDialog(): void {
    this.ref = this.dialogService.open(RecipeCreationComponent, {
        header: 'Créer une nouvelle recette',
        width: '90%', // Adjust width as needed
        contentStyle: {"max-height": "80vh", "overflow": "auto"}, // Allow scrolling
        baseZIndex: 10000 // Ensure it's above other elements
        // No 'data' passed for creation
    });

    // Optional: Handle dialog close event
    this.ref.onClose.subscribe((savedRecipe?: Recipe) => {
        if (savedRecipe) {
            this.loadRecipes()
        }
    });
  }

  // Method to open dialog for EDITING an existing recipe
  openEditRecipeDialog(recipe: Recipe): void {
    this.ref = this.dialogService.open(RecipeCreationComponent, {
        header: `Modifier: ${recipe.name}`,
        width: '90%',
        contentStyle: {"max-height": "80vh", "overflow": "auto"},
        baseZIndex: 10000,
        data: { // Pass the recipe to edit
          recipe: recipe
        }
    });

    this.ref.onClose.subscribe((savedRecipe?: Recipe) => {
        if (savedRecipe) {
            // Update the recipe in the list or reload the list
            this.loadRecipes(); // Example: reload list
            this.messageService.add({ severity: 'info', summary: 'Action', detail: `Modification de la recette "${recipe.name}" (non implémenté).` });

        }
    });
  }

  // Modify your existing editRecipe method to call the dialog
  editRecipe(recipe: Recipe): void {
    this.openEditRecipeDialog(recipe);
  }

}