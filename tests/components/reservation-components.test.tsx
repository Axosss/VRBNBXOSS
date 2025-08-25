/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlatformBadge, PlatformIcon } from '@/components/reservations/platform-badge'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'
import { ReservationCard } from '@/components/reservations/reservation-card'
import { type Reservation } from '@/lib/stores/reservation-store'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  CalendarDays: ({ className, ...props }: any) => <div data-testid="calendar-days-icon" className={className} {...props} />,
  Users: ({ className, ...props }: any) => <div data-testid="users-icon" className={className} {...props} />,
  MapPin: ({ className, ...props }: any) => <div data-testid="map-pin-icon" className={className} {...props} />,
  DollarSign: ({ className, ...props }: any) => <div data-testid="dollar-sign-icon" className={className} {...props} />,
  MessageCircle: ({ className, ...props }: any) => <div data-testid="message-circle-icon" className={className} {...props} />,
  Edit: ({ className, ...props }: any) => <div data-testid="edit-icon" className={className} {...props} />,
  Trash2: ({ className, ...props }: any) => <div data-testid="trash-icon" className={className} {...props} />,
  Eye: ({ className, ...props }: any) => <div data-testid="eye-icon" className={className} {...props} />,
}))

describe('Reservation Components', () => {
  describe('PlatformBadge', () => {
    it('should render Airbnb platform badge correctly', () => {
      render(<PlatformBadge platform="airbnb" />)
      
      const badge = screen.getByText('Airbnb')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-500', 'text-white')
    })

    it('should render VRBO platform badge correctly', () => {
      render(<PlatformBadge platform="vrbo" />)
      
      const badge = screen.getByText('VRBO')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-600', 'text-white')
    })

    it('should render Direct platform badge correctly', () => {
      render(<PlatformBadge platform="direct" />)
      
      const badge = screen.getByText('Direct')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-600', 'text-white')
    })

    it('should render Booking.com platform badge correctly', () => {
      render(<PlatformBadge platform="booking_com" />)
      
      const badge = screen.getByText('Booking.com')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-800', 'text-white')
    })

    it('should apply size classes correctly', () => {
      const { rerender } = render(<PlatformBadge platform="airbnb" size="sm" />)
      
      let badge = screen.getByText('Airbnb')
      expect(badge).toHaveClass('px-2', 'py-1', 'text-xs')
      
      rerender(<PlatformBadge platform="airbnb" size="md" />)
      badge = screen.getByText('Airbnb')
      expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('should apply custom className', () => {
      render(<PlatformBadge platform="airbnb" className="custom-class" />)
      
      const badge = screen.getByText('Airbnb')
      expect(badge).toHaveClass('custom-class')
    })
  })

  describe('PlatformIcon', () => {
    it('should render platform icon with correct color', () => {
      render(<PlatformIcon platform="airbnb" />)
      
      const icon = screen.getByTitle('Airbnb')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveStyle('background-color: #ff5a5f')
    })

    it('should apply custom className', () => {
      render(<PlatformIcon platform="vrbo" className="custom-icon" />)
      
      const icon = screen.getByTitle('VRBO')
      expect(icon).toHaveClass('custom-icon')
    })

    it('should render all platform icons correctly', () => {
      const platforms = ['airbnb', 'vrbo', 'direct', 'booking_com'] as const
      const expectedColors = ['#ff5a5f', '#0066cc', '#059669', '#003580']
      
      platforms.forEach((platform, index) => {
        const { unmount } = render(<PlatformIcon platform={platform} />)
        
        const icon = screen.getByTitle(platform === 'booking_com' ? 'Booking.com' : 
                                       platform === 'direct' ? 'Direct' :
                                       platform === 'vrbo' ? 'VRBO' : 'Airbnb')
        expect(icon).toHaveStyle(`background-color: ${expectedColors[index]}`)
        
        unmount()
      })
    })
  })

  describe('ReservationStatusBadge', () => {
    const statuses = [
      { status: 'draft' as const, label: 'Draft', classes: ['bg-gray-100', 'text-gray-800'] },
      { status: 'pending' as const, label: 'Pending', classes: ['bg-yellow-100', 'text-yellow-800'] },
      { status: 'confirmed' as const, label: 'Confirmed', classes: ['bg-green-100', 'text-green-800'] },
      { status: 'checked_in' as const, label: 'Checked In', classes: ['bg-blue-100', 'text-blue-800'] },
      { status: 'checked_out' as const, label: 'Checked Out', classes: ['bg-purple-100', 'text-purple-800'] },
      { status: 'cancelled' as const, label: 'Cancelled', classes: ['bg-red-100', 'text-red-800'] },
      { status: 'archived' as const, label: 'Archived', classes: ['bg-gray-100', 'text-gray-600'] },
    ]

    statuses.forEach(({ status, label, classes }) => {
      it(`should render ${status} status badge correctly`, () => {
        render(<ReservationStatusBadge status={status} />)
        
        const badge = screen.getByText(label)
        expect(badge).toBeInTheDocument()
        classes.forEach(cls => {
          expect(badge).toHaveClass(cls)
        })
      })
    })

    it('should apply custom className', () => {
      render(<ReservationStatusBadge status="confirmed" className="custom-status" />)
      
      const badge = screen.getByText('Confirmed')
      expect(badge).toHaveClass('custom-status')
    })

    it('should have consistent badge styling', () => {
      render(<ReservationStatusBadge status="confirmed" />)
      
      const badge = screen.getByText('Confirmed')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2', 'py-1', 'rounded-full', 'text-xs', 'font-medium', 'border')
    })
  })

  describe('ReservationCard', () => {
    const mockReservation: Reservation = {
      id: 'test-reservation-id',
      apartmentId: 'test-apartment-id',
      ownerId: 'test-owner-id',
      guestId: 'test-guest-id',
      platform: 'airbnb',
      platformReservationId: 'AIRBNB123',
      checkIn: '2024-12-25',
      checkOut: '2024-12-28',
      guestCount: 2,
      totalPrice: 450,
      cleaningFee: 50,
      platformFee: 25,
      currency: 'USD',
      status: 'confirmed',
      notes: 'Test reservation',
      contactInfo: {
        phone: '+1234567890',
        email: 'guest@example.com',
      },
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      apartment: {
        id: 'test-apartment-id',
        name: 'Test Apartment',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
      },
      guest: {
        id: 'test-guest-id',
        name: 'Test Guest',
        email: 'guest@example.com',
        phone: '+1234567890',
      },
    }

    const mockHandlers = {
      onView: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should render reservation card in grid view', () => {
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      // Check basic information is displayed
      expect(screen.getByText('Test Apartment')).toBeInTheDocument()
      expect(screen.getByText('Test Guest')).toBeInTheDocument()
      expect(screen.getByText('Airbnb')).toBeInTheDocument()
      expect(screen.getByText('Confirmed')).toBeInTheDocument()
      expect(screen.getByText('$450.00')).toBeInTheDocument()
      expect(screen.getByText('2 guests')).toBeInTheDocument()
      
      // Check dates are formatted correctly
      expect(screen.getByText('Dec 25, 2024')).toBeInTheDocument()
      expect(screen.getByText('Dec 28, 2024')).toBeInTheDocument()
    })

    it('should render reservation card in list view', () => {
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="list"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Test Apartment')).toBeInTheDocument()
      expect(screen.getByText('Test Guest')).toBeInTheDocument()
      expect(screen.getByText('AIRBNB123')).toBeInTheDocument() // Platform reservation ID shown in list view
    })

    it('should call onView when view button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      const viewButton = screen.getByRole('button', { name: /view/i })
      await user.click(viewButton)

      expect(mockHandlers.onView).toHaveBeenCalledTimes(1)
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1)
    })

    it('should display platform reservation ID when available', () => {
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="list"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('AIRBNB123')).toBeInTheDocument()
    })

    it('should handle missing guest data gracefully', () => {
      const reservationWithoutGuest = {
        ...mockReservation,
        guest: null,
        guestId: null,
      }

      render(
        <ReservationCard
          reservation={reservationWithoutGuest as Reservation}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Direct Booking')).toBeInTheDocument() // Should show fallback text
    })

    it('should display notes when available', () => {
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="list"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Test reservation')).toBeInTheDocument()
    })

    it('should format currency correctly', () => {
      const reservationWithEuros = {
        ...mockReservation,
        totalPrice: 399.99,
        currency: 'EUR',
      }

      render(
        <ReservationCard
          reservation={reservationWithEuros}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('€399.99')).toBeInTheDocument()
    })

    it('should handle different date formats correctly', () => {
      const reservationWithTimestamps = {
        ...mockReservation,
        checkIn: '2024-12-25T15:00:00Z',
        checkOut: '2024-12-28T11:00:00Z',
      }

      render(
        <ReservationCard
          reservation={reservationWithTimestamps}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Dec 25, 2024')).toBeInTheDocument()
      expect(screen.getByText('Dec 28, 2024')).toBeInTheDocument()
    })

    it('should show different status badges correctly', () => {
      const { rerender } = render(
        <ReservationCard
          reservation={{ ...mockReservation, status: 'pending' }}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Pending')).toBeInTheDocument()

      rerender(
        <ReservationCard
          reservation={{ ...mockReservation, status: 'cancelled' }}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('Cancelled')).toBeInTheDocument()
    })

    it('should display contact information when available', () => {
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="list"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('guest@example.com')).toBeInTheDocument()
      expect(screen.getByText('+1234567890')).toBeInTheDocument()
    })

    it('should handle different apartment address formats', () => {
      const reservationWithShortAddress = {
        ...mockReservation,
        apartment: {
          ...mockReservation.apartment,
          address: {
            street: '123 Main St',
            city: 'NYC',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
        },
      }

      render(
        <ReservationCard
          reservation={reservationWithShortAddress}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('123 Main St, NYC, NY')).toBeInTheDocument()
    })

    it('should be accessible with proper ARIA labels', () => {
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      const viewButton = screen.getByRole('button', { name: /view/i })
      const editButton = screen.getByRole('button', { name: /edit/i })
      const deleteButton = screen.getByRole('button', { name: /delete/i })

      expect(viewButton).toBeInTheDocument()
      expect(editButton).toBeInTheDocument()
      expect(deleteButton).toBeInTheDocument()
    })

    it('should display icons correctly', () => {
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="grid"
          {...mockHandlers}
        />
      )

      expect(screen.getByTestId('calendar-days-icon')).toBeInTheDocument()
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
      expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument()
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
    })

    it('should handle missing platform reservation ID', () => {
      const reservationWithoutPlatformId = {
        ...mockReservation,
        platformReservationId: null,
      }

      render(
        <ReservationCard
          reservation={reservationWithoutPlatformId}
          viewMode="list"
          {...mockHandlers}
        />
      )

      expect(screen.queryByText('AIRBNB123')).not.toBeInTheDocument()
    })

    it('should calculate and display stay duration', () => {
      render(
        <ReservationCard
          reservation={mockReservation}
          viewMode="list"
          {...mockHandlers}
        />
      )

      expect(screen.getByText('3 nights')).toBeInTheDocument() // Dec 25-28 = 3 nights
    })
  })
})