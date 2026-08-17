import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, switchMap, timer } from 'rxjs';
import { VersionControlService } from './version-control.service';

/**
 * Single source of truth for "can we reach the backend right now?".
 * Decoupled from routing on purpose: an interceptor calls reportOutage()
 * from anywhere, any component can react to isDown$, and the retry loop
 * keeps running in the background even if nothing is currently rendering
 * the error UI — so it's never stuck showing a stale state.
 */
@Injectable({ providedIn: 'root' })
export class BackendStatusService {
  private versionService = inject(VersionControlService);

  private readonly _isDown$ = new BehaviorSubject<boolean>(false);
  readonly isDown$: Observable<boolean> = this._isDown$.asObservable();

  private pollSub: Subscription | null = null;
  private lastManualRetryAt = 0;
  private readonly RETRY_COOLDOWN_MS = 3000;

  /** Call this from your HTTP error interceptor on a 0/5xx/network failure. */
  reportOutage(): void {
    if (this._isDown$.value) return; // already down + already polling
    this._isDown$.next(true);
    this.startPolling();
  }

  reportRecovered(): void {
    this._isDown$.next(false);
    this.stopPolling();
  }

  /** Manual "Try again" click. Resolves true/false, throttled so button-mashing can't spam the backend. */
  retryNow(): Observable<boolean> {
    const now = Date.now();
    if (now - this.lastManualRetryAt < this.RETRY_COOLDOWN_MS) {
      return of(false);
    }
    this.lastManualRetryAt = now;
    return this.versionService.retrieveVersion().pipe(
      map(() => { this.reportRecovered(); return true; }),
      catchError(() => of(false))
    );
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollSub = timer(6000, 6000).pipe(
      switchMap(() => this.versionService.retrieveVersion().pipe(catchError(() => of(null))))
    ).subscribe((v) => { if (v) this.reportRecovered(); });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }
}