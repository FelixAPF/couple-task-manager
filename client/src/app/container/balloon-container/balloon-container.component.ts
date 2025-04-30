import { Component, ElementRef, Input, Renderer2 } from '@angular/core';
import { SharedModule } from '../../shared.module';

interface Balloon {
  id: number;
  style: { [key: string]: string }; // For dynamic styles like color, position, animation delay/duration
  color: string; // Store color separately for binding

}

@Component({
  selector: 'app-balloon-container',
  imports: [SharedModule],
  standalone: true,
  templateUrl: './balloon-container.component.html',
  styleUrl: './balloon-container.component.css'
})
export class BalloonContainerComponent {
  @Input() numberOfBalloons: number = 25; // Increased default slightly
  @Input() minDuration: number = 10;    // Minimum float duration (seconds)
  @Input() maxDuration: number = 18;   // Maximum float duration (seconds)
  @Input() centerExclusionPercent: number = 0; // Percentage of width/height to exclude in center (e.g., 30 means middle 30%)


  balloons: Balloon[] = [];
  private colors = ['#ff5e57', '#ffbd2e', '#27c93f', '#3c7eec', '#5856d6', '#ff6bcb', '#ff9500', '#8e8e93']; // Example balloon colors

  // Constructor injecting ElementRef (Renderer2 might not be needed now)
  constructor(private el: ElementRef, private renderer: Renderer2) {} // Kept Renderer2 in case needed elsewhere

  ngOnInit(): void {
    // Use requestAnimationFrame to ensure dimensions are available
    requestAnimationFrame(() => {
      this.generateBalloons();
    });
  }

  ngOnDestroy(): void {
    this.balloons = [];
  }

  generateBalloons(): void {
    this.balloons = []; // Clear existing balloons
    const hostElement = this.el.nativeElement as HTMLElement;
    if (!hostElement) return;

    const hostWidth = hostElement.offsetWidth;
    const hostHeight = hostElement.offsetHeight;

    if (hostWidth <= 0 || hostHeight <= 0) {
        console.warn("BalloonContainer host has zero width or height. Balloons might not position correctly.");
        return;
    }

    // Calculate the center exclusion zone boundaries
    const exclusionZoneRatio = Math.max(0, Math.min(100, this.centerExclusionPercent)) / 100; // Clamp between 0 and 1
    const exclusionWidth = hostWidth * exclusionZoneRatio;
    const exclusionHeight = hostHeight * exclusionZoneRatio;
    const deadZoneLeft = (hostWidth - exclusionWidth) / 2;
    const deadZoneRight = deadZoneLeft + exclusionWidth;
    const deadZoneTop = (hostHeight - exclusionHeight) / 2;
    const deadZoneBottom = deadZoneTop + exclusionHeight;


    const balloonBaseWidth = 50;
    const balloonBaseHeight = 65;

    for (let i = 0; i < this.numberOfBalloons; i++) {
      const duration = this.getRandomNumber(this.minDuration, this.maxDuration);
      const floatDelay = this.getRandomNumber(0, this.maxDuration / 2); // Delay for main floatAway animation
      const bobDelay = this.getRandomNumber(0, 2); // Shorter random delay for gentleBob (0 to 2 seconds)
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const sizeFactor = this.getRandomNumber(0.8, 1.3);
      const sway = this.getRandomNumber(-100, 100); // Wider sway range

      const currentWidth = balloonBaseWidth * sizeFactor;
      const currentHeight = balloonBaseHeight * sizeFactor;

      const balloonStyle: { [key: string]: string } = {
        'width': `${currentWidth}px`,
        'height': `${currentHeight}px`,
        // CSS variables for the animations
        '--duration': `${duration}s`,
        '--delay': `${floatDelay}s`, // Delay for floatAway
        '--bob-delay': `${bobDelay}s`, // Delay for gentleBob
        '--sway': `${sway}px`
      };

      // Determine starting edge and position, avoiding center
      const edge = Math.floor(Math.random() * 4); // 0: bottom, 1: top, 2: left, 3: right
      let randomLeft, randomTop;

      switch (edge) {
        case 0: // Bottom edge
          balloonStyle['bottom'] = `-${currentHeight}px`;
          randomLeft = this.getRandomPositionAvoidingCenter(0, hostWidth - currentWidth, deadZoneLeft, deadZoneRight);
          balloonStyle['left'] = `${randomLeft}px`;
          break;
        case 1: // Top edge
          balloonStyle['top'] = `-${currentHeight}px`;
          randomLeft = this.getRandomPositionAvoidingCenter(0, hostWidth - currentWidth, deadZoneLeft, deadZoneRight);
          balloonStyle['left'] = `${randomLeft}px`;
          break;
        case 2: // Left edge
          balloonStyle['left'] = `-${currentWidth}px`;
          randomTop = this.getRandomPositionAvoidingCenter(0, hostHeight - currentHeight, deadZoneTop, deadZoneBottom);
          balloonStyle['top'] = `${randomTop}px`;
          break;
        case 3: // Right edge
          balloonStyle['right'] = `-${currentWidth}px`;
          randomTop = this.getRandomPositionAvoidingCenter(0, hostHeight - currentHeight, deadZoneTop, deadZoneBottom);
          balloonStyle['top'] = `${randomTop}px`;
          break;
      }

      this.balloons.push({
        id: i,
        style: balloonStyle,
        color: color // Store the color separately
      });
    }
  }

  private getRandomPositionAvoidingCenter(min: number, max: number, deadZoneStart: number, deadZoneEnd: number): number {
    let position: number;
    let attempts = 0; // Prevent infinite loops in edge cases
    do {
        position = this.getRandomNumber(min, max);
        attempts++;
    } while (position > deadZoneStart && position < deadZoneEnd && attempts < 10); // Retry if inside dead zone
    
    // If still stuck after attempts (unlikely but possible), just return a boundary value
    if (position > deadZoneStart && position < deadZoneEnd) {
        return Math.random() < 0.5 ? min : max; 
    }
    
    return position;
  }
  
  private getRandomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
