---
title: Authentication - Interaction Patterns & Animations
description: Detailed specifications for interaction patterns and animations in authentication flows
feature: Authentication & User Management
last-updated: 2025-01-22
version: 1.0
related-files: 
  - README.md
  - user-journey.md
  - screen-states.md
dependencies:
  - Design system animation specifications
  - Component library interactions
status: approved
---

# Authentication - Interaction Patterns & Animations

## Animation System Application

### Timing Functions for Authentication
- **Form Interactions**: `cubic-bezier(0.4, 0, 0.6, 1)` for smooth state transitions
- **Error States**: `cubic-bezier(0.0, 0, 0.2, 1)` for immediate attention
- **Success Feedback**: `cubic-bezier(0.4, 0.0, 0.2, 1)` for satisfying completion

### Duration Guidelines
- **Micro-interactions**: 150ms for input field state changes
- **Form Transitions**: 300ms for error/success message appearance
- **Page Transitions**: 500ms for authentication flow navigation
- **Loading States**: Indefinite with 2s timeout feedback

## Detailed Interaction Specifications

### Login Form Interactions

#### Email Input Field
**Default State:**
- Border: `2px solid Neutral-300`
- Background: `Neutral-50`
- Text color: `Neutral-900`
- Placeholder: `Neutral-500`

**Focus Interaction:**
```css
transition: border-color 150ms ease, box-shadow 150ms ease;
border-color: Primary;
box-shadow: 0 0 0 3px Primary-Light;
outline: none;
```

**Validation States:**
- **Valid State:**
  - Border: `2px solid Success`
  - Icon: Checkmark in `Success` color
  - Transition: `200ms ease` from previous state
- **Error State:**
  - Border: `2px solid Error`
  - Icon: Warning triangle in `Error` color  
  - Shake animation: `translateX(-4px, 4px, -2px, 2px, 0)` over 400ms
  - Error message slides down with `300ms ease-out`

**Typing Interaction:**
- Real-time validation after 500ms debounce
- Loading spinner appears during validation
- Results appear with `200ms fade` transition

#### Password Input Field
**Show/Hide Toggle:**
```css
.password-toggle {
  transition: transform 200ms ease;
}
.password-toggle:hover {
  transform: scale(1.1);
}
.password-toggle:active {
  transform: scale(0.95);
}
```

**Eye Icon Animation:**
- Closed to open: Gradual reveal with `300ms ease`
- Color transitions smoothly between states
- Maintains proper contrast in all states

**Strength Indicator (Registration):**
- Weak: Red bar grows from 0% to 33% width over 400ms
- Medium: Orange bar grows to 66% with color transition
- Strong: Green bar completes to 100% with satisfying bounce

#### Submit Button Interactions
**State Transitions:**
```css
.auth-button {
  transition: all 200ms ease;
  transform: translateZ(0); /* Hardware acceleration */
}

/* Hover State */
.auth-button:hover {
  background-color: Primary-Dark;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(Primary, 0.3);
}

/* Active State */  
.auth-button:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 8px rgba(Primary, 0.2);
}

/* Loading State */
.auth-button.loading {
  background-color: Primary;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  margin-right: 8px;
}
```

**Loading Animation:**
- Button text fades out: `opacity: 1 → 0` over 200ms
- Spinner fades in: `opacity: 0 → 1` over 200ms (100ms delay)
- "Signing in..." text appears with `300ms ease` fade
- Button width maintains stability throughout transition

### Social Login Interactions

#### Google Sign-In Button
**Visual Specifications:**
- Background: `#ffffff`
- Border: `1px solid #dadce0`
- Google logo: Proper brand guidelines
- Text: "Continue with Google" in Roboto font

**Interaction States:**
```css
.google-signin {
  transition: box-shadow 150ms ease, background-color 150ms ease;
}

.google-signin:hover {
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
  background-color: #f8f9fa;
}

.google-signin:active {
  background-color: #f1f3f4;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
}
```

**Loading State:**
- OAuth redirect loading with branded spinner
- Button becomes non-interactive with 50% opacity
- Loading message: "Redirecting to Google..."

#### Facebook Sign-In Button  
**Visual Specifications:**
- Background: `#1877f2` (Facebook Blue)
- Color: `#ffffff`
- Facebook logo: Proper brand asset
- Text: "Continue with Facebook"

**Interaction States:**
```css
.facebook-signin {
  transition: background-color 150ms ease;
}

.facebook-signin:hover {
  background-color: #166fe5;
}

.facebook-signin:active {
  background-color: #1464cc;
}
```

### Form Validation Animations

#### Real-time Validation Feedback
**Success Animation:**
```css
@keyframes validation-success {
  0% { 
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(-90deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.validation-success {
  animation: validation-success 400ms ease-out;
}
```

