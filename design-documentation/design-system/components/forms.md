---
title: Form System
description: Comprehensive form component specifications and input patterns for VRBNBXOSS
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/components/buttons.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/colors.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/accessibility/guidelines.md
status: draft
---

# Form System

## Overview

Forms in VRBNBXOSS facilitate **efficient data collection and editing** for property management workflows. Our form system emphasizes clarity, validation feedback, and streamlined user experience across all property management tasks.

## Form Design Principles

1. **Progressive Disclosure**: Show relevant fields based on context and selections
2. **Clear Validation**: Immediate, helpful feedback for user input
3. **Logical Grouping**: Related fields organized into coherent sections
4. **Efficient Workflow**: Minimize friction in frequent data entry tasks
5. **Accessible Input**: Full keyboard navigation and screen reader support

## Input Field Components

### Text Input

**Base Text Field**
```css
.form-input {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 20px;
  color: #334155;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

/* Focus State */
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Error State */
.form-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Success State */
.form-input.success {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* Disabled State */
.form-input:disabled {
  background-color: #f8fafc;
  border-color: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}
```

**Input Sizes**
```css
/* Small Input */
.form-input-sm {
  height: 32px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 16px;
}

/* Medium Input (Default) */
.form-input-md {
  height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 20px;
}

/* Large Input */
.form-input-lg {
  height: 48px;
  padding: 12px 16px;
  font-size: 16px;
  line-height: 24px;
}
```

### Text Area

