import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  Cleaning, 
  Cleaner, 
  CleaningFilters, 
  CleanerFilters,
  CreateCleaningData,
  UpdateCleaningData,
  CreateCleanerData,
  UpdateCleanerData
} from '@/types/cleaning';

interface CleaningState {
  // Cleanings
  cleanings: Cleaning[];
  cleaningPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  cleaningFilters: CleaningFilters;
  selectedCleaning: Cleaning | null;
  
  // Cleaners
  cleaners: Cleaner[];
  cleanerPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  cleanerFilters: CleanerFilters;
  selectedCleaner: Cleaner | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Cleaning Actions
  fetchCleanings: (filters?: CleaningFilters) => Promise<void>;
  fetchCleaning: (id: string) => Promise<void>;
  createCleaning: (data: CreateCleaningData) => Promise<Cleaning>;
  updateCleaning: (id: string, data: UpdateCleaningData) => Promise<Cleaning>;
  cancelCleaning: (id: string) => Promise<void>;
  setCleaningFilters: (filters: Partial<CleaningFilters>) => void;
  
  // Cleaner Actions
  fetchCleaners: (filters?: CleanerFilters) => Promise<void>;
  fetchCleaner: (id: string) => Promise<void>;
  createCleaner: (data: CreateCleanerData) => Promise<Cleaner>;
  updateCleaner: (id: string, data: UpdateCleanerData) => Promise<Cleaner>;
  deleteCleaner: (id: string) => Promise<void>;
  setCleanerFilters: (filters: Partial<CleanerFilters>) => void;
  
  // Utility Actions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  cleanings: [],
  cleaningPagination: null,
  cleaningFilters: {},
  selectedCleaning: null,
  cleaners: [],
  cleanerPagination: null,
  cleanerFilters: {},
  selectedCleaner: null,
  isLoading: false,
  error: null,
};

export const useCleaningStore = create<CleaningState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Cleaning Actions
      fetchCleanings: async (filters = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
          
          const response = await fetch(`/api/cleanings?${params}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch cleanings');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to fetch cleanings');
          }
          
          set({
            cleanings: data.data.cleanings,
            cleaningPagination: data.data.pagination,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch cleanings',
            isLoading: false,
          });
        }
      },
      
      fetchCleaning: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/cleanings/${id}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch cleaning');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to fetch cleaning');
          }
          
          set({
            selectedCleaning: data.data,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch cleaning',
            isLoading: false,
          });
        }
      },
      
      createCleaning: async (cleaningData: CreateCleaningData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/cleanings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleaningData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create cleaning');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to create cleaning');
          }
          
          const newCleaning = data.data;
          set((state) => ({
            cleanings: [newCleaning, ...state.cleanings],
            isLoading: false,
          }));
          
          return newCleaning;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create cleaning',
            isLoading: false,
          });
          throw error;
        }
      },
      
      updateCleaning: async (id: string, updateData: UpdateCleaningData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/cleanings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update cleaning');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to update cleaning');
          }
          
          const updatedCleaning = data.data;
          set((state) => ({
            cleanings: state.cleanings.map(c => 
              c.id === id ? updatedCleaning : c
            ),
            selectedCleaning: state.selectedCleaning?.id === id 
              ? updatedCleaning 
              : state.selectedCleaning,
            isLoading: false,
          }));
          
          return updatedCleaning;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update cleaning',
            isLoading: false,
          });
          throw error;
        }
      },
      
      cancelCleaning: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/cleanings/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to cancel cleaning');
          }
          
          set((state) => ({
            cleanings: state.cleanings.map(c => 
              c.id === id ? { ...c, status: 'cancelled' as const } : c
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to cancel cleaning',
            isLoading: false,
          });
          throw error;
        }
      },
      
      setCleaningFilters: (filters: Partial<CleaningFilters>) => {
        set((state) => ({
          cleaningFilters: { ...state.cleaningFilters, ...filters },
        }));
      },
      
      // Cleaner Actions
      fetchCleaners: async (filters = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
          
          const response = await fetch(`/api/cleaners?${params}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch cleaners');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to fetch cleaners');
          }
          
          set({
            cleaners: data.data.cleaners,
            cleanerPagination: data.data.pagination,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch cleaners',
            isLoading: false,
          });
        }
      },
      
      fetchCleaner: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/cleaners/${id}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch cleaner');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to fetch cleaner');
          }
          
          set({
            selectedCleaner: data.data,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch cleaner',
            isLoading: false,
          });
        }
      },
      
      createCleaner: async (cleanerData: CreateCleanerData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/cleaners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanerData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create cleaner');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to create cleaner');
          }
          
          const newCleaner = data.data;
          set((state) => ({
            cleaners: [newCleaner, ...state.cleaners],
            isLoading: false,
          }));
          
          return newCleaner;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create cleaner',
            isLoading: false,
          });
          throw error;
        }
      },
      
      updateCleaner: async (id: string, updateData: UpdateCleanerData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/cleaners/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update cleaner');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to update cleaner');
          }
          
          const updatedCleaner = data.data;
          set((state) => ({
            cleaners: state.cleaners.map(c => 
              c.id === id ? updatedCleaner : c
            ),
            selectedCleaner: state.selectedCleaner?.id === id 
              ? updatedCleaner 
              : state.selectedCleaner,
            isLoading: false,
          }));
          
          return updatedCleaner;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update cleaner',
            isLoading: false,
          });
          throw error;
        }
      },
      
      deleteCleaner: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/cleaners/${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete cleaner');
          }
          
          set((state) => ({
            cleaners: state.cleaners.filter(c => c.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete cleaner',
            isLoading: false,
          });
          throw error;
        }
      },
      
      setCleanerFilters: (filters: Partial<CleanerFilters>) => {
        set((state) => ({
          cleanerFilters: { ...state.cleanerFilters, ...filters },
        }));
      },
      
      // Utility Actions
      clearError: () => set({ error: null }),
      
      reset: () => set(initialState),
    }),
    { name: 'cleaning-store' }
  )
);