import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
  selector: 'app-radio-test',
  imports: [CommonModule, RadioButtonModule],
  templateUrl: './radio-test.component.html',
  styleUrl: './radio-test.component.css',
})
export class RadioTestComponent {
  frequencies: { label: string; value: string }[] = [
    { label: 'Quotidien', value: 'DAILY' },
    { label: 'Hebdomadaire', value: 'WEEKLY' },
    { label: 'Bi-mensuel', value: 'BIWEEKLY' },
    { label: 'Mensuel', value: 'MONTHLY' },
    { label: 'Bi-annuel', value: 'BIYEARLY' },
    { label: 'Annuel', value: 'YEARLY' },
  ];

  constructor() {}
}