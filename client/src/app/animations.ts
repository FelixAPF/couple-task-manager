import {
    trigger,
    transition,
    style,
    query,
    group,
    animate, stagger
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


export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger('100ms', [
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
        style({ opacity: 1, transform: 'none' }))
      ])
    ], { optional: true })
  ])
]);

export const flyInOut = trigger('flyInOut', [
  transition(':enter', [
    style({ transform: 'translateY(20px)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 }))
  ])
]);