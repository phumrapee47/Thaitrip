# Test Report — Travel Journal ไทย

## สรุป

**Automated test run:** Total: 58 | Pass: 57 | Skip: 1 (documented environment limitation, not a bug) | Fail: 0

**Acceptance criteria coverage:** 24/24 AC ข้อที่ตรวจสอบได้ในสภาพแวดล้อมนี้ผ่านหมด (PASS) — แต่พบ **บั๊ก 1 จุดจากการตรวจโค้ด** (ไม่ได้อยู่ใน AC ใดโดยตรง แต่กระทบฟิลด์ `date` ที่ AC ของ US-4/US-5/US-6 อ้างถึง) ดูหัวข้อ "บั๊กที่พบ" ด้านล่าง — ถือเป็น **Medium severity**, ไม่มีบั๊ก **High severity**

**Test suites (10 files, 8 ใหม่โดย Tester):**
- `src/utils/derived.test.ts` — unit tests เดิมของ programmer (14 tests, ไม่ได้แก้ไข)
- `src/__tests__/integration/*.test.tsx(.ts)` — integration/e2e-level tests ใหม่ 9 ไฟล์ (44 tests) เขียนตาม acceptance criteria ของ requirements.md โดยตรง

**Static checks:**
- `npx tsc --noEmit` — ผ่าน (0 errors) บนโค้ดหลักทั้งหมดใน `src/`
- `npx expo-doctor` — 21/21 ผ่าน
- `npx expo export --platform android` — bundle สำเร็จ 1453 modules (ตรงตามที่ dev-notes.md อ้างไว้)

**สภาพแวดล้อมที่ทดสอบ:** ไม่มี device/emulator จริงให้ทดสอบ (Windows dev machine, ไม่มี Android/iOS runtime) ใช้ jest + jest-expo + `@testing-library/react-native` (เพิ่มเป็น devDependency ใหม่) แทน โดย mock native module ที่รันในสภาพแวดล้อมนี้ไม่ได้ (`expo-sqlite`, `expo-image-picker`, `@react-native-community/datetimepicker`, `react-native-reanimated`/`react-native-worklets` ผ่าน jest mock ของ library เอง) — รายละเอียด "ตรวจไม่ได้ในสภาพแวดล้อมนี้" อยู่ในหัวข้อ Coverage gaps ท้ายรายงาน

---

## รายละเอียดตาม User Story

### US-1: ดูภาพรวมความคืบหน้าบนแผนที่ 3 มิติ
- [x] AC1: หน้า home แสดง SVG ครบทั้ง 76 จังหวัด ไม่มีจังหวัดหาย ไม่มี id ซ้ำ — **PASS**
  - `src/__tests__/integration/dataset.test.ts` (5 tests): ยืนยัน `PROVINCES.length === 76`, ไม่มี id ซ้ำ, ไม่มีบึงกาฬ, ทุก record มี id/nameEn/nameTh/region/path/centroid ครบและ valid
  - `src/__tests__/integration/map3d.test.tsx` "renders all 76 provinces...": ยืนยันทุกจังหวัดมี tile จริงบนแผนที่ (accessibilityLabel ตรงกับ nameTh ของแต่ละจังหวัด)
- [x] AC2: จังหวัดไม่มี entry → locked (เทา, ไม่ยกตัว, ไม่มี side face) — **PASS** (ดูหมายเหตุ)
  - ยืนยันผ่าน `isVisited=false` → accessibility label ลงท้าย "ยังไม่ได้ไป" (`map3d.test.tsx`)
  - ตรวจโค้ด `ProvinceTile3D.tsx`: `lift=0` → `translateY: 0` (ไม่ยกตัว), side path `opacity: lift.value = 0` (ไม่แสดง), fill ผ่าน `interpolateColor(0,...) = lockedColor` (`COLORS.lockedTop = #D9D9D9` เทา) — ตรงตาม AC
  - **หมายเหตุ:** สี fill/translateY ที่แท้จริงเป็น *animated prop* ผ่าน reanimated ซึ่ง jest mock ของ reanimated (`createAnimatedComponent` เป็น identity function) ไม่ได้ merge ค่า animated props เข้ากับ prop จริงบน SVG node ที่ render ออกมา จึง assert สีที่ render จริงไม่ได้ในสภาพแวดล้อมนี้ — ยืนยันด้วย logic ที่ขับสถานะเดียวกัน (accessibilityLabel) แทน ดู Coverage gaps
- [x] AC3: จังหวัดมี entry ≥1 → unlocked (เขียวยกตัว, side เข้มมองเห็น) — **PASS** (หมายเหตุเดียวกับ AC2)
- [x] AC4: header "ปลดล็อกแล้ว X / 76 จังหวัด" + progress bar อัปเดตทันที — **PASS**
  - `homeScreen.test.tsx`: render แล้วเห็น "ปลดล็อกแล้ว 0 / 76 จังหวัด" ทันที, หลัง `addEntry` ผ่าน context ข้อความอัปเดตเป็น "ปลดล็อกแล้ว 1 / 76 จังหวัด" โดยไม่ reload หน้า
  - `statsScreen.test.tsx` ยืนยัน pattern ข้อความเดียวกันคำนวณถูกต้องจาก storage จริง (mock)
- [x] AC5: มี legend ใต้แผนที่อธิบายสี locked/unlocked — **PASS**
  - `homeScreen.test.tsx`: พบข้อความ "ยังไม่ได้ไป" และ "ไปแล้ว" ใต้แผนที่จริง

### US-2: เปิดดูรายละเอียดจังหวัดจากแผนที่
- [x] AC1: แตะจังหวัด (locked/unlocked) → นำทางตรงกับ province.id — **PASS**
  - `map3d.test.tsx`: แตะจังหวัด locked (อำนาจเจริญ) และ unlocked (ภูเก็ต) แยกกัน ยืนยัน callback ได้ id ที่ถูกต้องเป๊ะทั้งคู่
  - `homeScreen.test.tsx`: end-to-end ผ่าน navigation จริง — แตะ "ภูเก็ต" บน Home แล้วเห็นหน้า ProvinceDetail ของภูเก็ตจริง
- [x] AC2: tap target ครอบพื้นที่ path จริง ไม่ทับซ้อนจนกดผิดแม้จังหวัดเล็ก (สมุทรสงคราม) — **PASS** (มีข้อจำกัดของสภาพแวดล้อมทดสอบ)
  - `map3d.test.tsx`: แตะ tile ของสมุทรสงครามแล้วได้ callback เป็น `samut-songkhram` เท่านั้น (ไม่ trigger จังหวัดอื่น)
  - ตรวจโค้ด `ProvinceTile3D.tsx`/`Map2DValidationScreen.tsx`: `onPress` ผูกอยู่บน `<G>`/`<Path>` ที่ใช้ `province.path` เดียวกับที่ render จริง (ไม่ใช่ bounding-box สี่เหลี่ยมทับซ้อน) — โครงสร้างโค้ดถูกต้องตาม AC
  - **ข้อจำกัด:** jest test-renderer ไม่ได้ทำ pixel-level hit-testing จริงของรูปทรง SVG (fireEvent เรียก handler ตรงโดยไม่ผ่านการคำนวณตำแหน่งจริง) จึงยืนยัน "ความแม่นยำของพื้นที่กดจริงบนหน้าจอ" แบบสมบูรณ์ไม่ได้ในสภาพแวดล้อมนี้ ต้องทดสอบบนอุปกรณ์จริง (ตรงกับ T30 ที่ dev-notes.md ระบุไว้แล้วว่าไม่มีอุปกรณ์ทดสอบ)
- [x] AC3: จังหวัด locked แตะแล้วเข้าหน้ารายละเอียดที่กด "เพิ่มบันทึกแรก" ได้ทันที ไม่ dead-end — **PASS**
  - `provinceDetailScreen.test.tsx` "shows an empty state with a CTA...": จังหวัด locked (ไม่มี entry) แสดง empty state พร้อมปุ่ม "+ เพิ่มบันทึกใหม่" กดแล้วนำทางเข้าฟอร์ม AddEntry จริง (เห็น field "ชื่อสถานที่ *") ไม่ error/ไม่ค้าง

