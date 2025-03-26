import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskService } from './service/task-service.service';
import { SharedModule } from "../app/shared.module"
import { NavbarComponent } from './header/navbar/navbar.component';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'client';

  constructor(private translate: TranslateService, private primeng: PrimeNG){
    translate.setDefaultLang('fr');
    translate.addLangs(['fr', 'en']);
    translate.use('fr');
    this.primeng.ripple.set(true);
  }

  ngOnInit(): void {
  }

  
}
