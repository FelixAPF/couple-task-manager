import { Routes } from '@angular/router';
import { DashboardComponent } from './app/pages/dashboard/dashboard.component';
import { TasksComponent } from './tasks/tasks.component';
import { AddTaskComponent } from './tasks/add-task/add-task.component';
import { ShoppingListComponent } from './shopping-planning/shopping-list/shopping-list.component';
import { MealsListComponent } from './meal-planning/meals-list/meals-list.component';
import { RecipesListComponent } from './meal-planning/recipes-list/recipes-list.component';
import { MealsSectionComponent } from './meal-planning/meals-section/meals-section.component';
import { TaskHistoryComponent } from './tasks/task-history/task-history.component';
import { LoginComponent } from './authentication/login/login.component';
import { RegisterComponent } from './authentication/register/register.component';
import { authGuard } from './guard/authentication/auth.guard';

export const routes: Routes = [
      // --- Public Routes ---
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '', pathMatch: 'full', redirectTo: 'dashboard'
    },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'shopping-list', component: ShoppingListComponent, canActivate: [authGuard] },
    {
        path: 'meals', // Matches /meals
        component: MealsSectionComponent, // This component should contain <router-outlet name="meals"></router-outlet>
        children: [
            { path: '', component: MealsListComponent, outlet: 'meals', canActivate: [authGuard] },
            { path: 'recipes', component: RecipesListComponent, outlet: 'meals', canActivate: [authGuard] },
        ], canActivate: [authGuard]
    },
    { path: 'tasks', children: [
        { path: "", component: TasksComponent, canActivate: [authGuard] },
        { path: "add-task", component: AddTaskComponent, canActivate: [authGuard] },
        { path: "history/:id", component: TaskHistoryComponent, canActivate: [authGuard]}
        ]
    },
];