### US-3: เล่นอนิเมชันปลดล็อกแบบ 3 มิติเมื่อสถานะเปลี่ยน
- [x] AC1: entry แรกสำเร็จ → จังหวัดเปลี่ยนจาก flat/เทา เป็น elevated/เขียวด้วย spring/bounce — **PASS** (logic; ภาพเคลื่อนไหวจริงตรวจไม่ได้ในสภาพแวดล้อมนี้)
  - `map3d.test.tsx` "calls onUnlockAnimationDone for the tile that just unlocked": ยืนยัน lifecycle การ unlock ทำงานถูกต้อง (callback ถูกเรียกพร้อม provinceId ที่ถูกต้องหลัง "จบอนิเมชัน")
  - ตรวจโค้ด `ProvinceTile3D.tsx`: ใช้ `withSpring(1, { damping: 8, stiffness: 120 })` จาก `lift=0` เมื่อ `isJustUnlocked=true` (ไม่ snap ตรงๆ) — ตรง AC
  - **ข้อจำกัด:** reanimated jest mock เรียก callback ของ `withSpring` แบบ synchronous ทันที (ไม่ได้ simulate สปริง/เวลาจริง) จึงตรวจ "ความรู้สึกของอนิเมชัน" ที่แท้จริงบนหน้าจอไม่ได้ในสภาพแวดล้อมนี้ ต้องอาศัยอุปกรณ์จริง (เชื่อมโยงกับ T30)
- [x] AC2: จังหวัดที่ปลดล็อกอยู่ก่อนไม่เล่นอนิเมชันซ้ำ — **PASS**
  - `map3d.test.tsx` "does not fire the unlock-animation-done callback for a province that was already unlocked before": ตั้ง `justUnlockedProvinceId='phuket'` พร้อม `chiang-mai` ที่ unlocked อยู่ก่อนแล้ว ยืนยัน callback ไม่ถูกเรียกด้วย `chiang-mai`
- [x] AC3: แผนที่อยู่ในกรอบเอียง rotateX 30–40° ตลอดเวลา — **PASS**
  - `map3d.test.tsx` "keeps the map container tilted...": อ่าน style tree จริงของ container พบ `rotateX: 35deg` (อยู่ในช่วงที่กำหนด) ไม่ขึ้นกับ state ของอนิเมชันใดๆ

### US-4: เพิ่มบันทึกทริปใหม่ให้จังหวัด
- [x] AC1: ปุ่ม "+ เพิ่มบันทึกใหม่" เปิดฟอร์มครบทุกฟิลด์ (date, title, notes, photoUris, tags) — **PASS**
  - `addEntryScreen.test.tsx` "renders a form with fields...": ยืนยันทุก field label ปรากฏบนฟอร์มจริง
  - `provinceDetailScreen.test.tsx`: ยืนยันทางเข้าฟอร์มทั้งจากปุ่มบนสุด (เมื่อมี entry อยู่แล้ว) และจาก empty-state CTA (เมื่อยังไม่มี entry) — สังเกต: ปุ่มบนสุดจะไม่แสดงถ้าจังหวัดยังไม่มี entry เลย (ซ่อนไว้ ใช้ปุ่มใน empty state แทนซึ่งข้อความเดียวกัน) เป็นการออกแบบที่ตอบ AC ได้ครบ ไม่ใช่บั๊ก
- [x] AC2: บังคับ title+date ก่อนบันทึก แสดง error ถ้าขาด, notes/photos/tags optional — **PASS**
  - `addEntryScreen.test.tsx` "shows a validation error and blocks save when title is missing": กด "บันทึก" โดยไม่กรอก title → เห็น error "กรุณากรอกชื่อสถานที่" และไม่มีการบันทึกลง storage
  - "does not clear previously-entered fields when validation fails": กรอก notes ไว้แล้วปล่อย title ว่าง → validation fail แต่ notes ที่กรอกไว้ไม่หาย
- [x] AC3: เลือกรูปผ่าน expo-image-picker ได้มากกว่า 1 รูป — **PASS**
  - `photoPicker.test.tsx` (component เดี่ยว, 4 tests): กดปุ่ม "+ เพิ่มรูป" เรียก `launchImageLibraryAsync` ด้วย `allowsMultipleSelection: true`, รับ 2 รูปจากการเลือกครั้งเดียวมาต่อท้าย state ได้ถูกต้อง, ลบรูปทีละรูปได้, และปฏิเสธการเพิ่มรูปถ้า permission ไม่ผ่าน
  - `addEntryScreen.test.tsx` "saves successfully...": ยืนยัน `photoUris` เป็น array ที่ถูกส่งไปกับ entry ที่บันทึกจริง
- [x] AC4: บันทึกสำเร็จ → entry ผูกกับ provinceId ถูกต้อง, persist, ข้อมูลอยู่ครบหลังปิดเปิดแอป — **PASS** (เฉพาะ logic; sqlite จริงตรวจไม่ได้ในสภาพแวดล้อมนี้)
  - `addEntryScreen.test.tsx`: entry ที่บันทึกมี `provinceId` ตรงกับหน้าจอที่เปิดมา (`chiang-mai`) และ field ครบ
  - `journalContext.test.tsx` "loads persisted entries from storage on mount": จำลอง "เปิดแอปใหม่" โดย seed ข้อมูลไว้ใน storage layer ก่อน mount แล้วยืนยัน context โหลดข้อมูลเดิมกลับมาครบ (เทียบเท่าพฤติกรรม "ปิดเปิดแอปแล้วข้อมูลยังอยู่" ในระดับ storage contract)
  - **ข้อจำกัด:** ทดสอบผ่าน manual mock ของ `src/storage/db.ts` (in-memory) แทน `expo-sqlite` จริง เพราะเป็น native module รันใน jest ไม่ได้ — การ persist ลงไฟล์ sqlite จริงบนดิสก์ยังไม่ได้ตรวจสอบในสภาพแวดล้อมนี้ (ต้องใช้อุปกรณ์จริง)
- [x] AC5: entry แรกของจังหวัด → สถานะเปลี่ยนเป็น unlocked ทันที — **PASS**
  - `journalContext.test.tsx` "addEntry persists to storage bound to the correct provinceId and flags first-entry unlock": หลัง `addEntry` ครั้งแรกของจังหวัด `isVisited('phuket')` เปลี่ยนเป็น `true` ทันที และ `justUnlockedProvinceId` ถูกตั้งเป็น `phuket`
  - "does NOT set justUnlockedProvinceId when adding a 2nd+ entry...": ยืนยัน entry ที่ 2 ของจังหวัดเดิมไม่ trigger unlock flag ซ้ำ

### US-5: ดูรายการบันทึกทั้งหมดของจังหวัด
- [x] AC1: หน้ารายละเอียดแสดง nameTh เป็นหัวข้อหลัก — **PASS** (`provinceDetailScreen.test.tsx`)
- [x] AC2: entry เรียงจากล่าสุดไปเก่าสุด — **PASS**
  - `provinceDetailScreen.test.tsx` "lists entries sorted reverse-chronologically...": seed entry เก่า (2026-01-01) และใหม่ (2026-06-01) ยืนยันลำดับ title ที่ render ออกมาจริงในทรี เอาใหม่ขึ้นก่อน
- [x] AC3: แต่ละรายการแสดง title, date, thumbnail รูปแรก (ถ้ามี) — **PASS**
  - ทดสอบเดียวกันข้างต้น seed entry ที่มี `photoUris` ด้วย ยืนยัน render ไม่ error (ใช้ path `EntryListItem.tsx` ที่แสดง `<Image>` เมื่อมีรูป, placeholder ไอคอนเมื่อไม่มี — ตรวจโค้ดตรงตาม AC)
- [x] AC4: จังหวัดไม่มี entry เลย → empty state ชัดเจน พร้อมทางเข้าเพิ่ม entry แรก — **PASS** (ดู US-2 AC3 ด้านบน — ใช้ evidence เดียวกัน)

### US-6: ดูภาพรวมสถิติการเดินทางทั้งหมด
- [x] AC1: จำนวนจังหวัด unlocked (เทียบฐาน 76) และจำนวน entry ทั้งหมด ตรงกับข้อมูลจริง — **PASS**
  - `statsScreen.test.tsx` "shows unlocked count vs 76 and total entry count...": seed 3 entries ใน 2 จังหวัด (phuket ×2, chiang-mai ×1) ยืนยันข้อความ "ปลดล็อกแล้ว 2 / 76 จังหวัด" และ "บันทึกทั้งหมด 3 รายการ" ตรงกับข้อมูลจริงเป๊ะ (ไม่ใช่นับ entry ปนกับจำนวนจังหวัด)
- [x] AC2: คำนวณภาคที่ unlocked มากที่สุด แปลไทยถูกต้อง — **PASS**
  - "computes and shows the top region...": seed ภูเก็ต+กระบี่ (ภาคใต้ทั้งคู่) + เชียงใหม่ (ภาคเหนือ) ยืนยันข้อความ "ไปเยือนภาคใต้มากที่สุด" ตรงตาม mapping `REGION_NAME_TH`
