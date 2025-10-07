const { format, createLogger, transports } = require("winston");
const { combine, timestamp, printf, colorize, errors } = format;

// format của log
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`
});

// khởi tạo logger
const logger = createLogger({
    level: "info",
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // đây là thêm stacktrace vào log,
        logFormat
    ),
    transports: [
        // log ra console
        new transports.Console({
            format: combine(
                colorize() // tô màu level
            )
        }),

        // log ra file
        new transports.File({ // tất cả các log
            filename: 'logs/app.log',
            maxsize: 5242880,
            maxFiles: 5
        }),

        new transports.File({ // chỉ log ra lỗi
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
})

module.exports = logger;