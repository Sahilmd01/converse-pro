export function formatMessageTime(date) {
  try {
    if (!date) return "";
    const messageDate = new Date(date);
    if (isNaN(messageDate.getTime())) return "";
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting message time:", error);
    return "";
  }
}
