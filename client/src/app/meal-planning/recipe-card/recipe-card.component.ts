import { ChangeDetectorRef, Component, ElementRef, Input, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { Ingredient, Recipe, RecipeType } from '../../model/recipes';
import { SharedModule } from '../../shared.module';
import { TagSeverity } from '../recipes-list/recipes-list.component';

@Component({
  selector: 'app-recipe-card',
  imports: [SharedModule],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.css'
})
export class RecipeCardComponent {
  @Input() recipe!: Recipe;
  @Input() buttonsTemplate!: TemplateRef<any>;
  @Input() openIngredients: boolean = false;
  @Input() clampDescription: boolean = false;
  overrideDescriptionClamp = false;
  isDescriptionOverflowing = false; // Added: Flag set by checking element height
  @ViewChild('descriptionParagraph') descriptionParagraphRef!: ElementRef<HTMLParagraphElement>; // Added

  constructor(private cdRef: ChangeDetectorRef){}

  // Optional: Map RecipeType enum to severity for p-tag styling
  getCategoryTagSeverity(category: RecipeType): TagSeverity { // Use the specific TagSeverity type
    switch (category) {
      case RecipeType.SANTE: return 'success';
      case RecipeType.VIANDE: return 'danger';
      case RecipeType.PATES: return 'warn';
      // Add cases for other RecipeType values if they exist and map them
      // case RecipeType.POISSON: return 'info';
      // case RecipeType.VEGETARIEN: return 'success';
      default: return 'info'; // Default severity
    }
  }

  // Helper to format ingredient display
  formatIngredient(ingredient: Ingredient): string {
    return `${ingredient.quantity  === 0 ? '' : ingredient.quantity} ${ingredient.unit || ''} ${ingredient.name}`.trim();
  }

  openDescription(): void {
    this.overrideDescriptionClamp = !this.overrideDescriptionClamp;
  }

  ngOnChanges(changes: SimpleChanges): void { // Added
    if (changes['recipe'] || changes['clampDescription']) {
      this.overrideDescriptionClamp = false;
      this.isDescriptionOverflowing = false;
      setTimeout(() => this.checkDescriptionOverflow(), 0);
    }
  }

  ngAfterViewInit(): void { // Added
    this.checkDescriptionOverflow();
  }
  
  checkDescriptionOverflow(): void { // Added
    if (!this.clampDescription || !this.descriptionParagraphRef?.nativeElement) {
      this.isDescriptionOverflowing = false;
      this.cdRef.markForCheck();
      return;
    }

    const element = this.descriptionParagraphRef.nativeElement;
    const tolerance = 1;
    const isOverflowing = element.scrollHeight > element.clientHeight + tolerance;

    if (this.isDescriptionOverflowing !== isOverflowing) {
        this.isDescriptionOverflowing = isOverflowing;
        this.cdRef.markForCheck();
    }
  }

  // --- Toggle Clamp Override ---

  toggleDescriptionClamp(): void { // Renamed from openDescription
    this.overrideDescriptionClamp = !this.overrideDescriptionClamp;
    this.cdRef.markForCheck();
  }
}
