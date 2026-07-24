import { Directive, HostListener, output, input, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appHoldClick]',
  standalone: true
})
export class HoldClickDirective implements OnDestroy {
  // Configuration inputs using the modern input API
  holdTime = input<number>(500); // Time in milliseconds required to trigger hold

  // Outputs using the modern output API
  onHold = output<void>();

  private timeoutId: any;

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPress(event: Event): void {
    // Prevent default touch behavior (like zooming or context menus) if needed
    if (event.type === 'touchstart') {
      event.preventDefault();
    }

    this.cancelTimeout();

    // Start a timer. If it completes without interruption, trigger the event.
    this.timeoutId = setTimeout(() => {
      this.onHold.emit();
    }, this.holdTime());
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  @HostListener('touchend')
  @HostListener('touchcancel')
  onRelease(): void {
    this.cancelTimeout();
  }

  ngOnDestroy(): void {
    this.cancelTimeout();
  }

  private cancelTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
