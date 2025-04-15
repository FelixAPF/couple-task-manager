declare module 'canvas-confetti' {
    interface ConfettiInstance {
      (options?: any): void; // The main confetti function
      reset(): void;         // The reset function
    }
  
    const confetti: ConfettiInstance;
    export = confetti;
  }