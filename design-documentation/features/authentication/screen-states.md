---
title: Authentication - Screen States & Specifications
description: Detailed screen-by-screen specifications for all authentication interface states
feature: Authentication & User Management
last-updated: 2025-01-22
version: 1.0
related-files: 
  - README.md
  - user-journey.md
  - interactions.md
dependencies:
  - Design system color palette
  - Typography specifications
  - Component library
status: approved
---

# Authentication - Screen States & Specifications

## Screen-by-Screen Specifications

### Screen: Login Page
**Purpose:** Enable returning users to authenticate and access their dashboard
**Layout Structure:** Centered card layout with responsive container (max-width: 400px)
**Content Strategy:** Minimal cognitive load with clear hierarchy and trusted visual indicators

#### State: Default Login

**Visual Design Specifications:**
- **Layout:** 
  - Centered card with `padding: 2xl (32px)` on desktop, `lg (24px)` on mobile
  - Card background: `Neutral-50` with `border-radius: md (8px)`
  - Subtle shadow: `shadow-md` for depth
- **Typography:** 
  - Header: `H2` - "Sign in to your account"
  - Field labels: `Label` - proper form associations
  - Helper text: `Body Small` in `Neutral-600`
  - Link text: `Body` with `Primary` color
- **Color Application:**
  - Primary button: `Primary` background with white text
  - Input borders: `Neutral-300` default, `Primary` on focus
  - Social buttons: White background with branded colors
  - Error text: `Error` color with appropriate contrast
- **Interactive Elements:**
  - Email input field with proper validation styling
  - Password input with show/hide toggle
  - "Sign In" button with loading states
  - Social login buttons (Google, Facebook)
  - "Forgot password?" and "Create account" links
- **Visual Hierarchy:** 
  - Header text prominent but not overwhelming
  - Login form centrally positioned
  - Social options clearly separated but accessible
  - Helper links subtle but discoverable
- **Whitespace Usage:**
  - `md (16px)` between form elements
  - `lg (24px)` between sections
  - `xl (32px)` around card edges

**Interaction Design Specifications:**
- **Primary Actions:**
  - **Sign In Button:**
    - Default: `Primary` background, white text, `height: 44px`
    - Hover: `Primary Dark` background with `transition: 200ms ease`
    - Active: `Primary Dark` with `transform: scale(0.98)`
    - Focus: `2px solid Primary` outline with `4px` offset
    - Disabled: `Neutral-300` background, `Neutral-500` text
    - Loading: Spinner with "Signing in..." text
- **Secondary Actions:**
  - **Social Login Buttons:**
    - Google: White background, Google logo, "Continue with Google"
    - Facebook: Facebook blue background, white text and logo
    - Height: `44px`, proper touch targets
    - Hover: Subtle shadow increase
    - Focus: Brand-appropriate focus outline
- **Form Interactions:**
  - **Email Input:**
    - Validation: Real-time email format validation
    - Error state: Red border, error icon, helpful message
    - Success state: Green border, checkmark icon
    - Autocomplete: Support email autocomplete attribute
  - **Password Input:**
    - Show/hide toggle with eye icon
    - Validation: Required field validation
    - Error handling: Clear, actionable error messages
- **Navigation Elements:**
  - "Forgot password?" link with hover underline
  - "Create account" link with Primary color
  - Both links keyboard accessible with proper focus states
- **Keyboard Navigation:**
  - Logical tab order: Email → Password → Sign In → Social buttons → Links
  - Enter key submits form from any field
  - Escape key clears current field focus
- **Touch Interactions:**
  - All interactive elements minimum 44×44px
  - Touch feedback with subtle scale animation
  - Proper spacing prevents accidental taps

**Animation & Motion Specifications:**
- **Entry Animations:**
  - Card fades in with `opacity: 0 → 1` over `400ms ease-out`
  - Form elements slide up slightly with `transform: translateY(20px → 0)`
- **State Transitions:**
  - Button state changes with `200ms ease` transitions
  - Input focus transitions with `150ms ease` for border color
  - Error messages slide down with `300ms ease-out`
- **Loading Animations:**
  - Button spinner rotates continuously
  - Social login buttons show loading overlay
  - Form submission shows progress indication
- **Micro-interactions:**
  - Password visibility toggle with smooth icon transition
  - Input validation checkmarks with scale animation
  - Link hover effects with smooth color transitions

**Responsive Design Specifications:**
- **Mobile (320-767px):**
  - Card width: `calc(100vw - 32px)` with `16px` margins
  - Font sizes: Slightly smaller header, same body text
  - Touch targets: Verified 44×44px minimum
  - Social buttons: Full width with appropriate spacing
- **Tablet (768-1023px):**
  - Card max-width: `400px` centered
  - Standard desktop typography scale
  - Enhanced hover states for pointer devices
- **Desktop (1024-1439px):**
  - Full hover and focus interactions
  - Keyboard shortcuts visible
  - Enhanced visual feedback for all states
