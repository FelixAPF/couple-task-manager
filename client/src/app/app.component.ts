import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TaskService } from './service/task-service.service';
import { SharedModule } from "../app/shared.module"
import { NavbarComponent } from './header/navbar/navbar.component';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { FooterNavbarComponent } from './footer-navbar/footer-navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule, NavbarComponent, FooterNavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'client';
  swipeTransform = 'translateX(0)';

  isMobile = false;

  constructor(private translate: TranslateService, private primeng: PrimeNG, private router: Router){
    translate.setDefaultLang('fr');
    translate.addLangs(['fr', 'en']);
    translate.use('fr');
    this.primeng.ripple.set(true);
  }

  ngOnInit(): void {
    this.checkScreenWidth();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenWidth();
  }

  checkScreenWidth() {
    this.isMobile = window.innerWidth < 640; // Tailwind 'sm' breakpoint (640px)
  }
  swipeNavigation(event: any) {
    if (this.isMobile) {
      const currentRoute = this.router.url;
      if (event.direction === 2) { // Swipe left
        this.swipeTransform = 'translateX(-30%)'; // Reduced translation
        setTimeout(() => {
          if (currentRoute === '/dashboard') {
            this.router.navigate(['/tasks']);
          } else if (currentRoute === '/tasks') {
            this.router.navigate(['/split']);
          }
          this.swipeTransform = 'translateX(0)';
        }, 200); // Reduced delay
      } else if (event.direction === 4) { // Swipe right
        this.swipeTransform = 'translateX(30%)'; // Reduced translation
        setTimeout(() => {
          if (currentRoute === '/tasks') {
            this.router.navigate(['/dashboard']);
          } else if (currentRoute === '/split') {
            this.router.navigate(['/tasks']);
          }
          this.swipeTransform = 'translateX(0)';
        }, 200); // Reduced delay
      }
    }
  }
}
