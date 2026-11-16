// © 2026 YaoyaoWeng. All rights reserved.
// ===== 旅程資料：換一趟旅行只要改這個檔案 =====
// 這是「預設行程」，App 裡可以自由新增、刪除、修改，改過的版本會存在手機（並同步給旅伴）。
// 注意：這個檔案會公開，不要放護照號碼、訂位代號、電話等個人資料。
const TRIP = {
  id: "chiangmai-2026",
  copyright: "© 2026 YaoyaoWeng. All rights reserved.",
  title: "Chiang Mai",
  subtitle: "清邁閨蜜旅行",
  start: "2026-11-20",
  end: "2026-11-25",
  lengthText: "6天5夜",
  from: "台北", to: "清邁", people: 2,
  currency: "฿", currencyCode: "THB", homeCurrency: "TWD", defaultRate: 0.95,
  weather: { lat: 18.7883, lon: 98.9853 },

  // 行程類型：icon、名稱、顏色、記帳分類
  types: {
    flight:   { icon: "plane",    name: "航班",   color: "#5b7fb5", bg: "#e3ebf6", cat: "car" },
    move:     { icon: "car",      name: "交通",   color: "#6f7c4a", bg: "#ebeedd", cat: "car" },
    stay:     { icon: "bed",      name: "住宿",   color: "#9a8a2e", bg: "#f3efcd", cat: "bed" },
    spot:     { icon: "temple",   name: "景點",   color: "#b8862f", bg: "#f6ead0", cat: "ticket" },
    food:     { icon: "food",     name: "美食",   color: "#c8692f", bg: "#f9e3d3", cat: "food" },
    cafe:     { icon: "coffee",   name: "咖啡",   color: "#8b5e3c", bg: "#f1e4d8", cat: "food" },
    shop:     { icon: "bag",      name: "購物",   color: "#7a5aa6", bg: "#ece4f4", cat: "shop" },
    massage:  { icon: "spa",      name: "按摩",   color: "#c2566b", bg: "#f8e0e2", cat: "spa" },
    activity: { icon: "lantern",  name: "活動",   color: "#d18a1c", bg: "#fbeccb", cat: "ticket" },
    other:    { icon: "pin",      name: "其他",   color: "#7c7a66", bg: "#eeeadc", cat: "tag" }
  },

  days: [
    { d: 1, date: "2026-11-20", title: "抵達清邁・入住休息", icon: "plane", photo: "img/d1.jpg", stops: [
      { t: "22:00", type: "flight", title: "抵達清邁 CNX", place: "cnx", booking: "flight" },
      { t: "22:40", end: "23:30", type: "other", title: "入境、領行李" },
      { t: "23:30", type: "stay", title: "入住 Migoo Chiang Mai", place: "migoo", booking: "migoo" }
    ]},
    { d: 2, date: "2026-11-21", title: "換錢・戶外探險・週六夜市", icon: "bike", photo: "img/d2.jpg", stops: [
      { t: "09:30", type: "cafe", title: "換錢 → 早餐／咖啡" },
      { t: "12:00", end: "18:30", type: "activity", title: "瀑布＋竹筏漂流＋ATV", sub: "含接駁", booking: "atv" },
      { t: "19:30", end: "21:00", type: "shop", title: "Wua Lai 週六夜市", place: "wualai" },
      { t: "21:00", type: "massage", title: "平價按摩", sub: "泰式／腳底 60 分鐘" }
    ]},
    { d: 3, date: "2026-11-22", title: "清萊一日遊（包車 12 小時）", icon: "car", photo: "img/d3.jpg", route: true, stops: [
      { t: "08:00", type: "move", title: "出發｜經典三廟＋長頸村", sub: "包車 12 小時", booking: "car" },
      { type: "spot", title: "白廟", place: "white" },
      { type: "food", title: "Lalitta Café 午餐", place: "lalitta" },
      { type: "spot", title: "藍廟", place: "blue" },
      { type: "spot", title: "黑廟", place: "black" },
      { type: "spot", title: "長頸村", place: "karen" },
      { t: "20:00", approx: true, type: "move", title: "返回清邁" },
      { t: "21:00", type: "massage", title: "平價按摩", sub: "60 分鐘，依體力調整" }
    ]},
    { d: 4, date: "2026-11-23", title: "換飯店・市集購物・高級 SPA", icon: "bag", photo: "img/d4.jpg", stops: [
      { t: "08:30", type: "shop", title: "退房 → 瓦洛洛市場", sub: "伴手禮、零食", place: "warorot" },
      { t: "11:00", type: "food", title: "Khao Soi Khun Yai 午餐", sub: "咖哩麵", place: "khunyai" },
      { t: "14:00", type: "stay", title: "入住 The Golden Wells Residence", place: "goldenwells", booking: "golden" },
      { t: "15:00", end: "17:30", type: "shop", title: "One Nimman／MAYA 逛街購物", place: "nimman" },
      { t: "17:30", type: "food", title: "Tong Tem Toh 晚餐", sub: "泰北料理", place: "tongtemtoh" },
      { t: "19:00", end: "21:00", type: "massage", title: "高級 SPA", sub: "Makkha／Fah Lanna・精油芳療 90–120 分鐘", booking: "spa", hi: true }
    ]},
    { d: 5, date: "2026-11-24", title: "古城慢活・萬人天燈節", icon: "lantern", photo: "img/d5.jpg", stops: [
      { t: "08:30", type: "food", title: "飯店早餐" },
      { t: "09:30", type: "cafe", title: "古城散步／咖啡／整理行李" },
      { t: "13:00", end: "20:45", type: "activity", title: "參加 CAD 萬人天燈節", sub: "文化體驗、晚餐、祈福儀式、施放（依活動表）", booking: "lantern", hi: true },
      { type: "massage", title: "彈性按摩", sub: "返回後視體力・30–60 分鐘" }
    ]},
    { d: 6, date: "2026-11-25", title: "告別清邁・返回台灣", icon: "plane", photo: "img/d6.jpg", stops: [
      { t: "05:00", end: "05:20", type: "move", title: "出發前往機場", booking: "transfer" },
      { t: "08:00", type: "flight", title: "清邁 CNX 起飛", booking: "flight" },
      { t: "12:40", type: "flight", title: "抵達桃園 TPE" }
    ]}
  ],

  places: {
    white: { name: "白廟", en: "Wat Rong Khun", area: "清萊", type: "spot", guide: "spot", img: "img/d3.jpg", rating: 4.8, reviews: "12,560",
      desc: "泰國最具代表性的現代寺廟，以純白建築與精緻雕刻聞名，是清萊必訪的地標。", hours: "08:00–17:00", fee: "฿100", stay: "60–90 分", q: "Wat Rong Khun Chiang Rai" },
    blue: { name: "藍廟", en: "Wat Rong Suea Ten", area: "清萊", type: "spot", guide: "spot", img: "img/p_blue.jpg",
      desc: "寶藍色搭配金色裝飾的寺廟，殿內白色佛像在藍色背景下非常好拍。", stay: "30–45 分", q: "Wat Rong Suea Ten" },
    black: { name: "黑廟", en: "Baan Dam Museum", area: "清萊", type: "spot", guide: "spot", img: "img/p_black.jpg",
      desc: "藝術家 Thawan Duchanee 的作品園區，數十棟深色木造建築，風格神秘，和白廟形成強烈對比。", stay: "45–60 分", q: "Baan Dam Museum" },
    karen: { name: "長頸村", en: "Karen Long Neck Village", area: "清萊", type: "spot", guide: "spot", img: "img/p_karen.jpg",
      desc: "克倫族長頸族村落，可以看到傳統銅圈服飾與手工織品。", stay: "30–45 分", q: "Karen Long Neck Village Chiang Rai" },
    lalitta: { name: "Lalitta Café", zh: "仙境咖啡廳", area: "清萊", type: "cafe", img: "img/f3.jpg", rating: 4.5, price: "฿฿", guide: "food",
      desc: "像童話森林的花園咖啡廳，有小瀑布和溫室，清萊一日遊順路吃午餐。", q: "Lalitta Cafe Chiang Rai" },
    khunyai: { name: "Khao Soi Khun Yai", zh: "咖哩麵", area: "舊城區", type: "food", img: "img/f1.jpg", rating: 4.7, price: "฿", guide: "food",
      desc: "在地人也愛的咖哩麵（Khao Soi）小店，通常只開到中午左右，建議早點去。", q: "Khao Soi Khun Yai" },
    tongtemtoh: { name: "Tong Tem Toh", zh: "泰北料理", area: "尼曼區", type: "food", img: "img/f2.jpg", rating: 4.6, price: "฿฿", guide: "food",
      desc: "人氣泰北料理餐廳，烤豬頸肉、泰北拼盤必點；排隊人多，建議提早到。", q: "Tong Tem Toh" },
    wualai: { name: "Wua Lai 週六夜市", zh: "週六限定", area: "舊城南側", type: "shop", guide: "shop",
      desc: "只在週六晚上的銀器街夜市，小吃、手工藝品很多。", q: "Wualai Walking Street" },
    warorot: { name: "Warorot 瓦洛洛市場", zh: "伴手禮・零食", area: "市區", type: "shop", img: "img/f4.jpg", rating: 4.4, price: "฿", guide: "shop",
      desc: "清邁最大的傳統市場，泰北香腸、炸豬皮、乾果伴手禮都買得到。", q: "Warorot Market" },
    nimman: { name: "One Nimman／MAYA", zh: "逛街購物", area: "尼曼區", type: "shop", img: "img/d4.jpg", guide: "shop",
      desc: "One Nimman 是紅磚歐風的購物街區，對面就是 MAYA 百貨，可以一次逛完。", q: "One Nimman" },
    makkha: { name: "Makkha Health & Spa", zh: "高級 SPA", area: "舊城區", type: "massage", guide: "massage",
      desc: "老宅改建的高級 SPA，環境安靜，適合精油芳療。建議提前預約。", q: "Makkha Health & Spa" },
    fahlanna: { name: "Fah Lanna Spa", zh: "高級 SPA", area: "舊城區", type: "massage", guide: "massage",
      desc: "蘭納風格庭園 SPA，人氣很高，有提供接送服務，建議提前預約。", q: "Fah Lanna Spa" },
    lila: { name: "Calm／Lila Thai Massage", zh: "平價按摩", area: "市區多間分店", type: "massage", guide: "massage",
      desc: "平價泰式／腳底按摩，分店多、不用預約，逛完夜市或回飯店前順路去。", q: "Lila Thai Massage Chiang Mai" },
    cnx: { name: "清邁國際機場", en: "Chiang Mai International Airport", area: "清邁", type: "flight", q: "Chiang Mai International Airport" },
    migoo: { name: "Migoo Chiang Mai", en: "11/20–11/23", area: "清邁", type: "stay", img: "img/b_hotel1.jpg", q: "Migoo Chiang Mai" },
    goldenwells: { name: "The Golden Wells Residence", en: "11/23–11/25", area: "清邁", type: "stay", img: "img/b_hotel2.jpg", q: "The Golden Wells Residence Chiang Mai" }
  },
  guideTabs: [ ["food","必吃美食","food"], ["cafe","咖啡甜點","coffee"], ["shop","市集購物","bag"], ["massage","按摩推薦","spa"], ["spot","景點","temple"] ],

  routes: {
    3: { img: "img/map.jpg", title: "包車資訊",
      info: [ ["車型","小轎車 4 人座（2 大人）"], ["費用","฿4,600"], ["含","油、停車、過路費"], ["用車","清萊 12 小時"], ["超時","฿300 / 小時"] ],
      nav: { origin: "Chiang Mai", waypoints: ["Wat Rong Khun","Lalitta Cafe Chiang Rai","Wat Rong Suea Ten","Baan Dam Museum"], destination: "Karen Long Neck Village Chiang Rai" } }
  },

  // 預訂（預設值；App 裡可以新增、修改、刪除，會同步）。done = 是否已確認，會連動「出發準備」
  bookings: [
    { id: "flight", type: "transport", title: "機票｜TPE ⇄ CNX", date: "2026-11-20", t: "22:00", note: "去程 11/20 22:00 抵達清邁；回程 11/25 08:00 起飛・12:40 抵達桃園", done: true },
    { id: "migoo", type: "stay", title: "Migoo Chiang Mai", checkin: "2026-11-20", checkout: "2026-11-23", done: true },
    { id: "golden", type: "stay", title: "The Golden Wells Residence", checkin: "2026-11-23", checkout: "2026-11-25", done: true },
    { id: "atv", type: "activity", title: "瀑布＋竹筏漂流＋ATV", date: "2026-11-21", t: "12:00", end: "18:30", note: "含接駁", done: false },
    { id: "car", type: "transport", title: "清萊包車（2 人）", date: "2026-11-22", t: "08:00", note: "12 小時・฿4,600（含油、停車、過路費）", done: true },
    { id: "spa", type: "spa", title: "高級 SPA", date: "2026-11-23", t: "19:00", end: "21:00", note: "Makkha／Fah Lanna・精油芳療", done: false },
    { id: "lantern", type: "activity", title: "CAD 萬人天燈節", date: "2026-11-24", t: "13:00", end: "20:45", note: "含晚餐・接駁", done: true },
    { id: "transfer", type: "transport", title: "機場接送", date: "2026-11-25", t: "05:00", done: false }
  ],
  bookingImg: { flight: "img/b_plane.jpg", migoo: "img/b_hotel1.jpg", golden: "img/b_hotel2.jpg", atv: "img/d2.jpg", car: "img/b_car.jpg", spa: "img/b_spa.jpg", lantern: "img/b_lantern.jpg", transfer: "img/b_car.jpg" },
  bookingTypes: { stay: ["住宿", "bed", "img/b_hotel1.jpg", "stay"], transport: ["交通", "car", "img/b_car.jpg", "move"], activity: ["活動", "lantern", "img/b_lantern.jpg", "activity"], spa: ["按摩／SPA", "spa", "img/b_spa.jpg", "massage"], food: ["餐廳", "food", "img/f2.jpg", "food"] },
  bookingTabs: [ ["all","全部"], ["stay","住宿"], ["transport","交通"], ["activity","活動"], ["spa","按摩／SPA"], ["food","餐廳"] ],

  // 出發準備（「預訂與確認」會自動從預訂票券產生）
  checklist: [
    { tab: "before", group: "重要文件", icon: "doc", items: [
      ["passport","護照（效期至少 6 個月）",true],
      ["tdac","泰國 TDAC 入境卡（11/18 起填寫）",true],
      ["orders","機票與住宿訂單（電子檔／離線）",false] ]},
    { tab: "before", group: "預訂與確認", icon: "cal", fromBookings: true },
    { tab: "pack", group: "隨身必備", icon: "luggage", items: [
      ["p_cash","泰銖現金＋信用卡",false], ["p_phone","手機充電器＋行動電源",false], ["p_sim","eSIM／漫遊",false], ["p_med","常備藥品",false] ]},
    { tab: "pack", group: "盥洗與用品", icon: "luggage", items: [
      ["p_bug","防蚊液",false], ["p_toilet","盥洗用品・保養品",false], ["p_bag","防水袋（漂流用）",false] ]},
    { tab: "other", group: "其他提醒", icon: "bell", items: [
      ["o_grab","下載 Grab 並綁定付款",false], ["o_offline","下載 Google Maps 清邁離線地圖",false], ["o_alarm","11/25 設 04:30 鬧鐘（05:00 出發）",false] ]}
  ],
  checkTabs: [ ["before","出發前"], ["pack","行李打包"], ["other","其他提醒"] ],

  // 服裝穿搭：每日造型（palette = 穿搭配色）
  outfits: [
    { d: 1, title: "抵達日", en: "Arrival Day Look", look: "舒適洋裝＋薄外套", icon: "plane", img: "img/look1.jpg",
      palette: ["#f6efe2","#e8cfa8","#c99a64","#d9b98c","#a7b48a"], photo: "飯店入住隨手拍，碎花洋裝很上鏡", tip: "機上冷氣強，薄外套隨身；好穿脫的鞋過安檢比較快", acc: "草編包、薄外套、頸枕", mood: "Cozy / Easy" },
    { d: 2, title: "ATV＋瀑布", en: "Adventure Day Look", look: "運動套裝＋防滑鞋", icon: "mountain", img: "img/look2.jpg",
      palette: ["#7d8f55","#f4f1ea","#5a5a55","#cfc6b4","#9fb27a"], photo: "瀑布前穿亮色上衣最好拍", tip: "漂流會全濕：穿快乾衣、防滑鞋，帶替換衣物和塑膠袋", acc: "棒球帽、防水袋、毛巾", mood: "Sporty / Fresh" },
    { d: 3, title: "清萊一日遊", en: "Temple Day Look", look: "長裙＋有袖上衣", icon: "temple", img: "img/look3.jpg",
      palette: ["#f8ede0","#efc2b9","#e59a93","#e8d3b0","#d2ad5c"], photo: "白廟前穿淺粉、奶油白最搭", tip: "寺廟要遮肩、不露膝；坐車時間長，穿好走的鞋", acc: "草編包、珍珠耳環、披肩", mood: "Sweet / Graceful" },
    { d: 4, title: "尼曼區＋SPA", en: "Nimman & Spa Look", look: "洋裝＋涼鞋", icon: "spa", img: "img/look4.jpg",
      palette: ["#fbf6ec","#efe2c8","#d8b98a","#b9c79a","#d9ad55"], photo: "One Nimman 紅磚牆配白洋裝很有歐洲感", tip: "逛街走很多路穿平底涼鞋；SPA 前穿好脫的衣服", acc: "珍珠耳環、小包", mood: "Chic / Relaxed" },
    { d: 5, title: "天燈節", en: "Sky Lantern Festival Look", look: "淺色長裙＋小包", icon: "lantern", img: "img/look5.jpg", big: "img/look5_big.jpg",
      palette: ["#f4efe4","#e3c49c","#b9c79a","#efb7b3","#d9ad55"], photo: "淺色、柔和、飄逸感", tip: "避免過長裙擺，方便行走與放天燈", acc: "小包、耳環、薄披肩", mood: "Romantic / Elegant", night: true },
    { d: 6, title: "返程日", en: "Going Home Look", look: "舒適休閒穿搭", icon: "plane", img: "img/look6.jpg",
      palette: ["#f7f5ef","#7d8f55","#cfc6b4","#9aa3ad","#5f6b3c"], photo: "機場最後一張合照留念", tip: "清晨 05:00 出發，前一晚先把衣服準備好", acc: "棒球帽、外套、頸枕", mood: "Comfy / Casual" }
  ],
  // 打包清單：[id, 名稱, 數量, 預設已準備]
  packing: [
    { k: "tops", name: "上衣", en: "Tops", icon: "shirt", items: [["t1","短袖上衣",3,true],["t2","有袖上衣（薄長袖／襯衫）",2,true],["t3","輕薄上衣（背心／無袖）",1,false]] },
    { k: "bottoms", name: "下身／洋裝", en: "Bottoms & Dresses", icon: "user", items: [["b1","長裙／洋裝",3,true],["b2","長褲",1,true],["b3","短褲",1,false],["b4","運動套裝",1,true]] },
    { k: "shoes", name: "鞋子", en: "Shoes", icon: "bike", items: [["s1","平底涼鞋",1,true],["s2","運動鞋（防滑）",1,true],["s3","休閒鞋",1,false]] },
    { k: "acc", name: "配件", en: "Accessories", icon: "bag", items: [["a1","小包",1,true],["a2","防曬帽",1,true],["a3","披肩",1,true],["a4","太陽眼鏡",1,false],["a5","耳環／飾品",1,false]] },
    { k: "others", name: "其他", en: "Others", icon: "weather", items: [["x1","薄外套",1,true],["x2","雨具（輕便雨衣／折疊傘）",1,false],["x3","防曬用品（防曬乳／袖套）",1,false]] }
  ],
  packTip: "清邁白天偏熱，早晚微涼；清萊寺廟行程建議穿著端莊（遮肩、不露膝）。",
  // 依照行程關鍵字自動提醒
  outfitRules: [
    [/廟|寺/, "temple", "去寺廟：要遮肩、不露膝"],
    [/漂流|瀑布|ATV/, "wave", "會弄濕：帶替換衣物、防滑鞋"],
    [/天燈/, "lantern", "晚上變涼：帶薄外套"],
    [/SPA|按摩/, "spa", "按摩：穿寬鬆好換的衣服"],
    [/夜市|市場|逛街/, "bag", "逛街：小斜背包、好走的鞋"],
    [/起飛|抵達.*CNX|機場/, "plane", "搭機：機上冷，帶外套"]
  ],
  weatherFallback: [ ["2026-11-20",31,21,"sun"],["2026-11-21",30,21,"sun"],["2026-11-22",30,20,"sun"],["2026-11-23",29,20,"cloud"],["2026-11-24",29,20,"cloud"],["2026-11-25",30,21,"sun"] ],
  weatherTip: "白天約 29–31°C，早晚約 18–22°C。建議：短袖、短褲／長裙＋薄外套。",

  budgetPlan: { title: "旅費預估（每人）", range: "฿7,100 – 10,000", items: [
    ["car","清萊包車（分攤）","฿2,300"], ["food","餐飲／咖啡／夜市","฿2,000 – 3,000"], ["spa","平價按摩（2–3 次）","฿700 – 1,200"],
    ["spa","高級 SPA（1 次）","฿1,500 – 2,500"], ["car","交通（Grab 等）","฿600 – 1,000"] ]},
  budgetCats: [ ["food","餐飲"], ["car","交通"], ["spa","按摩"], ["shop","購物"], ["ticket","門票活動"], ["bed","住宿"], ["tag","其他"] ],

  // 拍照清單：哪些類型的行程要列進去
  photoTypes: ["spot", "activity", "shop", "food", "cafe", "stay"],
  albumCover: ["img/d3.jpg", "img/d5.jpg", "img/a4.jpg"]
};
