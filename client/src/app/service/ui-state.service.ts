import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/** Small shared UI flags that don't belong to any one component — right now
 * just whether the mobile nav drawer is open, so sibling components (like the
 * footer dock) can react without a direct parent/child relationship. */
@Injectable({ providedIn: 'root' })
export class UiStateService {
  private readonly _isMobileMenuOpen$ = new BehaviorSubject<boolean>(false);
  readonly isMobileMenuOpen$ = this._isMobileMenuOpen$.asObservable();

  setMobileMenuOpen(open: boolean): void {
    this._isMobileMenuOpen$.next(open);
  }
}