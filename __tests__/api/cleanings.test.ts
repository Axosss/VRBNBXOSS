import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { GET as getCleanings, POST as createCleaning } from '@/app/api/cleanings/route';
import { GET as getCleaning, PUT as updateCleaning, DELETE as deleteCleaning } from '@/app/api/cleanings/[id]/route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('/api/cleanings', () => {
  let mockSupabase: any;
  const mockUser = { id: 'user-123', email: 'owner@test.com' };
  const mockApartment = {
    id: 'apt-1',
    owner_id: 'user-123',
    name: 'Test Apartment',
    address: { street: '123 Main St', city: 'Test City' }
  };

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      neq: vi.fn(() => mockSupabase),
      gte: vi.fn(() => mockSupabase),
      lte: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      range: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      or: vi.fn(() => mockSupabase),
      limit: vi.fn(() => mockSupabase),
    };
    
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cleanings', () => {
    it('should fetch all cleanings for authenticated user', async () => {
      const mockCleanings = [
        { 
          id: 'cleaning-1', 
          apartment_id: 'apt-1',
          cleaner_id: 'cleaner-1',
          owner_id: 'user-123',
          scheduled_start: '2024-03-01T09:00:00Z',
          scheduled_end: '2024-03-01T11:00:00Z',
          status: 'scheduled',
          cleaning_type: 'standard',
          instructions: 'Please water the plants',
          apartment: mockApartment,
          cleaner: { id: 'cleaner-1', name: 'John Doe' },
        },
        { 
          id: 'cleaning-2',
          apartment_id: 'apt-1', 
          cleaner_id: null,
          owner_id: 'user-123',
          scheduled_start: '2024-03-02T14:00:00Z',
          scheduled_end: '2024-03-02T16:00:00Z',
          status: 'needed',
          cleaning_type: 'checkout',
          apartment: mockApartment,
        },
      ];

      mockSupabase.range.mockResolvedValue({ 
        data: mockCleanings, 
        error: null, 
        count: 2 
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings');
      const response = await getCleanings(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cleanings).toEqual(mockCleanings);
      expect(data.data.pagination.total).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('cleanings');
      expect(mockSupabase.eq).toHaveBeenCalledWith('apartment.owner_id', mockUser.id);
    });

    it('should apply status filter', async () => {
      mockSupabase.range.mockResolvedValue({ 
        data: [], 
        error: null, 
        count: 0 
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings?status=scheduled');
      const response = await getCleanings(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'scheduled');
    });

    it('should apply date range filters', async () => {
      mockSupabase.range.mockResolvedValue({ 
        data: [], 
        error: null, 
        count: 0 
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cleanings?startDate=2024-03-01T00:00:00Z&endDate=2024-03-31T23:59:59Z'
      );
      const response = await getCleanings(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.gte).toHaveBeenCalledWith('scheduled_start', '2024-03-01T00:00:00Z');
      expect(mockSupabase.lte).toHaveBeenCalledWith('scheduled_end', '2024-03-31T23:59:59Z');
    });

    it('should handle unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = new NextRequest('http://localhost:3000/api/cleanings');
      const response = await getCleanings(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });
  });

  describe('POST /api/cleanings', () => {
    it('should create a new cleaning', async () => {
      const newCleaning = {
        apartmentId: 'apt-1',
        cleanerId: 'cleaner-1',
        scheduledStart: '2024-03-05T10:00:00Z',
        scheduledEnd: '2024-03-05T12:00:00Z',
        cleaningType: 'standard',
        instructions: 'Use eco-friendly products',
        cost: 50,
        currency: 'EUR',
      };

      const createdCleaning = {
        id: 'cleaning-new',
        apartment_id: newCleaning.apartmentId,
        cleaner_id: newCleaning.cleanerId,
        owner_id: mockUser.id,
        scheduled_start: newCleaning.scheduledStart,
        scheduled_end: newCleaning.scheduledEnd,
        cleaning_type: newCleaning.cleaningType,
        status: 'scheduled',
        instructions: newCleaning.instructions,
        cost: newCleaning.cost,
        currency: newCleaning.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock apartment verification
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockApartment, error: null })
        // Mock cleaner verification  
        .mockResolvedValueOnce({ data: { id: 'cleaner-1', active: true }, error: null })
        // Mock created cleaning
        .mockResolvedValueOnce({ data: createdCleaning, error: null });

      // Mock conflict checks - no conflicts
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest('http://localhost:3000/api/cleanings', {
        method: 'POST',
        body: JSON.stringify(newCleaning),
      });

      const response = await createCleaning(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject(createdCleaning);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should validate scheduled_end is after scheduled_start', async () => {
      const invalidCleaning = {
        apartmentId: 'apt-1',
        scheduledStart: '2024-03-05T12:00:00Z',
        scheduledEnd: '2024-03-05T10:00:00Z', // End before start
        cleaningType: 'standard',
      };

      const request = new NextRequest('http://localhost:3000/api/cleanings', {
        method: 'POST',
        body: JSON.stringify(invalidCleaning),
      });

      const response = await createCleaning(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid input data');
    });

    it('should reject cleaning for non-owned apartment', async () => {
      const cleaningForOtherApartment = {
        apartmentId: 'other-apt',
        scheduledStart: '2024-03-05T10:00:00Z',
        scheduledEnd: '2024-03-05T12:00:00Z',
      };

      // Mock apartment not found
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const request = new NextRequest('http://localhost:3000/api/cleanings', {
        method: 'POST',
        body: JSON.stringify(cleaningForOtherApartment),
      });

      const response = await createCleaning(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Apartment not found or not owned by user');
    });

    it('should detect scheduling conflicts with reservations', async () => {
      const conflictingCleaning = {
        apartmentId: 'apt-1',
        scheduledStart: '2024-03-05T10:00:00Z',
        scheduledEnd: '2024-03-05T12:00:00Z',
      };

      // Mock apartment verification
      mockSupabase.single.mockResolvedValueOnce({ data: mockApartment, error: null });

      // Mock reservation conflict found
      mockSupabase.limit.mockResolvedValueOnce({ 
        data: [{ id: 'reservation-1' }], 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings', {
        method: 'POST',
        body: JSON.stringify(conflictingCleaning),
      });

      const response = await createCleaning(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cleaning schedule conflicts with existing reservation');
    });
  });

  describe('GET /api/cleanings/[id]', () => {
    it('should fetch a single cleaning by ID', async () => {
      const mockCleaning = { 
        id: 'cleaning-1',
        apartment_id: 'apt-1',
        cleaner_id: 'cleaner-1',
        owner_id: mockUser.id,
        scheduled_start: '2024-03-01T09:00:00Z',
        scheduled_end: '2024-03-01T11:00:00Z',
        status: 'scheduled',
        cleaning_type: 'standard',
        apartment: mockApartment,
        cleaner: { id: 'cleaner-1', name: 'John Doe' },
      };

      mockSupabase.single.mockResolvedValue({ 
        data: mockCleaning, 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings/cleaning-1');
      const response = await getCleaning(request, { params: { id: 'cleaning-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCleaning);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'cleaning-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
    });

    it('should return 404 for non-existent cleaning', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings/non-existent');
      const response = await getCleaning(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cleaning not found');
    });
  });

  describe('PUT /api/cleanings/[id]', () => {
    it('should update a cleaning', async () => {
      const updateData = {
        status: 'in_progress',
        actualStart: '2024-03-01T09:15:00Z',
        cleanerId: 'cleaner-2',
      };

      const existingCleaning = { 
        id: 'cleaning-1',
        status: 'scheduled',
        apartment_id: 'apt-1',
        scheduled_start: '2024-03-01T09:00:00Z',
        scheduled_end: '2024-03-01T11:00:00Z',
        apartment: { owner_id: mockUser.id }
      };

      const updatedCleaning = {
        ...existingCleaning,
        status: updateData.status,
        actual_start: updateData.actualStart,
        cleaner_id: updateData.cleanerId,
        updated_at: new Date().toISOString(),
      };

      // Mock checking if cleaning exists
      mockSupabase.single
        .mockResolvedValueOnce({ data: existingCleaning, error: null })
        // Mock cleaner verification
        .mockResolvedValueOnce({ data: { id: 'cleaner-2', active: true }, error: null })
        // Mock updated cleaning
        .mockResolvedValueOnce({ data: updatedCleaning, error: null });

      const request = new NextRequest('http://localhost:3000/api/cleanings/cleaning-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await updateCleaning(request, { params: { id: 'cleaning-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject(updatedCleaning);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should prevent updating cancelled cleanings', async () => {
      const existingCleaning = { 
        id: 'cleaning-1',
        status: 'cancelled',
        apartment_id: 'apt-1',
        apartment: { owner_id: mockUser.id }
      };

      mockSupabase.single.mockResolvedValueOnce({ 
        data: existingCleaning, 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings/cleaning-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'scheduled' }),
      });

      const response = await updateCleaning(request, { params: { id: 'cleaning-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cannot update cancelled cleaning');
    });

    it('should allow rating completed cleanings', async () => {
      const existingCleaning = { 
        id: 'cleaning-1',
        status: 'completed',
        apartment_id: 'apt-1',
        apartment: { owner_id: mockUser.id }
      };

      const updateData = {
        rating: 5,
        notes: 'Excellent work!'
      };

      const updatedCleaning = {
        ...existingCleaning,
        rating: updateData.rating,
        notes: updateData.notes,
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: existingCleaning, error: null })
        .mockResolvedValueOnce({ data: updatedCleaning, error: null });

      const request = new NextRequest('http://localhost:3000/api/cleanings/cleaning-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await updateCleaning(request, { params: { id: 'cleaning-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.rating).toBe(5);
    });
  });

  describe('DELETE /api/cleanings/[id]', () => {
    it('should cancel a scheduled cleaning', async () => {
      const existingCleaning = { 
        id: 'cleaning-1',
        status: 'scheduled',
        apartment: { owner_id: mockUser.id }
      };

      mockSupabase.single.mockResolvedValue({ 
        data: existingCleaning, 
        error: null 
      });
      
      mockSupabase.update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings/cleaning-1', {
        method: 'DELETE',
      });

      const response = await deleteCleaning(request, { params: { id: 'cleaning-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cleaning cancelled successfully');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' })
      );
    });

    it('should prevent cancelling in-progress cleanings', async () => {
      const existingCleaning = { 
        id: 'cleaning-1',
        status: 'in_progress',
        apartment: { owner_id: mockUser.id }
      };

      mockSupabase.single.mockResolvedValue({ 
        data: existingCleaning, 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings/cleaning-1', {
        method: 'DELETE',
      });

      const response = await deleteCleaning(request, { params: { id: 'cleaning-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cannot cancel cleaning that is in progress');
    });

    it('should prevent cancelling completed cleanings', async () => {
      const existingCleaning = { 
        id: 'cleaning-1',
        status: 'completed',
        apartment: { owner_id: mockUser.id }
      };

      mockSupabase.single.mockResolvedValue({ 
        data: existingCleaning, 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/cleanings/cleaning-1', {
        method: 'DELETE',
      });

      const response = await deleteCleaning(request, { params: { id: 'cleaning-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cannot cancel completed cleaning');
    });
  });
});