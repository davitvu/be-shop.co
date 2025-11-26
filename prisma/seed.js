/* eslint-disable no-console */

const { PrismaClient, UserRole, OrderStatus, AddressType } = require('@prisma/client')
const { hashedPassword } = require('../controllers/auth.controller')
const { default: slugify } = require('slugify')

const prisma = new PrismaClient()

async function main() {
    // Xóa dữ liệu cũ theo thứ tự an toàn (tôn trọng FK constraints)
    console.log('🧹 Cleaning old data...')

    // Xóa theo thứ tự: CartItem → Cart → ProductStyle, ProductImage → ProductVariant → Product → Category, Color, Size, Style → Address → User
    
    await prisma.cartItem.deleteMany()
    console.log('  ✓ CartItems deleted')

    await prisma.cart.deleteMany()
    console.log('  ✓ Carts deleted')

    await prisma.productStyle.deleteMany()
    console.log('  ✓ ProductStyles deleted')

    await prisma.productImage.deleteMany()
    console.log('  ✓ ProductImages deleted')

    await prisma.productVariant.deleteMany()
    console.log('  ✓ ProductVariants deleted')

    await prisma.product.deleteMany()
    console.log('  ✓ Products deleted')

    await prisma.category.deleteMany()
    console.log('  ✓ Categories deleted')

    await prisma.color.deleteMany()
    console.log('  ✓ Colors deleted')

    await prisma.size.deleteMany()
    console.log('  ✓ Sizes deleted')

    await prisma.style.deleteMany()
    console.log('  ✓ Styles deleted')

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
            phone: "0987654322",
            isEmailVerified: true,
        },
    })

    const charlie = await prisma.user.create({
        data: {
            email: 'charlie@gmail.com',
            password: await hashedPassword("123123"),
            firstName: 'Charlie',
            lastName: 'Johnson',
            avatarUrl: 'http://localhost:5173/default.png',
            role: UserRole.USER,
            isActive: true,
            isDeleted: false,
            phone: "0987654323",
            isEmailVerified: true,
        },
    })

    const diana = await prisma.user.create({
        data: {
            email: 'diana@gmail.com',
            password: await hashedPassword("123123"),
            firstName: 'Diana',
            lastName: 'Smith',
            avatarUrl: 'http://localhost:5173/default.png',
            role: UserRole.USER,
            isActive: true,
            isDeleted: false,
            phone: "0987654324",
            isEmailVerified: true,
        },
    })

    const emma = await prisma.user.create({
        data: {
            email: 'emma@gmail.com',
            password: await hashedPassword("123123"),
            firstName: 'Emma',
            lastName: 'Brown',
            avatarUrl: 'http://localhost:5173/default.png',
            role: UserRole.USER,
            isActive: true,
            isDeleted: false,
            phone: "0987654325",
            isEmailVerified: true,
        },
    })

    const frank = await prisma.user.create({
        data: {
            email: 'frank@gmail.com',
            password: await hashedPassword("123123"),
            firstName: 'Frank',
            lastName: 'Wilson',
            avatarUrl: 'http://localhost:5173/default.png',
            role: UserRole.USER,
            isActive: true,
            isDeleted: false,
            phone: "0987654326",
            isEmailVerified: true,
        },
    })

    const grace = await prisma.user.create({
        data: {
            email: 'grace@gmail.com',
            password: await hashedPassword("123123"),
            firstName: 'Grace',
            lastName: 'Miller',
            avatarUrl: 'http://localhost:5173/default.png',
            role: UserRole.USER,
            isActive: true,
            isDeleted: false,
            phone: "0987654327",
            isEmailVerified: true,
        },
    })

    const henry = await prisma.user.create({
        data: {
            email: 'henry@gmail.com',
            password: await hashedPassword("123123"),
            firstName: 'Henry',
            lastName: 'Taylor',
            avatarUrl: 'http://localhost:5173/default.png',
            role: UserRole.USER,
            isActive: true,
            isDeleted: false,
            phone: "0987654328",
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
            address: '123 Đống Đa',
            ward: 'Nghia Do 2',
            district: 'Dong Da',
            city: 'Hanoi',
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
            address: '456 Cầu Giấy',
            ward: 'Cau Giay',
            district: 'Cau Giay',
            city: 'Hanoi',
            fullAddress: "456 Cầu Giấy, Cau Giay, Hanoi",
            addressType: AddressType.OFFICE,
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
            address: '01 Lê Lợi',
            ward: 'Ben Thanh',
            district: 'District 1',
            city: 'Ho Chi Minh City',
            fullAddress: "01 Lê Lợi, District 1, Ho Chi Minh City",
            addressType: AddressType.OFFICE,
            isDefault: true,
        },
    })

    const addrBobHome = await prisma.address.create({
        data: {
            userId: bob.id,
            nameReminiscent: "Home",
            firstName: 'Bob',
            lastName: 'Tran',
            phone: '0900000003',
            address: '789 Nguyễn Hữu Cảnh',
            ward: 'Binh Thanh',
            district: 'Binh Thanh',
            city: 'Ho Chi Minh City',
            fullAddress: "789 Nguyễn Hữu Cảnh, Binh Thanh, Ho Chi Minh City",
            addressType: AddressType.HOME,
            isDefault: true,
        },
    })

    const addrCharlieHome = await prisma.address.create({
        data: {
            userId: charlie.id,
            nameReminiscent: "Home",
            firstName: 'Charlie',
            lastName: 'Johnson',
            phone: '0900000004',
            address: '321 Trần Hưng Đạo',
            ward: 'Thanh Khe',
            district: 'Thanh Khe',
            city: 'Da Nang',
            fullAddress: "321 Trần Hưng Đạo, Thanh Khe, Da Nang",
            addressType: AddressType.HOME,
            isDefault: true,
        },
    })

    const addrDianaHome = await prisma.address.create({
        data: {
            userId: diana.id,
            nameReminiscent: "Home",
            firstName: 'Diana',
            lastName: 'Smith',
            phone: '0900000005',
            address: '654 Pasteur Street',
            ward: 'Pham Ngu Lao',
            district: 'District 1',
            city: 'Ho Chi Minh City',
            fullAddress: "654 Pasteur Street, District 1, Ho Chi Minh City",
            addressType: AddressType.HOME,
            isDefault: true,
        },
    })

    const addrEmmaHome = await prisma.address.create({
        data: {
            userId: emma.id,
            nameReminiscent: "Home",
            firstName: 'Emma',
            lastName: 'Brown',
            phone: '0900000006',
            address: '111 Vo Van Kiet',
            ward: 'Nguyen Hue',
            district: 'District 1',
            city: 'Ho Chi Minh City',
            fullAddress: "111 Vo Van Kiet, District 1, Ho Chi Minh City",
            addressType: AddressType.HOME,
            isDefault: true,
        },
    })

    const addrFrankHome = await prisma.address.create({
        data: {
            userId: frank.id,
            nameReminiscent: "Home",
            firstName: 'Frank',
            lastName: 'Wilson',
            phone: '0900000007',
            address: '222 Nguyen Trai',
            ward: 'Hai Ba Trung',
            district: 'Hai Ba Trung',
            city: 'Hanoi',
            fullAddress: "222 Nguyen Trai, Hai Ba Trung, Hanoi",
            addressType: AddressType.HOME,
            isDefault: true,
        },
    })

    const addrGraceHome = await prisma.address.create({
        data: {
            userId: grace.id,
            nameReminiscent: "Home",
            firstName: 'Grace',
            lastName: 'Miller',
            phone: '0900000008',
            address: '333 Hoang Hoa Tham',
            ward: 'Ba Dinh',
            district: 'Ba Dinh',
            city: 'Hanoi',
            fullAddress: "333 Hoang Hoa Tham, Ba Dinh, Hanoi",
            addressType: AddressType.HOME,
            isDefault: true,
        },
    })

    const addrHenryHome = await prisma.address.create({
        data: {
            userId: henry.id,
            nameReminiscent: "Home",
            firstName: 'Henry',
            lastName: 'Taylor',
            phone: '0900000009',
            address: '444 Tran Phu',
            ward: 'Ngo Quyen',
            district: 'Hai Phong',
            city: 'Hai Phong',
            fullAddress: "444 Tran Phu, Hai Phong",
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

    const dressCategory = await prisma.category.create({
        data: {
            name: 'Dresses',
            slug: 'dresses',
            description: 'Váy các loại, thanh lịch',
            isPublished: true,
        },
    });

    const jacketCategory = await prisma.category.create({
        data: {
            name: 'Jackets',
            slug: 'jackets',
            description: 'Áo khoác, áo ngoài',
            isPublished: true,
        },
    });

    console.log('✅ Categories created\n');

    // ==== Color ====
    console.log('🎨 Creating colors...')
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

    const gray = await prisma.color.create({
        data: {
            name: 'Gray',
            hex: '#808080',
            isActive: true,
        },
    });

    const pink = await prisma.color.create({
        data: {
            name: 'Pink',
            hex: '#FFC0CB',
            isActive: true,
        },
    });

    const green = await prisma.color.create({
        data: {
            name: 'Green',
            hex: '#228B22',
            isActive: true,
        },
    });

    const beige = await prisma.color.create({
        data: {
            name: 'Beige',
            hex: '#F5F5DC',
            isActive: true,
        },
    });

    const brown = await prisma.color.create({
        data: {
            name: 'Brown',
            hex: '#8B4513',
            isActive: true,
        },
    });

    const blue = await prisma.color.create({
        data: {
            name: 'Blue',
            hex: '#0000FF',
            isActive: true,
        },
    });

    const purple = await prisma.color.create({
        data: {
            name: 'Purple',
            hex: '#800080',
            isActive: true,
        },
    });

    console.log('✅ Colors created\n');

    // ==== Sizes ====
    console.log('📏 Creating sizes...')
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

    const sizeXS = await prisma.size.create({
        data: {
            name: 'Extra Small',
            value: 'xs',
            isActive: true,
        },
    });

    const sizeXXL = await prisma.size.create({
        data: {
            name: '2XL',
            value: 'xxl',
            isActive: true,
        },
    });

    const sizeXXXL = await prisma.size.create({
        data: {
            name: '3XL',
            value: 'xxxl',
            isActive: true,
        },
    });

    console.log('✅ Sizes created\n');

    // ==== Products + Variants + Images ====
    console.log('📦 Creating products...')

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

    // --- Product 5: Gray Casual T-Shirt ---
    const product5 = await prisma.product.create({
        data: {
            name: 'Gray Casual T-Shirt',
            slug: 'gray-casual-t-shirt',
            description: 'Áo thun xám thoải mái, phù hợp đi học, đi chơi.',
            price: '179000.00',
            stock: 75,
            isPublished: true,
            categoryId: tShirtCategory.id,
        },
    });

    const p5v1 = await prisma.productVariant.create({
        data: {
            productId: product5.id,
            colorId: gray.id,
            sizeId: sizeS.id,
            sku: 'TSHIRT-GRAY-S',
            price: '179000.00',
            stock: 20,
            isPublished: true,
        },
    });

    const p5v2 = await prisma.productVariant.create({
        data: {
            productId: product5.id,
            colorId: gray.id,
            sizeId: sizeM.id,
            sku: 'TSHIRT-GRAY-M',
            price: '179000.00',
            stock: 30,
            isPublished: true,
        },
    });

    const p5v3 = await prisma.productVariant.create({
        data: {
            productId: product5.id,
            colorId: gray.id,
            sizeId: sizeL.id,
            sku: 'TSHIRT-GRAY-L',
            price: '179000.00',
            stock: 25,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product5.id,
            url: 'https://via.placeholder.com/600x800?text=Gray+Casual+T-Shirt',
            alt: 'Gray casual t-shirt - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // --- Product 6: Pink Summer Dress ---
    const product6 = await prisma.product.create({
        data: {
            name: 'Pink Summer Dress',
            slug: 'pink-summer-dress',
            description: 'Váy hồng thanh lịch, phù hợp mặc dạo phố hay dự tiệc.',
            price: '599000.00',
            stock: 40,
            isPublished: true,
            categoryId: shirtsCategory.id,
        },
    });

    const p6v1 = await prisma.productVariant.create({
        data: {
            productId: product6.id,
            colorId: pink.id,
            sizeId: sizeS.id,
            sku: 'DRESS-PINK-S',
            price: '599000.00',
            stock: 10,
            isPublished: true,
        },
    });

    const p6v2 = await prisma.productVariant.create({
        data: {
            productId: product6.id,
            colorId: pink.id,
            sizeId: sizeM.id,
            sku: 'DRESS-PINK-M',
            price: '599000.00',
            stock: 15,
            isPublished: true,
        },
    });

    const p6v3 = await prisma.productVariant.create({
        data: {
            productId: product6.id,
            colorId: pink.id,
            sizeId: sizeL.id,
            sku: 'DRESS-PINK-L',
            price: '599000.00',
            stock: 15,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product6.id,
            url: 'https://via.placeholder.com/600x800?text=Pink+Summer+Dress',
            alt: 'Pink summer dress - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // --- Product 7: Blue Polo Shirt ---
    const product7 = await prisma.product.create({
        data: {
            name: 'Blue Polo Shirt',
            slug: 'blue-polo-shirt',
            description: 'Áo polo xanh lịch lãm, phù hợp công sở và casual.',
            price: '349000.00',
            stock: 55,
            isPublished: true,
            categoryId: shirtsCategory.id,
        },
    });

    const p7v1 = await prisma.productVariant.create({
        data: {
            productId: product7.id,
            colorId: blue.id,
            sizeId: sizeM.id,
            sku: 'POLO-BLUE-M',
            price: '349000.00',
            stock: 20,
            isPublished: true,
        },
    });

    const p7v2 = await prisma.productVariant.create({
        data: {
            productId: product7.id,
            colorId: blue.id,
            sizeId: sizeL.id,
            sku: 'POLO-BLUE-L',
            price: '349000.00',
            stock: 20,
            isPublished: true,
        },
    });

    const p7v3 = await prisma.productVariant.create({
        data: {
            productId: product7.id,
            colorId: blue.id,
            sizeId: sizeXL.id,
            sku: 'POLO-BLUE-XL',
            price: '349000.00',
            stock: 15,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product7.id,
            url: 'https://via.placeholder.com/600x800?text=Blue+Polo+Shirt',
            alt: 'Blue polo shirt - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // --- Product 8: Brown Casual Jacket ---
    const product8 = await prisma.product.create({
        data: {
            name: 'Brown Casual Jacket',
            slug: 'brown-casual-jacket',
            description: 'Áo khoác nâu, kiểu dáng thanh lịch, ấm áp.',
            price: '799000.00',
            stock: 35,
            isPublished: true,
            categoryId: jacketCategory.id,
        },
    });

    const p8v1 = await prisma.productVariant.create({
        data: {
            productId: product8.id,
            colorId: brown.id,
            sizeId: sizeM.id,
            sku: 'JACKET-BROWN-M',
            price: '799000.00',
            stock: 12,
            isPublished: true,
        },
    });

    const p8v2 = await prisma.productVariant.create({
        data: {
            productId: product8.id,
            colorId: brown.id,
            sizeId: sizeL.id,
            sku: 'JACKET-BROWN-L',
            price: '799000.00',
            stock: 13,
            isPublished: true,
        },
    });

    const p8v3 = await prisma.productVariant.create({
        data: {
            productId: product8.id,
            colorId: brown.id,
            sizeId: sizeXL.id,
            sku: 'JACKET-BROWN-XL',
            price: '799000.00',
            stock: 10,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product8.id,
            url: 'https://via.placeholder.com/600x800?text=Brown+Casual+Jacket',
            alt: 'Brown casual jacket - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // --- Product 9: Purple Evening Dress ---
    const product9 = await prisma.product.create({
        data: {
            name: 'Purple Evening Dress',
            slug: 'purple-evening-dress',
            description: 'Váy tím dự tiệc, trang nhã và sang trọng.',
            price: '899000.00',
            stock: 25,
            isPublished: true,
            categoryId: dressCategory.id,
        },
    });

    const p9v1 = await prisma.productVariant.create({
        data: {
            productId: product9.id,
            colorId: purple.id,
            sizeId: sizeS.id,
            sku: 'DRESS-PURPLE-S',
            price: '899000.00',
            stock: 8,
            isPublished: true,
        },
    });

    const p9v2 = await prisma.productVariant.create({
        data: {
            productId: product9.id,
            colorId: purple.id,
            sizeId: sizeM.id,
            sku: 'DRESS-PURPLE-M',
            price: '899000.00',
            stock: 10,
            isPublished: true,
        },
    });

    const p9v3 = await prisma.productVariant.create({
        data: {
            productId: product9.id,
            colorId: purple.id,
            sizeId: sizeL.id,
            sku: 'DRESS-PURPLE-L',
            price: '899000.00',
            stock: 7,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product9.id,
            url: 'https://via.placeholder.com/600x800?text=Purple+Evening+Dress',
            alt: 'Purple evening dress - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    // --- Product 10: Beige Chino Pants ---
    const product10 = await prisma.product.create({
        data: {
            name: 'Beige Chino Pants',
            slug: 'beige-chino-pants',
            description: 'Quần chinos beige, phù hợp công sở lẫn casual.',
            price: '429000.00',
            stock: 50,
            isPublished: true,
            categoryId: jeansCategory.id,
        },
    });

    const p10v1 = await prisma.productVariant.create({
        data: {
            productId: product10.id,
            colorId: beige.id,
            sizeId: sizeM.id,
            sku: 'CHINO-BEIGE-M',
            price: '429000.00',
            stock: 18,
            isPublished: true,
        },
    });

    const p10v2 = await prisma.productVariant.create({
        data: {
            productId: product10.id,
            colorId: beige.id,
            sizeId: sizeL.id,
            sku: 'CHINO-BEIGE-L',
            price: '429000.00',
            stock: 18,
            isPublished: true,
        },
    });

    const p10v3 = await prisma.productVariant.create({
        data: {
            productId: product10.id,
            colorId: beige.id,
            sizeId: sizeXL.id,
            sku: 'CHINO-BEIGE-XL',
            price: '429000.00',
            stock: 14,
            isPublished: true,
        },
    });

    await prisma.productImage.create({
        data: {
            productId: product10.id,
            url: 'https://via.placeholder.com/600x800?text=Beige+Chino+Pants',
            alt: 'Beige chino pants - front',
            isMain: true,
            sortOrder: 0,
        },
    });

    console.log('✅ Products created\n')

    // ==== Styles + ProductStyles ====
    console.log('✨ Creating Styles...')
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

    console.log('🔗 Assigning styles to products...')
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

    await prisma.productStyle.createMany({
        data: [
            { productId: product5.id, styleId: casualStyle.id },
            { productId: product5.id, styleId: gymStyle.id },
        ],
        skipDuplicates: true,
    });

    await prisma.productStyle.createMany({
        data: [
            { productId: product6.id, styleId: formalStyle.id },
            { productId: product6.id, styleId: partyStyle.id },
        ],
        skipDuplicates: true,
    });

    await prisma.productStyle.createMany({
        data: [
            { productId: product7.id, styleId: formalStyle.id },
            { productId: product7.id, styleId: casualStyle.id },
        ],
        skipDuplicates: true,
    });

    await prisma.productStyle.createMany({
        data: [
            { productId: product8.id, styleId: casualStyle.id },
        ],
        skipDuplicates: true,
    });

    await prisma.productStyle.createMany({
        data: [
            { productId: product9.id, styleId: partyStyle.id },
            { productId: product9.id, styleId: formalStyle.id },
        ],
        skipDuplicates: true,
    });

    await prisma.productStyle.createMany({
        data: [
            { productId: product10.id, styleId: formalStyle.id },
            { productId: product10.id, styleId: casualStyle.id },
        ],
        skipDuplicates: true,
    });

    console.log('✅ Styles assigned\n');

    // ==== CART ITEMS ====
    console.log('🛒 Creating cart items...')
    const cartAlice = await prisma.cart.create({
        data: {
            userId: alice.id,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartAlice.id,
            variantId: p1v1.id, // Black T-Shirt M
            quantity: 2,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartAlice.id,
            variantId: p3v2.id, // Navy Jeans L
            quantity: 1,
        },
    });

    const cartBob = await prisma.cart.create({
        data: {
            userId: bob.id,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartBob.id,
            variantId: p2v1.id, // White Shirt M
            quantity: 1,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartBob.id,
            variantId: p5v2.id, // Gray T-Shirt M
            quantity: 3,
        },
    });

    const cartCharlie = await prisma.cart.create({
        data: {
            userId: charlie.id,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartCharlie.id,
            variantId: p6v1.id, // Pink Dress S
            quantity: 1,
        },
    });

    const cartDiana = await prisma.cart.create({
        data: {
            userId: diana.id,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartDiana.id,
            variantId: p4v1.id, // Red Shorts M
            quantity: 2,
        },
    });

    const cartEmma = await prisma.cart.create({
        data: {
            userId: emma.id,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartEmma.id,
            variantId: p7v2.id, // Blue Polo Shirt L
            quantity: 1,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartEmma.id,
            variantId: p10v1.id, // Beige Chino M
            quantity: 1,
        },
    });

    const cartFrank = await prisma.cart.create({
        data: {
            userId: frank.id,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartFrank.id,
            variantId: p8v2.id, // Brown Jacket L
            quantity: 1,
        },
    });

    const cartGrace = await prisma.cart.create({
        data: {
            userId: grace.id,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartGrace.id,
            variantId: p9v2.id, // Purple Evening Dress M
            quantity: 1,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartGrace.id,
            variantId: p5v1.id, // Gray T-Shirt S
            quantity: 2,
        },
    });

    const cartHenry = await prisma.cart.create({
        data: {
            userId: henry.id,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartHenry.id,
            variantId: p2v2.id, // White Shirt L
            quantity: 1,
        },
    });

    await prisma.cartItem.create({
        data: {
            cartId: cartHenry.id,
            variantId: p10v2.id, // Beige Chino L
            quantity: 1,
        },
    });

    console.log('✅ Cart items created\n')

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