
// This script adds sample data to the Upkar Pharma application database via the Supabase API
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hohfvjzagukucseffpmc.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addSampleData() {
  console.log('Adding sample data to Upkar Pharma database...');

  // Add sample products
  console.log('Adding products...');
  const products = [
    {
      name: 'Paracetamol 500mg',
      description: 'Pain reliever and fever reducer. Used for mild to moderate pain and fever.',
      price: 25.50,
      category: 'Pain Relief',
      stock: 100,
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Amoxicillin 250mg',
      description: 'Antibiotic used to treat a number of bacterial infections.',
      price: 75.00,
      category: 'Antibiotics',
      stock: 50,
      image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Cetirizine 10mg',
      description: 'Antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, itching, and sneezing.',
      price: 35.75,
      category: 'Allergy Relief',
      stock: 75,
      image_url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Omeprazole 20mg',
      description: 'Proton pump inhibitor used to treat certain stomach and esophagus problems.',
      price: 85.25,
      category: 'Digestive Health',
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Metformin 500mg',
      description: 'Oral diabetes medicine that helps control blood sugar levels.',
      price: 45.50,
      category: 'Diabetes Care',
      stock: 40,
      image_url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }
  ];

  // Insert products
  const { error: productsError } = await supabase
    .from('products')
    .upsert(
      products.map(product => ({
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),
      { onConflict: 'name' }
    );

  if (productsError) {
    console.error('Error adding products:', productsError);
  } else {
    console.log('Products added successfully');
  }

  // Add sample doctors
  console.log('Adding doctors...');
  const doctors = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Dr. Sharma',
      phone: '+919876543210',
      gst_number: 'GST123456789',
      address: '123 Medical Lane, Delhi',
      is_approved: true
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Dr. Patel',
      phone: '+919876543211',
      gst_number: 'GST987654321',
      address: '456 Health Road, Mumbai',
      is_approved: true
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Dr. Kumar',
      phone: '+919876543212',
      gst_number: 'GST456789123',
      address: '789 Wellness Blvd, Bangalore',
      is_approved: false
    }
  ];

  // Insert doctors
  const { error: doctorsError } = await supabase
    .from('doctors')
    .upsert(
      doctors.map(doctor => ({
        ...doctor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),
      { onConflict: 'id' }
    );

  if (doctorsError) {
    console.error('Error adding doctors:', doctorsError);
  } else {
    console.log('Doctors added successfully');
  }

  // Fetch products for order creation
  const { data: productData } = await supabase
    .from('products')
    .select('id, price');

  if (!productData || productData.length === 0) {
    console.error('Error: No products found for creating orders');
    return;
  }

  // Add sample orders
  console.log('Adding orders...');
  const orders = [
    {
      doctor_id: '00000000-0000-0000-0000-000000000001',
      status: 'pending',
      total_amount: 0, // Will calculate based on order items
      shipping_address: '123 Medical Lane, Delhi',
      billing_address: '123 Medical Lane, Delhi',
      payment_method: 'credit'
    },
    {
      doctor_id: '00000000-0000-0000-0000-000000000002',
      status: 'processing',
      total_amount: 0, // Will calculate based on order items
      shipping_address: '456 Health Road, Mumbai',
      billing_address: '456 Health Road, Mumbai',
      payment_method: 'credit'
    }
  ];

  // Create orders and order items
  for (const order of orders) {
    // Select random products for this order
    const orderProducts = [];
    const numProducts = Math.floor(Math.random() * 3) + 1; // 1-3 products
    
    for (let i = 0; i < numProducts; i++) {
      const randomProduct = productData[Math.floor(Math.random() * productData.length)];
      const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
      
      orderProducts.push({
        product_id: randomProduct.id,
        quantity,
        price_per_unit: randomProduct.price,
        total_price: randomProduct.price * quantity
      });
      
      order.total_amount += randomProduct.price * quantity;
    }
    
    // Insert order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      continue;
    }
    
    // Insert order items
    const orderItems = orderProducts.map(product => ({
      ...product,
      order_id: newOrder.id,
      created_at: new Date().toISOString()
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError);
    }
    
    // Add order status history
    await supabase
      .from('order_status_history')
      .insert({
        order_id: newOrder.id,
        status: order.status,
        notes: 'Initial order status',
        created_at: new Date().toISOString()
      });
  }
  
  console.log('Orders added successfully');

  // Add sample credits
  console.log('Adding credit transactions...');
  const creditTransactions = [
    {
      doctor_id: '00000000-0000-0000-0000-000000000001',
      amount: 5000,
      type: 'credit',
      description: 'Initial credit line',
      status: 'completed'
    },
    {
      doctor_id: '00000000-0000-0000-0000-000000000001',
      amount: 1500,
      type: 'debit',
      description: 'Order purchase',
      status: 'completed'
    },
    {
      doctor_id: '00000000-0000-0000-0000-000000000002',
      amount: 10000,
      type: 'credit',
      description: 'Initial credit line',
      status: 'completed'
    }
  ];

  // Insert credit transactions
  const { error: creditsError } = await supabase
    .from('credit_transactions')
    .insert(
      creditTransactions.map(tx => ({
        ...tx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    );

  if (creditsError) {
    console.error('Error adding credit transactions:', creditsError);
  } else {
    console.log('Credit transactions added successfully');
  }

  console.log('Sample data has been added to the database successfully!');
}

// Run the script
addSampleData()
  .catch(error => {
    console.error('Error adding sample data:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Script completed.');
  });
