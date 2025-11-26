const ADDRESS_PUBLIC_SELECT = {
    id: true,
    userId: true,
    nameReminiscent: true,
    firstName: true,
    lastName: true,
    phone: true,
    address: true,
    ward: true,
    district: true,
    city: true,
    fullAddress: true,
    isDefault: true,
    createdAt: true,
    updatedAt: true
}

const { userId, ADDRESS_NOT_USERID_SELECT } = ADDRESS_PUBLIC_SELECT;

module.exports = {
    ADDRESS_NOT_USERID_SELECT,
    ADDRESS_PUBLIC_SELECT
}