const axios = require("axios");

module.exports.config = {
  name: "smsbomb",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "MISS ALIYA",
  description: "Free SMS Bomber (No Payment)",
  commandCategory: "Utility",
  usages: "smsbomb - Then follow steps",
  prefix: true,
  cooldowns: 60
};

const userSessions = {};

// 🔥 FREE SMS APIs (No payment required)
const FREE_SMS_APIS = [
  // API 1: CircuitDigest - 100 Free SMS/month [citation:1]
  {
    name: "CircuitDigest",
    url: "https://www.circuitdigest.cloud/api/v1/send_sms",
    method: "POST",
    headers: (apiKey) => ({
      "Authorization": apiKey || "cd_test_key_2025",
      "Content-Type": "application/json"
    }),
    data: (phone, msg, apiKey) => ({
      mobiles: "91" + phone,
      var1: msg.substring(0, 30),
      var2: "Test"
    }),
    requiresApiKey: true,
    apiKey: null, // User will provide
    successCheck: (res) => res.data?.status === "success"
  },
  
  // API 2: Way2SMS Unofficial - 100 Free SMS/day [citation:10]
  {
    name: "Way2SMS",
    url: "https://way2sms-api.example.com/send", // Note: Need actual endpoint
    method: "POST",
    data: (phone, msg) => ({
      phone: phone,
      message: msg,
      uid: "test_user",
      pwd: "test_pass"
    }),
    requiresApiKey: false,
    successCheck: (res) => res.status === 200
  },
  
  // API 3: Free SMS APIs from GitHub bombers [citation:2][citation:5]
  {
    name: "FreeBomber",
    url: "https://free-sms-api.herokuapp.com/send",
    method: "POST",
    data: (phone, msg) => ({
      to: phone,
      text: msg,
      apikey: "free"
    }),
    requiresApiKey: false,
    successCheck: (res) => res.data?.success === true
  }
];

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;

  userSessions[senderID] = {
    step: 1,
    phoneNumber: null,
    amount: null,
    apiKey: null
  };

  return api.sendMessage(
    "📱 *FREE SMS BOMBER*\n\n" +
    "✨ 100% Free - No Wallet Required\n\n" +
    "Step 1: Phone number likho (Indian)\n" +
    "Example: 9876543210\n\n" +
    "⚠️ *Is message ko reply karo*",
    threadID,
    (err, info) => {
      if (err) return;
      
      userSessions[senderID].messageID = info.messageID;
      
      global.client.handleReply = global.client.handleReply || [];
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        type: "getPhone"
      });
    },
    messageID
  );
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;
  
  if (senderID !== handleReply.author) return;
  
  const session = userSessions[senderID];
  if (!session) return;

  // Get Phone Number
  if (handleReply.type === "getPhone") {
    let phoneNumber = body.trim().replace(/[^0-9]/g, '');
    
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return api.sendMessage(
        "❌ Galat number! Dubara likho:",
        threadID,
        messageID
      );
    }

    session.phoneNumber = phoneNumber;
    session.step = 2;

    return api.sendMessage(
      `📞 Number: ${phoneNumber}\n\n` +
      "Step 2: Kitni SMS bhejni hai? (1-5)\n" +
      "Example: 2\n\n" +
      "⚠️ *Reply karo*",
      threadID,
      (err, info) => {
        if (err) return;
        
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "getAmount"
        });
      },
      messageID
    );
  }

  // Get Amount
  if (handleReply.type === "getAmount") {
    const amount = parseInt(body.trim());
    
    if (isNaN(amount) || amount < 1 || amount > 5) {
      return api.sendMessage("❌ Sirf 1-5 ke beech mein likho!", threadID, messageID);
    }

    session.amount = amount;
    
    // Ask for API Key if needed
    return api.sendMessage(
      "Step 3: CircuitDigest API Key (optional)\n\n" +
      "Agar API key nahi hai to 'skip' likho\n\n" +
      "🔑 *FREE API Key lene ka tarika:*\n" +
      "1. https://www.circuitdigest.cloud/ par jao\n" +
      "2. Register karo (Free)\n" +
      "3. Dashboard se API Key copy karo\n\n" +
      "100 SMS/month free milte hain! [citation:1]",
      threadID,
      (err, info) => {
        if (err) return;
        
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "getApiKey"
        });
      },
      messageID
    );
  }

  // Get API Key
  if (handleReply.type === "getApiKey") {
    const apiKey = body.trim();
    
    if (apiKey.toLowerCase() !== "skip") {
      session.apiKey = apiKey;
    }
    
    await startFreeSMSBombing(api, event, senderID, threadID, messageID, session);
    delete userSessions[senderID];
  }
};

