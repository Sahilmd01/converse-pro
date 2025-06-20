import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <div className="w-full h-screen bg-gray-50 p-0 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-full h-full bg-white rounded-none sm:rounded-xl shadow-sm overflow-hidden grid grid-cols-1 relative
          ${
            selectedUser
              ? "fixed inset-0 sm:static sm:rounded-xl sm:h-full"
              : "h-full"
          }
          ${
            selectedUser
              ? "lg:grid-cols-[350px_1fr_350px] xl:grid-cols-[400px_1fr_400px]"
              : "lg:grid-cols-[400px_1fr]"
          }`}
      >
        {/* Left Sidebar */}
        <AnimatePresence>
          {(!selectedUser || window.innerWidth >= 640) && (
            <motion.div
              key="sidebar"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`h-full overflow-y-auto border-r border-gray-100 ${
                selectedUser ? "hidden sm:block" : "block"
              }`}
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Container */}
        <div className="h-full overflow-hidden">
          <ChatContainer />
        </div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              key="right-sidebar"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`h-full overflow-y-auto border-l border-gray-100 ${
                selectedUser ? "hidden sm:block" : "hidden"
              }`}
            >
              <RightSidebar />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default HomePage;