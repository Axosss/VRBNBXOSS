import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's apartments
    const { data: apartments } = await supabase
      .from('apartments')
      .select('id')
      .eq('owner_id', user.id);
    
    if (!apartments || apartments.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No apartments found' 
      });
    }
    
    const apartmentIds = apartments.map(a => a.id);
    
    // Delete all staging entries for user's apartments
    const { error: deleteError, count } = await supabase
      .from('reservation_staging')
      .delete()
      .in('apartment_id', apartmentIds);
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    // Also clear checksums to force full resync
    await supabase
      .from('sync_checksums')
      .delete()
      .in('apartment_id', apartmentIds);
    
    return NextResponse.json({ 
      success: true, 
      message: `Staging table cleared. ${count || 0} entries deleted. Ready for fresh sync.` 
    });
  } catch (error) {
    console.error('Clean staging error:', error);
    return NextResponse.json(
      { error: 'Failed to clear staging' },
      { status: 500 }
    );
  }
}