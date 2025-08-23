---
title: Dashboard Overview Design
description: Complete UX/UI specifications for the VRBNBXOSS main dashboard interface
feature: Dashboard Overview
last-updated: 2025-01-22
version: 1.0
related-files:
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/design-system/style-guide.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/features/calendar/README.md
  - /Users/axoss/Documents/VRBNBXOSS/design-documentation/features/reservations/README.md
dependencies:
  - Authentication system
  - Data fetching patterns
  - Real-time updates via Supabase
status: draft
---

# Dashboard Overview Design

## Feature Overview

The VRBNBXOSS Dashboard serves as the **central command center** for property management operations, providing at-a-glance insights, quick access to critical tasks, and efficient workflow navigation. The dashboard prioritizes information hierarchy, actionable insights, and streamlined task completion.

## User Goals & Success Criteria

### Primary User Goal
Property managers need to quickly assess their business status, identify urgent tasks, and access frequently-used features to maintain efficient operations.

### Success Criteria
- **Information Accessibility**: Key metrics visible within 3 seconds of page load
- **Task Efficiency**: Common actions (add reservation, schedule cleaning) accessible within 2 clicks
- **Status Awareness**: Critical alerts and upcoming tasks prominently displayed
- **Navigation Efficiency**: Quick access to all major platform sections

### Key Pain Points Addressed
- **Fragmented Information**: Consolidates data from multiple sources into unified view
- **Task Switching**: Reduces cognitive load with integrated quick actions
- **Status Blindness**: Proactive alerts for upcoming deadlines and conflicts
- **Mobile Accessibility**: Full functionality available on mobile devices

## Information Architecture

### Content Hierarchy

**Level 1: Critical Status Information**
- Current occupancy rates
- Today's check-ins/check-outs
- Urgent cleaning tasks
- System alerts

**Level 2: Performance Metrics**
- Revenue trends
- Upcoming reservations
- Recent activity
- Calendar preview

**Level 3: Quick Actions & Navigation**
- Add reservation
- Schedule cleaning
- View reports
- Access settings

### Mental Model Alignment
The dashboard follows the **progressive disclosure** pattern, showing the most critical information first, with detailed views accessible through purposeful interactions.

## User Journey Mapping

### Daily Workflow: Morning Check-in

**Step 1: Status Assessment (0-10 seconds)**
- **Trigger**: User opens VRBNBXOSS dashboard
- **Visual Layout**: 
  - Header with current date and quick stats
  - Alert banner for urgent items (if any)
  - Grid layout of key metrics cards
- **Available Actions**: View alerts, access quick stats
- **System Feedback**: Loading skeletons during data fetch
- **Visual Hierarchy**: Critical alerts > today's events > performance metrics

**Step 2: Today's Tasks Review (10-30 seconds)**
- **Task Flow**: Scan today's check-ins, check-outs, and cleaning schedule
- **State Description**: Interactive today's events card with expandable details
- **Error Prevention**: Conflict indicators for overlapping schedules
- **Progressive Disclosure**: Summary view with "View all" option for detailed lists
- **Microcopy**: Clear, scannable task descriptions with time indicators

**Step 3: Quick Actions (30+ seconds)**
- **Primary Actions**: Add reservation, schedule cleaning, view calendar
- **Visual Confirmation**: Success states for completed actions
- **Exit Options**: Return to dashboard overview or continue to detailed views

### Power User Shortcuts

**Keyboard Navigation**
- `Alt + D`: Return to dashboard from any page
- `/`: Focus global search
- `N`: Quick "New Reservation" modal
- `C`: Open calendar view
- `R`: View reservations list

**Efficiency Features**
- Recently viewed apartments in quick-access dropdown
- Starred/favorite properties for faster selection
- Recent guest autocomplete in forms
- One-click actions for routine tasks

## Screen-by-Screen Specifications

### Main Dashboard View

#### State: Default (Logged In, Data Loaded)

**Visual Design Specifications**

