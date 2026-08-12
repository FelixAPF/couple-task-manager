// src/app/service/tiktok-clipboard-import.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RecipeService } from './recipe.service';
import { PendingSharedRecipeService } from './pending-shared-recipe.service';

const TIKTOK_URL_REGEX = /https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com\/\S+/i;

@Injectable({ providedIn: 'root' })
export class TikTokClipboardImportService {

  // Prevents re-prompting for the same link every time the app resumes
  private lastCheckedClipboardText: string | null = null;

  constructor(
    private recipeService: RecipeService,
    private pendingSharedRecipeService: PendingSharedRecipeService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    if (Capacitor.isNativePlatform()) {
      this.init();
    }
  }

  private init(): void {
    App.addListener('resume', () => {
      this.checkClipboard();
    });

    // Also check once on cold start (e.g. app was launched right after copying a link)
    this.checkClipboard();
  }

  private async checkClipboard(): Promise<void> {
    try {
      const { value } = await Clipboard.read();
      if (!value || value === this.lastCheckedClipboardText) {
        return;
      }
      this.lastCheckedClipboardText = value;

      const match = value.match(TIKTOK_URL_REGEX);
      if (!match) {
        return;
      }

      const tiktokUrl = match[0];

      this.confirmationService.confirm({
        header: 'Lien TikTok détecté',
        message: 'Voulez-vous importer la recette de cette vidéo TikTok ?',
        acceptLabel: 'Importer',
        rejectLabel: 'Ignorer',
        accept: () => this.importFromUrl(tiktokUrl)
      });
    } catch (e) {
      // Clipboard read can fail/be denied on some devices/OS versions — fail silently,
      // this is a background convenience feature, not a critical path.
      console.warn('Clipboard check skipped:', e);
    }
  }

  private importFromUrl(url: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Analyse',
      detail: 'Analyse de la vidéo TikTok en cours...'
    });

    this.recipeService.smartImportUrl(url).subscribe({
      next: (recipeData) => {
        this.pendingSharedRecipeService.set(recipeData);
        this.router.navigate(['meals', { outlets: { meals: ['recipes'] } }]);
      },
      error: (err) => {
        console.error('Failed to import TikTok recipe:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: "Impossible d'analyser cette vidéo TikTok."
        });
      }
    });
  }
}