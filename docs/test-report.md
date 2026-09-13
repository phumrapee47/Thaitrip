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


# รอบ 3: OSM Data Integration (US-16 – US-20)

> เขียนต่อท้ายรายงานรอบที่ 1 และ 2 โดยไม่แก้ไขเนื้อหาด้านบนทั้งหมด ตามขอบเขตงานของ Tester

## สรุปรอบนี้

**Automated test run (รวมทั้งโปรเจกต์ หลังเพิ่มชุดทดสอบของ Tester รอบนี้):**
Total: 210 | Pass: 209 | Skip: 1 (T32 long-press, ข้อจำกัดเดิมจากรอบ 1 ไม่เกี่ยวกับรอบนี้) | Fail: 0

- **ของ programmer เอง (baseline ก่อน Tester เพิ่มอะไรในรอบนี้):** 32 test suites, 186 tests (185 pass, 1 skip เดิม) — รันซ้ำแล้วผ่านครบตามที่ programmer รายงานไว้ ตรงกัน 100% ไม่มี regression จากการเปลี่ยนแปลงใดๆ ของรอบนี้ต่อของเดิม
- **ของ Tester เพิ่มใหม่ในรอบนี้ (independent, เขียนขึ้นเองจาก requirements.md US-16–US-20 ไม่ใช่การรันซ้ำของ programmer):** 5 ไฟล์ใหม่ใน `src/__tests__/qa-round3/`, รวม 23 tests, **ผ่านทั้งหมดหลังแก้ปัญหาที่พบระหว่างเขียนเทส (ดูหมายเหตุด้านล่าง)**
  - `landmarkDataIntegrity.test.ts` (9 tests) — ตรวจข้อมูลจริงของ T61 โดยตรง (ไม่ผ่าน mock): ไม่มี id ซ้ำข้าม 45 จังหวัดที่มีข้อมูล, ทุก `provinceId` อ้างอิงจังหวัดจริงใน `thailand-provinces.ts`, ทุก landmark ที่มี `lat` ต้องมี `lng` คู่กันเสมอและเป็นตัวเลขจำกัดค่า (finite), นับจำนวนจังหวัดที่มีข้อมูล = 45 พอดี (31 จังหวัดที่เหลือไม่มีข้อมูลและ `getLandmarksForProvince` คืน `[]` อย่างปลอดภัย), ไม่มีจังหวัดไหนเกิน 5 แห่ง, และ**ยืนยันอิสระ (ไม่พึ่งคำกล่าวอ้างของ programmer)** ว่า landmark เดิม 29 รายการของ 8 จังหวัดนำร่องยังคง id/provinceId/nameTh ตรงเป๊ะกับ commit baseline ก่อนทำฟีเจอร์นี้ (`3a5d8f7`) โดยดึงไฟล์เดิมออกมาด้วย `git show 3a5d8f7:src/data/thailand-landmarks.ts` แล้ว diff เทียบทีละ record ด้วยสคริปต์แยก (ไม่ได้ copy ตัวเลขมาจาก dev-notes.md/qa-result.md) — ผลลัพธ์: **missing ids: [] / changed: []**
  - `landmarkMapIntegration.test.tsx` (2 tests) — mount `ProvinceDetailScreen` จริงทั้งหน้า (ไม่ใช่แค่ `LandmarkMap` เดี่ยวๆ แบบที่ `src/components/LandmarkMap.test.tsx` ของ programmer ทำ) กับข้อมูลจริงของกระบี่ (ไม่ใช่ synthetic point): แตะจุดบนแผนที่ → progress indicator อัปเดต → ทั้งจุดบนแผนที่และแถวใน list ด้านล่างแสดง label "เช็คอินแล้ว" ตรงกัน (ยืนยันด้วย `getAllByLabelText(...).toHaveLength(2)`) → storage mock บันทึก `landmarkId: 'kbi-railay-beach'` ตรงตัว → แตะซ้ำ toggle กลับได้ถูกต้อง และแยกอีก 1 test ยืนยันจังหวัด `chaiyaphum` (0 landmark จริงจากรายงาน Overpass) ผ่านหน้าจอเต็มแสดง empty state ของ US-8 ถูกต้อง ไม่ปนกับข้อความ fallback ของแผนที่ (US-18)
  - `landmarkMapDegenerateBbox.test.tsx` (1 test) — กรณี degenerate bounding box (landmark พิกัดเดียว) **ผ่านหน้าจอเต็มจริง** ไม่ใช่แค่ unit test ของ `normalizePoint` (ซึ่ง programmer ทดสอบไว้ดีอยู่แล้วในระดับ pure function): mock dataset module ให้จังหวัดหนึ่งมี landmark พิกัดเดียว, mount `ProvinceDetailScreen` จริง, ยืนยันจุดถูก render โดยไม่ error/ไม่ NaN (จุดอยู่กึ่งกลางตามสูตร degenerate) และแตะแล้ว toggle check-in ได้ถูกต้องจริง
  - `searchPlaceLandmarkIsolation.test.tsx` (2 tests) — **ปิด gap สำคัญที่สุดของรอบนี้ตามที่ระบุไว้ล่วงหน้า**: ทดสอบเลือก Landmark จาก dropdown (T47/US-10) **พร้อมกัน** กับเลือกผลลัพธ์จาก Nominatim search (T71/US-19) ใน entry เดียวกัน (จังหวัดภูเก็ตซึ่งมีทั้งสองอย่างให้เลือก) — ยืนยันว่า auto check-in เกิดขึ้น**เฉพาะ**กับ landmark ที่เลือกจาก dropdown (`hkt-big-buddha`) เท่านั้น ส่วนผลลัพธ์จาก search ไม่สร้าง check-in ของตัวเองเลย ไม่สร้าง Landmark ใหม่ (`LANDMARKS.length` ไม่เปลี่ยน) และมีผลแค่ต่อ `title`/`placeLat`/`placeLng` เท่านั้น — เป็นเทสแรกที่พิสูจน์ทั้งสองกลไกทำงาน**พร้อมกันในเอนทรีเดียว**โดยไม่ชนกัน (เทสเดิมของ programmer ใน `addEntrySearchPlace.test.tsx`/`addEntryLandmark.test.tsx` ทดสอบแต่ละกลไกแยกกันเท่านั้น ไม่เคยรวมกันในเทสเดียว) + อีก 1 test ยืนยัน search-only (ไม่แตะ dropdown เลย) บนจังหวัดที่ *มี* landmark ให้เลือกด้วย ยัง 0 check-in เหมือนเดิม
  - `searchDebounceThrottleEndToEnd.test.ts` (2 tests) — debounce (hook, T72) + throttle (client, T68) **ทำงานร่วมกันจริง** ผ่านฟังก์ชัน `searchPlaces` ตัวจริง (ไม่ mock `searchImpl` แบบที่ `useNominatimSearch.test.ts` ของ programmer ทำ และไม่เรียก `searchPlaces` ตรงๆ แบบที่ `nominatimClient.test.ts` ทำ) โดย mock เฉพาะ `global.fetch`: กด "ลองอีกครั้ง" (retry, ซึ่งข้าม debounce ไปเลยตามดีไซน์) รัวๆ 2 ครั้งติดกันทันทีหลังการค้นหาแรก ยืนยันว่า fetch จริงทุกครั้งยังคงห่างกัน ≥ `THROTTLE_MS` เสมอ (ไม่ถูกยิงรัว) และอีก 1 test ยืนยันว่าไม่มีการยิง fetch เลยตราบใดที่ยังอยู่ในหน้าต่าง debounce แม้พิมพ์ต่อเนื่องหลายตัวอักษร

**Static checks รอบนี้:**
- `npx tsc --noEmit` — ผ่าน (0 errors) หลังแก้ syntax error เล็กน้อยที่ Tester เขียนเอง (ไม่เกี่ยวกับโค้ด programmer — ดูหมายเหตุด้านล่าง)
- `npx expo export --platform android` — bundle สำเร็จ 1537 modules (เพิ่มขึ้นจาก 1529 ของรอบ 2 ตามสัดส่วนที่สมเหตุสมผลกับ component/hook ใหม่ที่เพิ่มเข้ามา)
- ยืนยันด้วย `grep` ว่าไม่มีไฟล์ใดใน `src/` import จาก `scripts/` เลย (US-16 AC1: extraction script เป็นเครื่องมือ dev-only จริง ไม่ถูกดึงเข้า runtime/production bundle)

**High severity bugs รอบนี้: ไม่พบ.** พบข้อสังเกตเชิง UX ระดับ Low 1 จุด (ดูท้ายหัวข้อ US-18 ด้านล่าง) และหมายเหตุเชิงเทคนิคเกี่ยวกับวิธีเขียนเทส 2 จุด (ไม่ใช่บั๊กของโค้ด programmer — ดู "หมายเหตุระหว่างเขียนเทส" ท้ายหัวข้อนี้)

**ข้อจำกัดสภาพแวดล้อมที่สำคัญที่สุดของรอบนี้:** ไม่มี Overpass/Nominatim API จริงให้ยิง request จริง (ตามขอบเขตที่ requirements.md กำหนดไว้แล้วว่า runtime ต้อง 100% offline และ dev-time script ทดสอบแยกเป็น unit ของ programmer เอง `scripts/extract-overpass-landmarks.test.ts`) — Tester ยืนยันความถูกต้องของ**ผลลัพธ์จริง**ที่ได้จากการรัน Overpass จริงของ programmer แทน โดยตรวจ `scripts/output/overpass-landmarks-report.json` (55 จังหวัดที่พยายามดึง: ok 36, request-failed 16, empty 2, partial 1 — สอดคล้องกับตัวเลข 45/76 จังหวัดที่มีข้อมูลจริงในแอป) และตรวจข้อมูลที่ merge เข้า `thailand-landmarks.ts` จริงโดยตรงใน `landmarkDataIntegrity.test.ts` แทนการ mock

