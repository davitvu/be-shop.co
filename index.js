const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require('cookie-parser')
const route = require("./routes");
const { errorHandler, endpointNotFound } = require("./utils/core/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// middlewares
app.use(cors({
    origin: process.env.FE_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/api/v1', route);

// endpointNotFound
app.use(endpointNotFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`--- Server is running on port ${PORT} - http://localhost:${PORT} ---`);
})
