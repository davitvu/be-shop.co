const dotenv = require('dotenv');
dotenv.config();

const common = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: false, // tắt log SQL query
  dialectOptions: { useUTC: true },
  // dialectOptions: { useUTC: true }, // Lưu ngày theo UTC, không phải theo local
  define: {
    timestamps: true, // tự động thêm createdAt và updatedAt.
    // underscored: true, // chuyển camelCase sang snake_case
  },
}

module.exports = {
  development: {
    ...common,
    // thêm gì thì thêm ở đây
  },
  test: {
    ...common,
    // thêm gì thì thêm ở đây
  },
  production: {
    ...common,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 5, // số kết nối tối đa trong pool
      min: parseInt(process.env.DB_POOL_MIN) || 0, // số kết nối tối thiểu trong pool
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000, // thời gian chờ để có được kết nối
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000 // thời gian kết nối không hoạt động trước khi bị đóng
    }
    // thêm gì thì thêm ở đây
  }
}