**Multi-line Text Input**
```css
.form-textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 20px;
  color: #334155;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  resize: vertical;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

**Usage**: Apartment descriptions, cleaning instructions, guest notes

### Select Dropdown

**Single Select**
```css
.form-select {
  width: 100%;
  height: 40px;
  padding: 8px 32px 8px 12px;
  font-size: 14px;
  line-height: 20px;
  color: #334155;
  background-color: white;
  background-image: url("data:image/svg+xml,..."); /* Chevron down icon */
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  appearance: none;
  cursor: pointer;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

**Usage**: Platform selection, cleaner assignment, apartment selection

### Multi-Select with Tags

**Tag-based Multi-Selection**
```css
.form-multiselect {
  min-height: 40px;
  padding: 4px 8px;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.multiselect-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  background-color: #eff6ff;
  color: #1d4ed8;
  border-radius: 4px;
  gap: 4px;
}

.multiselect-tag button {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 2px;
}
```

**Usage**: Apartment amenities, guest requirements, cleaning supplies

### Date & Time Inputs

**Date Input**
```css
.form-date {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  color: #334155;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

/* Custom date picker styling */
.form-date::-webkit-calendar-picker-indicator {
  background-image: url("data:image/svg+xml,..."); /* Calendar icon */
  cursor: pointer;
}
```

**Date Range Input**
```css
.form-daterange {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.daterange-separator {
  color: #64748b;
  font-size: 14px;
  white-space: nowrap;
}
```

**Usage**: Check-in/check-out dates, cleaning schedules, availability periods

### Checkbox & Radio Components

**Checkbox**
```css
.form-checkbox {
  width: 16px;
  height: 16px;
  color: #3b82f6;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.form-checkbox:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
  background-image: url("data:image/svg+xml,..."); /* Checkmark */
}

.form-checkbox:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Checkbox with label */
.checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.checkbox-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
}
```

**Radio Button**
```css
.form-radio {
  width: 16px;
  height: 16px;
  color: #3b82f6;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.form-radio:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
  background-image: url("data:image/svg+xml,..."); /* Radio dot */
}
```

**Usage**: Platform selection, apartment status, cleaning priority levels

### Toggle Switch

**Switch Component**
```css
.form-switch {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 24px;
  background-color: #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 150ms ease-out;
}

.form-switch:checked {
  background-color: #3b82f6;
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 150ms ease-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-switch:checked .switch-thumb {
  transform: translateX(20px);
}
```

**Usage**: Feature toggles, availability status, notification preferences

## Form Validation System

### Validation States

**Success State**
```css
.form-group.success .form-input {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.form-group.success .field-message {
  color: #16a34a;
}
```

**Error State**
```css
.form-group.error .form-input {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-group.error .field-message {
  color: #dc2626;
}

.form-group.error .form-label {
  color: #dc2626;
}
```

**Warning State**
```css
.form-group.warning .form-input {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.form-group.warning .field-message {
  color: #d97706;
}
```

### Validation Messages

**Message Styling**
```css
.field-message {
  margin-top: 4px;
  font-size: 12px;
  line-height: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-message.error {
  color: #dc2626;
}

.field-message.success {
  color: #16a34a;
}

.field-message.warning {
  color: #d97706;
}

.field-message.info {
  color: #0284c7;
}
```

**Validation Examples**
- **Required Field**: "This field is required"
- **Email Format**: "Please enter a valid email address"  
- **Date Range**: "Check-out date must be after check-in date"
- **Capacity**: "Guest count cannot exceed apartment capacity"
- **Availability**: "Dates conflict with existing reservation"

### Real-Time Validation

**Progressive Enhancement**
```javascript
// Validation timing
const validationTiming = {
  onBlur: ['email', 'phone', 'required'], // Validate when field loses focus
  onChange: ['passwords', 'dates', 'numbers'], // Validate as user types
  onSubmit: ['all'] // Final validation before submission
};
```

## Form Layout Patterns

### Single Column Form
**Usage**: Simple forms, mobile interfaces, focused workflows

```css
.form-single-column {
  max-width: 400px;
  margin: 0 auto;
}

.form-single-column .form-group {
  margin-bottom: 20px;
}
```

### Two Column Form
**Usage**: Desktop forms, related field pairs, balanced layouts

```css
.form-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 767px) {
  .form-two-column {
    grid-template-columns: 1fr;
  }
}
```

### Section-Based Form
**Usage**: Complex forms, logical grouping, wizard-style interfaces

```css
.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.form-section-title {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}
```

### Inline Form
**Usage**: Filters, search interfaces, compact data entry

```css
.form-inline {
  display: flex;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
}

.form-inline .form-group {
  margin-bottom: 0;
  min-width: 0;
}
```

## Specialized Form Components

### File Upload

**Single File Upload**
```css
.file-upload {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 24px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  background-color: #f8fafc;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.file-upload:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.file-upload.dragover {
  border-color: #3b82f6;
  background-color: #dbeafe;
}
```

**Multi-File Upload with Preview**
```css
.file-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.file-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Usage**: Apartment photos, contract documents, identification uploads

### Search Input with Suggestions

**Searchable Input**
```css
.search-input {
  position: relative;
}

.search-input .form-input {
  padding-left: 36px;
  background-image: url("data:image/svg+xml,..."); /* Search icon */
  background-position: 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-top: none;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.search-suggestion {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
}

.search-suggestion:hover,
.search-suggestion.highlighted {
  background-color: #eff6ff;
}
```

**Usage**: Guest search, apartment lookup, cleaner selection

## Form Accessibility

### Screen Reader Support

**Proper Labeling**
```html
<!-- Explicit labels -->
<label for="guest-name" className="form-label">Guest Name</label>
<input id="guest-name" className="form-input" type="text" />

<!-- Required field indication -->
<label for="check-in" className="form-label">
  Check-in Date
  <span className="text-error-600" aria-label="required">*</span>
</label>

<!-- Help text association -->
<label for="apartment-code" className="form-label">Apartment Code</label>
<input 
  id="apartment-code" 
  className="form-input" 
  aria-describedby="code-help"
  type="text" 
/>
<div id="code-help" className="field-help">
  Use building abbreviation + unit number (e.g., MB-101)
</div>
```

### Keyboard Navigation

**Tab Order Management**
```css
/* Skip to main content */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* Focus management within forms */
.form-group:focus-within .form-label {
  color: #3b82f6;
}
```

### Error Announcement

**Accessible Error Messaging**
```html
<!-- Error summary for forms -->
<div role="alert" aria-live="polite" className="error-summary">
  <h3>Please fix the following errors:</h3>
  <ul>
    <li><a href="#guest-name">Guest name is required</a></li>
    <li><a href="#check-in">Check-in date must be in the future</a></li>
  </ul>
</div>

<!-- Individual field errors -->
<div className="form-group error">
  <label for="guest-email" className="form-label">Guest Email</label>
  <input 
    id="guest-email" 
    className="form-input error"
    aria-invalid="true"
    aria-describedby="email-error"
    type="email" 
  />
  <div id="email-error" className="field-message error" role="alert">
    Please enter a valid email address
  </div>
</div>
```

## React Implementation

### Base Input Component
```jsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({
  label,
  error,
  success,
  warning,
  helperText,
  size = 'md',
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const helperTextId = helperText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base'
  };
  
  const stateClasses = {
    default: 'border-slate-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
    success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
    warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500'
  };
  
  const state = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default';
  
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset transition-colors focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
          sizeClasses[size],
          stateClasses[state],
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={clsx(
          helperTextId,
          errorId
        )}
        {...props}
      />
      
      {helperText && (
        <p id={helperTextId} className="field-help mt-1 text-xs text-slate-600">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="field-message error mt-1 text-xs text-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
```

### Form Validation Hook
```jsx
import { useState, useCallback } from 'react';

const useFormValidation = (validationSchema) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validateField = useCallback((name, value) => {
    const fieldSchema = validationSchema[name];
    if (!fieldSchema) return '';
    
    for (const rule of fieldSchema) {
      const error = rule.validate(value);
      if (error) return error;
    }
    
    return '';
  }, [validationSchema]);
  
  const validateForm = useCallback((values) => {
    const newErrors = {};
    
    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) newErrors[fieldName] = error;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField, validationSchema]);
  
  const handleBlur = useCallback((name, value) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);
  
  return {
    errors,
    touched,
    validateForm,
    handleBlur,
    setErrors,
    setTouched
  };
};

export default useFormValidation;
```

## Usage Examples

### Reservation Form
```jsx
const ReservationForm = () => {
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    apartmentId: '',
    checkIn: '',
    checkOut: '',
    guestCount: 1,
    platform: 'direct'
  });
  
  return (
    <form className="form-two-column">
      <div className="form-section">
        <h3 className="form-section-title">Guest Information</h3>
        <Input
          label="Guest Name"
          value={formData.guestName}
          onChange={(e) => setFormData({...formData, guestName: e.target.value})}
          required
        />
        <Input
          label="Email Address"
          type="email"
          value={formData.guestEmail}
          onChange={(e) => setFormData({...formData, guestEmail: e.target.value})}
        />
      </div>
      
      <div className="form-section">
        <h3 className="form-section-title">Booking Details</h3>
        <Select
          label="Apartment"
          value={formData.apartmentId}
          onChange={(value) => setFormData({...formData, apartmentId: value})}
          options={apartmentOptions}
          required
        />
        <DateRangeInput
          label="Stay Dates"
          startDate={formData.checkIn}
          endDate={formData.checkOut}
          onChange={({startDate, endDate}) => 
            setFormData({...formData, checkIn: startDate, checkOut: endDate})
          }
          required
        />
      </div>
    </form>
  );
};
```

---

*This form system provides comprehensive, accessible, and efficient data collection patterns for all VRBNBXOSS workflows. Consistent implementation ensures reliable user experiences across property management tasks.*