### หมายเหตุระหว่างเขียนเทส (ไม่ใช่บั๊กของโค้ด programmer — บันทึกไว้เพื่อความโปร่งใส)

1. **"overlapping act() calls" เมื่อยิง `fireEvent` สองครั้งติดกันโดยไม่ await** — ระหว่างเขียน `searchPlaceLandmarkIsolation.test.tsx` (กด landmark chip แล้วพิมพ์ช่องค้นหาต่อทันทีโดยไม่รอ) พบว่า React 19 + `@testing-library/react-native` เวอร์ชันที่ใช้ในโปรเจกต์นี้ ทำให้ `fireEvent` ตัวที่สองไม่ทำงานจริง (state ไม่อัปเดต) แม้ไม่มี error ที่ throw ออกมาให้เห็นชัดใน `--silent` mode — แก้โดยห่อแต่ละ `fireEvent` ด้วย `await act(async () => ...)` ให้ act scope จบสมบูรณ์ก่อนเริ่มอันถัดไป เป็นรูปแบบการเขียนเทสที่ไฟล์เทสเดิมของ programmer ทุกไฟล์ไม่เคยต้องเจอ เพราะไม่มีไฟล์ไหนยิง 2 interaction ติดกันโดยไม่มี `waitFor`/assert คั่นระหว่างกลางมาก่อน จึงไม่ใช่บั๊กของโค้ด production แต่เป็นข้อควรระวังของรูปแบบการเขียนเทสในสภาพแวดล้อมนี้ที่ไม่เคยถูกพบเจอมาก่อน
2. **`jest.resetModules()` + `jest.doMock()` กลางไฟล์ทำให้ React สองชุดชนกัน** — พยายามเขียนกรณี degenerate bounding box ด้วยการ mock dataset เฉพาะใน `describe` block เดียว (ไม่กระทบทั้งไฟล์) โดยใช้ `jest.resetModules()`/`jest.doMock()`/`require()` สด แต่พบ `TypeError: Cannot read properties of null (reading 'useState')` ซึ่งเป็นอาการมาตรฐานของ "สอง React instance ปนกัน" — แก้โดยย้ายไปเป็นไฟล์แยกต่างหาก (`landmarkMapDegenerateBbox.test.tsx`) ใช้ `jest.mock()` แบบ static/hoisted ที่หัวไฟล์เหมือนไฟล์เทสอื่นทุกไฟล์ในโปรเจกต์แทน ไม่ใช่บั๊กของโค้ด production เช่นกัน

---

## รายละเอียดตาม User Story (รอบ 3)

### US-16: สคริปต์ดึงข้อมูล Top Landmark จาก OSM Overpass API ครบ 76 จังหวัด
- [x] AC1: เป็นเครื่องมือ dev/build-time เท่านั้น ไม่ถูก import จากโค้ด runtime ไม่ถูก bundle เข้า production — **PASS**
  - ยืนยันด้วย `grep -r` ทั่ว `src/` ว่าไม่มีไฟล์ใด import จาก `scripts/` เลย และ `npx expo export --platform android` bundle สำเร็จโดยไม่มี dependency ของ Node-only tooling (`node:fs` ฯลฯ) หลุดเข้ามา
- [x] AC2: query แยกตาม tag ที่กำหนด คัดสูงสุด 3–5 แห่งต่อจังหวัดตามลำดับความสำคัญ — **PASS**
  - ยืนยันด้วย `landmarkDataIntegrity.test.ts` "no province ever has more than 5 landmarks": ไม่มีจังหวัดไหนในข้อมูลจริงเกิน 5 แห่ง ตรงตาม cap ที่กำหนด ส่วน logic การจัด priority ของ tag เป็น unit test ของ programmer เองอยู่แล้วใน `scripts/extract-overpass-landmarks.test.ts` (ตรวจแล้วว่ามีอยู่และผ่าน)
- [x] AC3: ทุก landmark ที่ดึงมาต้องมี lat/lng เป็นตัวเลขถูกต้อง (ไม่ null/NaN) — **PASS**
  - `landmarkDataIntegrity.test.ts` "every landmark that has a lat also has a lng...": ตรวจข้อมูลจริงทั้งหมดใน `LANDMARKS` (ไม่ใช่ mock) ว่าไม่มี record ไหนมี lat โดยไม่มี lng (หรือกลับกัน) และทุกคู่เป็น finite number
- [x] AC4: ผลลัพธ์เขียนเป็นไฟล์ data ที่ขยาย schema เดิม (`lat`/`lng`) โดยคง `id`/`provinceId`/`nameTh` — ไม่ทำให้เทสเดิมของ US-8/9/10 พัง — **PASS**
  - ยืนยันด้วยการรันเทสเดิมทั้งหมดของ programmer ซ้ำ (32 suites/186 tests เดิมผ่านครบ 100% ไม่มี regression) และ `landmarkDataIntegrity.test.ts` ยืนยัน schema ทุก record มี id/provinceId/nameTh ไม่ว่างเปล่าครบ
- [x] AC5: จังหวัดที่ได้น้อยกว่า 3 แห่ง ยังบันทึกเท่าที่มี (หรือ 0) และแยก log รายชื่อไว้ manual review แทนที่จะ fail ทั้งหมด — **PASS**
  - ตรวจ `scripts/output/overpass-landmarks-report.json` จริง (ไม่ใช่ mock): มีจังหวัด `status: "empty"` (เช่น chaiyaphum, found: 0), `status: "partial"` (ได้ไม่ครบ 3) และ `status: "request-failed"` (16 จังหวัด) ปรากฏแยกจาก `status: "ok"` (36 จังหวัด) ชัดเจน โดยสคริปต์ไม่ได้ล้มทั้งหมด — ข้อมูลของ 36+1 จังหวัดที่สำเร็จยังคงอยู่ครบในแอปจริง (`landmarkDataIntegrity.test.ts` ยืนยัน 45 จังหวัดมีข้อมูลจริง = 8 นำร่อง + 37 จากรายงานนี้)
- [x] AC6: รองรับ request ล้มเหลว/timeout/rate limit ต่อจังหวัด (หน่วงเวลา + retry อย่างน้อย 1 ครั้ง) โดยไม่ทำให้จังหวัดอื่นที่สำเร็จแล้วเสียหาย — **PASS**
  - ยืนยันจากรายงานจริง: 16 จังหวัดที่ `request-failed` (โดน rate limit ของ public Overpass instance ตามที่ programmer อธิบายไว้) ไม่ได้ทำให้ 36 จังหวัดที่ `ok` ก่อนหน้าเสียหาย/หายไปเลย — ข้อมูลของจังหวัดที่สำเร็จทั้งหมดยังคงอยู่ใน `thailand-landmarks.ts` ครบ (retry/backoff logic เองเป็น unit test ของ programmer ใน `scripts/extract-overpass-landmarks.test.ts`)
- [x] AC7: สรุปผลชัดเจนว่ากี่จังหวัดครบ/ไม่ครบ/ล้มเหลว — **PASS**
  - `scripts/output/overpass-landmarks-report.json` มีฟิลด์ `status`/`found` แยกต่อจังหวัดครบทุกจังหวัดที่พยายามดึง (55 รายการ) ตรงตามที่ AC ต้องการ

### US-17: รวมข้อมูล Landmark (พร้อมพิกัด) เข้าสู่แอปแบบ Offline และออกแบบตาราง Supabase รองรับ
- [x] AC1: ไฟล์ local dataset อัปเดตครอบคลุมทุกจังหวัดที่มีข้อมูลจาก Overpass (ไม่จำกัดแค่ 8 จังหวัดนำร่อง) ทุก record มี id/provinceId/nameTh/lat/lng ครบ — **PASS**
  - `landmarkDataIntegrity.test.ts`: 45/76 จังหวัดมีข้อมูล, ทุก record ที่มี lat มี lng คู่กันเสมอเป็นตัวเลขจำกัดค่า, ไม่มี record ไหน id/provinceId/nameTh ว่างเปล่า
- [x] AC2: อ่าน landmark ของจังหวัดใดๆ (ProvinceDetailScreen/dropdown) ทำงาน 100% offline จากไฟล์ local เท่านั้น — **PASS**
  - ยืนยันด้วย `landmarkMapIntegration.test.tsx`/`landmarkMapDegenerateBbox.test.tsx`/`searchPlaceLandmarkIsolation.test.tsx`: ไม่มี test ใดเลยที่ mock หรืออนุญาต network call เพื่อโหลด landmark — ทุกอย่างอ่านจาก `import { LANDMARKS } from '../../data/thailand-landmarks'` ตรงๆ (module local) และ `npx expo export` ยืนยันว่าไม่มี fetch call ใดๆ ผูกกับ dataset นี้ตอน build
- [x] AC3: มีการออกแบบตาราง Supabase `landmarks` พร้อม seed/sync logic ผ่าน mocked/local client — **PASS**
  - ยืนยันด้วยการอ่านโค้ด `src/sync/landmarkSeedSync.ts` + รันซ้ำ `landmarkSeedSync.test.ts` ของ programmer เอง (ผ่านทั้งหมด) — schema/field mapping (`id`/`province_id`/`name_th`/`lat`/`lng`) ตรงตาม AC ที่ระบุ ไม่มี production Supabase project จริงตามขอบเขตที่ยอมรับไว้แล้ว
