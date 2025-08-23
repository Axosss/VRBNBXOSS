---
title: VRBNBXOSS Style Guide
description: Complete visual design specifications for the rental property management platform
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/colors.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/typography.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/spacing.md
status: draft
---

# VRBNBXOSS Style Guide

## Design Philosophy

VRBNBXOSS embodies **professional efficiency through intuitive design**. Our visual language prioritizes operational clarity, data accessibility, and workflow optimization for property management professionals.

### Core Design Principles

1. **Efficiency-First Design**: Every visual element serves the goal of faster task completion
2. **Information Hierarchy**: Strategic use of typography, color, and spacing to guide attention
3. **Professional Trust**: Clean, modern aesthetic that instills confidence in business operations
4. **Responsive Intelligence**: Adaptive layouts that work seamlessly across all devices
5. **Accessibility Excellence**: Universal usability without compromising visual appeal

---

## Color System

### Primary Brand Colors

**Primary Blue** - Professional, trustworthy, action-oriented
- `Primary-600`: `#2563eb` - Main CTAs, primary buttons, active states
- `Primary-700`: `#1d4ed8` - Hover states, emphasis, selected items  
- `Primary-500`: `#3b82f6` - Links, secondary actions, highlights
- `Primary-100`: `#dbeafe` - Subtle backgrounds, selected states
- `Primary-50`: `#eff6ff` - Light backgrounds, hover states

**Secondary Slate** - Professional neutrals, sophisticated backgrounds
- `Slate-900`: `#0f172a` - Primary text, headers, high contrast
- `Slate-800`: `#1e293b` - Secondary text, subheaders
- `Slate-700`: `#334155` - Body text, navigation items
- `Slate-600`: `#475569` - Secondary text, labels
- `Slate-500`: `#64748b` - Muted text, placeholders
- `Slate-400`: `#94a3b8` - Borders, dividers, disabled states
- `Slate-300`: `#cbd5e1` - Light borders, input outlines
- `Slate-200`: `#e2e8f0` - Background accents, subtle borders
- `Slate-100`: `#f1f5f9` - Light backgrounds, hover states
- `Slate-50`: `#f8fafc` - Page backgrounds, cards

### Semantic Colors

**Success Green** - Confirmations, positive actions, completed states
- `Success-600`: `#16a34a` - Primary success actions
- `Success-500`: `#22c55e` - Success indicators, positive feedback
- `Success-100`: `#dcfce7` - Success backgrounds, subtle highlights

**Warning Amber** - Cautions, pending states, important notifications
- `Warning-600`: `#d97706` - Warning actions, important alerts
- `Warning-500`: `#f59e0b` - Warning indicators, attention-drawing elements
- `Warning-100`: `#fef3c7` - Warning backgrounds, subtle alerts

**Error Red** - Errors, destructive actions, critical alerts
- `Error-600`: `#dc2626` - Error actions, destructive buttons
- `Error-500`: `#ef4444` - Error indicators, validation messages
- `Error-100`: `#fecaca` - Error backgrounds, input error states

**Info Blue** - Informational messages, helpful guidance
- `Info-600`: `#0284c7` - Information actions, secondary CTAs
- `Info-500`: `#0ea5e9` - Information indicators, helpful text
- `Info-100`: `#e0f2fe` - Information backgrounds, tip containers

### Platform-Specific Accent Colors

**Airbnb Brand** - `#ff5a5f` - Used sparingly for Airbnb-specific features
**VRBO Brand** - `#0066cc` - Used sparingly for VRBO-specific features  
**Direct Booking** - `#059669` - Used for direct booking features

### Accessibility Compliance

All color combinations meet WCAG 2.1 AA standards:
- **Normal Text**: 4.5:1 contrast ratio minimum
- **Large Text**: 3.0:1 contrast ratio minimum
- **Interactive Elements**: 3.0:1 contrast ratio with background
- **Color-Blind Friendly**: Patterns and icons supplement color-only information

---

## Typography System

