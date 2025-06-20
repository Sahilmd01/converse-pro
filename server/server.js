import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

//Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

//Socket.io setup
export const io = new Server(server, {
  cors: { origin: "*" },
});

//Store online users
export const userSocketMap = {};

//Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

//Socket.io connection
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
    // Broadcast updated online users list to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    if (userId) {
      delete userSocketMap[userId];
      // Broadcast updated online users list to all clients
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

//Routes setup
app.use("/api/status", (req, res) => {
  res.send("Server is live");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

await connectDB();

const PORT = process.env.PORT || 5000;

// If Railway or local environment, start listening
if (
  process.env.DEPLOYMENT_PLATFORM === "railway" ||
  process.env.NODE_ENV !== "production"
) {
  server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

//Export server for vercel
export default server;
