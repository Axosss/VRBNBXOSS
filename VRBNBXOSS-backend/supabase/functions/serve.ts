// Supabase Edge Functions Local Development Server
// Serves multiple Edge Functions in development

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import your Edge Functions
import { handleImageOptimization } from "./image-optimization/index.ts";
import { handlePDFGeneration } from "./pdf-generation/index.ts";
import { handleEmailNotification } from "./email-notification/index.ts";
import { handleCalendarSync } from "./calendar-sync/index.ts";

interface EdgeFunction {
  name: string;
  handler: (req: Request) => Promise<Response>;
}

// Register your Edge Functions here
const functions: EdgeFunction[] = [
  { name: "image-optimization", handler: handleImageOptimization },
  { name: "pdf-generation", handler: handlePDFGeneration },
  { name: "email-notification", handler: handleEmailNotification },
  { name: "calendar-sync", handler: handleCalendarSync },
];

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'http://localhost:54321';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Main request handler
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Health check endpoint
  if (pathname === '/health') {
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        functions: functions.map(f => f.name)
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }

  // Function list endpoint
  if (pathname === '/functions') {
    return new Response(
      JSON.stringify({
        functions: functions.map(f => ({
          name: f.name,
          endpoint: `/${f.name}`
        }))
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }

  // Route to specific Edge Function
  const functionName = pathname.slice(1); // Remove leading slash
  const edgeFunction = functions.find(f => f.name === functionName);

  if (edgeFunction) {
    try {
      // Add Supabase client to request context (if needed)
      const response = await edgeFunction.handler(req);
      
      // Ensure CORS headers are included
      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      console.error(`Error in function ${functionName}:`, error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error.message,
          function: functionName
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      );
    }
  }

  // 404 for unknown routes
  return new Response(
    JSON.stringify({
      error: 'Function not found',
      available_functions: functions.map(f => f.name)
    }),
    {
      status: 404,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    }
  );
}

// Start the server
const port = parseInt(Deno.env.get('PORT') ?? '8000');

console.log(`🚀 Supabase Edge Functions Server starting on port ${port}`);
console.log(`📋 Available functions: ${functions.map(f => f.name).join(', ')}`);
console.log(`🏥 Health check: http://localhost:${port}/health`);

await serve(handler, { port });