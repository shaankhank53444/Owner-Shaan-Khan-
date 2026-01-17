const A = require('axios');
const B = require('fs-extra');
const P = require('path');
const S = require('yt-search');

module.exports.config = {
    name: "audio",
    version: "6.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Shaan Khan",
    description: "Fast YouTube Music Downloader",
    commandCategory: "media",
    usages: ".audio [song name]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID: t, messageID: m } = event;
    const q = args.join(" ");
    const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";
    const p = P.join(__dirname, "cache", `${Date.now()}_audio.mp3`);

    if (!q) return api.sendMessage("❌ Please provide a song name!", t, m);

    try {
        const D = await A.get(nix);
        const E = D.data.api;
        
        let u = q;
        if (!q.startsWith("http")) {
            const r = await S(q);
            const v = r.videos[0];
            if (!v) throw new Error("Error ytdl issue 🧘");
            u = v.url;
        }

        const F = await A.get(`${E}/ytdl`, {
            params: { url: u, type: "audio" }
        });

        if (!F.data.status || !F.data.downloadUrl) throw new Error("API Error");

        const DL = F.data.downloadUrl;
        const title = F.data.title || "Song";

        const res = await A.get(DL, { responseType: "arraybuffer" });
        await B.outputFile(p, Buffer.from(res.data));

        api.setMessageReaction("✅", m, () => {}, true);

        await api.sendMessage({
            body: `🎵 Title: ${title}\n\n✨ »»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰💞`,
            attachment: B.createReadStream(p)
        }, t, () => {
            if (B.existsSync(p)) B.unlinkSync(p);
        }, m);

    } catch (e) {
        return api.sendMessage(`❌ Error: ${e.message}`, t, m);
    }
};