- **Wide (1440px+):**
  - Card positioning optimized for large screens
  - Typography scale appropriate for viewing distance

**Accessibility Specifications:**
- **Screen Reader Support:**
  - Form properly labeled with associated labels
  - Error messages announced when they appear
  - Loading states communicated to assistive technology
  - Social login buttons have descriptive accessible names
- **Keyboard Navigation:**
  - All elements reachable via keyboard
  - Focus indicators clearly visible (3:1 contrast minimum)
  - Logical tab order maintained
  - Skip links available for screen reader users
- **Color Contrast:**
  - All text meets WCAG AA (4.5:1) or AAA (7:1) standards
  - Error states maintain sufficient contrast
  - Focus indicators clearly visible
- **Touch Targets:**
  - All interactive elements minimum 44×44px
  - Adequate spacing between touch targets
- **Motion Sensitivity:**
  - Respects `prefers-reduced-motion` user setting
  - Essential animations only when motion reduced
- **Cognitive Load:**
  - Clear, single-purpose page with minimal distractions
  - Progressive disclosure of complexity
  - Consistent layout patterns

#### State: Loading (Form Submission)

**Visual Design Specifications:**
- **Layout:** Same as default with overlay loading state
- **Loading Indicators:**
  - Sign In button shows spinner and "Signing in..." text
  - Form becomes non-interactive with subtle opacity reduction
  - Loading overlay with professional spinner animation
- **Typography:** Button text changes to loading message
- **Color Application:** Disabled form styling while maintaining readability

**Interaction Design Specifications:**
- **Disabled Interactions:** All form elements become non-interactive
- **Loading Feedback:** Clear spinner with descriptive text
- **Timeout Handling:** Error message after 30 seconds if no response
- **Cancel Option:** Ability to cancel authentication attempt

#### State: Error (Authentication Failed)

**Visual Design Specifications:**
- **Layout:** Error message appears above form
- **Error Styling:** 
  - Red border on relevant input fields
  - Error icon with message
  - Error background: `Error Light` with `Error` text
- **Typography:** Error message in `Body Small` with `Error` color
- **Color Application:** Error semantic colors with proper contrast

**Interaction Design Specifications:**
- **Error Recovery:** Clear, actionable error messages
- **Field Focus:** Auto-focus on field needing correction
- **Retry Mechanism:** Easy way to attempt authentication again
- **Alternative Options:** Password reset link prominently displayed

### Screen: Registration Page
**Purpose:** Enable new users to create accounts and join the platform
**Layout Structure:** Similar to login with additional form fields
**Content Strategy:** Build trust while collecting necessary information

#### State: Default Registration

**Visual Design Specifications:**
- **Layout:** 
  - Expanded card layout with proper spacing
  - Progressive disclosure for complex requirements
  - Clear section separation between basic info and authentication
- **Typography:**
  - Header: `H2` - "Create your account"
  - Field requirements shown clearly in `Body Small`
  - Password requirements list in helpful format
- **Color Application:**
  - Consistent with login page
  - Password strength indicator with color progression
  - Required field indicators in semantic colors
- **Interactive Elements:**
  - Full name input field
  - Email input with validation
  - Password field with strength indicator
  - Confirm password field with matching validation
  - "Create Account" primary button
  - Social registration options
  - Terms acceptance checkbox
- **Visual Hierarchy:**
  - Registration form prominently positioned
  - Password requirements clearly visible
  - Legal text appropriately subtle but readable
- **Whitespace Usage:**
  - Consistent spacing with login page
  - Additional space for password requirements
  - Proper separation of legal text

**Interaction Design Specifications:**
- **Primary Actions:**
  - **Create Account Button:**
    - Same styling as Sign In but with "Create Account" text
    - Disabled until all validation passes
    - Loading state with "Creating account..." text
- **Form Interactions:**
  - **Full Name Field:**
    - Required field validation
    - Character limit: 100 characters
    - Real-time validation with helpful feedback
  - **Email Field:**
    - Format validation with immediate feedback
    - Duplicate email checking with helpful recovery
    - Autocomplete support
  - **Password Fields:**
    - Real-time strength indicator
    - Requirements checklist that updates as user types
    - Confirmation field matches primary password
    - Show/hide toggle for both fields
  - **Terms Checkbox:**
    - Required for registration
    - Links to terms and privacy policy
    - Clear labeling and accessible interaction
- **Progressive Disclosure:**
  - Password requirements shown on focus
  - Email verification information revealed after submission
  - Profile enhancement offered post-registration

#### State: Success (Account Created)

**Visual Design Specifications:**
- **Layout:** Success message with clear next steps
- **Success Styling:**
  - Checkmark icon with success color
  - Success background: `Success Light` with `Success` text
- **Typography:** Congratulatory header with clear instructions
- **Color Application:** Success semantic colors throughout

**Interaction Design Specifications:**
- **Next Steps:** Clear path to email verification
- **Alternative Actions:** Option to skip verification temporarily
- **Support Information:** Contact details if verification issues occur

