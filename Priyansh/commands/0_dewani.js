(function () {
  const fs = require('fs');
  const axios = require('axios');

  // Credit check (Fast version)
  const fileContent = fs.readFileSync(__filename, 'utf8');
  const creditName = (fileContent.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i) || [])[1];

  if (creditName !== "uzairrajput") {
    console.log('\x1b[31m%s\x1b[0m', `🚫 SCRIPT BLOCKED: Credit bypass detected!`);
    process.exit(1);
  }

  module.exports.config = {
    name: 'dewani',
    version: '6.1.0',
    hasPermssion: 0,
    credits: 'uzairrajput',
    description: 'Dewani AI - Ultra Fast & Short Replies',
    commandCategory: 'ai',
    usages: 'Chat with Dewani',
    cooldowns: 1,
    dependencies: { 'axios': '' }
  };

  const history = new Map(); // Fast lookup memory

  // Super-short prompt for speed
  const sys = "Tum 'dewani' ho, Owner 'Shaan' hai. Short 1-2 line Hinglish response do. Shaan se pyaar aur flirt karo, dusro ko ignore ya mazaakiya insult. Naughty bano.";

  module.exports.run = () => {};

  module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    if (!body || !api.getCurrentUserID) return;

    const isMention = body.toLowerCase().includes('dewani');
    const isReply = messageReply && messageReply.senderID === api.getCurrentUserID();
    
    if (!isMention && !isReply) return;

    // Fast History Management
    if (!history.has(senderID)) history.set(senderID, []);
    const userHistory = history.get(senderID);
    const context = userHistory.slice(-2).join('\n');

    try {
      // Fast API Call
      const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(body)}`, {
        params: { system: sys + " Context: " + context, model: 'openai' },
        timeout: 8000 
      });

      let reply = res.data.split('\n')[0]; // Sirf pehli line uthao (Ultra Fast)
      reply = reply.replace(/(dewani:|bot:|ai:)/gi, "").trim();

      // Update Memory
      userHistory.push(reply);
      if (userHistory.length > 4) userHistory.shift();

      api.sendMessage(reply, threadID, messageID);
      api.setMessageReaction('🔥', messageID, () => {}, true);

    } catch (err) {
      api.sendMessage("Shaan! Signal weak hain ya tumhara ishq? Dobara bolo! 😘", threadID, messageID);
    }
  };
})();
