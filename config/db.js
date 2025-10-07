const { Sequelize } = require("sequelize");
const sequelizeConfig = require("./config");
const logger = require("./logger");

const dbConfig = sequelizeConfig[process.env.NODE_ENV];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        define: dbConfig.define,
        dialectOptions: dbConfig.dialectOptions,
        pool: dbConfig.pool,
    }
)

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connected successfully');

        // Sync models with database
        // nếu DB_SYNC=true thì mỗi lần server khởi động sẽ đồng bộ lại model với database
        if (process.env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true') {
            require("../models");
            // console.log('Loaded models:', Object.keys(require("../models").sequelize.models));
            await sequelize.sync({ force: true }); // force: true sẽ xóa hết data cũ
            logger.info("All models were synchronized successfully.");
        }
    } catch (error) {
        logger.error('Failed to connect to the database', error);
        process.exit(1);
    }
}

module.exports = { connectDB, sequelize };