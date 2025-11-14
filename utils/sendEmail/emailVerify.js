const createTransport = require('../../config/nodemailer.config');
const { BadRequestError } = require('../core/errorResponse');

const SendVerificationEmail = async (email, verifyUrl, brand = 'Shop.co', supportEmail = process.env.EMAIL_USER) => {
    try {
        const year = new Date().getFullYear();
        const transporter = await createTransport();

        const info = await transporter.sendMail({
            from: `"Shop.co" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Xác minh email của bạn',
            text: `Nhấn vào liên kết để xác minh email: ${verifyUrl}\n\nNếu không phải bạn yêu cầu, hãy bỏ qua email này.`,
            html: `
            <!doctype html>
            <html lang="vi">
            <head>
            <meta charset="utf-8">
            <meta http-equiv="x-ua-compatible" content="ie=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${brand} - Xác minh email</title>
            <style>
                @media (max-width: 620px) {
                .container { width: 100% !important; }
                .content { padding: 20px !important; }
                .btn { display:block !important; width:100% !important; }
                }
            </style>
            </head>
            <body style="margin:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
            <!-- Preview (ẩn) -->
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
                Hoàn tất xác minh email để kích hoạt tài khoản của bạn.
            </div>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fb;">
                <tr>
                <td align="center" style="padding:24px;">
                    <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(17,24,39,.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#111827,#16a34a);padding:28px 24px;text-align:center;">
                        <div style="font-size:18px;color:#bbf7d0;letter-spacing:.08em;text-transform:uppercase;">${brand}</div>
                        <div style="font-size:20px;color:#e5e7eb;margin-top:6px;font-weight:600;">Xác minh email của bạn</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td class="content" style="padding:28px 32px;">
                        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Xin chào,</p>
                        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                            Cảm ơn bạn đã đăng ký tại <strong>${brand}</strong>.
                            Vui lòng nhấn nút bên dưới để <strong>xác minh địa chỉ email</strong> và kích hoạt tài khoản.
                        </p>

                        <!-- Button -->
                        <div style="text-align:center;margin:20px 0 12px;">
                            <a class="btn" href="${verifyUrl}" target="_blank" rel="noopener" style="
                            display:inline-block;
                            background:#16a34a;
                            color:#ffffff;
                            text-decoration:none;
                            padding:12px 18px;
                            border-radius:10px;
                            font-weight:700;
                            ">
                            Xác minh email
                            </a>
                        </div>

                        <!-- Fallback link -->
                        <p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                            Nếu nút không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt:
                            <br>
                            <a href="${verifyUrl}" style="color:#2563eb;word-break:break-all;text-decoration:none;">${verifyUrl}</a>
                        </p>

                        <!-- Note -->
                        <div style="margin-top:18px;padding:12px 14px;background:#f3f4f6;border-radius:12px;color:#374151;font-size:14px;line-height:1.55;">
                            Vì lý do bảo mật, liên kết xác minh có thể <strong>hết hạn sau một khoảng thời gian</strong>.
                            Nếu bạn không yêu cầu, hãy bỏ qua email này.
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

module.exports = SendVerificationEmail;