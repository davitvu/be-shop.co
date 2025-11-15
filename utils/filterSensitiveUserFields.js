const filterSensitiveUserFields = (user) => {
    if (!user) return null;

    const {
        password,
        emailVerificationToken,
        emailVerificationExpires,
        resetPasswordToken,
        resetPasswordExpires,
        ...filteredUser
    } = user;

    return filteredUser;
};

module.exports = { filterSensitiveUserFields };