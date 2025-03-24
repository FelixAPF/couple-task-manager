import { Routes } from '@angular/router';
import { DashboardComponent } from './app/pages/dashboard/dashboard.component';
import { TasksComponent } from './tasks/tasks.component';
import { AddTaskComponent } from './tasks/add-task/add-task.component';
import { SplitTaskComponent } from './tasks/split-task/split-task.component';

export const routes: Routes = [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'tasks', children: [
        { path: "", component: TasksComponent },
        { path: "add-task", component: AddTaskComponent },
    ]
    },

    { path: 'split', component: SplitTaskComponent },
];
