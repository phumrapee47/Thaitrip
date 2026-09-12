# Task List

หมายเหตุลำดับการสร้าง (build order ตามที่ผู้ใช้กำหนด): Foundation → US-7 (2D validation) → US-1 (3D map) → US-2 (nav to detail) → US-4 (add entry) → US-3 (unlock animation) → US-5 (entry list) → US-6 (stats, ปิดท้าย)

ทุก task ที่มีป้าย **[รอ design-spec]** ต้องรอ UIUX ทำ docs/design-spec.md เสร็จก่อนเริ่ม ส่วน task ที่ไม่มีป้ายนี้ (scaffold, data layer, storage layer, state logic, navigation wiring, 2D validation) เริ่มได้ทันทีขนานกับงาน UIUX

หมายเหตุลำดับการสร้าง (รอบ Landmark Check-in & Supabase Integration — US-8 ถึง US-15): Foundation (sync/auth infra, ไม่ต้องรอ design-spec) → US-11 (anonymous auth) → US-15 (migrate ข้อมูล v1 เดิม) → US-8/US-9/US-10 (landmark check-in + auto check-in) → US-12/US-13 (sync entries + photo upload) → US-14 (map visual feedback). งาน data/logic layer เริ่มขนานกับ UIUX ได้ทันที ส่วนงานที่แตะหน้าจอ (ProvinceDetailScreen, AddEntryScreen, HomeScreen, Settings/Profile) ต้องรอ docs/design-spec.md ฉบับอัปเดตจาก UIUX ตามป้าย **[รอ design-spec]**

หมายเหตุลำดับการสร้าง (รอบ OSM Data Integration — US-16 ถึง US-20): T60 (เขียนสคริปต์ extraction) → T61 (รันสคริปต์จริงกับ Overpass ถ้าทำได้ในสภาพแวดล้อมนี้ ไม่งั้น fallback) → T62/T63 (ขยาย Landmark type + backfill พิกัดให้ 8 จังหวัดนำร่องเดิม) → T64 (merge ผลลัพธ์เข้า 68 จังหวัดที่เหลือ) → T65 (regression check US-8/9/10 เดิม) ควบคู่กับ T66 (Supabase landmarks schema) และ T67 (map UI, รอ design-spec) แยกอิสระคือสาย US-19/US-20: T68 (nominatim client module) → T69 (ขยาย entries schema) → T70/T71 (search UI + wiring, รอ design-spec) → T72/T73/T74 (debounce/throttle/error handling). งาน T60, T62, T63, T68, T69 เป็น data/logic layer ล้วนๆ เริ่มขนานกับ UIUX ได้ทันทีไม่ต้องรอ design-spec

## P0 (ต้องมี)

### Foundation (ไม่ต้องรอ design-spec)
- [ ] T1: Scaffold โปรเจกต์ Expo + React Native + TypeScript (โครงสร้างโฟลเดอร์ src/screens, src/components, src/data, src/storage, src/navigation) — dependency: ไม่มี
- [ ] T2: Copy `thailand-provinces.ts` และ `thailand-provinces.json` จาก project root เข้า `src/data/` (ใช้ไฟล์ที่มีอยู่แล้ว ห้ามสร้าง/แก้ข้อมูลใหม่ ตาม Out of Scope) — dependency: T1
- [ ] T3: สร้าง storage layer ด้วย expo-sqlite: schema ตาราง journal entries (id, provinceId, date, title, notes, photoUris, tags) + CRUD functions พื้นฐาน — dependency: T1
- [ ] T4: ตั้งค่า navigation stack (Home → ProvinceDetail → AddEntry, และ Stats) — dependency: T1
- [ ] T5: เขียน derived-state utilities: isVisited (entries.length > 0), unlocked count, region aggregation helper (ใช้ฟิลด์ region ของแต่ละจังหวัด) — dependency: T2, T3

### US-7: 2D map validation step (ไม่ต้องรอ design-spec — เป็น dev-only, flat color ตาม AC)
- [ ] T6: Render แผนที่ 2 มิติแบบเรียบครบ 76 จังหวัด โดยใช้ path data ตรงจาก `thailand-provinces.ts` ไม่มีการ re-derive พิกัด (อ้างอิง US-7) — dependency: T2
- [ ] T7: แตะจังหวัดแล้ว toggle สถานะ visited ใน memory (เทา ↔ เขียว) พร้อมตรวจสอบ tap target ไม่ทับซ้อนจังหวัดข้างเคียงแม้จังหวัดเล็ก เช่น สมุทรสงคราม (อ้างอิง US-7) — dependency: T6

### US-1: แผนที่ 3 มิติภาพรวม
- [ ] T8: Build 3D map container (top face + side face ต่อ block, กรอบ rotateX 30–40 องศาตลอดเวลา ตามที่ US-3 AC3 ต้องการเช่นกัน) โดยใช้ path data ที่ validate แล้วจาก T6/T7 **[รอ design-spec]** (อ้างอิง US-1, US-3) — dependency: T7
- [ ] T9: ผูก locked/unlocked visual state (สี, ยกตัว/ไม่ยกตัว) เข้ากับ isVisited จาก T5 **[รอ design-spec]** (อ้างอิง US-1) — dependency: T8, T5
- [ ] T10: Header "ปลดล็อกแล้ว X / 76 จังหวัด" + progress bar อัปเดตแบบ real-time **[รอ design-spec]** (อ้างอิง US-1) — dependency: T5

### US-2: นำทางไปหน้ารายละเอียดจังหวัด
- [ ] T11: แตะจังหวัดบนแผนที่ 3 มิติแล้วนำทางไปหน้า ProvinceDetail ด้วย province.id ที่ถูกต้อง (อ้างอิง US-2) — dependency: T8, T4
- [ ] T32: [ใหม่ จากคำตัดสิน PM ข้อ 1] เพิ่ม long-press gesture บน Province Tile: กดค้างแสดง tooltip ชื่อจังหวัด (nameTh) ลอยขึ้นชั่วคราวเหนือ tile โดยยังไม่ navigate, ปล่อยนิ้ว/tap สั้นตามปกติจึง navigate ไปหน้า ProvinceDetail ตาม T11 **[รอ design-spec]** (อ้างอิง US-1, US-2) — dependency: T9, T11

### US-4: เพิ่มบันทึกทริปใหม่
- [ ] T12: ฟอร์ม AddEntry ครบทุกฟิลด์ (date, title, notes, photoUris, tags) พร้อม validation บังคับ title+date **[รอ design-spec]** (อ้างอิง US-4) — dependency: T4
  - หมายเหตุ tag field (จากคำตัดสิน PM ข้อ 3): fixed tag set เริ่มต้น 8 แท็ก (ทะเล/ภูเขา/วัด/คาเฟ่/น้ำตก/เมือง/ธรรมชาติ/อาหาร) แบบ multi-select chip + ผู้ใช้พิมพ์ custom tag เพิ่มเองได้ (text input → เพิ่มเป็น chip ใหม่ เลือกได้เหมือน fixed tag)
- [ ] T13: เชื่อม expo-image-picker เลือกได้หลายรูปต่อ entry (อ้างอิง US-4) — dependency: T12
- [ ] T14: บันทึก entry ลง expo-sqlite ผูกกับ provinceId ถูกต้อง และข้อมูลอยู่ครบหลังปิดเปิดแอปใหม่ (อ้างอิง US-4) — dependency: T3, T12
- [ ] T15: ถ้าเป็น entry แรกของจังหวัด เปลี่ยนสถานะเป็น unlocked ทันทีหลังบันทึก (อ้างอิง US-4) — dependency: T14, T5

### US-3: อนิเมชันปลดล็อก 3 มิติ
- [ ] T16: อนิเมชัน spring/bounce เมื่อจังหวัดเปลี่ยนจาก flat/เทา เป็น elevated/เขียว ตอนกลับสู่หน้าแผนที่หลังบันทึก entry แรก **[รอ design-spec]** (อ้างอิง US-3) — dependency: T9, T15
- [ ] T17: Track สถานะ "เพิ่งเปลี่ยน" เพื่อไม่เล่นอนิเมชันซ้ำกับจังหวัดที่ unlocked อยู่ก่อนแล้ว (อ้างอิง US-3) — dependency: T16