- [x] AC3: timeline รวมทุกจังหวัดเรียงล่าสุดก่อน ระบุจังหวัดต้นทางได้ — **PASS**
  - "shows a cross-province timeline...": seed entry เชียงใหม่ (เก่า) + ภูเก็ต (ใหม่) ยืนยันลำดับ title ในทรีถูกต้อง และ badge ชื่อจังหวัดของแต่ละ item ปรากฏครบ ("ภูเก็ต", "เชียงใหม่")
- [x] AC4: ไม่มี entry เลย → empty state เหมาะสม ไม่มี NaN/undefined — **PASS**
  - "shows an appropriate empty state...": ยืนยันข้อความ empty state ปรากฏ และไม่มี "NaN"/"undefined" หลุดออกมาที่ใดในหน้าจอ

### US-7: ตรวจสอบพื้นฐานของแผนที่ 2 มิติ (validation step)
- [x] AC1: แผนที่ 2D render ครบ 76 จังหวัดจาก path data ตรงๆ ไม่มีการ re-derive — **PASS**
  - `map2dValidationScreen.test.tsx`: นับ `<RNSVGPath>` ที่ render จริงได้ 76 ตัวพอดี ตรงกับ `PROVINCES.length`
- [x] AC2: แตะจังหวัด → toggle สถานะ visited ใน memory (เทา↔เขียว) ได้ถูกต้อง ไม่ผูกกับ journal entry — **PASS**
  - "tapping a province toggles its in-memory visited flag...": แตะ path แรก เห็นตัวนับ "1 toggled visited" เปลี่ยนจริงในสภาพ jest (ไม่มี JournalContext/storage เกี่ยวข้องกับหน้านี้เลยตามโค้ด)
- [x] AC3: เป็น dev-only step ไม่ปรากฏใน production build — **PASS** (เชิงโครงสร้างโค้ด)
  - ตรวจ `AppNavigator.tsx`: ทั้ง route registration และ dev-link บน Home ถูก gate ด้วย `if (__DEV__)` เหมือนกัน — เป็นกลไกมาตรฐานของ Metro/Expo ที่ strip โค้ดในบิลด์ production (ตรวจ runtime flag `__DEV__=false` จริงไม่ได้ในสภาพแวดล้อม dev/test นี้ เนื่องจากเป็นค่าคงที่ที่ compile-time เปลี่ยนเฉพาะตอนสร้าง production bundle)

---

## บั๊กที่พบ (จากการตรวจโค้ด ไม่ใช่จาก automated test suite ด้านบน)

### BUG-1 (Medium severity): `formatThaiDate` แสดงวันที่ผิดพลาดบนอุปกรณ์ที่ timezone อยู่หลัง UTC (UTC offset ติดลบ)

- **ไฟล์:** `src/utils/derived.ts`, ฟังก์ชัน `formatThaiDate` (ใช้แสดงวันที่ทุกจุดที่ผู้ใช้เห็น entry: `EntryListItem.tsx`, ปุ่มวันที่ใน `AddEntryScreen.tsx`, timeline ใน `StatsScreen.tsx`)
- **สาเหตุ:** `new Date('YYYY-MM-DD')` ตาม ECMAScript spec จะ parse เป็น UTC เที่ยงคืน แต่โค้ดอ่านค่ากลับด้วย local-time getters (`d.getDate()`, `d.getMonth()`, `d.getFullYear()`) แทนที่จะใช้ `getUTCDate()`/`getUTCMonth()`/`getUTCFullYear()` — สำหรับอุปกรณ์ที่ตั้ง timezone เป็นโซนที่ UTC offset เป็นลบ (ทางฝั่งตะวันตกของ UTC เช่นทวีปอเมริกาส่วนใหญ่) เที่ยงคืน UTC จะตรงกับ "เมื่อวาน" ตามเวลาท้องถิ่น ทำให้วันที่ที่แสดงผิดไป 1 วัน
- **Repro (ยืนยันแล้วนอก React Native ด้วย Node สองโปรเซสแยกกัน เพื่อตัดปัญหา TZ cache ของ V8 ที่ไม่รีเฟรชกลางโปรเซส):**
  ```
  # โปรเซสที่ 1 (จำลองอุปกรณ์ timezone อเมริกา)
  $ node -e "process.env.TZ='America/New_York'; const d=new Date('2026-09-12'); console.log(d.getDate(), d.getUTCDate())"
  11 12    <-- local getDate() ผิด (ควรเป็น 12 ตามที่ผู้ใช้กรอก), UTC ถูก

  # โปรเซสที่ 2 (ค่า default ของเครื่องนี้ Asia/Bangkok, UTC+7)
  $ node -e "const d=new Date('2026-09-12'); console.log(d.getDate(), d.getUTCDate())"
  12 12    <-- ถูกทั้งคู่ เพราะ Bangkok เป็น UTC+7 (offset บวก) จึงไม่ชนปัญหานี้
  ```
  บนอุปกรณ์จริง: ตั้ง timezone เครื่องเป็นโซนที่ UTC offset ติดลบ (เช่น America/New_York, UTC-4/-5) → เพิ่ม entry วันที่ 2026-09-12 → เปิดดูรายการ entry จะเห็นวันที่แสดงเป็น "11 ก.ย." แทนที่จะเป็น "12 ก.ย."
- **ผลกระทบ:** ข้อมูลที่เก็บจริงใน storage (`entry.date` เป็น ISO string) ไม่เสียหาย เป็นแค่การ *แสดงผล* ผิด แต่กระทบทุกที่ที่โชว์วันที่ (US-4 ฟอร์ม, US-5 รายการ entry, US-6 timeline) — เนื่องจากแอปนี้ทำสำหรับผู้ใช้ในไทย (UTC+7 เป็น positive offset) จึงไม่กระทบผู้ใช้ทั่วไปที่ตั้งเครื่องเป็นเวลาไทยตามปกติ แต่จะกระทบผู้ใช้/QA ที่ตั้งเครื่อง/emulator เป็น timezone ประเทศอื่นที่อยู่ฝั่งตะวันตกของ UTC (พบได้จริงระหว่างเดินทางหรือทดสอบด้วย emulator ที่ default เป็น timezone อื่น) — จัดเป็น **Medium** ไม่ใช่ High เพราะไม่ทำข้อมูลเสียหาย/แอปไม่ crash และไม่กระทบ default use-case หลักของแอป
- **ข้อเสนอแนะการแก้ (ให้ programmer พิจารณา ไม่ใช่หน้าที่ tester แก้เอง):** เปลี่ยนไปใช้ `getUTCDate()`/`getUTCMonth()`/`getUTCFullYear()` ใน `formatThaiDate` เพื่อให้สอดคล้องกับวิธี parse แบบ UTC ของ `new Date('YYYY-MM-DD')`

**ไม่พบบั๊ก High severity อื่นใดในระบบ** จากการตรวจสอบ AC ทั้งหมดและการอ่านโค้ดที่เกี่ยวข้อง (storage layer, JournalContext, ทุกหน้าจอหลัก)

---

## Coverage ที่ยังขาด (ตรวจไม่ได้ในสภาพแวดล้อมนี้)

