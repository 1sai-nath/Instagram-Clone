import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.route.js"
import dotenv from "dotenv";
import db from "./utils/db.js";
dotenv.config({});

const app = express();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/api/v1/user",userRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  db();

  console.log(`server listening on port ${PORT}`);
});
