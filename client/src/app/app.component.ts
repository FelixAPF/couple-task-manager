import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskService } from './service/task-service.service';
import { SharedModule } from "../app/shared.module"
import { NavbarComponent } from './header/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'client';

  constructor(){}

  ngOnInit(): void {
  }

  
}