**Layout Structure**
- **Container**: Max-width 1200px, centered with 24px margins
- **Grid System**: CSS Grid with responsive columns (1 col mobile, 2 col tablet, 3 col desktop)
- **Spacing**: 24px gaps between cards, 32px section separation
- **Header**: 64px fixed header with global navigation
- **Sidebar**: 280px collapsible sidebar (desktop), drawer overlay (mobile/tablet)

**Typography Hierarchy**
- **Page Title**: H1 (30px/36px, Bold, Slate-900)
- **Card Titles**: H3 (20px/28px, Semibold, Slate-800)  
- **Metric Values**: Display Large (36px/44px, Bold, Primary-600)
- **Metric Labels**: Label (14px/20px, Medium, Slate-600)
- **Body Text**: Body (16px/24px, Regular, Slate-600)

**Color Application**
- **Background**: Slate-50 (#f8fafc) page background
- **Cards**: White backgrounds with Slate-200 borders
- **Primary Data**: Primary-600 for key metrics and CTAs
- **Status Colors**: Success-600, Warning-600, Error-600 for status indicators
- **Text Hierarchy**: Slate-900 (headings), Slate-700 (body), Slate-500 (metadata)

**Interactive Elements**

**Card Hover States**
```css
.dashboard-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  transition: all 150ms ease-out;
}

.dashboard-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.dashboard-card.interactive:hover {
  cursor: pointer;
  border-color: #3b82f6;
}
```

**Primary Action Buttons**
- **Add Reservation**: Primary-600 background, white text, 40px height
- **Quick Actions**: Secondary styling with Primary-600 text and borders
- **View Details**: Tertiary/ghost styling for subtle navigation

**Animation Specifications**

**Page Load Animation**
```css
.dashboard-enter {
  opacity: 0;
  transform: translateY(20px);
}

.dashboard-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}

/* Staggered card animations */
.dashboard-card:nth-child(1) { animation-delay: 0ms; }
.dashboard-card:nth-child(2) { animation-delay: 100ms; }
.dashboard-card:nth-child(3) { animation-delay: 200ms; }
```

**Metric Counter Animation**
```css
@keyframes countUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.metric-value {
  animation: countUp 600ms ease-out forwards;
}
```

**Responsive Design Specifications**

**Mobile (320px - 767px)**
- Single column layout
- Stacked cards with 16px spacing
- Condensed header (56px height)
- Bottom navigation bar
- Simplified quick actions menu
- Touch-optimized button sizes (48px minimum)

**Tablet (768px - 1023px)**  
- Two column grid layout
- Collapsible sidebar as drawer overlay
- Maintained card functionality
- Optimized for mixed touch/cursor interaction

**Desktop (1024px+)**
- Three column grid layout
- Full sidebar navigation
- Hover states and micro-interactions
- Keyboard shortcuts functional
- Maximum information density

**Accessibility Specifications**

**Screen Reader Support**
```html
<!-- Dashboard landmark and heading structure -->
<main role="main" aria-label="Dashboard overview">
  <h1 id="dashboard-title">Property Management Dashboard</h1>
  
  <!-- Skip to content link -->
  <a href="#main-content" className="skip-link">Skip to main content</a>
  
  <!-- Status alerts -->
  <section aria-labelledby="alerts-heading" role="region">
    <h2 id="alerts-heading" className="sr-only">Important alerts</h2>
    {alerts.map(alert => (
      <div key={alert.id} role="alert" aria-live="polite">
        {alert.message}
      </div>
    ))}
  </section>
  
  <!-- Metrics overview -->
  <section aria-labelledby="metrics-heading" role="region">
    <h2 id="metrics-heading">Performance Overview</h2>
    <div className="metrics-grid">
      <div role="group" aria-labelledby="occupancy-heading">
        <h3 id="occupancy-heading">Current Occupancy</h3>
        <div aria-label="85% occupancy rate">85%</div>
      </div>
    </div>
  </section>
</main>
```

**Keyboard Navigation**
- Tab order: Header actions → Alert dismissals → Card interactions → Quick actions
- Focus indicators: 2px Primary-500 outline with 2px offset
- Keyboard shortcuts documented and accessible via Alt+? menu
- Focus management for modal interactions

**Color Contrast Verification**
- All text meets WCAG 2.1 AA standards (4.5:1 minimum)
- Status indicators use color + icons for accessibility
- High contrast mode support maintained

#### State: Loading (Data Fetching)

**Loading Animation Specifications**
```css
.dashboard-skeleton {
  background: linear-gradient(90deg, 
    #f1f5f9 25%, 
    #e2e8f0 50%, 
    #f1f5f9 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 6px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Progressive Loading Pattern**
1. **Immediate**: Header and navigation (cached)
2. **0-500ms**: Page structure with skeleton cards
3. **500-1000ms**: Critical metrics (occupancy, today's events)
4. **1000-2000ms**: Secondary data (trends, recent activity)
5. **2000ms+**: Optional enhancements (charts, detailed analytics)

#### State: Error (API Failure, No Data)

**Error State Design**
```html
<div className="error-state" role="alert">
  <ExclamationTriangleIcon className="w-12 h-12 text-warning-500 mx-auto" />
  <h3 className="text-lg font-semibold text-slate-900 mt-4">
    Unable to load dashboard data
  </h3>
  <p className="text-slate-600 mt-2 max-w-sm mx-auto">
    We're having trouble connecting to your property data. 
    Please check your internet connection and try again.
  </p>
  <button 
    onClick={retryLoad}
    className="btn-primary mt-4"
    aria-describedby="retry-description"
  >
    Try Again
  </button>
  <p id="retry-description" className="sr-only">
    Retry loading dashboard data
  </p>
</div>
```

#### State: Empty (First Time User, No Properties)

**Onboarding Flow**
```html
<div className="empty-state text-center py-12">
  <BuildingOfficeIcon className="w-16 h-16 text-slate-400 mx-auto" />
  <h2 className="text-xl font-semibold text-slate-900 mt-4">
    Welcome to VRBNBXOSS!
  </h2>
  <p className="text-slate-600 mt-2 max-w-md mx-auto">
    Get started by adding your first rental property to begin managing 
    reservations, cleaning schedules, and tracking performance.
  </p>
  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
    <button className="btn-primary">
      <PlusIcon className="w-5 h-5 mr-2" />
      Add Your First Property
    </button>
    <button className="btn-secondary">
      <PlayIcon className="w-5 h-5 mr-2" />
      Watch Demo
    </button>
  </div>
</div>
```

### Dashboard Components

#### Metrics Cards

**Occupancy Rate Card**
```html
<div className="dashboard-card" role="group" aria-labelledby="occupancy-title">
  <div className="flex items-center justify-between mb-4">
    <h3 id="occupancy-title" className="card-title">Current Occupancy</h3>
    <CalendarIcon className="w-5 h-5 text-slate-400" aria-hidden="true" />
  </div>
  
  <div className="metric-display">
    <div className="metric-value text-3xl font-bold text-primary-600">
      85%
    </div>
    <div className="metric-change text-sm text-success-600 mt-1">
      <ArrowUpIcon className="w-4 h-4 inline mr-1" aria-hidden="true" />
      +5% from last month
    </div>
  </div>
  
  <div className="progress-bar mt-4">
    <div 
      className="progress-fill bg-primary-600" 
      style={{ width: '85%' }}
      aria-label="85% occupancy"
    />
  </div>
</div>
```

**Today's Events Card**
```html
<div className="dashboard-card">
  <div className="flex items-center justify-between mb-4">
    <h3 className="card-title">Today's Schedule</h3>
    <span className="badge bg-primary-100 text-primary-800">
      {events.length} events
    </span>
  </div>
  
  <div className="event-list space-y-3">
    {events.slice(0, 3).map(event => (
      <div key={event.id} className="event-item flex items-center gap-3">
        <div className="event-time text-sm font-medium text-slate-600">
          {formatTime(event.time)}
        </div>
        <div className="event-type">
          <span className={`event-badge ${event.type}`}>
            {event.type === 'checkin' && 'Check-in'}
            {event.type === 'checkout' && 'Check-out'}
            {event.type === 'cleaning' && 'Cleaning'}
          </span>
        </div>
        <div className="event-details flex-1">
          <div className="text-sm font-medium text-slate-900">
            {event.guestName || event.apartmentName}
          </div>
          <div className="text-xs text-slate-500">
            {event.apartmentName}
          </div>
        </div>
      </div>
    ))}
  </div>
  
  {events.length > 3 && (
    <button className="btn-tertiary w-full mt-4">
      View all {events.length} events
    </button>
  )}
</div>
```

#### Quick Actions Panel

**Action Buttons Layout**
```html
<div className="dashboard-card">
  <h3 className="card-title mb-4">Quick Actions</h3>
  
  <div className="grid grid-cols-2 gap-3">
    <button 
      className="quick-action-btn"
      onClick={openNewReservationModal}
      aria-describedby="new-reservation-desc"
    >
      <PlusIcon className="w-5 h-5 mb-2" aria-hidden="true" />
      <span className="text-sm font-medium">New Reservation</span>
    </button>
    
    <button 
      className="quick-action-btn"
      onClick={openCalendarView}
    >
      <CalendarIcon className="w-5 h-5 mb-2" aria-hidden="true" />
      <span className="text-sm font-medium">View Calendar</span>
    </button>
    
    <button 
      className="quick-action-btn"
      onClick={openCleaningSchedule}
    >
      <SparklesIcon className="w-5 h-5 mb-2" aria-hidden="true" />
      <span className="text-sm font-medium">Schedule Cleaning</span>
    </button>
    
    <button 
      className="quick-action-btn"
      onClick={openStatistics}
    >
      <ChartBarIcon className="w-5 h-5 mb-2" aria-hidden="true" />
      <span className="text-sm font-medium">View Reports</span>
    </button>
  </div>
</div>

<div id="new-reservation-desc" className="sr-only">
  Opens a form to create a new property reservation
</div>
```

#### Real-Time Updates

**Live Data Integration**
```javascript
// Real-time dashboard updates via Supabase
const useDashboardData = () => {
  const [metrics, setMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'reservations' 
        },
        (payload) => {
          // Update dashboard when reservations change
          refreshDashboardData();
        }
      )
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, []);
  
  const refreshDashboardData = useCallback(async () => {
    try {
      const [metricsData, eventsData] = await Promise.all([
        fetchMetrics(),
        fetchTodaysEvents()
      ]);
      
      setMetrics(metricsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { metrics, events, loading, refresh: refreshDashboardData };
};
```

## Technical Implementation Guidelines

### Performance Considerations
- **Critical Data Loading**: Prioritize above-the-fold metrics
- **Image Optimization**: Lazy load apartment photos and charts
- **Bundle Splitting**: Separate dashboard code from other features
- **Caching Strategy**: Cache dashboard data for 5 minutes, invalidate on changes

### State Management
- **Local State**: Component-level state for UI interactions
- **Global State**: User session and current property context
- **Server State**: React Query for API data management with real-time updates
- **Persistent State**: Local storage for user preferences and view settings

### API Integration Points
- **Dashboard Metrics**: `/api/dashboard/metrics` - aggregated performance data
- **Today's Events**: `/api/dashboard/events` - chronological event list
- **Quick Stats**: `/api/dashboard/stats` - real-time occupancy and revenue
- **Alerts**: `/api/dashboard/alerts` - system notifications and warnings

### Mobile-First Considerations
- **Touch Targets**: 48px minimum for all interactive elements
- **Gesture Support**: Swipe between dashboard cards, pull-to-refresh
- **Network Optimization**: Reduced payload for mobile, progressive enhancement
- **Offline Support**: Essential dashboard data cached for offline viewing

---

*This dashboard design serves as the central hub for efficient property management, providing property owners with immediate insights and streamlined access to critical functions while maintaining professional aesthetics and accessibility standards.*