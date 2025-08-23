---
title: Motion & Animation System
description: Comprehensive animation specifications and motion design patterns for VRBNBXOSS
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/style-guide.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/accessibility/guidelines.md
status: draft
---

# Motion & Animation System

## Overview

Motion in VRBNBXOSS serves **functional purposes first**, enhancing user understanding and providing meaningful feedback. Our animation system prioritizes performance, accessibility, and professional polish while maintaining efficiency in daily property management workflows.

## Animation Philosophy

### Core Principles

1. **Purposeful Motion**: Every animation serves a specific functional purpose
2. **Performance First**: 60fps minimum, hardware-accelerated when possible
3. **Accessibility Respect**: Honor user preferences for reduced motion
4. **Professional Subtlety**: Enhance without distracting from core tasks
5. **Consistent Timing**: Predictable patterns reduce cognitive load

### When to Use Animation

**✅ Use Animation For:**
- State transitions and feedback
- Loading and progress indication
- Spatial navigation and context
- Drawing attention to important changes
- Confirming user actions
- Progressive disclosure of content

**❌ Avoid Animation For:**
- Decorative or unnecessary motion
- Repeating animations without purpose
- Complex animations that impact performance
- Motion that could trigger vestibular disorders
- Animations longer than necessary

## Timing Functions (Easing)

### Primary Easing Curves

**Ease-Out - Most Common**
```css
/* For entrances, expansions, hover effects */
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
```
**Usage**: Button hovers, dropdown menus, modal entrances, tooltip appearances

**Ease-In-Out - Smooth Transitions**
```css
/* For balanced transitions, state changes */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.6, 1);
```
**Usage**: Page transitions, tab switches, content swaps, layout changes

**Ease-In - Exits Only**
```css
/* For exits, collapses, removals */
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);
```
**Usage**: Modal exits, tooltip disappearances, element removals

**Spring - Playful Interactions**
```css
/* For success states, confirmations, delightful moments */
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```
**Usage**: Success confirmations, positive feedback, celebration moments

### Custom Easing for VRBNBXOSS

**Professional Ease - Balanced & Efficient**
```css
--ease-professional: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```
**Usage**: Dashboard transitions, data loading, professional interactions

**Sharp Ease - Quick & Decisive**
```css
--ease-sharp: cubic-bezier(0.4, 0.0, 0.6, 1);
```
**Usage**: Quick actions, form submissions, immediate feedback

## Duration Scale

### Duration Values

**Micro (100-150ms)**
```css
--duration-micro: 150ms;
```
**Usage**: Hover effects, button presses, small state changes, micro-feedback

**Short (200-300ms)**
```css
--duration-short: 250ms;
```
**Usage**: Dropdown menus, tooltip appearances, form field focus, quick transitions

**Medium (300-500ms)**
```css
--duration-medium: 400ms;
```
**Usage**: Modal animations, page transitions, content swaps, loading states

**Long (500-800ms)**
```css
--duration-long: 600ms;
```
**Usage**: Complex page transitions, onboarding flows, large content changes

**Extra Long (800ms+)**
```css
--duration-extra-long: 1000ms;
```
**Usage**: Celebration animations, complex loading sequences, guided tours

### Duration Guidelines by Context

**Property Management Context:**
- **Quick Actions**: 150ms (save, delete, edit buttons)
- **Data Loading**: 300ms (table updates, form submissions)
- **Navigation**: 400ms (page transitions, calendar navigation)
- **Confirmations**: 600ms (success states, completion feedback)

## Animation Patterns

### State Transitions

**Button States**
```css
.button {
  transition: all var(--duration-micro) var(--ease-out);
  transform: translateY(0);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.button:active {
  transform: translateY(0);
  transition-duration: 75ms;
}

.button:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  transition: outline-offset var(--duration-micro) var(--ease-out);
}
```

**Form Field States**
```css
.form-input {
  transition: border-color var(--duration-short) var(--ease-out),
              box-shadow var(--duration-short) var(--ease-out);
}

.form-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error {
  border-color: var(--error-500);
  animation: shake var(--duration-short) var(--ease-out);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

### Loading Animations

**Spinner Animation**
```css
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Progress Bar Animation**
```css
.progress-bar {
  transition: width var(--duration-medium) var(--ease-out);
}

.progress-bar.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

**Skeleton Loading**
```css
.skeleton {
  background: linear-gradient(90deg, 
    var(--slate-200) 25%, 
    var(--slate-100) 50%, 
    var(--slate-200) 75%);
  background-size: 200% 100%;
  animation: skeleton var(--duration-long) ease-in-out infinite;
}

@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Entrance & Exit Animations

**Modal Animations**
```css
/* Modal backdrop */
.modal-backdrop {
  opacity: 0;
  transition: opacity var(--duration-medium) var(--ease-out);
}

.modal-backdrop.show {
  opacity: 1;
}

/* Modal content */
.modal-content {
  transform: scale(0.95) translateY(-10px);
  opacity: 0;
  transition: 
    transform var(--duration-medium) var(--ease-out),
    opacity var(--duration-medium) var(--ease-out);
}

.modal-content.show {
  transform: scale(1) translateY(0);
  opacity: 1;
}
```

**Dropdown Animations**
```css
.dropdown {
  transform: translateY(-8px);
  opacity: 0;
  transition: 
    transform var(--duration-short) var(--ease-out),
    opacity var(--duration-short) var(--ease-out);
}

.dropdown.show {
  transform: translateY(0);
  opacity: 1;
}
```

