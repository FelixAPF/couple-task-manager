import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css'
})
export class PrivacyComponent {
  currentDate = new Date();
  // Centralize your support email
  supportEmail = 'staff.weblead@gmail.com';
}
