import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // Import RouterLink for the button
import { NgIf } from '@angular/common'; // Import NgIf if you want conditional messages
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-server-error',
  imports: [RouterLink, NgIf, TranslatePipe], // Import necessary modules for the template
  templateUrl: './server-error.component.html',
  styleUrl: './server-error.component.css',
  providers: [TranslatePipe]
})
export class ServerErrorComponent {
  // You could pass error details via router state if needed,
  // but for a "server down" page, a static message is usually enough.

  // Simple property to control a message if you wanted to distinguish
  // between temporary outage vs. long-term maintenance.
  isMaintenanceMode: boolean = false;

  // You might inject a service here to report the error or check server status
  // private statusService = inject(StatusService);

  // Example method to simulate rechecking server status
  reloadPage(): void {
    window.location.reload();
  }
}