### US-5: รายการบันทึกของจังหวัด
- [ ] T18: หน้า ProvinceDetail แสดงชื่อจังหวัดภาษาไทย (nameTh) เป็นหัวข้อหลัก (อ้างอิง US-5) — dependency: T11
- [ ] T19: List entry เรียง reverse-chronological ตามฟิลด์ date (อ้างอิง US-5) — dependency: T14
- [ ] T20: แต่ละ entry ใน list แสดง title, date, thumbnail รูปแรก (ถ้ามี) **[รอ design-spec]** (อ้างอิง US-5) — dependency: T19
- [ ] T21: Empty state สำหรับจังหวัดที่ไม่มี entry พร้อมปุ่ม/ทางเข้าไปเพิ่ม entry แรก (ครอบคลุม AC ของ US-2 ที่ว่าจังหวัด locked ต้องไม่ dead-end ด้วย) **[รอ design-spec]** (อ้างอิง US-5, US-2) — dependency: T18, T12

### Foundation รอบ Landmark & Supabase Integration (ไม่ต้องรอ design-spec — data layer, sync logic, auth logic)
- [ ] T33: ยืนยันเวอร์ชัน dependency ที่ต้องใช้ (`@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill` — ตรวจสอบแล้วทั้ง 3 ตัวมีอยู่ใน package.json แล้ว **ไม่ต้องติดตั้งเพิ่ม**) แล้วเขียน Supabase client init module (env-based config `SUPABASE_URL`/`SUPABASE_ANON_KEY`) โดยใช้ mock/local client แทนการเชื่อมต่อ production project จริง ตามสมมติฐานในรอบนี้ (อ้างอิง US-12, US-13) — dependency: ไม่มี (ดูคำตัดสิน PM ข้อ 8)
- [ ] T34: ขยาย SQLite schema เดิม (จาก T3): เพิ่มตาราง landmark check-in (landmarkId, provinceId, visited, updatedAt) และเพิ่มคอลัมน์ sync metadata บนตาราง entries เดิม (updatedAt, syncedAt/pendingFlag, cloudId) — dependency: T3
- [ ] T35: สร้าง landmark seed dataset `src/data/thailand-landmarks.ts` ตามคำตัดสิน PM ข้อ 5 — จังหวัดนำร่อง (ข้อเสนอ: กรุงเทพมหานคร, เชียงใหม่, เชียงราย, พระนครศรีอยุธยา, สุโขทัย, ชลบุรี, กระบี่, ภูเก็ต) จังหวัดละ 3–5 landmark พร้อมชื่อ ส่วนอีก 68 จังหวัดที่เหลือใส่ array ว่าง/TBD (อ้างอิง US-8) — dependency: T2
- [ ] T36: Derived-state utilities สำหรับ landmark: จำนวนเช็คอินแล้ว/ทั้งหมดต่อจังหวัด และ boolean "Province Master" (เช็คอินครบ AND มี landmark อย่างน้อย 1 แห่ง) — dependency: T34, T35
- [ ] T37: Anonymous Auth session bootstrap — สร้าง session อัตโนมัติเมื่อเปิดแอปครั้งแรก/ไม่มี session ผูกอยู่ ผ่าน mock/local Supabase Auth client, เก็บ session ไว้ใน local storage (อ้างอิง US-11) — dependency: T33
- [ ] T38: Email-link service logic — ผูก email+password เข้ากับ anonymous session เดิม, คืน error ที่สื่อความหมายเมื่อ link ล้มเหลว (email ซ้ำ/รหัสผ่านไม่ผ่านเงื่อนไข) โดย session เดิมยังใช้งานต่อได้ (อ้างอิง US-11) — dependency: T37
- [ ] T39: Sync engine หลัก — ตรวจจับ pending queue (entries/check-ins ที่ updatedAt ใหม่กว่า syncedAt ล่าสุดหรือไม่เคย sync) และ trigger sync ขึ้น Supabase (mock client) อัตโนมัติเมื่อมีอินเทอร์เน็ต โดยไม่บล็อก UI (อ้างอิง US-12) — dependency: T34, T33
  - หมายเหตุ (คำตัดสิน PM ข้อ 9): เพิ่ม logic นับจำนวนครั้งที่ sync ล้มเหลวติดต่อกันต่อ record เพื่อ trigger sync-state ที่ 3 "retry-issue" (ดู T51) — เป็น scope เพิ่มเล็กน้อยจากที่ตั้งไว้เดิม (เดิมมีแค่ pending/synced), ยอมรับตาม design-spec
- [ ] T40: Conflict resolution แบบ last-write-wins — เทียบ `updated_at` ทั้ง record, ฝั่งแพ้ถูกเขียนทับด้วยฝั่งชนะในทั้งสองเครื่องหลัง sync รอบถัดไป (อ้างอิง US-12) — dependency: T39
  - หมายเหตุ (คำตัดสิน PM ข้อ 7): field-level merge อยู่นอกขอบเขตของรอบนี้โดยชัดเจน ใช้ whole-record last-write-wins เท่านั้น — ห้าม QA ตีความว่าเป็น missed AC
- [ ] T41: Photo upload sync logic — คิวรูปที่ยังไม่เคยอัปโหลด, อัปโหลดขึ้น Supabase Storage bucket `trip-photos` (mock client) แล้วบันทึก URL คืนเข้า entry, retry เมื่อเน็ตหลุดโดยไม่สร้างรูปซ้ำ (อ้างอิง US-13) — dependency: T39
- [ ] T42: Migration logic — เมื่อสร้าง session ครั้งแรก ตรวจหา entries เดิม (v1, ไม่มี sync metadata) แล้ว mark เป็น pending sync ทั้งหมดโดยอัตโนมัติ เข้าคิวเข้า flow ของ T39 ทันที ทำงานแบบไม่บล็อกแอป และ resume ได้ถ้าล้มเหลวบางส่วนโดยไม่ทำข้อมูลเดิมเสียหาย (อ้างอิง US-15) — dependency: T34, T37, T39

### US-8: รายการ Landmark และเช็คอิน
- [ ] T43: หน้า ProvinceDetailScreen แสดงรายการ Landmark ของจังหวัดจาก `thailand-landmarks.ts` พร้อมปุ่ม/สวิตช์ check-in ที่ persist ลง local storage ทันที **[รอ design-spec]** (อ้างอิง US-8) — dependency: T35, T36
- [ ] T44: Progress indicator "เช็คอินแล้ว X/Y แห่ง" อัปเดตทันทีเมื่อ toggle **[รอ design-spec]** (อ้างอิง US-8) — dependency: T36, T43
- [ ] T45: Empty state "ยังไม่มีข้อมูลสถานที่แนะนำ" สำหรับจังหวัดที่ยังไม่มีข้อมูล landmark **[รอ design-spec]** (อ้างอิง US-8) — dependency: T43

### US-9: ตราสัญลักษณ์ Province Master
- [ ] T46: แสดงตราสัญลักษณ์ "Province Master ⭐" บน ProvinceDetailScreen เมื่อเช็คอินครบ, คำนวณสดจากสถานะปัจจุบัน (หายทันทีถ้า toggle กลับจนไม่ครบ), ไม่แสดงถ้าจังหวัดไม่มี landmark เลย **[รอ design-spec]** (อ้างอิง US-9) — dependency: T36, T43

### US-10: เลือก Landmark ตอนเพิ่มบันทึก (auto check-in)
- [ ] T47: AddEntryScreen เพิ่ม field เลือก Landmark (optional) แสดงเฉพาะของจังหวัดที่กำลังเพิ่ม entry, ซ่อน/disabled พร้อมข้อความถ้าไม่มีข้อมูล **[รอ design-spec]** (อ้างอิง US-10) — dependency: T35, T12
- [ ] T48: เมื่อบันทึก entry ที่เลือก Landmark ไว้ อัปเดตสถานะ check-in ของ landmark นั้นเป็น visited อัตโนมัติ โดยไม่กระทบ flow เดิมของ US-4 เมื่อไม่เลือก landmark ใดๆ (อ้างอิง US-10) — dependency: T47, T34

