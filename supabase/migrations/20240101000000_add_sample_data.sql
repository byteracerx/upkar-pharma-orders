-- Add sample products
INSERT INTO products (name, description, price, category, stock, image_url)
VALUES 
  ('Paracetamol 500mg', 'Pain reliever and fever reducer. Used for mild to moderate pain and fever.', 25.50, 'Pain Relief', 100, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
  ('Amoxicillin 250mg', 'Antibiotic used to treat a number of bacterial infections.', 75.00, 'Antibiotics', 50, 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
  ('Cetirizine 10mg', 'Antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, itching, and sneezing.', 35.75, 'Allergy Relief', 75, 'https://images.unsplash.com/photo-1550572017-edd951b55104?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
  ('Omeprazole 20mg', 'Proton pump inhibitor used to treat certain stomach and esophagus problems.', 85.25, 'Digestive Health', 60, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
  ('Metformin 500mg', 'Oral diabetes medicine that helps control blood sugar levels.', 45.50, 'Diabetes Care', 40, 'https://images.unsplash.com/photo-1576602976047-174e57a47881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');

-- Note: Adding a doctor account requires using the Auth API, which can't be done directly in SQL
-- Use the add-sample-data.js script for creating the doctor account