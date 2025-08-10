import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TravelService, TravelTemplateItem } from '../../../services/travel.service';

// PrimeNG Modules
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-travel-template',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    PanelModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule
  ],
  templateUrl: './travel-template.component.html',
})
export class TravelTemplateComponent implements OnInit {
  templateItems: TravelTemplateItem[] = [];
  newItemForm: FormGroup;
  
  // Using an object array for PrimeNG Dropdown
  categories = [
    { label: 'Clothes', value: 'Clothes' },
    { label: 'Carry-on', value: 'Carry-on' },
    { label: 'Pharmacy', value: 'Pharmacy' },
    { label: 'Essentials', value: 'Essentials' },
    { label: 'Other', value: 'Other' },
  ];
  
  householdId = 1; // This should be dynamically set

  constructor(private fb: FormBuilder, private travelService: TravelService) {
    this.newItemForm = this.fb.group({
      name: ['', Validators.required],
      category: ['Clothes', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadTemplate();
  }

  loadTemplate(): void {
    this.travelService.getTemplate(this.householdId).subscribe(items => {
      this.templateItems = items;
    });
  }

  addItem(): void {
    if (this.newItemForm.invalid) {
      return;
    }
    this.travelService.addTemplateItem(this.householdId, this.newItemForm.value)
      .subscribe(() => {
        this.loadTemplate();
        this.newItemForm.get('name')?.setValue('');
      });
  }

  deleteItem(itemId: number): void {
    // Note: You would need to add a 'deleteTemplateItem' method to your service
    // For now, this just removes it from the local array
    console.log(`Request to delete item ${itemId}`);
    this.templateItems = this.templateItems.filter(item => item.id !== itemId);
  }
}