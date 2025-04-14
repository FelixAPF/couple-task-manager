import {
    trigger,
    transition,
    style,
    query,
    group,
    animate,
  } from '@angular/animations';
  
  export const routeAnimations = trigger('routeAnimations', [
    // Transition between any two states ('*' means any)
    transition('* <=> *', [
      // Set a default style for both :enter and :leave elements
      // Position absolute is key for allowing them to overlap during the transition
      style({ position: 'relative' }), // Parent container needs position: relative
      query(':enter, :leave', [
        style({
          position: 'absolute', // Position elements absolutely within the container
          top: 0,
          left: 0,
          width: '100%',
          opacity: 1, // Start fully visible/opaque
        })
      ], { optional: true }), // optional: true prevents errors if element isn't found (e.g., initial load)
  
      // Animate the new page entering (:enter)
      query(':enter', [
        style({ opacity: 0 }) // Start transparent
      ], { optional: true }),
  
      // Group runs animations in parallel
      group([
        // Animate the old page leaving (:leave)
        query(':leave', [
          animate('300ms ease-out', style({ opacity: 0 })) // Fade out
        ], { optional: true }),
  
        // Animate the new page entering (:enter)
        query(':enter', [
          animate('300ms ease-in', style({ opacity: 1 })) // Fade in
        ], { optional: true })
      ])
    ])
  ]);