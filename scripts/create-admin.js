// This script creates the default admin user
// Run with: node scripts/create-admin.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hohfvjzagukucseffpmc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('Checking if admin user exists...');
    
    // Check if admin user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@upkar.com');
    
    if (checkError) {
      console.error('Error checking for existing admin:', checkError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Admin user already exists');
      return;
    }
    
    console.log('Creating admin user...');
    
    // Create admin user
    const { data: adminUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@upkar.com',
      password: 'Admin@123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    });
    
    if (createError) {
      console.error('Error creating admin user:', createError);
      return;
    }
    
    console.log('Admin user created successfully:', adminUser);
    
    // Add admin role to user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: adminUser.user.id,
        role: 'admin'
      });
    
    if (roleError) {
      console.error('Error adding admin role:', roleError);
      return;
    }
    
    console.log('Admin role added successfully');
    
  } catch (error) {
    console.error('Error in createAdminUser:', error);
  }
}

createAdminUser()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });