import type { Lead } from "./types.js";

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "Michael", "Jennifer", "David", "Linda",
  "William", "Elizabeth", "Richard", "Barbara", "Joseph", "Susan", "Thomas", "Jessica",
  "Charles", "Sarah", "Christopher", "Karen", "Daniel", "Lisa", "Matthew", "Nancy",
  "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
];

const DISPOSABLE_DOMAINS = [
  "mailinator.com", "tempmail.org", "throwaway.email", "guerrillamail.com",
  "sharklasers.com", "yopmail.com", "10minutemail.com", "trashmail.com",
];

const LEGIT_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com",
  "icloud.com", "comcast.net", "att.net", "verizon.net",
];

const CORPORATE_DOMAINS = [
  "statefarm.com", "allstate.com", "geico.com", "progressive.com",
  "homedepot.com", "lowes.com", "bankofamerica.com",
];

const STATES_BY_ZIP: Record<string, string> = {
  "100": "NY", "900": "CA", "330": "FL", "770": "TX", "606": "IL",
  "191": "PA", "852": "AZ", "981": "WA", "303": "CO", "231": "VA",
  "021": "MA", "300": "GA", "480": "MI", "275": "NC", "070": "NJ",
};

const PLATFORMS = ["meta", "google", "tiktok", "display", "native"];
const CAMPAIGNS = ["auto_q2_broad", "medicare_aep", "windows_spring", "debt_scale", "sweep_vol"];
const AD_SETS = ["lookalike_1pct", "interest_stack", "broad_25_65", "retarget_7d", "custom_intent"];
const DEVICES = ["iPhone 15", "Samsung Galaxy S24", "Chrome Desktop", "Safari Desktop", "Firefox Desktop", "iPad Pro"];
const DATA_CENTER_IPS = ["34.102.", "35.196.", "104.196.", "52.14.", "3.21."];

const BOT_USER_AGENTS = [
  "python-requests/2.31.0",
  "Go-http-client/1.1",
  "curl/8.4.0",
  "Scrapy/2.11",
];

const REAL_USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let counter = 0;

type LeadQuality = "legit" | "suspicious" | "fraud";

function pickQuality(): LeadQuality {
  const r = Math.random();
  if (r < 0.55) return "legit";
  if (r < 0.80) return "suspicious";
  return "fraud";
}

export function generateLead(): Lead {
  const quality = pickQuality();
  const vertical = pick<Lead["vertical"]>(["auto_insurance", "medicare", "home_services", "debt_relief"]);
  const firstName = quality === "fraud" && Math.random() < 0.3
    ? pick(["asdfjkl", "test", "xxxx", "aaaa", "qwerty"])
    : pick(FIRST_NAMES);
  const lastName = quality === "fraud" && Math.random() < 0.3
    ? pick(["asdf", "test", "xxx", "zzz", "fake"])
    : pick(LAST_NAMES);

  const zipPrefix = pick(Object.keys(STATES_BY_ZIP));
  const zip = zipPrefix + rand(10, 99).toString();
  const state = STATES_BY_ZIP[zipPrefix];

  const emailDomain = quality === "fraud"
    ? (Math.random() < 0.6 ? pick(DISPOSABLE_DOMAINS) : pick(LEGIT_DOMAINS))
    : quality === "suspicious"
      ? (Math.random() < 0.3 ? pick(DISPOSABLE_DOMAINS) : pick(LEGIT_DOMAINS))
      : (Math.random() < 0.05 ? pick(CORPORATE_DOMAINS) : pick(LEGIT_DOMAINS));

  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rand(1, 99)}@${emailDomain}`;

  const matchingAreaCode = zipPrefix.startsWith("1") ? `2${zipPrefix.slice(1)}` : zipPrefix;
  const phoneAreaCode = quality === "fraud" && Math.random() < 0.5
    ? rand(200, 999).toString()
    : quality === "suspicious" && Math.random() < 0.3
      ? rand(200, 999).toString()
      : matchingAreaCode;
  const phone = `(${phoneAreaCode}) ${rand(200, 999)}-${rand(1000, 9999)}`;

  const isDataCenterIp = quality === "fraud" ? Math.random() < 0.7 : quality === "suspicious" ? Math.random() < 0.15 : Math.random() < 0.02;
  const ipBase = isDataCenterIp ? pick(DATA_CENTER_IPS) : `${rand(24, 223)}.${rand(0, 255)}.`;
  const ip = ipBase + `${rand(0, 255)}.${rand(1, 254)}`;

  const userAgent = quality === "fraud" && Math.random() < 0.4
    ? pick(BOT_USER_AGENTS)
    : pick(REAL_USER_AGENTS);

  const timeToFillMs = quality === "fraud"
    ? rand(800, 3000)
    : quality === "suspicious"
      ? rand(2000, 15000)
      : rand(15000, 180000);

  counter++;
  return {
    id: `lead_${Date.now()}_${counter}`,
    timestamp: Date.now(),
    vertical,
    source: {
      platform: pick(PLATFORMS),
      campaign: pick(CAMPAIGNS),
      adSet: pick(AD_SETS),
      utm: `utm_source=${pick(PLATFORMS)}&utm_medium=cpc&utm_campaign=${pick(CAMPAIGNS)}`,
    },
    contact: { firstName, lastName, email, phone, zip, state },
    behavior: {
      timeToFillMs,
      pageViews: quality === "fraud" ? rand(1, 2) : rand(1, 8),
      scrollDepth: quality === "fraud" ? rand(5, 20) : rand(30, 100),
      device: pick(DEVICES),
    },
    technical: { ip, userAgent, isDataCenterIp },
  };
}
