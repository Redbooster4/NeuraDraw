const express = require("express");
const morgan = require("morgan")
const authRoute = require("./routes/auth.routes")
const cors = require("cors")
const cookieParser = require("cookie-parser")

const app = express();

const allowedOrigins = [
    "http://localhost:5000",   // ← add your actual frontend port
    "http://localhost:5173",   // Vite
    "http://localhost:3001",   // CRA
    "https://yourproductiondomain.com",
]
const corsOptions = {
    origin: allowedOrigins, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.options("/{*path}", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/auth", authRoute)

module.exports = app;