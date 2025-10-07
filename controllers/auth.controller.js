const createError = require('http-errors');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { errorHandler } = require('../middlewares/errorHandler');
const { registerSchema, loginSchema } = require('../middlewares/validator/auth.validator');

const generateAccessToken = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
}

const generateRefreshToken = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
}

const register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        const { error } = registerSchema.validate(req.body, { abortEarly: false }) // abortEarly: false tức là trả về tất cả lỗi, không dừng ở lỗi đầu tiên
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            return next(createError(400, errorMessages))
        }

        const existed = await User.findOne({ where: { email } });
        if (existed) return next(createError(409, 'User already exists'));

        const user = await User.create({ email, password, firstName, lastName, phone, avatar: `${process.env.FE_URL}/default.png` });

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: user,
        });
    } catch (error) {
        return next(error);
    }
}

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { error } = loginSchema.validate(req.body, { abortEarly: false }) // abortEarly: false tức là trả về tất cả lỗi, không dừng ở lỗi đầu tiên
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            return next(createError(400, errorMessages));
        }

        const user = await User.findOne({ where: { email } });
        if (!user) return next(createError(401, 'Invalid email or password'));

        // Check email verify
        if (!user.isEmailVerified) return next(createError(400, 'Please verify your email before logging in'));

        // Check isActive
        if (!user.isActive) return next(createError(403, 'Your account has been locked. Please contact administrator'));

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return next(createError(401, 'Invalid email or password'));

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: user,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        return next(error)
    }
}

const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findByPk(decoded.id);
        if (!user) return next(createError(401, 'User not found'));
        if (!user.isActive) return next(createError(401, 'Your account has been locked'));

        const newAccessToken = generateAccessToken(user);

        return res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken,
            },
        });
    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        // Với approach đơn giản, logout chỉ là thông báo cho client xóa token
        // Client sẽ xóa accessToken và refreshToken khỏi localStorage/cookie

        return res.json({
            success: true,
            message: 'Logout successful. Please remove tokens from client storage.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshAccessToken,
    logout
}