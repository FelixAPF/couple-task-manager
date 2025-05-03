import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, SimpleChanges, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { InputNumberModule } from 'primeng/inputnumber'; // Import InputNumberModule
import { Ingredient, Recipe, RecipeType } from '../../model/recipes';
import { SharedModule } from '../../shared.module';
import { TagSeverity } from '../recipes-list/recipes-list.component';

@Component({
  selector: 'app-recipe-card',
  // Add FormsModule and InputNumberModule here or ensure they are in SharedModule
  imports: [SharedModule, FormsModule, InputNumberModule],
  templateUrl: './recipe-card.component.html',
  styleUrls: ['./recipe-card.component.css'] // Corrected property name
})
export class RecipeCardComponent implements OnChanges, AfterViewInit { // Added OnChanges, AfterViewInit
  @Input() recipe!: Recipe;
  @Input() buttonsTemplate!: TemplateRef<any>;
  @Input() openIngredients: boolean = false;
  @Input() clampDescription: boolean = false;
  overrideDescriptionClamp = false;
  isDescriptionOverflowing = false;
  @ViewChild('descriptionParagraph') descriptionParagraphRef!: ElementRef<HTMLParagraphElement>;

  // --- Ingredient Scaling ---
  originalIngredients: Ingredient[] = []; // Store base ingredients
  scaledIngredients: Ingredient[] = [];   // Store ingredients for display
  displayPortionRatio: number | null = null; // User-editable portion ratio
  // --- End Ingredient Scaling ---

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Handle recipe changes for ingredient scaling and description clamping
    if (changes['recipe']) {
      this.initializeIngredients(); // Initialize/reset ingredients on recipe change
      this.overrideDescriptionClamp = false; // Reset description clamp
      this.isDescriptionOverflowing = false;
      // Delay checkDescriptionOverflow slightly to allow view to update
      setTimeout(() => this.checkDescriptionOverflow(), 0);
    }
    // Handle clampDescription changes separately
    if (changes['clampDescription'] && !changes['recipe']) { // Avoid redundant checks if recipe also changed
       this.overrideDescriptionClamp = false;
       this.isDescriptionOverflowing = false;
       setTimeout(() => this.checkDescriptionOverflow(), 0);
    }
  }

  ngAfterViewInit(): void {
    this.checkDescriptionOverflow();
  }

  initializeIngredients(): void {
    if (!this.recipe || !this.recipe.ingredients) {
        this.originalIngredients = [];
        this.scaledIngredients = [];
        this.displayPortionRatio = null;
        return;
    }

    // Store a deep copy of the original ingredients
    this.originalIngredients = JSON.parse(JSON.stringify(this.recipe.ingredients));
    // Initialize scaled ingredients with a copy
    this.scaledIngredients = JSON.parse(JSON.stringify(this.recipe.ingredients));

    // Set initial display ratio if basePortionRatio is valid
    if (this.recipe.basePortionRatio && this.recipe.basePortionRatio > 0) {
      this.displayPortionRatio = this.recipe.basePortionRatio;
      // No need to scale initially, as scaledIngredients starts equal to original
    } else {
      this.displayPortionRatio = null; // Hide the input if no base ratio
    }
    this.cdRef.markForCheck(); // Ensure view updates if needed
  }

  // --- Ingredient Scaling Logic ---
  onPortionChange(): void {
    // Trigger scaling calculation whenever the displayPortionRatio model changes
    this.calculateScaledIngredients();
  }

  calculateScaledIngredients(): void {
    // Ensure we have the necessary data to perform calculation
    if (
      !this.recipe.basePortionRatio ||
      this.recipe.basePortionRatio <= 0 ||
      this.displayPortionRatio === null ||
      this.displayPortionRatio <= 0 ||
      !this.originalIngredients ||
      this.originalIngredients.length === 0
    ) {
      // If input is invalid or base is invalid, reset to original quantities
      this.scaledIngredients = JSON.parse(JSON.stringify(this.originalIngredients));
       this.cdRef.markForCheck();
      return;
    }

    const factor = this.displayPortionRatio / this.recipe.basePortionRatio;

    this.scaledIngredients = this.originalIngredients.map(ingredient => {
      // Create a new object to avoid modifying the originalIngredients array
      const scaledIngredient: Ingredient = { ...ingredient };
      // Scale the quantity, handle potential floating point issues by rounding (e.g., to 1 decimal)
      scaledIngredient.quantity = parseFloat((ingredient.quantity * factor).toFixed(1));
      return scaledIngredient;
    });
     this.cdRef.markForCheck(); // Notify Angular to update the view
  }
  // --- End Ingredient Scaling Logic ---

  getCategoryTagSeverity(category: RecipeType): TagSeverity {
    switch (category) {
      case RecipeType.SANTE: return 'success';
      case RecipeType.VIANDE: return 'danger';
      case RecipeType.PATES: return 'warn';
      default: return 'info';
    }
  }

  formatIngredient(ingredient: Ingredient): string {
    // Handle potentially scaled quantities (including 0 or decimals)
    let quantityStr = '';
    if (ingredient.quantity > 0) {
        // Check if it's a whole number after potential scaling/rounding
        if (ingredient.quantity % 1 === 0) {
            quantityStr = ingredient.quantity.toString();
        } else {
            // Keep one decimal place if it's not whole
            quantityStr = ingredient.quantity.toFixed(2);
        }
    }

    return `${quantityStr} ${ingredient.unit || ''} ${ingredient.name}`.trim().replace(/^ /,''); // Ensure no leading space if quantity is 0
  }


  checkDescriptionOverflow(): void {
    if (!this.clampDescription || !this.descriptionParagraphRef?.nativeElement) {
      this.isDescriptionOverflowing = false;
       this.cdRef.markForCheck();
      return;
    }

    const element = this.descriptionParagraphRef.nativeElement;
    const tolerance = 1; // Small tolerance for rounding issues
    // Check scrollHeight against clientHeight
    const isOverflowing = element.scrollHeight > element.clientHeight + tolerance;

    // Only update and trigger change detection if the state actually changes
    if (this.isDescriptionOverflowing !== isOverflowing) {
        this.isDescriptionOverflowing = isOverflowing;
        this.cdRef.markForCheck(); // Use markForCheck for OnPush strategy compatibility
    }
  }

  toggleDescriptionClamp(): void {
    this.overrideDescriptionClamp = !this.overrideDescriptionClamp;
    this.cdRef.markForCheck();
  }

  // openDescription removed as toggleDescriptionClamp replaces it

}