// 🚀 FREE SMS Bombing Function
async function startFreeSMSBombing(api, event, senderID, threadID, messageID, session) {
  const { phoneNumber, amount, apiKey } = session;
  
  const processingMsg = await api.sendMessage(
    `📱 *Free SMS Bombing Started*\n\n` +
    `📞 Number: ${phoneNumber}\n` +
    `📨 Target: ${amount} messages\n` +
    `💰 Cost: ₹0 (FREE)\n` +
    `⏳ Sending...`,
    threadID
  );

  try {
    let successCount = 0;
    let failCount = 0;
    let results = [];

    for (let i = 0; i < amount; i++) {
      const messageText = `Test SMS ${i+1} - Free SMS Bomber`;
      let messageSent = false;

      // Try each free API
      for (const api of FREE_SMS_APIS) {
        try {
          // Skip if requires API key and not provided
          if (api.requiresApiKey && !apiKey) {
            continue;
          }

          const config = {
            method: api.method,
            url: api.url,
            timeout: 8000
          };

          // Add headers if present
          if (api.headers) {
            config.headers = api.headers(apiKey);
          }

          // Add data
          if (api.method === "POST") {
            config.data = api.data(phoneNumber, messageText, apiKey);
          }

          const response = await axios(config);
          
          if (api.successCheck(response)) {
            successCount++;
            results.push(`✅ ${api.name}: Message ${i+1} sent`);
            messageSent = true;
            break; // Success, move to next message
          }
        } catch (error) {
          console.log(`${api.name} failed:`, error.message);
        }
      }

      if (!messageSent) {
        failCount++;
        results.push(`❌ Message ${i+1}: All APIs failed`);
      }

      // Progress update
      await api.sendMessage(
        `📊 Progress: ${i + 1}/${amount} messages\n✅ Success: ${successCount}`,
        threadID,
        processingMsg.messageID
      );
      
      // Delay between messages
      await new Promise(r => setTimeout(r, 2000));
    }

    // Final report
    let reportMsg = 
      `✅ *Free SMS Bombing Complete*\n\n` +
      `📞 Number: ${phoneNumber}\n` +
      `📨 Total: ${amount}\n` +
      `✅ Sent: ${successCount}\n` +
      `❌ Failed: ${failCount}\n\n` +
      `📋 *Results:*\n${results.slice(-3).join('\n')}\n\n`;

    if (successCount === 0) {
      reportMsg += 
        `⚠️ *FREE ALTERNATIVES:*\n\n` +
        `1. **TBomb** - GitHub free tool [citation:2]\n` +
        `2. **nBomber** - PyPI package [citation:5]\n` +
        `3. **CircuitDigest** - 100 free/month [citation:1]\n\n` +
        `💡 *CircuitDigest API Key lo:*\n` +
        `https://www.circuitdigest.cloud/`;
    }

    api.sendMessage(reportMsg, threadID, () => {
      api.unsendMessage(processingMsg.messageID);
    }, messageID);

  } catch (error) {
    console.error("Error:", error);
    api.sendMessage("❌ Error: " + error.message, threadID, messageID);
  }
}