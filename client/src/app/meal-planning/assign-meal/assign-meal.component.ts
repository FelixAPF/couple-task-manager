// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\meal-planning\assign-meal\assign-meal.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from '../../shared.module';
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
import { RecipeCreationComponent } from '../recipe-creation/recipe-creation.component';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield'; // <-- Import IconFieldModule
import { InputIconModule } from 'primeng/inputicon'; // <-- Import InputIconModule
import { TagModule } from 'primeng/tag'; // <-- Import TagModule if not already in SharedModule

@Component({
  selector: 'app-assign-meal',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ToastModule,
    ProgressSpinnerModule,
    ButtonModule,
    MessageModule,
    RippleModule,
    TooltipModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,  // <-- Add IconFieldModule
    InputIconModule,  // <-- Add InputIconModule
    TagModule         // <-- Add TagModule
  ],
  templateUrl: './assign-meal.component.html',
  styleUrls: ['./assign-meal.component.css'],
  providers: [MessageService, DatePipe]
})
export class AssignMealComponent implements OnInit {

  @ViewChild('locationInput') locationInputRef: ElementRef<HTMLInputElement>;

  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = []; // <-- Array for filtered results 
  errorLoading: boolean = false;
  selectedRecipe: Recipe | null = null;
  targetDate!: Date;
  formattedTargetDate: string = '';
  selectedLocation: string = 'Maison';
  searchTerm: string = ''; // <-- Property for search input
    isThawingNeeded: boolean = false;
  assignee: any = undefined;


  constructor(
    private recipeService: RecipeService,
    public dialogRef: DynamicDialogRef,
    public dialogConfig: DynamicDialogConfig,
    private messageService: MessageService,
    private dialogService: DialogService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    if (this.dialogConfig.data?.date) {
      this.targetDate = this.dialogConfig.data.date;
      this.formattedTargetDate = this.datePipe.transform(this.targetDate, 'EEEE d MMMM yyyy') || 'Date inconnue';

      if (this.dialogConfig.data.meal?.location) {
        this.selectedLocation = this.dialogConfig.data.meal.location;
      } else {
        this.selectedLocation = 'Maison';
      }

      if(this.dialogConfig.data.meal?.isThawingNeeded){
        this.isThawingNeeded = this.dialogConfig.data.meal.isThawingNeeded;
      }

      if(this.dialogConfig.data.meal?.assignedUser) { 
        this.assignee = this.dialogConfig.data.meal?.assignedUser;
      } 

      this.loadRecipes();
    } else {
      console.error("Target date not provided to AssignMealComponent dialog.");
      this.errorLoading = true; 
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Date cible manquante.' });
    }
  }

  loadRecipes(): void { 
    this.errorLoading = false;
    this.recipeService.getAllRecipes().subscribe({
      next: (data) => {
        this.recipes = data; 
        this.filterRecipes(); 

        const existingMealRecipeId = this.dialogConfig.data?.meal?.recipe?.id;
        if (existingMealRecipeId) {
            // Find in the original list, then select
            const recipeToSelect = this.recipes.find(r => r.id === existingMealRecipeId);
            if (recipeToSelect) {
              this.selectRecipe(recipeToSelect);
            }
        }
      },
      error: (err) => {
        console.error("Error loading recipes:", err); 
        this.errorLoading = true;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les recettes.' });
      }
    });
  }

  // Method to filter recipes based on searchTerm
  filterRecipes(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredRecipes = [...this.recipes]; // Show all if search is empty
    } else {
      this.filteredRecipes = this.recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(term) ||
        (recipe.category && recipe.category.toLowerCase().includes(term))
        // Add || recipe.description.toLowerCase().includes(term) if needed
      );
    }
  }

  // Call filterRecipes when search input changes
  onSearchChange(): void {
    this.filterRecipes();
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
  }

  assignSelectedMeal(): void {
    if (this.selectedRecipe) {
      console.log("ASSIGNING SELECTED MEAL", this.assignee);
      this.dialogRef.close({
          recipe: this.selectedRecipe,
          date: this.targetDate,
          location: this.selectedLocation,
          isThawingNeeded: this.isThawingNeeded,
          assignee: this.assignee
        });
    } else {
       this.messageService.add({ severity: 'warn', summary: 'Sélection requise', detail: 'Veuillez sélectionner une recette.' });
    }
  }

  openCreateRecipeDialog(): void {
    const createRef = this.dialogService.open(RecipeCreationComponent, {
        header: 'Créer une nouvelle recette',
        width: '90%',
        contentStyle: {"max-height": "80vh", "overflow": "auto"},
        baseZIndex: 10001
    });

    createRef.onClose.subscribe((newRecipe?: Recipe) => {
        if (newRecipe) {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Recette "${newRecipe.name}" créée.` });
            this.recipes.unshift(newRecipe); // Add to the main list
            this.filterRecipes(); // <-- Re-filter the list
            this.selectRecipe(newRecipe); // Select the newly added recipe
        }

        setTimeout(() => {
            if (this.locationInputRef?.nativeElement) {
                this.locationInputRef.nativeElement.focus();
            }
        }, 50);
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
