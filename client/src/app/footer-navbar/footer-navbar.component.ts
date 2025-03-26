import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'primeng/api';

@Component({
  selector: 'app-footer-navbar',
  imports: [SharedModule, RouterModule],
  templateUrl: './footer-navbar.component.html',
  styleUrl: './footer-navbar.component.css'
})
export class FooterNavbarComponent {

}
