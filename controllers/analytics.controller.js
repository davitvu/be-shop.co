const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const validate = require('../utils/validateSchema');

const getRevenueStats = async (req, res, next) => {
    try {
        const { startDate, endDate, groupBy } = validate(getRevenueStats, req.query);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                },
                status: { notIn: ['CANCELLED', 'REFUNDED']}
            },
            select: {
                total: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        })

        // group orders by period
        const groupedData = {};

        orders.forEach(order => {
            let key;
            
        });
    } catch (error) { 
        next(error);
    }
};