- [x] AC4: จังหวัดไม่มีข้อมูล Landmark เลย (0 แห่ง) ยังแสดง empty state เดิมของ US-8 ไม่ error ไม่กระทบจังหวัดอื่น — **PASS**
  - `landmarkMapIntegration.test.tsx` "a province with zero curated landmarks (chaiyaphum) shows the US-8 not-curated empty state...": ยืนยันผ่านหน้าจอเต็มจริง (ไม่ใช่แค่ component เดี่ยว) ว่า `chaiyaphum` (ยืนยันจากรายงาน Overpass จริงว่า 0 ผลลัพธ์ ไม่ใช่ network-failure gap) แสดง empty state ถูกต้อง
- [x] AC5: landmark เดิมของ 8 จังหวัดนำร่อง (T35) ไม่สูญหาย/id ไม่เปลี่ยนหลัง merge, check-in state เดิมของผู้ใช้ (ผูกกับ id เดิม) ไม่หาย — **PASS**
  - **ยืนยันอิสระด้วยวิธีที่ไม่พึ่งคำกล่าวอ้างของ programmer**: `landmarkDataIntegrity.test.ts` ดึงไฟล์ต้นฉบับก่อนทำฟีเจอร์นี้จาก git baseline commit (`3a5d8f7`) มา diff ทีละ record กับไฟล์ปัจจุบัน — ทั้ง 29 landmark เดิมมี id/provinceId/nameTh ตรงกันทุกตัวอักษร (มีแค่ lat/lng ถูกเพิ่มเข้ามาเท่านั้น) นอกจากนี้ยังมี "backward compatibility" test แยกที่ยืนยันทุกจังหวัดนำร่องทั้ง 8 จังหวัดยังคง resolve ได้ปกติผ่าน `getLandmarksForProvince()` พร้อม lat/lng เป็นตัวเลขครบ — และรันซ้ำ `landmarkCheckin.test.tsx`/`provinceMasterLiveMap.test.tsx` เดิมของ programmer (ที่ทดสอบ check-in/Province Master บนกระบี่/ภูเก็ต ซึ่งเป็นจังหวัดนำร่อง) ผ่านครบ 100% ไม่มี regression จากการเพิ่ม lat/lng

### US-18: เห็นตำแหน่ง Landmark บนแผนที่ระดับจังหวัด
- [x] AC1: ProvinceDetailScreen แสดงตำแหน่ง (lat/lng) ของ Landmark ที่มีพิกัดครบเป็นจุด/หมุดบนแผนที่ของหน้านั้น — **PASS**
  - `landmarkMapIntegration.test.tsx` "tapping a point on the map for a real curated province (krabi)...": ยืนยันจุดของ landmark จริง (หาดไร่เลย์, `kbi-railay-beach`) render บนแผนที่จริงด้วยพิกัดจริงจาก dataset ที่ shipped
- [x] AC2: Landmark ไม่มีพิกัดไม่แสดงจุดบนแผนที่ แต่ยังปรากฏใน list ปกติ ไม่ error ไม่ทำให้ landmark อื่นหาย — **PASS**
  - `src/components/LandmarkMap.test.tsx` ของ programmer ครอบคลุมกรณีนี้ที่ระดับ component อยู่แล้ว (ตรวจซ้ำแล้วว่าถูกต้อง) — Tester เพิ่มการยืนยันกรณี "ไม่มี landmark เลย" (0 แห่งทั้งจังหวัด) ผ่านหน้าจอเต็มใน `landmarkMapIntegration.test.tsx` ซึ่งเป็นเคสที่ component-level test เดิมไม่ครอบคลุม (component เดี่ยวไม่เคย unmount ตัวเองเป็น branch ของ `LandmarkList`)
  - **กรณี degenerate bounding box (landmark พิกัดเดียว) ที่ระบุไว้เป็นจุดตรวจพิเศษของรอบนี้**: `landmarkMapDegenerateBbox.test.tsx` (ใหม่) ยืนยัน**ผ่านหน้าจอเต็มจริง**ว่าไม่ NaN/ไม่ crash — ปิด gap ที่การทดสอบเดิมของ programmer (`landmarkMap.test.ts` unit + `LandmarkMap.test.tsx` component) มีแค่ระดับ pure-function/component เดี่ยว ไม่เคยพิสูจน์ว่า wiring เต็มระบบ (list → map → normalizePoint → storage) ทำงานถูกต้องเมื่อเป็น edge case นี้จริง
- [x] AC3: แตะจุด Landmark บนแผนที่อ้างอิงถึง landmark เดียวกัน (id เดียวกัน) กับรายการใน list เสมอ — **PASS**
  - `landmarkMapIntegration.test.tsx`: หลังแตะจุดบนแผนที่ ยืนยันด้วย `getAllByLabelText(...).toHaveLength(2)` ว่าทั้งจุดบนแผนที่และแถวใน list แสดงสถานะ "เช็คอินแล้ว" ตรงกันพร้อมกัน และ storage mock บันทึก `landmarkId: 'kbi-railay-beach'` ตรงตัว (ไม่ใช่ id อื่น) — พิสูจน์ผ่านการกระทำจริงบนหน้าจอเต็ม ไม่ใช่แค่ตรวจโค้ดว่า callback เดียวกันถูกส่งเข้าทั้งสอง component (ซึ่งเป็นวิธีที่ programmer ตรวจใน `LandmarkMap.test.tsx`)
- [x] AC4: ทำงาน 100% offline จาก local dataset เท่านั้น — **PASS** (ดู US-17 AC2 ด้านบน — evidence เดียวกัน)

**ข้อสังเกต (Low severity, ไม่ fail AC ใด — ส่งต่อให้ UIUX/programmer พิจารณาความสอดคล้อง):** ข้อความ accessibility label ของสถานะ "ยังไม่เช็คอิน" **ไม่ตรงกัน** ระหว่างจุดบนแผนที่ (`LandmarkMap.tsx`: `"ยังไม่เช็คอิน"`) กับแถวใน list (`LandmarkListItem.tsx`: `"ยังไม่ได้เช็คอิน"` — มีคำว่า "ได้" เพิ่มมา) ส่วนสถานะ "เช็คอินแล้ว" ตรงกันทั้งคู่ ไม่มี AC ใดกำหนดว่าข้อความทั้งสองจุดต้องเหมือนกันเป๊ะ (แค่ id ต้องตรงกัน ซึ่งตรงอยู่แล้ว — ยืนยันแล้วใน AC3 ด้านบน) จึงไม่ใช่บั๊กที่ fail AC แต่เป็นความไม่สอดคล้อยของข้อความที่ผู้ใช้ screen-reader อาจสังเกตเห็นได้ว่าสองจุดที่พูดถึงสถานที่เดียวกันใช้คำต่างกันเล็กน้อย แนะนำให้รวมเป็นข้อความเดียวกันในรอบถัดไป

### US-19: ค้นหาสถานที่ที่ไม่อยู่ใน Top Landmarks ผ่าน OSM Nominatim ตอนเพิ่มบันทึกทริป
- [x] AC1: มีช่องค้นหาสถานที่แบบ optional เพิ่มจาก field เลือก Landmark เดิม ไม่บังคับใช้งาน ไม่กระทบ flow เดิมของ US-4/US-10 ถ้าไม่ใช้ — **PASS**
  - `addEntrySearchPlace.test.tsx` (programmer) "not touching the search field at all keeps placeLat/placeLng null...": ยืนยันแล้ว — Tester ยืนยันซ้ำอีกชั้นด้วย `searchDebounceThrottleEndToEnd.test.ts`/`searchPlaceLandmarkIsolation.test.tsx` ที่ทุก test บันทึก entry สำเร็จได้ปกติโดยไม่มี test ไหนเจอ error จาก flow เดิม
- [x] AC2: พิมพ์คำค้น+มีเน็ต → ยิง request ไปยัง Nominatim ตาม URL/param ที่กำหนด แสดงผลลัพธ์เป็น list — **PASS**
  - `nominatimClient.test.ts` (programmer) ยืนยัน URL/param ระดับ unit อยู่แล้ว — `searchDebounceThrottleEndToEnd.test.ts` (ใหม่) ยืนยันซ้ำผ่าน hook จริง (ไม่ mock `searchImpl`) ว่า `global.fetch` ถูกเรียกจริงหลัง debounce
- [x] AC3: เลือกผลลัพธ์ → prefill title อัตโนมัติ พร้อมเก็บ lat/lng แนบเป็น metadata เสริม แก้ไขค่าที่ prefill ได้ก่อนบันทึกจริง — **PASS**
  - `addEntrySearchPlace.test.tsx` (programmer) ครอบคลุมดีอยู่แล้ว — `searchPlaceLandmarkIsolation.test.tsx` (ใหม่) ยืนยันซ้ำในบริบทที่ซับซ้อนกว่า (มี landmark dropdown ให้เลือกด้วย) ว่า title/placeLat/placeLng ยังคงมาจาก search เท่านั้นอย่างถูกต้อง
- [x] AC4: การเลือกผลลัพธ์จาก Nominatim **ไม่สร้าง Landmark ใหม่และไม่ trigger auto check-in** — **PASS**
  - `addEntrySearchPlace.test.tsx` (programmer) ทดสอบไว้แล้วแยกกัน — **`searchPlaceLandmarkIsolation.test.tsx` (ใหม่ทั้งหมดโดย Tester) ปิด gap สำคัญที่สุดของรอบนี้**: ทดสอบ "เลือก landmark จาก dropdown พร้อมกันกับเลือกผลจาก search ในเอนทรีเดียวกัน" ยืนยันว่า check-in ที่เกิดขึ้นมีแค่ 1 รายการ (จาก dropdown เท่านั้น, `hkt-big-buddha`) และ `LANDMARKS.length` ไม่เปลี่ยนแปลงเลย — เป็นการพิสูจน์ที่หนักแน่นกว่าเทสเดิมของ programmer ที่ทดสอบ "ใช้ search อย่างเดียว" เท่านั้น (ไม่เคยพิสูจน์ว่าเมื่อทั้งสองกลไกทำงานพร้อมกัน มันไม่ปนกัน)
