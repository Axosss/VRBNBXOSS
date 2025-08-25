import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ApartmentForm } from '@/components/apartments/apartment-form'
import { ApartmentCreateInput } from '@/lib/validations'

// Mock the LoadingSpinner component
jest.mock('@/components/shared/loading-spinner', () => ({
  LoadingSpinner: (props) => (
    <div data-testid="loading-spinner" data-size={props.size}>Loading...</div>
  ),
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => (
    <button {...props} data-testid={props['data-testid'] || 'button'}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} data-testid={props['data-testid'] || 'input'} />,
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }) => <label {...props}>{children}</label>,
}))

jest.mock('@/components/ui/form', () => {
  const React = require('react')
  
  return {
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
    FormControl: React.forwardRef(({ children }, ref) => (
      <div ref={ref}>{children}</div>
    )),
    FormField: ({ name, render, control }) => {
      const field = {
        name,
        value: '',
        onChange: jest.fn(),
        onBlur: jest.fn(),
        ref: React.createRef(),
      }
      return render({ field, fieldState: { error: null }, formState: {} })
    },
    FormItem: ({ children }) => <div>{children}</div>,
    FormLabel: ({ children, htmlFor }) => <label htmlFor={htmlFor}>{children}</label>,
    FormMessage: ({ children }) => children ? <div>{children}</div> : null,
  }
})

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h3>{children}</h3>,
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ children, value }) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
}))

// Mock the icon imports to avoid issues with SVG imports
jest.mock('lucide-react', () => ({
  Wifi: () => <div data-testid="wifi-icon">WiFi</div>,
  Car: () => <div data-testid="car-icon">Car</div>,
  Coffee: () => <div data-testid="coffee-icon">Coffee</div>,
  Tv: () => <div data-testid="tv-icon">TV</div>,
  Snowflake: () => <div data-testid="snowflake-icon">AC</div>,
  Waves: () => <div data-testid="waves-icon">Pool</div>,
  Dumbbell: () => <div data-testid="dumbbell-icon">Gym</div>,
  Shield: () => <div data-testid="shield-icon">Security</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
}))

