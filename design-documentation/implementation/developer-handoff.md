---
title: Developer Handoff Guide
description: Complete implementation specifications and design tokens for VRBNBXOSS development
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/style-guide.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/assets/design-tokens.json
dependencies:
  - Next.js 14 with TypeScript
  - Tailwind CSS
  - shadcn/ui components
status: draft
---

# Developer Handoff Guide

## Overview

This guide provides **complete implementation specifications** for translating the VRBNBXOSS design system into production-ready code. All design tokens, component props, and integration patterns are documented for seamless development handoff.

## Design Token Implementation

### Tailwind CSS Configuration

**Complete tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // VRBNBXOSS Custom Colors
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Platform Colors
        airbnb: '#ff5a5f',
        vrbo: '#0066cc',
        direct: '#059669',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px/16px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px/20px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px/24px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px/28px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px/28px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px/32px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px/36px
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],  // 36px/44px
        '5xl': ['3rem', { lineHeight: '3.5rem' }],      // 48px/56px
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-4': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-5': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}
```

### CSS Custom Properties

**globals.css (Complete CSS Variables)**
```css
@tailwind base;
@tailwind components; 
@tailwind utilities;

@layer base {
  :root {
    /* shadcn/ui CSS Variables */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;

    /* VRBNBXOSS Custom Properties */
    --header-height: 64px;
    --sidebar-width: 280px;
    --mobile-header-height: 56px;
    --bottom-nav-height: 64px;
    
    /* Animation Variables */
    --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
    --ease-in-out: cubic-bezier(0.4, 0.0, 0.6, 1);
    --ease-in: cubic-bezier(0.4, 0.0, 1, 1);
    --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    
    --duration-micro: 150ms;
    --duration-short: 250ms;
    --duration-medium: 400ms;
    --duration-long: 600ms;
    
    /* Touch Targets */
    --touch-target-min: 44px;
    --touch-target-comfortable: 48px;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Skip link for accessibility */
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
}

/* Component-specific styles */
@layer components {
  /* Dashboard layout */
  .dashboard-layout {
    @apply min-h-screen bg-slate-50;
    padding-top: var(--header-height);
  }
  
  @media (max-width: 1023px) {
    .dashboard-layout {
      padding-top: var(--mobile-header-height);
      padding-bottom: var(--bottom-nav-height);
    }
  }
  
  /* Card components */
  .dashboard-card {
    @apply bg-white border border-slate-200 rounded-lg p-6 shadow-elevation-1 transition-all duration-150;
  }
  
  .dashboard-card:hover {
    @apply border-slate-300 shadow-elevation-2 -translate-y-0.5;
  }
  
  .dashboard-card.interactive:hover {
    @apply border-primary-500;
  }
  
  /* Form components */
  .form-group {
    @apply space-y-2;
  }
  
  .form-label {
    @apply block text-sm font-medium text-slate-700;
  }
  
  .form-input {
    @apply w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150;
  }
  
  .form-input.error {
    @apply border-error-500 focus:border-error-500 focus:ring-error-500;
  }
  
  .form-error {
    @apply text-sm text-error-600 flex items-center gap-1;
  }
  
  .form-help {
    @apply text-sm text-slate-500;
  }
  
  /* Button variants */
  .btn {
    @apply inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none;
  }
  
  .btn-sm {
    @apply text-sm h-8 px-3 gap-1.5;
  }
  
  .btn-md {
    @apply text-sm h-10 px-4 gap-2;
  }
  
  .btn-lg {
    @apply text-base h-12 px-6 gap-2;
  }
  
  .btn-primary {
    @apply btn bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus:ring-primary-500;
  }
  
  .btn-secondary {
    @apply btn bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 focus:ring-primary-500;
  }
  
  .btn-tertiary {
    @apply btn text-primary-600 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-500;
  }
  
  .btn-destructive {
    @apply btn bg-error-600 text-white shadow-sm hover:bg-error-700 focus:ring-error-500;
  }
}
```

## Component Implementation

### Button Component

**Button.tsx - Complete Implementation**
```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // VRBNBXOSS custom variants
        primary: "bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus:ring-primary-500",
        tertiary: "text-primary-600 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // VRBNBXOSS custom sizes  
        xs: "h-8 px-3 text-xs",
        xl: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, icon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={cn(loading && "invisible", "flex items-center gap-2")}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### Input Component

**Input.tsx - Form Input with Validation**
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, startIcon, endIcon, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {props.required && (
              <span className="text-error-600 ml-1" aria-label="required">*</span>
            )}
          </label>
        )}
        
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-500 w-5 h-5">{startIcon}</span>
            </div>
          )}
          
          <input
            type={type}
            id={inputId}
            className={cn(
              "form-input",
              startIcon && "pl-10",
              endIcon && "pr-10",
              error && "border-error-500 focus:border-error-500 focus:ring-error-500",
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(errorId, helperId)}
            {...props}
          />
          
          {endIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-500 w-5 h-5">{endIcon}</span>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ExclamationCircleIcon className="w-5 h-5 text-error-500" />
            </div>
          )}
        </div>
        
        {helperText && !error && (
          <p id={helperId} className="form-help">
            {helperText}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="form-error" role="alert">
            <ExclamationCircleIcon className="w-4 h-4" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
```

### Layout Components

**DashboardLayout.tsx - Main Application Layout**
```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  className 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDesktop } = useBreakpoint();
  const router = useRouter();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [router.pathname, isDesktop]);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    if (!isDesktop && sidebarOpen) {
      const handleClickOutside = () => setSidebarOpen(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDesktop, sidebarOpen]);

  return (
    <div className="dashboard-layout">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      {/* Header */}
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        className="fixed top-0 left-0 right-0 z-40"
      />

      {/* Desktop Sidebar */}
      {isDesktop && (
        <Sidebar className="fixed top-16 left-0 bottom-0 w-70 z-30" />
      )}

      {/* Mobile Sidebar Drawer */}
      {!isDesktop && (
        <>
          <Sidebar
            className={cn(
              "fixed top-0 left-0 bottom-0 w-70 z-50 transform transition-transform duration-300",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClose={() => setSidebarOpen(false)}
            mobile
          />
          
          {/* Mobile backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setSidebarOpen(false)}
          />
        </>
      )}

      {/* Main Content */}
      <main
        id="main-content"
        className={cn(
          "transition-all duration-300",
          isDesktop ? "ml-70" : "ml-0",
          "p-6 pb-20 lg:pb-6", // Extra bottom padding for mobile nav
          className
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <MobileNavigation className="fixed bottom-0 left-0 right-0 z-40" />
      )}
    </div>
  );
};
```

### Utility Functions

**lib/utils.ts - Essential Utilities**
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatCurrency(
  amount: number, 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Accessibility helpers
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleTab);
  
  // Focus first element
  firstFocusable?.focus();
  
  // Return cleanup function
  return () => element.removeEventListener('keydown', handleTab);
}
```

## React Hooks

### Custom Hooks for VRBNBXOSS

**hooks/useBreakpoint.ts - Responsive Design Hook**
```typescript
import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  current: Breakpoint;
}

export function useBreakpoint(): BreakpointState {
  const [breakpoint, setBreakpoint] = useState<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWide: false,
    current: 'lg'
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      let current: Breakpoint;
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;
      let isWide = false;

      if (width < 640) {
        current = 'sm';
        isMobile = true;
      } else if (width < 768) {
        current = 'md';
        isMobile = true;
      } else if (width < 1024) {
        current = 'lg';
        isTablet = true;
      } else if (width < 1280) {
        current = 'xl';
        isDesktop = true;
      } else {
        current = '2xl';
        isWide = true;
        isDesktop = true;
      }

      setBreakpoint({
        isMobile,
        isTablet,
        isDesktop: isDesktop || isWide,
        isWide,
        current
      });
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}
```

**hooks/useLocalStorage.ts - Persistent State Hook**
```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

**hooks/useDebounce.ts - Performance Optimization Hook**
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

## TypeScript Interfaces

### Core Data Types

**types/index.ts - Primary Data Models**
```typescript
// User and Authentication
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'owner' | 'cleaner' | 'admin';
  timezone: string;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  notifications: NotificationSettings;
  display: DisplaySettings;
  integrations: IntegrationSettings;
}

// Property Management
export interface Apartment {
  id: string;
  ownerId: string;
  name: string;
  address: Address;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photos: string[];
  accessCodes: AccessCodes;
  status: 'active' | 'maintenance' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AccessCodes {
  wifi: {
    network: string;
    password: string;
  };
  door: string;
  building?: string;
  notes?: string;
}

// Reservations
export interface Reservation {
  id: string;
  apartmentId: string;
  ownerId: string;
  guestId: string;
  platform: 'airbnb' | 'vrbo' | 'direct';
  checkIn: string; // ISO date string
  checkOut: string; // ISO date string
  guestCount: number;
  totalPrice: number;
  status: ReservationStatus;
  platformReservationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  apartment?: Apartment;
  guest?: Guest;
}

export type ReservationStatus = 
  | 'draft' 
  | 'pending' 
  | 'confirmed' 
  | 'checked_in' 
  | 'checked_out' 
  | 'cancelled' 
  | 'archived';

export interface Guest {
  id: string;
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  idDocument?: string; // encrypted
  address?: Address;
  createdAt: string;
  updatedAt: string;
}

// Cleaning
export interface Cleaner {
  id: string;
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  rate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cleaning {
  id: string;
  apartmentId: string;
  cleanerId?: string;
  reservationId?: string;
  scheduledDate: string; // ISO datetime string
  duration?: string; // ISO duration
  status: CleaningStatus;
  instructions?: string;
  supplies?: string[];
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  apartment?: Apartment;
  cleaner?: Cleaner;
  reservation?: Reservation;
}

export type CleaningStatus = 
  | 'needed' 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'verified' 
  | 'cancelled';

// UI State
export interface DashboardMetrics {
  occupancyRate: number;
  totalRevenue: number;
  activeReservations: number;
  upcomingCheckouts: number;
  upcomingCheckins: number;
  pendingCleanings: number;
  revenueChange: number;
  occupancyChange: number;
}

export interface TodaysEvent {
  id: string;
  type: 'checkin' | 'checkout' | 'cleaning';
  time: string;
  apartmentId: string;
  apartmentName: string;
  guestName?: string;
  status: string;
}

// Form State
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
}

export interface FormState<T> {
  [K in keyof T]: FormField<T[K]>;
}

// API Responses
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Component Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string | number;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  sorting?: {
    key: string;
    direction: 'asc' | 'desc';
    onChange: (key: string, direction: 'asc' | 'desc') => void;
  };
}
```

## Performance Optimization

### Code Splitting Strategy

**next.config.js - Optimized Configuration**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Bundle analyzer
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },
  
  // Image optimization
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Create vendor chunk for stable libraries
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Create chunk for shared UI components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
```

### Component Lazy Loading

**Dynamic Imports for Feature Components**
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const CalendarView = dynamic(() => import('@/components/calendar/CalendarView'), {
  loading: () => <CalendarSkeleton />,
  ssr: false, // Calendar doesn't need SSR
});

const StatisticsCharts = dynamic(() => import('@/components/charts/StatisticsCharts'), {
  loading: () => <ChartsSkeleton />,
});

const ReservationForm = dynamic(() => import('@/components/forms/ReservationForm'), {
  loading: () => <FormSkeleton />,
});

// Usage in pages
export default function CalendarPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarView />
      </Suspense>
    </DashboardLayout>
  );
}
```

## Testing Integration

### Jest Configuration

**jest.config.js - Testing Setup**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
};
```

**jest.setup.js - Testing Environment**
```javascript
import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    push: jest.fn(),
  }),
}));

// Setup MSW for API mocking
const server = setupServer(
  rest.get('/api/dashboard/metrics', (req, res, ctx) => {
    return res(ctx.json({
      occupancyRate: 85,
      totalRevenue: 12500,
      activeReservations: 15,
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Accessibility Testing

**tests/accessibility.test.tsx - Automated A11y Tests**
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

expect.extend(toHaveNoViolations);

describe('Component Accessibility', () => {
  test('Button component should be accessible', async () => {
    const { container } = render(
      <Button variant="primary">Save Changes</Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('Input component should be accessible', async () => {
    const { container } = render(
      <Input
        label="Guest Name"
        placeholder="Enter guest name"
        error="This field is required"
        required
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

*This developer handoff guide provides all necessary implementation details for translating the VRBNBXOSS design system into production-ready code with optimal performance, accessibility, and maintainability.*