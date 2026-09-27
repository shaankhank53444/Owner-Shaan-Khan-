module.exports.config = {
  name: "logout",
  version: "1.0.1",
  hasPermssion: 2, // 2 = Admin / Bot Owner
  credits: "Shaan Khan",
  description: "Logs out the bot from current Facebook session",
  commandCategory: "Admin",
  usages: "logout",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Mirai Admin Check
  const adminIDs = global.config.ADMINBOT || [];
  if (!adminIDs.includes(senderID)) {
    return api.sendMessage("❌ You do not have permission to use this command. Only bot administrators can log out.", threadID, messageID);
  }

  try {
    // React with loading indicator
    api.setMessageReaction("⏳", messageID, (err) => {}, true);

    await api.sendMessage("🔄 Logging out from current Facebook session...", threadID, messageID);

    // Call FCA Logout
    api.logout((err) => {
      if (err) {
        console.error("[LOGOUT] Facebook API logout error:", err);
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        return api.sendMessage(`❌ Logout failed: ${err.message || err}`, threadID, messageID);
      }

      console.log("[LOGOUT] Facebook logout successful.");
      api.setMessageReaction("✅", messageID, (err) => {}, true);
      return api.sendMessage("✅ Logged out successfully. Session has been terminated.", threadID, messageID);
    });

  } catch (error) {
    console.error("[LOGOUT] Exception during logout command:", error);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
    return api.sendMessage(`❌ An error occurred during logout: ${error.message}`, threadID, messageID);
  }
};
