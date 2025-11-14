
const createTransport = require('../../config/nodemailer.config');
const { BadRequestError } = require('../core/errorResponse');

const SendMailForgotPassword = async (email, otp, brand = 'Shop.co', supportEmail = process.env.EMAIL_USER) => {
    try {
        const year = new Date().getFullYear();
        const transporter = await createTransport();

        const info = await transporter.sendMail({
            from: `"Shop.co" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Yêu cầu đặt lại mật khẩu',
            text: `Mã OTP để đặt lại mật khẩu của bạn là: ${otp}`,
            html: `
            <!doctype html>
            <html lang="vi">
            <head>
            <meta charset="utf-8">
            <meta http-equiv="x-ua-compatible" content="ie=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${brand} - Mã OTP đặt lại mật khẩu</title>
            <!-- Preview text (ẩn) -->
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
                Mã OTP của bạn là ${otp}. OTP hết hạn sau 5 phút.
            </div>
            <style>
                /* Một ít responsive rất an toàn cho email client */
                @media (max-width: 620px) {
                .container { width: 100% !important; }
                .content { padding: 20px !important; }
                .otp { font-size: 26px !important; letter-spacing: 6px !important; }
                .btn { display:block !important; width:100% !important; }
                }
            </style>
            </head>
            <body style="margin:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fb;">
                <tr>
                <td align="center" style="padding:24px;">
                    <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(17,24,39,.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#111827,#2563eb);padding:28px 24px;text-align:center;">
                        <div style="font-size:18px;color:#c7d2fe;letter-spacing:.08em;text-transform:uppercase;">${brand}</div>
                        <div style="font-size:20px;color:#e5e7eb;margin-top:6px;font-weight:600;">Đặt lại mật khẩu</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td class="content" style="padding:28px 32px;">
                        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Xin chào,</p>
                        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                            Có yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>${brand}</strong>.
                            Vui lòng sử dụng mã OTP bên dưới để tiếp tục. Mã sẽ <strong>hết hạn sau 5 phút</strong>.
                        </p>

                        <!-- OTP block -->
                        <div style="margin:20px 0 8px;text-align:center;">
                            <div class="otp" style="
                            display:inline-block;
                            padding:14px 18px;
                            background:#111827;
                            color:#ffffff;
                            border-radius:12px;
                            font-weight:700;
                            font-size:28px;
                            letter-spacing:10px;
                            font-variant-numeric:tabular-nums;
                            ">
                            ${otp}
                            </div>
                        </div>

                        <p style="margin:8px 0 16px;font-size:13px;color:#6b7280;text-align:center;">
                            Nếu không phải bạn yêu cầu, bạn có thể bỏ qua email này.
                        </p>

                        <!-- Button (optional) -->
                        <div style="text-align:center;margin:18px 0 8px;">
                            <a class="btn" href="#" style="
                            display:inline-block;
                            background:#2563eb;
                            color:#ffffff;
                            text-decoration:none;
                            padding:12px 18px;
                            border-radius:10px;
                            font-weight:600;
                            ">
                            Mở trang đặt lại mật khẩu
                            </a>
                        </div>

                        <!-- Tips -->
                        <div style="margin-top:18px;padding:12px 14px;background:#f3f4f6;border-radius:12px;color:#374151;font-size:14px;line-height:1.55;">
                            <strong>Mẹo:</strong> Nếu nút không hoạt động, hãy quay lại ứng dụng/website và nhập OTP theo hướng dẫn.
                        </div>

                        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#374151;">
                            Trân trọng,<br>
                            Đội ngũ <strong>${brand}</strong>
                        </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:16px 24px;border-top:1px solid #eef2f7;background:#fbfcfe;">
                        <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                            Cần hỗ trợ? Liên hệ <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>.<br/>
                            © ${year} ${brand}. All rights reserved.
                        </p>
                        </td>
                    </tr>
                    </table>

                    <!-- fallback text-only -->
                    <div style="max-width:600px;margin-top:12px;color:#9ca3af;font-size:12px;">
                    Nếu bạn không hiển thị được email đẹp, mã OTP: <strong style="color:#111827;letter-spacing:4px;">${otp}</strong>
                    </div>
                </td>
                </tr>
            </table>
            </body>
            </html>
            `,
        });

        console.log('Forgot password email sent:', info.messageId);
    } catch (error) {
        console.log('Error sending forgot password email:', error);
        return new BadRequestError("Send email error:", error)
    }
};

module.exports = SendMailForgotPassword;