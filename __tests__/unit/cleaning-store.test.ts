import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCleaningStore } from '@/lib/stores/cleaning-store';

// Mock fetch globally
global.fetch = vi.fn();

describe('useCleaningStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCleaningStore());
    act(() => {
      result.current.cleanings = [];
      result.current.cleaners = [];
      result.current.selectedCleaning = null;
      result.current.filters = {
        apartmentId: undefined,
        cleanerId: undefined,
        status: undefined,
        cleaningType: undefined,
        startDate: undefined,
        endDate: undefined,
        search: undefined,
      };
      result.current.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };
      result.current.isLoading = false;
      result.current.error = null;
    });
    vi.clearAllMocks();
  });

  describe('fetchCleanings', () => {
    it('should fetch cleanings successfully', async () => {
      const mockCleanings = [
        {
          id: 'cleaning-1',
          apartment_id: 'apt-1',
          scheduled_start: '2024-03-01T09:00:00Z',
          scheduled_end: '2024-03-01T11:00:00Z',
          status: 'scheduled',
          cleaning_type: 'standard',
        },
        {
          id: 'cleaning-2',
          apartment_id: 'apt-2',
          scheduled_start: '2024-03-02T14:00:00Z',
          scheduled_end: '2024-03-02T16:00:00Z',
          status: 'completed',
          cleaning_type: 'deep',
        },
      ];

      const mockResponse = {
        success: true,
        data: {
          cleanings: mockCleanings,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.fetchCleanings();
      });

      expect(result.current.cleanings).toEqual(mockCleanings);
      expect(result.current.pagination.total).toBe(2);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch cleanings error', async () => {
      const mockError = { success: false, message: 'Failed to fetch cleanings' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.fetchCleanings();
      });

      expect(result.current.cleanings).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch cleanings');
      expect(result.current.isLoading).toBe(false);
    });

    it('should apply filters when fetching cleanings', async () => {
      const mockResponse = {
        success: true,
        data: {
          cleanings: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCleaningStore());

      act(() => {
        result.current.setFilters({
          status: 'scheduled',
          apartmentId: 'apt-1',
          cleaningType: 'standard',
        });
      });

      await act(async () => {
        await result.current.fetchCleanings();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=scheduled&apartmentId=apt-1&cleaningType=standard')
      );
    });
  });

  describe('fetchCleaners', () => {
    it('should fetch cleaners successfully', async () => {
      const mockCleaners = [
        {
          id: 'cleaner-1',
          name: 'John Doe',
          email: 'john@test.com',
          phone: '123456789',
          hourly_rate: 25,
          active: true,
        },
        {
          id: 'cleaner-2',
          name: 'Jane Smith',
          email: 'jane@test.com',
          phone: '987654321',
          flat_rate: 60,
          active: true,
        },
      ];

      const mockResponse = {
        success: true,
        data: {
          cleaners: mockCleaners,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.fetchCleaners();
      });

      expect(result.current.cleaners).toEqual(mockCleaners);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch cleaners error', async () => {
      const mockError = { success: false, message: 'Failed to fetch cleaners' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.fetchCleaners();
      });

      expect(result.current.cleaners).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch cleaners');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createCleaning', () => {
    it('should create a cleaning successfully', async () => {
      const newCleaning = {
        apartmentId: 'apt-1',
        cleanerId: 'cleaner-1',
        scheduledStart: '2024-03-05T10:00:00Z',
        scheduledEnd: '2024-03-05T12:00:00Z',
        cleaningType: 'standard' as const,
        instructions: 'Test instructions',
      };

      const createdCleaning = {
        id: 'cleaning-new',
        apartment_id: newCleaning.apartmentId,
        cleaner_id: newCleaning.cleanerId,
        scheduled_start: newCleaning.scheduledStart,
        scheduled_end: newCleaning.scheduledEnd,
        cleaning_type: newCleaning.cleaningType,
        status: 'scheduled',
        instructions: newCleaning.instructions,
      };

      const mockResponse = {
        success: true,
        data: createdCleaning,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.createCleaning(newCleaning);
      });

      expect(result.current.cleanings).toContainEqual(createdCleaning);
      expect(result.current.error).toBeNull();
    });

    it('should handle create cleaning error', async () => {
      const newCleaning = {
        apartmentId: 'apt-1',
        scheduledStart: '2024-03-05T10:00:00Z',
        scheduledEnd: '2024-03-05T12:00:00Z',
      };

      const mockError = { success: false, message: 'Validation error' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.createCleaning(newCleaning);
      });

      expect(result.current.cleanings).toEqual([]);
      expect(result.current.error).toBe('Validation error');
    });
  });

  describe('updateCleaning', () => {
    it('should update a cleaning successfully', async () => {
      const existingCleaning = {
        id: 'cleaning-1',
        apartment_id: 'apt-1',
        scheduled_start: '2024-03-01T09:00:00Z',
        scheduled_end: '2024-03-01T11:00:00Z',
        status: 'scheduled' as const,
        cleaning_type: 'standard' as const,
      };

      const updateData = {
        status: 'in_progress' as const,
        actualStart: '2024-03-01T09:15:00Z',
      };

      const updatedCleaning = {
        ...existingCleaning,
        status: updateData.status,
        actual_start: updateData.actualStart,
      };

      const mockResponse = {
        success: true,
        data: updatedCleaning,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCleaningStore());

      // Set initial cleaning
      act(() => {
        result.current.cleanings = [existingCleaning];
      });

      await act(async () => {
        await result.current.updateCleaning('cleaning-1', updateData);
      });

      expect(result.current.cleanings[0]).toEqual(updatedCleaning);
      expect(result.current.error).toBeNull();
    });

    it('should handle update cleaning error', async () => {
      const mockError = { success: false, message: 'Update failed' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.updateCleaning('cleaning-1', { status: 'completed' });
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('deleteCleaning', () => {
    it('should delete a cleaning successfully', async () => {
      const cleaningToDelete = {
        id: 'cleaning-1',
        apartment_id: 'apt-1',
        scheduled_start: '2024-03-01T09:00:00Z',
        scheduled_end: '2024-03-01T11:00:00Z',
        status: 'scheduled',
      };

      const mockResponse = {
        success: true,
        message: 'Cleaning cancelled successfully',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCleaningStore());

      // Set initial cleaning
      act(() => {
        result.current.cleanings = [cleaningToDelete];
      });

      await act(async () => {
        await result.current.deleteCleaning('cleaning-1');
      });

      // The cleaning should be updated to cancelled status, not removed
      expect(result.current.cleanings[0].status).toBe('cancelled');
      expect(result.current.error).toBeNull();
    });

    it('should handle delete cleaning error', async () => {
      const mockError = { success: false, message: 'Cannot cancel completed cleaning' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.deleteCleaning('cleaning-1');
      });

      expect(result.current.error).toBe('Cannot cancel completed cleaning');
    });
  });

  describe('createCleaner', () => {
    it('should create a cleaner successfully', async () => {
      const newCleaner = {
        name: 'New Cleaner',
        email: 'new@test.com',
        phone: '555-0123',
        hourlyRate: 30,
      };

      const createdCleaner = {
        id: 'cleaner-new',
        name: newCleaner.name,
        email: newCleaner.email,
        phone: newCleaner.phone,
        hourly_rate: newCleaner.hourlyRate,
        active: true,
      };

      const mockResponse = {
        success: true,
        data: createdCleaner,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCleaningStore());

      await act(async () => {
        await result.current.createCleaner(newCleaner);
      });

      expect(result.current.cleaners).toContainEqual(createdCleaner);
      expect(result.current.error).toBeNull();
    });
  });

  describe('filters and pagination', () => {
    it('should set filters correctly', () => {
      const { result } = renderHook(() => useCleaningStore());

      const newFilters = {
        status: 'scheduled' as const,
        apartmentId: 'apt-1',
        cleaningType: 'deep' as const,
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
    });

    it('should reset filters', () => {
      const { result } = renderHook(() => useCleaningStore());

      // Set some filters first
      act(() => {
        result.current.setFilters({
          status: 'scheduled' as const,
          apartmentId: 'apt-1',
        });
      });

      // Reset filters
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual({
        apartmentId: undefined,
        cleanerId: undefined,
        status: undefined,
        cleaningType: undefined,
        startDate: undefined,
        endDate: undefined,
        search: undefined,
      });
      expect(result.current.pagination.page).toBe(1);
    });

    it('should set page correctly', () => {
      const { result } = renderHook(() => useCleaningStore());

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.pagination.page).toBe(3);
    });

    it('should set selected cleaning', () => {
      const { result } = renderHook(() => useCleaningStore());

      const cleaning = {
        id: 'cleaning-1',
        apartment_id: 'apt-1',
        scheduled_start: '2024-03-01T09:00:00Z',
        scheduled_end: '2024-03-01T11:00:00Z',
        status: 'scheduled' as const,
      };

      act(() => {
        result.current.setSelectedCleaning(cleaning);
      });

      expect(result.current.selectedCleaning).toEqual(cleaning);
    });
  });

  describe('availability check', () => {
    it('should check availability successfully', async () => {
      const mockAvailability = {
        date: '2024-03-05',
        available_slots: [
          { start: '09:00', end: '11:00', available: true },
          { start: '14:00', end: '16:00', available: true },
        ],
        cleaners: [
          { cleaner_id: 'cleaner-1', cleaner_name: 'John Doe', available: true },
        ],
        conflicts: [],
      };

      const mockResponse = {
        success: true,
        data: mockAvailability,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCleaningStore());

      let availability;
      await act(async () => {
        availability = await result.current.checkAvailability({
          apartmentId: 'apt-1',
          date: '2024-03-05T10:00:00Z',
        });
      });

      expect(availability).toEqual(mockAvailability);
      expect(result.current.error).toBeNull();
    });
  });
});