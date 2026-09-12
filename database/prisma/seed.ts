import { PrismaClient, UserRole, ProductStatus, OrderStatus, CouponType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. 创建用户
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash: '$2b$10$hashed_password_here',
      role: UserRole.CUSTOMER,
      firstName: 'John',
      lastName: 'Doe',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: '$2b$10$hashed_password_here',
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  // 2. 创建地址
  await prisma.address.create({
    data: {
      userId: customer.id,
      isDefault: true,
      addressData: {
        country: 'US',
        state: 'CA',
        city: 'Los Angeles',
        street: '123 Main St',
        zipCode: '90001',
      },
    },
  });

  // 3. 创建品牌
  const nike = await prisma.brand.create({
    data: {
      name: 'Nike',
      slug: 'nike',
      logoUrl: 'https://example.com/nike-logo.png',
    },
  });

  // 4. 创建分类
  const shoes = await prisma.category.create({
    data: {
      nameI18n: { en: 'Shoes', zh: '鞋靴', es: 'Zapatos' },
      slug: 'shoes',
    },
  });

  // 5. 创建商品 (SPU)
  const product = await prisma.product.create({
    data: {
      brandId: nike.id,
      categoryId: shoes.id,
      slug: 'air-max-90',
      titleI18n: { en: 'Nike Air Max 90', zh: '耐克 Air Max 90' },
      descI18n: {
        en: 'Classic Nike Air Max 90 with visible Air cushioning.',
        zh: '经典耐克 Air Max 90，搭载可视 Air 气垫。',
      },
      metaSeo: {
        title: 'Nike Air Max 90 - Official Store',
        description: 'Buy the iconic Nike Air Max 90. Free shipping available.',
        keywords: ['Nike', 'Air Max', 'sneakers', 'running shoes'],
      },
      images: [
        'https://example.com/air-max-90-1.jpg',
        'https://example.com/air-max-90-2.jpg',
      ],
      status: ProductStatus.ACTIVE,
    },
  });

  // 6. 创建 SKU
  const sku1 = await prisma.productSku.create({
    data: {
      productId: product.id,
      skuCode: 'NIKE-AM90-BLK-42',
      attributes: { Color: 'Black', Size: '42' },
      price: 129.99,
      stock: 100,
    },
  });

  const sku2 = await prisma.productSku.create({
    data: {
      productId: product.id,
      skuCode: 'NIKE-AM90-WHT-43',
      attributes: { Color: 'White', Size: '43' },
      price: 129.99,
      stock: 80,
    },
  });

  // 7. 创建优惠券
  const coupon = await prisma.coupon.create({
    data: {
      code: 'TIKTOK20',
      type: CouponType.PERCENTAGE,
      value: 20.00,
      minOrderAmount: 50.00,
      usageLimit: 1000,
      usedCount: 0,
      expiresAt: new Date('2026-12-31T23:59:59Z'),
    },
  });

  // 8. 创建订单
  const order = await prisma.order.create({
    data: {
      orderNo: 'ORD-20260604-0001',
      userId: customer.id,
      totalAmount: 129.99,
      currency: 'USD',
      status: OrderStatus.PAID,
      shippingAddress: {
        country: 'US',
        state: 'CA',
        city: 'Los Angeles',
        street: '123 Main St',
        zipCode: '90001',
      },
      couponId: coupon.id,
      discountAmount: 25.99,
    },
  });

  // 9. 创建订单明细
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      skuId: sku1.id,
      productSnapshot: {
        title: 'Nike Air Max 90',
        image: 'https://example.com/air-max-90-1.jpg',
        attributes: { Color: 'Black', Size: '42' },
      },
      price: 129.99,
      quantity: 1,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
