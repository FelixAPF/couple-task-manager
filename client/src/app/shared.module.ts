import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './app/pages/dashboard/dashboard.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import {  MatRadioModule } from '@angular/material/radio';
import {  MatFormFieldModule } from '@angular/material/form-field';
import {  MatDatepickerModule } from '@angular/material/datepicker';
import {  MatStepperModule } from '@angular/material/stepper';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SplitButton } from 'primeng/splitbutton';
import { Toast } from 'primeng/toast';
import { Card } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { FluidModule } from 'primeng/fluid';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { StepperModule } from 'primeng/stepper';
import { AccordionModule } from 'primeng/accordion';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';




import { RouterModule } from '@angular/router';
import { MyTasksComponent } from './tasks/my-tasks/my-tasks.component';



@NgModule({
  declarations: [],
  imports: [
    CommonModule, SelectModule, AccordionModule,CheckboxModule, StepperModule, RadioButtonModule, DynamicDialogModule, FluidModule, DatePickerModule, Card, Toast, SplitButton, TableModule, MatButtonModule, RouterModule, MatInputModule, ButtonModule, MatTableModule, MatDialogModule,  MatRadioModule,MatFormFieldModule, MatDatepickerModule,MatStepperModule
  ],
  exports: [CommonModule, SelectModule, AccordionModule,CheckboxModule, StepperModule, RadioButtonModule, DynamicDialogModule, FluidModule, DatePickerModule,Card, Toast, SplitButton, TableModule, MatButtonModule, RouterModule, MatInputModule, ButtonModule, MatTableModule, MatDialogModule, MatRadioModule,MatFormFieldModule, MatDatepickerModule, MatStepperModule]
})
export class SharedModule { }
