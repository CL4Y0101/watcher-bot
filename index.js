import fetch from "node-fetch";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

// Kurangi cache Discord agar hemat memori
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  makeCache: () => new Collection()
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const ROBLOX_USERNAME = "nonamanisey";
const USER_ID = process.env.USER_ID;

let lastStatus = null;
let isChecking = false; // <--- tambahkan anti overlap

client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  checkStatus();
  setInterval(checkStatus, 60000); // cek tiap 1 menit

  // Tambahan: pantau pemakaian memori (debug)
  setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    console.log(`🧠 Memory usage: ${used.toFixed(2)} MB`);
  }, 60000);
});

async function checkStatus() {
  if (isChecking) {
    console.log("⏳ Check masih berjalan, skip interval berikutnya...");
    return;
  }
  isChecking = true;

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
      console.log(`❌ User "${ROBLOX_USERNAME}" tidak ditemukan`);
      return;
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
      console.log(`⚫ Tidak ada data presence untuk user "${ROBLOX_USERNAME}"`);
      return;
    }

    const info = presenceData.userPresences[0];
    const status =
      info.userPresenceType === 2 ? `🎮 Lagi main game ID ${info.placeId}` :
      info.userPresenceType === 1 ? "🟢 Online" : "⚫ Offline";

    if (status !== lastStatus) {
      const channel = await client.channels.fetch(CHANNEL_ID);
      await channel.send(`<@${USER_ID}> Status ${info.userDisplayName || ROBLOX_USERNAME}: ${status}`);
      lastStatus = status;
    }

  } catch (err) {
    console.error("❌ Error checkStatus:", err);
  } finally {
    isChecking = false;
  }
}

client.login(process.env.DISCORD_TOKEN);
