---
title: Spacing & Layout System
description: Comprehensive spacing scale, grid system, and layout patterns for VRBNBXOSS
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/style-guide.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/components/
status: draft
---

# Spacing & Layout System

## Overview

The VRBNBXOSS spacing system creates **visual rhythm and hierarchy** through systematic application of consistent spacing values. Our approach balances information density with readability, optimizing for both efficiency and cognitive comfort.

## Base Unit & Philosophy

### Base Unit: 4px (0.25rem)
All spacing values are multiples of 4px, creating mathematical consistency and optical harmony across the interface.

**Benefits:**
- **Consistency**: Predictable spacing relationships
- **Scalability**: Easy to adapt across different screen sizes
- **Development**: Simplified implementation with Tailwind's default scale
- **Accessibility**: Sufficient spacing for touch targets and readability

## Spacing Scale

### Core Spacing Values

```css
/* Base spacing scale */
--spacing-0: 0px;      /* No spacing */
--spacing-1: 4px;      /* 0.25rem - Micro spacing */
--spacing-2: 8px;      /* 0.5rem  - Small spacing */
--spacing-3: 12px;     /* 0.75rem - Medium-small spacing */
--spacing-4: 16px;     /* 1rem    - Base spacing */
--spacing-5: 20px;     /* 1.25rem - Medium spacing */
--spacing-6: 24px;     /* 1.5rem  - Large spacing */
--spacing-8: 32px;     /* 2rem    - Extra large spacing */
--spacing-10: 40px;    /* 2.5rem  - Section spacing */
--spacing-12: 48px;    /* 3rem    - Major section spacing */
--spacing-16: 64px;    /* 4rem    - Huge spacing */
--spacing-20: 80px;    /* 5rem    - Maximum spacing */
--spacing-24: 96px;    /* 6rem    - Hero section spacing */
```

### Semantic Spacing Usage

**Micro Spacing (4px)**
- Icon-to-text gaps
- Tightly related elements
- Badge positioning
- Border thickness adjustments

**Small Spacing (8px)**
- Button internal padding (vertical)
- Form field internal spacing
- Card element gaps
- Menu item padding

**Base Spacing (16px)**
- Standard margins between elements
- Default component padding
- Form field spacing
- List item separation

**Medium Spacing (24px)**
- Section dividers
- Card internal padding
- Modal content spacing
- Dashboard widget gaps

**Large Spacing (32px)**
- Major component separation
- Page section breaks
- Modal padding
- Navigation spacing

**Section Spacing (48px+)**
- Page sections
- Hero areas
- Major layout breaks
- Marketing sections

## Grid System

### Responsive Grid Structure

**Container Widths:**
```css
/* Container max-widths by breakpoint */
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem; /* 16px */
}

@media (min-width: 640px) {
  .container { 
    max-width: 640px;
    padding: 0 1.5rem; /* 24px */
  }
}

@media (min-width: 768px) {
  .container { 
    max-width: 768px;
    padding: 0 2rem; /* 32px */
  }
}

@media (min-width: 1024px) {
  .container { 
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container { 
    max-width: 1200px;
  }
}

@media (min-width: 1536px) {
  .container { 
    max-width: 1400px;
  }
}
```

**Grid Columns:**
- **Mobile (320px-767px)**: 4 columns, 16px gutters
- **Tablet (768px-1023px)**: 8 columns, 20px gutters
- **Desktop (1024px+)**: 12 columns, 24px gutters

### Breakpoints

```css
/* VRBNBXOSS responsive breakpoints */
--breakpoint-sm: 640px;   /* Small tablets, large phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large screens */
```

**Usage Guidelines:**
- **Mobile First**: Design for smallest screens first
- **Progressive Enhancement**: Add complexity at larger breakpoints
- **Content Priority**: Most important content visible at all sizes
- **Touch Targets**: Minimum 44px×44px on mobile devices

## Layout Patterns

### Application Layout Structure

**Dashboard Layout:**
```
┌─────────────────────────────────────────┐
│ Header (64px height)                    │
├─────────────┬───────────────────────────┤
│ Sidebar     │ Main Content              │
│ (280px)     │ (fluid with max-width)    │
│             │                           │
│             │                           │
│             │                           │
└─────────────┴───────────────────────────┘
```

**Responsive Behavior:**
- **Desktop**: Full sidebar visible
- **Tablet**: Collapsible sidebar overlay
- **Mobile**: Hidden sidebar, hamburger menu

### Component Spacing Standards

**Card Components:**
```css
.card {
  padding: 24px;           /* Desktop internal spacing */
  margin-bottom: 24px;     /* Gap between cards */
  border-radius: 8px;
}

@media (max-width: 767px) {
  .card {
    padding: 16px;         /* Mobile internal spacing */
    margin-bottom: 16px;   /* Smaller gaps on mobile */
  }
}
```

**Form Layouts:**
```css
.form-group {
  margin-bottom: 24px;     /* Gap between form sections */
}

.form-field {
  margin-bottom: 16px;     /* Gap between individual fields */
}

.field-label {
  margin-bottom: 8px;      /* Gap between label and input */
}

.field-help {
  margin-top: 4px;         /* Gap between input and help text */
}
```

**List Components:**
```css
.list-item {
  padding: 12px 0;         /* Vertical padding for list items */
  border-bottom: 1px solid var(--slate-200);
}

.list-item:last-child {
  border-bottom: none;
}

.list-compact .list-item {
  padding: 8px 0;          /* Compact list spacing */
}
```

