import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { SharedModule } from '../../shared.module'; // Provides PrimeNG form components etc.
import { Recipe, Ingredient, RecipeType } from '../../model/recipes';
import { RecipeService } from '../../service/recipe.service';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog'; // Import dialog refs
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
// Import specific PrimeNG form modules needed (many might be in SharedModule)
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';

interface SelectItem {
  label: string;
  value: RecipeType;
}

@Component({
  selector: 'app-recipe-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Essential for Reactive Forms
    SharedModule, // Provides common PrimeNG modules
    ToastModule,
    // Explicit imports for clarity or if not fully covered by SharedModule
    InputTextModule,
    TextareaModule,
    DropdownModule,
    ButtonModule,
  ],
  templateUrl: './recipe-creation.component.html',
  styleUrls: ['./recipe-creation.component.css'],
  providers: [MessageService] // Provide MessageService locally for the toast
})
export class RecipeCreationComponent implements OnInit {

  recipeForm!: FormGroup;
  isEditMode: boolean = false;
  recipeToEdit: Recipe | null = null;
  isLoading: boolean = false;
  recipeTypes: SelectItem[] = [];

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipeService,
    public dialogRef: DynamicDialogRef, // To close the dialog
    public dialogConfig: DynamicDialogConfig, // To receive data (recipe to edit)
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Prepare dropdown options from Enum
    this.recipeTypes = Object.values(RecipeType).map(value => ({
      label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(), // Format label nicely
      value: value
    }));

    // Check if data was passed for editing
    if (this.dialogConfig.data?.recipe) {
      this.isEditMode = true;
      this.recipeToEdit = this.dialogConfig.data.recipe;
    }

    this.initForm();
  }

  initForm(): void {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: [null, []], // Use null for initial dropdown state
      imageUrl: [''], // Add validation (e.g., pattern) if desired
      ingredients: this.fb.array([]) // Initialize as empty FormArray
    });

    // If editing, patch the form and populate ingredients
    if (this.isEditMode && this.recipeToEdit) {
      this.recipeForm.patchValue({
        name: this.recipeToEdit.name,
        description: this.recipeToEdit.description,
        category: this.recipeToEdit.category,
        imageUrl: this.recipeToEdit.imageUrl
      });
      // Populate the ingredients FormArray
      this.recipeToEdit.ingredients?.forEach(ingredient => {
        this.ingredients.push(this.createIngredientGroup(ingredient));
      });
    } else {
      // Optionally add one empty ingredient row for new recipes
      this.addIngredient();
    }
  }

  // Getter for easy access to the ingredients FormArray in the template
  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  // Helper to create a FormGroup for a single ingredient
  createIngredientGroup(ingredient?: Ingredient): FormGroup {
    return this.fb.group({
      name: [ingredient?.name || '', Validators.required],
      quantity: [ingredient?.quantity || '', []], // Consider type (string allows "1/2 cup")
      unit: [ingredient?.unit || ''] // Unit is optional
    });
  }

  // Adds a new, empty ingredient FormGroup to the FormArray
  addIngredient(): void {
    this.ingredients.push(this.createIngredientGroup());
  }

  // Removes an ingredient FormGroup from the FormArray at the given index
  removeIngredient(index: number): void {
    if (this.ingredients.length > 1) { // Prevent removing the last row if desired
       this.ingredients.removeAt(index);
    } else {
        // Optionally clear the fields instead of removing the last row
        // this.ingredients.at(index).reset();
        this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Au moins un ingrédient est requis.' });
    }
  }

  onSubmit(): void {
    this.recipeForm.markAllAsTouched(); // Trigger validation messages

    if (this.recipeForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez corriger les erreurs dans le formulaire.' });
      return;
    }

    this.isLoading = true;
    const formValue = this.recipeForm.value;

    const recipeData: Recipe = {
      // Include id only if editing
      ...(this.isEditMode && this.recipeToEdit?.id && { id: this.recipeToEdit.id }),
      name: formValue.name,
      description: formValue.description,
      category: formValue.category,
      imageUrl: formValue.imageUrl,
      ingredients: formValue.ingredients as Ingredient[] // Cast ingredients
    };

    const saveObservable = this.isEditMode
      ? this.recipeService.updateRecipe(recipeData)
      : this.recipeService.addRecipe(recipeData); // Ensure addRecipe exists in service

    saveObservable.subscribe({
      next: (savedRecipe) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Recette ${this.isEditMode ? 'mise à jour' : 'créée'} avec succès!` });
        // Close the dialog and pass back the saved recipe
        this.dialogRef.close(savedRecipe);
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Error saving recipe:", err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Impossible de ${this.isEditMode ? 'mettre à jour' : 'créer'} la recette.` });
      }
    });
  }

  // Method to close the dialog without saving
  closeDialog(): void {
    this.dialogRef.close(); // Pass no data back
  }

  // --- Form Control Getters for easier template access ---
  get name(): FormControl { return this.recipeForm.get('name') as FormControl; }
  get description(): FormControl { return this.recipeForm.get('description') as FormControl; }
  get category(): FormControl { return this.recipeForm.get('category') as FormControl; }
  get imageUrl(): FormControl { return this.recipeForm.get('imageUrl') as FormControl; }
  // --- End Form Control Getters ---
}
