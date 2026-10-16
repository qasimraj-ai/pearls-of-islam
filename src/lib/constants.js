// Static values used across the app.
export const QURAN_API = "https://api.alquran.cloud/v1";
export const PRAYER_API = "https://api.aladhan.com/v1";
export const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
export const ALL_TIMES = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
export const DEFAULT_ADHAN = "https://cdn.aladhan.com/audio/adhans/a1.mp3";

// Qirat: recitation styles by reciter (audio served by the Al-Quran Cloud CDN)
export const RECITERS = [
  ["ar.alafasy", "Mishary Rashid Alafasy"],
  ["ar.abdurrahmaansudais", "Abdurrahmaan As-Sudais"],
  ["ar.saoodshuraym", "Saood Ash-Shuraym"],
  ["ar.mahermuaiqly", "Maher Al-Muaiqly"],
  ["ar.abdulbasitmurattal", "Abdul Basit (Murattal)"],
  ["ar.husary", "Mahmoud Khalil Al-Husary"],
  ["ar.husarymujawwad", "Al-Husary (Mujawwad)"],
  ["ar.minshawi", "Mohamed Siddiq Al-Minshawi"],
  ["ar.minshawimujawwad", "Al-Minshawi (Mujawwad)"],
  ["ar.hudhaify", "Ali Al-Hudhaify"],
  ["ar.shaatree", "Abu Bakr Ash-Shaatree"],
  ["ar.muhammadayyoub", "Muhammad Ayyoub"],
  ["ar.muhammadjibreel", "Muhammad Jibreel"],
  ["ar.ahmedajamy", "Ahmed Al-Ajamy"],
];
export const METHODS = [
  [1, "University of Islamic Sciences, Karachi"],
  [2, "ISNA (North America)"],
  [3, "Muslim World League"],
  [4, "Umm Al-Qura, Makkah"],
  [5, "Egyptian General Authority"],
  [8, "Gulf Region"],
  [9, "Kuwait"],
  [10, "Qatar"],
  [13, "Diyanet, Turkey"],
  [15, "Moonsighting Committee"],
];
export const STATUS = [
  ["jamaat", "In jamaat"],
  ["ontime", "On time"],
  ["qaza", "Qaza"],
  ["missed", "Missed"],
];
export const NAV = [
  ["home", "Home", "◎"],
  ["quran", "Quran", "❖"],
  ["prayers", "Prayers", "☾"],
  ["namaz", "Intro To Namaz", "☪"],
  ["ahadees", "Ahadees", "❝"],
  ["attendance", "Attendance", "✓"],
  ["profile", "Profile", "◉"],
];


// Urdu translations (Al-Quran Cloud edition ids)
export const URDU_EDITIONS = [
  ["ur.jalandhry", "Fateh Muhammad Jalandhry"],
  ["ur.maududi", "Abul A'la Maududi"],
  ["ur.junagarhi", "Muhammad Junagarhi"],
  ["ur.kanzuliman", "Ahmed Raza Khan (Kanzul Iman)"],
];