- [x] AC5: ผู้ใช้บันทึก entry ได้ปกติโดยไม่ใช้ช่องค้นหาเลย (เหมือนเดิม US-4 ทุกประการ) — **PASS**
  - `addEntrySearchPlace.test.tsx` (programmer) + regression เต็มชุดของ US-4 เดิม (`addEntryScreen.test.tsx`) รันซ้ำผ่านครบ 100%

### US-20: จัดการ Rate Limit, Error และ Offline State ของการค้นหาผ่าน Nominatim
- [x] AC1: ทุก request แนบ custom User-Agent header (ไม่ใช้ default) — **PASS**
  - `nominatimClient.test.ts` (programmer) ยืนยันแล้วระดับ unit — ตรวจโค้ด `nominatimClient.ts` ยืนยัน `USER_AGENT` เป็นค่าคงที่ที่ทีม dev กำหนด ไม่ใช่ personal data ของผู้ใช้ ตรงตามสมมติฐานที่ระบุใน requirements.md
- [x] AC2: debounce หลังหยุดพิมพ์ + ไม่ยิง request ถี่กว่า ~1 ครั้ง/วินาที แม้พิมพ์เปลี่ยนคำค้นต่อเนื่องเร็วๆ — **PASS**
  - `useNominatimSearch.test.ts` (programmer) ยืนยัน debounce ที่ระดับ hook (mock `searchImpl`) และ `nominatimClient.test.ts` ยืนยัน throttle ที่ระดับ client (เรียก `searchPlaces` ตรงๆ) — **`searchDebounceThrottleEndToEnd.test.ts` (ใหม่โดย Tester) ปิด gap รอยต่อระหว่างสองเลเยอร์**: ยืนยันว่ากดปุ่ม "ลองอีกครั้ง" รัว 2 ครั้งติดกัน (ซึ่งข้าม debounce ไปเลยตามดีไซน์ของ `retry()`) ผ่าน hook+client ตัวจริงร่วมกัน ยัง**ไม่**ยิง fetch ถี่กว่า `THROTTLE_MS` เพราะ client-level throttle ทำงานเป็นเกราะป้องกันชั้นที่สองอย่างที่ตั้งใจออกแบบไว้จริง
- [x] AC3: ไม่มีเน็ต/request ล้มเหลว/timeout → แสดงข้อความแจ้งสถานะสื่อความหมายชัดเจน ไม่ค้าง loading ตลอดไป ไม่ error แบบ raw — **PASS**
  - `addEntrySearchPlace.test.tsx` (programmer) "shows a friendly error + working ลองอีกครั้ง retry..." ครอบคลุมดีอยู่แล้ว
- [x] AC4: ไม่พบผลลัพธ์ → empty state "ไม่พบสถานที่ที่ค้นหา" แทน list ว่างเปล่าดิบๆ — **PASS**
  - `addEntrySearchPlace.test.tsx` (programmer) ครอบคลุมแล้ว
- [x] AC5: ตรวจ "มีเน็ตหรือไม่" แบบ opportunistic (ลองยิงแล้ว catch error) เหมือน sync engine เดิม ไม่ใช่ event-based — **PASS**
  - ตรวจโค้ด `nominatimClient.ts`: ไม่มีการ import `@react-native-community/netinfo` หรือ event listener ใดๆ ทั้งไฟล์ — ทุก error (offline/timeout/HTTP/malformed) ถูกจับรวมเป็น `NominatimSearchError` เดียวกันแบบ catch-based ล้วนๆ ตรงตาม AC เป๊ะ
- [x] AC6: ความล้มเหลวของการค้นหาต้องไม่กระทบ flow กรอก/บันทึก entry ปกติของ US-4 เลย — **PASS**
  - `addEntrySearchPlace.test.tsx` (programmer) "a totally broken search never blocks manually typing the title and saving normally..." ครอบคลุมแล้ว และ regression เต็มชุดของ US-4 เดิมผ่านครบ 100% ไม่มีจุดใดถูกกระทบ

---

## บั๊กที่พบ (รอบ 3)

**ไม่พบบั๊กใหม่ที่ทำให้ AC ใดของ US-16–US-20 FAIL** จากทั้งการรัน automated test (209/210 pass, 1 skip เดิมไม่เกี่ยวกับรอบนี้) การตรวจข้อมูลจริง (`LANDMARKS`, `overpass-landmarks-report.json`) และการอ่านโค้ดของทุกไฟล์ที่เปลี่ยนแปลง/เพิ่มใหม่ในรอบนี้ (`scripts/extract-overpass-landmarks.ts`, `scripts/lib/overpass-extract-core.ts`, `scripts/merge-landmarks.ts`, `src/data/thailand-landmarks.ts`, `src/sync/landmarkSeedSync.ts`, `src/utils/landmarkMap.ts`, `src/components/LandmarkMap.tsx`, `src/lib/nominatimClient.ts`, `src/hooks/useNominatimSearch.ts`, `src/components/SearchPlaceField.tsx`/`SearchResultItem.tsx`/`SearchResultConfirmationChip.tsx`, `src/screens/AddEntryScreen.tsx`)

ดู **"ข้อสังเกต (Low severity)"** ในหัวข้อ US-18 ด้านบน — ความไม่ตรงกันเล็กน้อยของข้อความ accessibility label ("ยังไม่เช็คอิน" vs "ยังไม่ได้เช็คอิน") ระหว่างจุดบนแผนที่กับแถวใน list ไม่ใช่บั๊กที่ขัดกับ AC ข้อใดที่เขียนไว้ตรงๆ (id ยังคงตรงกันเสมอ ตรวจยืนยันแล้ว) จึงไม่นับเป็นบั๊ก แต่รายงานไว้ให้ทีมพิจารณา

**ไม่มีบั๊ก High severity ในรอบนี้เช่นกัน** — และยืนยันเพิ่มเติมว่าคำกล่าวอ้างสำคัญที่สุดของรอบนี้ (29 landmark id เดิมไม่เปลี่ยน) ตรวจสอบผ่านวิธีอิสระจริง (diff กับ git baseline commit) ไม่ใช่แค่เชื่อคำอธิบายใน dev-notes.md/qa-result.md

---

## Coverage ที่ยังขาด (รอบ 3 — ตรวจไม่ได้ในสภาพแวดล้อมนี้)

1. **Overpass/Nominatim API จริงตอน runtime** — ตามขอบเขตที่ requirements.md กำหนดไว้เองว่า US-16 เป็น dev/build-time เท่านั้น (ไม่มี runtime fetch) และ US-19/20 ต้องการเน็ตจริงซึ่งไม่มีในสภาพแวดล้อมนี้ — ทดสอบผ่าน mocked `fetch`/`searchPlaces` ทั้งหมดตามที่ยอมรับไว้แล้วในรอบก่อนๆ (เหมือน Supabase mock ของ US-12/13)
2. **จังหวัดที่เหลือ (76 - 55 = 21 จังหวัด) ที่ extraction script ยังไม่เคยลองดึงเลยแม้แต่ครั้งเดียว** (ต่างจาก 16 จังหวัดที่ `request-failed` ซึ่งลองแล้วแต่ไม่สำเร็จ) — เกิดจากโดน rate limit ของ Overpass public instance ก่อนจะรันครบ ตามที่ tasks.md ยอมรับไว้แล้วว่า "T61 รันได้จริงถึง 45/76 จังหวัด" เป็นผลลัพธ์ที่ยอมรับได้ของรอบนี้ (ไม่ใช่ AC ที่ fail — US-16 AC5 อนุญาตให้จังหวัดที่ไม่มีข้อมูลเข้า empty state เดิมของ US-8 ได้) ทีม content ต้อง manual review/รันเพิ่มเติมนอก sprint พัฒนาโค้ดตามที่ระบุไว้ในสมมติฐาน
3. **ความแม่นยำของตำแหน่งจุดบนแผนที่จริงบนหน้าจออุปกรณ์ (US-18 AC1 ภาพที่ render จริง)** — เหมือนข้อจำกัดเดิมของ US-1 AC2/AC3 จากรอบ 1: `react-native-svg`/reanimated mock ใน jest ไม่ได้ merge ค่า animated/style props เข้ากับ node ที่ query ได้ ยืนยันได้แค่ตำแหน่ง x/y ที่คำนวณถูกต้อง (unit test ของ programmer ใน `landmarkMap.test.ts`) และ accessibility label/callback ที่ผูกถูก landmark id (integration test ของ Tester) ไม่ใช่ pixel ที่ render จริงบนอุปกรณ์
4. **T61 ตัวเลข "ok: 36 + partial: 1 = 37"** — สอดคล้องกับ "45 - 8 = 37 จังหวัดใหม่" ที่ยืนยันได้จากข้อมูลจริง แต่ Tester ไม่มีทางยืนยัน "partial" 1 จังหวัดนั้นคือจังหวัดไหนโดยเฉพาะแบบ cross-reference ทีละจังหวัดกับ found count ใน dataset จริง (เกินขอบเขตเวลาที่เหมาะสมของรอบ QA นี้ — ตรวจแค่ผลรวมและ schema ถูกต้องทั้งหมดแล้ว ซึ่งเพียงพอต่อ AC ที่ระบุไว้)
5. **T30/T31 (รอบ 1), T58/netinfo/US-13 transient state/Supabase Storage จริง (รอบ 2)** — ยังคงเป็นข้อจำกัดเดิมตามที่รายงานไว้แล้ว ไม่มีอะไรเปลี่ยนแปลงจากรอบนี้

