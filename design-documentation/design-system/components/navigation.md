---
title: Navigation System
description: Comprehensive navigation components and wayfinding patterns for VRBNBXOSS
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/components/buttons.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/colors.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/tokens/spacing.md
status: draft
---

# Navigation System

## Overview

Navigation in VRBNBXOSS provides **intuitive wayfinding and efficient task switching** for property management workflows. Our navigation system emphasizes discoverability, consistency, and rapid access to frequently-used features.

## Navigation Hierarchy

### Primary Navigation
**Purpose**: Main application sections and core functionality  
**Location**: Sidebar (desktop), bottom navigation (mobile)  
**Contents**: Dashboard, Calendar, Reservations, Apartments, Cleaning, Statistics

### Secondary Navigation  
**Purpose**: Sub-sections within primary areas  
**Location**: Page headers, tab controls, section filters  
**Contents**: View options, filters, action menus

### Contextual Navigation
**Purpose**: Task-specific actions and related content  
**Location**: Content areas, modal headers, inline actions  
**Contents**: Edit/delete actions, related records, quick actions

## Header Navigation

### Desktop Header

**Structure & Layout**
```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  z-index: 40;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.header-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: flex-end;
}
```

**Logo & Brand**
```css
.brand-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  text-decoration: none;
}

.brand-logo:hover {
  color: #3b82f6;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}
```

**Global Search**
```css
.global-search {
  position: relative;
  max-width: 400px;
  width: 100%;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 36px;
  font-size: 14px;
  background-color: #f8fafc;
  border: 1px solid transparent;
  border-radius: 18px;
  transition: all 150ms ease-out;
}

.search-input:focus {
  background-color: white;
  border-color: #cbd5e1;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #64748b;
}
```

**Header Actions**
```css
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.header-button:hover {
  background-color: #f1f5f9;
  color: #374151;
}

.header-button.active {
  background-color: #eff6ff;
  color: #3b82f6;
}
```

### Mobile Header

**Responsive Header**
```css
@media (max-width: 1023px) {
  .header {
    height: 56px;
    padding: 0 16px;
  }
  
  .header-center {
    display: none; /* Hide search on mobile */
  }
  
  .mobile-menu-button {
    display: flex;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #374151;
  }
}
```

## Sidebar Navigation

### Desktop Sidebar

**Sidebar Structure**
```css
.sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 280px;
  background-color: white;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  z-index: 30;
}

.sidebar-content {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-nav {
  flex: 1;
  padding: 0 16px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #f1f5f9;
  margin-top: auto;
}
```

**Navigation Items**
```css
.nav-section {
  margin-bottom: 24px;
}

.nav-section-title {
  padding: 0 12px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 2px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  border-radius: 6px;
  transition: all 150ms ease-out;
  gap: 10px;
}

.nav-item:hover {
  background-color: #f1f5f9;
  color: #1f2937;
}

.nav-item.active {
  background-color: #eff6ff;
  color: #3b82f6;
}

.nav-item.active .nav-icon {
  color: #3b82f6;
}

.nav-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
  flex-shrink: 0;
}

.nav-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  padding: 0 6px;
}
```

**Collapsible Sections**
```css
.nav-collapsible {
  margin-bottom: 16px;
}

.nav-collapsible-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  text-align: left;
  border-radius: 6px;
  cursor: pointer;
  gap: 8px;
}

.nav-collapsible-trigger:hover {
  background-color: #f1f5f9;
}

.nav-collapsible-content {
  margin-left: 16px;
  margin-top: 4px;
}

.nav-collapsible-content .nav-item {
  font-size: 13px;
  padding: 6px 12px;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  margin-left: auto;
  transition: transform 150ms ease-out;
}

.nav-collapsible.expanded .chevron-icon {
  transform: rotate(90deg);
}
```

### Mobile Navigation

**Bottom Navigation**
```css
@media (max-width: 1023px) {
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background-color: white;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 8px;
    z-index: 40;
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 500;
    color: #6b7280;
    text-decoration: none;
    border-radius: 8px;
    gap: 2px;
    transition: color 150ms ease-out;
  }
  
  .bottom-nav-item.active {
    color: #3b82f6;
  }
  
  .bottom-nav-icon {
    width: 24px;
    height: 24px;
  }
}
```

**Mobile Drawer Menu**
```css
.mobile-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background-color: white;
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
  z-index: 50;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.mobile-drawer.open {
  transform: translateX(0);
}

.mobile-drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all 300ms ease-out;
  z-index: 45;
}

.mobile-drawer.open ~ .mobile-drawer-backdrop {
  opacity: 1;
  visibility: visible;
}
```

## Breadcrumb Navigation

### Breadcrumb Component

**Breadcrumb Structure**
```css
.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-link {
  color: #6b7280;
  text-decoration: none;
  transition: color 150ms ease-out;
}

.breadcrumb-link:hover {
  color: #3b82f6;
}

.breadcrumb-current {
  color: #1f2937;
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #d1d5db;
}
```

**Usage Examples**
- Dashboard → Calendar → March 2025
- Apartments → Pacific Heights Unit → Edit Details
- Reservations → Booking #1234 → Guest Information

## Tab Navigation

### Tab Component

