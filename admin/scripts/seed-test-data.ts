/**
 * Test Data Seed Script
 *
 * Inserts 3 products + 5 orders into the backend via API.
 *
 * Usage:
 *   npx ts-node scripts/seed-test-data.ts
 *
 * Prerequisites:
 *   - Backend running on http://localhost:8080
 *   - Database accessible
 */

const BASE_URL = process.env.API_URL || 'http://localhost:8080/api';

interface ProductPayload {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

interface OrderPayload {
  totalAmount: number;
  items: { productId: number; quantity: number }[];
}

const PRODUCTS: ProductPayload[] = [
  {
    sku: 'TEST-PHONE-001',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality noise-cancelling headphones for testing',
    price: 49.99,
    stock: 100,
    category: 'Electronics',
  },
  {
    sku: 'TEST-BAG-002',
    name: 'Travel Backpack 40L',
    description: 'Waterproof travel backpack with laptop compartment',
    price: 79.99,
    stock: 50,
    category: 'Bags',
  },
  {
    sku: 'TEST-CUP-003',
    name: 'Insulated Coffee Tumbler',
    description: 'Stainless steel tumbler, keeps drinks hot for 12 hours',
    price: 24.99,
    stock: 5, // Low stock for testing warning display
    category: 'Kitchen',
  },
];

const ORDERS: OrderPayload[] = [
  { totalAmount: 49.99, items: [{ productId: 1, quantity: 1 }] },
  { totalAmount: 159.98, items: [{ productId: 2, quantity: 2 }] },
  { totalAmount: 74.98, items: [{ productId: 1, quantity: 1 }, { productId: 3, quantity: 1 }] },
  { totalAmount: 79.99, items: [{ productId: 2, quantity: 1 }] },
  { totalAmount: 99.98, items: [{ productId: 3, quantity: 4 }] },
];

async function seedProducts(): Promise<number[]> {
  console.log('Seeding products...');
  const ids: number[] = [];

  for (const product of PRODUCTS) {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (!res.ok) {
      throw new Error(`Failed to create product ${product.sku}: ${res.status} ${await res.text()}`);
    }

    const result = await res.json();
    const id = result.data?.id;
    ids.push(id);
    console.log(`  Created product: ${product.name} (ID: ${id})`);
  }

  return ids;
}

async function seedOrders(): Promise<void> {
  console.log('Seeding orders...');

  for (const order of ORDERS) {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });

    if (!res.ok) {
      throw new Error(`Failed to create order: ${res.status} ${await res.text()}`);
    }

    const result = await res.json();
    console.log(`  Created order: ${result.data?.orderNo} (ID: ${result.data?.orderId})`);
  }
}

async function main() {
  console.log(`Seed target: ${BASE_URL}`);
  console.log('---');

  try {
    await seedProducts();
    await seedOrders();
    console.log('---');
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();
