import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Recipe } from '../model/recipes';
import { Meal } from '../model/meals';
import { RecipeService } from '../service/recipe.service';
import { MealService } from '../service/meal.service';
import { MessageService } from 'primeng/api';
import { SharedModule } from '../shared.module';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-ai-meal-planner-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SharedModule, MultiSelectModule],
  templateUrl: './ai-meal-planner-dialog.component.html'
})
export class AiMealPlannerDialogComponent implements OnInit {

  selectedCuisines: string[] = [];
  cuisineOptions: any[] = [
    { label: 'Surprenez-moi (Variée)', value: '' },
    { label: 'Italienne 🇮🇹', value: 'Italian' },
    { label: 'Mexicaine 🇲🇽', value: 'Mexican' },
    { label: 'Japonaise 🇯🇵', value: 'Japanese' },
    { label: 'Grecque 🇬🇷', value: 'Greek' },
    { label: 'Indienne 🇮🇳', value: 'Indian' },
    { label: 'Française 🇫🇷', value: 'French' },
    { label: 'Thaïlandaise 🇹🇭', value: 'Thai' },
    { label: 'Végétarienne 🥦', value: 'Vegetarian' },
    { label: 'BBQ / Grillades 🥩', value: 'BBQ and Grill' }
  ];
  step: number = 1;
  generateNew: boolean = false;
  recipeCount: number = 0;
  generatedRecipes: Recipe[] = [];
  selectedRecipes: Recipe[] = [];
  weekPreview: Meal[] = [];
  loading: boolean = false;

  constructor(
    public dialogRef: DynamicDialogRef,
    public dialogConfig: DynamicDialogConfig,
    private recipeService: RecipeService,
    private mealService: MealService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {}

  setGenerateNew(val: boolean): void {
    this.generateNew = val;
  }

 nextStep1(): void {
    if (this.generateNew && this.recipeCount > 0) {
      this.loading = true;
      const countToFetch: number = this.recipeCount * 2;
      
      // NEW: Pass the array of selected cuisines
      this.recipeService.generateRandomRecipes(countToFetch, this.selectedCuisines).subscribe({
        next: (recipes: Recipe[]) => {
          this.generatedRecipes = recipes;
          this.step = 2;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 429) {
              this.messageService.add({severity:'warn', summary:'Limite atteinte', detail:'L\'IA a besoin d\'une pause ! Veuillez patienter environ une minute.'});
          } else {
              this.messageService.add({severity:'error', summary:'Erreur', detail:'Impossible de générer les recettes.'});
          }
        }
      });
    } else {
      this.generateWeekPreviewFromExisting();
    }
  }

  toggleRecipeSelection(recipe: Recipe): void {
    const index: number = this.selectedRecipes.findIndex((r: Recipe) => r.name === recipe.name);
    if (index > -1) {
      this.selectedRecipes.splice(index, 1);
    } else {
      if (this.selectedRecipes.length < this.recipeCount) {
        this.selectedRecipes.push(recipe);
      }
    }
  }

  nextStep2(): void {
    if (this.selectedRecipes.length === this.recipeCount) {
      this.loading = true;
      this.recipeService.saveMultipleRecipes(this.selectedRecipes).subscribe({
        next: (savedRecipes: Recipe[]) => {
          this.selectedRecipes = savedRecipes;
          this.generateWeekPreviewFromExisting(savedRecipes);
        },
        error: () => {
          this.loading = false;
          this.messageService.add({severity:'error', summary:'Error', detail:'Failed to save recipes'});
        }
      });
    }
  }

  generateWeekPreviewFromExisting(prioritizedRecipes: Recipe[] = []): void {
    this.loading = true;
    this.recipeService.getAllRecipes().subscribe((allRecipes: Recipe[]) => {
      const pool: Recipe[] = [...prioritizedRecipes, ...allRecipes];
      this.weekPreview = [];
      
      const baseDate: Date = this.dialogConfig.data?.startDate ? new Date(this.dialogConfig.data.startDate) : new Date();

      for (let i = 0; i < 7; i++) {
        const mealDate: Date = new Date(baseDate);
        mealDate.setDate(baseDate.getDate() + i);
        mealDate.setHours(12, 0, 0, 0); 
        
        const recipe: Recipe = pool[i % pool.length];
        this.weekPreview.push({
          date: mealDate,
          recipe: recipe,
          location: 'Maison',
          isThawingNeeded: false
        } as Meal);
      }
      this.step = 3;
      this.loading = false;
    });
  }

  confirmWeek(): void {
    this.loading = true;
    this.mealService.saveMultipleMeals(this.weekPreview).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Succès', detail:'Repas planifiés avec succès.'});
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
        this.messageService.add({severity:'error', summary:'Erreur', detail:'Impossible d\'assigner les repas.'});
      }
    });
  }
}