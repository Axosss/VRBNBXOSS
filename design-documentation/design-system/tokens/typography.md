---
title: Typography System
description: Comprehensive typography specifications and responsive type scale for VRBNBXOSS
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/style-guide.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/colors.md
status: draft
---

# Typography System

## Overview

Typography in VRBNBXOSS serves **information hierarchy first**, with careful attention to readability across all devices and use cases common in property management workflows. Our type system prioritizes clarity, scannability, and professional appearance.

## Font Selection

### Primary Typeface: Inter
**Inter** provides exceptional readability at all sizes and optimal performance in UI contexts.

**Characteristics:**
- **Legibility**: Designed specifically for computer screens
- **Neutrality**: Professional without being sterile
- **Versatility**: Works well for both data and narrative content
- **Performance**: Optimized for web font loading

**Font Stack:**
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Monospace Typeface: JetBrains Mono
**JetBrains Mono** for technical content, code snippets, and data that requires fixed-width formatting.

**Font Stack:**
```css
font-family: "JetBrains Mono", Consolas, "Monaco", "Courier New", monospace;
```

## Font Weight System

**Light - 300**
- Usage: Large decorative headings, hero text
- Purpose: Creates visual hierarchy without overwhelming

**Regular - 400**
- Usage: Body text, standard UI elements, form inputs
- Purpose: Primary reading text, optimal readability

**Medium - 500**
- Usage: Form labels, emphasized text, navigation items
- Purpose: Subtle emphasis without being too bold

**Semibold - 600**
- Usage: Subheadings, card titles, section headers
- Purpose: Clear hierarchy while maintaining readability

**Bold - 700**
- Usage: Page headings, primary navigation, important CTAs
- Purpose: Strong emphasis and clear information architecture

## Type Scale & Hierarchy

### Display Styles
Large-scale typography for hero sections and major visual impact.

**Display Large**
```css
font-size: 48px;
line-height: 56px;
font-weight: 700;
letter-spacing: -0.02em;
```
**Mobile**: `36px/44px`
**Usage**: Landing page headlines, hero sections, major announcements

**Display Medium**
```css
font-size: 36px;
line-height: 44px;
font-weight: 700;
letter-spacing: -0.02em;
```
**Mobile**: `30px/36px`
**Usage**: Section heroes, feature headlines, dashboard welcome messages

### Heading Styles
Structured hierarchy for content organization and information architecture.

**H1 - Primary Page Headings**
```css
font-size: 30px;
line-height: 36px;
font-weight: 700;
letter-spacing: -0.01em;
color: var(--slate-900);
```
**Mobile**: `24px/32px`
**Usage**: Page titles, main content headers, primary navigation headings

**H2 - Section Headings**
```css
font-size: 24px;
line-height: 32px;
font-weight: 600;
letter-spacing: -0.01em;
color: var(--slate-800);
```
**Mobile**: `20px/28px`
**Usage**: Major section headings, card titles, modal headers

**H3 - Subsection Headings**
```css
font-size: 20px;
line-height: 28px;
font-weight: 600;
letter-spacing: -0.005em;
color: var(--slate-800);
```
**Mobile**: `18px/24px`
**Usage**: Subsection headings, component titles, form section headers

**H4 - Minor Headings**
```css
font-size: 18px;
line-height: 24px;
font-weight: 600;
color: var(--slate-700);
```
**Mobile**: `16px/24px`
**Usage**: Widget titles, table headers, minor content sections

**H5 - Compact Headings**
```css
font-size: 16px;
line-height: 24px;
font-weight: 600;
color: var(--slate-700);
```
**Mobile**: `16px/24px`
**Usage**: Compact layouts, sidebar headings, status section titles

### Body Text Styles
Reading text optimized for comprehension and user interface clarity.

**Body Large**
```css
font-size: 18px;
line-height: 28px;
font-weight: 400;
color: var(--slate-700);
```
**Mobile**: `16px/24px`
**Usage**: Primary reading content, important descriptions, feature explanations

**Body - Standard UI Text**
```css
font-size: 16px;
line-height: 24px;
font-weight: 400;
color: var(--slate-600);
```
**Mobile**: `16px/24px`
**Usage**: Standard UI text, form inputs, button text, general interface content

**Body Small**
```css
font-size: 14px;
line-height: 20px;
font-weight: 400;
color: var(--slate-600);
```
**Mobile**: `14px/20px`
**Usage**: Secondary information, metadata, table content, compact layouts

### UI-Specific Text Styles

**Label Large - Prominent Form Labels**
```css
font-size: 16px;
line-height: 24px;
font-weight: 500;
color: var(--slate-700);
```
**Usage**: Primary form labels, important UI element labels, section identifiers

**Label - Standard Form Labels**
```css
font-size: 14px;
line-height: 20px;
font-weight: 500;
color: var(--slate-700);
```
**Usage**: Standard form labels, UI element labels, navigation items

**Label Small - Compact Labels**
```css
font-size: 12px;
line-height: 16px;
font-weight: 500;
letter-spacing: 0.05em;
text-transform: uppercase;
color: var(--slate-600);
```
**Usage**: Compact labels, table headers, status badges, category tags

**Caption - Supporting Information**
```css
font-size: 12px;
line-height: 16px;
font-weight: 400;
color: var(--slate-500);
```
**Usage**: Timestamps, footnotes, helper text, supporting descriptions