**Tab Structure**
```css
.tabs {
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.tab-list {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-list::-webkit-scrollbar {
  display: none;
}

.tab-button {
  position: relative;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms ease-out;
}

.tab-button:hover {
  color: #374151;
  border-bottom-color: #d1d5db;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}
```

**Tab with Icons**
```css
.tab-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.tab-badge {
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 9px;
  padding: 0 4px;
  margin-left: 4px;
}
```

**Usage Examples**
- Apartment Details: Overview | Photos | Amenities | Reviews
- Reservation Management: Details | Guest | Payment | History
- Calendar Views: Month | Week | Day | List

## Pagination

### Pagination Component

**Pagination Structure**
```css
.pagination {
  display: flex;
  align-items: center;
  justify-content: between;
  gap: 16px;
  margin-top: 24px;
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.pagination-button.active {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-ellipsis {
  padding: 0 8px;
  color: #9ca3af;
  font-size: 14px;
}
```

**Simplified Mobile Pagination**
```css
@media (max-width: 767px) {
  .pagination-controls {
    gap: 8px;
  }
  
  .pagination-pages {
    display: none;
  }
  
  .pagination-mobile {
    display: flex;
    gap: 8px;
  }
}
```

## User Menu

### Profile Dropdown

**Profile Menu**
```css
.user-menu {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 150ms ease-out;
}

.user-menu-trigger:hover {
  background-color: #f1f5f9;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.user-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 200px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
  margin-top: 4px;
}

.user-menu-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.user-menu-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.user-menu-email {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.user-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  color: #374151;
  text-decoration: none;
  gap: 8px;
  transition: background-color 150ms ease-out;
}

.user-menu-item:hover {
  background-color: #f9fafb;
}

.user-menu-separator {
  border-top: 1px solid #f3f4f6;
  margin: 4px 0;
}
```

## Accessibility Features

### Keyboard Navigation

**Focus Management**
```css
.nav-item:focus,
.tab-button:focus,
.pagination-button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Skip navigation for screen readers */
.skip-nav {
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

.skip-nav:focus {
  top: 6px;
}
```

### ARIA Labels and Roles

**Screen Reader Support**
```html
<!-- Navigation landmark -->
<nav role="navigation" aria-label="Main navigation">
  <ul role="list">
    <li role="listitem">
      <a href="/dashboard" aria-current="page">Dashboard</a>
    </li>
  </ul>
</nav>

<!-- Breadcrumb navigation -->
<nav aria-label="Breadcrumb">
  <ol role="list" className="breadcrumb">
    <li role="listitem">
      <a href="/dashboard">Dashboard</a>
    </li>
    <li role="listitem" aria-current="page">
      Calendar
    </li>
  </ol>
</nav>

<!-- Tab navigation -->
<div role="tablist" aria-label="Reservation details">
  <button role="tab" aria-selected="true" aria-controls="panel-1">
    Details
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">
    Guest Info
  </button>
</div>

<!-- Mobile menu -->
<button 
  aria-expanded="false" 
  aria-controls="mobile-menu"
  aria-label="Open main menu"
>
  Menu
</button>
```

## React Implementation

### Sidebar Navigation Component
```jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  CalendarIcon, 
  ClipboardListIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: CalendarIcon,
    badge: 3
  },
  {
    name: 'Reservations',
    href: '/reservations',
    icon: ClipboardListIcon
  },
  {
    name: 'Apartments',
    href: '/apartments',
    icon: BuildingOfficeIcon
  },
  {
    name: 'Cleaning',
    href: '/cleaning',
    icon: SparklesIcon
  },
  {
    name: 'Statistics',
    href: '/statistics',
    icon: ChartBarIcon
  }
];

const Sidebar = ({ className }) => {
  const router = useRouter();
  
  return (
    <nav className={clsx('sidebar', className)} aria-label="Main navigation">
      <div className="sidebar-content">
        <div className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">Main</h3>
            {navigationItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={clsx('nav-item', isActive && 'active')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="nav-icon" aria-hidden="true" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="nav-badge" aria-label={`${item.badge} notifications`}>
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
        
        <div className="sidebar-footer">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
```

### Breadcrumb Component
```jsx
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';

const Breadcrumb = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol role="list" className="flex items-center space-x-2">
        <li>
          <Link href="/dashboard" className="breadcrumb-link">
            <HomeIcon className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={item.name} className="breadcrumb-item">
            <ChevronRightIcon className="breadcrumb-separator w-4 h-4" aria-hidden="true" />
            
            {index === items.length - 1 ? (
              <span className="breadcrumb-current" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="breadcrumb-link">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
```

### Tab Component
```jsx
import { useState } from 'react';
import { clsx } from 'clsx';

const Tabs = ({ tabs, defaultTab = 0, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const handleTabChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };
  
  return (
    <div className="tabs">
      <div role="tablist" className="tab-list" aria-label="Content tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`panel-${tab.id}`}
            className={clsx('tab-button', activeTab === index && 'active')}
            onClick={() => handleTabChange(index)}
          >
            {tab.icon && (
              <span className="tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="tab-badge" aria-label={`${tab.badge} items`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="tab-panels">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            className={clsx('tab-content', activeTab === index && 'active')}
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== index}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
```

---

*This navigation system provides comprehensive wayfinding and efficient task switching throughout VRBNBXOSS. Consistent implementation ensures intuitive user experience and accessibility across all property management workflows.*