1. **T30 perf บนอุปกรณ์สเปคต่ำจริง** — ตามที่ dev-notes.md ระบุไว้แล้วว่าไม่มีอุปกรณ์/emulator ทดสอบ ยืนยันแล้วว่ายังเป็นข้อจำกัดจริง (ไม่มี Android/iOS runtime ในสภาพแวดล้อมนี้เช่นกัน) — ไม่พบวิธี mitigate เพิ่มเติมได้ในรอบ QA นี้
2. **T31 ไอคอน/splash ยังเป็นค่า default ของ Expo** — ยืนยันแล้วว่ายังเป็นเช่นนั้นจริงใน `app.json`/`assets/*.png` (adaptiveIcon.backgroundColor ยังเป็น `#E6F4FE` สีฟ้า default ไม่ใช่ธีม `#1D9E75`/`#0F6E56`) — ไม่พบผลกระทบอื่นนอกเหนือจากที่ dev-notes.md ระบุไว้แล้ว (`expo-doctor` และ `expo export` ผ่านปกติ ไม่มีอะไรพังเพิ่มเติมรอบๆ จุดนี้)
3. **อนิเมชัน spring/bounce จริงบนหน้าจอ (US-3 AC1)** — jest mock ของ `react-native-reanimated` รัน callback ของ `withSpring`/`withTiming` แบบ synchronous ทันที ไม่ได้ simulate ระยะเวลา/ความรู้สึกของสปริงจริง และ `createAnimatedComponent` เป็น identity function จึงไม่ได้ merge ค่า animated props (สี, translateY) เข้ากับ native props ที่ render จริง — ตรวจได้แค่ "logic การเริ่ม/จบอนิเมชันถูกจังหวะหรือไม่" ไม่ใช่ "ภาพเคลื่อนไหวลื่นไหลสวยงามหรือไม่" ต้องอาศัยอุปกรณ์จริง
4. **ความแม่นยำของ tap-target ตามรูปทรง SVG จริง (US-2 AC2)** — jest test-renderer เรียก event handler ตรงเมื่อ `fireEvent.press`/`fireEvent(el, eventName)` โดยไม่ได้คำนวณตำแหน่งสัมผัสจริงบนพิกัดหน้าจอเทียบกับรูปทรง polygon จึงยืนยัน "กดจังหวัดเล็กอย่างสมุทรสงครามแล้วไม่กดโดนจังหวัดข้างเคียงบนหน้าจอจริง" ไม่ได้ 100% ต้องอาศัยอุปกรณ์จริง
5. **T32 long-press → tooltip (ผูกกับ US-2)** — พบว่า `react-native-svg` implement `onPress`/`onLongPress` ผ่านกลไก native touch-responder ของตัวเอง ไม่ได้ forward เป็น prop ที่เรียกตรงได้ง่ายๆ ผ่าน `fireEvent(element, 'longPress')` (ยืนยันแล้วว่า `.props.onLongPress` เป็น `undefined` บน element ที่ query ได้ แม้ JSX จะเซ็ตไว้จริง และ `fireEvent` เป็น no-op เงียบๆ) — เขียน test ไว้เป็น `it.skip` พร้อมคอมเมนต์อธิบายใน `map3d.test.tsx` แทนที่จะลบทิ้งเฉยๆ เพื่อให้เห็น intent ชัดเจนว่าต้องทดสอบบนอุปกรณ์จริงเท่านั้น โค้ดที่เกี่ยวข้อง (`Map3D.tsx`/`ProvinceTile3D.tsx`) ตรวจด้วยการอ่านโค้ดแล้วตรงตาม spec
6. **การ persist ข้อมูลลง `expo-sqlite` จริงบนดิสก์ (US-4 AC4 บางส่วน)** — ทุก integration test ใช้ manual mock ของ `src/storage/db.ts` (in-memory) แทน `expo-sqlite` จริง เพราะเป็น native module รันใน jest ไม่ได้ (เหตุผลเดียวกับที่ programmer ระบุไว้ใน dev-notes.md ข้อ 9 ที่ไม่เขียน unit test ให้ `db.ts`) — ยืนยันได้แค่ "storage contract/CRUD ถูกเรียกใช้ถูกต้อง" ไม่ใช่ "sqlite เขียนไฟล์ลงดิสก์จริงและอ่านกลับได้ถูกต้อง 100%"

## หมายเหตุเพิ่มเติมสำหรับทีม (ไม่ใช่บั๊ก)

- ปุ่ม "+ เพิ่มบันทึกใหม่" ใน `ProvinceDetailScreen.tsx` แสดงเฉพาะตอนที่จังหวัดมี entry อยู่แล้ว (`provinceEntries.length > 0`) — ถ้ายังไม่มี entry เลย จะไม่เห็นปุ่มนี้ที่ด้านบน แต่จะเห็นปุ่มข้อความเดียวกันใน empty state แทน ผลลัพธ์ตรงตาม AC ทุกกรณี (ไม่ใช่ dead-end) แต่ตำแหน่ง/เงื่อนไขการแสดงปุ่มไม่ได้เขียนชัดเจนใน requirements.md — แจ้งไว้เผื่อ PM/UIUX ต้องการ verify ว่าตรงกับ design-spec.md หรือไม่

## เครื่องมือ/ไฟล์ที่ Tester เพิ่มเข้ามา (ไม่ได้แก้โค้ดหลักใน `src/screens`, `src/components`, `src/storage`, `src/utils`, `src/data`, `src/navigation`, `App.tsx` เลย)

- `package.json`: เพิ่ม devDependency `@testing-library/react-native`, เพิ่ม jest `moduleNameMapper` (mock `react-native-reanimated`/`react-native-worklets` ตามเอกสารทางการของ library) และ `setupFiles`
- `jest.setup.js` (ใหม่): mock `expo-sqlite`, `expo-image-picker`, `@react-native-community/datetimepicker` สำหรับ test environment เท่านั้น
- `src/storage/__mocks__/db.ts` (ใหม่): manual mock ของ storage layer (in-memory) ใช้แทน `expo-sqlite` จริงในการทดสอบ
- `src/__tests__/integration/*.test.ts(x)` (ใหม่ 9 ไฟล์, 44 tests): dataset, map3d, homeScreen, addEntryScreen, provinceDetailScreen, statsScreen, map2dValidationScreen, journalContext, photoPicker

---

# รอบ 2: Landmark Check-in & Supabase Integration (US-8 – US-15)

> เขียนต่อท้ายรายงานรอบแรกโดยไม่แก้ไขเนื้อหาด้านบน ตามขอบเขตงานของ Tester

## สรุปรอบนี้

**Automated test run (รวมทั้งโปรเจกต์ หลังเพิ่มชุดทดสอบของ Tester รอบนี้):**
Total: 129 | Pass: 128 | Skip: 1 (T32 long-press, ข้อจำกัดเดิมจากรอบ 1 ไม่เกี่ยวกับรอบนี้) | Fail: 0

- **ของ programmer เอง (baseline ก่อน Tester เพิ่มอะไร):** 21 test suites, 119 tests (118 pass, 1 skip เดิม) — รันซ้ำแล้วผ่านครบตามที่ dev-notes.md อ้างไว้ ไม่มี regression
- **ของ Tester เพิ่มใหม่ในรอบนี้ (independent, เขียนขึ้นเองจาก requirements.md ไม่ใช่การรันซ้ำของ programmer):** 4 ไฟล์ใหม่ใน `src/__tests__/qa-round2/`, รวม 10 tests, **ผ่านทั้งหมด**
  - `syncLifecycle.test.tsx` (3 tests) — mount `SyncProvider` จริงเป็นครั้งแรก (ไม่มี test ใดของ programmer เคย mount `src/sync/SyncContext.tsx` เลย แม้แต่ unit test) ยืนยัน badge บนหน้าจอจริงเปลี่ยนจาก pending → synced/retry-issue อัตโนมัติ และรูปภาพ local URI ถูกแทนที่ด้วย cloud URL แบบไม่ upload ซ้ำ
  - `provinceMasterLiveMap.test.tsx` (2 tests) — mount `HomeScreen` จริง ขับ check-in ผ่าน context ระหว่างจอยังเปิดอยู่ ยืนยันเอฟเฟกต์ Province Master ขึ้น/หายสดบนแผนที่โดยไม่ต้องออกจากหน้าจอ (ไม่มี test ของ programmer ครอบคลุมจุดนี้เลย — ตรวจสอบด้วย grep แล้วไม่พบการอ้างอิง "ครบ Province Master"/"isJustMastered" ในชุดทดสอบเดิมของ programmer)
  - `emailLinkIntegrity.test.tsx` (3 tests) — seed entries/check-ins จริงแล้วยืนยันว่าไม่หาย/ไม่เปลี่ยนหลัง link email สำเร็จหรือ link ล้มเหลว และยืนยันข้อความ error ที่ผู้ใช้เห็นจริงบนจอ (ไม่ใช่แค่ error code ระดับ service ที่ authService.test.ts ตรวจอยู่แล้ว)
  - `migrationNonBlocking.test.tsx` (2 tests) — mount `AuthProvider` + `StatsScreen`/`AddEntryScreen` จริง ยืนยันจำนวน entry บนหน้าสถิติไม่เปลี่ยนข้าม migration และผู้ใช้เพิ่ม entry ใหม่ได้ระหว่างที่ migration ยัง "ค้าง" อยู่กับ entry เก่าบางตัว (จำลองด้วย gate promise) โดยไม่กระทบข้อมูลเดิม

**Static checks รอบนี้:**
- `npx tsc --noEmit` — ผ่าน (0 errors)
- `npx expo export --platform android` — bundle สำเร็จ 1529 modules (ตรงกับที่ dev-notes.md อ้างไว้)

**High severity bugs รอบนี้: ไม่พบ.** พบ 1 ข้อสังเกตเชิง UX/logic ระดับ Low (ไม่ fail AC ใด — ดู "ข้อสังเกต" ท้ายหัวข้อ US-14 ด้านล่าง)

