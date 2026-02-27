const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "memberinfo",
  version: "1.5.0",
  hasPermssion: 1, // Admin only (Mirai permission level 1)
  credits: "Shaan",
  description: "Get detailed member information with profile picture",
  commandCategory: "Utility",
  usages: "[@mention] or reply or UID",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args, Users }) {
  const { senderID, mentions, threadID, messageReply, type } = event;
  const fs = require('fs-extra'); // Mirai usually uses fs-extra

  // Target UID Determine karna
  let targetUID;
  if (type == "message_reply") {
    targetUID = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
    targetUID = Object.keys(mentions)[0];
  } else if (args[0] && /^\d+$/.test(args[0])) {
    targetUID = args[0];
  } else {
    targetUID = senderID;
  }

  try {
    api.sendMessage('⏳ Member info fetch ho rahi hai, please wait...', threadID);

    // Get User Info from API
    const userInfo = await api.getUserInfo(targetUID);
    const user = userInfo[targetUID] || {};

    const name = user.name || 'Unknown';
    const firstName = user.firstName || '';
    const vanity = user.vanity || 'No Username';
    const profileUrl = user.profileUrl || `https://facebook.com/${targetUID}`;
    const gender = user.gender === 1 ? 'Female 👩' : (user.gender === 2 ? 'Male 👨' : 'Not Specified');
    const isFriend = user.isFriend ? 'Han ✅' : 'Nahi ❌';

    // Graph API for HQ Profile Picture
    let profilePicUrl = `https://graph.facebook.com/${targetUID}/picture?width=1500&height=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    // FB Join Date Fetching (GraphQL)
    let joinDate = "N/A";
    try {
      const profileForm = {
        av: api.getCurrentUserID(),
        fb_api_caller_class: 'RelayModern',
        fb_api_req_friendly_name: 'ProfileCometAboutAppSectionQuery',
        variables: JSON.stringify({ userID: targetUID, scale: 1 }),
        doc_id: '7565670896828001'
      };
      const profileRes = await api.httpPost('https://www.facebook.com/api/graphql/', profileForm);
      const profileData = JSON.parse(profileRes.replace('for (;;);', ''));
      const registrationTime = profileData?.data?.user?.registration_time;
      if (registrationTime) {
        joinDate = new Date(registrationTime * 1000).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        });
      }
    } catch (e) { joinDate = "Private/Error"; }

    // Building Message
    let infoMsg = `👤 𝗠𝗘𝗠𝗕𝗘𝗥 𝗜𝗡𝗙𝗢\n`;
    infoMsg += `━━━━━━━━━━━━━━━━━\n`;
    infoMsg += `📛 Name: ${name}\n`;
    if (firstName && firstName !== name) infoMsg += `   ↳ First: ${firstName}\n`;
    infoMsg += `🆔 UID: ${targetUID}\n`;
    infoMsg += `⚧️ Gender: ${gender}\n`;
    infoMsg += `🔗 Profile: ${profileUrl}\n`;
    infoMsg += `👤 Username: @${vanity}\n`;
    infoMsg += `🤝 Friend: ${isFriend}\n`;
    infoMsg += `📅 FB Join: ${joinDate}\n`;
    infoMsg += `━━━━━━━━━━━━━━━━━\n`;
    infoMsg += `RDX Member Info System`;

    // Handle Profile Picture Attachment
    const cachePath = path.join(__dirname, 'cache', `${targetUID}.jpg`);
    if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'));

    const imgRes = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(cachePath, Buffer.from(imgRes.data, 'utf-8'));

    return api.sendMessage({
      body: infoMsg,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => fs.unlinkSync(cachePath), event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(`❌ Error: ${error.message}`, threadID, event.messageID);
  }
};