**Error Animation:**
```css
@keyframes validation-error {
  0%, 20%, 40%, 60%, 80% {
    transform: translateX(-4px);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(4px);
  }
  100% {
    transform: translateX(0);
  }
}

.validation-error {
  animation: validation-error 400ms ease-in-out;
}
```

#### Error Message Appearance
**Slide Down Animation:**
```css
@keyframes error-message-appear {
  0% {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    max-height: 60px; /* Adjust based on content */
  }
}

.error-message {
  animation: error-message-appear 300ms ease-out;
}
```

### Page Transition Animations

#### Authentication Flow Transitions
**Login to Registration:**
```css
.auth-transition-enter {
  opacity: 0;
  transform: translateX(20px);
}

.auth-transition-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 400ms ease, transform 400ms ease;
}

.auth-transition-exit {
  opacity: 1;
  transform: translateX(0);
}

.auth-transition-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 400ms ease, transform 400ms ease;
}
```

**Password Reset Flow:**
- Form slides up with `transform: translateY(20px → 0)`
- Previous content fades out: `opacity: 1 → 0`
- New content fades in: `opacity: 0 → 1`
- Total transition time: 500ms with 100ms overlap

#### Success State Transitions
**Registration Success:**
```css
@keyframes success-celebration {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-state {
  animation: success-celebration 600ms ease-out;
}
```

**Checkmark Animation:**
```css
@keyframes checkmark-draw {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.success-checkmark {
  stroke-dasharray: 100;
  animation: checkmark-draw 800ms ease-out;
}
```

### Loading State Animations

#### Form Submission Loading
**Button Loading Spinner:**
```css
@keyframes button-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: button-spinner 1s linear infinite;
}
```

**Progress Indication:**
```css
@keyframes progress-pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

.loading-progress {
  animation: progress-pulse 2s ease-in-out infinite;
}
```

#### Social OAuth Loading
**Redirect Loading:**
```css
.oauth-loading {
  position: relative;
  overflow: hidden;
}

.oauth-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: oauth-shimmer 2s ease-in-out infinite;
}

@keyframes oauth-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
```

### Advanced Interaction Patterns

#### Keyboard Navigation Enhancement
**Focus Ring Animation:**
```css
.keyboard-focus {
  outline: none;
  position: relative;
}

.keyboard-focus::before {
  content: '';
  position: absolute;
  inset: -2px;
  border: 2px solid Primary;
  border-radius: inherit;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 200ms ease, transform 200ms ease;
}

.keyboard-focus:focus-visible::before {
  opacity: 1;
  transform: scale(1);
}
```

**Sequential Focus Animation:**
- Focus moves smoothly between fields
- Tab progression feels natural and guided
- Focus trap maintains context within auth flow

#### Touch Interaction Enhancements
**Touch Feedback:**
```css
@keyframes touch-ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.touch-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(Primary, 0.3);
  animation: touch-ripple 600ms ease-out;
}
```

**Mobile-Specific Interactions:**
- Slightly larger touch targets on mobile
- Haptic feedback integration where available
- Smooth scrolling for form progression

### Accessibility Animation Considerations

#### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .auth-form * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Essential animations only */
  .validation-error {
    /* Keep subtle shake for error feedback */
    animation: validation-error-reduced 200ms ease;
  }
}

@keyframes validation-error-reduced {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-2px); }
}
```

#### Screen Reader Announcements
- Loading states announced: "Signing in, please wait"
- Error states announced: "Error: [specific error message]"
- Success states announced: "Account created successfully"
- Form validation announced as it occurs

### Performance Optimization

#### Hardware Acceleration
```css
.hardware-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}
```

#### Animation Efficiency
- Use `transform` and `opacity` for animations
- Avoid animating layout properties
- Implement `will-change` property strategically
- Remove animations from hidden elements

#### Memory Management
- Clean up event listeners on component unmount
- Dispose of animation timers properly
- Optimize animation loops for 60fps performance

## Interactive Prototyping Guidelines

### Animation Testing
- Test all animations at 120Hz, 60Hz, and 30Hz refresh rates
- Verify smooth performance on low-powered devices
- Ensure animations feel natural across different screen sizes

### User Testing Considerations
- Test with users who have motion sensitivity
- Validate that animations enhance rather than distract
- Confirm animations communicate status effectively

### Implementation Validation
- Verify animations work across target browsers
- Test with real network conditions (slow/fast connections)
- Validate accessibility with screen readers and keyboard navigation

## Related Documentation

- [Screen States Specifications](./screen-states.md) - Visual specifications for all states
- [User Journey Analysis](./user-journey.md) - Context for interaction design
- [Accessibility Requirements](./accessibility.md) - Inclusive interaction patterns
- [Implementation Guide](./implementation.md) - Technical implementation details
- [Design System Animations](../../design-system/tokens/animations.md) - Base animation system