**ข้อจำกัดสภาพแวดล้อมที่สำคัญที่สุดของรอบนี้ (ตามที่ขอบเขตงานระบุไว้ล่วงหน้า):** ไม่มี Supabase project จริง, ไม่มีอุปกรณ์จริง/เครือข่ายจริง — ทุกอย่างทดสอบผ่าน mocked Supabase client (`src/lib/__mocks__/supabaseClient.ts`) และ mocked db (`src/storage/__mocks__/db.ts`) เท่านั้น ตามที่ requirements.md/PM กำหนดไว้แล้วว่าเป็นขอบเขตที่ยอมรับได้ของรอบนี้ ไม่ใช่ gap ที่ทำให้ AC ใด FAIL — รายละเอียดสิ่งที่ยืนยันไม่ได้จริงอยู่ในหัวข้อ Coverage gaps รอบ 2 ท้ายรายงาน

---

## รายละเอียดตาม User Story (รอบ 2)

### US-8: ดูรายการ Landmark แนะนำประจำจังหวัดและเช็คอิน
- [x] AC1: ProvinceDetailScreen แสดงรายการ Landmark ของจังหวัดจาก seed dataset (สูงสุด 3–5 รายการ) พร้อมชื่อ — **PASS**
  - `src/__tests__/integration/landmarkCheckin.test.tsx` "lists landmarks with a progress indicator for a curated (pilot) province": ยืนยันชื่อ landmark จริง (เช่น "หาดไร่เลย์") ปรากฏบนจอสำหรับจังหวัดนำร่อง (กระบี่)
  - ตรวจโค้ด `src/data/thailand-landmarks.ts`: ทั้ง 8 จังหวัดนำร่องมี landmark 3–5 แห่งตามคำตัดสิน PM ประเด็น 5 พอดี, `provinceId` ตรงกับ `thailand-provinces.ts` จริง (ตรวจ cross-reference ด้วยมือครบทั้ง 8 จังหวัด ไม่มี id หลุด)
- [x] AC2: ปุ่ม/สวิตช์ check-in toggle visited/not-visited และ persist ทันที (ปิดเปิดแอปยังอยู่) — **PASS**
  - `landmarkCheckin.test.tsx` "toggling a landmark switch persists immediately and updates the progress count": กด switch แล้วยืนยันค่าจริงใน storage mock (`dbMock.__getCheckinStore()`) เปลี่ยนทันทีโดยไม่ต้อง refresh เพิ่ม
  - **ข้อจำกัดเดียวกับ US-4 AC4 ของรอบ 1:** ยืนยันได้แค่ "storage contract ถูกเรียกถูกต้อง" ผ่าน mock ของ `db.ts` ไม่ใช่ `expo-sqlite` เขียนไฟล์ลงดิสก์จริง (native module รันใน jest ไม่ได้)
- [x] AC3: progress indicator "เช็คอินแล้ว X/Y แห่ง" อัปเดตทันทีเมื่อ toggle — **PASS**
  - `landmarkCheckin.test.tsx`: ยืนยันข้อความเปลี่ยนจาก "เช็คอินแล้ว 0/3 แห่ง" → "1/3" → "2/3" ทีละสเต็ปตามลำดับการกดจริง
- [x] AC4: จังหวัดไม่มีข้อมูล Landmark → empty state "ยังไม่มีข้อมูลสถานที่แนะนำ" ไม่ error — **PASS**
  - `landmarkCheckin.test.tsx` "shows the not-curated empty state...": ทดสอบกับจังหวัด `amnat-charoen` (1 ใน 68 จังหวัดที่ยังไม่มี seed data) ยืนยันข้อความ empty state ปรากฏ ไม่มี error/หน้าขาว
  - ตรวจโค้ด `EmptyStateLandmarks.tsx`: ไม่มี error boundary trigger ใดๆ, render เป็น static message เสมอเมื่อ `landmarks.length === 0`

### US-9: ได้รับตราสัญลักษณ์ Province Master เมื่อเช็คอินครบทุก Landmark
- [x] AC1: เช็คอินครบทุกแห่ง (และมี ≥1 แห่ง) → แสดง "Province Master ⭐" ทันที — **PASS**
  - `landmarkCheckin.test.tsx` "shows the Province Master badge once every landmark is checked in...": เช็คอินครบ 3/3 ของกระบี่ทีละแห่งแล้วยืนยัน badge ปรากฏทันทีในรอบ render เดียวกัน (ไม่ต้อง refresh หน้า)
- [x] AC2: ยกเลิกเช็คอินจนไม่ครบ → badge หายทันที (คำนวณสดไม่ค้าง) — **PASS**
  - เทสเดียวกันข้างต้น: toggle กลับ 1 แห่งแล้วยืนยัน `queryByText('Province Master ⭐')` เป็น `null` ทันที
  - ตรวจโค้ด `utils/landmarkDerived.ts` `isProvinceMaster()`: คำนวณจาก `progress.checkedInCount === progress.totalCount` สดทุกครั้ง ไม่มี cache/flag ค้าง — ยืนยันตรงกับพฤติกรรมที่ทดสอบได้จริง
- [x] AC3: จังหวัดไม่มี landmark เลย (0 แห่ง) → ไม่แสดง badge นี้ — **PASS**
  - ตรวจโค้ด: `isProvinceMaster` return `false` เมื่อ `totalCount === 0` (เงื่อนไข `progress.totalCount > 0 && ...`) — ยืนยันด้วย unit test ของ programmer เอง (`landmarkDerived.test.ts`) และตรวจ cross ด้วยการอ่าน `ProvinceDetailScreen.tsx`/`HomeScreen.tsx` ว่าทั้งสองจุดเรียกฟังก์ชันเดียวกันนี้จริง ไม่มี logic ซ้ำซ้อนที่อาจ diverge

### US-10: เลือก Landmark ที่ไปเยือนตอนเพิ่มบันทึกทริป (auto check-in)
- [x] AC1: AddEntryScreen มี field เลือก Landmark (optional) เฉพาะของจังหวัดที่กำลังเพิ่ม entry — **PASS**
  - `src/__tests__/integration/addEntryLandmark.test.tsx` "shows a landmark picker defaulting to ไม่ระบุ...": ยืนยัน field ปรากฏพร้อมตัวเลือกเฉพาะ landmark ของภูเก็ตเท่านั้น (ไม่มี landmark จังหวัดอื่นหลุดมา) และ default เป็น "ไม่ระบุ" (ไม่บังคับเลือก)
- [x] AC2: จังหวัดไม่มีข้อมูล Landmark → field ถูกซ่อน/disabled พร้อมคำอธิบาย ไม่ใช่ dropdown ว่างเปล่า — **PASS**
  - `addEntryLandmark.test.tsx` "hides the landmark field entirely...": ทดสอบกับ `amnat-charoen` ยืนยัน field "เช็คอินสถานที่ (ถ้ามี)" ไม่ปรากฏเลย (ซ่อนทั้งหมดตามที่ dev-notes.md เลือกไว้ ไม่ใช่ disabled state ที่มองเห็น — ทั้งสองแบบตอบ AC ได้ ("ซ่อนหรือแสดงสถานะ disabled") จึงไม่ fail)
- [x] AC3: บันทึก entry ที่เลือก Landmark ไว้ → check-in สถานะ visited อัตโนมัติ ไม่ต้องกดซ้ำ — **PASS**
  - `addEntryLandmark.test.tsx` "auto checks-in the selected landmark when the entry is saved": เลือก "หาดป่าตอง" แล้วบันทึก ยืนยัน `landmark_checkins` mock มี record `visited: true` โดยไม่มี interaction เพิ่มเติมที่ ProvinceDetailScreen
- [x] AC4: บันทึก entry ได้ตามปกติแม้ไม่เลือก Landmark ใดๆ (ไม่กระทบ flow เดิมของ US-4) — **PASS**
  - `addEntryLandmark.test.tsx` "saves normally without touching any check-in when no landmark is selected": ยืนยัน entry ถูกบันทึกปกติและ `checkinStore` ว่างเปล่า (ไม่มีการสร้าง record โดยไม่ตั้งใจ)

### US-11: เข้าใช้แอปทันทีด้วย Anonymous Auth และผูก Email ภายหลัง
- [x] AC1: เปิดแอปครั้งแรก → สร้าง Anonymous session อัตโนมัติ ใช้ฟีเจอร์ได้ทันที — **PASS**
  - `src/auth/AuthContext.test.tsx` "bootstraps an anonymous session and shows the one-time warning modal on first launch": ยืนยัน `session.isAnonymous === true` หลัง bootstrap โดยไม่ต้องกรอกอะไร
  - `src/auth/authService.test.ts`: ครอบคลุม fallback เป็น local-only id เมื่อ Supabase unconfigured/throw — ไม่มีทาง block การใช้งาน
