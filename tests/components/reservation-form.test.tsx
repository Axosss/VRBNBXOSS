/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { useReservationStore } from '@/lib/stores/reservation-store'
import { type ReservationCreateInput } from '@/lib/validations'

// Mock the stores
jest.mock('@/lib/stores/apartment-store')
jest.mock('@/lib/stores/reservation-store')

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, type, ...props }: any) => (
    <input 
      onChange={onChange} 
      value={value} 
      placeholder={placeholder} 
      type={type}
      {...props}
    />
  ),
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} {...props}>{children}</label>
  ),
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select onChange={(e) => onValueChange?.(e.target.value)} value={value}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}))

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <form>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormDescription: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render, control, name }: any) => {
    // Simple mock that renders the field
    const fieldProps = { onChange: jest.fn(), value: '', name }
    return render({ field: fieldProps })
  },
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: ({ children }: any) => <span>{children}</span>,
}))

jest.mock('@/components/shared/loading-spinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

jest.mock('@/components/reservations/platform-badge', () => ({
  PlatformBadge: ({ platform }: any) => <span data-testid="platform-badge">{platform}</span>,
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  Users: () => <div data-testid="users-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  User: () => <div data-testid="user-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Check: () => <div data-testid="check-icon" />,
}))

describe('ReservationForm', () => {
  const mockUseApartmentStore = useApartmentStore as jest.MockedFunction<typeof useApartmentStore>
  const mockUseReservationStore = useReservationStore as jest.MockedFunction<typeof useReservationStore>

  const mockApartments = [
    {
      id: 'apartment-1',
      name: 'Test Apartment 1',
      capacity: 4,
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US',
      },
    },
    {
      id: 'apartment-2',
      name: 'Test Apartment 2',
      capacity: 6,
      address: {
        street: '456 Test Ave',
        city: 'Test Town',
        state: 'TT',
        zipCode: '67890',
        country: 'US',
      },
    },
  ]

  const mockProps = {
    mode: 'create' as const,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseApartmentStore.mockReturnValue({
      apartments: mockApartments,
      isLoading: false,
      error: null,
      fetchApartments: jest.fn(),
      createApartment: jest.fn(),
      updateApartment: jest.fn(),
      deleteApartment: jest.fn(),
      uploadPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      reorderPhotos: jest.fn(),
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      setPagination: jest.fn(),
    } as any)

    mockUseReservationStore.mockReturnValue({
      reservations: [],
      isLoading: false,
      error: null,
      fetchReservations: jest.fn(),
      createReservation: jest.fn(),
      updateReservation: jest.fn(),
      deleteReservation: jest.fn(),
      getReservationById: jest.fn(),
      setFilters: jest.fn(),
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      setPagination: jest.fn(),
      searchGuests: jest.fn().mockResolvedValue([]),
    } as any)
  })

  it('should render form in create mode', () => {
    render(<ReservationForm {...mockProps} />)

    expect(screen.getByText('Create New Reservation')).toBeInTheDocument()
    expect(screen.getByText('Property Details')).toBeInTheDocument()
    expect(screen.getByText('Booking Details')).toBeInTheDocument()
    expect(screen.getByText('Guest Information')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create reservation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should render form in edit mode', () => {
    const editProps = { ...mockProps, mode: 'edit' as const }
    render(<ReservationForm {...editProps} />)

    expect(screen.getByText('Edit Reservation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update reservation/i })).toBeInTheDocument()
  })

  it('should populate form with initial data', () => {
    const initialData: Partial<ReservationCreateInput> = {
      apartmentId: 'apartment-1',
      platform: 'airbnb',
      checkIn: '2024-12-25',
      checkOut: '2024-12-28',
      guestCount: 2,
      totalPrice: 450,
      cleaningFee: 50,
      platformFee: 25,
      notes: 'Test reservation',
    }

    render(<ReservationForm {...mockProps} initialData={initialData} />)

    expect(screen.getByDisplayValue('2024-12-25')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-12-28')).toBeInTheDocument()
    expect(screen.getByDisplayValue('450')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test reservation')).toBeInTheDocument()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('should display loading spinner when apartments are loading', () => {
    mockUseApartmentStore.mockReturnValue({
      apartments: [],
      isLoading: true,
      error: null,
      fetchApartments: jest.fn(),
    } as any)

    render(<ReservationForm {...mockProps} />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display apartment options in select', () => {
    render(<ReservationForm {...mockProps} />)

    expect(screen.getByText('Test Apartment 1')).toBeInTheDocument()
    expect(screen.getByText('Test Apartment 2')).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const submitButton = screen.getByRole('button', { name: /create reservation/i })
    await user.click(submitButton)

    // Form validation should prevent submission
    expect(mockProps.onSubmit).not.toHaveBeenCalled()
  })

  it('should validate check-in before check-out', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    // Set check-out before check-in
    const checkInInput = screen.getByLabelText(/check-in date/i)
    const checkOutInput = screen.getByLabelText(/check-out date/i)

    await user.type(checkInInput, '2024-12-28')
    await user.type(checkOutInput, '2024-12-25')

    const submitButton = screen.getByRole('button', { name: /create reservation/i })
    await user.click(submitButton)

    // Should show validation error
    expect(screen.getByText(/check-out date must be after check-in/i)).toBeInTheDocument()
  })

  it('should validate guest count against apartment capacity', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    // Select apartment with capacity 4
    const apartmentSelect = screen.getByDisplayValue('Select an apartment')
    await user.selectOptions(apartmentSelect, 'apartment-1')

    // Set guest count exceeding capacity
    const guestCountInput = screen.getByLabelText(/guest count/i)
    await user.type(guestCountInput, '6')

    // Should show validation error
    expect(screen.getByText(/exceeds apartment capacity/i)).toBeInTheDocument()
  })

  it('should handle platform selection and show platform-specific fields', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const platformSelect = screen.getByDisplayValue('Select platform')
    await user.selectOptions(platformSelect, 'airbnb')

    expect(screen.getByTestId('platform-badge')).toBeInTheDocument()
    expect(screen.getByLabelText(/platform reservation id/i)).toBeInTheDocument()
  })

  it('should calculate total price with fees', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const totalPriceInput = screen.getByLabelText(/total price/i)
    const cleaningFeeInput = screen.getByLabelText(/cleaning fee/i)
    const platformFeeInput = screen.getByLabelText(/platform fee/i)

    await user.type(totalPriceInput, '400')
    await user.type(cleaningFeeInput, '50')
    await user.type(platformFeeInput, '25')

    // Should display calculated total
    expect(screen.getByText('$475.00')).toBeInTheDocument()
  })

  it('should handle guest search and selection', async () => {
    const user = userEvent.setup()
    const mockGuests = [
      { id: 'guest-1', name: 'John Doe', email: 'john@example.com' },
      { id: 'guest-2', name: 'Jane Smith', email: 'jane@example.com' },
    ]

    mockUseReservationStore.mockReturnValue({
      searchGuests: jest.fn().mockResolvedValue(mockGuests),
    } as any)

    render(<ReservationForm {...mockProps} />)

    const guestSearchInput = screen.getByPlaceholderText(/search guests/i)
    await user.type(guestSearchInput, 'John')

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('should allow creating new guest inline', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const createNewGuestButton = screen.getByText(/create new guest/i)
    await user.click(createNewGuestButton)

    expect(screen.getByLabelText(/guest name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/guest email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/guest phone/i)).toBeInTheDocument()
  })

  it('should validate pricing fields are non-negative', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const totalPriceInput = screen.getByLabelText(/total price/i)
    await user.type(totalPriceInput, '-100')

    // Should show validation error
    expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument()
  })

  it('should handle form submission with valid data', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    // Fill out all required fields
    const apartmentSelect = screen.getByDisplayValue('Select an apartment')
    await user.selectOptions(apartmentSelect, 'apartment-1')

    const platformSelect = screen.getByDisplayValue('Select platform')
    await user.selectOptions(platformSelect, 'airbnb')

    const checkInInput = screen.getByLabelText(/check-in date/i)
    await user.type(checkInInput, '2024-12-25')

    const checkOutInput = screen.getByLabelText(/check-out date/i)
    await user.type(checkOutInput, '2024-12-28')

    const guestCountInput = screen.getByLabelText(/guest count/i)
    await user.type(guestCountInput, '2')

    const totalPriceInput = screen.getByLabelText(/total price/i)
    await user.type(totalPriceInput, '450')

    const submitButton = screen.getByRole('button', { name: /create reservation/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          apartmentId: 'apartment-1',
          platform: 'airbnb',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: 450,
        })
      )
    })
  })

  it('should show form submission loading state', async () => {
    const user = userEvent.setup()
    const slowOnSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    render(<ReservationForm {...mockProps} onSubmit={slowOnSubmit} />)

    // Fill required fields and submit
    const apartmentSelect = screen.getByDisplayValue('Select an apartment')
    await user.selectOptions(apartmentSelect, 'apartment-1')
    
    const submitButton = screen.getByRole('button', { name: /create reservation/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/creating/i)).toBeInTheDocument()
  })

  it('should handle apartment store errors', () => {
    mockUseApartmentStore.mockReturnValue({
      apartments: [],
      isLoading: false,
      error: 'Failed to load apartments',
      fetchApartments: jest.fn(),
    } as any)

    render(<ReservationForm {...mockProps} />)

    expect(screen.getByText(/failed to load apartments/i)).toBeInTheDocument()
  })

  it('should display platform-specific validation messages', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const platformSelect = screen.getByDisplayValue('Select platform')
    await user.selectOptions(platformSelect, 'direct')

    // Direct bookings might require additional guest information
    expect(screen.getByText(/direct bookings require complete guest information/i)).toBeInTheDocument()
  })

  it('should preserve form state when switching between guest creation and selection', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    // Fill out some fields
    const totalPriceInput = screen.getByLabelText(/total price/i)
    await user.type(totalPriceInput, '450')

    // Switch to create new guest
    const createNewGuestButton = screen.getByText(/create new guest/i)
    await user.click(createNewGuestButton)

    // Switch back to guest selection
    const selectExistingGuestButton = screen.getByText(/select existing guest/i)
    await user.click(selectExistingGuestButton)

    // Price should be preserved
    expect(totalPriceInput).toHaveValue('450')
  })

  it('should show currency symbol based on selected currency', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const currencySelect = screen.getByDisplayValue('USD')
    await user.selectOptions(currencySelect, 'EUR')

    expect(screen.getByText('€')).toBeInTheDocument()
  })

  it('should display platform-specific help text', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const platformSelect = screen.getByDisplayValue('Select platform')
    await user.selectOptions(platformSelect, 'airbnb')

    expect(screen.getByText(/airbnb reservations/i)).toBeInTheDocument()
  })

  it('should handle real-time validation as user types', async () => {
    const user = userEvent.setup()
    render(<ReservationForm {...mockProps} />)

    const guestCountInput = screen.getByLabelText(/guest count/i)
    await user.type(guestCountInput, '0')

    // Should show validation error immediately
    expect(screen.getByText(/must be at least 1/i)).toBeInTheDocument()
  })
})