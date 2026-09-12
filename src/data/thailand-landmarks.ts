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

export interface Landmark {
  id: string;
  provinceId: string;
  nameTh: string;
}

export const LANDMARKS: Landmark[] = [
  // กรุงเทพมหานคร (bangkok-metropolis)
  { id: 'bkk-grand-palace', provinceId: 'bangkok-metropolis', nameTh: 'พระบรมมหาราชวัง' },
  { id: 'bkk-wat-arun', provinceId: 'bangkok-metropolis', nameTh: 'วัดอรุณราชวราราม' },
  { id: 'bkk-wat-pho', provinceId: 'bangkok-metropolis', nameTh: 'วัดโพธิ์' },
  { id: 'bkk-chatuchak', provinceId: 'bangkok-metropolis', nameTh: 'ตลาดนัดจตุจักร' },
  { id: 'bkk-jim-thompson', provinceId: 'bangkok-metropolis', nameTh: 'บ้านจิม ทอมป์สัน' },

  // เชียงใหม่ (chiang-mai)
  { id: 'cnx-doi-suthep', provinceId: 'chiang-mai', nameTh: 'วัดพระธาตุดอยสุเทพ' },
  { id: 'cnx-old-city', provinceId: 'chiang-mai', nameTh: 'เมืองเก่าเชียงใหม่' },
  { id: 'cnx-night-bazaar', provinceId: 'chiang-mai', nameTh: 'ไนท์บาซาร์เชียงใหม่' },
  { id: 'cnx-doi-inthanon', provinceId: 'chiang-mai', nameTh: 'ดอยอินทนนท์' },

  // เชียงราย (chiang-rai)
  { id: 'cri-white-temple', provinceId: 'chiang-rai', nameTh: 'วัดร่องขุ่น' },
  { id: 'cri-blue-temple', provinceId: 'chiang-rai', nameTh: 'วัดร่องเสือเต้น' },
  { id: 'cri-golden-triangle', provinceId: 'chiang-rai', nameTh: 'สามเหลี่ยมทองคำ' },

  // พระนครศรีอยุธยา (phra-nakhon-si-ayutthaya)
  { id: 'ayu-wat-mahathat', provinceId: 'phra-nakhon-si-ayutthaya', nameTh: 'วัดมหาธาตุ (อยุธยา)' },
  { id: 'ayu-wat-yai-chai-mongkol', provinceId: 'phra-nakhon-si-ayutthaya', nameTh: 'วัดใหญ่ชัยมงคล' },
  { id: 'ayu-bang-pa-in', provinceId: 'phra-nakhon-si-ayutthaya', nameTh: 'พระราชวังบางปะอิน' },

  // สุโขทัย (sukhothai)
  { id: 'skt-historical-park', provinceId: 'sukhothai', nameTh: 'อุทยานประวัติศาสตร์สุโขทัย' },
  { id: 'skt-wat-si-chum', provinceId: 'sukhothai', nameTh: 'วัดศรีชุม' },
  { id: 'skt-ramkhamhaeng-museum', provinceId: 'sukhothai', nameTh: 'พิพิธภัณฑสถานแห่งชาติรามคำแหง' },

  // ชลบุรี (chon-buri)
  { id: 'cbi-pattaya-beach', provinceId: 'chon-buri', nameTh: 'หาดพัทยา' },
  { id: 'cbi-koh-larn', provinceId: 'chon-buri', nameTh: 'เกาะล้าน' },
  { id: 'cbi-sanctuary-of-truth', provinceId: 'chon-buri', nameTh: 'ปราสาทสัจธรรม' },
  { id: 'cbi-nong-nooch', provinceId: 'chon-buri', nameTh: 'สวนนงนุชพัทยา' },

  // กระบี่ (krabi)
  { id: 'kbi-railay-beach', provinceId: 'krabi', nameTh: 'หาดไร่เลย์' },
  { id: 'kbi-four-islands', provinceId: 'krabi', nameTh: 'ทัวร์ 4 เกาะกระบี่' },
  { id: 'kbi-emerald-pool', provinceId: 'krabi', nameTh: 'สระมรกต' },

  // ภูเก็ต (phuket)
  { id: 'hkt-patong-beach', provinceId: 'phuket', nameTh: 'หาดป่าตอง' },
  { id: 'hkt-big-buddha', provinceId: 'phuket', nameTh: 'พระใหญ่ภูเก็ต' },
  { id: 'hkt-old-town', provinceId: 'phuket', nameTh: 'ย่านเมืองเก่าภูเก็ต' },
  { id: 'hkt-phi-phi', provinceId: 'phuket', nameTh: 'เกาะพีพี' },
];

/** All landmarks for one province (T36 uses this to derive progress/Province Master). */
export function getLandmarksForProvince(provinceId: string): Landmark[] {
  return LANDMARKS.filter((l) => l.provinceId === provinceId);
}
