/* Content for the "Intro To Namaz" page.
   Method: the basic steps of salah that are shared by all Muslims. Where scholars differ on small details, the text says so neutrally.
   Every recitation has: Arabic, transliteration (tr), Urdu meaning (ur), English meaning (en). */

export const REC = {
  takbir: {
    name: ["Takbir", "تکبیر"],
    lines: [{ ar: "اللَّهُ أَكْبَرُ", tr: "Allahu Akbar", ur: "اللہ سب سے بڑا ہے۔", en: "Allah is the Greatest." }],
  },
  sana: {
    name: ["Sana (opening dua)", "ثنا"],
    lines: [{
      ar: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَىٰ جَدُّكَ وَلَا إِلَٰهَ غَيْرُكَ",
      tr: "Subhanakal-lahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghairuk.",
      ur: "اے اللہ! تو پاک ہے اور تعریف تیری ہی ہے، تیرا نام برکت والا ہے، تیری شان بلند ہے اور تیرے سوا کوئی معبود نہیں۔",
      en: "O Allah, glory and praise are Yours, blessed is Your name, exalted is Your majesty, and there is no god but You.",
    }],
  },
  taawwudh: {
    name: ["Ta'awwudh", "تعوذ"],
    lines: [{
      ar: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
      tr: "A'udhu billahi minash-shaitanir-rajim.",
      ur: "میں شیطان مردود سے اللہ کی پناہ مانگتا ہوں۔",
      en: "I seek refuge in Allah from the accursed Satan.",
    }],
  },
  fatiha: {
    name: ["Surah Al-Fatiha (7 ayahs)", "سورۃ الفاتحہ"],
    lines: [
      { n: 1, ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", tr: "Bismillahir-rahmanir-rahim.", ur: "اللہ کے نام سے جو بہت مہربان، نہایت رحم والا ہے۔", en: "In the name of Allah, the Most Gracious, the Most Merciful." },
      { n: 2, ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", tr: "Alhamdu lillahi rabbil-'alamin.", ur: "سب تعریف اللہ کے لیے ہے جو تمام جہانوں کا رب ہے۔", en: "All praise is for Allah, Lord of all the worlds." },
      { n: 3, ar: "الرَّحْمَٰنِ الرَّحِيمِ", tr: "Ar-rahmanir-rahim.", ur: "نہایت مہربان، بہت رحم والا۔", en: "The Most Gracious, the Most Merciful." },
      { n: 4, ar: "مَالِكِ يَوْمِ الدِّينِ", tr: "Maliki yawmid-din.", ur: "روزِ جزا کا مالک۔", en: "Master of the Day of Judgement." },
      { n: 5, ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", tr: "Iyyaka na'budu wa iyyaka nasta'in.", ur: "ہم تیری ہی عبادت کرتے ہیں اور تجھی سے مدد مانگتے ہیں۔", en: "You alone we worship, and You alone we ask for help." },
      { n: 6, ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", tr: "Ihdinas-siratal-mustaqim.", ur: "ہمیں سیدھے راستے پر چلا۔", en: "Guide us to the straight path." },
      { n: 7, ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", tr: "Siratal-ladhina an'amta 'alaihim, ghairil-maghdubi 'alaihim wa lad-dallin.", ur: "ان لوگوں کے راستے پر جن پر تو نے انعام فرمایا، نہ ان کے راستے پر جن پر غضب ہوا اور نہ گمراہوں کے۔", en: "The path of those You have blessed, not of those who earned Your anger, nor of those who went astray." },
    ],
  },
  ameen: {
    name: ["Ameen", "آمین"],
    lines: [{ ar: "آمِينَ", tr: "Ameen", ur: "اے اللہ! قبول فرما۔", en: "O Allah, accept." }],
  },
  surah: {
    name: ["Any surah — 3 examples", "کوئی سورت — تین مثالیں"],
    options: [
      {
        name: ["Surah Al-Kawthar", "سورۃ الکوثر"],
        lines: [
          { n: 1, ar: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ", tr: "Inna a'taynakal-kawthar.", ur: "بے شک ہم نے آپ کو کوثر عطا کی۔", en: "Indeed, We have given you Al-Kawthar." },
          { n: 2, ar: "فَصَلِّ لِرَبِّكَ وَانْحَرْ", tr: "Fa salli li rabbika wanhar.", ur: "پس اپنے رب کے لیے نماز پڑھیں اور قربانی کریں۔", en: "So pray to your Lord and sacrifice." },
          { n: 3, ar: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ", tr: "Inna shani'aka huwal-abtar.", ur: "بے شک آپ کا دشمن ہی بے نام و نشان ہے۔", en: "Indeed, it is your enemy who is cut off." },
        ],
      },
      {
        name: ["Surah Al-Ikhlas", "سورۃ الاخلاص"],
        lines: [
          { n: 1, ar: "قُلْ هُوَ اللَّهُ أَحَدٌ", tr: "Qul huwallahu ahad.", ur: "کہہ دو: وہ اللہ ایک ہے۔", en: "Say: He is Allah, the One." },
          { n: 2, ar: "اللَّهُ الصَّمَدُ", tr: "Allahus-samad.", ur: "اللہ بے نیاز ہے۔", en: "Allah, the Eternal Refuge." },
          { n: 3, ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ", tr: "Lam yalid wa lam yulad.", ur: "نہ اس نے کسی کو جنا اور نہ وہ جنا گیا۔", en: "He neither begets nor is born." },
          { n: 4, ar: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", tr: "Wa lam yakul-lahu kufuwan ahad.", ur: "اور نہ کوئی اس کے برابر ہے۔", en: "And there is none comparable to Him." },
        ],
      },
      {
        name: ["Surah Al-'Asr", "سورۃ العصر"],
        lines: [
          { n: 1, ar: "وَالْعَصْرِ", tr: "Wal-'asr.", ur: "زمانے کی قسم!", en: "By time." },
          { n: 2, ar: "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ", tr: "Innal-insana la fi khusr.", ur: "بے شک انسان خسارے میں ہے۔", en: "Indeed, mankind is in loss." },
          { n: 3, ar: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ", tr: "Illal-ladhina amanu wa 'amilus-salihati wa tawasaw bil-haqqi wa tawasaw bis-sabr.", ur: "سوائے ان کے جو ایمان لائے اور نیک عمل کیے اور آپس میں حق کی نصیحت کی اور صبر کی نصیحت کی۔", en: "Except those who believe, do good deeds, advise each other to truth, and advise each other to patience." },
        ],
      },
    ],
  },
  rukuTasbih: {
    name: ["Tasbih of Ruku", "رکوع کی تسبیح"], times: 3,
    lines: [{ ar: "سُبْحَانَ رَبِّيَ الْعَظِيمِ", tr: "Subhana Rabbiyal-'Azim.", ur: "پاک ہے میرا رب جو بہت عظمت والا ہے۔", en: "Glory to my Lord, the Most Great." }],
  },
  tasmee: {
    name: ["Tasmee' (while rising)", "تسمیع"],
    who: ["Imam or a person praying alone", "امام یا اکیلا نمازی"],
    lines: [{ ar: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ", tr: "Sami'allahu liman hamidah.", ur: "اللہ نے سن لی اس کی جس نے اس کی تعریف کی۔", en: "Allah hears the one who praises Him." }],
  },
  tahmeed: {
    name: ["Tahmeed (when standing straight)", "تحمید"],
    who: ["Everyone, including the follower behind the Imam", "سب، بشمول مقتدی"],
    lines: [{ ar: "رَبَّنَا لَكَ الْحَمْدُ", tr: "Rabbana lakal-hamd.", ur: "اے ہمارے رب! سب تعریف تیرے ہی لیے ہے۔", en: "Our Lord, all praise is for You." }],
  },
  sajdaTasbih: {
    name: ["Tasbih of Sajda", "سجدے کی تسبیح"], times: 3,
    lines: [{ ar: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ", tr: "Subhana Rabbiyal-A'la.", ur: "پاک ہے میرا رب جو سب سے بلند ہے۔", en: "Glory to my Lord, the Most High." }],
  },
  tashahhud: {
    name: ["At-Tahiyyat (Tashahhud)", "التحیات"],
    lines: [{
      ar: "اَلتَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
      tr: "At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alaika ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alaina wa 'ala 'ibadillahis-salihin. Ash-hadu an la ilaha illallahu wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
      ur: "تمام قولی، بدنی اور مالی عبادتیں اللہ ہی کے لیے ہیں۔ اے نبی ﷺ! آپ پر سلام ہو اور اللہ کی رحمت اور برکتیں۔ ہم پر اور اللہ کے نیک بندوں پر سلام ہو۔ میں گواہی دیتا ہوں کہ اللہ کے سوا کوئی معبود نہیں اور میں گواہی دیتا ہوں کہ محمد ﷺ اس کے بندے اور رسول ہیں۔",
      en: "All greetings, prayers and good words are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and Messenger.",
    }],
  },
  durood: {
    name: ["Durood Ibrahim", "درودِ ابراہیمی"],
    lines: [{
      ar: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
      tr: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad, kama sallaita 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidum Majid. Allahumma barik 'ala Muhammadin wa 'ala ali Muhammad, kama barakta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidum Majid.",
      ur: "اے اللہ! رحمت نازل فرما محمد ﷺ پر اور آلِ محمد پر، جیسے تو نے ابراہیم علیہ السلام اور آلِ ابراہیم پر رحمت نازل فرمائی، بے شک تو تعریف کیا ہوا، بزرگی والا ہے۔ اے اللہ! برکت نازل فرما محمد ﷺ پر اور آلِ محمد پر، جیسے تو نے ابراہیم علیہ السلام اور آلِ ابراہیم پر برکت نازل فرمائی، بے شک تو تعریف کیا ہوا، بزرگی والا ہے۔",
      en: "O Allah, send Your mercy upon Muhammad and the family of Muhammad, as You sent it upon Ibrahim and the family of Ibrahim; You are Praiseworthy and Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim; You are Praiseworthy and Glorious.",
    }],
  },
  dua: {
    name: ["Dua before the salam (choose one)", "سلام سے پہلے کی دعا (کوئی ایک)"],
    options: [
      {
        name: ["Rabbana atina (Quran 2:201)", "ربنا آتنا (البقرۃ ۲۰۱)"],
        lines: [{
          ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
          tr: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar.",
          ur: "اے ہمارے رب! ہمیں دنیا میں بھی بھلائی دے اور آخرت میں بھی بھلائی دے اور ہمیں آگ کے عذاب سے بچا۔",
          en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        }],
      },
      {
        name: ["Rabbij'alni (Quran 14:40–41)", "رب اجعلنی (ابراہیم ۴۰–۴۱)"],
        lines: [{
          ar: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ، رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
          tr: "Rabbij'alni muqimas-salati wa min dhurriyyati, Rabbana wa taqabbal du'a. Rabbanagh-fir li wa li-walidayya wa lil-mu'minina yawma yaqumul-hisab.",
          ur: "اے میرے رب! مجھے نماز قائم کرنے والا بنا اور میری اولاد میں سے بھی۔ اے ہمارے رب! میری دعا قبول فرما۔ اے ہمارے رب! مجھے، میرے والدین کو اور سب مومنوں کو بخش دے اس دن جب حساب قائم ہوگا۔",
          en: "My Lord, make me an establisher of prayer, and from my descendants too. Our Lord, accept my prayer. Our Lord, forgive me, my parents and the believers on the Day the reckoning is established.",
        }],
      },
    ],
  },
  salam: {
    name: ["Salam", "سلام"],
    lines: [{ ar: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ", tr: "As-salamu 'alaikum wa rahmatullah.", ur: "تم پر سلامتی ہو اور اللہ کی رحمت۔", en: "Peace be upon you and the mercy of Allah." }],
  },
};

/* The steps. "pose" is the figure pose; "say" lists what is recited here. */
export const STEPS = {
  niyyat: {
    pose: "stand", name: ["Niyyat & standing ready", "نیت اور سیدھے کھڑے ہونا"],
    en: [
      "Stand straight on a clean place, facing the Qibla.",
      "Keep your feet about four fingers apart, pointing to the Qibla, with your arms at your sides.",
      "Look at the spot where your forehead will touch the ground.",
      "Make the intention (niyyat) in your heart for the prayer you are about to pray, for example: “two rakat of Fajr fard, for Allah, facing the Qibla”. Saying it aloud is not required.",
    ],
    ur: [
      "پاک جگہ پر قبلہ رخ سیدھے کھڑے ہوں۔",
      "دونوں پاؤں قبلہ رخ رکھیں اور ان کے درمیان تقریباً چار انگلیوں کا فاصلہ ہو؛ ہاتھ پہلوؤں میں ہوں۔",
      "نظر اس جگہ پر رکھیں جہاں سجدے میں پیشانی لگے گی۔",
      "دل میں اس نماز کی نیت کریں جو پڑھنے لگے ہیں، مثلاً: دو رکعت نمازِ فجر فرض، اللہ کے لیے، منہ قبلہ کی طرف۔ زبان سے کہنا ضروری نہیں۔",
    ],
    say: [],
    noteEn: "Nothing is recited yet. The intention is made in the heart.",
    noteUr: "ابھی کچھ نہیں پڑھا جاتا۔ نیت دل کا کام ہے۔",
  },
  takbir: {
    pose: "takbir", name: ["Takbir-e-Tahrima", "تکبیرِ تحریمہ"],
    en: [
      "Raise both hands to your ears, palms facing the Qibla, thumbs touching the earlobes. The fingers are neither spread wide nor squeezed together.",
      "Say “Allahu Akbar” as you raise them, then fold your hands straight away.",
      "The prayer begins with this takbir.",
    ],
    ur: [
      "دونوں ہاتھ کانوں تک اٹھائیں؛ ہتھیلیاں قبلہ کی طرف ہوں اور انگوٹھے کانوں کی لو کو چھوئیں۔ انگلیاں نہ بہت کھلی ہوں نہ بالکل ملی ہوئی۔",
      "ہاتھ اٹھاتے ہوئے ‘اللہ اکبر’ کہیں اور فوراً ہاتھ باندھ لیں۔",
      "نماز اسی تکبیر سے شروع ہوتی ہے۔",
    ],
    say: ["takbir"],
  },
  qiyam: {
    pose: "fold", name: ["Qiyam — standing (1st rakat)", "قیام (پہلی رکعت)"],
    en: [
      "Place your hands on your chest or just below the navel, as your teacher taught you.",
      "Keep looking at the place of sajda and stand still and calm.",
      "Recite in this order: Sana, Ta'awwudh, Surah Al-Fatiha (it starts with Bismillah), say Ameen softly, then another surah (or at least three short ayahs, or one long ayah).",
    ],
    ur: [
      "ہاتھ باندھیں: سینے پر یا ناف کے نیچے، جیسے آپ کے استاد نے سکھایا ہو۔",
      "نظر سجدے کی جگہ پر رکھیں اور سکون سے کھڑے رہیں۔",
      "اس ترتیب سے پڑھیں: ثنا، تعوذ، سورۃ الفاتحہ (بسم اللہ سے شروع)، آہستہ ‘آمین’، پھر کوئی سورت (یا کم از کم تین چھوٹی آیات یا ایک بڑی آیت)۔",
    ],
    say: ["sana", "taawwudh", "fatiha", "ameen", "surah"],
    noteEn: "Sana and Ta'awwudh are recited only once, in the first rakat.",
    noteUr: "ثنا اور تعوذ صرف پہلی رکعت میں ایک بار پڑھے جاتے ہیں۔",
  },
  ruku: {
    pose: "ruku", name: ["Ruku — bowing", "رکوع"],
    en: [
      "Say “Allahu Akbar” as you bend forward.",
      "Bend until your back and head are level. Hold your knees with your palms, fingers spread, legs straight.",
      "Look at your feet. Stay still, and say the tasbih at least three times.",
    ],
    ur: [
      "‘اللہ اکبر’ کہتے ہوئے جھکیں۔",
      "اتنا جھکیں کہ کمر اور سر برابر ہو جائیں۔ ہتھیلیوں سے گھٹنے پکڑیں، انگلیاں کھلی ہوں اور ٹانگیں سیدھی رہیں۔",
      "نظر پاؤں پر رکھیں۔ ٹھہر کر کم از کم تین بار تسبیح پڑھیں۔",
    ],
    say: ["takbir", "rukuTasbih"],
  },
  qauma: {
    pose: "stand", name: ["Qauma — standing up from ruku", "قومہ (رکوع کے بعد کھڑے ہونا)"],
    en: [
      "Rise to a straight standing position. While rising, the Imam or a person praying alone says Sami'allahu liman hamidah.",
      "When you are standing straight, say Rabbana lakal-hamd (everyone says this, including the follower behind the Imam).",
      "Let your arms rest at your sides and stand still for a moment.",
    ],
    ur: [
      "سیدھے کھڑے ہوں۔ اٹھتے ہوئے امام یا اکیلا نمازی ‘سمع اللہ لمن حمدہ’ کہے۔",
      "سیدھے کھڑے ہو کر ‘ربنا لک الحمد’ کہیں (سب کہیں، مقتدی بھی)۔",
      "ہاتھ پہلوؤں میں چھوڑ دیں اور ذرا ٹھہریں۔",
    ],
    say: ["tasmee", "tahmeed"],
  },
  sajda1: {
    pose: "sajda", name: ["Sajda — 1st prostration", "پہلا سجدہ"],
    en: [
      "Say “Allahu Akbar” and go down: first the knees, then the hands, then the nose, then the forehead.",
      "Seven parts rest on the ground: forehead (with the nose), both palms, both knees and the toes of both feet, toes pointing to the Qibla.",
      "Hands are beside the ears, fingers together and pointing to the Qibla. Men keep the elbows lifted off the ground and away from the sides, and the belly away from the thighs.",
      "Look at your nose. Stay still, and say the tasbih at least three times.",
    ],
    ur: [
      "‘اللہ اکبر’ کہتے ہوئے سجدے میں جائیں: پہلے گھٹنے، پھر ہاتھ، پھر ناک، پھر پیشانی۔",
      "سات اعضاء زمین پر ہوں: پیشانی (ناک سمیت)، دونوں ہتھیلیاں، دونوں گھٹنے اور دونوں پاؤں کی انگلیاں (انگلیوں کا رخ قبلہ کی طرف)۔",
      "ہاتھ کانوں کے برابر ہوں، انگلیاں ملی ہوئی اور قبلہ رخ۔ مرد کہنیاں زمین سے اٹھی ہوئی اور پہلوؤں سے الگ رکھیں اور پیٹ رانوں سے جدا رکھیں۔",
      "نظر ناک پر رکھیں۔ ٹھہر کر کم از کم تین بار تسبیح پڑھیں۔",
    ],
    say: ["takbir", "sajdaTasbih"],
  },
  jalsa: {
    pose: "sit", name: ["Jalsa — sitting between two sajdas", "جلسہ (دو سجدوں کے درمیان بیٹھنا)"],
    en: [
      "Say “Allahu Akbar” and lift your head first, then your hands.",
      "Sit on your left foot (laid flat) and keep the right foot upright with its toes pointing to the Qibla.",
      "Rest your hands on your thighs, fingertips at the knees. Look at your lap.",
      "Stay still for at least the time it takes to say “SubhanAllah” once, then say “Allahu Akbar” and go into the second sajda.",
    ],
    ur: [
      "‘اللہ اکبر’ کہتے ہوئے پہلے سر اور پھر ہاتھ اٹھائیں۔",
      "بایاں پاؤں بچھا کر اس پر بیٹھیں اور دایاں پاؤں کھڑا رکھیں، اس کی انگلیوں کا رخ قبلہ کی طرف ہو۔",
      "ہاتھ رانوں پر رکھیں، انگلیوں کے سرے گھٹنوں کے پاس ہوں؛ نظر گود پر رکھیں۔",
      "کم از کم ایک بار ‘سبحان اللہ’ کہنے کی مقدار ٹھہریں، پھر ‘اللہ اکبر’ کہہ کر دوسرے سجدے میں جائیں۔",
    ],
    say: ["takbir"],
    noteEn: "Some scholars recite a short dua between the two sajdas (“Rabbighfir li”, “My Lord, forgive me”), and others do not. Both are permitted; follow the practice of your teacher.",
    noteUr: "بعض علماء دونوں سجدوں کے درمیان ‘رَبِّ اغْفِرْ لِي’ (اے میرے رب! مجھے بخش دے) پڑھتے ہیں اور بعض نہیں پڑھتے۔ دونوں جائز ہیں؛ اپنے استاد کے طریقے پر عمل کریں۔",
  },
  sajda2: {
    pose: "sajda", name: ["Sajda — 2nd prostration", "دوسرا سجدہ"],
    en: [
      "Go into the second sajda exactly like the first one, saying “Allahu Akbar”.",
      "Say the tasbih of sajda at least three times.",
    ],
    ur: [
      "‘اللہ اکبر’ کہہ کر پہلے سجدے کی طرح دوسرے سجدے میں جائیں۔",
      "سجدے کی تسبیح کم از کم تین بار پڑھیں۔",
    ],
    say: ["takbir", "sajdaTasbih"],
  },
  qiyam2: {
    pose: "fold", name: ["Qiyam — standing (2nd rakat)", "قیام (دوسری رکعت)"],
    en: [
      "Say “Allahu Akbar” and stand up from the sajda (no need to raise the hands). Fold your hands as before.",
      "Recite Surah Al-Fatiha (it starts with Bismillah), say Ameen softly, then another surah.",
      "Do not recite Sana or Ta'awwudh again.",
    ],
    ur: [
      "‘اللہ اکبر’ کہتے ہوئے سجدے سے کھڑے ہوں (ہاتھ اٹھانے کی ضرورت نہیں) اور پہلے کی طرح ہاتھ باندھیں۔",
      "سورۃ الفاتحہ (بسم اللہ سے شروع) پڑھیں، آہستہ ‘آمین’ کہیں، پھر کوئی سورت پڑھیں۔",
      "ثنا اور تعوذ دوبارہ نہ پڑھیں۔",
    ],
    say: ["takbir", "fatiha", "ameen", "surah"],
  },
  qada: {
    pose: "sitFinger", name: ["Qa'da — final sitting", "قعدہ اخیرہ"],
    en: [
      "Say “Allahu Akbar” and sit as in the jalsa: left foot flat, right foot upright, hands on the thighs.",
      "Recite At-Tahiyyat. At “Ash-hadu an la ilaha…” make a circle with the thumb and middle finger of the right hand, fold the ring and little fingers, raise the index finger at “la” and lower it at “illallah”.",
      "Then recite Durood Ibrahim, and then a dua from the Quran.",
    ],
    ur: [
      "‘اللہ اکبر’ کہہ کر جلسے کی طرح بیٹھیں: بایاں پاؤں بچھا ہوا، دایاں کھڑا، ہاتھ رانوں پر۔",
      "التحیات پڑھیں۔ ‘اَشْهَدُ اَنْ لَا اِلٰهَ…’ پر دائیں ہاتھ کے انگوٹھے اور بیچ کی انگلی کا حلقہ بنائیں، چھنگلی اور اس کے ساتھ والی انگلی بند کر لیں، ‘لا’ پر شہادت کی انگلی اٹھائیں اور ‘الا اللہ’ پر گرا دیں۔",
      "پھر درودِ ابراہیمی پڑھیں اور اس کے بعد قرآنی دعا پڑھیں۔",
    ],
    say: ["takbir", "tashahhud", "durood", "dua"],
    noteEn: "In a prayer of 3 or 4 rakat, the first sitting (after the 2nd rakat) is only At-Tahiyyat; then you stand up for the 3rd rakat saying “Allahu Akbar”. Durood and dua are for the final sitting.",
    noteUr: "تین یا چار رکعت والی نماز میں پہلے قعدے (دوسری رکعت کے بعد) میں صرف التحیات پڑھی جاتی ہے، پھر ‘اللہ اکبر’ کہہ کر تیسری رکعت کے لیے کھڑے ہوں۔ درود اور دعا آخری قعدے میں پڑھی جاتی ہے۔",
  },
  salamR: {
    pose: "sit", name: ["Salam — to the right", "سلام (دائیں طرف)"],
    en: ["Turn your face to the right, looking at your right shoulder, and say the salam."],
    ur: ["چہرہ دائیں طرف پھیریں، نظر دائیں کندھے پر ہو، اور سلام کہیں۔"],
    say: ["salam"],
  },
  salamL: {
    pose: "sit", name: ["Salam — to the left", "سلام (بائیں طرف)"],
    en: ["Turn your face to the left, looking at your left shoulder, and say the salam again. The prayer is now complete."],
    ur: ["چہرہ بائیں طرف پھیریں، نظر بائیں کندھے پر ہو، اور دوبارہ سلام کہیں۔ اب نماز مکمل ہو گئی۔"],
    say: ["salam"],
  },
};

/* The animation plays two rakat (like Fajr fard). */
export const SEQUENCE = [
  { step: "niyyat", rakat: 1 }, { step: "takbir", rakat: 1 }, { step: "qiyam", rakat: 1 },
  { step: "ruku", rakat: 1 }, { step: "qauma", rakat: 1 }, { step: "sajda1", rakat: 1 },
  { step: "jalsa", rakat: 1 },
  { step: "sajda2", rakat: 1, nextEn: "Next: say “Allahu Akbar” and stand up for the 2nd rakat.", nextUr: "اگلا: ‘اللہ اکبر’ کہہ کر دوسری رکعت کے لیے کھڑے ہوں۔" },
  { step: "qiyam2", rakat: 2 }, { step: "ruku", rakat: 2 }, { step: "qauma", rakat: 2 },
  { step: "sajda1", rakat: 2 }, { step: "jalsa", rakat: 2 },
  { step: "sajda2", rakat: 2, nextEn: "Next: say “Allahu Akbar” and sit for the final sitting (Qa'da).", nextUr: "اگلا: ‘اللہ اکبر’ کہہ کر قعدہ اخیرہ میں بیٹھیں۔" },
  { step: "qada", rakat: 2 }, { step: "salamR", rakat: 2 }, { step: "salamL", rakat: 2 },
];

export const BEFORE = [
  { en: "Wudu", ur: "وضو", dEn: "Be in wudu. If it is broken, make wudu again (ghusl if needed).", dUr: "باوضو ہوں۔ وضو ٹوٹ گیا ہو تو دوبارہ وضو کریں (ضرورت ہو تو غسل)۔" },
  { en: "Clean body, clothes, place", ur: "پاکی", dEn: "Your body, clothes and the place of prayer must be free of impurity (najasah).", dUr: "بدن، کپڑے اور نماز کی جگہ ناپاکی سے پاک ہوں۔" },
  { en: "Cover the awrah", ur: "ستر", dEn: "Men: at least from the navel to below the knees. Women: the whole body except face, hands and feet.", dUr: "مرد: کم از کم ناف سے گھٹنوں کے نیچے تک۔ عورت: چہرہ، ہاتھ اور پاؤں کے علاوہ پورا جسم۔" },
  { en: "Face the Qibla", ur: "قبلہ رخ", dEn: "Turn your chest toward the Kaaba in Makkah.", dUr: "سینہ مکہ مکرمہ میں کعبہ کی طرف رکھیں۔" },
  { en: "Right time and niyyat", ur: "وقت اور نیت", dEn: "Pray within the time of that prayer, and make the intention in your heart.", dUr: "اس نماز کے وقت کے اندر پڑھیں اور دل میں نیت کریں۔" },
];

export const TIPS = [
  { en: "Do not rush. Stay still in every position for at least the time of one “SubhanAllah” (tuma'ninah).", ur: "جلدی نہ کریں۔ ہر رکن میں کم از کم ایک ‘سبحان اللہ’ کہنے کی مقدار ٹھہریں (طمانیت)۔" },
  { en: "Say each “Allahu Akbar” while moving from one position to the next.", ur: "ایک رکن سے دوسرے رکن میں جاتے ہوئے ‘اللہ اکبر’ کہیں۔" },
  { en: "Learn from a teacher in person as well. A short video cannot correct your posture.", ur: "کسی استاد سے سامنے بیٹھ کر بھی سیکھیں۔ مختصر ویڈیو آپ کی کیفیت کی اصلاح نہیں کر سکتی۔" },
];
