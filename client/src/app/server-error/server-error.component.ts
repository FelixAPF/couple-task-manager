import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // Import RouterLink for the button
import { NgIf } from '@angular/common'; // Import NgIf if you want conditional messages
import { TranslatePipe } from '@ngx-translate/core';
import { VersionControlService } from '../service/version-control.service';
import { catchError, interval, of, Subscription, switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-server-error',
  imports: [RouterLink, NgIf, TranslatePipe], // Import necessary modules for the template
  templateUrl: './server-error.component.html',
  styleUrl: './server-error.component.css',
  providers: [TranslatePipe]
})
export class ServerErrorComponent implements OnInit, OnDestroy {
  router: Router = inject(Router);
  versionService: VersionControlService = inject(VersionControlService);
  // You could pass error details via router state if needed,
  // but for a "server down" page, a static message is usually enough.

  // Simple property to control a message if you wanted to distinguish
  // between temporary outage vs. long-term maintenance.
  isMaintenanceMode: boolean = false;
  subscription: Subscription = new Subscription();

  // You might inject a service here to report the error or check server status
  // private statusService = inject(StatusService);

  // Example method to simulate rechecking server status
  reloadPage(): void {
    window.location.reload();
  }
  
  ngOnInit(){
    const seconds = 5;
    const retrievalIntervalMs = seconds * 1000;
    this.subscription.add(interval(retrievalIntervalMs).pipe(
      switchMap(() => this.versionService.retrieveVersion().pipe(
      catchError(err => {
            console.error('Error fetching data:', err);
            // Return a new observable of an undefined value to keep the main stream alive
            return of(undefined);
          })
      ))
    ).subscribe((v) => {
      if(v){
        this.router.navigateByUrl("/dashboard");
      }
    }))
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
}