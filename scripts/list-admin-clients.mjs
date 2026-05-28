#!/usr/bin/env node
/**
 * Lists clients the same way Payment Settings → Client List does:
 * time_slots, bookings, recurring_lessons, ladder players, + manual VIP entries.
 *
 * Usage:
 *   node scripts/list-admin-clients.mjs
 *   node scripts/list-admin-clients.mjs tamela
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const MANUAL_CLIENTS = [
  ["Marcel Hinds", "mhindsmd@hotmail.com", "646-591-1060"],
  ["Noah Glass", "nnglass@gmail.com", ""],
  ["Mary Higgins", "mary@maryjoan.com", ""],
  ["Greg Freidus", "gregfreidus@gmail.com", ""],
  ["Mark Tercek", "tercekmark@gmail.com", ""],
];

async function supabaseFetch(baseUrl, key, table, select) {
  const url = `${baseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) {
    throw new Error(`${table}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function addClient(map, name, email, phone) {
  if (!name?.trim()) return;
  const key = name.toLowerCase().trim();
  const existing = map.get(key) || { email: "", phone: "" };
  if (!existing.email && email?.trim()) existing.email = email.trim();
  if (!existing.phone && phone?.trim()) existing.phone = phone.trim();
  map.set(key, existing);
}

function titleCaseKey(key) {
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  const env = loadEnv();
  const lessonUrl = env.NEXT_PUBLIC_LESSON_SUPABASE_URL;
  const lessonKey = env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY;
  const mainUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const mainKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const search = process.argv.slice(2).join(" ").toLowerCase();

  if (!lessonUrl || !lessonKey) {
    console.error("Missing NEXT_PUBLIC_LESSON_SUPABASE_URL or ANON_KEY in .env.local");
    process.exit(1);
  }

  const map = new Map();

  const [slots, bookings, recurring] = await Promise.all([
    supabaseFetch(lessonUrl, lessonKey, "time_slots", "booked_by,booked_email,booked_phone"),
    supabaseFetch(lessonUrl, lessonKey, "bookings", "client_name,client_email,client_phone"),
    supabaseFetch(
      lessonUrl,
      lessonKey,
      "recurring_lessons",
      "client_name,client_email,client_phone"
    ),
  ]);

  for (const row of slots) {
    if (row.booked_by) addClient(map, row.booked_by, row.booked_email, row.booked_phone);
  }
  for (const row of bookings) {
    addClient(map, row.client_name, row.client_email, row.client_phone);
  }
  for (const row of recurring) {
    addClient(map, row.client_name, row.client_email, row.client_phone);
  }

  if (mainUrl && mainKey) {
    try {
      const clubs = await supabaseFetch(mainUrl, mainKey, "clubs", "id,slug");
      const rtc = clubs.find((c) => c.slug === "rhinebeck-tennis-club");
      if (rtc) {
        const players = await supabaseFetch(
          mainUrl,
          mainKey,
          "players",
          "name,email,phone_number,club_id"
        );
        for (const p of players) {
          if (p.club_id === rtc.id) {
            addClient(map, p.name, p.email, p.phone_number);
          }
        }
      }
    } catch (e) {
      console.warn("Ladder players skipped:", e.message);
    }
  }

  for (const [name, email, phone] of MANUAL_CLIENTS) {
    addClient(map, name, email, phone);
  }

  const list = [...map.entries()]
    .map(([key, info]) => ({
      name: titleCaseKey(key),
      email: info.email,
      phone: info.phone,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (search) {
    const matches = list.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search)
    );
    if (matches.length === 0) {
      console.log(`No clients matching "${search}" (${list.length} total).`);
      process.exit(1);
    }
    console.log(JSON.stringify(matches, null, 2));
    return;
  }

  console.log(JSON.stringify(list, null, 2));
  console.error(`\n${list.length} clients total`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
