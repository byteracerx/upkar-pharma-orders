# Sample Data Scripts

This directory contains scripts to add sample data to the Upkar Pharma application.

## Adding Sample Doctor Account and Products

You can add a sample doctor account and products using one of the following methods:

### Method 1: Using Node.js Script

This method will create a doctor account in the authentication system and add sample products.

1. Make sure you have the required environment variables set up (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
2. Run the script:

```bash
# From the project root directory
node scripts/add-sample-data.js
```

### Method 2: Using SQL Migration (Products Only)

This method will only add sample products, not a doctor account.

```bash
# From the project root directory
npx supabase db push
```

## Sample Doctor Account Details

After running the script, a sample doctor account will be created with the following credentials:

- **Email**: doctor.sample@example.com
- **Password**: Password123!
- **Name**: Dr. Sample Doctor
- **Phone**: 9876543210
- **Address**: 123 Medical Street, Healthcare City, India
- **GST Number**: GSTIN1234567890Z

## Sample Products

The following sample products will be added:

1. Paracetamol 500mg (Pain Relief)
2. Amoxicillin 250mg (Antibiotics)
3. Cetirizine 10mg (Allergy Relief)
4. Omeprazole 20mg (Digestive Health)
5. Metformin 500mg (Diabetes Care)

## Troubleshooting

If you encounter any issues:

1. Make sure your Supabase instance is running
2. Check that your environment variables are correctly set
3. Ensure you have the necessary permissions to add data to the tables