### Font Stack
**Primary**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`  
**Monospace**: `JetBrains Mono, Consolas, "Monaco", "Courier New", monospace`

### Font Weights
- **Light**: 300 - Decorative text, large headings  
- **Regular**: 400 - Body text, standard UI text
- **Medium**: 500 - Emphasized text, form labels
- **Semibold**: 600 - Subheadings, important UI elements
- **Bold**: 700 - Headings, primary navigation, CTAs

### Type Scale & Usage

#### Display & Headings
**Display Large** - `48px/56px, 700, -0.02em`
- Hero sections, landing page headlines
- Mobile: `36px/44px`

**Display Medium** - `36px/44px, 700, -0.02em`  
- Section headers, feature headlines
- Mobile: `30px/36px`

**H1** - `30px/36px, 700, -0.01em`
- Page titles, main content headers
- Mobile: `24px/32px`

**H2** - `24px/32px, 600, -0.01em`
- Section headings, card titles
- Mobile: `20px/28px`

**H3** - `20px/28px, 600, -0.005em`
- Subsection headings, component titles
- Mobile: `18px/24px`

**H4** - `18px/24px, 600`
- Minor headings, widget titles
- Mobile: `16px/24px`

#### Body Text
**Body Large** - `18px/28px, 400`
- Primary reading content, important descriptions
- Mobile: `16px/24px`

**Body** - `16px/24px, 400`
- Standard UI text, form inputs, general content
- Mobile: `16px/24px`

**Body Small** - `14px/20px, 400`
- Secondary information, metadata, captions
- Mobile: `14px/20px`

#### UI Text
**Label Large** - `16px/24px, 500`
- Primary form labels, important UI labels
- Mobile: `16px/24px`

**Label** - `14px/20px, 500`
- Standard form labels, UI element labels
- Mobile: `14px/20px`

**Label Small** - `12px/16px, 500, 0.05em`
- Compact labels, table headers, status badges
- Mobile: `12px/16px`

**Caption** - `12px/16px, 400`
- Timestamps, footnotes, helper text
- Mobile: `12px/16px`

**Code** - `14px/20px, 400, monospace`
- Code snippets, technical references
- Mobile: `14px/20px`

### Typography Best Practices
1. **Hierarchy**: Use size, weight, and color to create clear information hierarchy
2. **Readability**: Maintain optimal line length (45-75 characters)
3. **Spacing**: Use consistent vertical rhythm between text elements
4. **Contrast**: Ensure sufficient contrast for all text elements
5. **Responsive**: Scale typography appropriately across breakpoints

---

## Spacing & Layout System

### Base Unit & Scale
**Base Unit**: `4px` (0.25rem)

**Spacing Scale**
- `0`: `0px` - No spacing
- `1`: `4px` - Micro spacing, icon gaps
- `2`: `8px` - Small internal padding, compact layouts
- `3`: `12px` - Medium internal spacing
- `4`: `16px` - Standard spacing, default margins
- `5`: `20px` - Large internal spacing
- `6`: `24px` - Section spacing, card padding
- `8`: `32px` - Large section breaks, component spacing
- `10`: `40px` - Extra large spacing, major sections
- `12`: `48px` - Huge spacing, page sections
- `16`: `64px` - Maximum spacing, hero sections
- `20`: `80px` - Extreme spacing, landing page sections

### Grid System
**Container Widths**
- **Mobile**: `100%` with 16px margins
- **Tablet**: `768px` max-width
- **Desktop**: `1200px` max-width
- **Wide**: `1400px` max-width

**Grid Columns**
- **Mobile**: 4 columns, 16px gutters
- **Tablet**: 8 columns, 20px gutters  
- **Desktop**: 12 columns, 24px gutters

**Breakpoints**
- `sm`: `640px` - Small tablets and large phones
- `md`: `768px` - Tablets
- `lg`: `1024px` - Small desktops
- `xl`: `1280px` - Large desktops
- `2xl`: `1536px` - Extra large screens

### Layout Patterns
**Page Layout**
- **Header**: Fixed 64px height on desktop, 56px on mobile
- **Sidebar**: 280px width on desktop, collapsible on tablet/mobile
- **Main Content**: Fluid with max-width constraints
- **Footer**: Adaptive height based on content

**Component Spacing**
- **Cards**: 24px internal padding, 16px on mobile
- **Forms**: 24px between field groups, 16px between fields
- **Lists**: 12px between items, 8px for compact lists
- **Buttons**: 12px internal padding vertical, 16px horizontal

---

## Component Specifications

### Border Radius System
- `None`: `0px` - Sharp edges, formal elements
- `Small`: `4px` - Buttons, input fields, compact elements
- `Medium`: `8px` - Cards, larger buttons, standard UI elements
- `Large`: `12px` - Hero cards, prominent containers
- `Extra Large`: `16px` - Special containers, decorative elements
- `Full`: `9999px` - Circular elements, pills, badges

### Shadow System
**Elevation Levels**
- `Shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` - Subtle depth, input focus
- `Shadow`: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)` - Cards, buttons
- `Shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` - Dropdowns, tooltips
- `Shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` - Modals, popups
- `Shadow-xl`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` - Large overlays

### Border System
- **Default**: `1px solid Slate-300` - Standard borders, input outlines
- **Emphasis**: `2px solid Primary-500` - Focus states, active elements
- **Subtle**: `1px solid Slate-200` - Light dividers, card edges
- **Strong**: `2px solid Slate-700` - High contrast borders, emphasis

---

## Motion & Animation System

### Timing Functions
- **Ease-out**: `cubic-bezier(0.0, 0, 0.2, 1)` - Entrances, expansions, hover effects
- **Ease-in-out**: `cubic-bezier(0.4, 0, 0.6, 1)` - Transitions, state changes
- **Ease-in**: `cubic-bezier(0.4, 0, 1, 1)` - Exits, collapses, removals
- **Spring**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` - Playful interactions, success states

### Duration Scale
- **Instant**: `0ms` - Immediate state changes
- **Micro**: `150ms` - Hover effects, button presses, micro-interactions
- **Short**: `300ms` - Transitions, dropdown animations, form feedback
- **Medium**: `500ms` - Page transitions, modal appearances, loading states
- **Long**: `800ms` - Complex animations, onboarding flows, celebrations

### Animation Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Consistent**: Similar actions use similar timings and easing
3. **Responsive**: Respect user preferences for reduced motion
4. **Performant**: Use transform and opacity for smooth 60fps animations
5. **Accessible**: Provide alternatives for users who prefer reduced motion

---

## Iconography System

### Icon Library
**Primary**: Lucide React icons for consistency and optimization

### Icon Sizing
- **Small**: `16px` - Inline with text, compact UI elements
- **Medium**: `20px` - Standard buttons, form elements, navigation
- **Large**: `24px` - Prominent actions, headers, feature icons
- **Extra Large**: `32px` - Hero sections, empty states, decorative usage

### Icon Usage Guidelines
1. **Semantic Consistency**: Use the same icon for the same concept throughout
2. **Optical Alignment**: Align icons visually, not mathematically, with text
3. **Color Harmony**: Icons inherit text color unless specifically styled
4. **Context Clarity**: Icons should be understandable without additional context
5. **Accessibility**: Always provide alt text or labels for screen readers

---

## Implementation Guidelines

### CSS Custom Properties
```css
:root {
  /* Colors */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-slate-900: #0f172a;
  
  /* Typography */
  --font-family-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-lg: 1.125rem;
  --line-height-lg: 1.75rem;
  
  /* Spacing */
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  
  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
```

### Tailwind Configuration
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        slate: {
          50: '#f8fafc',
          900: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  }
}
```

---

## Quality Standards

### Design Review Checklist
- [ ] Colors meet WCAG 2.1 AA contrast requirements
- [ ] Typography follows established hierarchy and scale
- [ ] Spacing uses systematic scale consistently
- [ ] Components have all required states defined
- [ ] Responsive behavior specified for all breakpoints
- [ ] Animation respects accessibility preferences
- [ ] Documentation is complete and accurate

### Accessibility Requirements
- [ ] Keyboard navigation support for all interactive elements
- [ ] Screen reader compatibility with proper semantic markup
- [ ] Color contrast ratios verified for all text/background combinations
- [ ] Focus indicators visible and consistent
- [ ] Alternative text provided for all meaningful images and icons
- [ ] Motion can be disabled via `prefers-reduced-motion`

---

*This style guide serves as the definitive visual specification for VRBNBXOSS. All design and development work should reference these standards to ensure consistency and quality across the platform.*