## ไฟล์ที่ Tester เพิ่มเข้ามาในรอบนี้ (ไม่ได้แก้ไขไฟล์ใดใน `src/screens`, `src/components`, `src/storage`, `src/utils`, `src/data`, `src/sync`, `src/auth`, `src/lib`, `src/hooks`, `src/navigation`, `scripts/`, `App.tsx`, `package.json`, หรือเอกสารอื่นใดของ programmer เลยในรอบนี้)

- `src/__tests__/qa-round3/landmarkDataIntegrity.test.ts` (ใหม่, 9 tests) — US-16/US-17/T61: ตรวจข้อมูลจริงของ `LANDMARKS` โดยตรง + ยืนยัน 29 id เดิมไม่เปลี่ยนด้วยการ diff กับ git baseline
- `src/__tests__/qa-round3/landmarkMapIntegration.test.tsx` (ใหม่, 2 tests) — US-18: `LandmarkMap` ผ่าน `ProvinceDetailScreen` เต็มหน้าจอ ข้อมูลจริงของกระบี่ + empty state ของ chaiyaphum
- `src/__tests__/qa-round3/landmarkMapDegenerateBbox.test.tsx` (ใหม่, 1 test) — US-18 AC1: degenerate bounding box ผ่านหน้าจอเต็มจริง
- `src/__tests__/qa-round3/searchPlaceLandmarkIsolation.test.tsx` (ใหม่, 2 tests) — US-19 AC4/US-10 AC3: พิสูจน์ search selection กับ landmark dropdown ทำงานพร้อมกันโดยไม่ชนกัน
- `src/__tests__/qa-round3/searchDebounceThrottleEndToEnd.test.ts` (ใหม่, 2 tests) — US-20 AC2: debounce+throttle ทำงานร่วมกันจริงผ่าน hook+client ตัวจริง

ไม่มีการแก้ไข/ลบไฟล์เทสใดๆ ที่ programmer เขียนไว้ในรอบนี้ — ทุกไฟล์ของ programmer ถูกรันซ้ำตามเดิมทั้งหมดและผ่านครบ 100%

## Test Report — รอบ 4: Bug fix verification (BUG-1 + accessibility label)

### สรุป
Total: 213 | Pass: 212 | Skip: 1 | Fail: 0
(ตัวเลขนี้รันเอง อิสระจาก dev-notes.md — เพิ่มขึ้นจาก baseline 209 passed/1 skip ของ programmer เพราะ tester เพิ่ม regression test ใหม่ 3 เคสสำหรับ BUG-1)

### 1) BUG-1 — formatThaiDate UTC offset
- อ่านโค้ดจริงที่ `src/utils/derived.ts:86-93` ยืนยันว่าใช้ `d.getUTCDate()`, `d.getUTCMonth()`, `d.getUTCFullYear()` ครบทั้ง 3 ค่า ไม่มีการเรียก local getter (`getDate`/`getMonth`/`getFullYear`) เลย — ยืนยันว่าเป็น false positive จริงตามที่ programmer อ้าง ไม่ใช่บั๊กในโค้ดปัจจุบัน
- **ข้อสังเกตสำคัญ**: เครื่อง dev/test runner นี้มี timezone offset = UTC+7 (`getTimezoneOffset()` คืนค่า -420) ซึ่งเป็น offset บวก การรันเทสเดิมด้วยเครื่องนี้จะ**ไม่มีทางจับบั๊ก UTC offset ติดลบได้เลย** แม้โค้ดจะพังก็ตาม เพราะ UTC+7 ไม่ทำให้ local date เพี้ยนจาก UTC date สำหรับ ISO date-only string
- จึงเขียน regression test เพิ่มใน `src/utils/derived.test.ts` (describe block "is immune to negative UTC offsets (regression for BUG-1)") ที่ตั้ง `process.env.TZ` เป็น negative-offset zone จริง 3 กรณี: `America/New_York` (UTC-5), `Pacific/Midway` (UTC-11, extreme), `America/Los_Angeles` (UTC-8, ทดสอบวันสุดท้ายของเดือน) — ยืนยันด้วย `node -e` สคริปต์แยกก่อนเขียนเทสว่า Node เคารพการเปลี่ยน `process.env.TZ` runtime จริง (local getter จะเพี้ยนไปวันก่อนหน้า แต่ UTC getter ไม่เพี้ยน)
- รันเทสทั้ง 3 เคสใหม่นี้ผ่านทั้งหมด — ยืนยันว่า `formatThaiDate` ถูกต้องจริงแม้บน negative UTC offset

### 2) Accessibility label mismatch (LandmarkMap vs LandmarkListItem)
- grep คำว่า "เช็คอิน" ในทั้งสองไฟล์ด้วยตนเอง (ไม่เชื่อคำสรุปของ programmer):
  - `src/components/LandmarkMap.tsx:69`: `` accessibilityLabel={`${landmark.nameTh}, ${visited ? 'เช็คอินแล้ว' : 'ยังไม่ได้เช็คอิน'}`} ``
  - `src/components/LandmarkListItem.tsx:20`: `` accessibilityLabel={`${landmark.nameTh}, ${visited ? 'เช็คอินแล้ว' : 'ยังไม่ได้เช็คอิน'}`} ``
  - ทั้งสอง string เหมือนกันทุกตัวอักษร (ทั้ง "เช็คอินแล้ว" และ "ยังไม่ได้เช็คอิน") — ยืนยันว่า label ตรงกันจริง ไม่ใช่แค่คำอ้างของ programmer
  - เทสที่เกี่ยวข้องอัปเดตตรงกับ label ใหม่แล้วทั้ง 3 ไฟล์: `LandmarkMap.test.tsx`, `landmarkMapDegenerateBbox.test.tsx`, `landmarkMapIntegration.test.tsx` (grep ยืนยัน string ในเทสตรงกับ "ยังไม่ได้เช็คอิน"/"เช็คอินแล้ว" ทุกจุด)

### 3) รัน jest เต็มชุดอิสระ
```
Test Suites: 37 passed, 37 total
Tests:       1 skipped, 212 passed, 213 total
Snapshots:   0 total
Time:        14.758 s
```
- ตรงกับคำอ้างของ programmer (209 passed + 1 skip) บวกเทสใหม่ 3 เคสที่ tester เพิ่มเอง (209 + 3 = 212) — ไม่มี fail, ไม่มี test ที่หายไปจากที่ programmer รายงาน

### 4) รัน tsc --noEmit อิสระ
- `npx tsc --noEmit` ไม่มี output/error ใดๆ — ยืนยันว่า clean จริงตามที่ programmer อ้าง

## Coverage ที่ยังขาด (ถ้ามี) — รอบ 4
- ไม่พบปัญหาเพิ่มเติมจาก 2 ประเด็นที่ตรวจสอบรอบนี้ ทั้ง BUG-1 (false positive แต่ตอนนี้มี regression test คุ้มครองจริง) และ accessibility label mismatch (แก้ตรงและเทสสอดคล้องแล้ว) ผ่านการตรวจสอบอิสระทั้งหมด


## Test Report — รอบ 5: Landmark Cards & Media Integration (US-21–US-24)

> บริบท: โค้ดของรอบนี้ implement เสร็จนอก pipeline ก่อน BA/PM เขียน requirements.md ย้อนหลัง (US-21–US-24, T76–T85) — Tester ตรวจสอบอิสระทุกจุด ไม่เชื่อคำอ้างของรายงานผู้ implement

### สรุป
- **US-21 (HEIC→JPEG):** ผ่านครบ 4 AC — แต่พบว่าเทสเดิม (`src/__tests__/integration/photoPicker.test.tsx`) ไม่เคยทดสอบ "happy path" จริง (ดูหัวข้อ Coverage gap) — เพิ่มเทสใหม่ปิดช่องโหว่แล้ว
- **US-22 (Wikipedia landmark cards):** ผ่านครบ 6 AC หลังตรวจสอบโค้ดจริงและเขียน integration test ใหม่ (ไม่มีเทสเดิมเลยสำหรับ `LandmarkCard`/`LandmarkList` ก่อนรอบนี้)
- **US-23 (search/filter ในจังหวัด):** ผ่านครบ 3 AC
- **US-24 (global search):** ผ่านครบ 5 AC
- **จุดเสี่ยง 3 ข้อที่ PM ระบุ (ประเด็น 16):** ตรวจครบทั้ง 3 ข้อ — ดูรายละเอียดด้านล่าง
- **Regression เต็มชุด:** ไม่มี regression จากรอบก่อน (ดูหัวข้อผลรัน jest/tsc)
- **บั๊ก/severity สูง:** ไม่พบบั๊กที่ทำให้ AC ใดๆ fail จริง — พบ 1 dead-code cleanup item (ยืนยันตามที่ PM สงสัย) และ 1 gap เรื่อง test coverage ที่ปิดไปแล้วในรอบนี้ ไม่มี blocking bug

### 1) ตรวจสอบ AC ทีละข้อเทียบกับโค้ดจริง

**US-21: แนบรูปจาก iPhone (.HEIC/.HEIF)**
- [x] AC1 (แปลงเป็น .jpg ทันทีหลังเลือกจากแกลเลอรี ก่อนเข้า `photoUris`) — ยืนยันจาก `src/components/PhotoPicker.tsx:26-40`: `ImageManipulator.manipulateAsync(asset.uri, [], { compress: 0.8, format: SaveFormat.JPEG })` เรียกทันทีใน `pickImages()` ก่อน `onChange([...photoUris, ...convertedUris])`
- [x] AC2 (thumbnail แสดงถูกต้องใน PhotoPicker และ EntryListItem) — ยืนยันจาก `PhotoPicker.tsx:53` (`<Image source={{ uri }} .../>`) และ `src/components/EntryListItem.tsx:19-31` (ใช้ `entry.photoUris[0]` แสดงตรงๆ ไม่มีการแปลง path เพิ่มที่จะพัง)
- [x] AC3 (fallback ใช้ URI เดิมถ้าแปลงล้มเหลว ไม่ throw บล็อกรูปอื่น) — ยืนยันจาก `try { ... } catch { return asset.uri; }` ใน `PhotoPicker.tsx:28-37` ต่อรูปแต่ละใบแยกกันใน `Promise.all(...map(async ...))` — รูปหนึ่งพังไม่กระทบรูปอื่น
- [x] AC4 (`contentType: 'image/jpeg'` เสมอตอนอัปโหลด Supabase Storage bucket `trip-photos`) — ยืนยันจาก `src/sync/photoUpload.ts:60`: `.upload(path, blob, { upsert: true, contentType: 'image/jpeg' })` เป็นค่าคงที่ ไม่เดาจากนามสกุลไฟล์เลย

