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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
// NEW: Import the selector
import { HouseholdMemberSelectorComponent } from '../../shared/household-member-selector/household-member-selector.component';

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
    IconFieldModule,
    InputIconModule,
    TagModule,
    HouseholdMemberSelectorComponent // <-- Added to imports
  ],
  templateUrl: './assign-meal.component.html',
  styleUrls: ['./assign-meal.component.css'],
  providers: [MessageService, DatePipe]
})
export class AssignMealComponent implements OnInit {

  @ViewChild('locationInput') locationInputRef!: ElementRef<HTMLInputElement>;

  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = []; 
  errorLoading: boolean = false;
  selectedRecipe: Recipe | null = null;
  targetDate!: Date;
  formattedTargetDate: string = '';
  selectedLocation: string = 'Maison';
  searchTerm: string = ''; 
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
            const recipeToSelect = this.recipes.find(r => r.id === existingMealRecipeId);
            if (recipeToSelect) {
              this.selectRecipe(recipeToSelect);
            }
        }
      },
      error: (err) => {
        this.errorLoading = true;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les recettes.' });
      }
    });
  }

  filterRecipes(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredRecipes = [...this.recipes]; 
    } else {
      this.filteredRecipes = this.recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(term) ||
        (recipe.category && recipe.category.toLowerCase().includes(term))
      );
    }
  }

  onSearchChange(): void {
    this.filterRecipes();
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
  }

  // NEW: Handler for the selector component
  onAssigneeSelected(member: any): void {
    this.assignee = member;
  }

  assignSelectedMeal(): void {
    if (this.selectedRecipe) {
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
            this.recipes.unshift(newRecipe);
            this.filterRecipes(); 
            this.selectRecipe(newRecipe); 
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