import { Routes } from '@angular/router';
import { DashboardComponent } from './app/pages/dashboard/dashboard.component';
import { TasksComponent } from './tasks/tasks.component';
import { AddTaskComponent } from './tasks/add-task/add-task.component';
import { SplitTaskComponent } from './tasks/split-task/split-task.component';
import { ShoppingListComponent } from './shopping-planning/shopping-list/shopping-list.component';
import { MealsListComponent } from './meal-planning/meals-list/meals-list.component';
import { RecipesListComponent } from './meal-planning/recipes-list/recipes-list.component';
import { MealsSectionComponent } from './meal-planning/meals-section/meals-section.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'shopping-list', component: ShoppingListComponent },
    { path: 'meals', children: [
        { path: "", component: MealsSectionComponent },
        { path: "meals-list", outlet: "meals", component: MealsListComponent },
        { path: "recipes", outlet: "meals", component: RecipesListComponent },
    ] },
    { path: 'tasks', children: [
        { path: "", component: TasksComponent },
        { path: "add-task", component: AddTaskComponent },
        ]
    },

    { path: 'split', component: SplitTaskComponent },
];