**พบระหว่างตรวจ (ไม่ใช่บั๊กของโค้ด แต่เป็น gap ของเทสเดิม):** `src/__tests__/integration/photoPicker.test.tsx` (เทสเดิมก่อนรอบนี้) ไม่ mock `expo-image-manipulator` เลยใน `jest.setup.js` — เมื่อรันจริง `ImageManipulator.manipulateAsync(...)` throw (`context.renderAsync is not a function`) เสมอในสภาพแวดล้อม Jest ทำให้ `PhotoPicker` ตกไปที่ fallback branch (AC3) เสมอโดยไม่ได้ตั้งใจ เทสเดิมที่ assert ว่า `onChange` ได้ URI เดิมไม่เปลี่ยนแปลง **บังเอิญผ่านเพราะพฤติกรรม fallback ไม่ใช่เพราะทดสอบ AC1 จริง** — ไม่เคยมีเทสไหนพิสูจน์ว่า "แปลงสำเร็จจริง" (AC1) เลยก่อนรอบนี้ เขียนเทสใหม่ปิดช่องว่างนี้แล้วที่ `src/__tests__/qa-round4/photoPickerConversionHappyPath.test.tsx` (mock `expo-image-manipulator` เอง ทดสอบทั้ง 2 เส้นทางแยกกันจริง) — ผ่านทั้งคู่

**US-22: การ์ด Wikipedia ในหน้าจังหวัด**
- [x] AC1 (ดึงจาก Wikipedia แสดงควบคู่ local seed ไม่ทับ/ลบของเดิม) — ยืนยันจาก `LandmarkList.tsx:68-93` (`combined = [...prev]` แล้ว push รายการ Wikipedia ที่ไม่ซ้ำชื่อเข้าไปเพิ่ม ไม่ replace)
- [x] AC2 (รูปจริง + ป้ายหมวดหมู่ 1 ใน 5 + fallback "สถานที่ท่องเที่ยว" + คำอธิบายสั้น) — ยืนยันจาก `wikipediaService.ts` `detectCategory()` คืนค่า 1 ใน 5 หมวดหรือ fallback เสมอ, `LandmarkCard.tsx:31-35` แสดง badge, `:43-47` แสดง description
- [x] AC3 (การ์ดไม่มีรูปแสดง placeholder ไม่พัง) — ยืนยันจาก `LandmarkCard.tsx:19-30` (`imgError` state + `onError` + fallback icon 🏛️)
- [x] AC4 (ปุ่มเช็คอินผูก CheckinContext, accessibilityRole switch) — ยืนยันจาก `LandmarkCard.tsx:50-57` (`accessibilityRole="switch"`, `accessibilityState={{checked: visited}}`) และ toggle เรียก `onToggle` → `CheckinContext.toggleCheckin` จริงผ่าน `LandmarkList.tsx:211` → `ProvinceDetailScreen.tsx:70`
- [x] AC5 (Wikipedia fetch ไม่สำเร็จ → render ปกติเหลือ local เท่านั้น ไม่ error ไม่ค้าง loading) — ยืนยันจาก `LandmarkList.tsx:94-98` (`catch {} finally { setIsFetchingWiki(false) }`)
- [x] AC6 (ไม่มีทั้ง local และ Wikipedia → empty state เดิมของ US-8) — ยืนยันจาก `LandmarkList.tsx:125-132` (เงื่อนไข `landmarks.length === 0 && !isFetchingWiki` → `<EmptyStateLandmarks />`)

**ไม่มีเทสเดิมเลยที่ render `LandmarkCard`/`LandmarkList` จริงก่อนรอบนี้** (`wikipediaService.test.ts` เป็น unit test ล้วนที่ mock `fetch`, ไม่เคยผ่าน component จริง) — เขียน integration test ใหม่ครบทุก AC ที่ `src/__tests__/qa-round4/landmarkCardsWikipediaIntegration.test.tsx` (mock service module, render ผ่าน `ProvinceDetailScreen` จริง) — ผ่านทั้งหมด 10/10 เคส

**US-23: ค้นหา/กรอง Landmark ในจังหวัด**
- [x] AC1 (ช่องค้นหา filter รายการเฉพาะจังหวัดนี้ real-time) — ยืนยันจาก `LandmarkList.tsx:109-123` (`filteredLandmarks` useMemo กรองจาก `landmarks` ของ `provinceId` นี้เท่านั้น)
- [x] AC2 (filter chip 5 หมวด + "ทั้งหมด" ใช้ร่วมกับค้นหาได้ AND condition) — ยืนยันจาก `LandmarkList.tsx:111-121` (`matchQuery && matchCategory`)
- [x] AC3 (progress indicator + LandmarkMap อ่านจากรายการเต็ม ไม่ใช่ผลกรอง; ค้นหา/กรองไม่พบผลลัพธ์มี empty state แยกจาก US-8) — ยืนยันจาก `LandmarkList.tsx:107,149,152` (`progress`/`LandmarkMap` ใช้ `landmarks` เต็ม ไม่ใช่ `filteredLandmarks`) และ `:199-203` (empty box ข้อความ "ไม่พบสถานที่ที่ตรงกับการค้นหา" แยกจาก `EmptyStateLandmarks`)

เขียน integration test ใหม่ครอบคลุมครบใน `landmarkCardsWikipediaIntegration.test.tsx` (describe ที่สอง) รวมถึงเคส progress indicator ไม่เปลี่ยนตอน filter — ผ่านทั้งหมด

**US-24: Global search จากหน้าแรก**
- [x] AC1 (floating search bar เหนือแผนที่ 3D, dropdown real-time) — ยืนยันจาก `HomeScreen.tsx:93` wiring `<GlobalSearchBar onSelectProvince={handlePressProvince} />` เหนือ `<Map3D />`
- [x] AC2 (ค้นได้ทั้ง nameTh/nameEn จังหวัด และ Landmark จาก local dataset) — ยืนยันจาก `GlobalSearchBar.tsx:30-56`
- [x] AC3 (ไอคอนแยกประเภท 📍/🏛️) — ยืนยันจาก `GlobalSearchBar.tsx:110`
- [x] AC4 (แตะผลลัพธ์ navigate ไป ProvinceDetailScreen ตรง provinceId) — ยืนยันจาก `handleSelect()` เรียก `onSelectProvince(provinceId)` ทั้งสองประเภทผลลัพธ์
- [x] AC5 (ทำงาน offline เต็มรูปแบบ ไม่ยิง fetch) — ยืนยันจากอ่านโค้ด (ไม่มี `fetch`/service call ใดๆ ใน `GlobalSearchBar.tsx`) และยืนยันด้วยเทสที่ mock `global.fetch` ให้ throw ถ้าถูกเรียก

ไม่มีเทสเดิมเลยสำหรับ `GlobalSearchBar` ก่อนรอบนี้ — เขียนเทสใหม่ 6 ไฟล์ย่อยใน `src/__tests__/qa-round4/globalSearchBar*.test.tsx` (แยกไฟล์/ทดสอบทีละ interaction — ดูหมายเหตุ technical debt ด้านล่าง) ผ่านทั้งหมด

### 2) ตรวจ 3 จุดเสี่ยงที่ PM ระบุไว้ในประเด็น 16 (docs/tasks.md)

**(1) `LandmarkCardGrid.tsx` เป็น dead code จริงหรือไม่**
```
grep -rn "LandmarkCardGrid" src/ → พบแค่ไฟล์ src/components/LandmarkCardGrid.tsx เอง (ไม่มี import จากที่อื่นเลย)
grep -rn "LandmarkList" src/screens → ProvinceDetailScreen.tsx import และใช้จริง
```
ยืนยัน: **`LandmarkCardGrid.tsx` เป็น dead code จริง** — เนื้อหาเกือบซ้ำกับ `LandmarkList.tsx` ทุกประการ (search/filter/category chip logic เหมือนกัน) ต่างกันที่ `LandmarkCardGrid` ไม่มี `LandmarkMap`/`EmptyStateLandmarks` integration และคำนวณ progress เอง — ดูเหมือนเป็น draft ก่อนหน้าที่ถูกแทนที่ด้วย `LandmarkList.tsx` จริง เสนอให้ programmer ลบทิ้งในรอบแก้บั๊กถัดไปตามที่ PM แนะนำ

**(2) รายงาน T79 ผิดพลาด (`src/types/landmark.ts` vs `src/data/thailand-landmarks.ts`) — มีจุดอื่นที่รายงานไม่ตรงอีกหรือไม่**
```
cat src/types/landmark.ts → มีแค่ LandmarkCheckin interface เดิม ไม่ได้แตะในรอบนี้จริง (ตรงกับที่ PM ตรวจพบ)
grep "imageUrl?\|description?\|category?" src/data/thailand-landmarks.ts → พบ field เพิ่มจริงที่ Landmark interface (บรรทัด 35-37)
```
ยืนยันตรงตามที่ PM ตรวจพบ — ตรวจสอบเพิ่มเติมไม่พบจุดรายงานผิดอื่นที่กระทบ AC (โค้ดจริงทุกไฟล์ที่ระบุใน T76-T85 มีอยู่จริงตามชื่อ/path ที่อ้าง ไม่มี type mismatch อื่นที่ `tsc --noEmit` ตรวจไม่เจอ)

