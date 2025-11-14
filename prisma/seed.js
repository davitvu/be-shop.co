/* eslint-disable no-console */

const { PrismaClient, UserRole, OrderStatus, AddressType } = require('@prisma/client')
const { hashedPassword } = require('../controllers/auth.controller')

const prisma = new PrismaClient()

async function main() {
    // Xóa dữ liệu cũ theo thứ tự an toàn (tôn trọng FK)
    console.log('🧹 Cleaning old data...')

    await prisma.orderItem.deleteMany()
    console.log('  ✓ OrderItems deleted')

    await prisma.order.deleteMany()
    console.log('  ✓ Orders deleted')

    await prisma.productImage.deleteMany()
    console.log('  ✓ ProductImages deleted')

    await prisma.productColor.deleteMany()
    console.log('  ✓ ProductColors deleted')

    await prisma.productSize.deleteMany()
    console.log('  ✓ ProductSizes deleted')

    await prisma.product.deleteMany()
    console.log('  ✓ Products deleted')

    await prisma.address.deleteMany()
    console.log('  ✓ Addresses deleted')

    await prisma.user.deleteMany()
    console.log('  ✓ Users deleted')

    await prisma.color.deleteMany()
    console.log('  ✓ Colors deleted')

    await prisma.size.deleteMany()
    console.log('  ✓ Sizes deleted')

    await prisma.dressStyle.deleteMany()
    console.log('  ✓ DressStyles deleted')

    await prisma.productType.deleteMany()
    console.log('  ✓ ProductTypes deleted')

    console.log('✅ Old data cleaned\n')

    // ==== USERS ====
    console.log('👤 Creating users...')
    const admin = await prisma.user.create({
        data: {
            email: 'admin@gmail.com',
            password: await hashedPassword("123123"),
            firstName: 'System',
            lastName: 'Admin',
            avatarUrl: 'https://i.pinimg.com/1200x/a6/87/59/a68759df700c0ffc3de579060d0eac81.jpg',
            role: UserRole.ADMIN,
            isActive: true,
            phone: "0987654321",
            isEmailVerified: true,
        },
    })

    const alice = await prisma.user.create({
        data: {
            email: 'alice@example.com',
            password: await hashedPassword("123123"),
            firstName: 'Alice',
            lastName: 'Nguyen',
            avatarUrl: 'http://localhost:5173/default.png',
            role: UserRole.USER,
            isActive: true,
            phone: "0987654321",
            isEmailVerified: true,
        },
    })

    const bob = await prisma.user.create({
        data: {
            email: 'bob@example.com',
            password: await hashedPassword("123123"),
            firstName: 'Bob',
            lastName: 'Tran',
            avatarUrl: 'http://localhost:5173/default.png',
            role: UserRole.MANAGER,
            isActive: true,
            phone: "0987654321",
            isEmailVerified: true,
        },
    })

    console.log('✅ Users created\n')

    // ==== ADDRESSES ====
    console.log('📍 Creating addresses...')
    const addrAliceHome = await prisma.address.create({
        data: {
            userId: alice.id,
            nameReminiscent: "Home Address",
            firstName: 'Alice',
            lastName: 'Nguyen',
            phone: '0900000001',
            province: 'Hanoi',
            ward: 'Nghia Do 2',
            zipCode: '100000',
            address: '123 Đống Đa',
            fullAddress: "123 Đống Đa, Dong Da, Hanoi",
            addressType: AddressType.HOME,
            isDefault: true,
        },
    })

    const addrAliceWork = await prisma.address.create({
        data: {
            userId: alice.id,
            nameReminiscent: "Work Address",
            firstName: 'Alice',
            lastName: 'Nguyen',
            phone: '0900000002',
            province: 'Hanoi',
            ward: 'Nghia Do',
            zipCode: '100001',
            address: '456 Cầu Giấy',
            fullAddress: "456 Đống Đa, Da, Hanoi",
            addressType: AddressType.WORD,
            isDefault: false,
        },
    })

    const addrAdmin = await prisma.address.create({
        data: {
            userId: admin.id,
            nameReminiscent: "Admin Office",
            firstName: 'System',
            lastName: 'Admin',
            phone: '0900000999',
            province: 'HCMC',
            ward: 'Nghia Do 1',
            zipCode: '700000',
            address: '01 Lê Lợi',
            fullAddress: "123 Đống Đa, Dong Da, Hanoi",
            addressType: AddressType.HOME,
            isDefault: true,
        },
    })

    console.log('✅ Addresses created\n')

    // ==== PRODUCT TYPES ====
    console.log('🏷️  Creating product types...')
    const types = await Promise.all([
        prisma.productType.create({ data: { name: 'T-shirts', slug: 't-shirts' } }),
        prisma.productType.create({ data: { name: 'Shirts', slug: 'shirts' } }),
        prisma.productType.create({ data: { name: 'Jeans', slug: 'jeans' } }),
        prisma.productType.create({ data: { name: 'Shorts', slug: 'shorts' } })
    ])
    console.log('✅ Product types created\n')

    // ==== DRESS STYLES ====
    console.log('👔 Creating dress styles...')
    const styles = await Promise.all([
        prisma.dressStyle.create({ data: { name: 'Casual', slug: 'casual' } }),
        prisma.dressStyle.create({ data: { name: 'Formal', slug: 'formal' } }),
        prisma.dressStyle.create({ data: { name: 'Party', slug: 'party' } }),
        prisma.dressStyle.create({ data: { name: 'Gym', slug: 'gym' } })
    ])
    console.log('✅ Dress styles created\n')

    // ==== COLORS ====
    console.log('🎨 Creating colors...')
    const colors = await Promise.all([
        prisma.color.create({ data: { name: 'Black', hex: '#000000' } }),
        prisma.color.create({ data: { name: 'White', hex: '#FFFFFF' } }),
        prisma.color.create({ data: { name: 'Red', hex: '#FF0000' } }),
        prisma.color.create({ data: { name: 'Blue', hex: '#0000FF' } }),
        prisma.color.create({ data: { name: 'Green', hex: '#00FF00' } }),
        prisma.color.create({ data: { name: 'Yellow', hex: '#FFFF00' } }),
        prisma.color.create({ data: { name: 'Gray', hex: '#808080' } }),
        prisma.color.create({ data: { name: 'Navy', hex: '#000080' } }),
        prisma.color.create({ data: { name: 'Pink', hex: '#FFC0CB' } }),
        prisma.color.create({ data: { name: 'Orange', hex: '#FFA500' } })
    ])
    console.log('✅ Colors created\n')

    // ==== SIZES ====
    console.log('📏 Creating sizes...')
    const sizes = await Promise.all([
        prisma.size.create({ data: { name: 'Extra Small', value: 'xs' } }),
        prisma.size.create({ data: { name: 'Small', value: 's' } }),
        prisma.size.create({ data: { name: 'Medium', value: 'm' } }),
        prisma.size.create({ data: { name: 'Large', value: 'l' } }),
        prisma.size.create({ data: { name: 'Extra Large', value: 'xl' } }),
        prisma.size.create({ data: { name: '2XL', value: '2xl' } }),
        prisma.size.create({ data: { name: '3XL', value: '3xl' } })
    ])
    console.log('✅ Sizes created\n')

    // ==== PRODUCTS ====
    console.log('🛍️  Creating products...')

    // Product 1: T-shirt Casual
    const p1 = await prisma.product.create({
        data: {
            name: 'Classic White T-Shirt',
            slug: 'classic-white-t-shirt',
            description: 'Premium cotton t-shirt with comfortable fit. Perfect for everyday wear.',
            price: 29.99,
            stock: 100,
            isPublished: true,
            productTypeId: types[0].id, // T-shirts
            dressStyleId: styles[0].id  // Casual
        }
    })

    await prisma.productImage.createMany({
        data: [
            {
                productId: p1.id,
                url: 'https://cdn.shopvnb.com/uploads/gallery/ao-cau-long-yonex-a567-xanh_1746220079.webp',
                altText: 'Classic White T-Shirt - Front View'
            },
            {
                productId: p1.id,
                url: 'https://cdn.shopvnb.com/uploads/gallery/ao-cau-long-mizuno-vm1078-nam-trang_1728500561.webp',
                altText: 'Classic White T-Shirt - Back View'
            }
        ]
    })

    await prisma.productColor.createMany({
        data: [
            { productId: p1.id, colorId: colors[1].id }, // White
            { productId: p1.id, colorId: colors[0].id }, // Black
            { productId: p1.id, colorId: colors[6].id }  // Gray
        ]
    })

    await prisma.productSize.createMany({
        data: [
            { productId: p1.id, sizeId: sizes[1].id, stock: 20 }, // S
            { productId: p1.id, sizeId: sizes[2].id, stock: 30 }, // M
            { productId: p1.id, sizeId: sizes[3].id, stock: 25 }, // L
            { productId: p1.id, sizeId: sizes[4].id, stock: 15 }, // XL
            { productId: p1.id, sizeId: sizes[5].id, stock: 10 }  // 2XL
        ]
    })

    // Product 2: Shirt Formal
    const p2 = await prisma.product.create({
        data: {
            name: 'Slim Fit Dress Shirt',
            slug: 'slim-fit-dress-shirt',
            description: 'Professional dress shirt with modern slim fit. Ideal for office and formal events.',
            price: 59.99,
            stock: 75,
            isPublished: true,
            productTypeId: types[1].id, // Shirts
            dressStyleId: styles[1].id  // Formal
        }
    })

    await prisma.productImage.createMany({
        data: [
            {
                productId: p2.id,
                url: 'https://cdn.shopvnb.com/uploads/gallery/ao-cau-long-yonex-a732-trang_1746220973.webp',
                altText: 'Slim Fit Dress Shirt - Main'
            },
            {
                productId: p2.id,
                url: 'https://cdn.shopvnb.com/uploads/gallery/ao-cau-long-mizuno-vm1037-nam-do_1713121520.webp',
                altText: 'Slim Fit Dress Shirt - Detail'
            }
        ]
    })

    await prisma.productColor.createMany({
        data: [
            { productId: p2.id, colorId: colors[1].id }, // White
            { productId: p2.id, colorId: colors[3].id }, // Blue
            { productId: p2.id, colorId: colors[7].id }  // Navy
        ]
    })

    await prisma.productSize.createMany({
        data: [
            { productId: p2.id, sizeId: sizes[1].id, stock: 15 }, // S
            { productId: p2.id, sizeId: sizes[2].id, stock: 25 }, // M
            { productId: p2.id, sizeId: sizes[3].id, stock: 20 }, // L
            { productId: p2.id, sizeId: sizes[4].id, stock: 10 }, // XL
            { productId: p2.id, sizeId: sizes[5].id, stock: 5 }   // 2XL
        ]
    })

    // Product 3: Jeans Casual
    const p3 = await prisma.product.create({
        data: {
            name: 'Stretch Denim Jeans',
            slug: 'stretch-denim-jeans',
            description: 'Comfortable stretch denim with classic fit. Durable and stylish for everyday wear.',
            price: 79.99,
            stock: 60,
            isPublished: true,
            productTypeId: types[2].id, // Jeans
            dressStyleId: styles[0].id  // Casual
        }
    })

    await prisma.productImage.createMany({
        data: [
            {
                productId: p3.id,
                url: 'https://cdn.shopvnb.com/uploads/gallery/ao-cau-long-mizuno-vm1037-nam-nu-do-1_1713121811.webp',
                altText: 'Stretch Denim Jeans'
            }
        ]
    })

    await prisma.productColor.createMany({
        data: [
            { productId: p3.id, colorId: colors[0].id }, // Black
            { productId: p3.id, colorId: colors[3].id }  // Blue
        ]
    })

    await prisma.productSize.createMany({
        data: [
            { productId: p3.id, sizeId: sizes[2].id, stock: 20 }, // M
            { productId: p3.id, sizeId: sizes[3].id, stock: 25 }, // L
            { productId: p3.id, sizeId: sizes[4].id, stock: 10 }, // XL
            { productId: p3.id, sizeId: sizes[5].id, stock: 5 }   // 2XL
        ]
    })

    // Product 4: Shorts Gym
    const p4 = await prisma.product.create({
        data: {
            name: 'Athletic Training Shorts',
            slug: 'athletic-training-shorts',
            description: 'Lightweight and breathable shorts perfect for gym and sports activities.',
            price: 39.99,
            stock: 80,
            isPublished: true,
            productTypeId: types[3].id, // Shorts
            dressStyleId: styles[3].id  // Gym
        }
    })

    await prisma.productImage.createMany({
        data: [
            {
                productId: p4.id,
                url: 'https://cdn.shopvnb.com/uploads/gallery/ao-cau-long-yonex-a567-xanh_1746220079.webp',
                altText: 'Athletic Training Shorts'
            }
        ]
    })

    await prisma.productColor.createMany({
        data: [
            { productId: p4.id, colorId: colors[0].id }, // Black
            { productId: p4.id, colorId: colors[4].id }, // Green
            { productId: p4.id, colorId: colors[2].id }  // Red
        ]
    })

    await prisma.productSize.createMany({
        data: [
            { productId: p4.id, sizeId: sizes[1].id, stock: 20 }, // S
            { productId: p4.id, sizeId: sizes[2].id, stock: 30 }, // M
            { productId: p4.id, sizeId: sizes[3].id, stock: 20 }, // L
            { productId: p4.id, sizeId: sizes[4].id, stock: 10 }  // XL
        ]
    })

    // Product 5: Party Shirt (unpublished)
    const p5 = await prisma.product.create({
        data: {
            name: 'Silk Party Shirt',
            slug: 'silk-party-shirt',
            description: 'Luxurious silk shirt perfect for parties and special occasions.',
            price: 89.99,
            stock: 25,
            isPublished: false, // Not published yet
            productTypeId: types[1].id, // Shirts
            dressStyleId: styles[2].id  // Party
        }
    })

    await prisma.productImage.createMany({
        data: [
            {
                productId: p5.id,
                url: 'https://cdn.shopvnb.com/uploads/gallery/ao-cau-long-yonex-a732-trang_1746220973.webp',
                altText: 'Silk Party Shirt'
            }
        ]
    })

    await prisma.productColor.createMany({
        data: [
            { productId: p5.id, colorId: colors[0].id }, // Black
            { productId: p5.id, colorId: colors[2].id }, // Red
            { productId: p5.id, colorId: colors[8].id }  // Pink
        ]
    })

    await prisma.productSize.createMany({
        data: [
            { productId: p5.id, sizeId: sizes[2].id, stock: 10 }, // M
            { productId: p5.id, sizeId: sizes[3].id, stock: 10 }, // L
            { productId: p5.id, sizeId: sizes[4].id, stock: 5 }   // XL
        ]
    })

    // Product 6: T-shirt Gym
    const p6 = await prisma.product.create({
        data: {
            name: 'Performance Training T-Shirt',
            slug: 'performance-training-t-shirt',
            description: 'Moisture-wicking t-shirt designed for intense workouts.',
            price: 34.99,
            stock: 90,
            isPublished: true,
            productTypeId: types[0].id, // T-shirts
            dressStyleId: styles[3].id  // Gym
        }
    })

    await prisma.productImage.createMany({
        data: [
            {
                productId: p6.id,
                url: 'https://cdn.shopvnb.com/uploads/gallery/ao-cau-long-mizuno-vm1078-nam-trang_1728500561.webp',
                altText: 'Performance Training T-Shirt'
            }
        ]
    })

    await prisma.productColor.createMany({
        data: [
            { productId: p6.id, colorId: colors[0].id }, // Black
            { productId: p6.id, colorId: colors[4].id }, // Green
            { productId: p6.id, colorId: colors[9].id }  // Orange
        ]
    })

    await prisma.productSize.createMany({
        data: [
            { productId: p6.id, sizeId: sizes[1].id, stock: 25 }, // S
            { productId: p6.id, sizeId: sizes[2].id, stock: 35 }, // M
            { productId: p6.id, sizeId: sizes[3].id, stock: 20 }, // L
            { productId: p6.id, sizeId: sizes[4].id, stock: 10 }  // XL
        ]
    })

    console.log('✅ Products created\n')

    // ==== ORDERS ====
    console.log('📦 Creating orders...')

    // Order #1 for Alice
    const order1 = await prisma.order.create({
        data: {
            userId: alice.id,
            shippingAddressId: addrAliceHome.id,
            status: OrderStatus.PAID,
            total: '119.97',
            items: {
                create: [
                    { productId: p1.id, price: '29.99', quantity: 2 },
                    { productId: p2.id, price: '59.99', quantity: 1 }
                ]
            }
        }
    })

    // Order #2 for Alice
    const order2 = await prisma.order.create({
        data: {
            userId: alice.id,
            shippingAddressId: addrAliceWork.id,
            status: OrderStatus.SHIPPED,
            total: '79.99',
            items: {
                create: [
                    { productId: p3.id, price: '79.99', quantity: 1 }
                ]
            }
        }
    })

    // Order #3 for Admin
    const order3 = await prisma.order.create({
        data: {
            userId: admin.id,
            shippingAddressId: addrAdmin.id,
            status: OrderStatus.PENDING,
            total: '169.96',
            items: {
                create: [
                    { productId: p4.id, price: '39.99', quantity: 2 },
                    { productId: p6.id, price: '34.99', quantity: 3 }
                ]
            }
        }
    })

    console.log('✅ Orders created\n')

    console.log('🎉 Seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log('  👥 Users:', 3)
    console.log('  📍 Addresses:', 3)
    console.log('  🏷️  Product Types:', types.length)
    console.log('  👔 Dress Styles:', styles.length)
    console.log('  🎨 Colors:', colors.length)
    console.log('  📏 Sizes:', sizes.length)
    console.log('  🛍️  Products:', 6, '(5 published, 1 draft)')
    console.log('  📦 Orders:', 3)
    console.log('\n✨ Database is ready to use!')
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })