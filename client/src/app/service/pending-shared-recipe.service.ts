// src/app/service/pending-shared-recipe.service.ts

import { Injectable } from '@angular/core';
import { Recipe } from '../model/recipes';

@Injectable({ providedIn: 'root' })
export class PendingSharedRecipeService {
  private pending: Recipe | null = null;

  set(recipe: Recipe): void {
    this.pending = recipe;
  }

  /** Returns the pending recipe (if any) and clears it, so it's only consumed once. */
  consume(): Recipe | null {
    const recipe = this.pending;
    this.pending = null;
    return recipe;
  }
}
