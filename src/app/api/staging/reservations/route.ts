// API endpoint to fetch pending staging reservations
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user's apartments
    const { data: apartments, error: apartmentError } = await supabase
      .from('apartments')
      .select('id')
      .eq('owner_id', user.id);
    
    if (apartmentError || !apartments || apartments.length === 0) {
      return NextResponse.json({ pendingImports: [] });
    }
    
    const apartmentIds = apartments.map(a => a.id);
    
    // Get pending staging reservations
    const { data: pendingImports, error: stagingError } = await supabase
      .from('reservation_staging')
      .select(`
        id,
        apartment_id,
        platform,
        guest_name,
        check_in,
        check_out,
        status_text,
        phone_last_four,
        stage_status,
        created_at,
        last_seen_at,
        apartments (
          id,
          name
        )
      `)
      .in('apartment_id', apartmentIds)
      .eq('stage_status', 'pending')
      .is('reservation_id', null)  // Not yet confirmed
      .is('disappeared_at', null)  // Not cancelled
      .order('check_in', { ascending: true });
    
    if (stagingError) {
      console.error('Error fetching staging reservations:', stagingError);
      return NextResponse.json(
        { error: 'Failed to fetch pending imports' },
        { status: 500 }
      );
    }
    
    // Check for conflicts with existing reservations
    if (pendingImports && pendingImports.length > 0) {
      for (const staging of pendingImports) {
        // Find overlapping reservations for the same apartment
        const { data: conflicts, error: conflictError } = await supabase
          .from('reservations')
          .select('id, check_in, check_out, guest_id, guests(name)')
          .eq('apartment_id', staging.apartment_id)
          .eq('status', 'confirmed')
          .gte('check_out', staging.check_in)
          .lte('check_in', staging.check_out);
        
        if (conflictError) {
          console.error('Error checking conflicts:', conflictError);
        }
        
        // Add conflict info to staging reservation
        (staging as any).has_conflict = conflicts && conflicts.length > 0;
        (staging as any).conflicting_reservations = conflicts || [];
        
        if (conflicts && conflicts.length > 0) {
          console.log(`Conflict found for ${staging.check_in} - ${staging.check_out}:`, conflicts);
        }
      }
    }
    
    return NextResponse.json({
      pendingImports: pendingImports || []
    });
    
  } catch (error) {
    console.error('Error in staging reservations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint to confirm/reject a staging reservation
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { id, action, guestName, guestCount, totalPrice, cleaningFee, notes } = body;
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the staging reservation belongs to user
    const { data: stagingReservation, error: fetchError } = await supabase
      .from('reservation_staging')
      .select(`
        *,
        apartments!inner (
          owner_id
        )
      `)
      .eq('id', id)
      .single();
    
    if (fetchError || !stagingReservation) {
      return NextResponse.json(
        { error: 'Staging reservation not found' },
        { status: 404 }
      );
    }
    
    if (stagingReservation.apartments.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    if (action === 'reject') {
      // Mark as rejected
      const { error: updateError } = await supabase
        .from('reservation_staging')
        .update({
          stage_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reject staging reservation' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, action: 'rejected' });
    }
    
    if (action === 'confirm') {
      // Create guest first if name provided
      let guestId = null;
      if (guestName) {
        const { data: guest, error: guestError } = await supabase
          .from('guests')
          .insert({
            name: guestName,
            owner_id: user.id
          })
          .select()
          .single();
        
        if (!guestError && guest) {
          guestId = guest.id;
        }
      }
      
      // Create the actual reservation
      const { data: newReservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          apartment_id: stagingReservation.apartment_id,
          owner_id: user.id, // Add owner_id for RLS policy
          guest_id: guestId,
          platform: stagingReservation.platform,
          check_in: stagingReservation.check_in,
          check_out: stagingReservation.check_out,
          total_price: totalPrice || 0,
          cleaning_fee: cleaningFee || 0,
          guest_count: guestCount || 2,
          status: 'confirmed',
          notes: notes || `Imported from ${stagingReservation.platform} on ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();
      
      if (reservationError) {
        console.error('Error creating reservation:', reservationError);
        return NextResponse.json(
          { error: 'Failed to create reservation' },
          { status: 500 }
        );
      }
      
      // Update staging record with reservation ID
      const { error: updateError } = await supabase
        .from('reservation_staging')
        .update({
          stage_status: 'confirmed',
          reservation_id: newReservation.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating staging record:', updateError);
      }
      
      return NextResponse.json({
        success: true,
        action: 'confirmed',
        reservation: newReservation
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error processing staging reservation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}