**Toast Notifications**
```css
.toast {
  transform: translateX(100%);
  opacity: 0;
  transition: 
    transform var(--duration-medium) var(--ease-out),
    opacity var(--duration-medium) var(--ease-out);
}

.toast.show {
  transform: translateX(0);
  opacity: 1;
}

.toast.hide {
  transform: translateX(100%);
  opacity: 0;
  transition-timing-function: var(--ease-in);
}
```

### Data Visualization Animations

**Chart Animations**
```css
/* Bar chart animation */
.chart-bar {
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform var(--duration-medium) var(--ease-out);
  transition-delay: calc(var(--index, 0) * 50ms);
}

.chart-bar.animate {
  transform: scaleY(1);
}

/* Line chart animation */
.chart-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine var(--duration-long) var(--ease-out) forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}
```

**Counter Animation**
```css
.animated-counter {
  transition: all var(--duration-medium) var(--ease-out);
}

/* JavaScript handles the counting animation */
```

### Micro-Interactions

**Icon Animations**
```css
.icon-button:hover .icon {
  transform: scale(1.1);
  transition: transform var(--duration-micro) var(--ease-out);
}

.icon-check {
  opacity: 0;
  transform: scale(0);
  transition: 
    opacity var(--duration-short) var(--ease-out),
    transform var(--duration-short) var(--ease-spring);
}

.icon-check.success {
  opacity: 1;
  transform: scale(1);
}
```

**Ripple Effect**
```css
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width var(--duration-medium) var(--ease-out),
              height var(--duration-medium) var(--ease-out);
}

.ripple:active::before {
  width: 200px;
  height: 200px;
}
```

## Accessibility Considerations

### Reduced Motion Support

**Respect User Preferences**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Alternative Patterns for Reduced Motion**
```css
/* Standard animation */
.button {
  transition: transform var(--duration-micro) var(--ease-out);
}

.button:hover {
  transform: translateY(-2px);
}

/* Reduced motion alternative */
@media (prefers-reduced-motion: reduce) {
  .button:hover {
    transform: none;
    background-color: var(--primary-600);
  }
}
```

### Performance Guidelines

**GPU Acceleration**
```css
/* Use transform and opacity for smooth animations */
.animating-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU acceleration */
}

/* Avoid animating these properties */
/* ❌ width, height, top, left, padding, margin */
/* ✅ transform, opacity, filter */
```

**Animation Cleanup**
```css
.element {
  transition: transform var(--duration-short) var(--ease-out);
}

.element:not(:hover):not(:focus) {
  will-change: auto; /* Remove GPU acceleration when not needed */
}
```

## Implementation

### CSS Custom Properties
```css
:root {
  /* Timing Functions */
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.6, 1);
  --ease-in: cubic-bezier(0.4, 0.0, 1, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-professional: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  /* Durations */
  --duration-micro: 150ms;
  --duration-short: 250ms;
  --duration-medium: 400ms;
  --duration-long: 600ms;
  --duration-extra-long: 1000ms;
}
```

### Framer Motion Configuration
```javascript
// Animation variants for Framer Motion
export const animations = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.4, 0.0, 0.6, 1] }
  },
  
  // Modal animations
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25 }
  },
  
  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
    transition: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }
  },
  
  // List animations
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.25 }
  },
  
  // Button animations
  button: {
    whileHover: { y: -1 },
    whileTap: { y: 0 },
    transition: { duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }
  }
};
```

### React Component Examples

**Animated Button Component**
```jsx
import { motion } from 'framer-motion';

const AnimatedButton = ({ children, ...props }) => (
  <motion.button
    whileHover={{ y: -1 }}
    whileTap={{ y: 0 }}
    transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
    className="px-4 py-2 bg-primary-600 text-white rounded-md
               transition-colors duration-150 ease-out
               hover:bg-primary-700 focus:outline-none focus:ring-2 
               focus:ring-primary-500 focus:ring-offset-2"
    {...props}
  >
    {children}
  </motion.button>
);
```

**Loading Spinner Component**
```jsx
const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-slate-200 
                  border-t-primary-600 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};
```

**Toast Notification Component**
```jsx
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, isVisible, onClose }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
        className="fixed top-4 right-4 bg-white border border-slate-200 
                   rounded-md shadow-lg p-4 max-w-sm"
      >
        {message}
        <button
          onClick={onClose}
          className="ml-4 text-slate-400 hover:text-slate-600
                     transition-colors duration-150"
        >
          ×
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);
```

## Testing & Performance

### Performance Monitoring
```javascript
// Monitor animation performance
const measureAnimationPerformance = (element) => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.duration > 16.67) { // > 60fps threshold
        console.warn('Animation dropping frames:', entry);
      }
    });
  });
  
  observer.observe({ entryTypes: ['measure'] });
};
```

### Animation Testing Checklist
- [ ] All animations run at 60fps on target devices
- [ ] Reduced motion preferences are respected
- [ ] Animations serve functional purposes
- [ ] Loading states provide appropriate feedback
- [ ] Micro-interactions enhance usability
- [ ] No unnecessary or decorative animations
- [ ] Animation timing feels natural and professional

---

*This animation system provides professional, performant, and accessible motion design for VRBNBXOSS. Consistent application ensures smooth user interactions while maintaining focus on property management efficiency.*