### Screen: Password Reset
**Purpose:** Enable users to securely reset forgotten passwords
**Layout Structure:** Simplified form focused on email input
**Content Strategy:** Reassuring tone with clear recovery process

#### State: Default Password Reset

**Visual Design Specifications:**
- **Layout:** Minimal form with email input only
- **Typography:**
  - Header: `H2` - "Reset your password"
  - Instructions: `Body` with reassuring tone
- **Color Application:** Consistent with other authentication pages
- **Interactive Elements:**
  - Email input field
  - "Send Reset Link" button
  - "Back to Sign In" link

**Interaction Design Specifications:**
- **Primary Action:** Send reset email with proper validation
- **Email Verification:** Confirm email exists in system
- **Clear Instructions:** Explain what user should expect
- **Timeout Protection:** Rate limiting with clear messaging

#### State: Email Sent

**Visual Design Specifications:**
- **Layout:** Confirmation message with email sent indicator
- **Success Elements:** Email icon with confirmation text
- **Typography:** Clear instructions for next steps
- **Color Application:** Success colors for positive confirmation

**Interaction Design Specifications:**
- **Resend Option:** Available after reasonable timeout
- **Support Contact:** Help option if email not received
- **Return Navigation:** Easy path back to login

### Screen: Profile Setup (Post-Registration)
**Purpose:** Collect additional user information to enhance experience
**Layout Structure:** Progressive form with optional enhancements
**Content Strategy:** Value-focused optional improvements

#### State: Default Profile Setup

**Visual Design Specifications:**
- **Layout:** Clean form with clear progress indicator
- **Typography:**
  - Header: `H2` - "Complete your profile"
  - Helper text explaining benefits of each field
- **Color Application:** Consistent branding with optional field styling
- **Interactive Elements:**
  - Timezone selector
  - Phone number input (optional)
  - Profile photo upload
  - Notification preferences
  - "Complete Setup" button
  - "Skip for now" option

**Interaction Design Specifications:**
- **Optional Fields:** Clear indication of what's required vs. optional
- **Photo Upload:** Drag-and-drop with file picker fallback
- **Timezone Detection:** Automatic detection with manual override
- **Skip Option:** Easy path to dashboard without completing profile

## Technical Implementation Guidelines

### State Management Requirements
- **Form Validation:** Real-time validation with debounced API calls
- **Error Handling:** Comprehensive error boundary implementation
- **Session Management:** Secure token handling with automatic refresh
- **Social Integration:** Proper OAuth flow handling with error recovery

### Performance Targets
- **Initial Load:** <2 seconds for authentication pages
- **Form Submission:** <500ms for validation feedback
- **Social Login:** <3 seconds for OAuth roundtrip
- **Error Recovery:** <200ms for client-side validation

### API Integration Points
- **Supabase Auth:** Direct integration with auth service
- **Email Service:** Reliable email delivery for verification
- **Profile Updates:** Real-time sync with user profile data
- **Security Events:** Logging and monitoring for audit trail

### Browser/Platform Support
- **Cross-Browser:** Works consistently across all modern browsers
- **Mobile Responsive:** Optimized for touch interaction
- **Progressive Enhancement:** Works without JavaScript for basic functionality
- **Offline Support:** Proper offline handling and error messaging

## Quality Assurance Checklist

### Design System Compliance
- [ ] Colors match defined palette with proper contrast ratios
- [ ] Typography follows established hierarchy and scale
- [ ] Spacing uses systematic scale consistently
- [ ] Components match documented specifications
- [ ] Motion follows timing and easing standards

### User Experience Validation
- [ ] User goals clearly supported throughout authentication flow
- [ ] Navigation intuitive and follows established web patterns
- [ ] Error states provide clear guidance and recovery paths
- [ ] Loading states communicate progress and maintain engagement
- [ ] Success states provide clear confirmation and next steps

### Accessibility Compliance
- [ ] WCAG AA compliance verified for all authentication interactions
- [ ] Keyboard navigation complete and logical throughout
- [ ] Screen reader experience optimized with proper semantic markup
- [ ] Color contrast ratios verified (4.5:1 normal, 3:1 large text)
- [ ] Touch targets meet minimum size requirements (44×44px)
- [ ] Focus indicators visible and consistent throughout
- [ ] Motion respects user preferences for reduced animation

### Technical Implementation
- [ ] Form validation handles all edge cases properly
- [ ] Social login integration works reliably
- [ ] Session management secure and persistent
- [ ] Performance targets met across all devices
- [ ] Error handling comprehensive and user-friendly

## Related Documentation

- [User Journey Analysis](./user-journey.md) - Complete authentication flow mapping
- [Interaction Patterns](./interactions.md) - Animation and feedback specifications  
- [Accessibility Considerations](./accessibility.md) - Inclusive design requirements
- [Implementation Guide](./implementation.md) - Technical development requirements
- [Design System Components](../../design-system/components/) - Component specifications