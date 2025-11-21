const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "imgur",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan | ArYAN",
  description: "Upload image to Imgur",
  commandCategory: "tools",
  usages: "[reply to image]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
  const { messageReply, attachments, threadID, messageID } = event;
  let imageUrl;

  if (event.type === "message_reply" && messageReply.attachments.length > 0) {
    imageUrl = messageReply.attachments[0].url;
  } else if (attachments.length > 0) {
    imageUrl = attachments[0].url;
  } else {
    return api.sendMessage("⚠️ Please reply to an image or send an image.", threadID, messageID);
  }

  try {
    const res = await axios.get(
      `http://65.109.80.126:20409/aryan/imgur?url=${encodeURIComponent(imageUrl)}`
    );

    const uploadedLink = res.data.imgur;

    if (!uploadedLink) {
      return api.sendMessage("❌ Failed to upload to Imgur.", threadID, messageID);
    }

    return api.sendMessage(`✅ Uploaded:\n${uploadedLink}`, threadID, messageID);

  } catch (err) {
    return api.sendMessage("❌ Error occurred while uploading. Try again later.", threadID, messageID);
  }
};