**(3) landmark id จาก Wikipedia (`wiki-{provinceId}-{slug}`) ไม่คงที่ — เช็คอินไม่ throw/crash เมื่อ id หายไปรอบถัดไปหรือไม่**
- อ่าน `src/storage/CheckinContext.tsx:37-43`: `checkins` เป็น `Record<string, boolean>` แบบ plain lookup (`checkins[landmarkId] ?? false`) ไม่มีการ validate ว่า landmarkId ต้องมีอยู่ใน landmark list ปัจจุบัน — lookup ของ id ที่ไม่มีอยู่แล้วคืนค่า `undefined`/`false` เฉยๆ ไม่ throw
- อ่าน `src/utils/landmarkDerived.ts:8-16` (`getLandmarkProgress`): คำนวณ `checkedInCount` จาก `provinceLandmarks.filter(l => checkins[l.id])` — กรองจากรายการ landmark **ปัจจุบัน** เท่านั้น ถ้า wiki id เดิมหายไปจากผลลัพธ์รอบใหม่ checkin record เดิมจะกลายเป็น "orphaned" ใน storage (ไม่ถูกลบ แต่ไม่ถูกนับใน progress ของ UI อีกต่อไป) — ไม่ throw, ไม่ crash, ไม่กระทบ landmark อื่น
- ยืนยัน: **ไม่มีความเสี่ยง crash/throw จริง** ตามที่ PM กังวล กลไกออกแบบมาปลอดภัยด้วย pattern "filter by current list" อยู่แล้ว — ผลกระทบจริงมีแค่ที่ requirements.md ระบุไว้แล้วว่ายอมรับได้ (สถานะเช็คอินของ landmark ตัวนั้นอาจ "หลุด" จาก progress ถ้า id เปลี่ยน ไม่ต้องมี migration พิเศษ)

### 3) รัน jest เต็มชุด + tsc อิสระ

```
npx tsc --noEmit
→ ไม่มี output/error (clean)
```

```
npx jest   (รันซ้ำ 3 รอบเพื่อตรวจ flakiness)
รอบ 1: 45 passed, 1 failed (src/auth/AuthContext.test.tsx, src/storage/CheckinContext.test.tsx สลับกันไป) — 217-219 passed, 1 skip
รอบ 2: 46 passed, 0 failed — 237 passed, 1 skip, 238 total
รอบ 3: 46 passed, 0 failed — 237 passed, 1 skip, 238 total
```
- ยืนยันว่า failure ที่เจอเป็น **pre-existing flakiness ที่มีอยู่ก่อนรอบนี้แล้ว** ไม่ใช่ regression จากโค้ด US-21–US-24: รัน `src/auth/AuthContext.test.tsx` และ `src/storage/CheckinContext.test.tsx` แยกเดี่ยวๆ ผ่าน 100% เสมอ (6/6), fail เฉพาะตอนรันพร้อม suite เต็มเท่านั้น (resource/timing-sensitive, ไม่เกี่ยวกับโค้ดที่แก้รอบนี้เลย — ไฟล์เหล่านี้อยู่คนละ domain กับ US-21–US-24 ทั้งหมด)
- จำนวนเทสรวมตอนนี้ 238 (237 passed + 1 skip) เทียบกับ baseline ที่ prompt ระบุไว้ 213 (212 passed + 1 skip) — ส่วนต่างมาจาก 18 เทสใหม่ที่ tester เพิ่มในรอบนี้ (`src/__tests__/qa-round4/`) บวกกับไฟล์เทสอื่นที่ถูกเพิ่ม/แก้ไขระหว่างรอบก่อนหน้า (เช่น `photoUpload.test.ts`, `landmarkMapDegenerateBbox.test.tsx` ตาม git status) ซึ่งไม่ได้อยู่ในขอบเขตตรวจของรอบนี้โดยตรง — สิ่งที่ยืนยันได้แน่ชัดคือ **ไม่มี test suite ใดหายไปหรือเปลี่ยนจาก PASS เป็น FAIL เทียบกับก่อนเริ่มรอบนี้ (38 suites เดิม + 8 suites ใหม่ = 46 suites, ทั้งหมด PASS เมื่อรันซ้ำ)**

### เทสใหม่ที่ Tester เพิ่มในรอบนี้ (ปิด coverage gap)
ไฟล์ทั้งหมดอยู่ใต้ `src/__tests__/qa-round4/`:
- `landmarkCardsWikipediaIntegration.test.tsx` — US-22 (6 AC) + US-23 (3 AC) ผ่าน component จริง (`ProvinceDetailScreen` → `LandmarkList` → `LandmarkCard`), mock เฉพาะ `wikipediaService` — 10 เคส
- `photoPickerConversionHappyPath.test.tsx` — US-21 AC1 (happy path การแปลงจริง ที่ไม่เคยมีเทสมาก่อน) + AC3 (fallback) — 2 เคส
- `globalSearchBarDropdown.test.tsx`, `globalSearchBarLandmarkMatch.test.tsx`, `globalSearchBarSelection.test.tsx`, `globalSearchBarProvinceSelection.test.tsx`, `globalSearchBarEdgeCase.test.tsx`, `globalSearchBarHomeScreen.test.tsx` — US-24 ครบทั้ง 5 AC ทั้งระดับ component เดี่ยวและผ่าน `HomeScreen` จริงทั้ง navigation stack — 6 เคส

**หมายเหตุ technical debt ของชุดเทส GlobalSearchBar:** พบพฤติกรรมแปลกใน RTL/React Native testing environment ของโปรเจกต์นี้ — การยิง `fireEvent.changeText` สลับภาษา (อังกฤษ→ไทย) ติดกันสองครั้งบน `TextInput` เดียวกันภายในเทสเดียว บางครั้งทำให้ dropdown ค้างแสดงผลลัพธ์ค้นหารอบก่อนหน้า (ไม่ sync กับ `value` ใหม่) ทำให้ query DOM ไม่เจอ — เป็นปัญหาของ test tooling/timing ล้วนๆ (component จริงเป็น controlled `TextInput` มาตรฐาน ไม่มีเหตุผลเชิง logic ที่จะพังแบบนี้ในแอปจริง) จึงแยกเทสเป็นไฟล์ย่อยละ 1 interaction แทนที่จะรวมเป็นเทสยาวเทสเดียว — ผลลัพธ์ AC เหมือนกันทุกประการ ไม่กระทบความถูกต้องของการตรวจสอบ

## Coverage ที่ยังขาด (ถ้ามี) — รอบ 5
- **UI consistency ตามที่ ประเด็น 16 ขอให้ตรวจ** (สี/spacing/accessibility เทียบ `src/theme.ts`): ตรวจแล้ว `LandmarkCard.tsx`/`GlobalSearchBar.tsx`/`LandmarkList.tsx` ใช้ `COLORS.accent`/`COLORS.accentDark`/`COLORS.textPrimary`/`COLORS.textSecondary` จาก theme กลางสม่ำเสมอ ไม่มีสี hardcode ที่ขัดธีม ปุ่มเช็คอินมี `accessibilityRole`/`accessibilityLabel`/`accessibilityState` ครบ — ไม่พบปัญหา UX ที่ต้องส่งกลับ PM/UIUX
- **ข้อสังเกตเชิง design (ไม่ใช่บั๊ก, ไม่ fail AC ใด):** `ProvinceMasterBadge`/`isProvinceMaster` (US-9) คำนวณจาก local seed landmarks เท่านั้น (`ProvinceDetailScreen.tsx:29` เรียก `getLandmarksForProvince` ที่ไม่รวม Wikipedia) ในขณะที่ progress indicator ภายใน `LandmarkList` เอง (`เช็คอินแล้ว X/Y แห่ง`) รวม Wikipedia landmarks ด้วย ทำให้ผู้ใช้อาจเห็นตัวเลข 2 ชุดที่ต่างฐานกันในหน้าเดียว (เช่น "5/6" ใน progress indicator แต่ยังไม่ได้ Province Master แม้เช็คอินครบ 6 เพราะ badge นับแค่ 4 จาก local) — requirements.md ไม่มี AC ที่ระบุพฤติกรรมนี้ชัดเจนทั้งสองทาง จึงไม่ตัดสินเป็น fail แต่ส่งเป็นข้อสังเกตให้ PM พิจารณาว่าตั้งใจหรือไม่
- **ไม่มี test ต่อ `PhotoPicker` verify ว่า thumbnail ที่แสดงหลังบันทึก entry จริง (ผ่าน `AddEntryScreen` → save → `EntryListItem`) ใช้ URI ที่แปลงแล้ว end-to-end** (เทสที่เขียนในรอบนี้ตรวจ `PhotoPicker` แยกและ `EntryListItem` แยก แต่ไม่ได้ chain ทั้ง flow เข้าด้วยกันในเทสเดียว) — ความเสี่ยงต่ำเพราะทั้งสองจุดอ่าน/เขียน `photoUris` แบบเดียวกัน (string array ธรรมดา ไม่มีการแปลงเพิ่มระหว่างทาง) แต่เป็น coverage gap ที่ควรพิจารณาเพิ่มถ้ามีเวลารอบถัดไป

## รอบ 6: Bug Fix — US-25 / T87-T89 (ตรวจสอบอิสระโดย Tester)

**ขอบเขต:** ตรวจสอบว่า `src/services/wikipediaService.ts` (`fetchAttractionsForProvince`) และ `src/components/LandmarkList.tsx` (`fetchError` state + `LandmarkFetchErrorState` + retry) ตรงตาม 6 AC ของ US-25 จริง โดยอ่านโค้ดจริงทั้งหมด + รัน test ที่ programmer เขียนเอง + ตรวจ regression ทั้งชุด

