import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from '../../shared.module'; // Provides PrimeNG modules
import { Recipe } from '../../model/recipes';
import { RecipeService } from '../../service/recipe.service';
import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { RecipeCreationComponent } from '../recipe-creation/recipe-creation.component'; // To open create dialog

@Component({
  selector: 'app-assign-meal',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule, // Provides common modules + DialogService potentially
    ToastModule,
    ProgressSpinnerModule,
    ButtonModule,
    MessageModule,
    RippleModule,
    TooltipModule
  ],
  templateUrl: './assign-meal.component.html',
  styleUrls: ['./assign-meal.component.css'],
  providers: [MessageService, DatePipe] // Provide locally if not global
})
export class AssignMealComponent implements OnInit {

  recipes: Recipe[] = [];
  isLoading: boolean = true;
  errorLoading: boolean = false;
  selectedRecipe: Recipe | null = null;
  targetDate!: Date; // Date passed from the parent
  formattedTargetDate: string = '';

  constructor(
    private recipeService: RecipeService,
    public dialogRef: DynamicDialogRef,
    public dialogConfig: DynamicDialogConfig,
    private messageService: MessageService,
    private dialogService: DialogService, // To open RecipeCreationComponent
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    if (this.dialogConfig.data?.date) {
      this.targetDate = this.dialogConfig.data.date;
      this.formattedTargetDate = this.datePipe.transform(this.targetDate, 'EEEE d MMMM yyyy') || 'Date inconnue';
      this.loadRecipes();
    } else {
      console.error("Target date not provided to AssignMealComponent dialog.");
      this.errorLoading = true;
      this.isLoading = false;
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Date cible manquante.' });
    }
  }

  loadRecipes(): void {
    console.log("Loading recipe");
    this.isLoading = true;
    this.errorLoading = false;
    this.recipeService.getAllRecipes().subscribe({
      next: (data) => {
        this.recipes = data;
        this.isLoading = false;
        const selectedRecipe = this.recipes.find(r => r.id === this.dialogConfig.data?.meal?.recipe?.id);
        if (selectedRecipe) {
          this.selectRecipe(selectedRecipe);
        }
      },
      error: (err) => {
        console.error("Error loading recipes:", err);
        this.isLoading = false;
        this.errorLoading = true;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les recettes.' });
      }
    });
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
  }

  assignSelectedMeal(): void {
    if (this.selectedRecipe) {
      // Close the dialog and pass back the selected recipe and target date
      this.dialogRef.close({ recipe: this.selectedRecipe, date: this.targetDate });
    } else {
       this.messageService.add({ severity: 'warn', summary: 'Sélection requise', detail: 'Veuillez sélectionner une recette.' });
    }
  }

  openCreateRecipeDialog(): void {
    const createRef = this.dialogService.open(RecipeCreationComponent, {
        header: 'Créer une nouvelle recette',
        width: '90%',
        contentStyle: {"max-height": "80vh", "overflow": "auto"},
        baseZIndex: 10001 // Ensure it's above the assign dialog
    });

    createRef.onClose.subscribe((newRecipe?: Recipe) => {
        if (newRecipe) {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Recette "${newRecipe.name}" créée.` });
            // Add to current list and select it
            this.recipes.unshift(newRecipe); // Add to beginning of the list
            this.selectRecipe(newRecipe);
        }
    });
  }

  closeDialog(): void {
    this.dialogRef.close(); // Close without passing data
  }
}
