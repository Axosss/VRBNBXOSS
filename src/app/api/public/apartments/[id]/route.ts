import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params first (Next.js 15 requirement)
    const { id: apartmentId } = await context.params;
    
    // Use anon key for public access (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    });

    // Fetch apartment (no auth required for public view)
    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select(`
        id,
        name,
        capacity,
        bedrooms,
        bathrooms,
        amenities,
        address,
        photos,
        created_at
      `)
      .eq('id', apartmentId)
      .single();

    if (apartmentError || !apartment) {
      console.error('Public API error:', apartmentError);
      console.log('Apartment ID requested:', apartmentId);
      return NextResponse.json(
        { error: 'Apartment not found', details: apartmentError?.message },
        { status: 404 }
      );
    }

    // Fetch reservations to show availability (no guest info)
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        status
      `)
      .eq('apartment_id', apartmentId)
      .in('status', ['confirmed', 'in_progress'])
      .gte('check_out', new Date().toISOString().split('T')[0]);

    // Transform reservations to simple availability blocks
    const availability = reservations?.map(res => ({
      start: res.check_in,
      end: res.check_out,
      status: 'booked'
    })) || [];

    return NextResponse.json({
      apartment: {
        ...apartment,
        // Remove any sensitive data if it somehow got included
        access_codes: undefined,
        owner_id: undefined,
        created_by: undefined
      },
      availability
    });

  } catch (error) {
    console.error('Error fetching public apartment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apartment' },
      { status: 500 }
    );
  }
}