const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema, passwordSchema } = require('../middlewares/validations/auth.validation');
const bcrypt = require('bcryptjs');
const { ConflictRequestError, BadRequestError, ForbiddenError, NotFoundError, AuthFailureError } = require('../utils/core/errorResponse');
const { Created, OK } = require('../utils/core/successResponse')
const otpGenerator = require('otp-generator');
const SendMailForgotPassword = require('../utils/sendEmail/forgotPassword');
const SendVerificationEmail = require('../utils/sendEmail/emailVerify');
const { filterSensitiveUserFields } = require('../utils/filterSensitiveUserFields');

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })
}

const hashedPassword = async (password, salt = 10) => {
    return await bcrypt.hash(password, salt);
}

const setCookie = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
        maxAge: 15 * 60 * 1000 // 15 phut
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // khong the truy cap bang js
        secure: process.env.NODE_ENV === 'production', // chi gui qua http
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict', // Thiết lập sameSite: 'None' cho các cookie cross-origin và đảm bảo rằng secure: true để sử dụng cookie qua HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngay
    });
}

const register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        const { error } = registerSchema.validate(req.body, { abortEarly: false }) // abortEarly: false tức là trả về tất cả lỗi, không dừng ở lỗi đầu tiên
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const existed = await prisma.user.findUnique({ where: { email } });
        if (existed) throw new ConflictRequestError('User already exists');

        let newUser;
        await prisma.$transaction(async (tx) => {
            newUser = await tx.user.create({
                data: {
                    email,
                    password: await hashedPassword(password),
                    firstName,
                    lastName,
                    phone,
                    avatarUrl: `${process.env.FE_URL}/default.png`
                }
            });

            const verificationToken = jwt.sign(
                { userId: newUser.id, email: newUser.email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            await tx.user.update({
                where: { id: newUser.id },
                data: {
                    emailVerificationToken: verificationToken,
                    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            })

            newUser.emailVerificationToken = verificationToken;
        })

        try {
            const verifyUrl = `${process.env.FE_URL}/verify-email?token=${newUser.emailVerificationToken}`;
            await SendVerificationEmail(newUser.email, verifyUrl);
        } catch (sendMailErr) {
            await prisma.user.delete({ where: { id: newUser.id } });
            throw new BadRequestError('Send email verify failed, vui lòng thử lại. Please try again!');
        }

        return new Created({
            message: 'Registration successful. Please check your email to verify.',
        }).send(res);
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
            throw new BadRequestError(errorMessages);
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundError('Invalid email or password');

        // Check email verify
        if (!user.isEmailVerified) throw new BadRequestError('Please verify your email before logging in');

        // Check isActive
        if (!user.isActive) throw new ForbiddenError('Your account has been locked. Please contact administrator');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new NotFoundError('Invalid email or password');

        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

        setCookie(res, accessToken, refreshToken);

        return new OK({
            message: 'Login successful',
            metadata: {
                user: filterSensitiveUserFields(user)
            }
        }).send(res);
    } catch (error) {
        return next(error)
    }
}

const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) throw new AuthFailureError('No refresh token');

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') throw new AuthFailureError('Refresh token expired. Please login again');
            throw new AuthFailureError('Invalid refresh token');
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) throw new NotFoundError('Invalid refresh token or User not found');
        if (!user.isActive) throw new ForbiddenError('Your account has been locked');

        const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
        const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

        setCookie(res, newAccessToken, newRefreshToken);

        return new OK({
            message: 'Token refreshed successfully',
        });
    } catch (error) {
        return next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        // Với approach đơn giản, logout chỉ là thông báo cho client xóa token
        // Client sẽ xóa accessToken và refreshToken khỏi localStorage/cookie
        const { id } = req.user;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundError('Invalid Id or User not found');

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        return new OK({
            message: 'Logout successful. Please remove tokens from client storage.',
        });
    } catch (error) {
        return next(error);
    }
}

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const findUser = await prisma.user.findFirst({ where: { email } });
        if (!findUser) return new OK({ message: 'If email exists, OTP has been sent' }).send(res);

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false
        })

        const tokenForgotPassword = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: '5m'
        });

        res.cookie('tokenForgotPassword', tokenForgotPassword, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
            maxAge: 5 * 60 * 1000
        });

        await prisma.user.update({
            where: { id: findUser.id },
            data: {
                resetPasswordToken: otp,
                resetPasswordExpires: new Date(Date.now() + 5 * 60 * 1000) // het han sau 5 phut
            }
        });

        await SendMailForgotPassword(email, otp);

        return new OK({
            message: "Send email success, check your email",
        }).send(res);
    } catch (error) {
        return next(error);
    }
}

