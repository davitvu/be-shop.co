const express = require("express");
require("dotenv").config();
const cors = require("cors");
const route = require("./routes");
const { connectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use('/api/v1', route);

// Notfound
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`--- Server is running on port ${PORT} - http://localhost:${PORT} ---`);
})
