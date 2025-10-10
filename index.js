import fetch from "node-fetch";
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const CHANNEL_ID = process.env.CHANNEL_ID; 
const ROBLOX_USERNAME = "nonamanisey";
const USER_ID = process.env.USER_ID;

let lastStatus = null;

client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  checkStatus();
  setInterval(checkStatus, 60000); // cek tiap 1 menit
});

async function checkStatus() {
  try {
    // Ambil ID user Roblox
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [ROBLOX_USERNAME],
        excludeBannedUsers: false
      })
    });

    const data = await res.json();
    if (!data.data || data.data.length === 0) {
      return console.log(`❌ User "${ROBLOX_USERNAME}" tidak ditemukan`);
    }
    const id = data.data[0].id;

    // Ambil status presence
    const presenceRes = await fetch("https://presence.roblox.com/v1/presence/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [id] })
    });

    const presenceData = await presenceRes.json();
    if (!presenceData.userPresences || presenceData.userPresences.length === 0) {
      return console.log(`⚫ Tidak ada data presence untuk user "${ROBLOX_USERNAME}"`);
    }

    const info = presenceData.userPresences[0];

    // Tentukan status
    const status = info.userPresenceType === 2 ? `🎮 Lagi main game ID ${info.placeId}` :
                   info.userPresenceType === 1 ? "🟢 Online" : "⚫ Offline";

    // Kirim pesan hanya kalau status berubah dan tag user Discord
    if (status !== lastStatus) {
      const channel = await client.channels.fetch(CHANNEL_ID);
      channel.send(`<@${USER_ID}> Status ${info.userDisplayName || ROBLOX_USERNAME}: ${status}`);
      lastStatus = status;
    }

  } catch (err) {
    console.error("❌ Error checkStatus:", err);
  }
}

client.login(process.env.DISCORD_TOKEN);
