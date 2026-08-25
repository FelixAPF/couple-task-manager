import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TagModule } from 'primeng/tag';

import { SharedModule } from '../../shared.module';
import { Recipe, RecipeType } from '../../model/recipes';
import { RecipeService } from '../../service/recipe.service';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';
import { RecipeCreationComponent } from '../recipe-creation/recipe-creation.component';
import { AiMealPlannerDialogComponent } from '../../ai-meal-planner-dialog/ai-meal-planner-dialog.component';

@Component({
  selector: 'app-assign-meal',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ToastModule,
    ButtonModule,
    MessageModule,
    RippleModule,
    TooltipModule,
    FormsModule,
    InputTextModule,
    InputSwitchModule,
    TagModule
  ],
  templateUrl: './assign-meal.component.html',
  styleUrls: ['./assign-meal.component.css'],
  providers: [MessageService, DatePipe]
})
export class AssignMealComponent implements OnInit {
  @ViewChild('locationInput') locationInputRef!: ElementRef<HTMLInputElement>;

  private recipeService = inject(RecipeService);
  private householdService = inject(HouseholdService);
  public dialogRef = inject(DynamicDialogRef);
  public dialogConfig = inject(DynamicDialogConfig);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private datePipe = inject(DatePipe);

  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = []; 
  householdMembers: HouseholdMember[] = [];
  errorLoading: boolean = false;
  
  selectedRecipe: Recipe | null = null;
  isChangingRecipe: boolean = false;
  targetDate!: Date;
  formattedTargetDate: string = '';
  selectedLocation: string = 'Maison';
  searchTerm: string = ''; 
  selectedCategory: string = 'ALL';
  isThawingNeeded: boolean = false;
  assignee: HouseholdMember | null = null;
  isEditMode: boolean = false;

  categoryPills: { label: string; value: string }[] = [
    { label: 'Tous', value: 'ALL' },
    { label: '🍝 Pâtes', value: 'PATES' },
    { label: '🍗 Poulet', value: 'POULET' },
    { label: '🥩 Boeuf', value: 'BOEUF' },
    { label: '🥗 Santé', value: 'SANTE' },
    { label: '🐟 Poisson', value: 'POISSON' },
    { label: '🍔 Burgers', value: 'BURGER' },
    { label: '🍲 Soupes', value: 'SOUPE' }
  ];

  ngOnInit(): void {
    if (this.dialogConfig.data?.date) {
      this.targetDate = this.dialogConfig.data.date;
      this.formattedTargetDate = this.datePipe.transform(this.targetDate, 'EEEE d MMMM yyyy') || 'Date inconnue';
      
      const meal = this.dialogConfig.data.meal;
      if (meal) {
        this.isEditMode = true;
        this.selectedLocation = meal.location || 'Maison';
        this.isThawingNeeded = meal.isThawingNeeded || false;
        this.assignee = meal.assignedUser || null;
      }

      this.loadHouseholdMembers();
      this.loadRecipes();
    } else {
      console.error("Target date not provided to AssignMealComponent dialog.");
      this.errorLoading = true;
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Date cible manquante.' });
    }
  }

  loadHouseholdMembers(): void {
    this.householdService.retrieveHousehold().subscribe(household => {
      this.householdMembers = household?.members || [];
    });
  }

  loadRecipes(): void {
    this.errorLoading = false;
    this.recipeService.getAllRecipes().subscribe({
      next: (data) => {
        this.recipes = data || [];
        this.filterRecipes();

        const existingMealRecipeId = this.dialogConfig.data?.meal?.recipe?.id;
        if (existingMealRecipeId) {
          const matched = this.recipes.find(r => r.id === existingMealRecipeId);
          if (matched) {
            this.selectedRecipe = matched;
          }
        }
      },
      error: () => {
        this.errorLoading = true;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les recettes.' });
      }
    });
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
    this.filterRecipes();
  }

  filterRecipes(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredRecipes = this.recipes.filter(recipe => {
      const matchCat = this.selectedCategory === 'ALL' || recipe.category === this.selectedCategory;
      const matchSearch = !term ||
        recipe.name.toLowerCase().includes(term) ||
        (recipe.category && recipe.category.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
    this.isChangingRecipe = false;
  }

  assignSelectedMeal(): void {
    if (this.selectedRecipe) {
      this.dialogRef.close({
        recipe: this.selectedRecipe,
        date: this.targetDate,
        location: this.selectedLocation || 'Maison',
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
      contentStyle: { "max-height": "80vh", "overflow": "auto" },
      baseZIndex: 10001
    });

    createRef.onClose.subscribe((newRecipe?: Recipe) => {
      if (newRecipe) {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Recette "${newRecipe.name}" créée.` });
        this.recipes.unshift(newRecipe);
        this.filterRecipes();
        this.selectRecipe(newRecipe);
      }
    });
  }

  openAiPlannerDialog(): void {
    const aiRef = this.dialogService.open(AiMealPlannerDialogComponent, {
      header: 'Planificateur IA de la semaine',
      width: '90%',
      modal: true,
      dismissableMask: true,
      contentStyle: { "max-height": "80vh", "overflow": "auto" },
      baseZIndex: 10001,
      data: { startDate: this.targetDate }
    });

    aiRef.onClose.subscribe((success: boolean) => {
      if (success) {
        this.closeDialog();
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}