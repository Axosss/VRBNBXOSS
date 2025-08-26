import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCleanerSchema } from '@/lib/validations/cleaning';
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID } from '@/lib/utils';
import { sanitizeText, sanitizeContactInfo } from '@/lib/utils/sanitize';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cleanerId } = await context.params;
    
    if (!isValidUUID(cleanerId)) {
      throw new AppError('Invalid cleaner ID', 400);
    }
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Fetch cleaner
    const { data: cleaner, error: queryError } = await supabase
      .from('cleaners')
      .select('*')
      .eq('id', cleanerId)
      .eq('owner_id', user.id)
      .single();
    
    if (queryError) {
      if (queryError.code === 'PGRST116') {
        throw new AppError('Cleaner not found', 404);
      }
      throw new AppError(queryError.message, 500);
    }
    
    return NextResponse.json(
      createSuccessResponse(cleaner, 'Cleaner fetched successfully')
    );
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      );
    }
    
    console.error('Get cleaner error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch cleaner', 500),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cleanerId } = await context.params;
    const body = await request.json();
    
    if (!isValidUUID(cleanerId)) {
      throw new AppError('Invalid cleaner ID', 400);
    }
    
    // Validate input
    const updateData = updateCleanerSchema.parse(body);
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Check if cleaner exists and belongs to user
    const { data: existingCleaner, error: checkError } = await supabase
      .from('cleaners')
      .select('id')
      .eq('id', cleanerId)
      .eq('owner_id', user.id)
      .single();
    
    if (checkError || !existingCleaner) {
      throw new AppError('Cleaner not found', 404);
    }
    
    // Prepare update data - match actual schema
    const cleanedData: any = {};
    
    if (updateData.name !== undefined) cleanedData.name = sanitizeText(updateData.name);
    if (updateData.email !== undefined) cleanedData.email = updateData.email ? sanitizeText(updateData.email) : null;
    if (updateData.phone !== undefined) cleanedData.phone = updateData.phone ? sanitizeText(updateData.phone) : null;
    
    // Handle rate field
    if (updateData.rate !== undefined) cleanedData.rate = updateData.rate;
    
    // Handle currency field
    if (updateData.currency !== undefined) cleanedData.currency = updateData.currency;
    
    cleanedData.updated_at = new Date().toISOString();
    
    // Update cleaner
    const { data: updatedCleaner, error: updateError } = await supabase
      .from('cleaners')
      .update(cleanedData)
      .eq('id', cleanerId)
      .eq('owner_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      throw new AppError(updateError.message, 400);
    }
    
    return NextResponse.json(
      createSuccessResponse(updatedCleaner, 'Cleaner updated successfully')
    );
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Invalid input data', 400),
        { status: 400 }
      );
    }
    
    console.error('Update cleaner error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to update cleaner', 500),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cleanerId } = await context.params;
    
    if (!isValidUUID(cleanerId)) {
      throw new AppError('Invalid cleaner ID', 400);
    }
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Check if cleaner exists and belongs to user
    const { data: existingCleaner, error: checkError } = await supabase
      .from('cleaners')
      .select('id')
      .eq('id', cleanerId)
      .eq('owner_id', user.id)
      .single();
    
    if (checkError || !existingCleaner) {
      throw new AppError('Cleaner not found', 404);
    }
    
    // Delete cleaner
    const { error: deleteError } = await supabase
      .from('cleaners')
      .delete()
      .eq('id', cleanerId)
      .eq('owner_id', user.id);
    
    if (deleteError) {
      throw new AppError(deleteError.message, 400);
    }
    
    return NextResponse.json(
      createSuccessResponse(null, 'Cleaner deleted successfully')
    );
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      );
    }
    
    console.error('Delete cleaner error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to delete cleaner', 500),
      { status: 500 }
    );
  }
}