- [x] AC2: มีปุ่ม "ผูกกับอีเมล" ในหน้าตั้งค่า, ข้อมูลเดิม (entries/check-ins) ยังอยู่ครบหลัง link สำเร็จ — **PASS**
  - `src/__tests__/qa-round2/emailLinkIntegrity.test.tsx` "does not delete/alter any entry or check-in row as a side effect of a successful email link" **(เขียนใหม่โดย Tester)**: seed 1 entry + 1 check-in จริงไว้ก่อน แล้ว link email สำเร็จ ยืนยัน `dbMock.__getStore()`/`__getCheckinStore()` มีจำนวน/ค่าเดิมทุกอย่างหลัง link — เป็นการพิสูจน์ตรงตามคำกล่าวอ้างของ AC ("ข้อมูลที่มีอยู่ทั้งหมดยังคงอยู่ครบ") ที่ test เดิมของ programmer (`settingsScreen.test.tsx`) ไม่ได้ seed ข้อมูลจริงไว้ตรวจสอบจุดนี้
- [x] AC3: ยังไม่ผูกอีเมล → แสดงคำเตือนความเสี่ยงชัดเจนในหน้าตั้งค่า/โปรไฟล์ — **PASS**
  - `src/__tests__/integration/settingsScreen.test.tsx` (programmer) + ยืนยันซ้ำใน `emailLinkIntegrity.test.tsx` ว่า banner กลับมาแสดงอีกครั้งหลังกด "ยกเลิก" จากฟอร์มที่ link ไม่สำเร็จ (ไม่ใช่หายไปถาวรผิดที่ผิดทาง)
  - ตรวจโค้ด `App.tsx`/`DataLossWarningModal.tsx`: one-time modal ผูกกับ `AuthContext.showAnonWarningModal`, `onRequestClose` เป็น no-op กัน Android back bypass — ตรงตามคำตัดสิน PM ประเด็น 6 ข้อ 1
- [x] AC4: link ล้มเหลว (email ซ้ำ/รหัสผ่านไม่ผ่าน) → error message สื่อความหมาย, anonymous session เดิมยังใช้ได้ ไม่เสียข้อมูล — **PASS**
  - `emailLinkIntegrity.test.tsx` **(ใหม่)**: ยืนยันข้อความ error ตัวเป๊ะๆ ที่ผู้ใช้เห็นจริงบนจอทั้ง 2 กรณี — "อีเมลนี้ถูกใช้งานแล้ว ลองใช้อีเมลอื่น หรือเข้าสู่ระบบด้วยอีเมลนี้แทน" (duplicate-email) และ "รหัสผ่านไม่ตรงตามเงื่อนไข กรุณาตั้งรหัสผ่านใหม่" (weak-password) เป็นข้อความคนละอันแยกกันชัดเจน ไม่ใช่ error ทั่วไปข้อความเดียวกัน และยืนยัน entries/check-ins ไม่ถูกแตะต้องเลยหลัง fail ทั้งสองกรณี
  - เดิม `authService.test.ts` ของ programmer ตรวจแค่ error **code** ระดับ service เท่านั้น ยังไม่เคยยืนยันข้อความจริงที่ render บนจอ — จุดนี้เป็นสิ่งที่ Tester เพิ่มเข้ามาปิด gap

### US-12: ซิงค์ข้อมูลบันทึกทริปและเช็คอิน Landmark ขึ้น Supabase แบบ Offline-First
- [x] AC1: เพิ่ม/แก้ไข/ลบ entry หรือ toggle check-in ต้องเขียนลง SQLite local ก่อนเสมอ แสดงผลทันทีไม่รอ Supabase — **PASS**
  - ยืนยันด้วยโค้ด: `JournalContext.addEntry`/`CheckinContext.setCheckedIn` เรียก `db.createEntry`/`db.setLandmarkVisited` แล้ว `refresh()` ทันที ไม่มีการ `await` sync ใดๆ ก่อน resolve — sync (`SyncProvider`) เป็นกลไกแยกที่ทำงานเบื้องหลังเท่านั้น ไม่ได้อยู่ใน call path ของการบันทึก
  - `addEntryLandmark.test.tsx`/`landmarkCheckin.test.tsx`: ทุกเทสรัน "offline" (ไม่มี `SyncProvider` mount เลยในเทสเหล่านั้น) แล้ว entry/check-in ก็ยังบันทึก+แสดงผลได้ปกติ 100% — พิสูจน์ทางอ้อมว่าการบันทึกไม่ผูกกับ sync
- [x] AC2: เมื่อมีเน็ต ระบบ sync รายการ pending ขึ้น Supabase อัตโนมัติในพื้นหลัง ไม่บล็อกหน้าจออื่น — **PASS**
  - `src/__tests__/qa-round2/syncLifecycle.test.tsx` "automatically flips an unsynced entry to synced...on the real ProvinceDetailScreen list without any manual pull-to-refresh" **(ใหม่ทั้งหมด — ไม่มี test ใดของ programmer เคย mount `SyncProvider` จริงมาก่อน แม้แต่ unit test เดียว)**: seed entry pending 1 รายการ, mount `JournalProvider`+`CheckinProvider`+`SyncProvider`+`ProvinceDetailScreen` จริง แล้วยืนยันว่า sync เกิดขึ้นเองจาก mount-time effect ของ `SyncProvider` (ไม่มีการกดปุ่ม sync ใดๆ) และหน้าจอยังคง render/interactive ปกติระหว่างนั้น
- [x] AC3: LWW ด้วย `updated_at`, ฝั่งแพ้ถูกเขียนทับด้วยฝั่งชนะทั้งสองเครื่องหลัง sync รอบถัดไป ไม่ error ไม่ค้าง — **PASS**
  - ยืนยันแล้วในระดับ unit ของ programmer (`syncEngine.test.ts` — remote-wins overwrite local, local-wins push) ซึ่งครอบคลุมดีอยู่แล้ว ไม่พบข้อบกพร่องจากการอ่านโค้ด `pickWinner`/`syncPendingEntries`/`syncPendingCheckins` เพิ่มเติม (ดู "ข้อสังเกตเชิงโค้ด" ด้านล่างสำหรับ edge case ที่ตรวจแล้วไม่พบปัญหา)
  - **ข้อสังเกตเชิงโค้ดที่ตรวจแล้วไม่พบบั๊ก:** `getSyncStatus()` เช็ค `retryCount >= 3` **ก่อน** เช็ค `syncedAt` — หมายความว่า record ที่ไม่เคย sync สำเร็จเลยแต่ fail ติดต่อกันครบ 3 ครั้งจะแสดง "retry-issue" ไม่ใช่ "pending" ซึ่งตรงตามเจตนาของคำตัดสิน PM ประเด็น 9 (บอกผู้ใช้ว่ามีปัญหาจริง ไม่ใช่แค่ "ยังไม่ถึงคิว") ไม่ใช่บั๊ก
- [x] AC4: มีสถานะบอก pending/synced ชัดเจน ไม่ทำให้เข้าใจผิดว่าข้อมูลหาย — **PASS**
  - `syncLifecycle.test.tsx` "reaches retry-issue in the UI after repeated sync failures for the same record" **(ใหม่)**: ยืนยัน tooltip ข้อความจริงที่ผู้ใช้เห็นเมื่อกดไอคอน sync status เปลี่ยนเป็น "จะลองใหม่อัตโนมัติเมื่อมีเน็ต" หลัง retryCount ครบ 3 — ปิด gap ที่ test เดิมของ programmer (`syncEngine.test.ts`) ตรวจแค่ค่า `retryCount` ในฐานข้อมูล ไม่เคยตรวจ badge/tooltip ที่ render จริงบนจอ
- [x] AC5 (ขอบเขตการทดสอบ): ทดสอบผ่าน mocked/local Supabase client เท่านั้น — **PASS (ปฏิบัติตามจริง)** ไม่มี production project ในสภาพแวดล้อมนี้ ตรงตามที่ AC ระบุไว้เอง

