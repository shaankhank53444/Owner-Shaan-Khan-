const axios = require("axios");

module.exports.config = {
	name: "trans",
	version: "2.0.0",
	hasPermssion: 0,
	credits: "Shaan Khan",
	description: "Translate any text or replied message into multiple languages seamlessly",
	commandCategory: "translator",
	usages: "[Text] or [Text] -> [lang_code] (e.g., trans kase ho -> en)",
	cooldowns: 3,
	dependencies: {
		"axios": ""
	}
};

module.exports.run = async ({ api, event, args }) => {
	try {
		let content = args.join(" ");
		let translateThis = "";
		let lang = "ur"; // Default target language Urdu set ki hai (aap chahen toh 'en' ya 'hi' kar sakte hain)

		// Check if replying to a message
		if (event.type === "message_reply") {
			translateThis = event.messageReply.body;
			if (content && content.includes("->")) {
				let parts = content.split("->").map(item => item.trim());
				if (parts[1]) lang = parts[1];
			}
		} 
		else {
			if (!content) return api.utils ? api.utils.throwError(this.config.name, event.threadID, event.messageID) : api.sendMessage("⚠️ Please provide text or reply to a message to translate!\nUsage: trans [text] -> [lang_code]\nExample: trans Hello -> ur", event.threadID, event.messageID);
			
			// Check if language separator '->' exists
			if (content.includes("->")) {
				let parts = content.split("->").map(item => item.trim());
				translateThis = parts[0];
				if (parts[1]) lang = parts[1];
			} else {
				translateThis = content;
				lang = "ur"; // Default Urdu translation if no language specified
			}
		}

		if (!translateThis) return api.sendMessage("⚠️ Translation ke liye koi text nahi mila!", event.threadID, event.messageID);

		// Google Translate API request via Axios
		const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(translateThis)}`;
		
		const response = await axios.get(url);
		const retrieve = response.data;
		
		let translatedText = "";
		if (retrieve && retrieve[0]) {
			retrieve[0].forEach(item => {
				if (item[0]) translatedText += item[0];
			});
		}

		// Detect source language
		let fromLang = "auto";
		try {
			if (retrieve[2]) {
				fromLang = retrieve[2];
			} else if (retrieve[8] && retrieve[8][0] && retrieve[8][0][0]) {
				fromLang = retrieve[8][0][0];
			}
		} catch (e) {
			fromLang = "auto";
		}

		const formattedMessage = `🌐 **TRANSLATION**\n━━━━━━━━━━━━━━━━━━\n💬 **Result:** ${translatedText}\n⚙️ **Details:** (${fromLang} ➔ ${lang})\n━━━━━━━━━━━━━━━━━━\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««`;

		return api.sendMessage(formattedMessage, event.threadID, event.messageID);

	} catch (error) {
		console.error("Translation Error:", error);
		return api.sendMessage("❌ Translation karne mein error aa gaya. Dobara koshish karein.", event.threadID, event.messageID);
	}
};
