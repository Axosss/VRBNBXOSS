// VRBNBXOSS Email Notification Edge Function
// Handles automated email communications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface EmailRequest {
  type: 'booking-confirmation' | 'check-in-instructions' | 'check-out-reminder' | 'cleaning-reminder';
  to: string;
  data: any;
}

export async function handleEmailNotification(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const requestBody: EmailRequest = await req.json();
    const { type, to, data } = requestBody;

    if (!type || !to || !data) {
      return new Response(
        JSON.stringify({ error: 'type, to, and data are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📧 Sending ${type} email to ${to}`);

    // Generate email content based on type
    const emailContent = generateEmailContent(type, data);

    // In a real implementation, you would use a service like Resend, SendGrid, etc.
    // For this example, we'll simulate sending the email
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log the email (in production, you'd actually send it)
    console.log('📧 Email Content:');
    console.log('Subject:', emailContent.subject);
    console.log('Body:', emailContent.body.substring(0, 200) + '...');

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the email in the database
    const { error: logError } = await supabase
      .from('communications')
      .insert({
        type: 'email',
        recipient: to,
        subject: emailContent.subject,
        message: emailContent.body,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          email_type: type,
          data
        }
      });

    if (logError) {
      console.warn('Failed to log email:', logError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        to,
        subject: emailContent.subject,
        sentAt: new Date().toISOString(),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Email notification error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Email notification failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function generateEmailContent(type: string, data: any): { subject: string; body: string } {
  switch (type) {
    case 'booking-confirmation':
      return {
        subject: `Booking Confirmed - ${data.apartmentName}`,
        body: `
Dear ${data.guestName},

Thank you for your booking! Your reservation has been confirmed.

Reservation Details:
- Property: ${data.apartmentName}
- Check-in: ${data.checkIn}
- Check-out: ${data.checkOut}
- Guests: ${data.guests}
- Total Amount: $${data.totalAmount}

We'll send you check-in instructions 24 hours before your arrival.

Best regards,
VRBNBXOSS Team
        `.trim()
      };

    case 'check-in-instructions':
      return {
        subject: `Check-in Instructions - ${data.apartmentName}`,
        body: `
Dear ${data.guestName},

Your check-in is tomorrow! Here are your access instructions:

Property: ${data.apartmentName}
Address: ${data.address}
Check-in Time: ${data.checkInTime}

Access Instructions:
${data.accessInstructions}

WiFi Details:
- Network: ${data.wifi?.network || 'VRBNB_Guest'}
- Password: ${data.wifi?.password || 'Contact host'}

Important Notes:
- Please respect quiet hours (10 PM - 8 AM)
- No smoking inside the property
- Check-out is at ${data.checkOutTime}

Enjoy your stay!

Best regards,
VRBNBXOSS Team
        `.trim()
      };

    case 'check-out-reminder':
      return {
        subject: `Check-out Reminder - ${data.apartmentName}`,
        body: `
Dear ${data.guestName},

This is a friendly reminder that your check-out is today at ${data.checkOutTime}.

Check-out Instructions:
- Please leave keys in the designated area
- Ensure all windows and doors are locked
- Turn off all lights and appliances
- Take all personal belongings

We hope you enjoyed your stay! Please consider leaving us a review.

Best regards,
VRBNBXOSS Team
        `.trim()
      };

    case 'cleaning-reminder':
      return {
        subject: `Cleaning Scheduled - ${data.apartmentName}`,
        body: `
Hello ${data.cleanerName},

You have a cleaning scheduled for:

Property: ${data.apartmentName}
Address: ${data.address}
Date: ${data.scheduledDate}
Time: ${data.scheduledTime}

Previous guest checked out: ${data.previousCheckOut}
Next guest checks in: ${data.nextCheckIn}

Please ensure the property is ready before the next guest arrival.

Access instructions will be provided separately.

Best regards,
VRBNBXOSS Team
        `.trim()
      };

    default:
      return {
        subject: 'Notification from VRBNBXOSS',
        body: 'You have a new notification from VRBNBXOSS.'
      };
  }
}

// Export for standalone usage
export default serve(handleEmailNotification);