### US-11: Anonymous Auth + ผูก Email ภายหลัง
- [ ] T49: หน้า/ปุ่ม "ผูกกับอีเมล" ในหน้าตั้งค่า/โปรไฟล์ เชื่อมกับ T38, ข้อมูลเดิม (entries/check-ins) ยังอยู่ครบหลัง link สำเร็จ **[รอ design-spec]** (อ้างอิง US-11) — dependency: T38
- [ ] T50: คำเตือนความเสี่ยงข้อมูลหาย (data-loss warning) ตาม constraint ในคำตัดสิน PM ข้อ 6 ด้านล่าง — ต้องมีทั้ง one-time prompt ตอนสร้าง anonymous session และจุดที่มองเห็นได้เสมอในหน้าตั้งค่า/โปรไฟล์ตราบใดที่ยังไม่ผูก email **[รอ design-spec]** (อ้างอิง US-11) — dependency: T37
  - หมายเหตุ (คำตัดสิน PM ข้อ 10): ยืนยันรับดีไซน์ non-dismissible banner ตามที่ UIUX เลือก (ไม่มีปุ่มปิด แสดงถาวรในหน้าตั้งค่าจนกว่าจะผูก email) — อยู่ในกรอบดุลยพินิจที่ PM ให้ไว้แล้ว ไม่ต้องมี logic re-surface/นับวันเพิ่ม

### US-12: ซิงค์ entries และ landmark check-in แบบ Offline-First
- [ ] T51: Sync status indicator (badge/ไอคอน 3 สถานะ: "รอซิงก์" / "ซิงก์แล้ว" / "retry-issue" สำหรับ sync ล้มเหลวต่อเนื่องหลายครั้ง) บน entry list/detail **[รอ design-spec]** (อ้างอิง US-12) — dependency: T39, T19, T20
  - หมายเหตุ (คำตัดสิน PM ข้อ 9): เพิ่ม state ที่ 3 "retry-issue" ตามที่ design-spec เสนอ (เกินขั้นต่ำ 2 สถานะของ AC เดิมเล็กน้อย) — ยอมรับเพราะยังเป็น in-app indicator ล้วนๆ ไม่ใช่ push notification ตาม Out of Scope และช่วยไม่ให้ผู้ใช้เข้าใจผิดว่าข้อมูลหายเงียบๆ เมื่อ sync ล้มเหลวนาน

### US-13: อัปโหลดรูปขึ้น Supabase Storage
- (ครอบคลุมด้วย T41 ใน layer ข้อมูล — ไม่มี UI เพิ่มเติมเฉพาะ นอกจาก sync status indicator ที่ T51 ครอบคลุมร่วมกันแล้ว)

### US-14: Visual Feedback "Province Master" บนแผนที่ 3 มิติ
- [ ] T52: จังหวัดที่มีสถานะ Province Master แสดงเอฟเฟกต์พิเศษ (เช่น ขอบทอง/มงกุฎ) แตกต่างจาก unlocked ปกติบน HomeScreen 3D map, อัปเดตสดโดยไม่ต้องปิดเปิดแอปใหม่เมื่อสถานะเปลี่ยนระหว่างอยู่ในแอป **[รอ design-spec]** (อ้างอิง US-14) — dependency: T36, T9
- [ ] T53: อัปเดต legend ใต้แผนที่ (จาก T23 เดิม) ให้มีคำอธิบายสถานะ Province Master เพิ่มเติม **[รอ design-spec]** (อ้างอิง US-14) — dependency: T52, T23

### US-15: Migrate ข้อมูล Local-Only เดิม (v1) ขึ้น Cloud
- (ครอบคลุมด้วย T42 ใน Foundation ด้านบน — เป็น P0 logic task ตามคำตัดสิน PM ข้อ 4/รายการ decision ด้านล่าง ไม่มี UI เฉพาะเพิ่มเติมเพราะ AC ระบุว่าต้องทำงานอัตโนมัติแบบไม่บล็อกและไม่ต้องให้ผู้ใช้กดอะไร)

### US-16: สคริปต์ดึงข้อมูล Top Landmark จาก OSM Overpass API (one-time/build-time)
- [ ] T60: เขียน Node/CLI extraction script แยกต่างหาก (เช่น `scripts/extract-overpass-landmarks.ts`) — เครื่องมือ dev/build-time เท่านั้น ห้าม import จากโค้ด runtime ของแอปและห้าม bundle เข้า production app bundle เด็ดขาด สคริปต์ query Overpass API ต่อจังหวัดจากทั้ง 76 จังหวัดใน `thailand-provinces.ts` (อ้างอิง centroid + bounding box/area ของแต่ละจังหวัดตามสมมติฐานที่ระบุ) โดย filter เฉพาะ tags: `tourism=attraction`, `historic=monument|temple`, `amenity=place_of_worship`, `leisure=park`, จัดลำดับความสำคัญของ tag แล้วคัดเลือกสูงสุด 3–5 แห่งต่อจังหวัด, ตัดรายการที่ไม่มีพิกัด lat/lng ที่ถูกต้องออก (ไม่บันทึกพิกัดว่าง/NaN), หน่วงเวลาระหว่าง request แต่ละจังหวัด + retry อย่างน้อย 1 ครั้งเมื่อ fail/timeout/rate-limit โดยความล้มเหลวของจังหวัดหนึ่งต้องไม่ทำให้ผลลัพธ์จังหวัดอื่นที่สำเร็จแล้วเสียหาย, เขียนผลลัพธ์ออกเป็นไฟล์ data กลาง (เช่น JSON) ที่ยังไม่ทับ `thailand-landmarks.ts` โดยตรง (ให้ T64 เป็นคนรวมภายหลัง), เมื่อรันจบสรุปผล + log แยกรายชื่อจังหวัดที่ได้ไม่ครบ 3 แห่งหรือ 0 แห่งไว้ต่างหาก (อ้างอิง US-16) — dependency: T2, T35

### US-17: รวมข้อมูล Landmark (พร้อมพิกัด) เข้าแอปแบบ Offline และออกแบบตาราง Supabase รองรับ
- [ ] T62: ขยาย `Landmark` type เพิ่มฟิลด์ `lat`/`lng` เป็น **optional** (ชื่อ field ให้ตรงตามคำที่ AC ของ US-16/US-17 ใช้คือ `lat`/`lng` ไม่ใช่ `latitude`/`longitude` เต็มคำ) เพื่อ backward-compat กับ landmark ที่อาจยังไม่มีพิกัด — แก้ที่ interface ซึ่งประกาศอยู่ใน `src/data/thailand-landmarks.ts` เอง (ไม่ใช่ `src/types/landmark.ts` ที่มีแค่ `LandmarkCheckin`) เพื่อลด diff ไม่ต้องย้ายไฟล์ (อ้างอิง US-16 AC4, US-17) — dependency: T35 (ดูคำตัดสิน PM ข้อ 14)
- [ ] T63: Backfill พิกัด lat/lng ให้ landmark ทั้งหมดของ 8 จังหวัดนำร่องเดิม (T35) ด้วยการ lookup แยกต่างหาก (เช่น ยิง Overpass/Nominatim หาแต่ละชื่อ landmark ทีละรายการด้วยมือ/สคริปต์ช่วย) — **ห้ามเปลี่ยนหรือแทนที่ id เดิมของ landmark เหล่านี้เด็ดขาด** เพราะ `CheckinContext` (T36) ผูกสถานะ check-in ของผู้ใช้ด้วย `landmarkId` string เดิมโดยตรง (อ้างอิง US-17 AC5) — dependency: T62, T35
- [ ] T64: Merge ผลลัพธ์จาก T60 (ใช้ผลจาก T61 ถ้ารันจริงสำเร็จ ไม่งั้นใช้ fallback data ตาม T61) เข้า `thailand-landmarks.ts` **เฉพาะ 68 จังหวัดที่เหลือซึ่งปัจจุบันเป็น array ว่าง** — เติมเสริมเท่านั้น ห้ามแทนที่/เขียนทับ landmark ของ 8 จังหวัดนำร่องเดิม ตามคำตัดสิน PM ข้อ 12 (อ้างอิง US-17 AC1,5) — dependency: T60, T62, T63
- [ ] T65: Regression check ว่า T43/T44/T46/T47 (US-8/US-9/US-10 เดิม) ยังทำงานถูกต้องกับ dataset ที่ขยายแล้ว (จำนวน landmark ต่อจังหวัดเพิ่มขึ้น และมี lat/lng เพิ่มเติม แต่ logic เดิมอ่านแค่ id/provinceId/nameTh ต้องไม่พัง) (อ้างอิง US-17 AC1,2,4) — dependency: T64
- [ ] T66: ออกแบบตาราง Supabase `landmarks` (schema: `id`, `province_id`, `name_th`, `lat`, `lng`) พร้อม seed/sync logic นำข้อมูลจาก local dataset ขึ้น Supabase เมื่อมีการเชื่อมต่อ ทดสอบผ่าน mocked/local Supabase client เท่านั้น (ตาม pattern เดียวกับ T39/T41) (อ้างอิง US-17 AC3) — dependency: T64, T39, T33