### US-13: อัปโหลดรูปภาพทริปขึ้น Supabase Storage
- [x] AC1: รูปที่เลือกยังเก็บ local URI ไว้ก่อนเสมอ แสดงผลได้ทันทีแบบ offline-first — **PASS (ยืนยันด้วยโค้ด + unit test เดิม; ไม่สามารถ freeze transient state ผ่าน UI ได้ในสภาพแวดล้อมนี้ — ดูหมายเหตุ)**
  - ตรวจโค้ด `PhotoPicker.tsx`/`AddEntryScreen.tsx`: `photoUris` ถูก set เข้า local state และส่งเข้า `db.createEntry` ทันทีตอนบันทึก โดยไม่มี dependency ใดๆ กับ `getSupabaseClient()`/network เลยในเส้นทางการบันทึก
  - `src/sync/photoUpload.test.ts` (programmer) "keeps the local URI and reports failure (for retry) when the upload errors": ยืนยัน local URI ไม่ถูกลบทิ้งเมื่อ upload ล้มเหลว
  - **หมายเหตุ:** พยายามเขียน UI-level test ใหม่ (`qa-round2/syncLifecycle.test.tsx`) เพื่อจับภาพ "ยังเห็นรูป local ก่อน sync เสร็จ" แต่พบว่าสภาพแวดล้อม jest (mock client resolve ทันทีแบบ microtask, ไม่มี network delay จริง) ทำให้ sync จบภายใน tick เดียวกับ mount เสมอ จึง **freeze สถานะ transient นี้ผ่าน UI ไม่ได้จริง** ในเครื่องมือนี้ — ปรับ test ให้ตรวจเฉพาะผลลัพธ์ปลายทาง (AC2/AC3) แทน และบันทึกไว้เป็น coverage gap แทนที่จะฝืนยืนยันเป็น PASS ด้วยหลักฐานที่ไม่หนักแน่นพอ
- [x] AC2: มีเน็ต+session → รูปที่ยังไม่เคยอัปโหลดถูกอัปโหลดขึ้น bucket `trip-photos` อัตโนมัติในพื้นหลัง แล้วบันทึก URL cloud กลับเข้า entry — **PASS**
  - `qa-round2/syncLifecycle.test.tsx` "renders the entry with its local photo URI wired up..., then swaps to the cloud URL after the background sync" **(ใหม่)**: mount `SyncProvider` จริง (ไม่ใช่แค่เรียกฟังก์ชัน `uploadPendingPhotos` ตรงๆ แบบที่ `photoUpload.test.ts` ทำ) ยืนยัน entry ในหน้าจอจริงมี `photoUris[0]` เปลี่ยนเป็น URL cloud อัตโนมัติหลัง mount โดยไม่มี user action
- [x] AC3: อัปโหลดล้มเหลว → entry/local URI ยังใช้ได้ปกติ, retry ครั้งถัดไปไม่สร้างรูปซ้ำ — **PASS**
  - `photoUpload.test.ts` (programmer): ครอบคลุมครบทั้ง "fail แล้วคง local URI" และ "mixed local+cloud ไม่ upload ซ้ำ" อยู่แล้วในระดับ unit
  - `qa-round2/syncLifecycle.test.tsx`: เพิ่มการยืนยันระดับ integration ว่าเรียก `triggerSync()` รอบที่สองแล้ว `stub.__internals.upload` **ยังถูกเรียกแค่ 1 ครั้งรวม** (ไม่ re-upload รูปที่กลายเป็น cloud URL แล้ว) ผ่าน provider stack จริง
- [x] AC4 (ขอบเขตการทดสอบ): ทดสอบผ่าน mocked/local Supabase Storage client เท่านั้น — **PASS (ปฏิบัติตามจริง)**

### US-14: เห็น Visual Feedback พิเศษบนแผนที่ 3 มิติสำหรับจังหวัดที่เช็คอิน Landmark ครบ
- [x] AC1: จังหวัด Province Master แสดงเอฟเฟกต์ต่างชัดเจนจาก unlocked ทั่วไป (ขอบทอง/ดาว) — **PASS**
  - `src/__tests__/qa-round2/provinceMasterLiveMap.test.tsx` "updates the krabi tile to Province Master live..." **(ใหม่ทั้งหมด — grep ยืนยันแล้วว่า test ของ programmer ไม่มีที่ใดอ้างอิง "ครบ Province Master"/Province Master บน HomeScreen/Map3D เลยแม้แต่ครั้งเดียว)**: เช็คอินครบทุก landmark ของกระบี่ผ่าน `CheckinContext` จริง แล้วยืนยัน accessibility label ของ tile เปลี่ยนมามี "ครบ Province Master" ต่อท้าย
  - ตรวจโค้ด `ProvinceTile3D.tsx`: เพิ่ม `stroke={isProvinceMaster ? COLORS.gold : '#FFFFFF'}` หนาขึ้น + ดาว ⭐ SVG Text — ภาพที่ต่างจาก tile ปกติชัดเจนตามโค้ด (ยืนยัน "ความต่างของสี/รูปแบบจริงบนจอ" เต็มรูปแบบไม่ได้เพราะข้อจำกัด reanimated mock เดียวกับ US-1 AC2/AC3 ของรอบ 1)
- [x] AC2: unlocked ทั่วไปที่ยังไม่ครบ/ไม่มี landmark ยังแสดง unlocked ปกติ ไม่ปนกับ Province Master — **PASS**
  - `provinceMasterLiveMap.test.tsx`: ยืนยัน "ภูเก็ต" (มี landmark แต่ยังไม่ครบ) ไม่มี label "ครบ Province Master" ปนมาขณะที่ "กระบี่" กลายเป็น master แล้ว — ไม่มีการ bleed-over ข้ามจังหวัด
- [x] AC3: เปลี่ยนเป็น Province Master ระหว่างอยู่ในแอป → กลับมาหน้าแผนที่เห็นอัปเดตถูกต้องโดยไม่ต้องปิดเปิดแอป — **PASS**
  - `provinceMasterLiveMap.test.tsx`: ทดสอบโดย **ไม่ unmount/remount `HomeScreen` เลย** ระหว่างเช็คอินแต่ละครั้ง — พิสูจน์ตรงตัวอักษรของ AC ("ไม่ต้องปิดเปิดแอปใหม่") ซึ่งเป็นจุดที่ test เดิมของ programmer ไม่เคยตรวจเลย (ไม่มี test เดิมที่ mount `HomeScreen` + `CheckinContext` คู่กันแล้วขับ state เปลี่ยนสด)
- [x] AC4: legend อัปเดตมีคำอธิบาย Province Master เพิ่ม — **PASS**
  - ตรวจโค้ด `Legend.tsx`: มีรายการที่ 3 ("เที่ยวครบทุกที่แนะนำ" พร้อม swatch ขอบทอง+ดาว) เพิ่มจากเดิม 2 รายการของรอบ 1

**ข้อสังเกต (Low severity, ไม่ fail AC ใด — ส่งต่อให้ PM/UIUX พิจารณา):** จากการเขียนเทสข้างต้น พบว่าสถานะ Province Master **ไม่ผูกกับสถานะ unlocked ของจังหวัด (`isVisited`)** เลย เพราะ check-in (`landmark_checkins` table/`CheckinContext`) เป็นคนละ table/context จาก journal entries (`entries` table/`JournalContext`) โดยสิ้นเชิงตามการออกแบบที่ตั้งใจแยก (dev-notes.md การตัดสินใจทางเทคนิคข้อ 7) ผลคือ **ผู้ใช้เช็คอิน Landmark ครบของจังหวัดหนึ่งได้โดยไม่เคยเพิ่ม journal entry เลยสักรายการ** ทำให้จังหวัดนั้นแสดงเป็น tile "locked" สีเทอปกติ **พร้อมขอบทอง+ดาว Province Master ปนอยู่ด้วย** (ยืนยันจริงด้วยเทส `provinceMasterLiveMap.test.tsx` "does not require the province to be journal-unlocked...") และหน้า ProvinceDetailScreen จะโชว์ badge "Province Master ⭐" คู่กับ empty state "ยังไม่มีบันทึกของจังหวัดนี้" พร้อมกัน — ไม่มี AC ใดใน US-9/US-14 ห้ามชัดเจนกรณีนี้ (จึงไม่ mark เป็น FAIL) แต่เป็นภาพที่ขัดกันในสายตาผู้ใช้ (มงกุฎทองบน tile สีเทา, badge ความสำเร็จบนหน้าที่ว่างเปล่า) แนะนำให้ PM ตัดสินใจว่าควรบังคับให้ Province Master ต้องมี ≥1 journal entry ของจังหวัดนั้นด้วยหรือไม่

### US-15: Migrate ข้อมูล Local-Only เดิม (v1) ขึ้น Cloud เมื่อได้บัญชี
- [x] AC1: เปิดแอปเวอร์ชันใหม่ครั้งแรก + สร้าง Anonymous session → entries เดิมทั้งหมดถูก mark pending sync อัตโนมัติ ไม่ต้องกดอะไรเพิ่ม — **PASS**
  - `src/sync/migration.test.ts` (programmer, unit-level) + `src/auth/AuthContext.test.tsx` (programmer, เรียก `migrateLegacyEntries` จริงตอน bootstrap) ครอบคลุมอยู่แล้ว
  - `src/__tests__/qa-round2/migrationNonBlocking.test.tsx` **(ใหม่)** ยืนยันซ้ำในระดับเต็มสแต็ก (`AuthProvider`+`JournalProvider`+`StatsScreen` จริง) ว่า legacy entries ทั้ง 3 รายการที่ seed ไว้ถูก stamp `updatedAt` (= เข้าคิว pending) โดยอัตโนมัติหลัง mount โดยไม่มี user action ใดๆ
