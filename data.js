// © 2026 YaoyaoWeng. All rights reserved.
// ===== 旅程資料：換一趟旅行只要改這個檔案 =====
// 這是「預設行程」，App 裡可以自由新增、刪除、修改，改過的版本會存在手機（並同步給旅伴）。
// 注意：這個檔案會公開，不要放護照號碼、訂位代號、電話等個人資料。
const TRIP = {
  id: "chiangmai-2026",
  itinVersion: 3,  // 行程預設資料改版時 +1，App 會提示要不要套用新版
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

  // sub = 當天副標；tip = 當天提醒（路線頁下方備註）
  days: [
    { d: 1, date: "2026-11-20", title: "抵達清邁・入住 Migoo", short: "抵達清邁", icon: "plane", photo: "img/d1.jpg",
      sub: "22:00 抵達・夜晚不再安排其他行程", tip: "機場到飯店約 15–25 分鐘（交通估計）", stops: [
      { t: "22:00", type: "flight", title: "抵達清邁機場", sub: "去程 18:55 起飛", place: "cnx", booking: "flight" },
      { t: "22:40", end: "23:30", type: "other", title: "入境、領取行李" },
      { type: "move", title: "Grab／機場車 → Migoo", sub: "約 15–25 分鐘" },
      { t: "23:30", type: "stay", title: "入住 Migoo Chiang Mai", sub: "入住後直接休息", place: "migoo", booking: "migoo" }
    ]},
    { d: 2, date: "2026-11-21", title: "換錢・瀑布・ATV・夜市", short: "換錢＋戶外探險", icon: "bike", photo: "img/d2.jpg",
      sub: "已含接駁・戶外活動地點待憑證核對", tip: "戶外活動位置僅示意，勿當作實際導航", stops: [
      { t: "09:30", type: "cafe", title: "早餐與換錢", sub: "換匯店待選", pin: [0.42,0.32,"換匯店（待選）"] },
      { t: "12:00", end: "18:30", type: "activity", title: "瀑布、竹筏、ATV", sub: "含接駁，集合時間依憑證", booking: "atv", pin: [0.27,0.72,"戶外活動（示意）"] },
      { t: "19:30", end: "21:00", type: "shop", title: "Wua Lai 週六夜市", place: "wualai" },
      { t: "21:00", type: "massage", title: "平價按摩", sub: "有體力再做・60 分鐘" }
    ]},
    { d: 3, date: "2026-11-22", title: "清萊一日遊・包車", short: "清萊一日遊", icon: "car", photo: "img/d3.jpg", route: true,
      sub: "08:00 出發・12 小時包車・兩人", tip: "景點順序依司機實際安排", stops: [
      { t: "08:00", type: "move", title: "從 Migoo 出發", sub: "司機接送，當天付款 ฿4,600", booking: "car", pin: [0.19,0.82,"清邁出發"] },
      { type: "spot", title: "白廟 Wat Rong Khun", sub: "參觀白色寺廟與建築藝術", place: "white" },
      { type: "food", title: "Lalitta Café 午餐", sub: "仙境咖啡廳，預留拍照時間", place: "lalitta" },
      { type: "spot", title: "藍廟 Wat Rong Suea Ten", sub: "清萊特色藍色寺廟", place: "blue" },
      { type: "spot", title: "黑廟 Baan Dam Museum", sub: "特色木雕藝術", place: "black" },
      { type: "spot", title: "長頸村", sub: "依司機實際路線安排", place: "karen" },
      { t: "20:00", approx: true, type: "move", title: "返回清邁", sub: "當晚不安排固定夜市" },
      { t: "21:00", type: "massage", title: "平價按摩", sub: "60 分鐘，依體力調整" }
    ]},
    { d: 4, date: "2026-11-23", title: "市集・美食・高級 SPA", short: "購物＋美食＋高級SPA", icon: "bag", photo: "img/d4.jpg",
      sub: "換飯店日・晚間 SPA 尚待預約", tip: "當天跨區用 Grab 較方便", stops: [
      { t: "09:15", type: "shop", title: "瓦洛洛市場買伴手禮", sub: "退房後先寄放行李", place: "warorot" },
      { t: "11:00", type: "food", title: "Khao Soi Khun Yai", sub: "泰北咖哩麵午餐", place: "khunyai" },
      { t: "14:00", type: "stay", title: "取行李，Golden Wells 入住", sub: "Migoo 取行李 → 換飯店", place: "goldenwells", booking: "golden" },
      { t: "15:00", end: "17:30", type: "shop", title: "One Nimman／MAYA", sub: "逛街購物", place: "nimman" },
      { t: "17:30", type: "food", title: "Tong Tem Toh 晚餐", sub: "泰北料理", place: "tongtemtoh" },
      { t: "19:00", end: "21:00", type: "massage", title: "高級 SPA（待預約）", sub: "Makkha・精油芳療 90–120 分鐘", place: "makkha", booking: "spa", hi: true }
    ]},
    { d: 5, date: "2026-11-24", title: "古城慢活・CAD 天燈節", short: "CAD 萬人天燈節", icon: "lantern", photo: "img/d5.jpg",
      sub: "集合點依票種而異，尚待電子票核對", tip: "集合點候選：MAYA／國際會展中心（依電子票）", stops: [
      { t: "08:30", type: "food", title: "飯店早餐、整理行李" },
      { t: "13:00", type: "move", title: "依票種到指定集合點", sub: "Elite／Platinum 在 MAYA，其餘在國際會展中心", booking: "lantern", pin: [0.55,0.27,"集合點（待確認）"] },
      { t: "14:30", end: "17:30", type: "activity", title: "入場與文化活動", sub: "CAD Cultural Center Lanna", place: "cad", hi: true },
      { t: "17:30", end: "19:00", type: "food", title: "主辦方晚餐" },
      { t: "20:15", type: "activity", title: "放天燈", sub: "20:45 後官方接駁回程", hi: true },
      { t: "20:45", approx: true, type: "stay", title: "官方接駁回程，返回飯店休息", sub: "不再安排按摩", place: "goldenwells", pin: [0.27,0.82,"市區接駁下車"] }
    ]},
    { d: 6, date: "2026-11-25", title: "清晨機場接送・返台", short: "告別清邁", icon: "plane", photo: "img/d6.jpg",
      sub: "回程日・請前一日整理行李並預約接送", tip: "早班機請提早抵達機場；不安排其他活動", stops: [
      { t: "05:00", end: "05:20", type: "move", title: "離開飯店", sub: "Grab／預約機場接送", booking: "transfer" },
      { t: "08:00", type: "flight", title: "清邁 CNX 起飛", place: "cnx", booking: "flight" },
      { t: "12:40", type: "flight", title: "抵達桃園 TPE" }
    ]}
  ],

  places: {
    white: { name: "白廟", en: "Wat Rong Khun", zh: "清萊代表性的白色藝術寺廟", area: "清萊", type: "spot", guide: "spot", img: "img/d3.jpg", rating: 4.8, reviews: "12,560", trans: "清萊包車",
      hl: ["純白建築與鏡面裝飾", "適合拍攝外觀與建築細節", "參觀時留意寺廟衣著規定（遮肩、不露膝）"],
      desc: "泰國最具代表性的現代寺廟，以純白建築與精緻雕刻聞名，是清萊必訪的地標。", hours: "08:00–17:00", fee: "฿100", stay: "60–90 分", q: "Wat Rong Khun Chiang Rai" },
    blue: { name: "藍廟", en: "Wat Rong Suea Ten", zh: "清萊特色藍色寺廟", area: "清萊", type: "spot", guide: "spot", img: "img/p_blue.jpg", trans: "清萊包車",
      hl: ["寶藍色殿堂配金色雕刻", "殿內白色佛像非常上鏡", "入殿需脫鞋、衣著端莊"],
      desc: "寶藍色搭配金色裝飾的寺廟，殿內白色佛像在藍色背景下非常好拍。", stay: "30–45 分", q: "Wat Rong Suea Ten" },
    black: { name: "黑廟", en: "Baan Dam Museum", zh: "黑色木造藝術園區", area: "清萊", type: "spot", guide: "spot", img: "img/p_black.jpg", trans: "清萊包車",
      hl: ["數十棟深色木造建築", "特色木雕與獸骨藝術", "和白廟風格強烈對比"],
      desc: "藝術家 Thawan Duchanee 的作品園區，數十棟深色木造建築，風格神秘，和白廟形成強烈對比。", stay: "45–60 分", q: "Baan Dam Museum" },
    karen: { name: "長頸村", en: "Karen Long Neck Village", zh: "克倫族傳統村落", area: "清萊", type: "spot", guide: "spot", img: "img/p_karen.jpg", trans: "清萊包車",
      hl: ["傳統銅圈服飾文化", "手工織品可當伴手禮", "拍照前先禮貌詢問"],
      desc: "克倫族長頸族村落，可以看到傳統銅圈服飾與手工織品。", stay: "30–45 分", q: "Karen Long Neck Village Chiang Rai" },
    lalitta: { name: "Lalitta Café", zh: "清萊仙境咖啡廳", area: "清萊", type: "cafe", img: "img/f3.jpg", rating: 4.5, price: "฿฿", guide: "cafe", also: ["food"], note: "清萊包車行程內",
      why: ["花園、瀑布、溫室像童話森林", "清萊一日遊順路吃午餐", "預留時間拍照"],
      desc: "像童話森林的花園咖啡廳，有小瀑布和溫室，清萊一日遊順路吃午餐。", q: "Lalitta Cafe Chiang Rai" },
    khunyai: { name: "Khao Soi Khun Yai", zh: "清邁招牌泰北咖哩麵", area: "清邁古城北側", type: "food", img: "img/f1.jpg", rating: 4.7, price: "฿", guide: "food", also: ["thai"], note: "推薦午餐",
      why: ["泰北代表性料理 Khao Soi", "咖哩湯底搭配酥脆麵條", "午餐時段可能排隊，建議早點到"],
      desc: "在地人也愛的咖哩麵（Khao Soi）小店，通常只開到中午左右，建議早點去。", q: "Khao Soi Khun Yai" },
    tongtemtoh: { name: "Tong Tem Toh", zh: "泰北料理", area: "尼曼區", type: "food", img: "img/f2.jpg", rating: 4.6, price: "฿฿", guide: "food", also: ["thai"], note: "香腸與燉豬肉",
      why: ["在地人氣泰北餐廳", "必點泰北香腸、燉豬肉、烤豬頸肉", "晚餐人多，建議提早到"],
      desc: "人氣泰北料理餐廳，烤豬頸肉、泰北拼盤必點；排隊人多，建議提早到。", q: "Tong Tem Toh" },
    wualai: { name: "Wua Lai 週六夜市", zh: "週六限定夜市", area: "舊城南側", type: "shop", guide: "shop", note: "小吃・銀飾・手工藝",
      why: ["只在週六晚上的銀器街夜市", "小吃選擇多，適合邊走邊吃", "人潮多，注意隨身物品"],
      desc: "只在週六晚上的銀器街夜市，小吃、手工藝品很多。", q: "Wualai Walking Street" },
    warorot: { name: "Warorot Market", zh: "瓦洛洛傳統市場", area: "市區・濱河", type: "shop", img: "img/f4.jpg", rating: 4.4, price: "฿", guide: "shop", note: "泰北零食／果乾／伴手禮",
      why: ["清邁最大的傳統市場", "泰北香腸、炸豬皮、果乾一次買齊", "早上去比較不熱、選擇多"],
      desc: "清邁最大的傳統市場，泰北香腸、炸豬皮、乾果伴手禮都買得到。", q: "Warorot Market" },
    nimman: { name: "One Nimman／MAYA", zh: "尼曼區購物商圈", area: "尼曼區", type: "shop", img: "img/d4.jpg", guide: "shop", note: "選物店・百貨",
      why: ["紅磚歐風街區很好拍", "對面 MAYA 百貨一次逛完", "附近咖啡廳、餐廳很多"],
      desc: "One Nimman 是紅磚歐風的購物街區，對面就是 MAYA 百貨，可以一次逛完。", q: "One Nimman" },
    makkha: { name: "Makkha Health & Spa", zh: "高級 SPA", area: "舊城區", type: "massage", guide: "massage",
      desc: "老宅改建的高級 SPA，環境安靜，適合精油芳療。建議提前預約。", q: "Makkha Health & Spa" },
    fahlanna: { name: "Fah Lanna Spa", zh: "高級 SPA", area: "舊城區", type: "massage", guide: "massage",
      desc: "蘭納風格庭園 SPA，人氣很高，有提供接送服務，建議提前預約。", q: "Fah Lanna Spa" },
    lila: { name: "Calm／Lila Thai Massage", zh: "平價按摩", area: "市區多間分店", type: "massage", guide: "massage",
      desc: "平價泰式／腳底按摩，分店多、不用預約，逛完夜市或回飯店前順路去。", q: "Lila Thai Massage Chiang Mai" },
    cad: { name: "CAD Cultural Center Lanna", zh: "CAD 萬人天燈節會場", area: "清邁郊區", type: "activity", guide: "spot", trans: "官方接駁",
      desc: "依電子票上的票種到指定集合點搭官方接駁：Elite／Platinum 在 MAYA，其餘在 Chiang Mai International Exhibition and Convention Centre。",
      hl: ["文化體驗、晚餐、祈福儀式", "20:15 放天燈", "實際集合點以電子票為準"], q: "CAD Cultural Center Lanna Chiang Mai", url: "" },
    cnx: { name: "清邁國際機場", en: "Chiang Mai International Airport", area: "清邁", type: "flight", q: "Chiang Mai International Airport" },
    migoo: { name: "Migoo Chiang Mai", en: "11/20–11/23", area: "清邁", type: "stay", img: "img/b_hotel1.jpg", q: "Migoo Chiang Mai" },
    goldenwells: { name: "The Golden Wells Residence", en: "11/23–11/25", area: "清邁", type: "stay", img: "img/b_hotel2.jpg", q: "The Golden Wells Residence Chiang Mai" }
  },
  guideTabs: [ ["food","推薦美食","food"], ["thai","泰北料理","food"], ["cafe","咖啡甜點","coffee"], ["shop","市集","bag"], ["massage","按摩","spa"], ["spot","景點","temple"] ],

  // 每日路線地圖（概念示意，非實際比例）：地點在圖上的位置（0–1）、短名稱
  mapPos: { cnx: [0.18,0.79], migoo: [0.71,0.26], khunyai: [0.32,0.25], warorot: [0.81,0.39], goldenwells: [0.56,0.65], nimman: [0.14,0.57], tongtemtoh: [0.16,0.86],
    makkha: [0.85,0.86], fahlanna: [0.66,0.9], lila: [0.5,0.4], wualai: [0.71,0.83], white: [0.29,0.6], lalitta: [0.56,0.5], blue: [0.73,0.28], black: [0.3,0.19], karen: [0.77,0.8], cad: [0.8,0.77] },
  mapDayPos: { 4: { migoo: [0.71,0.15] }, 5: { goldenwells: [0.23,0.43] }, 6: { goldenwells: [0.71,0.26] } },
  mapShort: { cnx: "清邁機場 CNX", migoo: "Migoo", wualai: "Wua Lai夜市", khunyai: "Khao Soi", warorot: "瓦洛洛市場", goldenwells: "Golden Wells", nimman: "One Nimman",
    tongtemtoh: "Tong Tem Toh", makkha: "Makkha SPA", cad: "CAD會場", lalitta: "Lalitta Café" },
  mapStyle: { 3: "mountain", 5: "mountain" },
  // 路線頁副標
  mapSub: { 1: "抵達日｜夜晚不再安排其他行程", 2: "已含接駁｜戶外活動地點待憑證核對", 3: "08:00出發｜2人包車 ฿4,600", 4: "換飯店日｜晚間SPA尚待預約", 5: "重要：集合點依票種而異，尚待電子票核對", 6: "回程日｜請前一日整理行李並預約接送" },
  // 每日路線頁的主題（顏色、標題、英文副標、提示）
  routeTheme: {
    1: { t: "抵達清邁", en: "Arrival & Rest", c: "#5f7aa8" },
    2: { t: "山林探險", en: "Adventure & Night Market", c: "#5f8a3a" },
    3: { t: "清萊一日遊", en: "Chiang Rai Day Trip", c: "#7468a8", pill: ["car", "清邁出發・包車 12 小時"] },
    4: { t: "市集與 SPA", en: "Shopping & Slow Living", c: "#a85a6c" },
    5: { t: "慢活與天燈", en: "A Day to Remember", c: "#c6952f" },
    6: { t: "帶回美好回憶", en: "Until Next Time", c: "#4f74a8" }
  },
  // 每個行程搭配的小插畫（先看連結地點，再看關鍵字，最後看類型）
  routeArt: {
    place: { white: "whitet", blue: "bluet", black: "blackt", karen: "karen", lalitta: "lalitta", khunyai: "khaosoi", tongtemtoh: "thaifood",
      warorot: "market", wualai: "nightmkt", nimman: "nimman", migoo: "migoo", goldenwells: "hotel2", makkha: "spaoil", fahlanna: "spaoil", lila: "towels", cad: "lanterns" },
    words: [ [/起飛/, "airport"], [/TPE|桃園|台灣/, "taipei"], [/前往機場|退房|出發前往|離開飯店|集合點|Grab|機場車/, "suitcase"], [/CNX|抵達|機場/, "plane"], [/飯店早餐|早餐/, "croissant"],
      [/古城/, "gate"], [/天燈/, "lanterns"], [/瀑布|漂流|ATV/, "waterfall"], [/夜市/, "nightmkt"], [/市場|市集/, "market"], [/高級|SPA/, "spaoil"], [/按摩/, "towels"],
      [/咖啡|換錢/, "coffee"], [/咖哩麵|Khao Soi/, "khaosoi"], [/晚餐|午餐|泰北|餐/, "thaifood"], [/逛街|Nimman|MAYA/, "nimman"], [/入住|飯店|Residence/, "hotel2"] ],
    type: { flight: "plane", stay: "hotel2", food: "thaifood", cafe: "coffee", shop: "market", massage: "towels", spot: "gate", activity: "lanterns", move: "suitcase" }
  },
  routes: {
    3: { img: "img/map.jpg", title: "包車資訊",
      info: [ ["車型","小轎車 4 人座（2 大人）"], ["費用","฿4,600"], ["含","油、停車、過路費"], ["用車","清萊 12 小時"], ["超時","฿300 / 小時"] ],
      nav: { origin: "Chiang Mai", waypoints: ["Wat Rong Khun","Lalitta Cafe Chiang Rai","Wat Rong Suea Ten","Baan Dam Museum"], destination: "Karen Long Neck Village Chiang Rai" } }
  },

  // 預訂（預設值；App 裡可以新增、修改、刪除，會同步）。done = 是否已確認，會連動「出發準備」
  bookings: [
    { id: "flight", type: "transport", title: "往返機票 TPE ⇄ CNX", date: "2026-11-20", t: "18:55", end: "22:00", note: "回程 11/25 08:00–12:40", badge: "已提供航班", done: true },
    { id: "migoo", type: "stay", title: "Migoo Chiang Mai", checkin: "2026-11-20", checkout: "2026-11-23", badge: "住宿資料", done: true },
    { id: "golden", type: "stay", title: "The Golden Wells Residence", checkin: "2026-11-23", checkout: "2026-11-25", note: "Agoda 已付", badge: "訂房確認", done: true },
    { id: "atv", type: "activity", title: "瀑布＋竹筏＋ATV", date: "2026-11-21", t: "12:00", end: "18:30", note: "含接駁・精確場地待確認", badge: "場地待確認", done: false },
    { id: "car", type: "transport", title: "清萊包車（2 人）", date: "2026-11-22", t: "08:00", note: "12 小時・฿4,600 現金・超時 ฿300／小時", badge: "日期已確認", done: true },
    { id: "spa", type: "spa", title: "高級 SPA（Makkha）", date: "2026-11-23", t: "19:00", end: "21:00", note: "尚未預約", badge: "尚未預約", done: false },
    { id: "lantern", type: "activity", title: "CAD 天燈節", date: "2026-11-24", t: "13:00", end: "20:45", note: "依電子票確認票種與集合點", badge: "待核對集合點", done: false },
    { id: "transfer", type: "transport", title: "清晨機場接送", date: "2026-11-25", t: "05:00", note: "Grab 或預約接送", badge: "待預約", done: false }
  ],
  bookingImg: { flight: "img/b_plane.jpg", migoo: "img/b_hotel1.jpg", golden: "img/b_hotel2.jpg", atv: "img/d2.jpg", car: "img/b_car.jpg", spa: "img/b_spa.jpg", lantern: "img/b_lantern.jpg", transfer: "img/b_car.jpg" },
  bookingTypes: { stay: ["住宿", "bed", "img/b_hotel1.jpg", "stay"], transport: ["交通", "car", "img/b_car.jpg", "move"], activity: ["活動", "lantern", "img/b_lantern.jpg", "activity"], spa: ["按摩／SPA", "spa", "img/b_spa.jpg", "massage"], food: ["餐廳", "food", "img/f2.jpg", "food"] },
  bookingTabs: [ ["all","全部"], ["transport","機票交通"], ["stay","住宿"], ["activity","活動"], ["spa","SPA"], ["food","餐廳"] ],

  // 出發準備（「預訂與確認」會自動從預訂票券產生）
  checklist: [
    { tab: "before", group: "證件與入境", art: "img/rt/plane.webp", items: [
      ["passport","護照有效期檢查",false], ["tdac","11/18 起填寫 TDAC",false], ["orders","下載機票與訂房確認",false], ["insure","確認旅遊保險",false] ]},
    { tab: "before", group: "預訂確認", art: "img/rt/suitcase.webp", fromBookings: true },
    { tab: "before", group: "隨身與用品", art: "img/rt/market.webp", items: [
      ["p_cash","泰銖現金＋信用卡",false], ["p_phone","充電器＋行動電源",false], ["p_sim","eSIM／漫遊",false], ["p_med","常備藥品",false], ["p_bug","防蚊液",false], ["p_bag","防水袋（漂流用）",false] ]},
    { tab: "before", group: "其他提醒", art: "img/rt/coffee.webp", items: [
      ["o_grab","下載 Grab 並綁定付款",false], ["o_offline","下載 Google Maps 清邁離線地圖",false], ["o_alarm","11/25 設 04:30 鬧鐘",false] ]}
  ],
  checkTabs: [ ["before","出發前"], ["pack","行李打包"], ["other","其他提醒"] ],

  // 服裝穿搭：每日造型（palette = 穿搭配色）
  outfits: [
    { d: 1, title: "抵達日", en: "Arrival Day Look", look: "舒適短袖＋薄外套", icon: "plane", img: "img/look1.jpg",
      palette: ["#f6efe2","#e8cfa8","#c99a64","#d9b98c","#a7b48a"], photo: "飯店入住隨手拍，碎花洋裝很上鏡", tip: "機上冷氣強，薄外套隨身；好穿脫的鞋過安檢比較快", acc: "草編包、薄外套、頸枕", mood: "Cozy / Easy" },
    { d: 2, title: "ATV＋瀑布", en: "Adventure Day Look", look: "運動套裝＋止滑鞋", icon: "mountain", img: "img/look2.jpg",
      palette: ["#7d8f55","#f4f1ea","#5a5a55","#cfc6b4","#9fb27a"], photo: "瀑布前穿亮色上衣最好拍", tip: "漂流會全濕：穿快乾衣、防滑鞋，帶替換衣物和塑膠袋", acc: "棒球帽、防水袋、毛巾", mood: "Sporty / Fresh" },
    { d: 3, title: "清萊三廟", en: "Temple Day Look", look: "有袖上衣＋長裙", icon: "temple", img: "img/look3.jpg",
      palette: ["#f8ede0","#efc2b9","#e59a93","#e8d3b0","#d2ad5c"], photo: "白廟前穿淺粉、奶油白最搭", tip: "寺廟要遮肩、不露膝；坐車時間長，穿好走的鞋", acc: "草編包、珍珠耳環、披肩", mood: "Sweet / Graceful" },
    { d: 4, title: "尼曼區＋SPA", en: "Nimman & Spa Look", look: "洋裝＋好走涼鞋", icon: "spa", img: "img/look4.jpg",
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

  budgetPlan: { title: "日常旅費參考・每人", note: "不含機票、住宿、購物及已付款活動", range: "฿7,100 – 10,000", items: [
    ["car","清萊包車（分攤）","฿2,300"], ["food","餐飲／咖啡／夜市","฿2,000 – 3,000"], ["spa","平價按摩（2–3 次）","฿700 – 1,200"],
    ["spa","高級 SPA（1 次）","฿1,500 – 2,500"], ["car","交通（Grab 等）","฿600 – 1,000"] ]},
  budgetCats: [ ["food","餐飲"], ["car","交通"], ["spa","按摩"], ["shop","購物"], ["ticket","門票活動"], ["bed","住宿"], ["tag","其他"] ],

  // 拍照清單：哪些類型的行程要列進去
  photoTypes: ["spot", "activity", "shop", "food", "cafe", "stay"],
  albumCover: ["img/d3.jpg", "img/d5.jpg", "img/a4.jpg"]
};
