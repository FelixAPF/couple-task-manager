import { LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SplitButton } from 'primeng/splitbutton';
import { Toast } from 'primeng/toast';
import { Card } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { FluidModule } from 'primeng/fluid';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { StepperModule } from 'primeng/stepper';
import { AccordionModule } from 'primeng/accordion';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import {TranslateModule} from "@ngx-translate/core";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FieldsetModule } from 'primeng/fieldset';
import { ToolbarModule } from 'primeng/toolbar';
import { RouterModule } from '@angular/router';
import { TaskAssignmentComponent } from './tasks/task-assignment/task-assignment.component';
import {  Textarea } from 'primeng/inputtextarea';
import localeFrCA from '@angular/common/locales/fr-CA';
registerLocaleData(localeFrCA);

@NgModule({
  declarations: [],
  imports: [
    CommonModule, ToolbarModule, Textarea, FieldsetModule, SelectButtonModule, TooltipModule, BadgeModule, AutoCompleteModule, InputTextModule, TextareaModule, MessageModule, ConfirmDialogModule, InputGroupModule,InputGroupAddonModule, TranslateModule,IconField,InputIcon, SelectModule, AccordionModule,CheckboxModule, StepperModule, RadioButtonModule, DynamicDialogModule, FluidModule, DatePickerModule, Card, Toast, SplitButton, TableModule, RouterModule, ButtonModule
  ],
  exports: [CommonModule, ToolbarModule, Textarea , FieldsetModule, SelectButtonModule, TooltipModule, BadgeModule, AutoCompleteModule, MessageModule, InputTextModule, TextareaModule, TranslateModule,InputGroupModule,InputGroupAddonModule, ConfirmDialogModule, IconField, InputIcon,SelectModule, AccordionModule,CheckboxModule, StepperModule, RadioButtonModule, DynamicDialogModule, FluidModule, DatePickerModule,Card, Toast, SplitButton, TableModule, RouterModule, ButtonModule],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-CA'},
  ]
})
export class SharedModule { }