- [x] AC2: จำนวน entry ก่อน/หลัง migrate เท่ากันเป๊ะ (ไม่หาย/ไม่ซ้ำ) ตรวจสอบได้จากหน้าสถิติ — **PASS**
  - `migrationNonBlocking.test.tsx` "does not change the entry count shown on the Stats screen across a migration run" **(ใหม่ — เป็นเทสแรกที่ตรวจ AC นี้ผ่านหน้าจอ `StatsScreen` จริงแทนการเช็ค array length ตรงๆ แบบที่ `migration.test.ts` ทำ)**: ยืนยันข้อความ "บันทึกทั้งหมด 3 รายการ" บนหน้าสถิติจริงตรงกับจำนวนที่ seed ไว้ ทั้งก่อนและหลัง migration effect ทำงานเสร็จ
- [x] AC3: migrate ไม่บล็อกการใช้งาน (เพิ่ม entry ใหม่ระหว่าง migrate ได้), ล้มเหลวบางส่วน → resume ได้โดยไม่เสียข้อมูลเดิม — **PASS**
  - `src/sync/migration.test.ts` (programmer): พิสูจน์ resume/idempotency ที่ระดับฟังก์ชันไว้ครบแล้ว (รวมกรณี "legacy row ใหม่โผล่มาทีหลัง")
  - `migrationNonBlocking.test.tsx` "lets the user add a brand-new entry while a legacy row is still being migrated" **(ใหม่)**: จำลอง migration ที่ "ค้าง" จริงด้วย gate promise บน legacy entry 1 รายการ (เลียนแบบเน็ตหลุดกลาง migrate) แล้วเพิ่ม entry ใหม่ผ่าน `AddEntryScreen` จริงระหว่างนั้น ยืนยัน entry ใหม่บันทึกสำเร็จปกติ (รวมเป็น 4 รายการ, ไม่มีรายการไหนหาย) แล้วปลด gate ยืนยัน legacy row ที่ค้างไว้ migrate ต่อสำเร็จภายหลังโดยไม่กระทบข้อมูลอื่น

---

## บั๊กที่พบ (รอบ 2)

**ไม่พบบั๊กใหม่ที่ทำให้ AC ใดของ US-8–US-15 FAIL** จากทั้งการรัน automated test (128/129 pass) และการอ่านโค้ดของทุกไฟล์ที่เปลี่ยนแปลง/เพิ่มใหม่ในรอบนี้ (`supabaseClient.ts`, `db.ts` ส่วนขยาย, `syncEngine.ts`, `photoUpload.ts`, `migration.ts`, `authService.ts`, `AuthContext.tsx`, `CheckinContext.tsx`, `SyncContext.tsx`, ทุก component/screen ใหม่)

ดู **"ข้อสังเกต (Low severity)"** ในหัวข้อ US-14 ด้านบน — เป็นข้อสังเกตเชิง UX/ความสอดคล้องของแนวคิด (Province Master ไม่ผูกกับสถานะ unlocked) ไม่ใช่บั๊กที่ขัดกับ AC ข้อใดที่เขียนไว้ตรงๆ จึงไม่นับเป็นบั๊ก แต่รายงานไว้ให้ PM ตัดสินใจ

**ไม่มีบั๊ก High severity ในรอบนี้เช่นกัน** (สอดคล้องกับ dev-notes.md ที่ programmer รายงานว่าไม่มีการลด scope เองในส่วน P0/P1 ทั้งหมด T33–T57)

---

## Coverage ที่ยังขาด (รอบ 2 — ตรวจไม่ได้ในสภาพแวดล้อมนี้)

1. **T58 performance ของ sync engine กับ pending queue ขนาดใหญ่จริง** — ยืนยันแล้วว่ายังเป็นข้อจำกัดจริงตามที่ dev-notes.md ระบุ (ไม่มีอุปกรณ์/เครือข่ายจริงให้ทดสอบในสภาพแวดล้อมนี้ เหมือน T30 ของรอบ 1) โค้ด `syncPendingEntries`/`syncPendingCheckins` ใช้ sequential `for...of` ต่อ record จริงตามที่ dev-notes.md อธิบาย — ยืนยันด้วยการอ่านโค้ดว่าไม่มี parallel batching แต่ไม่มีวิธี load-test คิวหลักพัน record ให้เห็นผลจริงในเครื่องมือนี้
2. **True network-reconnect (netinfo) แทนการ polling 20 วินาที (US-12 AC2)** — ยืนยันโค้ดแล้วว่าไม่มี `@react-native-community/netinfo` ติดตั้งจริง `SyncContext.tsx` ใช้ `setInterval(triggerSync, 20000)` ตามที่ dev-notes.md ระบุ — ทดสอบใน jest ได้แค่เรียก `triggerSync()` ตรงๆ (ผ่าน captured hook) แทนการรอ interval จริง จึงยืนยัน "เกิด sync ภายใน ~20 วินาทีจริงบนอุปกรณ์หลังต่อเน็ต" ไม่ได้ในเครื่องมือนี้ — ยอมรับตามคำอธิบายของ PM/dev-notes.md ว่าผลลัพธ์ปลายทางเหมือนกัน เพียง latency สูงสุดต่างกัน ไม่ใช่ AC ที่ FAIL
3. **US-13 AC1 transient "local ก่อน sync เสร็จ" ผ่าน UI จริง** — ตามที่อธิบายไว้ในหัวข้อ US-13 ด้านบน: mocked Supabase client ใน jest resolve เร็วเกินกว่าจะ freeze สถานะนี้ให้ assert ได้จริงผ่าน UI queries ยืนยันได้แค่ระดับโค้ด/unit test ของ `photoUpload.ts` แทน
4. **การอัปโหลดขึ้น Supabase Storage/bucket `trip-photos` จริง และ conflict ข้ามอุปกรณ์จริง (US-12/US-13)** — ตามขอบเขตที่ระบุไว้ใน requirements.md เองว่ารอบนี้ทดสอบผ่าน mocked/local client เท่านั้น ยังไม่มี production Supabase project ให้ยืนยันพฤติกรรมเครือข่ายจริง (latency, RLS policy, ขนาดไฟล์จริง, ฯลฯ)
5. **T31/T30 ของรอบ 1** — ยังคงเป็นข้อจำกัดเดิมตามที่รายงานไว้แล้วในส่วนรอบ 1 ด้านบน ไม่มีอะไรเปลี่ยนแปลงจากรอบนี้
6. **การกด Switch/Pressable ของ `LandmarkListItem` ผ่าน `react-native-svg`-based touch หรือ native `Switch` component จริงบนอุปกรณ์** — ทดสอบผ่าน `fireEvent.press`/`Switch` mock ของ RN เท่านั้น (เหมือนข้อจำกัดเดียวกับ T32/US-2 AC2 ของรอบ 1) ไม่ใช่การกดจริงบนอุปกรณ์สัมผัส

## ไฟล์ที่ Tester เพิ่มเข้ามาในรอบนี้ (ไม่ได้แก้โค้ดหลักใดๆ ใน `src/` เลย)

- `src/__tests__/qa-round2/syncLifecycle.test.tsx` (ใหม่, 3 tests) — US-12/US-13 ผ่าน `SyncProvider` จริงเป็นครั้งแรก
- `src/__tests__/qa-round2/provinceMasterLiveMap.test.tsx` (ใหม่, 2 tests) — US-14 ผ่าน `HomeScreen` จริง
- `src/__tests__/qa-round2/emailLinkIntegrity.test.tsx` (ใหม่, 3 tests) — US-11 AC2/AC4 ระดับ UI+data-integrity
- `src/__tests__/qa-round2/migrationNonBlocking.test.tsx` (ใหม่, 2 tests) — US-15 AC2/AC3 ผ่าน `StatsScreen`/`AddEntryScreen` จริง

ไม่มีการแก้ไขไฟล์ใดใน `src/screens`, `src/components`, `src/storage`, `src/utils`, `src/data`, `src/sync`, `src/auth`, `src/lib`, `src/navigation`, `App.tsx`, `package.json`, หรือเอกสารอื่นใดของ programmer ในรอบนี้
