const SIZE_PUBLIC_SELECT = {
    id: true,
    name: true,
    value: true,
    isActive: true,
    _count: {
        select: {
            variants: {
                where: { isDeleted: false }
            }
        }
    },
    createdAt: true,
    updatedAt: true
}

module.exports = {
   SIZE_PUBLIC_SELECT 
}