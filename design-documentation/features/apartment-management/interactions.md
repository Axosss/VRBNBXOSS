---
title: Apartment Management - Interaction Patterns & Animations
description: Detailed specifications for interaction patterns and animations in apartment management
feature: Apartment Management
last-updated: 2025-01-22
version: 1.0
related-files: 
  - README.md
  - user-journey.md
  - screen-states.md
dependencies:
  - Design system animation specifications
  - Photo upload interactions
status: approved
---

# Apartment Management - Interaction Patterns & Animations

## Animation System Application

### Timing Functions for Apartment Management
- **Photo Upload**: `cubic-bezier(0.4, 0, 0.2, 1)` for smooth progress indication
- **Card Interactions**: `cubic-bezier(0.4, 0, 0.6, 1)` for satisfying hover states
- **Form Transitions**: `cubic-bezier(0.0, 0, 0.2, 1)` for step progression

### Duration Guidelines
- **Card Hover Effects**: 200ms for responsive feel
- **Photo Upload Progress**: Continuous with 500ms completion celebration
- **Form Step Transitions**: 400ms for guided progression
- **List View Changes**: 300ms for grid/list toggle

## Detailed Interaction Specifications

### Apartment List Interactions

#### Card Hover and Selection
**Default Card State:**
```css
.apartment-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 200ms ease;
  cursor: pointer;
}
```

**Hover Interaction:**
```css
.apartment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #d1d5db;
}

.apartment-card:hover .card-image {
  transform: scale(1.02);
}
```

**Selection State:**
```css
.apartment-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
```

#### Photo Thumbnail Animation
```css
.card-image {
  transition: transform 300ms ease;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
}

.card-image img {
  transition: opacity 200ms ease;
}

/* Loading state */
.card-image.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Photo Upload Interactions

#### Drag and Drop Interface
**Drop Zone States:**
```css
.photo-dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  background: #f9fafb;
  transition: all 200ms ease;
  cursor: pointer;
}

.photo-dropzone.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.02);
}

.photo-dropzone.drag-active {
  border-color: #1d4ed8;
  background: #dbeafe;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

**Upload Progress Animation:**
```css
.upload-progress {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.upload-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 300ms ease;
  position: relative;
}

.upload-progress-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: progress-shine 2s ease-in-out infinite;
}

@keyframes progress-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

#### Photo Reordering Interaction
```css
.photo-grid-item {
  position: relative;
  cursor: grab;
  transition: all 200ms ease;
}

.photo-grid-item:active {
  cursor: grabbing;
  transform: scale(1.05) rotate(2deg);
  z-index: 10;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.photo-grid-item.dragging {
  opacity: 0.8;
  transform: rotate(3deg);
}

.photo-grid-item.drop-target {
  transform: scale(1.1);
  border: 2px solid #3b82f6;
}
```

**Primary Photo Selection:**
```css
.photo-primary-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #059669;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  transform: scale(0);
  transition: transform 200ms ease;
}

.photo-grid-item.primary .photo-primary-indicator {
  transform: scale(1);
  animation: primary-badge-appear 400ms ease;
}

@keyframes primary-badge-appear {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(-10deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
```

### Form Step Progression

#### Step Transition Animation
```css
.creation-form-container {
  position: relative;
  overflow: hidden;
}

.form-step {
  width: 100%;
  transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.form-step.entering {
  transform: translateX(100%);
  opacity: 0;
}

.form-step.active {
  transform: translateX(0);
  opacity: 1;
}

.form-step.exiting {
  transform: translateX(-100%);
  opacity: 0;
}
```

#### Progress Indicator Animation
```css
.progress-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.progress-step {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
}

.progress-step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 300ms ease;
  z-index: 2;
}

.progress-step.completed .progress-step-circle {
  background: #059669;
  color: white;
  animation: step-complete 500ms ease;
}

.progress-step.active .progress-step-circle {
  background: #3b82f6;
  color: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.progress-step.upcoming .progress-step-circle {
  background: #f3f4f6;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

@keyframes step-complete {
  0% {
    transform: scale(0.8);
    background: #3b82f6;
  }
  50% {
    transform: scale(1.1);
    background: #059669;
  }
  100% {
    transform: scale(1);
    background: #059669;
  }
}
```

### Amenity Selection Interactions

#### Checkbox Animation
```css
.amenity-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: all 200ms ease;
}

.amenity-checkbox:checked {
  background: #3b82f6;
  border-color: #3b82f6;
}

.amenity-checkbox:checked::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 6px;
  width: 6px;
  height: 10px;
  border: 2px solid white;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
  animation: checkmark-draw 300ms ease;
}

@keyframes checkmark-draw {
  0% {
    height: 0;
    opacity: 0;
  }
  50% {
    height: 5px;
    opacity: 1;
  }
  100% {
    height: 10px;
    opacity: 1;
  }
}
```

#### Category Expansion
```css
.amenity-category {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 200ms ease;
}

.category-header {
  padding: 1rem;
  background: #f9fafb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 200ms ease;
}

.category-header:hover {
  background: #f3f4f6;
}

.category-icon {
  transition: transform 300ms ease;
}

.amenity-category.expanded .category-icon {
  transform: rotate(180deg);
}

.category-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 400ms ease, padding 400ms ease;
}

.amenity-category.expanded .category-content {
  max-height: 500px;
  padding: 1rem;
}
```

### Bulk Operations Interface

#### Selection Mode Activation
```css
.apartment-list.selection-mode .apartment-card {
  transform: scale(0.95);
  position: relative;
}

.apartment-list.selection-mode .apartment-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  transition: border-color 200ms ease;
}

.apartment-list.selection-mode .apartment-card.selected::before {
  border-color: #3b82f6;
}

.selection-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  opacity: 0;
  transform: scale(0.5);
  transition: all 200ms ease;
  z-index: 3;
}

