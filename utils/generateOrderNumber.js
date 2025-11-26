/**
 * Generate order number
 * Format: ORD-DDMMYYYY-XXXXXX
 * Example: ORD-20240116-AB1C20
 */

const generateOrderNumber = async (prisma) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix =  `${day}${month}${year}`;
    const numRandom = Math.random().toString(36).substring(2,8).toUpperCase();

    return `ORD-${datePrefix}-${numRandom}`;
};

module.exports = { generateOrderNumber };