describe('ApartmentForm Component Integration Tests', () => {
  const mockOnSubmit = jest.fn<Promise<void>, [ApartmentCreateInput]>()
  const mockOnCancel = jest.fn()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    isLoading: false,
    submitLabel: 'Save Property',
    isEdit: false,
  }

  const validApartmentData = {
    name: 'Test Apartment',
    address: {
      street: '123 Test St',
      city: 'Test City', 
      state: 'TS',
      zipCode: '12345',
      country: 'United States',
    },
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1.5,
    amenities: ['WiFi', 'Kitchen'],
    accessCodes: {
      wifi: {
        network: 'TestNet',
        password: 'testpass123',
      },
      door: '1234',
      mailbox: '5678',
      additional: {
        Garage: 'garage123',
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render all form sections', () => {
      render(<ApartmentForm {...defaultProps} />)
      
      // Basic information section
      expect(screen.getByText(/property name/i)).toBeInTheDocument()
      expect(screen.getByText(/guest capacity/i)).toBeInTheDocument()
      expect(screen.getByText(/bedrooms/i)).toBeInTheDocument()
      expect(screen.getByText(/bathrooms/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/downtown loft/i)).toBeInTheDocument()
      
      // Address section
      expect(screen.getByText('Address')).toBeInTheDocument()
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument()
      
      // Amenities section
      expect(screen.getByText('Amenities')).toBeInTheDocument()
      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument()
      expect(screen.getByTestId('car-icon')).toBeInTheDocument()
      
      // Access codes section
      expect(screen.getByText('Access Codes')).toBeInTheDocument()
      expect(screen.getByLabelText(/network name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/door code/i)).toBeInTheDocument()
      
      // Form actions
      expect(screen.getByText('Save Property')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should initialize with default values when no initialData provided', () => {
      render(<ApartmentForm {...defaultProps} />)
      
      expect(screen.getByDisplayValue('2')).toBeInTheDocument() // capacity
      expect(screen.getByDisplayValue('1')).toBeInTheDocument() // bedrooms
      expect(screen.getByDisplayValue('United States')).toBeInTheDocument() // country
    })

    it('should initialize with provided initialData', () => {
      const props = {
        ...defaultProps,
        initialData: validApartmentData,
        isEdit: true,
        submitLabel: 'Update Property',
      }
      
      render(<ApartmentForm {...props} />)
      
      expect(screen.getByDisplayValue('Test Apartment')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test City')).toBeInTheDocument()
      expect(screen.getByDisplayValue('4')).toBeInTheDocument() // capacity
      expect(screen.getByText('Update Property')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should handle basic field input', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      const nameInput = screen.getByLabelText(/property name/i)
      const capacityInput = screen.getByLabelText(/guest capacity/i)
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Modern Loft')
      expect(nameInput).toHaveValue('Modern Loft')
      
      await user.clear(capacityInput)
      await user.type(capacityInput, '6')
      expect(capacityInput).toHaveValue(6)
    })

    it('should handle address fields', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      const streetInput = screen.getByLabelText(/street address/i)
      const cityInput = screen.getByLabelText(/city/i)
      const stateInput = screen.getByLabelText(/state/i)
      const zipInput = screen.getByLabelText(/zip code/i)
      
      await user.type(streetInput, '456 Main St')
      await user.type(cityInput, 'New York')
      await user.type(stateInput, 'NY')
      await user.type(zipInput, '10001')
      
      expect(streetInput).toHaveValue('456 Main St')
      expect(cityInput).toHaveValue('New York')
      expect(stateInput).toHaveValue('NY')
      expect(zipInput).toHaveValue('10001')
    })

    it('should handle country selection', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      // Find and click the country selector
      const countrySelect = screen.getByRole('combobox', { name: /country/i })
      await user.click(countrySelect)
      
      // Select Canada from the dropdown
      const canadaOption = await screen.findByText('Canada')
      await user.click(canadaOption)
      
      // Verify selection
      expect(screen.getByDisplayValue('Canada')).toBeInTheDocument()
    })

    it('should toggle amenities selection', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      // Find WiFi amenity button
      const wifiButton = screen.getByRole('button', { name: /wifi/i })
      const kitchenButton = screen.getByRole('button', { name: /kitchen/i })
      
      // Initially, amenities should not be selected
      expect(wifiButton).not.toHaveClass('border-primary')
      expect(kitchenButton).not.toHaveClass('border-primary')
      
      // Click to select WiFi
      await user.click(wifiButton)
      await waitFor(() => {
        expect(wifiButton).toHaveClass('border-primary')
      })
      
      // Click to select Kitchen
      await user.click(kitchenButton)
      await waitFor(() => {
        expect(kitchenButton).toHaveClass('border-primary')
      })
      
      // Click WiFi again to deselect
      await user.click(wifiButton)
      await waitFor(() => {
        expect(wifiButton).not.toHaveClass('border-primary')
      })
    })

    it('should handle access codes input', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      const wifiNetworkInput = screen.getByLabelText(/network name/i)
      const wifiPasswordInput = screen.getByLabelText(/password/i)
      const doorCodeInput = screen.getByLabelText(/door code/i)
      
      await user.type(wifiNetworkInput, 'MyNetwork')
      await user.type(wifiPasswordInput, 'secretpass')
      await user.type(doorCodeInput, '9876')
      
      expect(wifiNetworkInput).toHaveValue('MyNetwork')
      expect(wifiPasswordInput).toHaveValue('secretpass')
      expect(doorCodeInput).toHaveValue('9876')
    })

    it('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      const wifiPasswordInput = screen.getByLabelText(/password/i)
      const toggleButton = screen.getAllByRole('button').find(button => 
        button.querySelector('[data-testid="eye-icon"], [data-testid="eye-off-icon"]')
      )
      
      // Initially password should be hidden
      expect(wifiPasswordInput).toHaveAttribute('type', 'password')
      
      // Click toggle to show password
      if (toggleButton) {
        await user.click(toggleButton)
        expect(wifiPasswordInput).toHaveAttribute('type', 'text')
        
        // Click again to hide
        await user.click(toggleButton)
        expect(wifiPasswordInput).toHaveAttribute('type', 'password')
      }
    })

    it('should handle additional access codes', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      // Find and click "Add Code" button
      const addCodeButton = screen.getByRole('button', { name: /add code/i })
      await user.click(addCodeButton)
      
      // Should add input fields for additional code
      const additionalInputs = await screen.findAllByPlaceholderText(/code name/i)
      expect(additionalInputs).toHaveLength(1)
      
      // Type in the additional code
      const codeNameInput = screen.getByPlaceholderText(/code name/i)
      const codeValueInput = screen.getByPlaceholderText(/access code/i)
      
      await user.type(codeNameInput, 'Garage')
      await user.type(codeValueInput, 'garage123')
      
      expect(codeNameInput).toHaveValue('Garage')
      expect(codeValueInput).toHaveValue('garage123')
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue()
      
      render(<ApartmentForm {...defaultProps} />)
      
      // Fill out required fields
      const nameInput = screen.getByLabelText(/property name/i)
      const streetInput = screen.getByLabelText(/street address/i)
      const cityInput = screen.getByLabelText(/city/i)
      const stateInput = screen.getByLabelText(/state/i)
      const zipInput = screen.getByLabelText(/zip code/i)
      const capacityInput = screen.getByLabelText(/guest capacity/i)
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Test Apartment')
      await user.type(streetInput, '123 Test St')
      await user.type(cityInput, 'Test City')
      await user.type(stateInput, 'TS')
      await user.type(zipInput, '12345')
      await user.clear(capacityInput)
      await user.type(capacityInput, '4')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save property/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })
      
      const submittedData = mockOnSubmit.mock.calls[0][0]
      expect(submittedData).toMatchObject({
        name: 'Test Apartment',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'United States',
        },
        capacity: 4,
      })
    })

    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      // Clear required field
      const nameInput = screen.getByLabelText(/property name/i)
      await user.clear(nameInput)
      
      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save property/i })
      await user.click(submitButton)
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/apartment name is required/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should handle form submission errors gracefully', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'))
      
      render(<ApartmentForm {...defaultProps} />)
      
      // Fill out minimal required data
      const nameInput = screen.getByLabelText(/property name/i)
      const streetInput = screen.getByLabelText(/street address/i)
      const cityInput = screen.getByLabelText(/city/i)
      const stateInput = screen.getByLabelText(/state/i)
      const zipInput = screen.getByLabelText(/zip code/i)
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Test Apartment')
      await user.type(streetInput, '123 Test St')
      await user.type(cityInput, 'Test City')
      await user.type(stateInput, 'TS')
      await user.type(zipInput, '12345')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save property/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })
      
      // Form should remain functional even after error
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', () => {
      render(<ApartmentForm {...defaultProps} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: /save property/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      
      expect(submitButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
      
      // Should show loading spinner
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Data Cleaning', () => {
    it('should clean up empty access codes before submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue()
      
      render(<ApartmentForm {...defaultProps} />)
      
      // Fill out required fields only
      const nameInput = screen.getByLabelText(/property name/i)
      const streetInput = screen.getByLabelText(/street address/i)
      const cityInput = screen.getByLabelText(/city/i)
      const stateInput = screen.getByLabelText(/state/i)
      const zipInput = screen.getByLabelText(/zip code/i)
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Test Apartment')
      await user.type(streetInput, '123 Test St')
      await user.type(cityInput, 'Test City')
      await user.type(stateInput, 'TS')
      await user.type(zipInput, '12345')
      
      // Leave access codes empty and submit
      const submitButton = screen.getByRole('button', { name: /save property/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })
      
      const submittedData = mockOnSubmit.mock.calls[0][0]
      // Should not include accessCodes if all are empty
      expect(submittedData.accessCodes).toBeUndefined()
    })

    it('should only include non-empty access codes', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue()
      
      render(<ApartmentForm {...defaultProps} />)
      
      // Fill required fields
      const nameInput = screen.getByLabelText(/property name/i)
      const streetInput = screen.getByLabelText(/street address/i)
      const cityInput = screen.getByLabelText(/city/i)
      const stateInput = screen.getByLabelText(/state/i)
      const zipInput = screen.getByLabelText(/zip code/i)
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Test Apartment')
      await user.type(streetInput, '123 Test St')
      await user.type(cityInput, 'Test City')
      await user.type(stateInput, 'TS')
      await user.type(zipInput, '12345')
      
      // Fill only door code
      const doorCodeInput = screen.getByLabelText(/door code/i)
      await user.type(doorCodeInput, '1234')
      
      const submitButton = screen.getByRole('button', { name: /save property/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })
      
      const submittedData = mockOnSubmit.mock.calls[0][0]
      expect(submittedData.accessCodes).toEqual({
        door: '1234'
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      render(<ApartmentForm {...defaultProps} />)
      
      // Check for proper labels
      expect(screen.getByLabelText(/property name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/guest capacity/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
      
      // Check for required field indicators (*)
      expect(screen.getByText('Property Name *')).toBeInTheDocument()
      expect(screen.getByText('Guest Capacity *')).toBeInTheDocument()
      expect(screen.getByText('Street Address *')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ApartmentForm {...defaultProps} />)
      
      const nameInput = screen.getByLabelText(/property name/i)
      const capacityInput = screen.getByLabelText(/guest capacity/i)
      
      // Tab navigation should work
      await user.tab()
      expect(nameInput).toHaveFocus()
      
      await user.tab()
      expect(capacityInput).toHaveFocus()
    })
  })
})