.apartment-list.selection-mode .selection-checkbox {
  opacity: 1;
  transform: scale(1);
}
```

#### Bulk Action Bar Animation
```css
.bulk-actions-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
  transform: translateY(100%);
  transition: transform 300ms ease;
  z-index: 20;
}

.bulk-actions-bar.visible {
  transform: translateY(0);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
}

.bulk-actions-bar .action-count {
  animation: count-update 300ms ease;
}

@keyframes count-update {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

### Advanced Interaction Patterns

#### Search and Filter Animation
```css
.search-input {
  transition: all 300ms ease;
  width: 200px;
}

.search-input:focus,
.search-input.has-value {
  width: 300px;
}

.search-results {
  opacity: 0;
  transform: translateY(-10px);
  transition: all 200ms ease;
}

.search-results.visible {
  opacity: 1;
  transform: translateY(0);
}

.filter-dropdown {
  max-height: 0;
  overflow: hidden;
  transition: max-height 300ms ease, opacity 200ms ease;
  opacity: 0;
}

.filter-dropdown.open {
  max-height: 400px;
  opacity: 1;
}
```

#### Status Toggle Interactions
```css
.status-toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: background 300ms ease;
}

.status-toggle.active {
  background: #3b82f6;
}

.status-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.status-toggle.active::after {
  transform: translateX(20px);
}
```

### Accessibility Animation Considerations

#### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .apartment-card,
  .photo-grid-item,
  .form-step,
  .progress-step-circle {
    transition-duration: 0.01ms !important;
  }
  
  /* Keep essential feedback animations */
  .upload-progress-bar {
    transition: width 100ms ease;
  }
  
  .amenity-checkbox:checked::after {
    animation: none;
    opacity: 1;
  }
}
```

#### Focus and Keyboard Navigation
```css
.apartment-card:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.photo-grid-item:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 4px;
  border-radius: 8px;
}

/* Keyboard navigation highlights */
.keyboard-navigation .apartment-card:focus {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

### Performance Optimizations

#### Hardware Acceleration
```css
.apartment-card,
.photo-grid-item,
.form-step {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

#### Animation Efficiency
```css
/* Use transform and opacity for animations */
.photo-upload-progress {
  will-change: transform;
}

.form-step-transition {
  will-change: transform, opacity;
}

/* Remove will-change after animations complete */
.animation-complete {
  will-change: auto;
}
```

## Related Documentation

- [Screen States Specifications](./screen-states.md) - Visual specifications for all states
- [User Journey Analysis](./user-journey.md) - Context for interaction design
- [Accessibility Requirements](./accessibility.md) - Inclusive interaction patterns
- [Implementation Guide](./implementation.md) - Technical implementation details