/* eslint-disable no-console */

const { PrismaClient, UserRole, OrderStatus, AddressType } = require('@prisma/client')
const { hashedPassword } = require('../controllers/auth.controller')
const { default: slugify } = require('slugify')

const prisma = new PrismaClient()

async function main() {
    // Xóa dữ liệu cũ theo thứ tự an toàn (tôn trọng FK)
    console.log('🧹 Cleaning old data...')

    await prisma.color.deleteMany()
    console.log('  ✓ Colors deleted')

    await prisma.style.deleteMany()
    console.log('  ✓ Styles deleted')

    await prisma.productImage.deleteMany()
    console.log('  ✓ ProductImages deleted')

    await prisma.productVariant.deleteMany()
    console.log('  ✓ ProductVariants deleted')

    await prisma.productStyle.deleteMany()
    console.log('  ✓ ProductStyles deleted')

    await prisma.size.deleteMany()
    console.log('  ✓ Sizes deleted')

    await prisma.product.deleteMany()
    console.log('  ✓ Products deleted')

    await prisma.category.deleteMany()
    console.log('  ✓ Categories deleted')

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
            email: 'alice@gmail.com',
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
            email: 'bob@gmail.com',
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
    const tShirtCategory = await prisma.category.create({
        data: {
            name: 'T-Shirts',
            slug: 't-shirts',
            description: 'Áo thun basic, thoải mái',
            isPublished: true,
        },
    });

    const shirtsCategory = await prisma.category.create({
        data: {
            name: 'Shirts',
            slug: 'shirts',
            description: 'Áo sơ mi lịch sự',
            isPublished: true,
        },
    });

    const jeansCategory = await prisma.category.create({
        data: {
            name: 'Jeans',
            slug: 'jeans',
            description: 'Quần jeans các loại',
            isPublished: true,
        },
    });

    const shortsCategory = await prisma.category.create({
        data: {
            name: 'Shorts',
            slug: 'shorts',
            description: 'Quần short thoải mái',
            isPublished: true,
        },
    });

    console.log('✅ Seed Categories done');

    // ==== Color ====
    console.log('🛍️  Creating colors...')
    const black = await prisma.color.create({
        data: {
            name: 'Black',
            hex: '#000000',
            isActive: true,
        },
    });

    const white = await prisma.color.create({
        data: {
            name: 'White',
            hex: '#FFFFFF',
            isActive: true,
        },
    });

    const navy = await prisma.color.create({
        data: {
            name: 'Navy',
            hex: '#1D3557',
            isActive: true,
        },
    });

    const red = await prisma.color.create({
        data: {
            name: 'Red',
            hex: '#E63946',
            isActive: true,
        },
    });
    console.log('✅ Seed Colors done');

    // ==== Sizes ====
    console.log('🛍️  Creating sizes...')
    const sizeS = await prisma.size.create({
        data: {
            name: 'Small',
            value: 's',
            isActive: true,
        },
    });

    const sizeM = await prisma.size.create({
        data: {
            name: 'Medium',
            value: 'm',
            isActive: true,
        },
    });

    const sizeL = await prisma.size.create({
        data: {
            name: 'Large',
            value: 'l',
            isActive: true,
        },
    });

    const sizeXL = await prisma.size.create({
        data: {
            name: 'Extra Large',
            value: 'xl',
            isActive: true,
        },
    });
    console.log('✅ Seed Sizes done');

    // ==== Products + Variants + Images ====
    console.log('🛍️  Creating products...')

    // Product 1: T-shirt Casual
    // --- Product 1: Basic Black T-Shirt ---
    const product1 = await prisma.product.create({
        data: {
            name: 'Basic Black T-Shirt',
            slug: 'basic-black-t-shirt',
            description: 'Áo thun đen basic, chất liệu cotton 100%, unisex.',
            price: '199000.00',
            stock: 100,
            isPublished: true,
            categoryId: tShirtCategory.id,
        },
    });

    // Variants cho Product 1
    const p1v1 = await prisma.productVariant.create({
        data: {
            productId: product1.id,
            colorId: black.id,
            sizeId: sizeM.id,
            sku: 'TSHIRT-BLACK-M',
            price: '199000.00',
            stock: 30,
            isPublished: true,
        },
    });

    const p1v2 = await prisma.productVariant.create({
        data: {
            productId: product1.id,
            colorId: black.id,
            sizeId: sizeL.id,
            sku: 'TSHIRT-BLACK-L',
            price: '199000.00',
            stock: 40,
            isPublished: true,
        },
    });

    // Ảnh chung cho Product 1
    const p1ImgCommon = await prisma.productImage.create({
        data: {
            productId: product1.id,
            url: 'https://via.placeholder.com/600x800?text=Basic+Black+T-Shirt',
            alt: 'Basic black t-shirt - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // Ảnh riêng cho variant M
    const p1ImgVariantM = await prisma.productImage.create({
        data: {
            productId: product1.id,
            variantId: p1v1.id,
            url: 'https://via.placeholder.com/600x800?text=Basic+Black+T-Shirt+M',
            alt: 'Basic black t-shirt size M',
            isMain: false,
            sortOrder: 1,
        },
    });

    // Ảnh riêng cho variant L
    const p1ImgVariantL = await prisma.productImage.create({
        data: {
            productId: product1.id,
            variantId: p1v2.id,
            url: 'https://via.placeholder.com/600x800?text=Basic+Black+T-Shirt+L',
            alt: 'Basic black t-shirt size L',
            isMain: false,
            sortOrder: 2,
        },
    });

    // Ảnh phụ chung cho Product 1 (gallery)
    await prisma.productImage.create({
        data: {
            productId: product1.id,
            url: 'https://via.placeholder.com/600x800?text=Basic+Black+T-Shirt+Back',
            alt: 'Basic black t-shirt - back',
            isMain: false,
            sortOrder: 3,
        },
    });

    // --- Product 2: White Formal Shirt ---
    const product2 = await prisma.product.create({
        data: {
            name: 'White Formal Shirt',
            slug: 'white-formal-shirt',
            description: 'Áo sơ mi trắng, form slim fit, phù hợp công sở.',
            price: '399000.00',
            stock: 50,
            isPublished: true,
            categoryId: shirtsCategory.id,
        },
    });

    const p2v1 = await prisma.productVariant.create({
        data: {
            productId: product2.id,
            colorId: white.id,
            sizeId: sizeM.id,
            sku: 'SHIRT-WHITE-M',
            price: '399000.00',
            stock: 15,
            isPublished: true,
        },
    });

    const p2v2 = await prisma.productVariant.create({
        data: {
            productId: product2.id,
            colorId: white.id,
            sizeId: sizeL.id,
            sku: 'SHIRT-WHITE-L',
            price: '399000.00',
            stock: 20,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product2.id,
            url: 'https://via.placeholder.com/600x800?text=White+Formal+Shirt',
            alt: 'White formal shirt - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // Variant-specific image for product 2 (size L)
    await prisma.productImage.create({
        data: {
            productId: product2.id,
            variantId: p2v2.id,
            url: 'https://via.placeholder.com/600x800?text=White+Formal+Shirt+L',
            alt: 'White formal shirt size L',
            isMain: false,
            sortOrder: 1,
        },
    });

    // --- Product 3: Navy Slim Jeans ---
    const product3 = await prisma.product.create({
        data: {
            name: 'Navy Slim Jeans',
            slug: 'navy-slim-jeans',
            description: 'Quần jeans xanh đậm, form slim, co giãn nhẹ.',
            price: '499000.00',
            stock: 60,
            isPublished: true,
            categoryId: jeansCategory.id,
        },
    });

    const p3v1 = await prisma.productVariant.create({
        data: {
            productId: product3.id,
            colorId: navy.id,
            sizeId: sizeM.id,
            sku: 'JEANS-NAVY-M',
            price: '499000.00',
            stock: 20,
            isPublished: true,
        },
    });

    const p3v2 = await prisma.productVariant.create({
        data: {
            productId: product3.id,
            colorId: navy.id,
            sizeId: sizeL.id,
            sku: 'JEANS-NAVY-L',
            price: '499000.00',
            stock: 25,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product3.id,
            url: 'https://via.placeholder.com/600x800?text=Navy+Slim+Jeans',
            alt: 'Navy slim jeans - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // Variant-specific image for product 3 (size L)
    await prisma.productImage.create({
        data: {
            productId: product3.id,
            variantId: p3v2.id,
            url: 'https://via.placeholder.com/600x800?text=Navy+Slim+Jeans+L',
            alt: 'Navy slim jeans size L',
            isMain: false,
            sortOrder: 1,
        },
    });

    // --- Product 4: Red Sport Shorts ---
    const product4 = await prisma.product.create({
        data: {
            name: 'Red Sport Shorts',
            slug: 'red-sport-shorts',
            description: 'Quần short thể thao màu đỏ, nhanh khô, thoáng mát.',
            price: '259000.00',
            stock: 80,
            isPublished: true,
            categoryId: shortsCategory.id,
        },
    });

    const p4v1 = await prisma.productVariant.create({
        data: {
            productId: product4.id,
            colorId: red.id,
            sizeId: sizeM.id,
            sku: 'SHORT-RED-M',
            price: '259000.00',
            stock: 30,
            isPublished: true,
        },
    });

    const p4v2 = await prisma.productVariant.create({
        data: {
            productId: product4.id,
            colorId: red.id,
            sizeId: sizeL.id,
            sku: 'SHORT-RED-L',
            price: '259000.00',
            stock: 30,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product4.id,
            url: 'https://via.placeholder.com/600x800?text=Red+Sport+Shorts',
            alt: 'Red sport shorts - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // Variant-specific image for product 4 (size L)
    await prisma.productImage.create({
        data: {
            productId: product4.id,
            variantId: p4v2.id,
            url: 'https://via.placeholder.com/600x800?text=Red+Sport+Shorts+L',
            alt: 'Red sport shorts size L',
            isMain: false,
            sortOrder: 1,
        },
    });
    console.log('✅ Products created\n')

    // ==== Styles + ProductStyles ====
    console.log('🛍️  Creating Styles...')
    const casualStyle = await prisma.style.create({
        data: {
            name: 'Casual',
            description: 'Phong cách thường ngày, thoải mái',
            slug: slugify("Casual", {
                lower: true,
                strict: true,
                locale: 'vi',
                trim: true
            }),
            isActive: true,
        },
    });

    const formalStyle = await prisma.style.create({
        data: {
            name: 'Formal',
            description: 'Phong cách lịch sự, công sở',
            slug: slugify('Formal', {
                lower: true,
                strict: true,
                locale: 'vi',
                trim: true
            }),
            isActive: true,
        },
    });

    const partyStyle = await prisma.style.create({
        data: {
            name: 'Party',
            description: 'Phong cách tiệc tùng, nổi bật',
            slug: slugify('Party', {
                lower: true,
                strict: true,
                locale: 'vi',
                trim: true
            }),
            isActive: true,
        },
    });

    const gymStyle = await prisma.style.create({
        data: {
            name: 'Gym',
            description: 'Phong cách thể thao, tập luyện',
            slug: slugify('Gym', {
                lower: true,
                strict: true,
                locale: 'vi',
                trim: true
            }),
            isActive: true,
        },
    });

    console.log('🛍️  Assign style for product...')
    await prisma.productStyle.createMany({
        data: [
            { productId: product1.id, styleId: casualStyle.id },
            { productId: product1.id, styleId: gymStyle.id },
        ],
        skipDuplicates: true,
    });

    await prisma.productStyle.createMany({
        data: [
            { productId: product2.id, styleId: formalStyle.id },
        ],
        skipDuplicates: true,
    });

    await prisma.productStyle.createMany({
        data: [
            { productId: product3.id, styleId: casualStyle.id },
            { productId: product3.id, styleId: partyStyle.id },
        ],
        skipDuplicates: true,
    });

    await prisma.productStyle.createMany({
        data: [
            { productId: product4.id, styleId: gymStyle.id },
            { productId: product4.id, styleId: casualStyle.id },
        ],
        skipDuplicates: true,
    });
    console.log('✅ Seed Sizes done');

    console.log('🎉 Seed completed successfully!\n')
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