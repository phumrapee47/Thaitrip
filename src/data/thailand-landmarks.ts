// T35 / US-8: static landmark seed dataset.
//
// PM decision (docs/tasks.md ประเด็น 5): pilot coverage only for 8 provinces
// (functionally-complete now, curating all 76 is a separate content workstream
// tracked by T59). Every other provinceId simply has zero entries here —
// ProvinceDetailScreen must render the "not curated yet" empty state (T45) for
// those, never an error.
//
// provinceId values below match the `id` field used in src/data/thailand-provinces.ts
// exactly (verified against that dataset).
//
// T62/US-16 AC4/US-17 AC4 (PM decision ประเด็น 14): `lat`/`lng` are OPTIONAL —
// permanently, not just during a migration window (see US-18 AC2, which
// requires the app to keep working for landmarks with no coordinates
// forever, e.g. ones a content team member adds by hand later without a
// coordinate). Every read site (LandmarkList/LandmarkListItem/LandmarkMap/
// AddEntry landmark field) must keep working when lat/lng are absent.
//
// T63/US-17 AC5: lat/lng below for these 8 pilot provinces were backfilled by
// looking up each landmark individually against OSM Nominatim (one query per
// landmark, ~1 req/sec, see docs/dev-notes.md "T63" for the exact method and
// the couple of entries that needed a follow-up English-language query to
// avoid a wrong match). `id` values are 100% unchanged from T35 — CheckinContext
// (T36) keys check-in state directly off these strings, so changing/regenerating
// any of them would silently wipe a user's existing check-in progress for these
// provinces (PM decision ประเด็น 12).

export interface Landmark {
  id: string;
  provinceId: string;
  nameTh: string;
  /** Optional (see note above) — WGS84 decimal degrees. */
  lat?: number;
  lng?: number;
  imageUrl?: string;
  description?: string;
  category?: string;
}

export const LANDMARKS: Landmark[] = [
  // กรุงเทพมหานคร (bangkok-metropolis)
  { id: 'bkk-grand-palace', provinceId: 'bangkok-metropolis', nameTh: 'พระบรมมหาราชวัง', lat: 13.7493514, lng: 100.4918643 },
  { id: 'bkk-wat-arun', provinceId: 'bangkok-metropolis', nameTh: 'วัดอรุณราชวราราม', lat: 13.7438976, lng: 100.4885137 },
  { id: 'bkk-wat-pho', provinceId: 'bangkok-metropolis', nameTh: 'วัดโพธิ์', lat: 13.7463456, lng: 100.4927381 },
  { id: 'bkk-chatuchak', provinceId: 'bangkok-metropolis', nameTh: 'ตลาดนัดจตุจักร', lat: 13.8002651, lng: 100.5511228 },
  { id: 'bkk-jim-thompson', provinceId: 'bangkok-metropolis', nameTh: 'บ้านจิม ทอมป์สัน', lat: 13.7492268, lng: 100.5282811 },

  // เชียงใหม่ (chiang-mai)
  { id: 'cnx-doi-suthep', provinceId: 'chiang-mai', nameTh: 'วัดพระธาตุดอยสุเทพ', lat: 18.8050094, lng: 98.9221843 },
  { id: 'cnx-old-city', provinceId: 'chiang-mai', nameTh: 'เมืองเก่าเชียงใหม่', lat: 18.7811828, lng: 98.9951115 },
  { id: 'cnx-night-bazaar', provinceId: 'chiang-mai', nameTh: 'ไนท์บาซาร์เชียงใหม่', lat: 18.784441, lng: 99.0003797 },
  { id: 'cnx-doi-inthanon', provinceId: 'chiang-mai', nameTh: 'ดอยอินทนนท์', lat: 18.5884834, lng: 98.4874637 },

  // เชียงราย (chiang-rai)
  { id: 'cri-white-temple', provinceId: 'chiang-rai', nameTh: 'วัดร่องขุ่น', lat: 19.8238794, lng: 99.7628959 },
  { id: 'cri-blue-temple', provinceId: 'chiang-rai', nameTh: 'วัดร่องเสือเต้น', lat: 19.923357, lng: 99.8417552 },
  { id: 'cri-golden-triangle', provinceId: 'chiang-rai', nameTh: 'สามเหลี่ยมทองคำ', lat: 20.3448423, lng: 100.0837779 },

  // พระนครศรีอยุธยา (phra-nakhon-si-ayutthaya)
  { id: 'ayu-wat-mahathat', provinceId: 'phra-nakhon-si-ayutthaya', nameTh: 'วัดมหาธาตุ (อยุธยา)', lat: 14.3569972, lng: 100.5675163 },
  { id: 'ayu-wat-yai-chai-mongkol', provinceId: 'phra-nakhon-si-ayutthaya', nameTh: 'วัดใหญ่ชัยมงคล', lat: 14.3442694, lng: 100.593986 },
  { id: 'ayu-bang-pa-in', provinceId: 'phra-nakhon-si-ayutthaya', nameTh: 'พระราชวังบางปะอิน', lat: 14.2326452, lng: 100.5794291 },

  // สุโขทัย (sukhothai)
  { id: 'skt-historical-park', provinceId: 'sukhothai', nameTh: 'อุทยานประวัติศาสตร์สุโขทัย', lat: 17.0218403, lng: 99.7031151 },
  { id: 'skt-wat-si-chum', provinceId: 'sukhothai', nameTh: 'วัดศรีชุม', lat: 17.0268558, lng: 99.6932067 },
  { id: 'skt-ramkhamhaeng-museum', provinceId: 'sukhothai', nameTh: 'พิพิธภัณฑสถานแห่งชาติรามคำแหง', lat: 17.0171457, lng: 99.7076701 },

  // ชลบุรี (chon-buri)
  { id: 'cbi-pattaya-beach', provinceId: 'chon-buri', nameTh: 'หาดพัทยา', lat: 12.936583, lng: 100.8859605 },
  { id: 'cbi-koh-larn', provinceId: 'chon-buri', nameTh: 'เกาะล้าน', lat: 12.9186829, lng: 100.7837427 },
  { id: 'cbi-sanctuary-of-truth', provinceId: 'chon-buri', nameTh: 'ปราสาทสัจธรรม', lat: 12.972777, lng: 100.8891503 },
  { id: 'cbi-nong-nooch', provinceId: 'chon-buri', nameTh: 'สวนนงนุชพัทยา', lat: 12.7681956, lng: 100.9299485 },

  // กระบี่ (krabi)
  { id: 'kbi-railay-beach', provinceId: 'krabi', nameTh: 'หาดไร่เลย์', lat: 8.0114166, lng: 98.8379541 },
  // "ทัวร์ 4 เกาะกระบี่" is a multi-island boat tour, not a single point — anchored
  // to Koh Poda (เกาะปอดะ), the tour's best-known/most central stop (T63 note).
  { id: 'kbi-four-islands', provinceId: 'krabi', nameTh: 'ทัวร์ 4 เกาะกระบี่', lat: 8.0628503, lng: 98.7466019 },
  { id: 'kbi-emerald-pool', provinceId: 'krabi', nameTh: 'สระมรกต', lat: 7.9250975, lng: 99.2681871 },

  // ภูเก็ต (phuket)
  { id: 'hkt-patong-beach', provinceId: 'phuket', nameTh: 'หาดป่าตอง', lat: 7.896632, lng: 98.2954295 },
  { id: 'hkt-big-buddha', provinceId: 'phuket', nameTh: 'พระใหญ่ภูเก็ต', lat: 7.8275211, lng: 98.3124447 },
  { id: 'hkt-old-town', provinceId: 'phuket', nameTh: 'ย่านเมืองเก่าภูเก็ต', lat: 7.8847774, lng: 98.3892206 },
  { id: 'hkt-phi-phi', provinceId: 'phuket', nameTh: 'เกาะพีพี', lat: 7.7522403, lng: 98.7766434 },
  // อำนาจเจริญ (amnat-charoen) — T60/T61 Overpass extraction
  { id: "amnat-charoen-osm-n4362844844", provinceId: "amnat-charoen", nameTh: "วัดถ้ำแสงเพชร", lat: 15.8883384, lng: 104.7327306 },
  { id: "amnat-charoen-osm-n4699869866", provinceId: "amnat-charoen", nameTh: "วัดโนนศิลา", lat: 16.1009993, lng: 105.0425597 },
  { id: "amnat-charoen-osm-n4712286788", provinceId: "amnat-charoen", nameTh: "วัดศิริมงคล", lat: 16.1622829, lng: 105.0098746 },
  { id: "amnat-charoen-osm-n4712287090", provinceId: "amnat-charoen", nameTh: "วัดศรีสมบูรณ์", lat: 16.2344022, lng: 104.9999259 },
  { id: "amnat-charoen-osm-n4722766902", provinceId: "amnat-charoen", nameTh: "วัดพระมงคลมิ่งเมือง", lat: 15.891584, lng: 104.6228136 },

  // อ่างทอง (ang-thong) — T60/T61 Overpass extraction
  { id: "ang-thong-osm-n1095259304", provinceId: "ang-thong", nameTh: "วัดพิจาณโสภณ", lat: 14.4537399, lng: 100.4573449 },
  { id: "ang-thong-osm-n1095259487", provinceId: "ang-thong", nameTh: "วัดสว่างอารมณ์", lat: 14.4786856, lng: 100.4516527 },
  { id: "ang-thong-osm-n1665160302", provinceId: "ang-thong", nameTh: "วัดเขียน", lat: 14.6069187, lng: 100.3507278 },
  { id: "ang-thong-osm-n3636087966", provinceId: "ang-thong", nameTh: "วัดป่าโมกวรวิหาร", lat: 14.482195, lng: 100.448376 },
  { id: "ang-thong-osm-n5046424721", provinceId: "ang-thong", nameTh: "วัดมหานาม", lat: 14.712061, lng: 100.4467985 },

  // บุรีรัมย์ (buri-ram) — T60/T61 Overpass extraction
  { id: "buri-ram-osm-n2067868492", provinceId: "buri-ram", nameTh: "ปากปล่องภูเขาไฟ เขากระโดง", lat: 14.9386581, lng: 103.0938678 },
  { id: "buri-ram-osm-n1831806735", provinceId: "buri-ram", nameTh: "พระบรมราชานุสาวรีย์พระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช", lat: 14.9866994, lng: 103.1046357 },
  { id: "buri-ram-osm-n1657141720", provinceId: "buri-ram", nameTh: "วัดบ้านแสลงโทน", lat: 14.7794026, lng: 103.0554674 },
  { id: "buri-ram-osm-n1721835092", provinceId: "buri-ram", nameTh: "วัดโนนสำราญ", lat: 14.843771, lng: 102.5947824 },
  { id: "buri-ram-osm-n2555315222", provinceId: "buri-ram", nameTh: "วัดป่าช้าดอนอะราง", lat: 14.6103905, lng: 102.4966613 },

  // ชัยนาท (chai-nat) — T60/T61 Overpass extraction
  { id: "chai-nat-osm-n3121625131", provinceId: "chai-nat", nameTh: "เขื่อนเจ้าพระยา", lat: 15.1592172, lng: 100.1793973 },
  { id: "chai-nat-osm-n7024970785", provinceId: "chai-nat", nameTh: "วัดพระยาแพรก", lat: 15.0512243, lng: 100.1611449 },
  { id: "chai-nat-osm-n1076455738", provinceId: "chai-nat", nameTh: "วัดหนองแขม", lat: 14.9448611, lng: 100.1589056 },
  { id: "chai-nat-osm-n1076967296", provinceId: "chai-nat", nameTh: "วัดโบสถ์", lat: 14.9745516, lng: 100.2489596 },
  { id: "chai-nat-osm-n1852263045", provinceId: "chai-nat", nameTh: "วัดพิชัยนาวาส", lat: 14.9668489, lng: 99.9883976 },

  // จันทบุรี (chanthaburi) — T60/T61 Overpass extraction
  { id: "chanthaburi-osm-n1674589528", provinceId: "chanthaburi", nameTh: "วัดเขาพลอยแหวน", lat: 12.6092367, lng: 102.0402782 },
  { id: "chanthaburi-osm-n2231865009", provinceId: "chanthaburi", nameTh: "น้ำตกพลิ้ว​", lat: 12.5296913, lng: 102.1840597 },
  { id: "chanthaburi-osm-n3077759893", provinceId: "chanthaburi", nameTh: "พระบาทพลวง", lat: 12.8367694, lng: 102.1685731 },
  { id: "chanthaburi-osm-n5059885351", provinceId: "chanthaburi", nameTh: "ป่าชายเลน", lat: 12.5718587, lng: 101.8992444 },
  { id: "chanthaburi-osm-n5105566821", provinceId: "chanthaburi", nameTh: "บางสระเก้า", lat: 12.511846, lng: 102.1095216 },

  // ชุมพร (chumphon) — T60/T61 Overpass extraction
  { id: "chumphon-osm-n4425921492", provinceId: "chumphon", nameTh: "สวนตำหนักกรมหลวงชุมพร", lat: 10.398844, lng: 99.278906 },
  { id: "chumphon-osm-n5515802623", provinceId: "chumphon", nameTh: "โรงเรียนสอนลิง", lat: 10.4639999, lng: 99.185431 },
  { id: "chumphon-osm-n5515802625", provinceId: "chumphon", nameTh: "มะลิสปา", lat: 10.4556472, lng: 99.1867174 },
  { id: "chumphon-osm-n4401396895", provinceId: "chumphon", nameTh: "สำนักสงฆ์บางไม้แก้ว", lat: 10.770034, lng: 98.9785817 },
  { id: "chumphon-osm-n4413204693", provinceId: "chumphon", nameTh: "พระตำหนักกรมหลวงชุมพรเขตอุดมศักดิ์", lat: 10.3996311, lng: 99.2797221 },

  // กาฬสินธุ์ (kalasin) — T60/T61 Overpass extraction
  { id: "kalasin-osm-n496885060", provinceId: "kalasin", nameTh: "สวนไดโนเสาร์", lat: 16.6631064, lng: 103.5173792 },
  { id: "kalasin-osm-n1613083111", provinceId: "kalasin", nameTh: "วัดบ้านแสนสุข", lat: 16.8332104, lng: 103.1173672 },
  { id: "kalasin-osm-n1805016945", provinceId: "kalasin", nameTh: "วัดโพธิ์ชัย", lat: 16.4008158, lng: 103.4359647 },
  { id: "kalasin-osm-n1805017557", provinceId: "kalasin", nameTh: "วัดบึงบ้านเสียว", lat: 16.3381028, lng: 103.431022 },
  { id: "kalasin-osm-n1805017564", provinceId: "kalasin", nameTh: "วัดป่าสันติสุข", lat: 16.3913184, lng: 103.4281152 },

  // กำแพงเพชร (kamphaeng-phet) — T60/T61 Overpass extraction
  { id: "kamphaeng-phet-osm-n301611986", provinceId: "kamphaeng-phet", nameTh: "คลองสวนหมาก - แก่งเกาะร้อย", lat: 16.32907, lng: 99.2572646 },
  { id: "kamphaeng-phet-osm-n739818593", provinceId: "kamphaeng-phet", nameTh: "วัดพระสี่อิริยาบถ", lat: 16.5012414, lng: 99.5145682 },
  { id: "kamphaeng-phet-osm-n739820312", provinceId: "kamphaeng-phet", nameTh: "วัดช้างรอบ", lat: 16.5029074, lng: 99.5097637 },
  { id: "kamphaeng-phet-osm-n2575458797", provinceId: "kamphaeng-phet", nameTh: "อุทยานแห่งชาติคลองวังเจ้า", lat: 16.5059889, lng: 99.1702616 },
  { id: "kamphaeng-phet-osm-n4133342790", provinceId: "kamphaeng-phet", nameTh: "วัดอาวาสใหญ่", lat: 16.5081477, lng: 99.5184297 },

  // กาญจนบุรี (kanchanaburi) — T60/T61 Overpass extraction
  { id: "kanchanaburi-osm-n960997916", provinceId: "kanchanaburi", nameTh: "ด่านเจดีย์สามองค์", lat: 15.3015327, lng: 98.3865408 },
  { id: "kanchanaburi-osm-n1036607935", provinceId: "kanchanaburi", nameTh: "ชั้นที่๔ \"อกผีเสื้อ\"", lat: 14.3663293, lng: 99.1429645 },
  { id: "kanchanaburi-osm-n1036607954", provinceId: "kanchanaburi", nameTh: "ชั้นที่๑ \"ไหลคืนรัง\"", lat: 14.3691793, lng: 99.145594 },
  { id: "kanchanaburi-osm-n1036607970", provinceId: "kanchanaburi", nameTh: "ชั้นที่๓ \"ผาน้ำตก\"", lat: 14.3673837, lng: 99.1432343 },
  { id: "kanchanaburi-osm-n1036607978", provinceId: "kanchanaburi", nameTh: "ชั้นที่๕ \"เบื่อไม่ลจ\"", lat: 14.3618609, lng: 99.1424111 },

  // ขอนแก่น (khon-kaen) — T60/T61 Overpass extraction
  { id: "khon-kaen-osm-n1216021974", provinceId: "khon-kaen", nameTh: "อนุสาวรีย์ จอมพลสฤษดิ์ ธนรัชต์", lat: 16.4390506, lng: 102.8355201 },
  { id: "khon-kaen-osm-n1223114500", provinceId: "khon-kaen", nameTh: "พระราชานุสาวรีย์ พระจอมเกล้าฯ", lat: 16.4741208, lng: 102.8225895 },
  { id: "khon-kaen-osm-n1226778776", provinceId: "khon-kaen", nameTh: "อนุสาวรีย์ประชาธิปไตย", lat: 16.4311323, lng: 102.829227 },
  { id: "khon-kaen-osm-n373828466", provinceId: "khon-kaen", nameTh: "วัดป่าบ้านกอก", lat: 16.4134071, lng: 102.8039714 },
  { id: "khon-kaen-osm-n375683472", provinceId: "khon-kaen", nameTh: "คริสตจักร ของ พระคริสต์", lat: 16.4388201, lng: 102.804835 },

  // ลำปาง (lampang) — T60/T61 Overpass extraction
  { id: "lampang-osm-n261548252", provinceId: "lampang", nameTh: "น้ำตกแจ้ซ้อน", lat: 18.8421726, lng: 99.4676818 },
  { id: "lampang-osm-n2423031483", provinceId: "lampang", nameTh: "วังเหนือสวิทตี้", lat: 19.1455339, lng: 99.6059165 },
  { id: "lampang-osm-n1629253491", provinceId: "lampang", nameTh: "อนุสาวรีย์เจ้าพ่อพญาคำลือ", lat: 18.7063396, lng: 99.5545957 },
  { id: "lampang-osm-n1921487077", provinceId: "lampang", nameTh: "ห้าแยกหอนาฬิกา", lat: 18.2888761, lng: 99.4909043 },
  { id: "lampang-osm-n1397568188", provinceId: "lampang", nameTh: "วัดพระเจดีย์ซาวหลังพระอารามหลวง", lat: 18.3221609, lng: 99.5149326 },

  // ลำพูน (lamphun) — T60/T61 Overpass extraction
  { id: "lamphun-osm-n2043472190", provinceId: "lamphun", nameTh: "อุทยานแห่งชาติดอยขุนตาล", lat: 18.4961162, lng: 99.2697398 },
  { id: "lamphun-osm-n805124885", provinceId: "lamphun", nameTh: "พระธาตุสูบา", lat: 18.4484566, lng: 98.9227122 },
  { id: "lamphun-osm-n805139030", provinceId: "lamphun", nameTh: "วัดพระพุทธบาทตากผ้า", lat: 18.4549772, lng: 98.922084 },
  { id: "lamphun-osm-n1346819802", provinceId: "lamphun", nameTh: "วัดทาดอนแก้ว", lat: 18.4627749, lng: 99.1613749 },
  { id: "lamphun-osm-n1540463031", provinceId: "lamphun", nameTh: "วัดพระธาตุดอยเวียง", lat: 18.6116903, lng: 99.1716785 },

  // เลย (loei) — T60/T61 Overpass extraction
  { id: "loei-osm-n1641043397", provinceId: "loei", nameTh: "แก่งคุดคู้", lat: 17.9066703, lng: 101.701902 },
  { id: "loei-osm-n1953030549", provinceId: "loei", nameTh: "น้ำตกเพียงดิน", lat: 17.0656667, lng: 101.7482229 },
  { id: "loei-osm-n2541624852", provinceId: "loei", nameTh: "น้ำตกหมันแดง", lat: 16.936447, lng: 101.0531771 },
  { id: "loei-osm-n2674155506", provinceId: "loei", nameTh: "น้ำตกปลาบ่า", lat: 17.3919583, lng: 101.3711988 },
  { id: "loei-osm-n1208557982", provinceId: "loei", nameTh: "พระใหญ่ภูคกงิ้ว", lat: 17.8193769, lng: 101.5544455 },

  // ลพบุรี (lop-buri) — T60/T61 Overpass extraction
  { id: "lop-buri-osm-n1641043435", provinceId: "lop-buri", nameTh: "เขื่อนป่าสักชลสิทธิ์", lat: 14.8612102, lng: 101.0661504 },
  { id: "lop-buri-osm-n1717859273", provinceId: "lop-buri", nameTh: "วัดถ้ำศรีสวัสดิ้", lat: 14.9719324, lng: 101.2582415 },
  { id: "lop-buri-osm-n1837478927", provinceId: "lop-buri", nameTh: "วัดหนองทรายขาว", lat: 14.9937773, lng: 100.5770592 },
  { id: "lop-buri-osm-n1840877382", provinceId: "lop-buri", nameTh: "วัดกัทลีพนาราม", lat: 15.050929, lng: 100.5664971 },

  // แม่ฮ่องสอน (mae-hong-son) — T60/T61 Overpass extraction
  { id: "mae-hong-son-osm-n262424626", provinceId: "mae-hong-son", nameTh: "สะพานประวัติศาสตร์ท่าปาย", lat: 19.2978785, lng: 98.4648191 },
  { id: "mae-hong-son-osm-n518653698", provinceId: "mae-hong-son", nameTh: "โป่งน้ำร้อนท่าปาย", lat: 19.3074112, lng: 98.4759825 },
  { id: "mae-hong-son-osm-n1651358688", provinceId: "mae-hong-son", nameTh: "น้ำตกผาบ่อง - มีน้ำตอนฤดูฝนเท่านั้น", lat: 19.1928263, lng: 97.9973564 },
  { id: "mae-hong-son-osm-n2122151179", provinceId: "mae-hong-son", nameTh: "น้ำตกแพมบก", lat: 19.3208456, lng: 98.4039468 },
  { id: "mae-hong-son-osm-n4032512268", provinceId: "mae-hong-son", nameTh: "วนอุทยานน้ำตกไม้ซางหนาม", lat: 19.0650902, lng: 97.9978344 },

  // มหาสารคาม (maha-sarakham) — T60/T61 Overpass extraction
  { id: "maha-sarakham-osm-n1203928437", provinceId: "maha-sarakham", nameTh: "วัดป่ากู่ทองธรรมวิเวก", lat: 16.4500621, lng: 102.9653016 },
  { id: "maha-sarakham-osm-n1241849049", provinceId: "maha-sarakham", nameTh: "พระธาตุนาดูน", lat: 15.6994075, lng: 103.2238378 },
  { id: "maha-sarakham-osm-n1802405377", provinceId: "maha-sarakham", nameTh: "วัดป่าหนองซอน", lat: 16.3488425, lng: 103.1153324 },
  { id: "maha-sarakham-osm-n1802405856", provinceId: "maha-sarakham", nameTh: "วัดพุทธประดิษฐ์", lat: 16.3636192, lng: 103.1535219 },
  { id: "maha-sarakham-osm-n1802406240", provinceId: "maha-sarakham", nameTh: "วัดป่าเจริญธรรม", lat: 16.326703, lng: 103.1914667 },

  // มุกดาหาร (mukdahan) — T60/T61 Overpass extraction
  { id: "mukdahan-osm-n4131533857", provinceId: "mukdahan", nameTh: "น้ำตกตาดโตน", lat: 16.4946815, lng: 104.3131448 },
  { id: "mukdahan-osm-n4459941492", provinceId: "mukdahan", nameTh: "หอแก้วมุกดาหาร", lat: 16.5260504, lng: 104.7331244 },
  { id: "mukdahan-osm-n3911665579", provinceId: "mukdahan", nameTh: "วัดภูจ้อก้อ", lat: 16.3721356, lng: 104.3757929 },
  { id: "mukdahan-osm-n3911665580", provinceId: "mukdahan", nameTh: "เขมปัตตเจดีย์", lat: 16.3718672, lng: 104.3763596 },
  { id: "mukdahan-osm-n4708961166", provinceId: "mukdahan", nameTh: "วัดโพธิ์ศรี", lat: 16.4746112, lng: 104.7970774 },

  // นครนายก (nakhon-nayok) — T60/T61 Overpass extraction
  { id: "nakhon-nayok-osm-n2678596386", provinceId: "nakhon-nayok", nameTh: "น้ำตกเหวนรก", lat: 14.2896768, lng: 101.3881569 },
  { id: "nakhon-nayok-osm-n593205567", provinceId: "nakhon-nayok", nameTh: "โบสถ์นักบุญโยเซฟ", lat: 14.2652978, lng: 101.1267755 },
  { id: "nakhon-nayok-osm-n1668363437", provinceId: "nakhon-nayok", nameTh: "วัดสว่างอารมณ์", lat: 14.0841113, lng: 100.9764515 },
  { id: "nakhon-nayok-osm-n4607914755", provinceId: "nakhon-nayok", nameTh: "มัสยิดอีมาดุดดีน", lat: 14.1339204, lng: 101.0781699 },
  { id: "nakhon-nayok-osm-n5402775221", provinceId: "nakhon-nayok", nameTh: "วัดมณีวงศ์", lat: 14.1545549, lng: 101.1866539 },

  // นครปฐม (nakhon-pathom) — T60/T61 Overpass extraction
  { id: "nakhon-pathom-osm-n2661388654", provinceId: "nakhon-pathom", nameTh: "พระราชวังสนามจันทร์", lat: 13.8194742, lng: 100.0449305 },
  { id: "nakhon-pathom-osm-n5017437622", provinceId: "nakhon-pathom", nameTh: "วัดเวฬุ", lat: 13.9633, lng: 100.2337719 },
  { id: "nakhon-pathom-osm-n5323185123", provinceId: "nakhon-pathom", nameTh: "ตลาดน้ำทุ่งบัวแดง", lat: 14.013489, lng: 100.1574853 },
  { id: "nakhon-pathom-osm-n5323201421", provinceId: "nakhon-pathom", nameTh: "ตลาดบางหลวง รศ.121", lat: 14.1195401, lng: 100.1204187 },
  { id: "nakhon-pathom-osm-n6315289024", provinceId: "nakhon-pathom", nameTh: "เรือนไทย", lat: 13.7903421, lng: 100.3244618 },

  // นครพนม (nakhon-phanom) — T60/T61 Overpass extraction
  { id: "nakhon-phanom-osm-n4694615089", provinceId: "nakhon-phanom", nameTh: "ธาตุพระนม", lat: 16.9426529, lng: 104.7236069 },
  { id: "nakhon-phanom-osm-n4707003313", provinceId: "nakhon-phanom", nameTh: "วัดศรีมงคล", lat: 17.1241718, lng: 104.749579 },

  // นครราชสีมา (nakhon-ratchasima) — T60/T61 Overpass extraction
  { id: "nakhon-ratchasima-osm-n966242380", provinceId: "nakhon-ratchasima", nameTh: "น้ำตกเจ็ดสาวน้อย ชั้นที่ 1", lat: 14.7246834, lng: 101.1909135 },
  { id: "nakhon-ratchasima-osm-n1195421011", provinceId: "nakhon-ratchasima", nameTh: "น้ำตกเหวสุวัต", lat: 14.435536, lng: 101.4141364 },
  { id: "nakhon-ratchasima-osm-n1195449739", provinceId: "nakhon-ratchasima", nameTh: "วัดศิมาลัยทรงธรรม", lat: 14.5739475, lng: 101.4119427 },
  { id: "nakhon-ratchasima-osm-n2525136452", provinceId: "nakhon-ratchasima", nameTh: "น้ำผุดธรรมชาติ", lat: 14.5476116, lng: 101.4196499 },
  { id: "nakhon-ratchasima-osm-n358904953", provinceId: "nakhon-ratchasima", nameTh: "วัดหลวงพ่อโต", lat: 14.8720139, lng: 101.7326837 },

  // นครสวรรค์ (nakhon-sawan) — T60/T61 Overpass extraction
  { id: "nakhon-sawan-osm-n4796050727", provinceId: "nakhon-sawan", nameTh: "สวนหินธรรมชาติทุ่งหินเทิน", lat: 15.668983, lng: 99.5480205 },
  { id: "nakhon-sawan-osm-n5142077222", provinceId: "nakhon-sawan", nameTh: "มนดบ หลวงพ่อเดิม", lat: 15.5737192, lng: 100.2626214 },
  { id: "nakhon-sawan-osm-n1597595390", provinceId: "nakhon-sawan", nameTh: "วัดสว่างวงษ์", lat: 15.2617535, lng: 100.3466045 },
  { id: "nakhon-sawan-osm-n2147672452", provinceId: "nakhon-sawan", nameTh: "วัดคีรีวงศ์", lat: 15.7187198, lng: 100.1247182 },
  { id: "nakhon-sawan-osm-n2573304788", provinceId: "nakhon-sawan", nameTh: "วัดนากลาง", lat: 15.6390799, lng: 99.9931902 },

  // นครศรีธรรมราช (nakhon-si-thammarat) — T60/T61 Overpass extraction
  { id: "nakhon-si-thammarat-osm-n1586071721", provinceId: "nakhon-si-thammarat", nameTh: "ถ้ำ แก้ว สุรกานต์", lat: 8.3613623, lng: 99.7850332 },
  { id: "nakhon-si-thammarat-osm-n1586071745", provinceId: "nakhon-si-thammarat", nameTh: "วัดพระมหาธาตุ วรมหาวิหาร", lat: 8.4110907, lng: 99.9664341 },
  { id: "nakhon-si-thammarat-osm-n1586071760", provinceId: "nakhon-si-thammarat", nameTh: "ศาลหลักเมือง", lat: 8.4303819, lng: 99.962178 },
  { id: "nakhon-si-thammarat-osm-n1586071764", provinceId: "nakhon-si-thammarat", nameTh: "สวนสาธารณะศรีธรรมาโศกราช", lat: 8.427288, lng: 99.9626375 },
  { id: "nakhon-si-thammarat-osm-n1586071772", provinceId: "nakhon-si-thammarat", nameTh: "หอพระนารายณ์", lat: 8.424336, lng: 99.9643086 },

  // นราธิวาส (narathiwat) — T60/T61 Overpass extraction
  { id: "narathiwat-osm-n2412743954", provinceId: "narathiwat", nameTh: "มัสยิดยุมอียะห์", lat: 6.3958538, lng: 101.5178618 },
  { id: "narathiwat-osm-n2412743955", provinceId: "narathiwat", nameTh: "มัสยิดปากีสถาน", lat: 6.3945757, lng: 101.5158336 },
  { id: "narathiwat-osm-n2412873390", provinceId: "narathiwat", nameTh: "มัสยิด​อัล–อิฮซาน", lat: 6.4421173, lng: 101.824851 },
  { id: "narathiwat-osm-n2418080332", provinceId: "narathiwat", nameTh: "วัดเขากง", lat: 6.371086, lng: 101.7887022 },
  { id: "narathiwat-osm-n2412744053", provinceId: "narathiwat", nameTh: "สวนกาญจนาภิเษก", lat: 6.3898567, lng: 101.5169688 },

  // หนองบัวลำภู (nong-bua-lam-phu) — T60/T61 Overpass extraction
  { id: "nong-bua-lam-phu-osm-n408361575", provinceId: "nong-bua-lam-phu", nameTh: "วัดถำกลองเพล", lat: 17.23075, lng: 102.5312346 },
  { id: "nong-bua-lam-phu-osm-n1382672121", provinceId: "nong-bua-lam-phu", nameTh: "วัดโพธิ์ทอง", lat: 17.049543, lng: 102.276933 },
  { id: "nong-bua-lam-phu-osm-n1392202303", provinceId: "nong-bua-lam-phu", nameTh: "วัดเทพมงคลพิชัย", lat: 17.2861577, lng: 102.1633094 },
  { id: "nong-bua-lam-phu-osm-n1392202857", provinceId: "nong-bua-lam-phu", nameTh: "วัดบูรพาราม", lat: 17.2994678, lng: 102.2100843 },

  // หนองคาย (nong-khai) — T60/T61 Overpass extraction
  { id: "nong-khai-osm-n919885420", provinceId: "nong-khai", nameTh: "ศาลาแก้วกู่", lat: 17.8873677, lng: 102.7825449 },
  { id: "nong-khai-osm-n2144992651", provinceId: "nong-khai", nameTh: "วัดมีชัยทุ่ง", lat: 17.8778629, lng: 102.7282469 },
  { id: "nong-khai-osm-n2257623976", provinceId: "nong-khai", nameTh: "วัดลำดวน", lat: 17.8868843, lng: 102.7523875 },

  // นนทบุรี (nonthaburi) — T60/T61 Overpass extraction
  { id: "nonthaburi-osm-n5265310928", provinceId: "nonthaburi", nameTh: "วัดสิงห์", lat: 13.8241492, lng: 100.4191942 },
  { id: "nonthaburi-osm-n5362733473", provinceId: "nonthaburi", nameTh: "วัดแพรก", lat: 13.8146853, lng: 100.4067541 },
  { id: "nonthaburi-osm-n1687584773", provinceId: "nonthaburi", nameTh: "พระบรมราชานุสาวรีย์รัชกาลที่ 7", lat: 13.9092602, lng: 100.5371334 },
  { id: "nonthaburi-osm-n1517831428", provinceId: "nonthaburi", nameTh: "ศาลหลักเมือง จังหวัดนนทบุรี", lat: 13.8606346, lng: 100.5132223 },
  { id: "nonthaburi-osm-n1656350504", provinceId: "nonthaburi", nameTh: "วัดบางพูดนอก", lat: 13.9242834, lng: 100.5035267 },

  // ปทุมธานี (pathum-thani) — T60/T61 Overpass extraction
  { id: "pathum-thani-osm-n2118845863", provinceId: "pathum-thani", nameTh: "วัดทองสะอาด", lat: 13.9817056, lng: 100.4360906 },
  { id: "pathum-thani-osm-n3125855338", provinceId: "pathum-thani", nameTh: "ตลาดระแหง", lat: 14.0417042, lng: 100.4199467 },
  { id: "pathum-thani-osm-n4561184893", provinceId: "pathum-thani", nameTh: "วัดโบสถ์หลวงพ่อโต", lat: 14.1143025, lng: 100.540974 },
  { id: "pathum-thani-osm-n5265311024", provinceId: "pathum-thani", nameTh: "ตลาดน้ำวัดนังคัลฯ", lat: 13.9331875, lng: 100.7491417 },
  { id: "pathum-thani-osm-n5314499222", provinceId: "pathum-thani", nameTh: "วัดเทพสรธรรมาราม", lat: 13.9690071, lng: 100.5644231 },

  // พังงา (phangnga) — T60/T61 Overpass extraction
  { id: "phangnga-osm-n1575877909", provinceId: "phangnga", nameTh: "น้ำตกโตนช่องฟ้า", lat: 8.655164, lng: 98.284189 },
  { id: "phangnga-osm-n1578550414", provinceId: "phangnga", nameTh: "เชดียื เฃา ล้าง บาศ", lat: 8.4597336, lng: 98.5291399 },
  { id: "phangnga-osm-n1641043400", provinceId: "phangnga", nameTh: "เขาเขียน", lat: 8.3451848, lng: 98.5028171 },
  { id: "phangnga-osm-n1382000384", provinceId: "phangnga", nameTh: "วัดปัตติการาม", lat: 8.4427167, lng: 98.2583444 },
  { id: "phangnga-osm-n1648248288", provinceId: "phangnga", nameTh: "ศาลเจ้าท้ายเหมือง", lat: 8.392209, lng: 98.2596159 },

  // พัทลุง (phatthalung) — T60/T61 Overpass extraction
  { id: "phatthalung-osm-n1583925218", provinceId: "phatthalung", nameTh: "อุทยาน เมือง เก่า ชัยบุรี", lat: 7.6821109, lng: 100.057168 },
  { id: "phatthalung-osm-n1641043479", provinceId: "phatthalung", nameTh: "ทะเลน้อย", lat: 7.787795, lng: 100.1241541 },
  { id: "phatthalung-osm-n5500133321", provinceId: "phatthalung", nameTh: "ตลาด ป่าไฝ่สร้างสุข", lat: 7.7264607, lng: 100.0082461 },
  { id: "phatthalung-osm-n1728044692", provinceId: "phatthalung", nameTh: "วัดถ้ำสุมะโน", lat: 7.5837616, lng: 99.8695248 },
  { id: "phatthalung-osm-n4274896395", provinceId: "phatthalung", nameTh: "วัดเขาอ้อ", lat: 7.7519791, lng: 100.0672317 },

  // พะเยา (phayao) — T60/T61 Overpass extraction
  { id: "phayao-osm-n3217073003", provinceId: "phayao", nameTh: "น้ำตกภูซาง", lat: 19.6633553, lng: 100.3767822 },
  { id: "phayao-osm-n3721759804", provinceId: "phayao", nameTh: "บ่อน้ำซับอุ่น", lat: 19.6617646, lng: 100.3795152 },
  { id: "phayao-osm-n4735753293", provinceId: "phayao", nameTh: "อาคารที่ประทับภูตะวัน", lat: 19.1697556, lng: 99.8063974 },
  { id: "phayao-osm-n4735753294", provinceId: "phayao", nameTh: "พระเจดีย์อุ้มคำ", lat: 19.1765184, lng: 99.8042024 },
  { id: "phayao-osm-n4735753295", provinceId: "phayao", nameTh: "พระพุทธลีลา", lat: 19.1785215, lng: 99.8045303 },

  // เพชรบูรณ์ (phetchabun) — T60/T61 Overpass extraction
  { id: "phetchabun-osm-n1271109964", provinceId: "phetchabun", nameTh: "วัดทรายงาม", lat: 16.8692719, lng: 101.2232232 },
  { id: "phetchabun-osm-n1721494480", provinceId: "phetchabun", nameTh: "วัดดาวนิมิต", lat: 15.7820124, lng: 100.9897408 },
  { id: "phetchabun-osm-n1721510333", provinceId: "phetchabun", nameTh: "วัดบรรพตาราม (วัดใต้)", lat: 15.7739685, lng: 101.0048132 },
  { id: "phetchabun-osm-n1721530649", provinceId: "phetchabun", nameTh: "ศาลเจ้าพ่อเจ้าแม่บึงสามพัน", lat: 15.7818648, lng: 101.0056774 },
  { id: "phetchabun-osm-n1721542043", provinceId: "phetchabun", nameTh: "วัดซับสมอทอด (วัดเหนือ)", lat: 15.787285, lng: 101.0091315 },

  // เพชรบุรี (phetchaburi) — T60/T61 Overpass extraction
  { id: "phetchaburi-osm-n3680237580", provinceId: "phetchaburi", nameTh: "คาเมล รีพับบลิค", lat: 12.823703, lng: 99.9389046 },
  { id: "phetchaburi-osm-n2852218472", provinceId: "phetchaburi", nameTh: "พระพุทธไสยาสน์", lat: 13.1064099, lng: 99.9399066 },
  { id: "phetchaburi-osm-n1937617905", provinceId: "phetchaburi", nameTh: "วัดศรีษะคาม", lat: 13.2016531, lng: 99.9824536 },
  { id: "phetchaburi-osm-n1937620000", provinceId: "phetchaburi", nameTh: "วัดต้นสน", lat: 13.2119833, lng: 99.9822927 },
  { id: "phetchaburi-osm-n1937624016", provinceId: "phetchaburi", nameTh: "วัดในกลาง", lat: 13.2033557, lng: 99.9773949 },

  // พิษณุโลก (phitsanulok) — T60/T61 Overpass extraction
  { id: "phitsanulok-osm-n2131210726", provinceId: "phitsanulok", nameTh: "ผาชูธง", lat: 16.9894085, lng: 100.9932776 },
  { id: "phitsanulok-osm-n2541828495", provinceId: "phitsanulok", nameTh: "ลานหินแตก", lat: 17.007104, lng: 100.9881046 },
  { id: "phitsanulok-osm-n2541915870", provinceId: "phitsanulok", nameTh: "น้ำตกปอย", lat: 16.8445353, lng: 100.7510083 },
  { id: "phitsanulok-osm-n5108997623", provinceId: "phitsanulok", nameTh: "สวนน้ำ สแปลชฟัน พิษณุโลก", lat: 16.7689473, lng: 100.1474627 },
  { id: "phitsanulok-osm-n5243919947", provinceId: "phitsanulok", nameTh: "โรงหล่อพระบูรณะไทย(จ่าทวี)", lat: 16.8049816, lng: 100.267805 },

  // แพร่ (phrae) — T60/T61 Overpass extraction
  { id: "phrae-osm-n3962798645", provinceId: "phrae", nameTh: "ศาลเจ้าพ่อเสือ", lat: 17.893083, lng: 100.0488613 },
  { id: "phrae-osm-n4632294689", provinceId: "phrae", nameTh: "Mulberry farm", lat: 17.9314252, lng: 99.9338563 },
  { id: "phrae-osm-n4996035421", provinceId: "phrae", nameTh: "ถ้ำผานางคอย", lat: 18.36928, lng: 100.3544325 },
  { id: "phrae-osm-n6347000585", provinceId: "phrae", nameTh: "มอนเสาหินพิศวง", lat: 17.8381889, lng: 99.8009023 },
  { id: "phrae-osm-n7130172685", provinceId: "phrae", nameTh: "ต้นพุททราป่าลูกโตรสดี", lat: 17.9322943, lng: 100.0624907 },

  // ปราจีนบุรี (prachin-buri) — T60/T61 Overpass extraction
  { id: "prachin-buri-osm-n5158314453", provinceId: "prachin-buri", nameTh: "วัดทุ่งประพาส", lat: 13.8992592, lng: 101.6143262 },
  { id: "prachin-buri-osm-n5182718404", provinceId: "prachin-buri", nameTh: "วัดบรรพตรัตนารามเขาไม้แก้ว", lat: 13.8252277, lng: 101.7499988 },
  { id: "prachin-buri-osm-n5243829879", provinceId: "prachin-buri", nameTh: "วัดหลวงบดินทร์เดชา (วัดสิงหเสนี)", lat: 14.0043965, lng: 101.7610636 },
  { id: "prachin-buri-osm-n5243829913", provinceId: "prachin-buri", nameTh: "วัดกลางเมืองเก่า", lat: 14.0118482, lng: 101.7627344 },
  { id: "prachin-buri-osm-n5243829914", provinceId: "prachin-buri", nameTh: "วัดศรีษะเมือง", lat: 14.012102, lng: 101.7662441 },

  // ประจวบคีรีขันธ์ (prachuap-khiri-khan) — T60/T61 Overpass extraction
  { id: "prachuap-khiri-khan-osm-n1641043361", provinceId: "prachuap-khiri-khan", nameTh: "อุทยานพระจอมเกล้า ณ หว้ากอ", lat: 11.7164976, lng: 99.7544697 },
  { id: "prachuap-khiri-khan-osm-n1641043412", provinceId: "prachuap-khiri-khan", nameTh: "อ่าวมะนาว", lat: 11.680749, lng: 99.7254429 },
  { id: "prachuap-khiri-khan-osm-n2091887290", provinceId: "prachuap-khiri-khan", nameTh: "ตลาดน้ำหัวหินสามพันนาม", lat: 12.5015707, lng: 99.9150071 },
  { id: "prachuap-khiri-khan-osm-n2452199735", provinceId: "prachuap-khiri-khan", nameTh: "ถ้ำพระยานคร", lat: 12.197607, lng: 100.0113978 },
  { id: "prachuap-khiri-khan-osm-n2591102313", provinceId: "prachuap-khiri-khan", nameTh: "น้ำตกป่าละอู", lat: 12.5381784, lng: 99.4639597 },
];

/** All landmarks for one province (T36 uses this to derive progress/Province Master). */
export function getLandmarksForProvince(provinceId: string): Landmark[] {
  return LANDMARKS.filter((l) => l.provinceId === provinceId);
}
