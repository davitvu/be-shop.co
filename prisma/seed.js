/* eslint-disable no-console */

const { PrismaClient, UserRole, OrderStatus, AddressType } = require('@prisma/client')
const { hashedPassword } = require('../controllers/auth.controller')

const prisma = new PrismaClient()

async function main() {
    // Xóa dữ liệu cũ theo thứ tự an toàn (tôn trọng FK)
    console.log('🧹 Cleaning old data...')

    await prisma.category.deleteMany()
    console.log('  ✓ Categories deleted')

    await prisma.product.deleteMany()
    console.log('  ✓ Products deleted')

    await prisma.address.deleteMany()
    console.log('  ✓ Addresses deleted')

    await prisma.user.deleteMany()
    console.log('  ✓ Users deleted')

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
            isDeleted: false,
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
            isDeleted: false,
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
            isDeleted: false,
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

    // ===== Categories =====
    const menCategory = await prisma.category.create({
        data: {
            name: 'Men',
            slug: 'men',
            description: 'Trang phục nam',
            isPublished: true,
        },
    });

    const womenCategory = await prisma.category.create({
        data: {
            name: 'Women',
            slug: 'women',
            description: 'Trang phục nữ',
            isPublished: true,
        },
    });

    const accessoriesCategory = await prisma.category.create({
        data: {
            name: 'Accessories',
            slug: 'accessories',
            description: 'Phụ kiện thời trang',
            isPublished: true,
        },
    });

    console.log('✅ Seed Categories done');

    // ==== PRODUCTS ====
    console.log('🛍️  Creating products...')

    // Product 1: T-shirt Casual
    const p1 = await prisma.product.create({
        data: {
            name: 'Basic T-Shirt Black',
            slug: 'basic-tshirt-black',
            description: 'Áo thun basic màu đen, form regular fit.',
            price: 199000,
            stock: 100,
            isPublished: true,
            categoryId: menCategory.id,
        },
    });

    // Product 2: Shirt Formal
    const p2 = await prisma.product.create({
        data: {
            name: 'Oversized Hoodie Grey',
            slug: 'oversized-hoodie-grey',
            description: 'Hoodie oversize màu xám, chất nỉ dày dặn.',
            price: 399000,
            stock: 50,
            isPublished: true,
            categoryId: menCategory.id,
        },
    });

    // Product 3: Jeans Casual
    const p3 = await prisma.product.create({
        data: {
            name: 'High Waist Jeans Blue',
            slug: 'high-waist-jeans-blue',
            description: 'Quần jeans lưng cao màu xanh dương.',
            price: 499000,
            stock: 70,
            isPublished: true,
            categoryId: womenCategory.id,
        },
    });

    // Product 4: Shorts Gym
    const p4 = await prisma.product.create({
        data: {
            name: 'Leather Belt Brown',
            slug: 'leather-belt-brown',
            description: 'Thắt lưng da thật màu nâu, phù hợp đồ công sở.',
            price: 259000,
            stock: 200,
            isPublished: true,
            categoryId: accessoriesCategory.id,
        },
    });

    // Product 5: Party Shirt (unpublished)
    const p5 = await prisma.product.create({
        data: {
            name: 'Leather Belt Brown',
            slug: 'leather-belt-brown-1',
            description: 'Thắt lưng da thật màu nâu, phù hợp đồ công sở.',
            price: 259000,
            stock: 200,
            isPublished: true,
            categoryId: accessoriesCategory.id,
        },
    });

    // Product 6: T-shirt Gym
    const p6 = await prisma.product.create({
        data: {
            name: 'Performance Training T-Shirt',
            slug: 'performance-training-t-shirt',
            description: 'Moisture-wicking t-shirt designed for intense workouts.',
            price: 34.99,
            stock: 90,
            isPublished: true,
            categoryId: accessoriesCategory.id,
        }
    })
    console.log('✅ Products created\n')

    console.log('🎉 Seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log('  👥 Users:', 3)
    console.log('  📍 Addresses:', 3)
    console.log('  🛍️  Products:', 6, '(5 published, 1 draft)')
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