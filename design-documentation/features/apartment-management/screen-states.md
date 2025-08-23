---
title: Apartment Management - Screen States & Specifications
description: Detailed screen-by-screen specifications for all apartment management interface states
feature: Apartment Management
last-updated: 2025-01-22
version: 1.0
related-files: 
  - README.md
  - user-journey.md
  - interactions.md
dependencies:
  - Design system specifications
  - Photo upload components
  - Form validation system
status: approved
---

# Apartment Management - Screen States & Specifications

## Screen-by-Screen Specifications

### Screen: Apartment List View
**Purpose:** Overview of all user apartments with management capabilities
**Layout Structure:** Responsive grid/list layout with filtering and search
**Content Strategy:** Visual-first approach with key information readily accessible

#### State: Default List View

**Visual Design Specifications:**
- **Layout:** 
  - Grid view: 3 columns desktop, 2 tablet, 1 mobile with `gap: lg (24px)`
  - List view: Single column with horizontal layout
  - Header with view toggle, search, filter, and "Add Apartment" CTA
- **Typography:** 
  - Apartment names: `H4` weight for clear hierarchy
  - Address: `Body Small` in `Neutral-600`
  - Status indicators: `Caption` with semantic colors
- **Color Application:**
  - Cards: `Neutral-50` background with `Neutral-200` border
  - Active/hover states: `Primary Light` background
  - Status indicators: Semantic colors (Success, Warning, Error)
- **Interactive Elements:**
  - Apartment cards with hover elevation
  - Quick action menu (three dots) on each card
  - Bulk selection checkboxes (hidden until first selection)
- **Visual Hierarchy:** 
  - Primary photo prominently displayed
  - Apartment name and address clearly readable
  - Status indicators subtle but visible
- **Whitespace Usage:**
  - `md (16px)` padding within cards
  - `lg (24px)` spacing between cards
  - `xl (32px)` margins around list container

**Interaction Design Specifications:**
- **Primary Actions:**
  - **Add Apartment Button:**
    - Position: Top right of header
    - Style: Primary button with plus icon
    - Size: `height: 44px` with proper padding
    - States: Default, hover, active, focus, loading
- **Secondary Actions:**
  - **View Toggle:** Grid/list icons with active state indication
  - **Search Input:** Expandable on mobile, persistent on desktop
  - **Filter Dropdown:** Organized by status, capacity, amenities
  - **Sort Options:** Name, date added, last updated, status
- **Card Interactions:**
  - **Main Card Area:** Click to view apartment details
  - **Quick Actions Menu:** Edit, duplicate, maintenance mode, archive
  - **Status Toggle:** Quick maintenance mode activation
- **Bulk Operations:**
  - **Multi-select:** Checkbox selection with "Select All" option
  - **Bulk Actions:** Archive, maintenance mode, duplicate, export

**Responsive Design Specifications:**
- **Mobile (320-767px):**
  - Single column card layout
  - Simplified card content with essential information only
  - Search and filter collapse into mobile-friendly controls
- **Tablet (768-1023px):**
  - Two column grid with balanced card proportions
  - Search bar remains visible with filter dropdown
- **Desktop (1024px+):**
  - Three column grid with full feature set
  - All controls visible and optimally positioned

### Screen: Apartment Creation Flow
**Purpose:** Guided apartment profile creation with progressive disclosure
**Layout Structure:** Multi-step wizard with clear progress indication
**Content Strategy:** Essential information first, enhancement options revealed progressively

#### State: Step 1 - Basic Information

**Visual Design Specifications:**
- **Layout:** 
  - Centered form with max-width: `500px`
  - Progress indicator at top showing "Step 1 of 4"
  - Form fields with generous vertical spacing
- **Typography:** 
  - Step header: `H2` with clear step title
  - Field labels: `Label` with required indicators
  - Help text: `Body Small` in `Neutral-600`
- **Color Application:**
  - Form background: White with subtle shadow
  - Progress indicator: Primary color for current step
  - Required field indicators: Error color asterisk
- **Interactive Elements:**
  - Text inputs for name and address
  - Number inputs for capacity information
  - "Save & Continue" primary button
  - "Save Draft" secondary button

**Form Validation Specifications:**
- **Real-time Validation:**
  - Apartment name: Uniqueness check with helpful suggestions
  - Address: Autocomplete with validation against geocoding API
  - Capacity: Range validation with local regulation compliance
- **Error States:**
  - Field-level errors with specific guidance
  - Form-level errors with resolution steps
  - Network error handling with retry options

#### State: Step 2 - Photo Upload

**Visual Design Specifications:**
- **Layout:** 
  - Large drag-and-drop area with visual upload indicators
  - Photo grid below with drag-to-reorder capability
  - Primary photo designation with clear visual indication
- **Typography:** 
  - Upload instructions: `Body` with encouraging tone
  - Photo labels: `Caption` with edit capability
  - File size/format info: `Body Small` in helpful tone
- **Color Application:**
  - Drop zone: Dashed border in Primary color when active
  - Upload progress: Primary color with percentage indication
  - Photo thumbnails: Subtle border with hover states
- **Interactive Elements:**
  - Drag-and-drop photo upload area
  - File picker button as fallback
  - Photo reordering with drag handles
  - Primary photo selection radio buttons

**Photo Management Specifications:**
- **Upload Processing:**
  - Multiple file selection support
  - Automatic image optimization and resizing
  - Progress indication for each upload
  - Error handling for failed uploads
