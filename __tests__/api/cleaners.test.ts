import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { GET as getCleaners, POST as createCleaner } from '@/app/api/cleaners/route';
import { GET as getCleaner, PUT as updateCleaner, DELETE as deleteCleaner } from '@/app/api/cleaners/[id]/route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('/api/cleaners', () => {
  let mockSupabase: any;
  const mockUser = { id: 'user-123', email: 'owner@test.com' };

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      range: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      or: vi.fn(() => mockSupabase),
      gte: vi.fn(() => mockSupabase),
    };
    
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cleaners', () => {
    it('should fetch all cleaners for authenticated user', async () => {
      const mockCleaners = [
        { 
          id: 'cleaner-1', 
          owner_id: 'user-123', 
          name: 'John Doe', 
          email: 'john@test.com',
          phone: '123456789',
          hourly_rate: 25,
          flat_rate: null,
          currency: 'EUR',
          active: true,
          rating: 4.5,
          services: ['standard', 'deep'],
        },
        { 
          id: 'cleaner-2', 
          owner_id: 'user-123', 
          name: 'Jane Smith', 
          email: 'jane@test.com',
          phone: '987654321',
          hourly_rate: null,
          flat_rate: 60,
          currency: 'EUR',
          active: true,
          rating: 5,
          services: ['standard'],
        },
      ];

      mockSupabase.range.mockResolvedValue({ 
        data: mockCleaners, 
        error: null, 
        count: 2 
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners');
      const response = await getCleaners(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cleaners).toEqual(mockCleaners);
      expect(data.data.pagination.total).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('cleaners');
      expect(mockSupabase.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
    });

    it('should apply filters correctly', async () => {
      mockSupabase.range.mockResolvedValue({ 
        data: [], 
        error: null, 
        count: 0 
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners?active=true&search=john&minRating=4');
      const response = await getCleaners(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('active', true);
      expect(mockSupabase.gte).toHaveBeenCalledWith('rating', 4);
      expect(mockSupabase.or).toHaveBeenCalledWith(expect.stringContaining('john'));
    });

    it('should handle unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = new NextRequest('http://localhost:3000/api/cleaners');
      const response = await getCleaners(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.range.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' },
        count: null 
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners');
      const response = await getCleaners(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Database error');
    });
  });

  describe('POST /api/cleaners', () => {
    it('should create a new cleaner', async () => {
      const newCleaner = {
        name: 'New Cleaner',
        email: 'new@test.com',
        phone: '555-0123',
        hourlyRate: 30,
        currency: 'EUR',
      };

      const createdCleaner = {
        id: 'cleaner-new',
        owner_id: mockUser.id,
        ...newCleaner,
        hourly_rate: newCleaner.hourlyRate,
        flat_rate: null,
        active: true,
        services: [],
        rating: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({ 
        data: createdCleaner, 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners', {
        method: 'POST',
        body: JSON.stringify(newCleaner),
      });

      const response = await createCleaner(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(createdCleaner);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidCleaner = {
        email: 'invalid@test.com',
        // missing name
      };

      const request = new NextRequest('http://localhost:3000/api/cleaners', {
        method: 'POST',
        body: JSON.stringify(invalidCleaner),
      });

      const response = await createCleaner(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid input data');
    });

    it('should handle duplicate cleaner names', async () => {
      const duplicateCleaner = {
        name: 'Existing Cleaner',
        email: 'existing@test.com',
      };

      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'duplicate key value violates unique constraint' }
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners', {
        method: 'POST',
        body: JSON.stringify(duplicateCleaner),
      });

      const response = await createCleaner(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/cleaners/[id]', () => {
    it('should fetch a single cleaner by ID', async () => {
      const mockCleaner = { 
        id: 'cleaner-1', 
        owner_id: mockUser.id, 
        name: 'John Doe',
        email: 'john@test.com',
        phone: '123456789',
        hourly_rate: 25,
        flat_rate: null,
        currency: 'EUR',
        active: true,
        rating: 4.5,
        services: ['standard', 'deep'],
      };

      mockSupabase.single.mockResolvedValue({ 
        data: mockCleaner, 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners/cleaner-1');
      const response = await getCleaner(request, { params: Promise.resolve({ id: 'cleaner-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCleaner);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'cleaner-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
    });

    it('should return 404 for non-existent cleaner', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners/non-existent');
      const response = await getCleaner(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cleaner not found');
    });

    it('should validate UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/cleaners/invalid-id');
      const response = await getCleaner(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid cleaner ID');
    });
  });

  describe('PUT /api/cleaners/[id]', () => {
    it('should update a cleaner', async () => {
      const updateData = {
        name: 'Updated Name',
        hourlyRate: 35,
        email: 'updated@test.com',
      };

      const existingCleaner = { id: 'cleaner-1' };
      const updatedCleaner = {
        id: 'cleaner-1',
        owner_id: mockUser.id,
        name: 'Updated Name',
        email: 'updated@test.com',
        hourly_rate: 35,
        updated_at: new Date().toISOString(),
      };

      // Mock checking if cleaner exists
      mockSupabase.single
        .mockResolvedValueOnce({ data: existingCleaner, error: null })
        .mockResolvedValueOnce({ data: updatedCleaner, error: null });

      const request = new NextRequest('http://localhost:3000/api/cleaners/cleaner-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await updateCleaner(request, { params: Promise.resolve({ id: 'cleaner-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedCleaner);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should return 404 if cleaner does not exist', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });

      const response = await updateCleaner(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cleaner not found');
    });

    it('should validate input data', async () => {
      const invalidData = {
        email: 'invalid-email', // Invalid email format
        hourlyRate: -10, // Negative rate
      };

      const request = new NextRequest('http://localhost:3000/api/cleaners/cleaner-1', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      const response = await updateCleaner(request, { params: Promise.resolve({ id: 'cleaner-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid input data');
    });
  });

  describe('DELETE /api/cleaners/[id]', () => {
    it('should delete a cleaner', async () => {
      const existingCleaner = { id: 'cleaner-1' };

      mockSupabase.single.mockResolvedValue({ 
        data: existingCleaner, 
        error: null 
      });
      
      mockSupabase.delete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners/cleaner-1', {
        method: 'DELETE',
      });

      const response = await deleteCleaner(request, { params: Promise.resolve({ id: 'cleaner-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cleaner deleted successfully');
    });

    it('should return 404 if cleaner does not exist', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' }
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners/non-existent', {
        method: 'DELETE',
      });

      const response = await deleteCleaner(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Cleaner not found');
    });

    it('should handle cleaners with active cleanings', async () => {
      const existingCleaner = { id: 'cleaner-1' };

      mockSupabase.single.mockResolvedValue({ 
        data: existingCleaner, 
        error: null 
      });
      
      mockSupabase.delete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            error: { message: 'violates foreign key constraint' }
          })
        })
      });

      const request = new NextRequest('http://localhost:3000/api/cleaners/cleaner-1', {
        method: 'DELETE',
      });

      const response = await deleteCleaner(request, { params: Promise.resolve({ id: 'cleaner-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});