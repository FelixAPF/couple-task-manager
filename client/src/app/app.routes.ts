import { Routes } from '@angular/router';
import { DashboardComponent } from './app/pages/dashboard/dashboard.component';
import { TasksComponent } from './tasks/tasks.component';
import { AddTaskComponent } from './tasks/add-task/add-task.component';
import { ShoppingListComponent } from './shopping-planning/shopping-list/shopping-list.component';
import { MealsListComponent } from './meal-planning/meals-list/meals-list.component';
import { RecipesListComponent } from './meal-planning/recipes-list/recipes-list.component';
import { MealsSectionComponent } from './meal-planning/meals-section/meals-section.component';
import { TaskHistoryComponent } from './tasks/task-history/task-history.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'shopping-list', component: ShoppingListComponent },
    {
        path: 'meals', // Matches /meals
        component: MealsSectionComponent, // This component should contain <router-outlet name="meals"></router-outlet>
        children: [
            { path: '', component: MealsListComponent, outlet: 'meals' },
            { path: 'recipes', component: RecipesListComponent, outlet: 'meals' },
        ]
    },
    { path: 'tasks', children: [
        { path: "", component: TasksComponent },
        { path: "add-task", component: AddTaskComponent },
        { path: "history/:id", component: TaskHistoryComponent}
        ]
    },
];