**Code - Technical Content**
```css
font-family: "JetBrains Mono", monospace;
font-size: 14px;
line-height: 20px;
font-weight: 400;
color: var(--slate-700);
background-color: var(--slate-100);
```
**Usage**: API responses, technical references, ID numbers, formatted data

## Responsive Typography

### Breakpoint-Specific Scaling

**Mobile (320px - 767px)**
- Prioritizes readability over hierarchy
- Reduces size differences between heading levels
- Maintains optimal line length (45-65 characters)
- Increases line height for touch-friendly spacing

**Tablet (768px - 1023px)**
- Balances mobile readability with desktop hierarchy
- Intermediate sizing between mobile and desktop
- Optimal for mixed touch/cursor interaction

**Desktop (1024px+)**
- Full type scale for maximum hierarchy clarity
- Optimized for keyboard navigation and detailed workflows
- Supports complex information architecture

### Line Length Optimization

**Optimal Reading Length**: 45-75 characters per line

**Implementation:**
```css
.readable-text {
  max-width: 65ch; /* Approximately 65 characters */
  line-height: 1.6;
}
```

## Typography Usage Guidelines

### Information Hierarchy Best Practices

**Page Structure:**
1. **H1**: One per page, primary page purpose
2. **H2**: Major sections, typically 2-5 per page  
3. **H3**: Subsections within H2 content
4. **H4-H5**: Fine-grained content organization

**Content Scanning:**
- Use consistent spacing between heading levels
- Maintain logical heading sequence (don't skip levels)
- Keep headings concise and descriptive
- Use parallel structure in heading groups

### Color Application with Typography

**Text Color Hierarchy:**
```css
/* Primary text - highest importance */
.text-primary {
  color: var(--slate-900);
}

/* Secondary text - standard content */
.text-secondary {
  color: var(--slate-700);
}

/* Tertiary text - supporting information */
.text-tertiary {
  color: var(--slate-600);
}

/* Muted text - metadata, placeholders */
.text-muted {
  color: var(--slate-500);
}
```

**Semantic Text Colors:**
```css
.text-success { color: var(--success-600); }
.text-warning { color: var(--warning-600); }
.text-error { color: var(--error-600); }
.text-info { color: var(--info-600); }
.text-link { color: var(--primary-600); }
```

## Accessibility Considerations

### Contrast Requirements
All typography meets WCAG 2.1 AA standards:

**Normal Text (16px and below):** 4.5:1 minimum
- `Slate-900` on white: 18.7:1 ✅
- `Slate-800` on `Slate-50`: 14.8:1 ✅
- `Slate-700` on `Slate-100`: 11.2:1 ✅

**Large Text (18px and above):** 3.0:1 minimum
- All approved normal text combinations exceed this requirement

### Dynamic Text Scaling
Support system font scaling up to 200% zoom:

```css
/* Relative units for scalability */
.scalable-text {
  font-size: 1rem; /* 16px base */
  line-height: 1.5; /* 24px at base size */
}
```

### Focus and Interaction States

**Link States:**
```css
.link {
  color: var(--primary-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:hover {
  color: var(--primary-700);
  text-decoration: none;
}

.link:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

## Implementation

### CSS Custom Properties
```css
:root {
  /* Font Families */
  --font-family-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "JetBrains Mono", Consolas, "Monaco", "Courier New", monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  
  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Tailwind Configuration
```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace']
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px/16px
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px/20px
        base: ['1rem', { lineHeight: '1.5rem' }],    // 16px/24px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px/28px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px/28px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px/32px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px/36px
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],  // 36px/44px
        '5xl': ['3rem', { lineHeight: '3.5rem' }]       // 48px/56px
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em'
      }
    }
  }
}
```

### React Component Examples

**Typography Component:**
```jsx
const Typography = {
  H1: ({ children, ...props }) => (
    <h1 className="text-3xl font-bold text-slate-900 tracking-tight" {...props}>
      {children}
    </h1>
  ),
  
  H2: ({ children, ...props }) => (
    <h2 className="text-2xl font-semibold text-slate-800 tracking-tight" {...props}>
      {children}
    </h2>
  ),
  
  Body: ({ children, ...props }) => (
    <p className="text-base text-slate-600 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  
  Label: ({ children, ...props }) => (
    <label className="text-sm font-medium text-slate-700" {...props}>
      {children}
    </label>
  ),
  
  Caption: ({ children, ...props }) => (
    <span className="text-xs text-slate-500" {...props}>
      {children}
    </span>
  )
};
```

### Usage Examples

**Page Header:**
```jsx
<header className="space-y-2">
  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
    Reservation Management
  </h1>
  <p className="text-lg text-slate-600">
    View and manage all your property reservations
  </p>
</header>
```

**Form Section:**
```jsx
<section className="space-y-4">
  <h2 className="text-xl font-semibold text-slate-800">
    Guest Information
  </h2>
  <div className="space-y-3">
    <label className="text-sm font-medium text-slate-700">
      Guest Name
    </label>
    <input className="text-base text-slate-600" />
    <p className="text-xs text-slate-500">
      Enter the primary guest's full name
    </p>
  </div>
</section>
```

---

*This typography system provides the foundation for clear, accessible, and professional communication throughout VRBNBXOSS. Consistent application ensures optimal readability and user experience across all interface elements.*