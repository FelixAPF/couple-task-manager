// src/app/service/shared-video-import.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { MessageService } from 'primeng/api';
import { RecipeService } from './recipe.service';
import { PendingSharedRecipeService } from './pending-shared-recipe.service';
import ShareReceiver, { SharedVideoEvent } from '../plugins/share-receiver.plugin';

@Injectable({ providedIn: 'root' })
export class SharedVideoImportService {

  constructor(
    private recipeService: RecipeService,
    private pendingSharedRecipeService: PendingSharedRecipeService,
    private router: Router,
    private messageService: MessageService
  ) {
    if (Capacitor.isNativePlatform()) {
      this.init();
    }
  }

  private async init(): Promise<void> {
    // Video shared while the app is already running / backgrounded
    ShareReceiver.addListener('sharedVideoReceived', (data: SharedVideoEvent) => {
      this.importVideoFromPath(data.path);
    });

    // Video that was pending from a cold-start share launch
    const pending = await ShareReceiver.getPendingVideo();
    if (pending?.path) {
      this.importVideoFromPath(pending.path);
    }
  }

  private async importVideoFromPath(nativePath: string): Promise<void> {
    try {
      this.messageService.add({
        severity: 'info',
        summary: 'Analyse',
        detail: 'Analyse de la vidéo partagée en cours...'
      });

      const fileName = nativePath.substring(nativePath.lastIndexOf('/') + 1);

      // Read the native file (absolute path, app's own cache dir — no extra permission needed)
      const readResult = await Filesystem.readFile({ path: nativePath });
      const base64Data = readResult.data as string;

      const file = this.base64ToFile(base64Data, fileName, 'video/mp4');

      // Reuses the exact same endpoint/flow as manual video upload in the recipe creation dialog
      this.recipeService.smartImport(file).subscribe({
        next: (recipeData) => {
          this.pendingSharedRecipeService.set(recipeData);
          // Named-outlet route matching app.routes.ts: meals -> (meals: recipes)
          this.router.navigate(['meals', { outlets: { meals: ['recipes'] } }]);
        },
        error: (err) => {
          console.error('Failed to import shared video recipe:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible d\'analyser la vidéo partagée.'
          });
        }
      });
    } catch (e) {
      console.error('Error reading shared video file:', e);
    }
  }

  private base64ToFile(base64Data: string, fileName: string, mimeType: string): File {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], fileName, { type: mimeType });
  }
}