### US-18: เห็นตำแหน่ง Landmark บนแผนที่ระดับจังหวัด
- [ ] T67: ProvinceDetailScreen แสดงตำแหน่ง (lat/lng) ของ Landmark แต่ละแห่งที่มีพิกัดครบ เป็นจุด/หมุดบนองค์ประกอบแผนที่ของหน้านั้น, Landmark ที่ไม่มีพิกัดครบถูกกรองออกจากแผนที่แต่ยังปรากฏใน list ปกติของ T43 ตามเดิม (ไม่ error, ไม่ทำให้ landmark อื่นหาย), การแตะ/เลือกจุด (ถ้าออกแบบให้กดได้) ต้องอ้างอิง landmark id เดียวกับรายการใน list เสมอ, ทำงาน 100% offline จาก local dataset/cache เท่านั้น ไม่เรียก Overpass หรือบริการแผนที่ภายนอกใดๆ **[รอ design-spec]** (อ้างอิง US-18) — dependency: T64, T63, T43

### US-19: ค้นหาสถานที่ผ่าน OSM Nominatim ตอนเพิ่มบันทึกทริป
- [ ] T68: เขียน Nominatim client module — ยิง request ไปยัง `https://nominatim.openstreetmap.org/search?format=json&countrycodes=th&q=...` พร้อมแนบ custom `User-Agent` header คงที่ (ค่าที่ทีม dev กำหนดเอง ไม่ใช่ default ของ HTTP client) ตาม OSM Usage Policy, จัดการ error/timeout ที่ระดับ client แยกจาก UI layer (อ้างอิง US-19 AC2, US-20 AC1) — dependency: T1
- [ ] T69: ขยาย entries schema (ต่อจาก T3/T34) เพิ่มคอลัมน์ optional `placeLat`/`placeLng` สำหรับเก็บ metadata พิกัดของสถานที่จาก Nominatim search แนบกับ entry — แยกขาดจากตาราง landmark check-in เดิม (T34) โดยสิ้นเชิง ไม่ปนกัน (อ้างอิง US-19 AC3) — dependency: T3, T34
- [ ] T70: AddEntryScreen เพิ่มช่องค้นหาสถานที่แบบ optional เพิ่มเติมจาก field เลือก Landmark เดิม (T47) สำหรับค้นหาสถานที่ที่ไม่อยู่ใน Top Landmarks ของจังหวัดนั้น, เรียกใช้ T68 เมื่อพิมพ์คำค้นและมีเน็ต แล้วแสดงรายการผลลัพธ์เป็น list ให้เลือก, ไม่บังคับใช้งานและไม่กระทบ flow เดิมของ US-4/US-10 ถ้าไม่ใช้ **[รอ design-spec]** (อ้างอิง US-19 AC1,2) — dependency: T68, T47, T12
- [ ] T71: เมื่อผู้ใช้เลือกผลลัพธ์รายการหนึ่งจาก T70 ระบบ prefill ค่าไปยังฟิลด์ "ชื่อสถานที่" (title) ของฟอร์มเดิมโดยอัตโนมัติ (ผู้ใช้ยังแก้ไขค่าที่ prefill มาได้ก่อนบันทึกจริง) พร้อมเก็บพิกัด lat/lng ของผลลัพธ์นั้นแนบไปกับ entry ผ่านคอลัมน์ `placeLat`/`placeLng` จาก T69 — **การเลือกผลลัพธ์นี้ต้องไม่ทำให้เกิดการสร้าง Landmark ใหม่ในตาราง/seed dataset และต้องไม่ trigger auto check-in ตาม US-10 เด็ดขาด** แยกกลไกออกจาก dropdown เลือก Landmark ที่ curate ไว้แล้ว (T47/T48) อย่างสมบูรณ์ (อ้างอิง US-19 AC3,4) — dependency: T70, T69 (ดูคำตัดสิน PM ข้อ 11)

### US-20: จัดการ Rate Limit, Error และ Offline State ของการค้นหาผ่าน Nominatim
- [ ] T72: Debounce การพิมพ์คำค้นใน T70 (ยิง request จริงหลังผู้ใช้หยุดพิมพ์ระยะเวลาหนึ่ง) และ throttle guard ที่ระดับ client module T68 ไม่ให้ยิง request ถี่กว่า ~1 ครั้งต่อวินาที แม้ผู้ใช้พิมพ์เปลี่ยนคำค้นต่อเนื่องเร็วๆ (อ้างอิง US-20 AC2) — dependency: T68, T70
- [ ] T73: แสดงสถานะเมื่อค้นหาไม่ได้ (ไม่มีเน็ต/request ล้มเหลว/timeout) ด้วยข้อความสื่อความหมายชัดเจน (เช่น "ค้นหาไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง") แทนการค้าง loading ตลอดไปหรือ error แบบ raw, แสดง empty state ("ไม่พบสถานที่ที่ค้นหา") เมื่อไม่พบผลลัพธ์เลย — ตรวจสอบว่า "มีเน็ตหรือไม่" ด้วยวิธี opportunistic (ยิง request แล้ว catch error) แบบเดียวกับ `src/sync/SyncContext.tsx` ไม่ใช้ event-based network detection (ไม่มี `@react-native-community/netinfo` ติดตั้ง) **[รอ design-spec]** (อ้างอิง US-20 AC3,4,5) — dependency: T70, T68
- [ ] T74: Isolate failure boundary ของระบบค้นหา Nominatim ทั้งหมด (T68–T73) ไม่ให้กระทบ flow กรอก/บันทึก entry ปกติของ US-4 เลย — ผู้ใช้ยังกรอก title เองแล้วบันทึกได้ตามปกติแม้ระบบค้นหาใช้งานไม่ได้ชั่วคราวทั้งระบบ (อ้างอิง US-20 AC6) — dependency: T70, T12

