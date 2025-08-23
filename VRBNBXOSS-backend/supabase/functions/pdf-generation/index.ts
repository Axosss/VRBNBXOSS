// VRBNBXOSS PDF Generation Edge Function
// Generates rental agreements and invoices

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PDFRequest {
  type: 'rental-agreement' | 'invoice' | 'cleaning-checklist';
  data: any;
  template?: string;
}

interface RentalAgreementData {
  reservationId: string;
  guestName: string;
  guestEmail: string;
  apartmentName: string;
  address: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  terms: string[];
}

interface InvoiceData {
  reservationId: string;
  guestName: string;
  guestEmail: string;
  items: {
    description: string;
    amount: number;
  }[];
  totalAmount: number;
  dueDate: string;
}

export async function handlePDFGeneration(req: Request): Promise<Response> {
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

    const requestBody: PDFRequest = await req.json();
    const { type, data, template = 'default' } = requestBody;

    if (!type || !data) {
      return new Response(
        JSON.stringify({ error: 'type and data are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📄 Generating ${type} PDF with ${template} template`);

    // Generate PDF content based on type
    let pdfContent: string;
    let filename: string;

    switch (type) {
      case 'rental-agreement':
        pdfContent = generateRentalAgreementHTML(data as RentalAgreementData);
        filename = `rental-agreement-${data.reservationId}.pdf`;
        break;
      
      case 'invoice':
        pdfContent = generateInvoiceHTML(data as InvoiceData);
        filename = `invoice-${data.reservationId}.pdf`;
        break;
      
      case 'cleaning-checklist':
        pdfContent = generateCleaningChecklistHTML(data);
        filename = `cleaning-checklist-${Date.now()}.pdf`;
        break;
      
      default:
        throw new Error(`Unsupported PDF type: ${type}`);
    }

    // In a real implementation, you would use a PDF generation library
    // For this example, we'll create a simple HTML representation
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const htmlBuffer = new TextEncoder().encode(pdfContent);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`generated/${filename}`, htmlBuffer, {
        contentType: 'text/html', // In real implementation, this would be 'application/pdf'
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(`generated/${filename}`);

    // Log the generation
    await supabase
      .from('document_generations')
      .insert({
        type,
        filename,
        url: publicUrl,
        metadata: data,
        generated_at: new Date().toISOString()
      });

    console.log(`✅ PDF generated successfully: ${filename}`);

    return new Response(
      JSON.stringify({
        success: true,
        type,
        filename,
        url: publicUrl,
        size: htmlBuffer.length,
        generatedAt: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'PDF generation failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// HTML template generators
function generateRentalAgreementHTML(data: RentalAgreementData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rental Agreement - ${data.reservationId}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .content { margin: 20px 0; }
            .terms { margin-top: 30px; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>RENTAL AGREEMENT</h1>
            <p>Agreement #${data.reservationId}</p>
        </div>
        
        <div class="content">
            <p><strong>Guest Name:</strong> ${data.guestName}</p>
            <p><strong>Email:</strong> ${data.guestEmail}</p>
            <p><strong>Property:</strong> ${data.apartmentName}</p>
            <p><strong>Address:</strong> ${data.address}</p>
            <p><strong>Check-in:</strong> ${data.checkIn}</p>
            <p><strong>Check-out:</strong> ${data.checkOut}</p>
            <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
        </div>
        
        <div class="terms">
            <h3>Terms and Conditions</h3>
            <ul>
                ${data.terms.map(term => `<li>${term}</li>`).join('')}
            </ul>
        </div>
        
        <div class="signature">
            <div>
                <p>Guest Signature: _____________________</p>
                <p>Date: _____________________</p>
            </div>
            <div>
                <p>Host Signature: _____________________</p>
                <p>Date: _____________________</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateInvoiceHTML(data: InvoiceData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - ${data.reservationId}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .invoice-details { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; background-color: #f9f9f9; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>INVOICE</h1>
            <p>Invoice for Reservation #${data.reservationId}</p>
        </div>
        
        <div class="invoice-details">
            <p><strong>Bill To:</strong> ${data.guestName}</p>
            <p><strong>Email:</strong> ${data.guestEmail}</p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td>$${item.amount.toFixed(2)}</td>
                    </tr>
                `).join('')}
                <tr class="total">
                    <td><strong>Total</strong></td>
                    <td><strong>$${data.totalAmount.toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <p>Thank you for your business!</p>
    </body>
    </html>
  `;
}

function generateCleaningChecklistHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Cleaning Checklist</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .checklist { margin: 20px 0; }
            .room { margin: 20px 0; }
            .task { margin: 5px 0; }
            input[type="checkbox"] { margin-right: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CLEANING CHECKLIST</h1>
            <p>Property: ${data.apartmentName || 'N/A'}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="checklist">
            <div class="room">
                <h3>Living Room</h3>
                <div class="task"><input type="checkbox"> Vacuum/sweep floors</div>
                <div class="task"><input type="checkbox"> Dust surfaces</div>
                <div class="task"><input type="checkbox"> Clean windows</div>
            </div>
            
            <div class="room">
                <h3>Kitchen</h3>
                <div class="task"><input type="checkbox"> Clean appliances</div>
                <div class="task"><input type="checkbox"> Sanitize countertops</div>
                <div class="task"><input type="checkbox"> Empty trash</div>
            </div>
            
            <div class="room">
                <h3>Bathroom</h3>
                <div class="task"><input type="checkbox"> Clean toilet</div>
                <div class="task"><input type="checkbox"> Clean shower/tub</div>
                <div class="task"><input type="checkbox"> Replace towels</div>
            </div>
            
            <div class="room">
                <h3>Bedroom</h3>
                <div class="task"><input type="checkbox"> Change bed linens</div>
                <div class="task"><input type="checkbox"> Vacuum carpet</div>
                <div class="task"><input type="checkbox"> Dust furniture</div>
            </div>
        </div>
        
        <p>Cleaner Signature: ___________________________ Date: ___________</p>
    </body>
    </html>
  `;
}

// Export for standalone usage
export default serve(handlePDFGeneration);