const verifyOtpForgotPassword = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const tokenForgotPassword = req.cookies.tokenForgotPassword;

        if (!tokenForgotPassword || !otp) throw new BadRequestError("Invalid data");

        let decoded;
        try {
            decoded = jwt.verify(tokenForgotPassword, process.env.JWT_SECRET);
        } catch (e) {
            if (e.name === 'TokenExpiredError') throw new BadRequestError('Token expired, please request again');
            throw new BadRequestError('Invalid token');
        }

        const user = await prisma.user.findFirst({
            where: {
                email: decoded.email,
                resetPasswordToken: otp
            }
        })
        if (!user) throw new BadRequestError("OTP is incorrect");

        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new BadRequestError('OTP expired, please request again');
        }

        const verifiedToken = jwt.sign(
            { email: decoded.email, otpVerified: true },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        res.cookie('verifiedOtpToken', verifiedToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
            maxAge: 6 * 60 * 1000
        });

        res.clearCookie('tokenForgotPassword');

        return new OK({ message: 'OTP verification successful' }).send(res);
    } catch (error) {
        return next(error);
    }
}

const changePasswordWithOtp = async (req, res, next) => {
    try {
        const { password } = req.body;
        const verifiedOtpToken = req.cookies.verifiedOtpToken;

        if (!verifiedOtpToken || !password) throw new BadRequestError("Invalid data, please request again");

        let decoded;
        try {
            decoded = jwt.verify(verifiedOtpToken, process.env.JWT_SECRET);
        } catch (e) {
            if (e.name === 'TokenExpiredError') throw new BadRequestError('Token expired, please request again');
            throw new BadRequestError('Invalid token');
        }

        const { error } = passwordSchema.validate({ password });
        if (error) throw new BadRequestError(error.details[0].message);

        if (!decoded.otpVerified) throw new BadRequestError("OTP not verified");

        await prisma.$transaction(async (tx) => {
            const user = await prisma.user.findFirst({ where: { email: decoded.email } });
            if (!user) throw new BadRequestError("Invalid Email or User not found");

            const updated = await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: await hashedPassword(password),
                    // clear
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                    password_changed_at: new Date()
                }
            });

            return updated;
        });

        // clear cookie
        res.clearCookie('verifiedOtpToken');

        return new OK({ message: "Password changed successfully" }).send(res);
    } catch (error) {
        return next(error);
    }
}

const sendVerificationEmail = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError('Invalid Id or User not found');
        if (user.isEmailVerified) return new OK({ message: "Email already verified" }).send(res);

        const verificationToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken: verificationToken,
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        })

        const verifyUrl = `${process.env.FE_URL}/verify-email?token=${verificationToken}`;

        await sendVerificationEmail(user.email, verifyUrl);

        return new OK({
            message: "Verification email sent successfully. Please check your inbox."
        }).send(res);
    } catch (error) {
        return next(error);
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) throw new BadRequestError("Verification token is required");

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            if (e.name === 'TokenExpiredError') {
                throw new BadRequestError('Verification link expired. Please request a new one.');
            }
            throw new BadRequestError('Invalid verification token');
        }

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: decoded.userId } });
            if (!user) throw new BadRequestError("User not found");

            // kiem tra da xac thuc chua
            if (user.isEmailVerified) throw new BadRequestError("Email already verified");

            // kiem tra token co giong nhau ko
            if (user.emailVerificationToken !== token) throw new BadRequestError("Invalid or expired token");

            // kiem tra han cua token
            if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
                throw new BadRequestError("Verification link expired");
            }

            await tx.user.update({
                where: { id: user.id },
                data: {
                    isEmailVerified: true,
                    emailVerificationToken: null,
                    emailVerificationExpires: null,
                }
            });
        });

        return new OK({
            message: "Email verified successfully!"
        }).send(res);
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    hashedPassword,
    forgotPassword,
    verifyOtpForgotPassword,
    changePasswordWithOtp,
    sendVerificationEmail,
    verifyEmail
}