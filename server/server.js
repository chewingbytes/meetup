import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
// import cors from "cors";

dotenv.config();
const app = express();

app.use(express.json());

// app.use(
//   cors({
//     origin: ["http://localhost:8081", "http://46.62.157.49"], // allowed origins
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.json({ message: "Server running", status: "ok" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
