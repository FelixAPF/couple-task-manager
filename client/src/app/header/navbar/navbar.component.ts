import { Component } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  imports: [SharedModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isMenuOpen = false;

  constructor(private router: Router, private translate: TranslateService){}

  useLanguage(language: string): void {
    this.translate.use(language);
  }

toggleMenu(): void {
  this.isMenuOpen = !this.isMenuOpen;
}

}
