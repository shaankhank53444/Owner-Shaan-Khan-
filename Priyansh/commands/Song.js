const axios = require('axios');

module.exports = {
    name: 'song',
    alias: ['song', 'music'],
    category: 'download',
    desc: 'YouTube se audio download karne ke liye',
    async execute(m, { conn, args, prefix, command }) {
        try {
            // Check agar user ne link diya hai ya nahi
            if (!args[0]) return m.reply(`*Usage:* ${prefix + command} <youtube link>`);

            const videoUrl = args[0];
            m.reply('✅ Apki Request Jari Hai Please wait...');

            // --- API Integration Start ---
            const apiUrl = `https://yt-tt.onrender.com/api/youtube/audio?url=${encodeURIComponent(videoUrl)}`;
            
            const response = await axios.get(apiUrl);
            const res = response.data;

            if (res.status) {
                const { title, duration, audio_url } = res;

                // Message bhejte hain details ke saath
                let caption = ` »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 Title:* ${title}\n*⏳ Duration:* ${duration}\n\n_Bhej raha hoon, thora intezaar karein..._`;
                
                // Pehle info bhejte hain
                await m.reply(caption);

                // Asli Audio File bhejte hain
                await conn.sendMessage(m.chat, { 
                    audio: { url: audio_url }, 
                    mimetype: 'audio/mpeg', 
                    fileName: `${title}.mp3` 
                }, { quoted: m });

            } else {
                m.reply("❌ API ne error diya: Link invalid ho sakta hai ya server down hai.");
            }
            // --- API Integration End ---

        } catch (e) {
            console.error(e);
            m.reply("❌ Kuch galat ho gaya! Shayad API server load nahi le raha.");
        }
    }
};