- **Organization Features:**
  - Drag-to-reorder with visual feedback
  - Primary photo selection with preview
  - Photo deletion with confirmation
  - Batch operations for multiple photos

#### State: Step 3 - Amenities & Features

**Visual Design Specifications:**
- **Layout:** 
  - Categorized amenities in expandable sections
  - Search functionality for quick amenity finding
  - Custom amenity addition with validation
- **Typography:** 
  - Category headers: `H5` with expand/collapse icons
  - Amenity labels: `Body` with clear descriptions
  - Custom amenity input: Standard form field styling
- **Color Application:**
  - Selected amenities: Primary color background/check
  - Category sections: Neutral background with borders
  - Custom amenities: Distinct styling to show user addition
- **Interactive Elements:**
  - Checkbox selection for standard amenities
  - Custom amenity text input with add button
  - Category expansion/collapse functionality
  - Search input with real-time filtering

**Amenity Organization:**
- **Standard Categories:**
  - Kitchen & Dining (dishwasher, microwave, coffee maker)
  - Entertainment (TV, WiFi, streaming services)
  - Comfort (AC, heating, linens)
  - Accessibility (wheelchair accessible, grab bars)
- **Custom Options:**
  - Free text input for unique features
  - Validation to prevent duplicates
  - Character limits with remaining count

#### State: Step 4 - Access & Operations

**Visual Design Specifications:**
- **Layout:** 
  - Secure information sections with encryption indicators
  - Tabbed organization for different access types
  - Special instructions text area with formatting
- **Typography:** 
  - Security notices: `Body Small` with lock icon
  - Access code labels: `Label` with show/hide toggles
  - Instructions: `Body` with formatting preview
- **Color Application:**
  - Security indicators: Success color with lock icons
  - Sensitive fields: Subtle background to indicate protection
  - Show/hide toggles: Neutral with clear active states
- **Interactive Elements:**
  - Password-style inputs with show/hide toggles
  - WiFi password testing functionality
  - Rich text editor for instructions
  - Maintenance mode toggle with scheduling

**Security Specifications:**
- **Data Protection:**
  - Visual encryption indicators for sensitive fields
  - Show/hide toggles for access codes
  - WiFi password validation and testing
- **Access Management:**
  - Multiple access code types (door, WiFi, smart locks)
  - Emergency contact information
  - Staff instruction formatting

### Screen: Apartment Detail View
**Purpose:** Comprehensive apartment information with editing capabilities
**Layout Structure:** Tabbed interface with logical information grouping
**Content Strategy:** Professional presentation suitable for team collaboration

#### State: Overview Tab

**Visual Design Specifications:**
- **Layout:** 
  - Hero image section with photo gallery navigation
  - Key information grid with status indicators
  - Quick action buttons for common tasks
- **Typography:** 
  - Apartment name: `H1` with edit capability
  - Information labels: `Label` with consistent formatting
  - Status indicators: `Body Small` with semantic colors
- **Color Application:**
  - Hero section: Full-width image with overlay text
  - Information grid: Alternating background colors for readability
  - Action buttons: Primary and secondary color scheme
- **Interactive Elements:**
  - Photo gallery with lightbox capability
  - Inline editing for key information
  - Quick action buttons (edit, maintenance, duplicate)
  - Status toggle switches

#### State: Photos Tab

**Visual Design Specifications:**
- **Layout:** 
  - Large photo grid with masonry-style arrangement
  - Photo management toolbar with bulk operations
  - Upload area integrated with existing photos
- **Typography:** 
  - Photo metadata: `Caption` with edit capability
  - Upload instructions: `Body` with helpful tone
- **Color Application:**
  - Selected photos: Primary color borders
  - Upload area: Dashed border with hover states
- **Interactive Elements:**
  - Photo selection with bulk operations
  - Drag-and-drop reordering
  - Primary photo designation
  - Photo editing and replacement

#### State: Access Information Tab

**Visual Design Specifications:**
- **Layout:** 
  - Secure information cards with encryption indicators
  - Access code sections organized by type
  - Emergency information clearly separated
- **Typography:** 
  - Security headers: `H5` with lock icons
  - Access codes: Monospace font for clarity
  - Instructions: `Body` with formatting preservation
- **Color Application:**
  - Security cards: Success color borders with lock icons
  - Show/hide states: Clear visual differentiation
- **Interactive Elements:**
  - Show/hide toggles for sensitive information
  - Copy-to-clipboard functionality
  - Edit mode with save/cancel options

## Quality Assurance Checklist

### Design System Compliance
- [ ] Colors match defined palette with proper contrast ratios
- [ ] Typography follows established hierarchy and scale
- [ ] Spacing uses systematic scale consistently
- [ ] Components match documented specifications
- [ ] Interactive states follow defined patterns

### User Experience Validation
- [ ] Information architecture supports user goals
- [ ] Progressive disclosure reduces cognitive load
- [ ] Error states provide clear guidance
- [ ] Success feedback confirms user actions
- [ ] Loading states maintain engagement

### Accessibility Compliance
- [ ] WCAG AA compliance for all interactions
- [ ] Keyboard navigation complete and logical
- [ ] Screen reader optimization with proper markup
- [ ] Color contrast ratios verified
- [ ] Touch targets meet size requirements

## Related Documentation

- [User Journey Analysis](./user-journey.md) - Complete apartment management flow mapping
- [Interaction Patterns](./interactions.md) - Animation and feedback specifications  
- [Accessibility Considerations](./accessibility.md) - Inclusive design requirements
- [Implementation Guide](./implementation.md) - Technical development requirements