### Page Layout Patterns

**Standard Page Layout:**
```css
.page {
  padding: 32px 0;         /* Top/bottom page spacing */
}

.page-header {
  margin-bottom: 32px;     /* Space below page header */
}

.page-section {
  margin-bottom: 48px;     /* Space between major sections */
}

.page-section:last-child {
  margin-bottom: 0;
}
```

**Dashboard Widget Layout:**
```css
.dashboard-grid {
  display: grid;
  gap: 24px;               /* Gap between dashboard widgets */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

@media (max-width: 767px) {
  .dashboard-grid {
    gap: 16px;             /* Smaller gaps on mobile */
    grid-template-columns: 1fr;
  }
}
```

## Content Spacing Guidelines

### Typography Spacing

**Heading Spacing:**
```css
h1, h2, h3, h4, h5, h6 {
  margin-top: 1.5em;       /* Space above headings */
  margin-bottom: 0.5em;    /* Space below headings */
}

h1:first-child,
h2:first-child,
h3:first-child {
  margin-top: 0;           /* No top margin for first heading */
}
```

**Paragraph Spacing:**
```css
p {
  margin-bottom: 16px;     /* Space between paragraphs */
}

p:last-child {
  margin-bottom: 0;        /* No bottom margin for last paragraph */
}
```

**List Spacing:**
```css
ul, ol {
  margin-bottom: 16px;     /* Space below lists */
  padding-left: 20px;      /* Indentation for list items */
}

li {
  margin-bottom: 4px;      /* Small gap between list items */
}

li:last-child {
  margin-bottom: 0;
}
```

### Data Display Spacing

**Table Spacing:**
```css
table {
  border-spacing: 0;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;      /* Table cell internal spacing */
  border-bottom: 1px solid var(--slate-200);
}

th {
  padding-top: 16px;       /* Extra space above headers */
  padding-bottom: 16px;
}
```

**Statistics Cards:**
```css
.stat-card {
  padding: 24px;           /* Internal spacing */
  text-align: center;
}

.stat-value {
  margin-bottom: 8px;      /* Space between value and label */
}

.stat-label {
  margin-bottom: 4px;      /* Small space below label */
}
```

## Touch Target Guidelines

### Minimum Touch Targets
All interactive elements must meet minimum size requirements for accessibility:

```css
/* Minimum touch target sizes */
.touch-target {
  min-width: 44px;         /* WCAG AA minimum */
  min-height: 44px;
  padding: 12px 16px;      /* Internal padding */
}

.touch-target-small {
  min-width: 36px;         /* Compact interfaces */
  min-height: 36px;
  padding: 8px 12px;
}
```

**Implementation Examples:**
- Buttons: 44px minimum height
- Form inputs: 44px minimum height  
- Navigation items: 44px minimum touch area
- Icon buttons: 44px×44px minimum clickable area

## Responsive Spacing Adaptations

### Mobile Spacing Adjustments

**Reduced Spacing for Mobile:**
```css
/* Desktop spacing */
.section-spacing {
  margin-bottom: 48px;
}

.card-spacing {
  padding: 24px;
  gap: 24px;
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .section-spacing {
    margin-bottom: 32px;   /* Reduced section spacing */
  }
  
  .card-spacing {
    padding: 16px;         /* Reduced card padding */
    gap: 16px;            /* Reduced internal gaps */
  }
}
```

### Safe Areas for Mobile Devices

**iOS Safe Area Support:**
```css
/* Support for iPhone notches and home indicators */
.page-container {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.mobile-header {
  padding-top: env(safe-area-inset-top);
}

.mobile-footer {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Implementation

### CSS Custom Properties
```css
:root {
  /* Spacing scale */
  --space-1: 0.25rem;      /* 4px */
  --space-2: 0.5rem;       /* 8px */
  --space-3: 0.75rem;      /* 12px */
  --space-4: 1rem;         /* 16px */
  --space-5: 1.25rem;      /* 20px */
  --space-6: 1.5rem;       /* 24px */
  --space-8: 2rem;         /* 32px */
  --space-10: 2.5rem;      /* 40px */
  --space-12: 3rem;        /* 48px */
  --space-16: 4rem;        /* 64px */
  --space-20: 5rem;        /* 80px */
  --space-24: 6rem;        /* 96px */
  
  /* Layout values */
  --header-height: 64px;
  --sidebar-width: 280px;
  --container-padding: 2rem;
  
  /* Touch targets */
  --touch-target-min: 44px;
  --touch-target-small: 36px;
}
```

### Tailwind Configuration
```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',        /* 72px - Custom spacing */
        '88': '22rem',         /* 352px - Custom large spacing */
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)'
      },
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1200px',
        'container-2xl': '1400px'
      }
    }
  }
}
```

### Usage Examples

**Component Spacing:**
```jsx
// Card with consistent spacing
<div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
  <h3 className="text-lg font-semibold text-slate-900">
    Reservation Details
  </h3>
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600">Check-in</span>
      <span className="text-sm font-medium text-slate-900">Mar 15, 2025</span>
    </div>
  </div>
</div>

// Form with systematic spacing
<form className="space-y-6">
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-slate-900">Guest Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Name</label>
        <input className="w-full px-3 py-2 border border-slate-300 rounded-md" />
      </div>
    </div>
  </div>
</form>
```

---

*This spacing system provides the foundation for consistent, accessible, and visually harmonious layouts throughout VRBNBXOSS. Systematic application ensures optimal information density and user experience across all devices.*