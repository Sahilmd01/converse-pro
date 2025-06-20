import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import { FaTrashAlt, FaEllipsisV, FaArrowDown, FaPaperclip } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    deleteMessage,
  } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const messagesContainerRef = useRef();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileMenuMsg, setMobileMenuMsg] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      setShowScrollButton(scrollTop > 100);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    await sendMessage({ text: input.trim() });
    setInput("");
    scrollToBottom();
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteClick = (msg) => {
    setMessageToDelete(msg);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (messageToDelete) {
      await deleteMessage(messageToDelete._id);
      setShowDeleteModal(false);
      setMessageToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  let longPressTimer = null;
  const handleTouchStart = (msg) => {
    longPressTimer = setTimeout(() => {
      setMobileMenuMsg(msg);
      setShowMobileMenu(true);
    }, 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer);
  };

  useEffect(() => {
    if (selectedUser) {
      setIsLoading(true);
      getMessages(selectedUser._id).finally(() => {
        setTimeout(() => {
          setIsLoading(false);
          scrollToBottom();
        }, 50);
      });
    }
  }, [selectedUser, getMessages, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="animate-pulse text-gray-600">Loading messages...</div>
      </div>
    );
  }

  return selectedUser ? (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 px-6 bg-white shadow-sm border-b border-gray-200">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
        />
        <div className="flex-1">
          <p className="flex items-center gap-2 text-gray-900 font-medium">
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id) && (
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
          </p>
        </div>
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="hidden md:block p-2 text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col-reverse relative"
      >
        {messages.map((msg, index) => {
          const isSender = msg.sender === authUser._id;
          const isDeleted = msg.deleted;
          return (
            <motion.div
              key={msg._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-end gap-3 ${
                isSender ? "justify-end" : "justify-start"
              } group relative`}
              onTouchStart={
                isSender && !isDeleted ? () => handleTouchStart(msg) : undefined
              }
              onTouchEnd={isSender && !isDeleted ? handleTouchEnd : undefined}
            >
              {!isSender && (
                <img
                  src={selectedUser?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              )}
              
              <div className="flex flex-col items-end max-w-[80%]">
                {isDeleted ? (
                  <div className="italic text-sm text-gray-500 bg-gray-100 rounded-lg px-4 py-2">
                    This message was deleted
                  </div>
                ) : msg.image ? (
                  <div className="relative group">
                    <img
                      src={msg.image}
                      alt=""
                      className="max-w-[280px] rounded-lg shadow-sm border border-gray-200"
                    />
                    {isSender && (
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
                        {msg.seen ? "Seen" : ""}
                      </div>
                    )}
                    {isSender && (
                      <button
                        className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md text-gray-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          setShowDropdown(
                            msg._id === showDropdown ? null : msg._id
                          )
                        }
                      >
                        <FaEllipsisV size={12} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative group">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isSender
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    {isSender && (
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
                        {msg.seen ? "Seen" : ""}
                      </div>
                    )}
                    {isSender && (
                      <button
                        className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md text-gray-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          setShowDropdown(
                            msg._id === showDropdown ? null : msg._id
                          )
                        }
                      >
                        <FaEllipsisV size={12} />
                      </button>
                    )}
                  </div>
                )}
                <span className="text-xs text-gray-400 mt-1">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>

              {isSender && (
                <img
                  src={authUser?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              )}

              {showDropdown === msg._id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-8 right-8 bg-white rounded-lg shadow-lg z-10 overflow-hidden border border-gray-200"
                >
                  <button
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
                    onClick={() => handleDeleteClick(msg)}
                  >
                    <FaTrashAlt size={12} />
                    Delete
                  </button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
        <div ref={scrollEnd} />

        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={scrollToBottom}
            className="fixed bottom-24 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 shadow-lg transition-all"
          >
            <FaArrowDown size={16} />
          </motion.button>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <label className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer transition-colors">
            <FaPaperclip size={18} />
            <input
              onChange={handleSendImage}
              type="file"
              id="image"
              accept="image/png, image/jpeg"
              className="hidden"
            />
          </label>
          <div className="flex-1">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className={`p-3 rounded-full ${
              input.trim()
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-300 cursor-not-allowed"
            } text-white transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete message?</h3>
              <p className="text-gray-600 mb-6">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && mobileMenuMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full bg-white rounded-t-2xl p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  handleDeleteClick(mobileMenuMsg);
                  setShowMobileMenu(false);
                }}
              >
                <FaTrashAlt size={14} />
                Delete Message
              </button>
              <button
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : (
    <div className="hidden md:flex flex-col items-center justify-center gap-4 h-full bg-gradient-to-br from-indigo-50 to-blue-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <img src={assets.logo_icon} alt="" className="w-20 h-20 mb-4" />
        <h3 className="text-2xl font-medium text-gray-800">ConversePro</h3>
        <p className="text-gray-500 mt-2">Select a chat to start messaging</p>
      </motion.div>
    </div>
  );
};

export default ChatContainer;