---
title: Button System
description: Comprehensive button component specifications and usage guidelines for VRBNBXOSS
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/colors.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/animations.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/accessibility/guidelines.md
status: draft
---

# Button System

## Overview

Buttons in VRBNBXOSS provide **clear, actionable interface elements** that guide users through property management workflows. Our button system prioritizes clarity, accessibility, and consistent interaction patterns across all device types.

## Button Hierarchy

### Primary Buttons
**Purpose**: Main call-to-action, most important action on the page  
**Usage**: "Save Reservation", "Add Apartment", "Create Cleaning Schedule"

### Secondary Buttons  
**Purpose**: Supporting actions, alternative choices  
**Usage**: "Cancel", "Edit", "View Details"

### Tertiary Buttons
**Purpose**: Subtle actions, less prominent options  
**Usage**: "Reset Form", "Skip", "Learn More"

### Destructive Buttons
**Purpose**: Dangerous or irreversible actions  
**Usage**: "Delete Reservation", "Remove Apartment", "Cancel Booking"

## Button Variants

### Primary Button

**Visual Specifications**
- **Background**: `Primary-600` (#2563eb)
- **Text Color**: White
- **Border**: None
- **Font Weight**: 500 (Medium)
- **Border Radius**: 6px
- **Shadow**: `0 1px 2px rgba(0, 0, 0, 0.05)`

**States & Interactions**
```css
/* Default State */
.btn-primary {
  background-color: #2563eb;
  color: white;
  font-weight: 500;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 150ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

/* Hover State */
.btn-primary:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

/* Active State */
.btn-primary:active {
  background-color: #1e40af;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Focus State */
.btn-primary:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Disabled State */
.btn-primary:disabled {
  background-color: #94a3b8;
  color: #cbd5e1;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Loading State */
.btn-primary.loading {
  color: transparent;
  position: relative;
}

.btn-primary.loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin-left: -8px;
  margin-top: -8px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

**Usage Guidelines**
- Maximum one primary button per section
- Use for main actions: "Save", "Create", "Submit"
- Should be visually prominent and easily discoverable
- Place in predictable locations (bottom-right of forms, top-right of sections)

### Secondary Button

**Visual Specifications**
- **Background**: `Slate-100` (#f1f5f9)
- **Text Color**: `Slate-700` (#334155)
- **Border**: 1px solid `Slate-300` (#cbd5e1)
- **Font Weight**: 500 (Medium)
- **Border Radius**: 6px

**States & Interactions**
```css
/* Default State */
.btn-secondary {
  background-color: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  font-weight: 500;
  border-radius: 6px;
  transition: all 150ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

/* Hover State */
.btn-secondary:hover {
  background-color: #e2e8f0;
  border-color: #94a3b8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

/* Active State */
.btn-secondary:active {
  background-color: #cbd5e1;
  transform: translateY(0);
}

/* Focus State */
.btn-secondary:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Disabled State */
.btn-secondary:disabled {
  background-color: #f8fafc;
  color: #cbd5e1;
  border-color: #e2e8f0;
  cursor: not-allowed;
}
```

**Usage Guidelines**
- Use for secondary actions: "Cancel", "Reset", "Back"
- Pair with primary buttons in forms and dialogs
- Can have multiple secondary buttons per section
- Good for navigation actions that don't modify data

### Tertiary Button (Ghost)

**Visual Specifications**
- **Background**: Transparent
- **Text Color**: `Primary-600` (#2563eb)
- **Border**: None
- **Font Weight**: 500 (Medium)
- **Border Radius**: 6px

**States & Interactions**
```css
/* Default State */
.btn-tertiary {
  background-color: transparent;
  color: #2563eb;
  border: none;
  font-weight: 500;
  border-radius: 6px;
  transition: all 150ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

/* Hover State */
.btn-tertiary:hover {
  background-color: #eff6ff;
  color: #1d4ed8;
}

/* Active State */
.btn-tertiary:active {
  background-color: #dbeafe;
}

/* Focus State */
.btn-tertiary:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Disabled State */
.btn-tertiary:disabled {
  color: #cbd5e1;
  background-color: transparent;
  cursor: not-allowed;
}
```

**Usage Guidelines**
- Use for subtle actions: "Edit", "View", "Learn More"
- Good for repeated actions in lists or tables
- Should not compete with primary actions for attention
- Ideal for navigation links styled as buttons

### Destructive Button

**Visual Specifications**
- **Background**: `Error-600` (#dc2626)
- **Text Color**: White
- **Border**: None
- **Font Weight**: 500 (Medium)
- **Border Radius**: 6px

**States & Interactions**
```css
/* Default State */
.btn-destructive {
  background-color: #dc2626;
  color: white;
  border: none;
  font-weight: 500;
  border-radius: 6px;
  transition: all 150ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

/* Hover State */
.btn-destructive:hover {
  background-color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.25);
}

/* Active State */
.btn-destructive:active {
  background-color: #991b1b;
  transform: translateY(0);
}

/* Focus State */
.btn-destructive:focus {
  outline: 2px solid #f87171;
  outline-offset: 2px;
}

/* Disabled State */
.btn-destructive:disabled {
  background-color: #94a3b8;
  color: #cbd5e1;
  cursor: not-allowed;
}
```

**Usage Guidelines**
- Use sparingly for dangerous actions: "Delete", "Remove", "Cancel Booking"
- Should always be accompanied by confirmation dialogs
- Never use as the primary action unless deletion/removal is the main purpose
- Consider using secondary destructive variant for less critical destructive actions

## Button Sizes

### Large Buttons
**Dimensions**: `48px` height, `24px` horizontal padding  
**Usage**: Primary CTAs, hero sections, mobile-first interfaces

```css
.btn-lg {
  height: 48px;
  padding: 0 24px;
  font-size: 16px;
  line-height: 24px;
}
```

### Medium Buttons (Default)
**Dimensions**: `40px` height, `16px` horizontal padding  
**Usage**: Standard forms, modal actions, general interface

```css
.btn-md {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  line-height: 20px;
}
```

### Small Buttons
**Dimensions**: `32px` height, `12px` horizontal padding  
**Usage**: Compact interfaces, table actions, secondary controls

```css
.btn-sm {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  line-height: 16px;
}
```

### Icon-Only Buttons
**Dimensions**: Square aspect ratio based on size  
**Usage**: Toolbar actions, compact controls, repeated actions

```css
.btn-icon-lg { width: 48px; height: 48px; }
.btn-icon-md { width: 40px; height: 40px; }
.btn-icon-sm { width: 32px; height: 32px; }
```

## Button Compositions

### Button Groups
For related actions that should be visually connected.

```css
.btn-group {
  display: inline-flex;
  border-radius: 6px;
  overflow: hidden;
}

.btn-group .btn {
  border-radius: 0;
  border-right-width: 0;
}

.btn-group .btn:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.btn-group .btn:last-child {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  border-right-width: 1px;
}
```

**Usage**: Calendar view toggles, filter options, related actions

### Button with Icon
Combining text with iconography for enhanced clarity.

```css
.btn-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-with-icon .icon {
  width: 16px;
  height: 16px;
}

.btn-with-icon.btn-sm .icon {
  width: 14px;
  height: 14px;
}

.btn-with-icon.btn-lg .icon {
  width: 20px;
  height: 20px;
}
```

**Usage**: "Add Reservation" (plus icon), "Export Data" (download icon)

### Split Buttons
Primary action with dropdown for additional options.

```css
.btn-split {
  display: inline-flex;
}

.btn-split .btn-main {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.btn-split .btn-dropdown {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0 8px;
}
```

**Usage**: "Save" with options for "Save & Close", "Save & New"

## Accessibility Specifications

### Keyboard Navigation
- All buttons focusable with Tab key
- Space bar and Enter key activation
- Focus indicators clearly visible (2px outline)
- Logical tab order in button groups

### Screen Reader Support
```html
<!-- Descriptive button text -->
<button type="button">Add New Reservation</button>

<!-- Icon buttons need aria-label -->
<button type="button" aria-label="Edit reservation">
  <EditIcon />
</button>

<!-- Loading state communication -->
<button type="button" aria-busy="true" aria-describedby="loading-text">
  Save Changes
  <span id="loading-text" className="sr-only">Saving...</span>
</button>

<!-- Disabled state explanation -->
<button type="button" disabled aria-describedby="disabled-reason">
  Delete Reservation
  <span id="disabled-reason" className="sr-only">
    Cannot delete reservation with active guest
  </span>
</button>
```

### Touch Target Guidelines
- Minimum 44×44px touch target (follows WCAG AA)
- Adequate spacing between adjacent buttons (8px minimum)
- Larger targets on mobile interfaces (48px recommended)

## Implementation

### React Component Example
```jsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  className,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus:ring-primary-500 disabled:bg-slate-400',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400',
    tertiary: 'bg-transparent text-primary-600 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-500 disabled:text-slate-400',
    destructive: 'bg-error-600 text-white shadow-sm hover:bg-error-700 focus:ring-error-500 disabled:bg-slate-400'
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2'
  };
  
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && 'relative text-transparent',
        className
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
```

### Usage Examples

**Form Actions**
```jsx
<div className="flex justify-end space-x-3">
  <Button variant="secondary">
    Cancel
  </Button>
  <Button variant="primary" loading={isSubmitting}>
    Save Reservation
  </Button>
</div>
```

**Destructive Action with Confirmation**
```jsx
const [showConfirm, setShowConfirm] = useState(false);

<Button 
  variant="destructive" 
  onClick={() => setShowConfirm(true)}
  icon={<TrashIcon />}
>
  Delete Apartment
</Button>
```

**Icon-Only Button**
```jsx
<Button 
  variant="tertiary" 
  size="sm"
  aria-label="Edit reservation details"
  className="w-8 h-8 p-0"
>
  <EditIcon className="w-4 h-4" />
</Button>
```

## Testing Checklist

### Visual Testing
- [ ] All button variants render correctly across browsers
- [ ] Hover states are smooth and visually appealing
- [ ] Focus indicators are clearly visible
- [ ] Loading states display properly
- [ ] Disabled states are visually distinct

### Interaction Testing
- [ ] Buttons respond to click, touch, keyboard activation
- [ ] Focus moves logically through button groups
- [ ] Loading states prevent multiple submissions
- [ ] Disabled buttons cannot be activated
- [ ] Touch targets meet minimum size requirements

### Accessibility Testing
- [ ] Screen readers announce button purpose clearly
- [ ] All interactive states are communicated to assistive technology
- [ ] Color contrast meets WCAG AA standards (4.5:1)
- [ ] Keyboard navigation works without mouse
- [ ] Focus indicators are visible to keyboard users

---

*This button system provides consistent, accessible, and professional interaction patterns throughout VRBNBXOSS. Proper implementation ensures reliable user experiences across all property management workflows.*