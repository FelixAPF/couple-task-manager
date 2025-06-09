import { Component, OnInit } from '@angular/core';
import { Recipe } from '../../model/recipes';
import { RecipeService } from '../../service/recipe.service';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';
import { Subscriber, Subscription } from 'rxjs';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-recipe-random-dialog',
  imports: [RecipeCardComponent, SharedModule],
  templateUrl: './recipe-random-dialog.component.html',
  styleUrl: './recipe-random-dialog.component.css'
})
export class RecipeRandomDialogComponent implements OnInit {
  recipe: Recipe;
  subscription: Subscription = new Subscription();
  loading: boolean = true;

  constructor(private recipeService: RecipeService){
  }

  ngOnInit(){
    this.randomCard();
  }

  randomCard(){
    this.subscription.add(this.recipeService.randomRecipe().subscribe(recipe => {
      this.recipe = recipe;
    }));  
  }

}
