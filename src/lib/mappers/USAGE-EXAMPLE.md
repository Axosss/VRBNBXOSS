# 📚 Guide d'utilisation des Mappers

## 🎯 Utilisation Simple

### Dans un composant React

```typescript
// src/components/MyComponent.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dbMappers } from '@/lib/mappers'

function MyReservationsList() {
  const [reservations, setReservations] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function loadReservations() {
      // Fetch from DB
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
      
      if (data) {
        // Transform using mapper
        const mapped = dbMappers.reservation.multipleFromDB(data)
        setReservations(mapped)
      }
    }
    
    loadReservations()
  }, [])

  return (
    <div>
      {reservations.map(r => (
        <div key={r.id}>{r.guest_count} guests</div>
      ))}
    </div>
  )
}
```

### Pour créer/mettre à jour des données

```typescript
// Creating a new reservation
async function createReservation(formData) {
  // Transform to DB format
  const dbData = dbMappers.reservation.toDB(formData)
  
  // Save to Supabase
  const { data, error } = await supabase
    .from('reservations')
    .insert(dbData)
    .select()
    .single()
  
  if (data) {
    // Transform response back
    return dbMappers.reservation.fromDB(data)
  }
}

// Updating an existing reservation
async function updateReservation(id, updates) {
  // Transform to DB format
  const dbData = dbMappers.reservation.toDB(updates)
  
  // Update in Supabase
  const { data, error } = await supabase
    .from('reservations')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()
  
  if (data) {
    // Transform response back
    return dbMappers.reservation.fromDB(data)
  }
}
```

## 🔧 Utilisation Avancée

### Avec relations (joins)

```typescript
// Fetch reservation with apartment and guest info
const { data, error } = await supabase
  .from('reservations')
  .select(`
    *,
    apartment:apartments(*),
    guest:guests(*)
  `)

if (data) {
  // Use the withRelations mapper
  const mapped = dbMappers.reservation.multipleWithRelationsFromDB(data)
  // Now each reservation has apartment and guest objects attached
}
```

### Hook personnalisé réutilisable

```typescript
// src/lib/hooks/useApartmentsWithMapper.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dbMappers } from '@/lib/mappers'

export function useApartmentsWithMapper() {
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchApartments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .eq('status', 'active')
    
    if (data) {
      const mapped = dbMappers.apartment.multipleFromDB(data)
      setApartments(mapped)
    }
    setLoading(false)
  }

  const createApartment = async (apartmentData) => {
    const dbData = dbMappers.apartment.toDB(apartmentData)
    const { data, error } = await supabase
      .from('apartments')
      .insert(dbData)
      .select()
      .single()
    
    if (data) {
      const mapped = dbMappers.apartment.fromDB(data)
      setApartments(prev => [...prev, mapped])
      return mapped
    }
  }

  useEffect(() => {
    fetchApartments()
  }, [])

  return {
    apartments,
    loading,
    createApartment,
    refetch: fetchApartments
  }
}
```

## 📊 Référence Rapide

### Tous les mappers disponibles

```typescript
import { dbMappers } from '@/lib/mappers'

// Reservations
dbMappers.reservation.fromDB(data)        // Single
dbMappers.reservation.toDB(data)          // For insert/update
dbMappers.reservation.multipleFromDB(data) // Array

// Apartments
dbMappers.apartment.fromDB(data)
dbMappers.apartment.toDB(data)
dbMappers.apartment.multipleFromDB(data)

// Cleanings
dbMappers.cleaning.fromDB(data)
dbMappers.cleaning.toDB(data)
dbMappers.cleaning.multipleFromDB(data)

// Guests
dbMappers.guest.fromDB(data)
dbMappers.guest.toDB(data)
dbMappers.guest.multipleFromDB(data)

// Cleaners
dbMappers.cleaner.fromDB(data)
dbMappers.cleaner.toDB(data)
dbMappers.cleaner.multipleFromDB(data)
```

## ⚠️ Points d'attention

### Photos dans Apartments
La DB stocke des URLs simples (`string[]`), mais le frontend attend des objets. Le mapper gère cette conversion automatiquement :
```typescript
// DB: ['photo1.jpg', 'photo2.jpg']
// Frontend: [{ id: 'photo-0', url: 'photo1.jpg', ... }]
```

### Dates dans Cleanings
La DB utilise `scheduled_date` + `duration`, le frontend utilise `scheduled_start` + `scheduled_end`. Le mapper fait la conversion.

### Champs manquants
Certains champs n'existent pas encore en DB (ex: `currency` pour cleaners). Le mapper retourne `null` pour ces champs en attendant la migration DB.

## 🚀 Prochaine étape : Migration progressive

1. **Commencez petit** : Migrez UN composant/hook à la fois
2. **Testez** : Vérifiez que tout fonctionne
3. **Étendez** : Migrez progressivement les autres composants
4. **Phase 2** : Une fois tout migré, passez aux noms camelCase

## 💡 Astuce

Pour debug, les mappers loguent les transformations en mode développement :
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Original:', data)
  console.log('Mapped:', mapped)
}
```