## P1 (ควรมี)
- [ ] T22: กันหน้า 2D validation (จาก T6/T7) ไม่ให้ปรากฏใน production build/nav ของ end-user (ทำเป็น dev-only flag หรือ route ซ่อน) (อ้างอิง US-7) — dependency: T7
- [ ] T23: Legend อธิบายสี locked vs unlocked ใต้แผนที่ 3 มิติ **[รอ design-spec]** (อ้างอิง US-1) — dependency: T9
- [ ] T24: หน้าสถิติ: จำนวนจังหวัด unlocked (เทียบฐาน 76) และจำนวน entry ทั้งหมด ตรงกับ local storage จริง **[รอ design-spec]** (อ้างอิง US-6) — dependency: T5, T14
- [ ] T25: หน้าสถิติ: คำนวณภาคที่มีจังหวัด unlocked มากที่สุด + แปลชื่อภาคเป็นไทย (เหนือ/อีสาน/กลาง/ตะวันออก/ตะวันตก/ใต้) (อ้างอิง US-6) — dependency: T5
- [ ] T26: หน้าสถิติ: timeline entry ทั้งหมดจากทุกจังหวัด เรียง reverse-chronological ระบุจังหวัดของแต่ละรายการ **[รอ design-spec]** (อ้างอิง US-6) — dependency: T14
- [ ] T27: หน้าสถิติ: empty state ที่เหมาะสมเมื่อยังไม่มี entry เลย (ไม่มี NaN/undefined) **[รอ design-spec]** (อ้างอิง US-6) — dependency: T24
- [ ] T28: แก้ไข journal entry ที่มีอยู่ (UI + save) **[รอ design-spec]** — dependency: T14
- [ ] T29: ลบ journal entry ได้ ถ้าเป็น entry สุดท้ายของจังหวัดนั้น ต้อง lock จังหวัดกลับ — dependency: T14, T9
- [ ] T54: Error handling UI สำหรับ email-link ล้มเหลว (email ซ้ำ, รหัสผ่านไม่ผ่านเงื่อนไข) แสดงข้อความสื่อความหมาย และ anonymous session เดิมยังใช้ต่อได้ **[รอ design-spec]** (อ้างอิง US-11) — dependency: T38, T49
- [ ] T55: Migration retry/resume handling สำหรับกรณีล้มเหลวบางส่วน (เช่นเน็ตหลุดกลาง migrate) — ครอบคลุม edge case ของ US-15 AC3 ให้ครบถ้วนกว่า T42 พื้นฐาน — dependency: T42
- [ ] T56: Photo upload retry ที่ทนต่อการปิด-เปิดแอประหว่างคิวยังไม่เสร็จ (คิวต้อง persist ข้าม session) (อ้างอิง US-13) — dependency: T41
- [ ] T57: Dev-only debug view/log สำหรับตรวจสอบพฤติกรรม last-write-wins ตอน conflict จริง (ไม่ใช่หน้าที่ end-user เห็น) — dependency: T40
- [ ] T61: รันสคริปต์จาก T60 จริงกับ Overpass API (`overpass-api.de`) เพื่อ generate ข้อมูล landmark จริง (เท่าที่ query ได้) ครบทั้ง 76 จังหวัด — ความเสี่ยง: ไม่ยืนยันว่าสภาพแวดล้อมนี้มี outbound network access ไปยัง `overpass-api.de` ได้จริงหรือไม่ ถ้ายิงไม่ได้ ให้ programmer fallback สร้าง mock/sample Overpass response (เช่นข้อมูลตัวอย่าง 3–5 จังหวัด) เพื่อพิสูจน์ว่า pipeline T60→T64 ทำงานถูกต้องก่อน แล้ว flag ไว้ชัดเจนในผลงานว่า "ยังไม่ได้รันจริงครบ 76 จังหวัด ผู้ใช้ต้องรันสคริปต์เองภายหลังเมื่อมี network ออกนอกได้จริง เพื่อ generate ข้อมูลจริงครบทุกจังหวัด" (อ้างอิง US-16) — dependency: T60 (ดูคำตัดสิน PM ข้อ 13)

