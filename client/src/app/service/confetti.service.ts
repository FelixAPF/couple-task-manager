import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';


@Injectable({
  providedIn: 'root'
})
export class ConfettiService {

  constructor() { }

  fireConfetti() {
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    (function frame() {
      const timeLeft = end - Date.now();

      if (timeLeft <= 0) {
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2
        }
      });

      requestAnimationFrame(frame);
    })();
  }

  fireBasicConfetti(){
    const duration = 1000; // in milliseconds

    confetti({
      particleCount: 150,
      spread: 200,
      origin: { y: 0.6 },
      colors: ['#FF4500', '#008080', '#FFD700'],
    });
  
    // Clear confetti after a certain duration
    setTimeout(() => confetti.reset(), duration);
  }
}
