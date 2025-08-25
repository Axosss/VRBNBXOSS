import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { ReservationCard } from '@/components/reservations/reservation-card'
import { ReservationList } from '@/components/reservations/reservation-list'

// Extend matchers for accessibility testing
expect.extend(toHaveNoViolations)

describe('Reservation Components Accessibility Tests', () => {
  describe('ReservationForm Accessibility', () => {
    const mockOnSubmit = vi.fn()
    const mockOnCancel = vi.fn()
    
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ReservationForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels on all form elements', () => {
      render(
        <ReservationForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Check for labels on important form elements
      expect(screen.getByLabelText(/property/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/check-in date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/check-out date/i)).toBeInTheDocument()
      
      // Progress indicator should have proper ARIA
      const progressSteps = screen.getAllByRole('listitem')
      expect(progressSteps.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation through entire form', async () => {
      const user = userEvent.setup()
      
      render(
        <ReservationForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Start with first focusable element
      await user.tab()
      
      // Property select should be focused
      const propertySelect = screen.getByRole('combobox', { name: /property/i })
      expect(propertySelect).toHaveFocus()

      // Tab to check-in date
      await user.tab()
      const checkInInput = screen.getByLabelText(/check-in date/i)
      expect(checkInInput).toHaveFocus()

      // Tab to check-out date
      await user.tab()
      const checkOutInput = screen.getByLabelText(/check-out date/i)
      expect(checkOutInput).toHaveFocus()

      // Should be able to navigate backward with Shift+Tab
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      expect(checkInInput).toHaveFocus()
    })

    it('should announce form validation errors to screen readers', async () => {
      const user = userEvent.setup()
      
      render(
        <ReservationForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Try to proceed without filling required fields
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Error messages should have proper ARIA attributes
      await waitFor(() => {
        const errorMessages = screen.queryAllByRole('alert')
        expect(errorMessages.length).toBeGreaterThan(0)
        
        errorMessages.forEach(error => {
          expect(error).toHaveAttribute('aria-live', 'polite')
        })
      })
    })

    it('should maintain focus management during multi-step navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <ReservationForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Fill required fields for step 1
      const propertySelect = screen.getByRole('combobox', { name: /property/i })
      await user.click(propertySelect)
      
      // Select first option (mocked)
      const options = await screen.findAllByRole('option')
      if (options.length > 0) {
        await user.click(options[0])
      }

      const checkInInput = screen.getByLabelText(/check-in date/i)
      await user.type(checkInInput, '2024-03-15')

      const checkOutInput = screen.getByLabelText(/check-out date/i)
      await user.type(checkOutInput, '2024-03-20')

      // Check availability
      const availabilityButton = screen.getByRole('button', { name: /check availability/i })
      await user.click(availabilityButton)

      // Proceed to next step
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Focus should move to first element of new step
      await waitFor(() => {
        const guestNameInput = screen.queryByLabelText(/guest name/i)
        if (guestNameInput) {
          expect(document.activeElement).toBe(guestNameInput)
        }
      })
    })

    it('should provide proper contrast ratios for all text', async () => {
      const { container } = render(
        <ReservationForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Use axe to check color contrast
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })

      expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0)
    })

    it('should handle focus trapping in modals/dialogs', async () => {
      const user = userEvent.setup()
      
      render(
        <ReservationForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // If there's a modal/dialog (e.g., confirmation dialog)
      // it should trap focus within the dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Check if confirmation dialog appears
      const dialog = screen.queryByRole('dialog')
      if (dialog) {
        // Focus should be trapped within dialog
        const focusableElements = within(dialog).getAllByRole('button')
        
        // Tab through elements
        for (let i = 0; i < focusableElements.length + 1; i++) {
          await user.tab()
        }
        
        // Focus should cycle back to first element
        expect(focusableElements[0]).toHaveFocus()
      }
    })

    it('should support screen reader announcements for dynamic content', async () => {
      const user = userEvent.setup()
      
      render(
        <ReservationForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )

      // Check availability button
      const availabilityButton = screen.queryByRole('button', { name: /check availability/i })
      if (availabilityButton) {
        await user.click(availabilityButton)

        // Status messages should be announced
        await waitFor(() => {
          const statusMessage = screen.queryByText(/available|not available/i)
          if (statusMessage) {
            const container = statusMessage.closest('[role="status"]') || 
                            statusMessage.closest('[aria-live]')
            expect(container).toHaveAttribute('aria-live', expect.stringMatching(/polite|assertive/))
          }
        })
      }
    })
  })

  describe('ReservationCard Accessibility', () => {
    const mockReservation = {
      id: 'res-123',
      apartmentId: 'apt-123',
      apartment: {
        name: 'Test Apartment',
        address: { street: '123 Test St', city: 'Test City' }
      },
      guestId: 'guest-123',
      guest: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      checkIn: '2024-03-15',
      checkOut: '2024-03-20',
      platform: 'airbnb',
      status: 'confirmed',
      totalPrice: 500,
      guestCount: 2
    }

    it('should have proper semantic HTML structure', () => {
      render(<ReservationCard reservation={mockReservation} />)

      // Should use article or section for semantic meaning
      const card = screen.getByRole('article') || screen.getByRole('region')
      expect(card).toBeInTheDocument()

      // Should have proper heading hierarchy
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('should provide accessible status indicators', () => {
      render(<ReservationCard reservation={mockReservation} />)

      // Status badge should have proper ARIA label
      const statusBadge = screen.getByText(/confirmed/i)
      expect(statusBadge).toHaveAttribute('aria-label', expect.stringContaining('status'))
    })

    it('should have keyboard accessible actions', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()
      
      render(
        <ReservationCard 
          reservation={mockReservation} 
          onClick={mockOnClick}
        />
      )

      // Card should be keyboard focusable if clickable
      const card = screen.getByRole('article') || screen.getByRole('button')
      
      // Focus the card
      await user.tab()
      
      // Activate with Enter key
      await user.keyboard('{Enter}')
      expect(mockOnClick).toHaveBeenCalled()

      // Should also work with Space key
      mockOnClick.mockClear()
      await user.keyboard(' ')
      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  describe('ReservationList Accessibility', () => {
    const mockReservations = [
      {
        id: 'res-1',
        apartmentId: 'apt-1',
        checkIn: '2024-03-15',
        checkOut: '2024-03-20',
        platform: 'airbnb',
        status: 'confirmed',
        totalPrice: 500,
        guestCount: 2
      },
      {
        id: 'res-2',
        apartmentId: 'apt-2',
        checkIn: '2024-03-25',
        checkOut: '2024-03-30',
        platform: 'vrbo',
        status: 'pending',
        totalPrice: 600,
        guestCount: 3
      }
    ]

    it('should use proper list semantics', () => {
      render(<ReservationList reservations={mockReservations} />)

      // Should use ul/ol and li elements or have list role
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()

      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(mockReservations.length)
    })

    it('should announce list updates to screen readers', async () => {
      const { rerender } = render(
        <ReservationList reservations={mockReservations} />
      )

      // Add a new reservation
      const updatedReservations = [
        ...mockReservations,
        {
          id: 'res-3',
          apartmentId: 'apt-3',
          checkIn: '2024-04-01',
          checkOut: '2024-04-05',
          platform: 'direct',
          status: 'confirmed',
          totalPrice: 700,
          guestCount: 4
        }
      ]

      rerender(<ReservationList reservations={updatedReservations} />)

      // Should have ARIA live region for updates
      const liveRegion = screen.queryByRole('status') || 
                        screen.queryByLabelText(/reservations updated/i)
      if (liveRegion) {
        expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      }
    })

    it('should support keyboard navigation through list items', async () => {
      const user = userEvent.setup()
      
      render(<ReservationList reservations={mockReservations} />)

      // Tab through list items
      for (let i = 0; i < mockReservations.length; i++) {
        await user.tab()
        
        // Each item should be focusable
        const focusedElement = document.activeElement
        expect(focusedElement).toBeTruthy()
        expect(focusedElement?.getAttribute('role')).toMatch(/button|link|listitem/)
      }
    })

    it('should provide accessible sorting controls', () => {
      render(<ReservationList reservations={mockReservations} showSorting />)

      // Sort buttons should have proper labels
      const sortButtons = screen.queryAllByRole('button', { name: /sort by/i })
      
      sortButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
        // Should indicate current sort state
        expect(button).toHaveAttribute('aria-pressed')
      })
    })

    it('should handle empty states accessibly', () => {
      render(<ReservationList reservations={[]} />)

      // Empty state message should be announced
      const emptyMessage = screen.getByText(/no reservations/i)
      expect(emptyMessage).toBeInTheDocument()
      
      // Should have proper role for screen readers
      const emptyContainer = emptyMessage.closest('[role]')
      expect(emptyContainer).toHaveAttribute('role', expect.stringMatching(/status|alert/))
    })
  })

  describe('Mobile Accessibility', () => {
    it('should have adequate touch target sizes', () => {
      render(
        <ReservationForm
          mode="create"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // All interactive elements should be at least 44x44px (WCAG guideline)
      const buttons = screen.getAllByRole('button')
      const inputs = screen.getAllByRole('textbox')
      const selects = screen.getAllByRole('combobox')

      [...buttons, ...inputs, ...selects].forEach(element => {
        const styles = window.getComputedStyle(element)
        const height = parseInt(styles.height)
        const width = parseInt(styles.width)
        
        // Elements should meet minimum touch target size
        expect(height).toBeGreaterThanOrEqual(44)
        expect(width).toBeGreaterThanOrEqual(44)
      })
    })

    it('should support gesture alternatives', () => {
      render(<ReservationList reservations={[]} />)

      // Swipe actions should have button alternatives
      const actionButtons = screen.queryAllByRole('button', { name: /edit|delete|view/i })
      expect(actionButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Focus Indicators', () => {
    it('should have visible focus indicators on all interactive elements', () => {
      const { container } = render(
        <ReservationForm
          mode="create"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Check that focus styles are defined
      const styles = window.getComputedStyle(container)
      const focusableElements = container.querySelectorAll(
        'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
      )

      focusableElements.forEach(element => {
        element.focus()
        const focusStyles = window.getComputedStyle(element)
        
        // Should have visible focus indicator (outline, border, or box-shadow)
        const hasOutline = focusStyles.outlineWidth !== '0px'
        const hasBoxShadow = focusStyles.boxShadow !== 'none'
        const hasBorderChange = focusStyles.borderColor !== styles.borderColor
        
        expect(hasOutline || hasBoxShadow || hasBorderChange).toBe(true)
      })
    })
  })
})