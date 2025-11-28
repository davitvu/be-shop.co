const { PrismaClient, AddressType, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const { createAddressSchema, updateAddressSchema } = require("../middlewares/validations/address.validation");
const { BadRequestError, ConflictRequestError, NotFoundError } = require('../utils/core/errorResponse');
const { OK, Created } = require('../utils/core/successResponse');
const { ADDRESS_PUBLIC_SELECT, ADDRESS_NOT_USERID_SELECT } = require('../prisma/constants/address-selects');

const getAllAddresses = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' }, // lay default truoc
                { createdAt: 'desc' } // lay tao moi truoc
            ],
            select: ADDRESS_NOT_USERID_SELECT
        });

        return new OK({
            message: "Get address successfully",
            metadata: {
                addresses,
                total: addresses.length
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAddressById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const address = await prisma.address.findUnique({
            where: { id },
            select: ADDRESS_PUBLIC_SELECT
        });

        if (!address) throw new NotFoundError('Address not found');
        if (address.userId !== userId) {
            throw new BadRequestError('This address does not belong to you');
        }

        // xoa cot userId
        const { userId: _, ...addressData } = address;

        return new OK({
            message: 'Get address successfully',
            metadata: addressData
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const createAddress = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { error, value } = createAddressSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const {
            nameReminiscent, firstName, lastName, phone,
            address, ward, district, city,
            addressType, isDefault,
        } = value;

        let newAddress;
        await prisma.$transaction(async (tx) => {
            // neu set lam default thi can bo het default dang co
            if (isDefault) {
                await tx.address.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false }
                });
            } else {
                // neu day la dia chi dau tien thi gan cho no lam default
                const addressCount = await tx.address.count({
                    where: { userId }
                });
                if (addressCount === 0) value.isDefault = true;
            }

            newAddress = await tx.address.create({
                data: {
                    userId,
                    nameReminiscent,
                    firstName,
                    lastName,
                    phone,
                    ward,
                    district,
                    city,
                    address,
                    fullAddress: `${address}, ${ward}, ${district}, ${city}`,
                    addressType: addressType === 'HOME' ? AddressType.HOME : AddressType.OFFICE,
                    isDefault: value.isDefault,
                },
                select: ADDRESS_NOT_USERID_SELECT
            });
        });

        return new Created({
            message: 'Address created successfully',
            metadata: newAddress
        }).send(res);
    } catch (error) {
        // Nếu 2 request cùng lúc đều set default, DB sẽ ném unique violation
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ConflictRequestError('Default address already exists');
        }
        // Postgres unique_violation (nếu không map P2002)
        if (error.code === '23505') {
            throw new ConflictRequestError('Default address already exists');
        }
        next(error);
    }
};

const updateAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error, value } = updateAddressSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            throw new BadRequestError(error.details.map(d => d.message).join(', '));
        };

        let updatedAddress;
        await prisma.$transaction(async (tx) => {
            const address = await tx.address.findUnique({
                where: { id },
                select: {
                    id: true,
                    userId: true,
                    isDefault: true,
                },
            });
            if (!address) throw new NotFoundError('Address not found');
            if (address.userId !== userId) {
                throw new BadRequestError('This address does not belong to you');
            }
            if (value.isDefault !== undefined) {
                let addressCount = await tx.address.count({ where: { userId } });

                // muon dat lam default
                if (value.isDefault === true && !address.isDefault && addressCount > 0) {
                    await tx.address.updateMany({
                        where: {
                            userId,
                            isDefault: true,
                            id: { not: id }
                        },
                        data: { isDefault: false }
                    });
                }

                // muon bo default
                if (value.isDefault === false && address.isDefault === true) {
                    if (addressCount === 0) {
                        throw new BadRequestError("You must have at least one default address.");
                    }

                    const remainingAddress = await tx.address.findFirst({
                        where: { userId, id: { not: id } },
                        orderBy: { createdAt: 'desc' },
                        select: { id: true }
                    });

                    if (remainingAddress) {
                        await tx.address.update({
                            where: { id: remainingAddress.id },
                            data: {
                                isDefault: true
                            }
                        });
                    }
                }

                updatedAddress = await tx.address.update({
                    where: { id },
                    data: value,
                    select: ADDRESS_NOT_USERID_SELECT
                });
            }
        });

        return new OK({
            message: 'Address updated successfully',
            metadata: updatedAddress
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const deleteAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await prisma.$transaction(async (tx) => {
            const address = await prisma.address.findUnique({
                where: { id },
                select: {
                    id: true,
                    userId: true,
                    isDefault: true
                }
            });
            if (!address) throw new NotFoundError('Address not found');
            if (address.userId !== userId) {
                throw new BadRequestError('This address does not belong to you');
            }

            await tx.address.delete({ where: { id } });

            // Nếu vừa xóa cái là default, set 1 cái khác làm default (nếu còn address)
            if (address.isDefault) {
                const remainingAddress = await tx.address.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    select: { id: true }
                });

                if (remainingAddress) {
                    await tx.address.update({
                        where: { id: remainingAddress.id },
                        data: { isDefault: true }
                    });
                }
            }
        });

        return new OK({
            message: 'Address deleted successfully'
        }).send(res);
    } catch (error) {
        next(error)
    }
};

const setDefaultAddress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        let updatedAddress;
        await prisma.$transaction(async (tx) => {
            const address = await tx.address.findUnique({
                where: { id },
                select: {
                    id: true,
                    userId: true,
                    isDefault: true
                }
            });
            if (!address) throw new NotFoundError('Address not found');
            if (address.userId !== userId) {
                throw new BadRequestError('This address does not belong to you');
            }
            if (address.isDefault) {
                throw new BadRequestError('This address is already set as default');
            }

            // unset all addresses
            await tx.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });

            updatedAddress = await tx.address.update({
                where: { id },
                data: { isDefault: true },
                select: ADDRESS_NOT_USERID_SELECT
            });
        });

        return new OK({
            message: 'Default address updated successfully',
            metadata: updatedAddress
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllAddresses,
    createAddress,
    getAddressById,
    setDefaultAddress,
    updateAddress,
    deleteAddress
};