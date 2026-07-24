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
import { ManageHouseholdComponent } from './household/manage-household/manage-household.component';
import { WaysToCareComponent } from './household/ways-to-care/ways-to-care.component';
import { RewardsComponent } from './household/rewards/rewards.component';
import { ToDoListComponent } from './household/to-do-list/to-do-list.component';
import { WishListComponent } from './household/wish-list/wish-list.component';
import { ServerErrorComponent } from './server-error/server-error.component';
import { ContactsComponent } from './household/contacts/contacts.component';
import { TravelChecklistComponent } from './service/components/travel/travel-checklist/travel-checklist.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { LetterListComponent } from './letters/letter-list/letter-list.component';
import { CreateLetterComponent } from './letters/create-letter/create-letter.component';
import { LetterDetailComponent } from './letters/letter-detail/letter-detail.component';
import { FoodIntakeTrackingDashboardComponent } from './food-intake-tracking-dashboard/food-intake-tracking-dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminGuard } from './guard/admin.guard';
import { ReceiptSplitterComponent } from './recipe-splitter/recipe-splitter.component';

// Finance Components
import { FinanceDashboardComponent } from './finance/finance-dashboard/finance-dashboard.component';
import { PaycheckConfigComponent } from './finance/paycheck-config/paycheck-config.component';
import { HouseholdExpensesComponent } from './finance/household-expenses/household-expenses.component';
import { PersonalExpensesComponent } from './finance/personal-expenses/personal-expenses.component';
import { BankAccountsComponent } from './finance/bank-accounts/bank-accounts.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'privacy-policy', component: PrivacyComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'server-error', component: ServerErrorComponent }, 
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    
    // Clean, modular finance routes
    { 
        path: 'finance', 
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: FinanceDashboardComponent },
            { path: 'paycheck-config', component: PaycheckConfigComponent },
            { path: 'household-expenses', component: HouseholdExpensesComponent },
            { path: 'personal-expenses', component: PersonalExpensesComponent },
            { path: 'bank-accounts', component: BankAccountsComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },

    { path: 'shopping-list', component: ShoppingListComponent, canActivate: [authGuard] },
    { path: 'procedures', loadComponent: () => import('./procedures/procedures-list/procedures-list.component').then(m => m.ProceduresListComponent), canActivate: [authGuard] },
    {
        path: 'meals', 
        component: MealsSectionComponent, 
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
    {
        path: 'food-tracking', children: [
            { path: "", component: FoodIntakeTrackingDashboardComponent, canActivate: [authGuard] }
        ]
    },
    {
        path: 'household', children: [
            { path: 'manage', component: ManageHouseholdComponent, canActivate: [authGuard] },
            { path: 'ways-to-care', component: WaysToCareComponent, canActivate: [authGuard] },
            { path: 'rewards', component: RewardsComponent, canActivate: [authGuard] },
            { path: 'to-do', component: ToDoListComponent, canActivate: [authGuard] },
            { path: 'wish-list', component: WishListComponent, canActivate: [authGuard] },
            { path: 'travel', component: TravelChecklistComponent, canActivate: [authGuard] },
            { path: 'contacts', component: ContactsComponent, canActivate: [authGuard] },
        ]
    },
    {
        path: 'letters',
        canActivate: [authGuard],
        children: [
            { path: '', component: LetterListComponent },
            { path: 'new', component: CreateLetterComponent },
            { path: 'view/:id', component: LetterDetailComponent }
        ]
    },
    { path: 'receipt-splitter', component: ReceiptSplitterComponent, canActivate: [authGuard] },
    { 
        path: 'admin/dashboard', 
        component: AdminDashboardComponent, 
        canActivate: [AdminGuard] 
    },
    { path: '**', redirectTo: '/dashboard', pathMatch: 'full' },
];