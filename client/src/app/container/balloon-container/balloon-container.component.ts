import { Component, ElementRef, Input } from '@angular/core';
import { SharedModule } from '../../shared.module';

interface Balloon {
  id: number;
  style: { [key: string]: string };
}

@Component({
  selector: 'app-balloon-container',
  imports: [SharedModule],
  standalone: true,
  templateUrl: './balloon-container.component.html',
  styleUrl: './balloon-container.component.css'
})
export class BalloonContainerComponent {
  @Input() numberOfBalloons: number = 20; 
  @Input() minDuration: number = 12;    
  @Input() maxDuration: number = 22;   
  @Input() centerExclusionPercent: number = 0; 

  balloons: Balloon[] = [];
  
  // Cinematic, vibrant color palette
  private colors = [
    '#ff3b30', // Vibrant Red
    '#ff9500', // Deep Orange
    '#ffcc00', // Bright Yellow
    '#34c759', // Vivid Green
    '#007aff', // Modern Blue
    '#5856d6', // Deep Purple
    '#ff2d55', // Hot Pink
    '#00c7be'  // Teal
  ];

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    requestAnimationFrame(() => {
      this.generateBalloons();
    });
  }

  ngOnDestroy(): void {
    this.balloons = [];
  }

  generateBalloons(): void {
    this.balloons = [];
    const hostElement = this.el.nativeElement as HTMLElement;
    if (!hostElement) return;

    const hostWidth = hostElement.offsetWidth;
    const hostHeight = hostElement.offsetHeight;

    if (hostWidth <= 0 || hostHeight <= 0) return;

    const exclusionZoneRatio = Math.max(0, Math.min(100, this.centerExclusionPercent)) / 100;
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
      const floatDelay = this.getRandomNumber(0, this.maxDuration * 0.7); 
      const bobDelay = this.getRandomNumber(0, 3); 
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const sizeFactor = this.getRandomNumber(0.6, 1.4); 
      const sway = this.getRandomNumber(-80, 80); 
      
      // Calculate explicit dimensions like your original version
      const currentWidth = balloonBaseWidth * sizeFactor;
      const currentHeight = balloonBaseHeight * sizeFactor;

      const blurAmount = sizeFactor < 0.8 ? '2px' : sizeFactor < 0.95 ? '1px' : '0px';
      const zIndex = Math.floor(sizeFactor * 10); 

      // Apply explicit width and height
      const balloonStyle: { [key: string]: string } = {
        'width': `${currentWidth}px`,
        'height': `${currentHeight}px`,
        '--duration': `${duration}s`,
        '--delay': `${floatDelay}s`,
        '--bob-delay': `${bobDelay}s`,
        '--sway': `${sway}px`,
        '--balloon-color': color,
        '--balloon-blur': blurAmount,
        'z-index': `${zIndex}`
      };

      const edge = Math.floor(Math.random() * 4);
      let randomLeft, randomTop;

      // Revert to your original edge placement logic to avoid container stretching
      switch (edge) {
        case 0:
          balloonStyle['bottom'] = `-${currentHeight}px`;
          randomLeft = this.getRandomPositionAvoidingCenter(0, hostWidth - currentWidth, deadZoneLeft, deadZoneRight);
          balloonStyle['left'] = `${randomLeft}px`;
          break;
        case 1:
          balloonStyle['top'] = `-${currentHeight}px`;
          randomLeft = this.getRandomPositionAvoidingCenter(0, hostWidth - currentWidth, deadZoneLeft, deadZoneRight);
          balloonStyle['left'] = `${randomLeft}px`;
          break;
        case 2:
          balloonStyle['left'] = `-${currentWidth}px`;
          randomTop = this.getRandomPositionAvoidingCenter(0, hostHeight - currentHeight, deadZoneTop, deadZoneBottom);
          balloonStyle['top'] = `${randomTop}px`;
          break;
        case 3:
          balloonStyle['right'] = `-${currentWidth}px`;
          randomTop = this.getRandomPositionAvoidingCenter(0, hostHeight - currentHeight, deadZoneTop, deadZoneBottom);
          balloonStyle['top'] = `${randomTop}px`;
          break;
      }

      this.balloons.push({ id: i, style: balloonStyle });
    }
  }

  private getRandomPositionAvoidingCenter(min: number, max: number, deadZoneStart: number, deadZoneEnd: number): number {
    let position: number;
    let attempts = 0;
    do {
        position = this.getRandomNumber(min, max);
        attempts++;
    } while (position > deadZoneStart && position < deadZoneEnd && attempts < 10);
    
    if (position > deadZoneStart && position < deadZoneEnd) {
        return Math.random() < 0.5 ? min : max; 
    }
    return position;
  }
  
  private getRandomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}