## P2 (ดีถ้ามี)
- [ ] T30: ทดสอบ/ปรับ performance การ render SVG 76 จังหวัดบนอุปกรณ์สเปคต่ำ (โดยเฉพาะระหว่างอนิเมชัน T16) — dependency: T16
- [x] T31: App icon และ splash screen **[รอ design-spec]** — dependency: T1
  - หมายเหตุ (post-QA fix, นอก pipeline รอบ 1): สร้าง `assets/icon.png`, `assets/splash-icon.png`, `assets/favicon.png`, `assets/android-icon-*.png` ใหม่ด้วย `jimp-compact`/`pngjs` (มีอยู่แล้วใน node_modules) แทนไฟล์ default ของ Expo — พื้นหลัง solid `#1D9E75` + สัญลักษณ์หมุดแผนที่สีขาวพื้นฐาน (ไม่มี custom illustration) ตรงตาม AC เดิม, แก้ `android.adaptiveIcon.backgroundColor` ใน `app.json` จาก `#E6F4FE` (ค่า default เดิม ไม่ตรงธีม) เป็น `#1D9E75` ด้วย — ยังไม่ได้ wiring `expo-splash-screen` plugin (ไม่มี dependency นี้ติดตั้ง, อยู่นอกขอบเขต AC ของ T31 ซึ่งพูดถึงแค่เนื้อหาภาพ)
  - AC (จากคำตัดสิน PM ข้อ 4): ใช้สีธีมหลัก (#1D9E75 accent / #0F6E56) เป็น icon และ splash แบบเรียบง่าย (solid color + สัญลักษณ์/ตัวอักษรพื้นฐาน) ไม่ต้องมี custom illustration ใน v1 — อยู่ใน scope v1 แต่เป็น P2 ไม่บล็อกการ build ฟีเจอร์หลัก
- [ ] T58: Performance test สำหรับ sync engine เมื่อมี pending queue ขนาดใหญ่ (entries + photos จำนวนมากพร้อมกัน เช่นตอน migrate ข้อมูล v1 เก่า) ต้องไม่บล็อก UI — dependency: T39, T41
- [ ] T59: จัดทำ checklist/กระบวนการสำหรับทีม content คัดสรร landmark เพิ่มให้ครบทั้ง 76 จังหวัดในรอบถัดๆ ไป (ไม่ใช่งานโค้ด ไม่บล็อก sprint นี้) — dependency: T35
- [ ] T75: ผนวกรายชื่อจังหวัดที่ Overpass คืนผลลัพธ์ไม่ครบ 3 แห่ง (จาก log ของ T60/T61) เข้ากับ checklist การคัดสรร content เดิมของ T59 เพื่อให้ทีม content ทำ manual review เพิ่มเติมต่อ (นอก sprint พัฒนาโค้ด) (อ้างอิง US-16 AC5, Out of Scope รอบ OSM) — dependency: T59, T61

## คำตัดสิน PM (ถ้ามี)

### ประเด็น 1: ไม่มี label จังหวัดบนแผนที่ vs โอกาส "สำรวจ" ก่อน navigate
- คำตัดสิน: เลือกทางเลือก (b) — เพิ่ม long-press เพื่อแสดง tooltip ชื่อจังหวัดชั่วคราวก่อน tap สั้นเพื่อ navigate (เพิ่ม T32)
- เหตุผล: ยังคงไม่มี label ถาวรบนแผนที่ตาม requirement เดิม (ไม่ผิดเป้าหมายเรื่องความรกของ 76 label) แต่แก้ปัญหา UX จริงที่ UIUX ชี้ — ผู้ใช้ควรสำรวจแผนที่ได้โดยไม่ต้อง navigate เข้า-ออกทุกครั้งเพื่อรู้ว่า tile คือจังหวัดไหน ต้นทุนเพิ่ม (gesture handler เดียว) ต่ำเทียบกับคุณค่าที่ได้ ไม่กระทบ timeline อย่างมีนัยสำคัญ
- **ต้องอัป requirements**: ใช่ — requirements.md ต้องเพิ่ม AC ใหม่ใน US-2 หรือ US-1 ระบุ long-press = แสดง tooltip ชื่อจังหวัด (ไม่ navigate), tap สั้น = navigate ตามเดิม

### ประเด็น 2: Performance risk ของ 76 tile + animation
- คำตัดสิน: ไม่ต้องตัดสินใจระดับ PM — เป็นข้อสังเกตทางเทคนิคส่งต่อ programmer ตามที่ UIUX ระบุแล้ว ให้ยึด T30 (P2) เป็นที่เก็บงานนี้ต่อไป และย้ำผ่าน T8/T9 ว่าต้อง isolate re-render เฉพาะ tile ที่ state เปลี่ยน
- เหตุผล: ไม่กระทบ requirement/design ใดๆ เป็นรายละเอียด implementation
- ต้องอัป requirements: ไม่ต้อง

### ประเด็น 3: Tag set ปิดหรือเปิดให้ custom
- คำตัดสิน: เลือกทางเลือก (b) แบบผสม — fixed tag set เริ่มต้น 8 แท็ก (ทะเล/ภูเขา/วัด/คาเฟ่/น้ำตก/เมือง/ธรรมชาติ/อาหาร) เป็น multi-select chip พร้อมให้ผู้ใช้พิมพ์ custom tag เพิ่มเองได้
- เหตุผล: แอปนี้เป็น personal travel journal ที่เน้นความทรงจำเฉพาะบุคคล fixed list อย่างเดียวจะจำกัดการบันทึกของผู้ใช้ในระยะยาว (เช่น ทริปที่ไม่เข้าพวก 8 แท็กเลย) ส่วนต้นทุนเพิ่ม (text input + เก็บ tag string ใน sqlite) ต่ำ ไม่กระทบ timeline มาก เพราะ storage เก็บ tags เป็น array/string อยู่แล้วตาม data model เดิม
- **ต้องอัป requirements**: ใช่ — requirements.md ต้องปิด tag list เป็นรายการ 8 แท็กที่ระบุชัด และเพิ่ม AC ว่าอนุญาต custom tag ที่ผู้ใช้พิมพ์เพิ่มได้ (ปัจจุบันเขียนแค่ "เช่น ทะเล/ภูเขา/วัด/คาเฟ่" แบบเปิดกว้างไม่ชัดเจน)

### ประเด็น 4: T31 (app icon/splash) ไม่มี AC
- คำตัดสิน: คงอยู่ใน scope v1 เป็น P2 แต่ทำแบบเรียบง่ายที่สุด — ใช้สีธีมหลัก (#1D9E75/#0F6E56) เป็น solid background + สัญลักษณ์/ตัวอักษรพื้นฐานเท่านั้น ไม่ทำ custom illustration
- เหตุผล: ตัดออกจาก scope ทั้งหมดจะทำให้แอปไม่มี icon ใน production build เลยซึ่งดูไม่สมบูรณ์แม้เป็น v1 ภายใน แต่การลงทุนออกแบบ icon ที่ซับซ้อนก็ไม่คุ้มเวลาเทียบกับ core features (P0/P1) จึงเลือกทางสายกลางที่ทำเร็วและได้ผลลัพธ์พอใช้
- **ต้องอัป requirements**: ใช่ — requirements.md ไม่เคยพูดถึง icon/splash เลยแม้แต่ใน Out of Scope ต้องเพิ่มเป็น AC สั้นๆ ใน scope (หรือ note ใน สมมติฐาน) ว่า v1 มี icon/splash แบบ solid-color-only ตามที่ตัดสินนี้ เพื่อไม่ให้ค้างเป็นช่องว่างที่ไม่มีเอกสารอ้างอิง

### ประเด็น 5 (รอบ Landmark & Supabase): ขอบเขต Landmark seed dataset — เริ่มจากจังหวัดนำร่องหรือรอ curate ครบ 76 จังหวัด
- คำตัดสิน: ชิปแบบ functionally-complete ทันที — สร้าง `thailand-landmarks.ts` ครอบคลุมจังหวัดนำร่อง 8 จังหวัด (เสนอ: กรุงเทพมหานคร, เชียงใหม่, เชียงราย, พระนครศรีอยุธยา, สุโขทัย, ชลบุรี, กระบี่, ภูเก็ต) จังหวัดละ 3–5 landmark จริง ส่วนอีก 68 จังหวัดที่เหลือส่ง array ว่าง/TBD และให้ empty state (US-8 AC4) รับผิดชอบแทน ไม่บล็อกงาน UI/data layer/QA ของทั้งฟีเจอร์ไว้รอ content ครบ 76 จังหวัด
- เหตุผล: requirements.md ระบุไว้แล้วว่า "ในรอบแรกอาจเริ่มจากจังหวัดนำร่องบางส่วนก่อน แล้วทยอยเพิ่มให้ครบ" — งาน curate เนื้อหาจริงครบ 76 จังหวัดเป็นงาน content แยกที่ต้องใช้เวลาและกระบวนการตรวจสอบข้อมูลต่างหาก ถ้าบล็อก UI ไว้รอ content ครบ จะทำให้ QA ทดสอบ US-8/US-9/US-10 ทั้งหมดไม่ได้เลยในรอบนี้ การมี pilot dataset ควบคู่ empty state ที่ถูกต้องทำให้ทุก AC ทดสอบได้จริงตั้งแต่ต้น และ empty state เองก็เป็น AC บังคับอยู่แล้วใน US-8
- ต้องอัป requirements: ไม่ต้อง (เป็นการดำเนินการตามสมมติฐานที่ระบุไว้แล้วในบรรทัด "สมมติฐานเพิ่มเติม" ข้อ 2 ของ requirements.md ไม่ได้เปลี่ยน scope หรือ AC ใดๆ)

### ประเด็น 6 (รอบ Landmark & Supabase): จุด/รูปแบบคำเตือนความเสี่ยงข้อมูลหาย (US-11)
- คำตัดสิน: กำหนด non-negotiable constraint ให้ UIUX ออกแบบภายใต้กรอบนี้ (รายละเอียดภาพ/wording/ตำแหน่งที่แน่นอนเป็นดุลยพินิจ UIUX):
  1. ต้องมี one-time prominent prompt/modal แสดงทันทีหลังสร้าง anonymous session สำเร็จครั้งแรก (ตาม US-11 AC1)
  2. ต้องมีจุดที่ "มองเห็นได้เสมอ" อย่างน้อย 1 จุด (เช่นหน้าตั้งค่า/โปรไฟล์) ตราบใดที่ session ยังเป็น anonymous ไม่ผูก email — ห้าม silently absent
  3. ถ้าใช้รูปแบบ dismissible banner/card การ dismiss ต้องไม่ถาวร — ต้อง re-surface อย่างน้อยทุก 7 วัน หรือทุกครั้งที่ผู้ใช้เปิดหน้าตั้งค่า/โปรไฟล์ (เลือกอย่างใดอย่างหนึ่ง)
  4. ห้ามมีทางลบคำเตือนออกถาวรด้วยการกดปุ่มเดียวโดยไม่มีกลไก re-surface ใดๆ เลย
- เหตุผล: ความเสี่ยงข้อมูลหายถาวรเป็น hard requirement ทางธุรกิจ (BA ระบุใน US-11 AC3) ต้องมี floor ที่ไม่ต่อรองเพื่อกันไม่ให้ UIUX ออกแบบคำเตือนแบบเนียนจนมองไม่เห็นหรือปัดทิ้งถาวรได้ง่ายเกินไป ส่วนรูปแบบภาพเป็นงาน UX โดยแท้จึงปล่อยให้ UIUX ตัดสินใจในกรอบนี้
- ต้องอัป requirements: ไม่ต้อง (requirements.md ส่งเรื่องรูปแบบคำเตือนมาให้ PM/UIUX ตัดสินใจอยู่แล้วตาม AC เดิมของ US-11 ข้อ 3 ไม่ได้เปลี่ยน scope)

### ประเด็น 7 (รอบ Landmark & Supabase): Conflict resolution — ยอมรับ last-write-wins แบบ whole-record ตามที่ BA เสนอ
- คำตัดสิน: ยอมรับข้อเสนอ BA ทั้งหมด ใช้ last-write-wins ทั้ง record โดยเทียบ `updated_at` เป็นขอบเขต P0 ของรอบนี้ (T40) — **field-level merge อยู่นอกขอบเขต (out of scope) อย่างชัดเจนสำหรับรอบนี้**
- เหตุผล: field-level merge ต้องมี schema เปรียบเทียบระดับ field และ UI ให้ผู้ใช้เลือกฝั่งที่จะเก็บ ซึ่งเพิ่มความซับซ้อนสูงเทียบกับคุณค่าที่ได้ในรอบที่ยังทดสอบด้วย mock Supabase client เท่านั้น (ยังไม่มี production sync จริงที่จะเจอ conflict บ่อยหรือรุนแรง) เหมาะเก็บไว้พิจารณาในรอบถัดไปถ้าพบปัญหาจริงจากการใช้งานหลายเครื่องจริง
- ต้องอัป requirements: ไม่ต้อง (requirements.md ระบุ last-write-wins และ exclude field-level merge ไว้ใน Out of Scope อยู่แล้ว ตรงกับคำตัดสินนี้พอดี)

### ประเด็น 8 (รอบ Landmark & Supabase): Dependency สำหรับ Supabase — ตรวจสอบพบว่าติดตั้งไว้แล้ว
- คำตัดสิน: ตรวจสอบ package.json แล้วพบว่า `@supabase/supabase-js` (^2.116.0), `@react-native-async-storage/async-storage` (2.2.0), และ `react-native-url-polyfill` (^4.0.0) ถูกติดตั้งไว้แล้วทั้งหมด — ปรับ T33 จาก "ติดตั้ง dependency ใหม่" เป็น "ยืนยันเวอร์ชัน + เขียน Supabase client init module (env-based `SUPABASE_URL`/`SUPABASE_ANON_KEY`, ใช้ mock/local client ตามสมมติฐานที่ระบุไว้)" แทน ไม่มี task ติดตั้ง package ซ้ำซ้อน
- เหตุผล: ป้องกัน programmer เสียเวลาไปรันคำสั่งติดตั้งที่ไม่จำเป็นหรือเข้าใจผิดว่ายังไม่มี dependency ในโปรเจกต์
- ต้องอัป requirements: ไม่ต้อง (เป็นรายละเอียด implementation ไม่กระทบ scope/AC ใดๆ)

### ประเด็น 9 (รอบ Landmark & Supabase): Sync Status Badge — รับ state ที่ 3 "retry-issue" ตามที่ design-spec เสนอ
- คำตัดสิน: รับทางเลือก B — ให้มี 3 สถานะ "รอซิงก์" / "ซิงก์แล้ว" / "retry-issue" (sync ล้มเหลวต่อเนื่องหลายครั้ง) แทนที่จะตัดกลับเหลือ 2 สถานะขั้นต่ำ ปรับ T39 ให้รวม logic นับจำนวนครั้งที่ sync ล้มเหลวติดต่อกันต่อ record เพื่อ trigger state นี้ และปรับ T51 ให้ badge/ไอคอนรองรับ 3 สถานะ
- เหตุผล: AC เดิมของ US-12 เขียนว่า "อย่างน้อยในระดับที่ไม่ทำให้ผู้ใช้เข้าใจผิดว่าข้อมูลหาย" ซึ่งเป็น floor ไม่ใช่ ceiling — state ที่ 3 ไม่ได้ขัดกับ Out of Scope ที่ห้ามเฉพาะ "push notification/แจ้งเตือนสำเร็จ-ล้มเหลว" เพราะยังเป็น in-app status indicator ล้วนๆ ไม่ใช่ notification และไม่ใช่ full activity log effort เพิ่มที่ UIUX ประเมินไว้อยู่ในระดับ "เล็กน้อย" (แค่ counter + threshold) จึงคุ้มค่ากับความโปร่งใสที่ผู้ใช้ได้รับเมื่อเจอปัญหา sync ค้างนานผิดปกติ ไม่มีความเสี่ยงต่อ timeline อย่างมีนัยสำคัญ
- ต้องอัป requirements: ไม่ต้อง (ไม่ขัดกับ AC หรือ Out of Scope เดิมของ US-12 — เป็นการทำเกินขั้นต่ำที่ AC อนุญาตไว้ ("อย่างน้อย") ไม่ใช่การเปลี่ยน scope/เงื่อนไข acceptance)

### ประเด็น 10 (รอบ Landmark & Supabase): Data-loss banner — ยืนยันรับ non-dismissible design
- คำตัดสิน: ยืนยันรับดีไซน์ non-dismissible banner ตามที่ UIUX เลือก (ไม่มีปุ่มปิดเลย แสดงถาวรในหน้าตั้งค่า/โปรไฟล์จนกว่าจะผูก email สำเร็จ) ไม่ต้องปรับเป็น dismissible-with-resurface — ไม่มีการเปลี่ยนแปลงต่อ T50
- เหตุผล: นี่คือทางเลือกที่ตรงตาม constraint ทั้ง 4 ข้อในคำตัดสิน PM ข้อ 6 ได้ง่ายและชัวร์ที่สุดโดยไม่ต้องมี state/logic นับวันหรือ track dismissal เพิ่มเติม ซึ่งลดความเสี่ยง bug และลดงาน QA เทียบกับทางเลือก dismissible+re-surface โดยไม่ได้ประโยชน์เพิ่มเติมด้าน UX ที่ชัดเจนพอจะคุ้มความซับซ้อนที่เพิ่มขึ้น อยู่ในกรอบดุลยพินิจที่ PM มอบให้ UIUX ไว้แล้วตั้งแต่ต้น (ข้อความ PM: "รายละเอียดภาพ/wording/ตำแหน่งที่แน่นอนเป็นดุลยพินิจ UIUX")
- ต้องอัป requirements: ไม่ต้อง (ไม่ใช่ conflict และไม่เปลี่ยน scope/AC — เป็นการยืนยันทางเลือกที่อยู่ในกรอบ constraint เดิมที่ requirements.md/PM decision ข้อ 6 อนุญาตไว้แล้ว)

### ประเด็น 11 (รอบ OSM Data Integration): Nominatim prefill → title field เท่านั้น ไม่สร้าง Landmark ใหม่ ไม่ auto check-in
- คำตัดสิน: ยืนยันรับข้อเสนอของ BA ทั้งหมดตามที่เขียนไว้ใน requirements.md (สมมติฐานเพิ่มเติมรอบ OSM ข้อที่ว่าด้วย Nominatim + US-19 AC3/AC4) — ผลลัพธ์จาก Nominatim ที่ผู้ใช้เลือก prefill เข้าฟิลด์ "title" ของฟอร์ม AddEntryScreen เดิม (US-4) เท่านั้น พร้อมแนบ lat/lng เป็น metadata เสริมบน entry (ผ่านคอลัมน์ใหม่ `placeLat`/`placeLng` ใน T69) — ไม่สร้าง Landmark ใหม่ในตาราง/seed dataset และไม่ trigger auto check-in ตาม US-10 ไม่ว่ากรณีใด แยก mechanism ออกจากกันโดยสมบูรณ์ (T71 เทียบกับ T47/T48)
- เหตุผล: (1) สถานที่จาก Nominatim ยังไม่ผ่านกระบวนการคัดกรองเป็น "Top Landmark" ของจังหวัด (ต่างจาก landmark ใน `thailand-landmarks.ts` ที่คัดสรร/ดึงมาแบบมีเกณฑ์ตาม US-16) การให้มันกลายเป็น Landmark ถาวรหรือ trigger check-in อัตโนมัติจะทำให้ progress "Province Master" (US-9) และรายการ landmark ที่แชร์ระหว่างผู้ใช้ (ถ้ามีในอนาคต) ปนเปื้อนด้วยข้อมูลที่ไม่ได้ผ่านการตรวจสอบคุณภาพเดียวกัน (2) เก็บ auto check-in ไว้เฉพาะ flow ที่มาจาก curated dataset (US-10) ทำให้ semantics ของ "เช็คอิน Landmark" ยังคงมีความหมายชัดเจนสม่ำเสมอ ไม่ใช่ทุกสถานที่ที่เคยพิมพ์ค้นหาจะกลายเป็น "เยือน Landmark" (3) ความซับซ้อนที่เพิ่มขึ้นถ้าให้สร้าง Landmark ใหม่แบบ dynamic (ต้อง generate id, ตรวจสอบ id ซ้ำ, ตัดสินใจว่าจะขึ้น Supabase อย่างไร) ไม่คุ้มกับคุณค่าที่ได้ในรอบนี้ และขัดกับ Out of Scope ที่ BA ระบุไว้ชัดแล้วว่า "ไม่บันทึกผลลัพธ์จาก Nominatim เป็น Landmark ถาวรในระบบ"
- ต้องอัป requirements: ไม่ต้อง (ตรงกับสิ่งที่ requirements.md เขียนไว้แล้วทุกประการ เป็นการยืนยัน ไม่ใช่การเปลี่ยนแปลง)

### ประเด็น 12 (รอบ OSM Data Integration): Reconcile landmark dataset เดิม (8 จังหวัดนำร่อง) กับผลลัพธ์ใหม่จาก Overpass
- คำตัดสิน: เลือก "เติมเสริม" (supplement) — สคริปต์ extraction (T60/T61) และขั้นตอน merge (T64) เติมข้อมูลเฉพาะ 68 จังหวัดที่ยังเป็น array ว่างใน `thailand-landmarks.ts` เท่านั้น **ห้ามแทนที่หรือ regenerate landmark ของ 8 จังหวัดนำร่องเดิมทั้งชุด** ส่วนพิกัด lat/lng ที่ 8 จังหวัดนำร่องยังขาดอยู่ ให้ backfill แยกต่างหาก (T63) โดยคง `id` เดิมทุกตัวไว้ 100% ไม่มีการสร้าง id ใหม่ทับ
- เหตุผล: `src/storage/CheckinContext.tsx` (T36) เก็บสถานะ check-in ของผู้ใช้เป็น `Record<landmarkId, boolean>` โดยอ้างอิงด้วย `landmarkId` string ตรงๆ (เช่น `bkk-grand-palace`) ถ้า id เปลี่ยนหรือ regenerate ใหม่จาก Overpass (ซึ่งมักให้ OSM node/way id ที่ format ต่างไปจาก id เดิมที่ทีมตั้งเอง) สถานะ check-in และความคืบหน้า Province Master ที่ผู้ใช้บันทึกไว้แล้วของ 8 จังหวัดนี้จะหายไปทันทีโดยไม่มีทาง recover — เป็นความเสี่ยง data-loss ที่ยอมรับไม่ได้สำหรับ local-only app ที่ไม่มี backend กู้คืน การเติมเสริมเฉพาะจังหวัดที่ยังไม่มีข้อมูลจึงเป็นทางเลือกเดียวที่ปลอดภัยและตรงกับ AC ของ US-17 ข้อสุดท้ายที่ระบุเงื่อนไขนี้ไว้ตรงๆ อยู่แล้ว
- ต้องอัป requirements: ไม่ต้อง (requirements.md ระบุเงื่อนไขนี้ไว้ชัดเจนแล้วใน US-17 AC5 ว่า "ต้องระบุวิธี reconcile ให้ชัดเจน... โดยไม่ทำให้สถานะ check-in ที่ผู้ใช้เคยบันทึกไว้หายไป" — คำตัดสินนี้เป็นการเลือกวิธีที่สอดคล้อง ไม่ใช่การเปลี่ยน AC)

### ประเด็น 13 (รอบ OSM Data Integration): แยก task เขียนสคริปต์ (T60) ออกจาก task รันสคริปต์จริง (T61) พร้อม fallback
- คำตัดสิน: แยกเป็น 2 task ชัดเจน — T60 (เขียนโค้ด extraction script ที่ทดสอบ/รีวิวได้ ไม่ต้องยิง network จริงตอน dev ก็ตรวจสอบ logic ได้ด้วย unit test/mock response) เป็น **P0** เพราะเป็น deliverable ของโค้ดที่ควบคุมความเสี่ยงได้เต็มที่ ส่วน T61 (รันสคริปต์จริงยิงไปที่ `overpass-api.de` เพื่อ generate ข้อมูลจริงครบ 76 จังหวัด) เป็น **P1** ที่มีความเสี่ยงชัดเจนว่าอาจทำไม่ได้ในสภาพแวดล้อมนี้ถ้าไม่มี outbound network access — กำหนด fallback ไว้ล่วงหน้าใน T61 ให้ใช้ mock/sample Overpass response พิสูจน์ pipeline (T60→T64) ก่อน แล้ว flag ให้ผู้ใช้รันสคริปต์เองภายหลังเพื่อ generate ข้อมูลจริงครบ 76 จังหวัด
- เหตุผล: ต่างจาก T31 (raster icon) ที่ตอนแรกดูเหมือนทำไม่ได้แต่ท้ายที่สุดพิสูจน์ได้ว่าทำได้ด้วย library ที่มีอยู่แล้วในเครื่อง (ไม่มีความเสี่ยงจริง) กรณีนี้ต่างออกไปตรงที่ความเสี่ยงมาจาก **network access ออกนอกเครื่อง** ไปยัง `overpass-api.de` ซึ่งเป็นปัจจัยที่ควบคุมไม่ได้จาก library ภายในเครื่องเพียงอย่างเดียว จึงต้องเผื่อ fallback ไว้ตั้งแต่ต้นแทนที่จะสมมติว่าทำได้แน่นอน การแยก 2 task ทำให้ต่อให้ T61 ทำไม่สำเร็จในรอบนี้ งาน T60 (โค้ดที่รีวิวได้) ก็ยังส่งมอบสำเร็จและพร้อมให้ผู้ใช้รันเองในสภาพแวดล้อมที่มีเน็ตได้ทันที ไม่ทำให้ P0 ทั้งสายอื่น (T62-T74) ติดขัด เพราะทุก task ที่ตามมาออกแบบให้รับ fallback data ได้เช่นกัน
- ต้องอัป requirements: ไม่ต้อง (requirements.md ระบุไว้แล้วว่าสคริปต์นี้เป็น dev/build-time tool และยอมรับว่าบางจังหวัดอาจได้ข้อมูลไม่ครบ — การแยก P0/P1 พร้อม fallback เป็นการวางแผนการส่งมอบ ไม่ใช่การเปลี่ยน scope หรือ AC)

### ประเด็น 14 (รอบ OSM Data Integration): field lat/lng บน Landmark type — ชื่อ field และ optional/required
- คำตัดสิน: ใช้ชื่อ field `lat`/`lng` (ตรงตามคำที่ AC ของ US-16/US-17 เขียนไว้ ไม่ใช้ `latitude`/`longitude` เต็มคำ) และกำหนดเป็น **optional** บน `Landmark` interface (ปัจจุบันประกาศอยู่ใน `src/data/thailand-landmarks.ts` ไม่ใช่ `src/types/landmark.ts`) — ควบคู่กับ T63 ที่ backfill พิกัดให้ 8 จังหวัดนำร่องเดิมในสคริปต์/ขั้นตอนเดียวกันกับการ merge ข้อมูลใหม่ เพื่อให้ landmark ส่วนใหญ่มีพิกัดครบในทางปฏิบัติ แต่ type ยังคง optional ไว้เป็น safety net
- เหตุผล: แม้ตั้งใจ backfill ให้ครบ (T63) แต่ US-18 AC2 เขียนไว้ชัดว่า "Landmark ที่ไม่มีพิกัด...จะไม่แสดงจุดบนแผนที่ แต่ยังคงปรากฏในรายการ list ปกติ...โดยไม่ error" ซึ่งหมายความว่าระบบต้อง **รองรับกรณีไม่มีพิกัดได้ตลอดไป** ไม่ใช่แค่ช่วง transition — ถ้ากำหนดเป็น required จะบังคับให้ทุก landmark ในอนาคต (รวมถึงที่ทีม content เพิ่มเองมือในรอบถัดไปตาม T59) ต้องมีพิกัดเสมอ ซึ่งเพิ่มภาระโดยไม่จำเป็นและขัดกับ AC ที่ออกแบบมาให้ยืดหยุ่นอยู่แล้ว optional field จึงตรงกับทั้ง backward-compat (8 จังหวัดเดิมก่อน backfill) และ forward-compat (landmark ใหม่ที่ยังไม่มีพิกัดในอนาคต) ได้ดีที่สุด
- ต้องอัป requirements: ไม่ต้อง (สอดคล้องกับ US-16 AC3/US-18 AC2 ที่เขียนไว้แล้วว่าต้องรองรับกรณีไม่มีพิกัดโดยไม่ error — ไม่ได้เปลี่ยน scope หรือ AC)

### ประเด็น 15 (รอบ OSM Data Integration): ต้องเรียก UIUX ต่อ ไม่ข้าม step
- คำตัดสิน: ยืนยันว่ารอบนี้**ต้อง**เรียก UIUX ต่อจาก PM ตามปกติ ไม่ข้าม — มีองค์ประกอบ UI ใหม่จริงที่ต้องออกแบบ 3 จุด: (1) map pin แสดงพิกัด Landmark ในหน้า ProvinceDetailScreen (T67, US-18), (2) ช่องค้นหาสถานที่ใหม่ใน AddEntryScreen พร้อม list ผลลัพธ์ (T70, US-19), (3) ข้อความสถานะ error/timeout/offline/empty ของการค้นหา (T73, US-20) — ทั้ง 3 task ถูกทำเครื่องหมาย **[รอ design-spec]** ไว้แล้วข้างต้น ส่วน task อื่นที่เหลือ (T60, T62, T63, T64, T65, T66, T68, T69, T72, T74) เป็น data/logic layer ล้วนๆ เริ่มขนานกับงาน UIUX ได้ทันทีโดยไม่ต้องรอ
- เหตุผล: ตรงตามขอบเขตหน้าที่ของ PM ที่ห้ามออกแบบ UI เอง และงานทั้ง 3 จุดมีผลต่อประสบการณ์ผู้ใช้โดยตรง (ตำแหน่งจุดบนแผนที่ขนาดเล็กของจังหวัด, การจัดวาง search input คู่กับ dropdown Landmark เดิมไม่ให้สับสน, wording ของ error/empty state) ซึ่งเป็นดุลยพินิจเชิงออกแบบที่ควรมาจาก UIUX ไม่ใช่ PM ตัดสินใจเอง
- ต้องอัป requirements: ไม่ต้อง (เป็นขั้นตอน pipeline ปกติตามที่กำหนดไว้แล้ว ไม่กระทบ scope/AC ของ requirements.md)
</content>
