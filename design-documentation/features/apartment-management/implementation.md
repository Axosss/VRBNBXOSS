---
title: Apartment Management - Developer Implementation Guide
description: Technical implementation specifications for apartment management features
feature: Apartment Management
last-updated: 2025-01-22
version: 1.0
related-files: 
  - README.md
  - user-journey.md
  - screen-states.md
dependencies:
  - Supabase Storage
  - Edge Functions for image processing
  - PostgreSQL with RLS
status: approved
---

# Apartment Management - Developer Implementation Guide

## Technical Architecture

### Database Schema
```sql
-- Apartments table
CREATE TABLE apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  bedrooms INTEGER,
  bathrooms DECIMAL,
  amenities TEXT[],
  photos TEXT[],
  access_codes JSONB, -- Encrypted
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can access their apartments" ON apartments
  FOR ALL USING (auth.uid() = owner_id);
```

### Photo Upload Implementation
```typescript
// components/photo-upload.tsx
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface PhotoUploadProps {
  apartmentId: string
  onPhotosUploaded: (urls: string[]) => void
}

export function PhotoUpload({ apartmentId, onPhotosUploaded }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const supabase = createClient()

  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${apartmentId}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('apartment-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error
      return data.path
    })

    try {
      const paths = await Promise.all(uploadPromises)
      const publicUrls = paths.map(path => 
        supabase.storage
          .from('apartment-photos')
          .getPublicUrl(path).data.publicUrl
      )
      
      onPhotosUploaded(publicUrls)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="photo-upload-container">
      {/* Drag and drop interface */}
      <div 
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
        />
        <div className="upload-prompt">
          <p>Drag photos here or click to select</p>
          {uploading && <div>Uploading...</div>}
        </div>
      </div>
    </div>
  )
}
```

### Form Validation
```typescript
import * as z from 'zod'

export const apartmentSchema = z.object({
  name: z.string()
    .min(1, 'Apartment name is required')
    .max(100, 'Name must be less than 100 characters'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(5, 'Valid ZIP code required'),
    country: z.string().default('US')
  }),
  capacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(20, 'Capacity cannot exceed 20'),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  amenities: z.array(z.string()).default([]),
  accessCodes: z.object({
    wifi: z.object({
      network: z.string().optional(),
      password: z.string().optional()
    }).optional(),
    door: z.string().optional(),
    smartLock: z.string().optional()
  }).optional()
})

export type ApartmentFormData = z.infer<typeof apartmentSchema>
```

### API Routes
```typescript
// app/api/apartments/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { apartmentSchema } from '@/lib/validations/apartment'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = apartmentSchema.parse(body)

    // Encrypt sensitive data
    const encryptedAccessCodes = validatedData.accessCodes ? 
      await encryptSensitiveData(validatedData.accessCodes) : null

    const { data, error } = await supabase
      .from('apartments')
      .insert({
        ...validatedData,
        owner_id: user.id,
        access_codes: encryptedAccessCodes
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Performance Optimizations
- **Image Optimization:** Automatic compression via Edge Functions
- **Lazy Loading:** Virtual scrolling for large apartment lists
- **Caching:** Strategic caching of apartment data and photos
- **Bundle Splitting:** Code splitting for photo upload components

### Security Implementation
- **Row Level Security:** Database-level access control
- **Input Sanitization:** Server-side validation and sanitization
- **File Upload Security:** Type validation and size limits
- **Encryption:** Sensitive access codes encrypted at rest

## Quality Assurance Checklist

### Functional Testing
- [ ] Apartment creation with all required fields
- [ ] Photo upload with progress indication
- [ ] Form validation and error handling
- [ ] Bulk operations for multiple apartments
- [ ] Access code encryption and decryption

### Performance Testing
- [ ] Photo upload under 10 seconds for 5MB files
- [ ] Apartment list loads under 2 seconds
- [ ] Form submission under 500ms response
- [ ] Search and filter under 200ms response

### Security Testing
- [ ] RLS policies prevent unauthorized access
- [ ] Input validation prevents injection attacks
- [ ] File upload restrictions prevent malicious files
- [ ] Access codes properly encrypted

## Related Documentation

- [Feature Overview](./README.md) - High-level feature summary
- [User Journey Analysis](./user-journey.md) - UX requirements context
- [Screen States Specifications](./screen-states.md) - Visual requirements
- [Accessibility Requirements](./accessibility.md) - Inclusive design specs