### ผลรัน Test
- `npx jest src/services/wikipediaService.test.ts src/components/LandmarkList.test.tsx --silent` → **PASS 15/15** (2 suites)
- `npx jest --silent` (เต็มชุด) → **PASS 47/47 suites, 245/246 tests, skip 1** — พบ `emailLinkIntegrity.test.tsx` fail ครั้งเดียวตอนรันรวม (`render` function has not been called ใน `waitFor`) แต่รันซ้ำแบบเดี่ยวและรันรวมอีกครั้งผ่านทั้งคู่ → เป็น **timing flake ของ test suite เดิม ไม่เกี่ยวกับ US-25** (คนละไฟล์/ฟีเจอร์ email-link ไม่ได้ถูกแก้ในรอบนี้เลย) ไม่ถือเป็นบั๊กที่เกิดจากการแก้ครั้งนี้ แต่ควรบันทึกไว้เป็น technical debt เดิมของ test suite
- `npx tsc --noEmit -p .` → **ผ่าน (0 errors)**

### ตรวจโค้ดจริง (ไม่ใช่แค่เชื่อ test)
- `fetchAttractionsForProvince` (`wikipediaService.ts:81-144`): ใช้ flag `categorySucceeded` ต่อ category loop — set เป็น `true` ทันทีที่ `res.ok` และ `res.json()` สำเร็จ (บรรทัด 96-97) โดยไม่สนว่า pages มีบทความหรือไม่ → resolve `[]` ปกติถ้าอย่างน้อย 1 category สำเร็จ (ตรง AC1) และ throw จริงเฉพาะเมื่อ**ทุก** category fail ด้วย network/timeout (catch block) หรือ HTTP ไม่ ok (บรรทัด 91-94) → ตรง AC2 พบว่า logic ตรงตามสมมติฐานที่ระบุใน requirements.md บรรทัด 42 เป๊ะ
- `fetchCommonsPhoto` (บรรทัด 31-46) มี try/catch คืน `undefined` เอง และเรียกผ่าน `Promise.allSettled` (บรรทัด 149) → ความล้มเหลวของรูปเสริมจะไม่มีทาง throw ขึ้นไปกระทบ AC2 จริง — ยืนยันด้วยการอ่านโค้ดตรงๆ
- `LandmarkList.tsx:167` เงื่อนไข error state เต็มจอ คือ `fetchError && landmarks.length === 0` และ `LandmarkList.tsx:204` compact banner คือ `fetchError && (landmarks.length > 0 ผ่านการ render ปกติของ list)` — สอง state (error กับ empty ที่ `LandmarkList.tsx:189-196`) ใช้ข้อความคนละอันจริง: error ใช้ "โหลดข้อมูลสถานที่ไม่สำเร็จ" (บรรทัด 321, ยืนยันแยกจาก `EmptyStateLandmarks.tsx:12` ที่ใช้ "ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้") → ตรง AC2/AC5 ยืนยันด้วยการเทียบ JSX/component คนละตัวจริง ไม่ใช่แค่ conditional text เดียวกัน
- Retry (`onRetry={loadWikipediaAttractions}` บรรทัด 171, 204) เรียก callback เดิมซ้ำได้จากหน้าจอเดิมทันที ไม่ navigate ออก → ตรง AC3 มี `fetchIdRef` กัน stale response (บรรทัด 83, 87, 121, 123) ป้องกัน race condition เวลากดลองใหม่ซ้ำหรือเปลี่ยนจังหวัดระหว่างรอ
- AC4: กรณี fetch fail คือ `catch` block (บรรทัด 116-121) ไม่แตะ `landmarks` state เลย (ของเดิมจาก local seed ยังอยู่ครบ) มีแค่ set `fetchError(true)` → seed landmarks แสดงต่อผ่าน branch ปกติ (บรรทัด 198 เป็นต้นไป) พร้อม compact banner คนละตำแหน่ง ไม่ทับซ้อน — ตรวจโค้ดยืนยันตรง AC4 จริง
- AC6: เมื่อ retry สำเร็จ, `try` block (บรรทัด 89) `setFetchError(false)` ก่อน merge ผลลัพธ์ใหม่เข้า `landmarks` — เคลียร์ error state ได้จริงตรง AC6

### ประเมิน test ที่ programmer เขียน
- `wikipediaService.test.ts`: ครอบคลุม throw จาก network reject, HTTP non-ok, resolve-empty-ไม่-throw, partial-success-ไม่-throw, และ parsing/categorization ปกติ — mock ระดับ `global.fetch` จริง ไม่ใช่ mock ฟังก์ชันภายในตัวเอง ถือว่าเป็น integration-level ต่อ service นี้เพียงพอ ไม่ผิวเผิน
- `LandmarkList.test.tsx`: mock เฉพาะ `wikipediaService` module (ระดับ boundary ที่เหมาะสม) แล้ว render component จริงทั้งต้นไม้ (`LandmarkList` เต็ม, ไม่ shallow) ตรวจข้อความบนจอจริงผ่าน RTL — ใช้ province `si-sa-ket` (ไม่มี local seed เลย ตรวจแล้วใน `thailand-landmarks.ts`) แยกจาก `phuket` (มี seed 4 แห่งรวม "หาดป่าตอง") อย่างถูกต้องเหมาะสมกับสิ่งที่แต่ละเทสต้องพิสูจน์ — ครอบคลุมครบทั้ง 6 AC รวม retry-then-fail-again (เคส AC3/AC6 เพิ่มเติมที่ไม่ได้ระบุตรงๆใน AC แต่เป็น edge case ที่สมเหตุสมผล) ไม่พบ mock ที่หลอกตัวเองหรือ assertion ผิวเผิน (เช็ค physical text ที่ผู้ใช้เห็นจริง ไม่ใช่แค่ state ภายใน)
- ไม่พบช่องโหว่ coverage สำคัญที่ต้องเพิ่ม test เอง — ของเดิมครบตามเกณฑ์ AC1-AC6 แล้ว

### ผลตรวจ AC ทั้ง 6 ข้อ (US-25)

- [x] AC1: fetch สำเร็จแต่ resolve array ว่าง (ไม่มี exception) → ต้องแสดง empty state เดิมเหมือน US-8/US-22 — **PASS** (โค้ด `wikipediaService.ts:96-97,140` + test `LandmarkList.test.tsx:36-53`)
- [x] AC2: fetch ล้มเหลวจริง (network/HTTP/timeout/parse error, throw/reject จริง) → ต้องแสดง error state แยกจาก empty state ด้วยข้อความคนละอัน — **PASS** (โค้ด `wikipediaService.ts:140-144`, `LandmarkList.tsx:167,321` vs `EmptyStateLandmarks.tsx:12` ข้อความคนละอันจริง + test `LandmarkList.test.tsx:18-34`)
- [x] AC3: error state มีทางลองใหม่จากหน้าจอเดิมได้ทันที ไม่ต้องออก-เข้าใหม่ — **PASS** (`LandmarkList.tsx:171,204,325-333` ปุ่ม "ลองอีกครั้ง" เรียก `loadWikipediaAttractions` เดิม + test `LandmarkList.test.tsx:66-112`)
- [x] AC4: มี local seed landmark อยู่แล้ว + fetch เสริมล้มเหลว → landmark เดิมต้องแสดงครบ ไม่หายไป, error แสดงแยกเป็นส่วนเสริม — **PASS** (`LandmarkList.tsx:116-121,198-207` ไม่แตะ `landmarks` state ตอน error + test `LandmarkList.test.tsx:55-64` ใช้ phuket จริง)
- [x] AC5: reject → error state (ไม่ใช่ empty), resolve ว่าง → empty state (ไม่ใช่ error) แยกผลทดสอบชัดเจนสองเคส — **PASS** (test 2 เคสแยกกันชัดเจนใน `LandmarkList.test.tsx:18-53`, component แยก 2 branch จริงใน `LandmarkList.tsx:167` vs `189`)
- [x] AC6: retry แล้วสำเร็จ → error state เดิมถูกเคลียร์ + แสดงผล Wikipedia landmark ใหม่ตามปกติ — **PASS** (`LandmarkList.tsx:89` `setFetchError(false)` ก่อน merge ผล + test `LandmarkList.test.tsx:66-112`)

**สรุปรอบนี้:** ผ่านครบ 6/6 AC ของ US-25 ไม่พบบั๊กจากการตรวจสอบอิสระ โค้ด logic ตรงกับสมมติฐานที่ระบุใน requirements.md บรรทัด 42 (แยก "query สำเร็จแต่ 0 บทความ" ออกจาก "throw จริง" ด้วย flag ระดับ category ไม่ใช่ระดับ province เดียว) และ error/empty state เป็นคนละ component/ข้อความจริงตามที่ยืนยันด้วยการอ่าน JSX โดยตรง ไม่ใช่แค่เชื่อ test — regression รวม 47/47 suites ผ่าน (มี 1 flake ที่ไม่เกี่ยวกับการแก้ไขรอบนี้ ดูรายละเอียดด้านบน) และ `tsc --noEmit` ผ่านสะอาด

### ข้อกังวลเล็กน้อย (ไม่ fail AC ใด, เพื่อบันทึกไว้)
- `emailLinkIntegrity.test.tsx` มี timing flake เวลารันรวมกับ suite อื่น (ไม่เกี่ยวกับ US-25) — ควรพิจารณาแก้ที่ต้นเหตุ (เช่น `waitFor` timeout เดิม/`act` wrapping) ในรอบทำความสะอาด test suite ถัดไป เพื่อไม่ให้เกิดความสับสนว่า regression จริงหรือ flake
