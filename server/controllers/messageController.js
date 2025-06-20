import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

//Get all user except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );
    //Count the number of messages not seen
    const unseenMessages = {};
    // Store last message time for each user
    const userLastMessageMap = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        sender: user._id,
        receiver: userId,
        seen: false,
      });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
      // Find the latest message exchanged with this user
      const lastMsg = await Message.findOne({
        $or: [
          { sender: userId, receiver: user._id },
          { sender: user._id, receiver: userId },
        ],
      })
        .sort({ createdAt: -1 })
        .select("createdAt");
      userLastMessageMap[user._id] = lastMsg ? lastMsg.createdAt : null;
    });
    await Promise.all(promises);
    // Attach lastMessageAt to each user
    const usersWithLastMsg = filteredUsers.map((user) => {
      const u = user.toObject();
      u.lastMessageAt = userLastMessageMap[user._id] || null;
      return u;
    });
    res.json({
      success: true,
      users: usersWithLastMsg,
      unseenMessages,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//Get all messages for selected user

export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: selectedUserId },
        { sender: selectedUserId, receiver: myId },
      ],
    });
    await Message.updateMany(
      { sender: selectedUserId, receiver: myId },
      { seen: true }
    );
    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({
      success: true,
      message: "Message marked as seen",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const sender = req.user._id;
    const receiver = req.params.id;

    const { text, image } = req.body;

    if (!receiver) {
      return res.status(400).json({ message: "Receiver is required." });
    }

    if (!text && !image) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    const newMessage = new Message({
      sender,
      receiver,
      text,
      image,
    });

    // Emit the new message to the receiver's socket immediately
    const receiverSocketId = userSocketMap[receiver];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // Save to database after emitting
    await newMessage.save();

    res.status(200).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
    if (String(message.sender) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message",
      });
    }
    message.deleted = true;
    message.text = "This message was deleted";
    message.image = "";
    await message.save();
    // Emit update to both sender and receiver
    const senderSocketId = userSocketMap[message.sender];
    const receiverSocketId = userSocketMap[message.receiver];
    if (senderSocketId) io.to(senderSocketId).emit("messageDeleted", message);
    if (receiverSocketId)
      io.to(receiverSocketId).emit("messageDeleted", message);
    res.json({ success: true, message: "Message deleted", data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
