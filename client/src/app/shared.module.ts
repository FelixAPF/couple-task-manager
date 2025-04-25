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
import { AvatarModule } from 'primeng/avatar';
import { RouterModule } from '@angular/router';
import {  Textarea } from 'primeng/inputtextarea';
import {  ProgressSpinnerModule } from 'primeng/progressspinner';
import {  TagModule } from 'primeng/tag';
import {  FileUploadModule } from 'primeng/fileupload';
import {  PasswordModule } from 'primeng/password';
import {  DialogModule } from 'primeng/dialog';
import {  InputNumberModule } from 'primeng/inputnumber';
import {  DropdownModule } from 'primeng/dropdown';
import {  RatingModule } from 'primeng/rating';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {ClipboardModule} from '@angular/cdk/clipboard';
import localeFrCA from '@angular/common/locales/fr-CA';
registerLocaleData(localeFrCA);

@NgModule({
  declarations: [],
  imports: [
    CommonModule, AvatarModule, RatingModule, InputNumberModule, DialogModule, DropdownModule, ClipboardModule, PasswordModule, FileUploadModule, FontAwesomeModule, ProgressSpinnerModule, TagModule, ToolbarModule, Textarea, FieldsetModule, SelectButtonModule, TooltipModule, BadgeModule, AutoCompleteModule, InputTextModule, TextareaModule, MessageModule, ConfirmDialogModule, InputGroupModule,InputGroupAddonModule, TranslateModule,IconField,InputIcon, SelectModule, AccordionModule,CheckboxModule, StepperModule, RadioButtonModule, DynamicDialogModule, FluidModule, DatePickerModule, Card, Toast, SplitButton, TableModule, RouterModule, ButtonModule
  ],
  exports: [CommonModule, AvatarModule, RatingModule, InputNumberModule, DialogModule, DropdownModule, ClipboardModule, PasswordModule, FileUploadModule, FontAwesomeModule, ProgressSpinnerModule, TagModule, ToolbarModule, Textarea , FieldsetModule, SelectButtonModule, TooltipModule, BadgeModule, AutoCompleteModule, MessageModule, InputTextModule, TextareaModule, TranslateModule,InputGroupModule,InputGroupAddonModule, ConfirmDialogModule, IconField, InputIcon,SelectModule, AccordionModule,CheckboxModule, StepperModule, RadioButtonModule, DynamicDialogModule, FluidModule, DatePickerModule,Card, Toast, SplitButton, TableModule, RouterModule, ButtonModule],
})
export class SharedModule { }
