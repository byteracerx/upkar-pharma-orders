import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if admin user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', 'admin@upkar.com')
    
    if (checkError) {
      console.error('Error checking for existing admin:', checkError)
      throw new Error('Failed to check for existing admin user')
    }
    
    // If admin already exists, return success
    if (existingUsers && existingUsers.length > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Admin user already exists' 
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
    
    // Create admin user
    const { data: adminUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@upkar.com',
      password: 'Admin@123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    })
    
    if (createError) {
      console.error('Error creating admin user:', createError)
      throw new Error('Failed to create admin user')
    }
    
    console.log('Admin user created successfully:', adminUser)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Admin user created successfully',
      user: adminUser
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in create-admin-user function:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})