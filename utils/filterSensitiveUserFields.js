const filterSensitiveUserFields = (user) => {
    if (!user) return null;

    const {
        password,
        emailVerificationToken,
        emailVerificationExpires,
        resetPasswordToken,
        resetPasswordExpires,
        password_changed_at,
        isDeleted,
        deletedAt,
        deletedBy,
        deletedUsers,
        phone,
        ...filteredUser
    } = user;

    return filteredUser;
};

module.exports = { filterSensitiveUserFields };