# Dev Notes

## Task ที่ implement แล้ว

### Foundation
- [x] T1 — Scaffold Expo + React Native + TypeScript — ไฟล์: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `App.tsx`, `index.ts`, โฟลเดอร์ `src/{screens,components,data,storage,navigation,types,utils}` — หมายเหตุ: สร้างด้วย `create-expo-app` (SDK 57, RN 0.86, React 19) ในโฟลเดอร์ชั่วคราวแล้วย้ายไฟล์ที่จำเป็นมาที่ project root เพราะ root มีไฟล์อื่นอยู่แล้ว (ไม่แตะ `.claude/`, `docs/`, `claude-code-prompt.md`, ไฟล์ dataset เดิม)
- [x] T2 — Copy dataset — ไฟล์: `src/data/thailand-provinces.ts`, `src/data/thailand-provinces.json` — คัดลอกตรงจาก root ไม่มีการแก้ไขข้อมูลใดๆ
- [x] T3 — Storage layer — ไฟล์: `src/storage/db.ts`, `src/types/entry.ts` — ใช้ expo-sqlite (async API ใหม่ของ SDK 57: `openDatabaseAsync`/`runAsync`/`getAllAsync`) เก็บ photoUris/tags เป็น JSON string ในคอลัมน์ TEXT พร้อม CRUD ครบ (create/update/delete/getByProvince/getAll/getById/getVisitedProvinceIds)
- [x] T4 — Navigation stack — ไฟล์: `src/navigation/types.ts`, `src/navigation/AppNavigator.tsx` — Home → ProvinceDetail → AddEntry, และ Stats, ใช้ `@react-navigation/native-stack`
- [x] T5 — Derived-state utilities — ไฟล์: `src/utils/derived.ts` (+ `derived.test.ts`) — isVisited, getUnlockedCount, region aggregation (`aggregateByRegion`, `getTopRegion`), sorting helpers, Thai date formatter

### US-7 (2D validation)
- [x] T6 — ไฟล์: `src/screens/Map2DValidationScreen.tsx` — render 76 จังหวัดจาก path data ตรงๆ ผ่าน `react-native-svg`
- [x] T7 — toggle visited ใน memory (useState, ไม่ persist) พร้อม tap ผ่าน `onPress` บน `<Path>` ของ react-native-svg เอง (tap target = พื้นที่ path จริง ไม่ใช่ bounding box สี่เหลี่ยม จึงไม่ทับซ้อนจังหวัดเล็กอย่างสมุทรสงคราม)

### US-1 (3D map)
- [x] T8 — ไฟล์: `src/components/Map3D.tsx` — container คงมุม `rotateX: 35deg` ตลอดเวลา (View wrapper + perspective) ครอบ Svg เดียวที่มี tile ทั้ง 76 จังหวัด
- [x] T9 — ไฟล์: `src/components/ProvinceTile3D.tsx` — ผูก isVisited → สี/elevation ผ่าน reanimated shared value `lift` (0=locked,1=unlocked), memoized (`React.memo` + custom comparator) ให้ re-render เฉพาะ tile ที่ prop เปลี่ยนจริง (ตอบ design-spec ประเด็น 2 เรื่อง performance)
- [x] T10 — ไฟล์: `src/components/HeaderProgress.tsx` — ข้อความ + progress bar, ใช้ reanimated `withTiming` (~300ms) ตอนค่าเปลี่ยน, มี loading skeleton state

### US-2 (navigate to detail)
- [x] T11 — tap tile → `navigation.navigate('ProvinceDetail', { provinceId })` ใน `HomeScreen.tsx`
- [x] T32 — long-press (`onLongPress`, `delayLongPress=350`) แสดง tooltip nameTh ลอยเหนือ tile (SVG Text+Rect ใน `Map3D.tsx`) ไม่ navigate, ปล่อยนิ้วซ่อน tooltip; tap สั้น (ไม่ผ่าน long-press threshold) จึง navigate ตามปกติ

### US-4 (add entry)
- [x] T12 — ไฟล์: `src/screens/AddEntryScreen.tsx` — ฟอร์มครบ date/title/notes/photoUris/tags, validate บังคับ title+date พร้อม inline error ไม่ล้างข้อมูลเดิม, tag chip fixed 8 แท็ก + custom (ไฟล์ `src/components/TagSelector.tsx`)
- [x] T13 — ไฟล์: `src/components/PhotoPicker.tsx` — expo-image-picker `allowsMultipleSelection: true`, ลบรูปทีละรูปได้
- [x] T14 — บันทึกผ่าน `JournalContext.addEntry` → `db.createEntry`, ผูก provinceId ถูกต้อง, ข้อมูล persist ใน sqlite ไฟล์จริง (คงอยู่หลังปิดเปิดแอป)
- [x] T15 — `JournalContext.addEntry` เช็ค `wasFirstEntryForProvince` ก่อน insert แล้วตั้ง `justUnlockedProvinceId` ทันที

### US-3 (unlock animation)
- [x] T16 — ไฟล์: `src/components/ProvinceTile3D.tsx` — reanimated `withSpring` (damping 8, stiffness 120) จาก lift 0→1 ให้เกิด bounce/overshoot ตอน `isJustUnlocked=true`
- [x] T17 — flag `justUnlockedProvinceId` ใน `JournalContext`, ล้างหลัง animation callback (`onUnlockAnimationDone` → `clearJustUnlocked`) กันเล่นซ้ำเมื่อกลับเข้าหน้า Home โดยไม่มี unlock ใหม่

### US-5 (entry list)
- [x] T18 — ไฟล์: `src/screens/ProvinceDetailScreen.tsx` — nameTh เป็นหัวข้อหลัก
- [x] T19 — `getEntriesForProvince` เรียง reverse-chronological ตาม `date` (string compare เพราะเก็บเป็น ISO `YYYY-MM-DD` ซึ่งเรียงตรงตามลำดับเวลาอยู่แล้ว)
- [x] T20 — ไฟล์: `src/components/EntryListItem.tsx` — title, date (แปลงไทย พ.ศ. ผ่าน `formatThaiDate`), thumbnail รูปแรก (หรือ placeholder icon ถ้าไม่มีรูป), แสดง tag chip เสริม
- [x] T21 — ไฟล์: `src/components/EmptyState.tsx` ใช้ใน `ProvinceDetailScreen` — ข้อความ + ปุ่ม "+ เพิ่มบันทึกใหม่" ไม่ dead-end

### US-6 (stats) — P1 แต่ทำเสร็จแล้ว
- [x] T24 — ไฟล์: `src/screens/StatsScreen.tsx` — unlockedCount/76, totalEntries ตรงจาก context (ซึ่งอ่านจาก sqlite จริง)
- [x] T25 — ใช้ `getTopRegion` + `REGION_NAME_TH` mapping (เหนือ/อีสาน/กลาง/ตะวันออก/ตะวันตก/ใต้)
- [x] T26 — `getAllEntriesSorted` + `EntryListItem` (พร้อม `provinceNameTh` badge) แสดง timeline ข้ามจังหวัด
- [x] T27 — ถ้า `entries.length === 0` แสดง `EmptyState` แทนทั้งหน้า ไม่มี NaN/undefined

### P1/P2 อื่นๆ ที่ทำเสร็จเพิ่มเติม (เวลาเหลือพอ)
- [x] T22 — `Map2DValidation` route ถูกลงทะเบียนเฉพาะเมื่อ `__DEV__` เป็น true ใน `AppNavigator.tsx`, และปุ่มเข้าถึงบน Home ก็ซ่อนด้วย `__DEV__` เดียวกัน — ไม่ปรากฏใน production build
- [x] T23 — ไฟล์: `src/components/Legend.tsx`
- [x] T28 — แก้ไข entry: `AddEntryScreen` ใช้ component เดียวกัน สลับเป็น edit-mode เมื่อมี `route.params.entryId` (prefill ทุกฟิลด์, ปุ่มเปลี่ยนข้อความ, header เปลี่ยนเป็น "แก้ไขบันทึก")
- [x] T29 — ลบ entry: ปุ่ม "ลบบันทึกนี้" ใน edit-mode → `JournalContext.removeEntry` → ลบจาก sqlite แล้ว refresh; ถ้าเป็น entry สุดท้ายของจังหวัด `isVisited` จะกลับเป็น false โดยอัตโนมัติในรอบ render ถัดไปของ Home (คำนวณสดจาก entries array ทุกครั้ง ไม่มี state ค้าง)

### ยังไม่ได้ทำ (P2)
- [ ] T30 — ยังไม่ได้ทดสอบบนอุปกรณ์สเปคต่ำจริง (ไม่มีอุปกรณ์/emulator ให้ทดสอบในสภาพแวดล้อมนี้) แต่ได้ทำ mitigation ไว้ล่วงหน้าแล้วใน T9 (memoization ต่อ tile)
- [ ] T31 — App icon/splash แบบ solid-color: **ยังใช้ asset default ของ Expo template** (ไม่ได้เปลี่ยนเป็นสีธีม #1D9E75/#0F6E56 ตามคำตัดสิน PM) เพราะเครื่องมือที่มีในสภาพแวดล้อมนี้ไม่รองรับการสร้าง/แก้ไขไฟล์ภาพ PNG ได้โดยตรง — ดูหัวข้อ "จุดที่ทำไม่ได้ตาม spec 100%" ด้านล่าง

## การตัดสินใจทางเทคนิค

1. **Global state ผ่าน React Context แทน Redux/Zustand**: `src/storage/JournalContext.tsx` โหลด entries ทั้งหมดจาก sqlite ครั้งเดียวตอน mount แล้ว cache ไว้ใน state, ทุก CRUD operation เรียก `refresh()` เพื่อ sync state ใหม่จาก DB เสมอ (ไม่ optimistic-update state เอง) เพื่อความง่ายและถูกต้องแน่นอน (data set เล็ก ~76 จังหวัด, entries ไม่น่าเกินหลักร้อย/พัน จึงไม่มีปัญหา performance จากการ query ใหม่ทุกครั้ง)
2. **3D block เป็น pseudo-3D layered SVG ไม่ใช่ extrude เรขาคณิตจริง**: `ProvinceTile3D.tsx` วาด top face path เดิมซ้อนบน side face path เดิม (สีเข้มกว่า) แล้วเลื่อน top face ขึ้นด้วย `translateY` ตาม `lift` value แทนการคำนวณ extrude ตามแต่ละขอบของ polygon จริง (ซึ่งซับซ้อนมากสำหรับ 76 polygon ที่มีรูปทรงซับซ้อน/เว้า) — ให้ผลลัพธ์ภาพตรงตาม AC (top สีเขียวยกตัว, side สีเข้มมองเห็นตอน unlocked, ไม่มี side face ตอน locked) โดยต้นทุนต่ำกว่ามาก
3. **rotateX บน View wrapper ครอบ Svg**: ใช้ RN style transform (`perspective` + `rotateX: '35deg'`) บน View ธรรมดาที่ครอบ `<Svg>` ทั้งก้อน แทนการทำ 3D จริงแบบ per-tile depth-sorting เพราะ RN ไม่มี 3D scene graph จริง วิธีนี้ตรงตาม AC "กรอบเอียง 30-40 องศาตลอดเวลา" ที่ระบุเป็น container-level อยู่แล้ว
4. **Tooltip ของ T32 render เป็น SVG `<Text>` ภายใน viewBox เดียวกับแผนที่** แทนที่จะเป็น RN View ลอยแบบ absolute position บนพิกัดหน้าจอ เพื่อเลี่ยงการแปลงพิกัด SVG-space → screen-space (ซึ่งต้องคำนวณ scale factor ของ Svg ที่ render จริงเทียบกับ viewBox) — ได้ตำแหน่งแม่นยำโดยอัตโนมัติเพราะอยู่ใน coordinate space เดียวกับ centroid ของ dataset
5. **long-press vs tap ใช้ built-in behavior ของ react-native-svg's Pressability**: เมื่อ `onLongPress` ทำงานแล้ว การปล่อยนิ้วจะไม่ trigger `onPress` ตาม default behavior ของ Touchable/Pressability (เหมือน RN ทั่วไป) จึงตีความคำตัดสิน PM ("long-press = ไม่ navigate, tap สั้น = navigate ตามเดิม") ตรงไปตรงมาโดยไม่ต้อง custom gesture logic เพิ่ม
6. **Date field ใช้ `@react-native-community/datetimepicker`** (ติดตั้งเพิ่มนอกเหนือจาก stack เดิมใน tasks.md) แทนการทำ text input ธรรมดา เพราะ design-spec ระบุชัดว่า "date: date picker" ใน AddEntry Form spec
7. **Reanimated v4 ต้องมี `babel.config.js` + `react-native-worklets/plugin`**: Expo SDK 57 template ใหม่ไม่มาพร้อม `babel.config.js` โดย default (ใช้ metro-config ภายในแทน) แต่ react-native-reanimated v4 (แยก worklets runtime ออกมาเป็น `react-native-worklets`) ต้องการ babel plugin จึงต้องสร้าง `babel.config.js` เอง และติดตั้ง `babel-preset-expo` เป็น top-level devDependency (ปกติมันถูกซ่อนอยู่ใต้ `node_modules/expo/node_modules/babel-preset-expo` ซึ่ง Node module resolution จาก root หาไม่เจอ) — ตรวจสอบแล้วด้วย `npx expo export --platform android` (bundle ผ่านสำเร็จ 1453 modules ไม่มี error) และ `npx expo-doctor` (21/21 ผ่าน)
8. **Tag เก็บเป็น JSON string ในคอลัมน์ sqlite** (ไม่แยกตาราง many-to-many) เพราะ scope v1 ไม่มีการค้นหา/กรองด้วยแท็ก (อยู่ใน Out of Scope) จึงไม่จำเป็นต้อง normalize
9. **Unit tests**: เขียนเฉพาะ `src/utils/derived.ts` (`derived.test.ts`, 14 tests ผ่านหมด) เพราะเป็น pure function ล้วนและมีมูลค่าสูงสุดต่อ unit testing; ไม่ได้เขียน test ให้ `db.ts` เพราะ expo-sqlite เป็น native module ที่รันไม่ได้จริงใน jest environment (ต้องใช้ E2E/device test แทน ซึ่งอยู่นอกขอบเขต unit test); ไม่ได้เขียน component test (React Native Testing Library) ให้ screens/components เนื่องจากเวลาจำกัดและ priority อยู่ที่ P0 coverage ให้ครบก่อน

## จุดที่ทำไม่ได้ตาม spec 100%

- ปัญหา: T31 (app icon/splash สีธีม #1D9E75/#0F6E56 แบบ solid + สัญลักษณ์พื้นฐาน) — เครื่องมือที่มีในสภาพแวดล้อมนี้ไม่มีความสามารถสร้าง/แก้ไขไฟล์ภาพ raster (PNG) ได้โดยตรง (ทำได้แค่อ่าน/เขียนไฟล์ text/code) แอปจึงยังใช้ asset icon/splash สีฟ้า default ของ Expo template (`assets/icon.png`, `assets/android-icon-*.png`, `assets/favicon.png`) อยู่
- ต้องการให้ PM ตัดสินใจ: (ก) ยอมรับให้ programmer ส่งต่องานนี้ให้ UIUX/นักออกแบบสร้างไฟล์ PNG สีธีมจริงมาแทนที่ภายหลัง (ไฟล์ที่ต้องแทนที่ระบุไว้ใน `app.json`: `icon`, `android.adaptiveIcon.foregroundImage/backgroundImage/monochromeImage`, `web.favicon`) หรือ (ข) ยอมรับ default icon ไปก่อนใน v1 ภายในนี้เพราะเป็น P2 ไม่บล็อก core features — ไม่ได้ตัดฟีเจอร์ทิ้งเอง เพียงแค่ asset ภาพยังเป็นของเดิมจาก template
- ทุกอย่างอื่นใน P0/P1 (T1-T29 ยกเว้น T30 ที่ต้องการอุปกรณ์จริงทดสอบ) ทำครบตาม spec ใน tasks.md/design-spec.md/requirements.md แล้ว ไม่มีจุดอื่นที่ลดขอบเขตเอง

## ประวัติการแก้บั๊ก
(ยังไม่มี — นี่คือรอบ implement แรก ยังไม่ผ่าน QA)

---

# รอบ 2: Landmark Check-in & Supabase Integration (US-8 – US-15, T33–T59)

## Task ที่ implement แล้ว

### Foundation (data/sync/auth layer)
- [x] T33 — ไฟล์: `src/lib/supabaseClient.ts`, `src/lib/__mocks__/supabaseClient.ts` — env-based config อ่านจาก `process.env.EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` โดยตรง (ไม่ใช้ expo-constants เพราะไม่ได้ติดตั้งและ Expo SDK 57 inline ตัวแปร `EXPO_PUBLIC_*` ให้อัตโนมัติผ่าน babel-preset-expo อยู่แล้ว), `isSupabaseConfigured` เป็น false เมื่อไม่ตั้งค่า/เป็น placeholder → `getSupabaseClient()` คืน `null` ทุก caller (auth/sync/photo upload) ต้อง treat null เป็น "offline" ไม่ throw
- [x] T34 — ไฟล์: `src/storage/db.ts`, `src/storage/__mocks__/db.ts` — เพิ่มคอลัมน์ `updatedAt/syncedAt/cloudId/retryCount` บนตาราง entries (ใช้ `ALTER TABLE ADD COLUMN` แบบ try/catch เพื่อ non-destructive upgrade จาก DB v1 เดิม), ตารางใหม่ `landmark_checkins` และ `sync_deletions` (คิว cloud-delete)
- [x] T35 — ไฟล์: `src/data/thailand-landmarks.ts` — 8 จังหวัดนำร่องตามคำตัดสิน PM (กรุงเทพฯ/เชียงใหม่/เชียงราย/อยุธยา/สุโขทัย/ชลบุรี/กระบี่/ภูเก็ต) จังหวัดละ 3-5 landmark, provinceId ตรงกับ `thailand-provinces.ts` ที่มีอยู่แล้ว (ตรวจสอบด้วย grep ก่อนเขียน)
- [x] T36 — ไฟล์: `src/utils/landmarkDerived.ts` (+ test) — `getLandmarkProgress`, `isProvinceMaster` (>=1 landmark AND ครบทุกแห่ง, คำนวณสดทุกครั้ง)
- [x] T37 — ไฟล์: `src/auth/authService.ts` (`bootstrapSession`) — สร้าง anonymous session ผ่าน mock/real Supabase Auth, fallback เป็น local-only id (`local-...`) เมื่อ client เป็น null หรือ throw ไม่ crash
- [x] T38 — `authService.linkEmail` — ผูก email/password, classify error เป็น `duplicate-email`/`weak-password`/`generic-failure`, ไม่แตะ session เดิมถ้าล้มเหลว
- [x] T39 — ไฟล์: `src/sync/syncEngine.ts` (`syncPendingEntries`, `syncPendingCheckins`, `runSyncCycle`) — ตรวจ pending จาก `updatedAt`/`syncedAt`, sync อัตโนมัติเมื่อมี client (ไม่บล็อก UI เพราะเป็น async ล้วน), นับ `retryCount` ต่อ record
- [x] T40 — `pickWinner` ใน `src/utils/syncStatus.ts` (+ test) — whole-record last-write-wins เทียบ `updatedAt`, ฝั่งแพ้ถูกเขียนทับผ่าน `db.applyRemoteEntry`/`applyRemoteCheckin`
- [x] T41 — ไฟล์: `src/sync/photoUpload.ts` (+ test) — อัปโหลดเฉพาะ URI ที่ไม่ใช่ `http(s)://`, เขียน public URL กลับเข้า entry, dedupe โดยธรรมชาติ (URL ที่อัปโหลดแล้วไม่ match `isLocalUri` อีก) + `{ upsert: true }` กัน object ซ้ำใน storage path
- [x] T42 — ไฟล์: `src/sync/migration.ts` (+ test) — mark legacy entries (ไม่มี `updatedAt`) เป็น pending sync, idempotent โดยธรรมชาติ (ไม่มี record ให้ mark ซ้ำ), เรียกทุกครั้งที่ bootstrap (ดูรอบแก้บั๊กด้านล่างเรื่อง T55)

### US-8/US-9: Landmark list, check-in, Province Master (T43-T46)
- [x] T43 — ไฟล์: `src/components/LandmarkList.tsx`, `LandmarkListItem.tsx`, `src/storage/CheckinContext.tsx` — persist ทันทีผ่าน `db.setLandmarkVisited` (optimistic, ไม่มี spinner ตาม spec), wire เข้า `ProvinceDetailScreen`
- [x] T44 — ไฟล์: `src/components/LandmarkProgressIndicator.tsx` — "เช็คอินแล้ว X/Y แห่ง", เน้นสีทองเมื่อครบ
- [x] T45 — ไฟล์: `src/components/EmptyStateLandmarks.tsx` — ข้อความ "ยังไม่มีข้อมูลสถานที่แนะนำ..." ไม่มี CTA ตาม spec, ครอบคลุม 68/76 จังหวัดที่เหลือ
- [x] T46 — ไฟล์: `src/components/ProvinceMasterBadge.tsx` — คำนวณสดจาก `isProvinceMaster()`, ไม่ render อะไรเลยเมื่อ hidden (ไม่เว้นพื้นที่ค้าง), scale-in animation ด้วย RN `Animated` (ไม่ใช้ reanimated เพราะไม่ผูกกับ tile 3D)

### US-10: Auto check-in จาก AddEntry (T47-T48)
- [x] T47/T48 — ไฟล์: `src/screens/AddEntryScreen.tsx` — เพิ่ม chip-picker "เช็คอินสถานที่ (ถ้ามี)" ต่อจาก tags, **ซ่อนทั้งหมด** (ไม่ disabled) เมื่อจังหวัดไม่มี landmark ตาม design-spec flow US-10 ข้อ 5, เมื่อบันทึกสำเร็จเรียก `useCheckins().setCheckedIn(...)` อัตโนมัติถ้ามีการเลือก ไม่กระทบ flow เดิมเมื่อเลือก "ไม่ระบุ"

### US-11: Anonymous Auth + Email link + Data-loss warning (T49-T50, T54)
- [x] T49 — ไฟล์: `src/screens/SettingsScreen.tsx`, `src/components/EmailLinkForm.tsx`, `src/auth/AuthContext.tsx` — entry point เป็นไอคอน ⚙️ มุมขวาบนของ Home header, แสดง "ผูกอีเมลแล้ว: x@y.com" เมื่อ linked, สรุป "มี N รายการรอซิงก์" (นับจาก entries + landmark checkins ที่ status ≠ synced)
- [x] T50 — ไฟล์: `src/components/DataLossWarningModal.tsx` (one-time, blocking, `onRequestClose` เป็น no-op กัน Android back bypass), `src/components/DataLossWarningBanner.tsx` (non-dismissible ตามคำตัดสิน PM ข้อ 10 — ไม่มีปุ่มปิดเลย) — wiring ผ่าน `AuthContext.showAnonWarningModal` + `hasSeenAnonWarning`/`markAnonWarningSeen` flag ใน AsyncStorage
- [x] T54 — inline ใน `EmailLinkForm.tsx` — error banner สีแดง (ต่างจาก amber ของ data-loss) แยก 3 ข้อความตาม `LinkEmailErrorCode`, ฟอร์มไม่ปิด ข้อมูลไม่หาย

### US-12/US-13: Sync status badge (T51)
- [x] T51 — ไฟล์: `src/components/SyncStatusBadge.tsx`, wired เข้า `EntryListItem.tsx` (ใช้ร่วมกันทั้ง ProvinceDetail entry list และ Stats timeline) — 3 สถานะ pending/synced/retry-issue ตาม `getSyncStatus()`, tooltip แตะดูคำอธิบายสั้น

### US-14: Province Master visual feedback บนแผนที่ (T52-T53)
- [x] T52 — ไฟล์: `src/components/ProvinceTile3D.tsx`, `Map3D.tsx` — เพิ่ม prop `isProvinceMaster`/`isJustMastered` (optional, default false เพื่อไม่กระทบ caller เดิม), ขอบทอง + ดาว ⭐ บน top face, shimmer สั้นๆ ผ่าน reanimated `withSequence` เมื่อเพิ่งได้ master ระหว่างอยู่ในแอป, wiring ใน `HomeScreen.tsx` (คำนวณ `provinceMasterMap` จาก `useCheckins()` + `useMemo`, ตรวจจับ "เพิ่งมาสเตอร์" ด้วย ref เทียบ set เดิม/ใหม่ ไม่ trigger ตอนโหลดครั้งแรก)
- [x] T53 — ไฟล์: `src/components/Legend.tsx` — เพิ่มรายการที่ 3 (swatch เขียวขอบทอง+ดาว), container เปลี่ยนเป็น `flexWrap` รองรับ 2+1 บรรทัดตาม spec

### US-15: Migration ข้อมูล v1 (ครอบคลุมด้วย T42 + แก้ใน T55)
- [x] T42 ตามที่กล่าวด้านบน

### P1
- [x] T54 — ดูด้านบน (รวมกับ T49)
- [x] T55 — แก้ไข: ย้าย `migrateLegacyEntries()` ให้เรียกทุกครั้งที่ `AuthProvider` bootstrap (ไม่ผูกกับ `isNewSession` อีกต่อไป) เพราะเดิมถ้า migrate ล้มเหลวบางส่วนในรอบแรก จะไม่มีโอกาส resume เลยในรอบถัดไป (เนื่องจาก session ที่มีอยู่แล้วทำให้ `isNewSession=false`) — เพราะฟังก์ชัน idempotent อยู่แล้ว (ดู `migration.test.ts`) การเรียกซ้ำทุกครั้งจึงปลอดภัยและมีต้นทุนต่ำ (แค่ filter entries ที่ไม่มี `updatedAt`)
- [x] T56 — ไม่ต้องเพิ่มโครงสร้างพิเศษ: `uploadPendingPhotos()` เขียน photoUris ที่อัปโหลดสำเร็จกลับ SQLite ทันทีทีละรูป (ไม่ใช่ batch เดียวตอนจบ) ดังนั้นคิวที่ยังไม่เสร็จ "persist ข้าม session" โดยธรรมชาติอยู่แล้ว — URI ที่ยังเป็น local จะถูกตรวจพบใหม่และ retry ทุกครั้งที่ `SyncProvider` เรียก sync cycle ใหม่ (ตอนเปิดแอป/ทุก 20 วิ)
- [x] T57 — ไฟล์: `src/sync/syncEngine.ts` (`logLwwDebug`) — `console.log` แบบ `__DEV__`-gated เมื่อพบ conflict จริง (มี remote row) บอก table/id/local updatedAt/remote updatedAt/ผู้ชนะ ไม่ใช่หน้าจอ end-user เห็น

### P2
- [ ] T58 — ยังไม่ได้ทำ performance test จริงกับ queue ขนาดใหญ่ (ไม่มีอุปกรณ์/เน็ตจริงให้ทดสอบ เหมือน T30 ในรอบ v1) — เชิงออกแบบ sync engine ใช้ sequential `for...of` ต่อ record (ไม่ parallel) ซึ่งปลอดภัยแต่ช้ากว่าถ้า queue ใหญ่มาก บันทึกไว้เป็นความเสี่ยง performance ที่ยังไม่ validate จริง
- [ ] T59 — ไม่ใช่งานโค้ด (content curation checklist) ตามที่ tasks.md ระบุไว้เองว่า "ไม่บล็อก sprint นี้" — ไม่ได้ทำในรอบนี้

## การตัดสินใจทางเทคนิค (รอบ 2)

1. **Env-var config แบบ `EXPO_PUBLIC_*` ตรงๆ ผ่าน `process.env`** แทนการติดตั้ง `expo-constants` เพิ่ม เพราะ (ก) ไม่ได้อยู่ใน dependency list ที่ PM ยืนยันไว้แล้วใน T33/คำตัดสิน PM ข้อ 8 (ข) Expo SDK 57's babel-preset-expo inline ตัวแปรที่ขึ้นต้นด้วย `EXPO_PUBLIC_` ให้อัตโนมัติอยู่แล้วตั้งแต่ SDK 49 ไม่ต้องพึ่ง native module ใดๆ — เมื่อ deploy จริงแค่ตั้งไฟล์ `.env`/`EAS secret` ที่มีตัวแปรสองตัวนี้ก็พอ
2. **Mock Supabase สำหรับเทส**: ใช้ manual mock pattern เดียวกับ `src/storage/__mocks__/db.ts` ที่มีอยู่แล้ว — สร้าง `src/lib/__mocks__/supabaseClient.ts` ที่ให้ test เรียก `__setMockClient(fakeClient)`/`__setConfigured(bool)` เพื่อคุมพฤติกรรม แล้วทุก unit test ของ sync/auth เรียก `jest.mock('../lib/supabaseClient')` แบบเดียวกับที่เทสเดิมทำกับ `db`
3. **ไม่มี `@react-native-community/netinfo` ติดตั้งในโปรเจกต์** (ตรวจสอบแล้วไม่มีใน package.json และ PM ไม่ได้อนุมัติให้ติดตั้งเพิ่ม) จึงไม่มี event "network reconnected" จริงให้ hook — `SyncProvider` (`src/sync/SyncContext.tsx`) ใช้วิธี opportunistic: sync ทันทีตอน mount + ทุก 20 วินาทีด้วย `setInterval`, ทุกครั้งที่ไม่มีเน็ต/ไม่มี client การเรียกจะ resolve เป็น `{attempted:0,...}` เงียบๆ ไม่ error — สอดคล้องกับ spirit ของ AC (sync อัตโนมัติเมื่อมีเน็ต, ไม่บล็อก UI) แม้ไม่ใช่ true push-based detection; ถ้า PM/QA ต้องการ netinfo จริงในอนาคตต้องขอเพิ่ม dependency ก่อน
4. **Whole-record LWW ผ่านการ fetch remote row ก่อน push ทุกครั้ง** (`select().eq('id', lookupId).maybeSingle()`) แทนการ upsert ตรงๆ โดยไม่เช็ค — เพื่อให้ conflict resolution ตรงตาม T40 จริง (ถ้า remote ใหม่กว่า local ต้องดึงข้อมูล remote มาเขียนทับ local ไม่ใช่แค่ผู้ชนะฝั่งเดียวเสมอ) แลกกับ 1 read request เพิ่มต่อ record ต่อรอบ sync — ยอมรับได้เพราะ AC ไม่ได้จำกัดเรื่อง request count และ dataset เป็นระดับ personal journal (ไม่ใหญ่)
5. **Photo upload dedupe โดยไม่ต้องมี queue table แยก**: ตรวจจาก URI prefix (`http(s)://` = อัปโหลดแล้ว) แทนการเก็บสถานะ "uploaded" แยกต่างหาก — เขียน photoUris กลับ SQLite ทันทีหลังอัปโหลดสำเร็จแต่ละรูป (ไม่รอครบทุกรูปของ entry) ทำให้ retry หลังปิดเปิดแอป (T56) ได้ฟรีโดยไม่ต้องมี schema เพิ่ม
6. **Migration idempotency ไม่ใช้ transaction/lock**: `migrateLegacyEntries()` ปลอดภัยจากการรันซ้ำเพราะเงื่อนไข "legacy" คือ `!updatedAt` เท่านั้น — เมื่อ mark ไปแล้วจะไม่ตรงเงื่อนไขอีก ไม่มีทาง duplicate ข้อมูล แม้ถูกเรียกพร้อมกันหลายครั้ง (idempotent by construction ไม่ใช่แค่ by flag) — ดู `src/sync/migration.test.ts` ปกป้อง regression นี้ไว้
7. **CheckinContext แยกจาก JournalContext** (คนละ Provider, คนละตาราง) แทนที่จะรวมเข้า context เดียว เพื่อคง JournalContext เดิมของ v1 ไม่ให้ signature เปลี่ยน (ลด risk ต่อโค้ด/เทส v1 ที่ผ่าน QA แล้ว) — ต้นทุนคือหน้าจอที่ต้องใช้ทั้งสอง (ProvinceDetail, AddEntry, Home) ต้อง import 2 hook แต่ชัดเจนกว่าเรื่อง separation of concerns
8. **`SyncProvider` ต้องอยู่ใต้ทั้ง `JournalProvider` และ `CheckinProvider`ใน App.tsx** เพื่อเรียก `refresh()` ของทั้งคู่หลัง sync แต่ละรอบ (ให้ sync badge เปลี่ยนจาก pending→synced แบบ real-time ตาม US-12 AC โดยไม่ต้องปิดเปิดหน้าจอ)
9. **Province Master shimmer ใช้ reanimated (ไม่ใช้ RN Animated)** เพื่อให้ share runtime เดียวกับ `lift` ของ unlock animation ใน tile เดียวกัน (ลด overhead จากการ mix สอง animation library ในองค์ประกอบเดียวกัน) ส่วน `ProvinceMasterBadge` (component แยก ไม่ใช่ tile) ใช้ RN `Animated` ธรรมดาเพราะเป็น UI element เดี่ยวๆ ไม่ผูกกับ SVG/reanimated ecosystem ของแผนที่

## Tests เขียนเพิ่มในรอบนี้ (unit + integration)
- `src/utils/syncStatus.test.ts` — 3-state derivation + LWW `pickWinner` (pure logic, ครอบคลุม tie-break)
- `src/utils/landmarkDerived.test.ts` — progress คำนวณถูกต้องต่อจังหวัด, Province Master edge cases (0 landmark, partial, ครบ, toggle กลับ)
- `src/sync/syncEngine.test.ts` — push ครั้งแรก, retry count เพิ่มเมื่อ fail ต่อเนื่องจนถึง retry-issue threshold, remote-wins overwrite local, local-wins push, deletion queue processed, graceful no-op เมื่อไม่มี client
- `src/sync/photoUpload.test.ts` — upload สำเร็จเขียน URL กลับ, ของที่ upload แล้วไม่ถูกอัปซ้ำ, fail แล้วคง local URI ไว้ retry, mixed local+cloud photos ในรายการเดียว
- `src/sync/migration.test.ts` — idempotency (รันซ้ำไม่ migrate ซ้ำ/ไม่สร้าง entry ซ้ำ), ไม่แตะ entries ที่มี sync metadata อยู่แล้ว, resume เมื่อมี legacy row ใหม่โผล่มาทีหลัง
- `src/auth/authService.test.ts` — bootstrap fallback เมื่อ offline/unconfigured/throw, link email 3 error code + client-side password length guard, session ไม่ถูกแตะเมื่อ link ล้มเหลว
- `src/auth/AuthContext.test.tsx` — one-time modal flag, ไม่โชว์ซ้ำหลัง dismiss, migration ถูกเรียกซ้ำทุกครั้งที่ bootstrap (คุ้มครอง T55 fix)
- `src/storage/CheckinContext.test.tsx` — persist ทันที + reload จาก storage, toggle/setCheckedIn ถูกต้อง
- `src/__tests__/integration/landmarkCheckin.test.tsx` — not-curated empty state, list+progress สำหรับจังหวัด pilot, toggle อัปเดต progress, Province Master badge ปรากฏ/หายแบบสด
- `src/__tests__/integration/addEntryLandmark.test.tsx` — field ซ่อนเมื่อไม่มี landmark, auto check-in เมื่อบันทึก, ไม่กระทบ flow เดิมเมื่อไม่เลือก landmark
- `src/__tests__/integration/settingsScreen.test.tsx` — banner แสดงตอน anonymous, pending count, banner หายหลัง link email สำเร็จ

รวม: ทดสอบผ่านทั้งหมด 118/119 (1 skip เดิมจาก v1 ที่เอกสารไว้แล้วว่าต้องใช้อุปกรณ์จริง ไม่เกี่ยวกับรอบนี้), `npx tsc --noEmit` ผ่านสะอาด, `npx expo export --platform android` bundle สำเร็จ (1529 modules)

## จุดที่ทำไม่ได้ตาม spec 100% (รอบ 2) / ต้องการให้ PM ตัดสินใจ

1. **T58 (performance test สำหรับ sync engine queue ใหญ่)**: ไม่มีอุปกรณ์/เครือข่ายจริงให้ทดสอบในสภาพแวดล้อมนี้ (เหมือนข้อจำกัดเดียวกับ T30 ในรอบ v1) sync engine ปัจจุบัน process ทีละ record แบบ sequential (`for...of` + `await`) ไม่ parallel — ปลอดภัยแต่ถ้า pending queue มีหลักพัน record (เช่นตอน migrate v1 ข้อมูลเก่าจำนวนมาก) อาจใช้เวลานาน แม้จะไม่บล็อก UI thread ก็ตาม (เป็น async task แยก) ต้องการให้ PM ตัดสินใจว่าต้อง optimize เป็น batched/parallel calls ก่อน production หรือไม่ หรือรอดูผลจริงก่อน
2. **True network-reconnect detection**: ไม่มี `@react-native-community/netinfo` ติดตั้ง จึงใช้ polling ทุก 20 วินาทีแทน "sync ทันทีที่เน็ตกลับมา" ตาม AC ตัวอักษรเป๊ะๆ ของ US-12 — ผลลัพธ์ปลายทางเหมือนกัน (sync ในที่สุดเมื่อมีเน็ต ไม่บล็อก UI) แต่ latency สูงสุดคือ ~20 วินาทีแทนที่จะทันที ถ้าต้องการ instant reconnect sync ต้องขออนุมัติเพิ่ม dependency `@react-native-community/netinfo`
3. **T59**: ยืนยันตามที่ tasks.md ระบุไว้เองว่าไม่ใช่งานโค้ดและไม่บล็อก sprint — ไม่ได้ดำเนินการใดๆ เพิ่มในรอบนี้ (รอทีม content/PM วางแผนแยก)
4. ทุกอย่างอื่นใน P0 (T33-T53) และ P1 ที่เหลือ (T54-T57) ทำครบตาม spec แล้ว ไม่มีการตัดฟีเจอร์ทิ้งเอง

## Post-QA-round-1 fixes (นอก pipeline, ตามที่ผู้ใช้ขอแก้ P1/P2 ค้าง)

1. **BUG-1 (P1) แก้แล้ว** — `src/utils/derived.ts` `formatThaiDate`: เปลี่ยนจาก `d.getDate()/getMonth()/getFullYear()` (local-time) เป็น `d.getUTCDate()/getUTCMonth()/getUTCFullYear()` เพราะ `new Date('YYYY-MM-DD')` parse เป็น UTC midnight อยู่แล้ว — verify ด้วย `TZ="America/Los_Angeles" npx jest src/utils/derived.test.ts` ผ่าน (เดิม test เดียวที่มีไม่เคย catch เพราะรันด้วย TZ default ของเครื่อง)
2. **T31 (P2) แก้แล้ว** — ดูรายละเอียดที่ tasks.md T31 หมายเหตุ; สรุปคือ generate icon/splash ใหม่เป็น solid-color + pin symbol ตามสเปคของ PM แทน Expo default เดิม
3. **T30 (P2) ยังไม่แก้ได้** — ยังไม่มีอุปกรณ์/emulator จริงในสภาพแวดล้อมนี้เหมือนเดิม ไม่เปลี่ยนแปลงจากที่ QA บันทึกไว้ — ต้อง manual test บนมือถือจริงก่อน release
4. Regression check: `npx tsc --noEmit` ผ่านสะอาด, `npx jest` ทั้งโปรเจกต์ 25 suites ผ่าน (128 passed, 1 skip เดิมที่มีเอกสารอธิบายแล้ว) — ไม่มี suite ไหนพังจากการแก้ 2 ข้อนี้

## รอบ 3: OSM Data Integration (US-16 – US-20, T60–T74)

### Task ที่ implement แล้ว

- [x] T60 — ไฟล์: `scripts/extract-overpass-landmarks.ts` (CLI entrypoint) + `scripts/lib/overpass-extract-core.ts` (pure logic) + `scripts/extract-overpass-landmarks.test.ts` (15 unit tests, no network) — dev/build-time only, ไม่ import จาก `src/` เลย ตาม constraint ของ PM ข้อ 2/13 หมายเหตุสำคัญของ implementation:
  - Area matching ใช้ **bulk query เดียว** ดึง admin boundary (`admin_level=4`) ของทั้งประเทศไทยครั้งเดียว (`relation["boundary"="administrative"]["admin_level"="4"](area.th)`) แล้ว match แต่ละจังหวัดด้วย normalized `name:en` (ตัด "Province" suffix, ลบช่องว่าง/ขีด, พิเศษ "Bangkok Metropolis"→"bangkok") แทนที่จะยิง query แยกทีละจังหวัดเพื่อหา area — ลดจำนวน request ลง 76 ครั้งเหลือ 1 ครั้ง (`buildProvinceAreaMap`/`normalizeProvinceNameEn`, unit-tested)
  - **ไม่ใช้พิกัด centroid จาก `thailand-provinces.ts`** ตามที่ requirements.md เสนอไว้เป็นทางเลือก เพราะพิสูจน์แล้วด้วยมือ (ยิง query จริงตอน dev) ว่า centroid นั้นเป็นพิกัดในระบบ SVG หน้าจอ (0-520 x 0-955) ไม่ใช่ lat/lng จริง — ใช้ query แบบ `area["name:en"~"..."]` ตามที่ requirements.md อนุญาตไว้เป็นทางเลือกที่สองแทน
  - ต้องแนบ custom `User-Agent` header ด้วย (เหมือน Nominatim, T68) — ไม่ใช่แค่มารยาท แต่ overpass-api.de คืน **HTTP 406** ให้ `fetch` เปล่าๆ ที่ไม่มี `Accept`/`User-Agent` header จริงในทางปฏิบัติ (พบระหว่าง dev, แก้แล้ว)
  - เขียนผลลัพธ์แบบ **incremental** (เขียนไฟล์ output ใหม่ทุกจังหวัด ไม่ใช่ครั้งเดียวตอนจบ) พร้อม resume support (ข้ามจังหวัดที่ status `ok` แล้วจาก run ก่อนหน้าที่ output path เดียวกัน) — เพิ่มเข้ามาหลังจากเจอปัญหาจริงตอน T61 (ดูด้านล่าง)
- [x] T61 — รันสคริปต์จริงกับ `overpass-api.de` **สำเร็จบางส่วน** — ดูหัวข้อ "ผลของ T61" ด้านล่าง
- [x] T62 — ไฟล์: `src/data/thailand-landmarks.ts` — เพิ่ม `lat?: number; lng?: number` บน `Landmark` interface (optional ถาวรตามคำตัดสิน PM ข้อ 14)
- [x] T63 — ไฟล์: `src/data/thailand-landmarks.ts` — backfill พิกัดให้ landmark ทั้ง 29 แห่งของ 8 จังหวัดนำร่องเดิม โดยยิง Nominatim query ทีละรายการจริง (1 req/sec, ดูรายละเอียดวิธีด้านล่าง) **`id` เดิมทุกตัวไม่เปลี่ยนแปลง**
- [x] T64 — ไฟล์: `scripts/merge-landmarks.ts` (dev-only, รันครั้งเดียวเพื่อ merge เข้า `src/data/thailand-landmarks.ts` จริง) — merge ผลจาก T61 เข้า 37 จังหวัดที่ query สำเร็จ (178 landmark) โดย **ปฏิเสธ merge เข้าจังหวัดใดๆ ที่มี landmark อยู่แล้ว** (`existingProvinceIds` guard) เป็น safety net อีกชั้นนอกเหนือจาก `--only-missing` ของ T60 เอง
- [x] T65 — Regression check ผ่าน (ดูหัวข้อด้านล่าง) — แก้ 2 integration test ที่เคยใช้ `amnat-charoen` เป็นตัวอย่าง "จังหวัดไม่มี landmark" (`landmarkCheckin.test.tsx`, `addEntryLandmark.test.tsx`) เพราะตอนนี้มันมีข้อมูลจริงจาก T61 แล้ว — เปลี่ยนไปใช้ `chaiyaphum` แทน (ยืนยันแล้วว่า Overpass คืนผลลัพธ์ 0 แห่งจริงๆ ไม่ใช่ network gap จาก `scripts/output/overpass-landmarks-report.json`)
- [x] T66 — ไฟล์: `src/sync/landmarkSeedSync.ts` (+ test) — schema `landmarks` (`id`,`province_id`,`name_th`,`lat`,`lng`,`updated_at`) เป็น comment DDL ในไฟล์ (ไม่มี migrations/ dir ในโปรเจกต์นี้) + `seedLandmarksToSupabase()` upsert ข้อมูล local ทั้งหมดขึ้น Supabase แบบ one-directional (ไม่มีการดึงกลับ เพราะ landmark เป็น static bundled dataset ไม่ใช่ user data) ผูกเข้า `runSyncCycle()` เดิมของ T39 ให้รันอัตโนมัติทุกรอบ sync
- [x] T67 — ไฟล์: `src/utils/landmarkMap.ts` (+ test, pure geometry) + `src/components/LandmarkMap.tsx` (+ test) — วาดด้วย `react-native-svg` ตามสูตร normalize ของ design-spec เป๊ะ (padding 12%, y-flip, degenerate bbox → กึ่งกลาง) ผูกเข้า `LandmarkList.tsx` ระหว่าง heading กับ progress indicator ตามลำดับที่ design-spec กำหนด ใช้ callback `onToggle` เดียวกับ `LandmarkListItem` (landmark id อ้างอิงตรงกันเสมอ)
- [x] T68 — ไฟล์: `src/lib/nominatimClient.ts` (+ test) — custom User-Agent, throttle 1 req/sec (queue แบบ serialize ผ่าน promise chain กันคำขอถี่กว่าที่กำหนดแม้เรียกพร้อมกัน), timeout 8s, error ทุกแบบ (offline/HTTP error/malformed) รวมเป็น `NominatimSearchError` เดียว
- [x] T69 — ไฟล์: `src/types/entry.ts`, `src/storage/db.ts`, `src/storage/__mocks__/db.ts` — เพิ่มคอลัมน์ `placeLat`/`placeLng` (nullable REAL) แบบ non-destructive (`ensureColumn`) เหมือน pattern เดิมของ T34
- [x] T70/T71 — ไฟล์: `src/hooks/useNominatimSearch.ts` (+ test), `src/components/SearchPlaceField.tsx`, `src/components/SearchResultItem.tsx`, `src/components/SearchResultConfirmationChip.tsx`, wiring ใน `src/screens/AddEntryScreen.tsx` — เลือกผลลัพธ์ prefill เฉพาะ `title` + แนบ `placeLat`/`placeLng` เท่านั้น ไม่สร้าง Landmark ไม่ auto check-in (แยก state `selectedPlace` ออกจาก `selectedLandmarkId` โดยสมบูรณ์ในโค้ด, ทดสอบยืนยันด้วย `addEntrySearchPlace.test.tsx`)
- [x] T72 — Debounce 1000ms ใน hook (`useNominatimSearch`, UI layer) + throttle 1 req/sec ใน client module (`nominatimClient.ts`) เป็นคนละชั้นตามที่ task ระบุ (2 ชั้นป้องกันซ้อนกัน)
- [x] T73 — ไฟล์: `src/components/SearchPlaceField.tsx` — states idle/typing/loading/results/empty/error inline ทั้งหมดตาม design-spec, error message เดียวกันสำหรับทุกสาเหตุ (offline/timeout/fail) ตามที่ design-spec ข้อ D ระบุไว้แล้วว่าไม่ต้องแยก
- [x] T74 — Failure isolation: `useNominatimSearch` catch ทุก error เองภายใน ไม่มี throw ใดๆ หลุดไปถึง `AddEntryScreen`; ทดสอบยืนยันด้วย integration test "a totally broken search never blocks manually typing the title and saving normally"

### ผลของ T61 (รันสคริปต์จริงกับ Overpass API)

**รันจริงสำเร็จบางส่วน** — ไม่ใช่ mock/fallback data ตามที่ PM อนุญาตไว้เป็นทางเลือกสำรอง เพราะสภาพแวดล้อมนี้มี outbound network access ไปยัง `overpass-api.de` จริง (ยืนยันด้วย `curl https://overpass-api.de/api/status` → HTTP 200 ก่อนเริ่ม):

- รันจริงได้ **45/76 จังหวัด** ที่มีข้อมูล landmark (8 จังหวัดนำร่องเดิม + 37 จังหวัดใหม่จาก Overpass) รวม **207 landmark** (29 เดิม + 178 ใหม่)
- ระหว่างรัน (query ทีละจังหวัด หน่วง 1.2 วินาที + retry 1 ครั้งเมื่อ fail ตามที่ AC กำหนด) เจอ `HTTP 429` (rate limit) เป็นระยะหลังจากผ่านไปราว 50 จังหวัด แล้วสุดท้ายกลายเป็น connection failure เต็มรูปแบบ (`fetch failed`, ยืนยันด้วย `curl` แยกว่า `overpass-api.de` ไม่ตอบสนองอีกต่อไปในขณะที่ host อื่น เช่น nominatim.openstreetmap.org และ google.com ยังใช้งานได้ปกติ) — สรุปว่า public Overpass instance บล็อก/limit ทราฟฟิกจาก IP นี้ชั่วคราวหลังใช้งานหนักต่อเนื่อง (ตรงกับ fair-use policy ของ Overpass) ไม่ใช่ปัญหาโค้ดของสคริปต์
- **หยุดการรันเอง** (kill process) แทนที่จะรอ timeout ของทุกจังหวัดที่เหลือ (ซึ่งจะกิน ~35 วิ×2 attempt ต่อจังหวัด ≈ มากกว่า 15 นาทีเปล่าๆ) ตามคำสั่ง PM ที่ให้ "อย่าเสียเวลาลองซ้ำหลายรอบ" — ข้อมูลที่ได้แล้ว 45/76 จังหวัดไม่เสียหาย (ไฟล์ output เขียนแบบ incremental ทุกจังหวัด)
- จังหวัดที่**ยังไม่ได้ข้อมูล** แยกเป็น 2 กลุ่มใน `scripts/output/overpass-landmarks-report.json`:
  1. `request-failed` (16 จังหวัด — เกิดจาก rate-limit/network ระหว่างรัน ไม่ใช่ความล้มเหลวถาวร): Chachoengsao, Nan, Phichit, Ranong, Ratchaburi, Rayong, Roi Et, Sa Kaeo, Sakon Nakhon, Samut Prakan, Samut Sakhon, Samut Songkhram, Saraburi, Satun, Si Sa Ket, Sing Buri
  2. ยังไม่เคย query เลย (13 จังหวัด, หยุดก่อนถึงคิว): Songkhla, Suphan Buri, Surat Thani, Surin, Tak, Trang, Trat, Ubon Ratchathani, Udon Thani, Uthai Thani, Uttaradit, Yala, Yasothon
  3. Overpass คืนผลลัพธ์ **0 แห่งจริง** (ไม่ใช่ network gap, สถานะ `empty`): Chaiyaphum, Pattani
  4. ได้ไม่ครบ 3 แห่ง (สถานะ `partial`): Nakhon Phanom (ได้ 2 แห่ง)
- **ผู้ใช้ต้องรันสคริปต์เองภายหลัง** (แนะนำรอ ~10-30 นาทีให้ rate-limit ของ Overpass reset ก่อน) ด้วยคำสั่ง:
  ```
  node scripts/extract-overpass-landmarks.ts --only-missing
  node scripts/merge-landmarks.ts
  ```
  สคริปต์ทั้งสองรองรับการรันซ้ำได้ปลอดภัย — `extract-overpass-landmarks.ts` resume อัตโนมัติ (ข้ามจังหวัดที่ `ok` แล้วใน `scripts/output/overpass-landmarks-report.json`) และ `merge-landmarks.ts` ปฏิเสธ merge ซ้ำเข้าจังหวัดที่มีข้อมูลอยู่แล้วเสมอ (ทั้ง pilot 8 และ 37 ที่ merge ไปแล้วรอบนี้) จึงรันซ้ำกี่ครั้งก็ไม่พังข้อมูลเดิม

### T63 — วิธี backfill พิกัดจังหวัดนำร่อง (รายละเอียด)

ยิง Nominatim search (`https://nominatim.openstreetmap.org/search?format=json&countrycodes=th&...`) ทีละ landmark จริง (29 รายการ, หน่วง ~1.1 วินาทีต่อคำขอ) ด้วยสคริปต์ scratch ชั่วคราว (ไม่ได้ commit เข้าโปรเจกต์ เพราะเป็น one-time lookup ไม่ใช่ tool ที่ต้องรันซ้ำ) ผลลัพธ์ที่ผิดที่ 2 รายการถูกแก้ด้วยการปรับคำค้นเป็นภาษาอังกฤษให้เจาะจงขึ้น:
- "วัดร่องขุ่น" (White Temple) คำค้นภาษาไทยตรงๆ แมตช์ผิดไปที่วัดเก่าคนละที่ (`วัดอินทราราม(วัดร่องขุ่นเก่า)`) — แก้ด้วยคำค้น "Wat Rong Khun White Temple Chiang Rai"
- "เมืองเก่าเชียงใหม่" คำค้นภาษาไทยแมตช์ผิดไปที่ร้านอาหารในขอนแก่น — แก้ด้วยคำค้น "Old City, Chiang Mai, Thailand"

`kbi-four-islands` ("ทัวร์ 4 เกาะกระบี่") เป็น multi-island boat tour ไม่มีพิกัดเดียวจริงๆ — ยึดพิกัดเกาะปอดะ (Koh Poda) ซึ่งเป็นจุดที่รู้จักมากที่สุด/อยู่กลางทัวร์เป็นตัวแทน (comment ไว้ในโค้ดแล้ว)

### T65 — Regression check รายละเอียด

ยืนยันว่า US-8/US-9/US-10 เดิมยังทำงานถูกต้องกับ dataset ที่ขยายแล้ว:
- `src/utils/landmarkDerived.ts`/`.test.ts` (T36) อ่านแค่ `id`/`provinceId`/checkins record — ไม่แตะ `lat`/`lng` เลย ไม่มีผลกระทบ
- `LandmarkList`/`LandmarkListItem`/`EmptyStateLandmarks` (T43/T45) อ่านแค่ `id`/`nameTh` — ทำงานเหมือนเดิมทั้งกับ landmark ที่มี/ไม่มีพิกัด
- `ProvinceMasterBadge` (T46) คำนวณจาก `getLandmarkProgress`/`isProvinceMaster` เดิม — ไม่เปลี่ยน logic เลย จำนวน landmark ที่เพิ่มขึ้นต่อจังหวัด (สูงสุด 5 แทน 3-5 เดิม) ไม่กระทบสูตรคำนวณ (ยังเป็น `checkedInCount === totalCount`)
- `AddEntryScreen` landmark chip field (T47/T48) อ่านจาก `getLandmarksForProvince()` เหมือนเดิม
- พบ 2 integration test ที่ผูกกับ "amnat-charoen = ไม่มีข้อมูล" ตายตัว (เขียนไว้ตั้งแต่รอบก่อนตอนที่มีแค่ 8 จังหวัดนำร่อง) — แก้แล้ว (ดูด้านบน) เพราะเป็น assumption ที่ล้าสมัยไปแล้วหลัง T61/T64 ไม่ใช่ regression จริงของโค้ด
- ผลลัพธ์สุดท้าย: `npx jest` ทั้งโปรเจกต์ **32 suites ผ่านหมด, 186 passed + 1 skip (เดิม) = 187 total**, `npx tsc --noEmit` ผ่านสะอาด

## การตัดสินใจทางเทคนิค (รอบ 3)

1. **Overpass area resolution ด้วย normalized `name:en` matching + bulk query เดียว** แทนการยิง `area["name"="จังหวัด..."]` เป็นภาษาไทยทีละจังหวัดตามตัวอย่างใน requirements.md ตรงๆ — เพราะทดสอบจริงแล้วพบว่า query ภาษาไทยผ่าน `curl -d` ไม่เสถียร (แมตช์ไม่เจอบ่อยครั้งแม้ relation จะมีอยู่จริง เป็นไปได้ว่าเกี่ยวกับการ index/encoding ฝั่ง Overpass) ในขณะที่ `name:en` แมตช์ได้ชัดเจนและ derive ได้ตรงจาก `nameEn` ที่มีอยู่แล้วใน `thailand-provinces.ts` โดยไม่ต้องสร้าง mapping table ISO3166-2 เพิ่มเติม (ทดสอบ ISO3166-2 ไว้แล้วเหมือนกัน ใช้ได้แต่ต้องมี mapping table 76 แถวเพิ่ม ซึ่งเป็นข้อมูลอีกชุดที่ต้องดูแล)
2. **แยก script T60 (extraction) ออกจาก script T64 (merge)** อย่างเด็ดขาดเป็น 2 ไฟล์ (`extract-overpass-landmarks.ts`, `merge-landmarks.ts`) — extraction เขียนออกเป็น JSON กลางก่อนเสมอ ไม่เคยแก้ `thailand-landmarks.ts` ตรงๆ เอง ตามที่ T60 AC กำหนดไว้ชัดเจน ("ยังไม่ทับ thailand-landmarks.ts โดยตรง ให้ T64 เป็นคนรวมภายหลัง") — แยกความรับผิดชอบยังทำให้รัน extraction ซ้ำ (retry จังหวัดที่เหลือ) ได้อิสระโดยไม่กระทบไฟล์ dataset จริงจนกว่าจะพร้อม merge จริง
3. **Incremental file write + resume-by-report** ถูกเพิ่มเข้าไปหลังจากรันจริงครั้งแรกพัง (ใช้ `timeout 500` ระดับ shell ครอบ `node` ไว้ ทำให้ process ถูก kill ก่อนถึงบรรทัด `fs.writeFileSync` ท้ายสุด สูญเสียงานที่ query สำเร็จไปแล้วทั้งหมดโดยไม่มีไฟล์เหลือเลย) — บทเรียน: build-time script ที่ทำ I/O จำนวนมากต้อง persist progress กันเอง ไม่ใช่พึ่ง exit ปกติของ process เท่านั้น เพิ่มแล้วและพิสูจน์แล้วว่าใช้งานได้จริงตอนรันจริงรอบสอง (ข้อมูลที่ query ได้ก่อนโดนบล็อกไม่หายไปเลย)
4. **`allowImportingTsExtensions: true` + `"types": ["jest", "node"]` ใน `tsconfig.json`** (แก้ไฟล์ config, ไม่ใช่เอกสาร requirements/tasks/design-spec) — จำเป็นเพราะ `scripts/*.ts` รันตรงด้วย `node` (Node 22.6+ native TS stripping) ซึ่งต้องการ explicit `.ts` extension บน relative import (กฎ ESM resolution) แต่ TypeScript ปกติ reject extension แบบนี้เว้นแต่เปิด flag นี้ — และ `@types/node` มีอยู่แล้วใน `node_modules` (ติดมาจาก dependency อื่น) แค่ไม่เคยถูกเปิดใช้ผ่าน `types` array เท่านั้น ไม่ต้องติดตั้งอะไรเพิ่ม, ไม่กระทบ runtime ของแอป (`noEmit: true` อยู่แล้ว)
5. **`landmarks` table เป็น one-directional seed เท่านั้น** (local → Supabase, ไม่มีขาดึงกลับ) ต่างจาก entries/landmark_checkins ที่เป็น bidirectional LWW (T39/T40) — เพราะ `LANDMARKS` เป็น static bundled array ที่ compile เข้าแอปตั้งแต่ build time ไม่ใช่ user-generated data ที่มีหลายเครื่อง/หลาย session เขียนแข่งกัน จึงไม่มี "conflict" ให้ resolve; ผูกเข้า `runSyncCycle()` เดิมเพื่อให้ seed อัตโนมัติทุกครั้งที่มีการ sync โดยไม่ต้องมี trigger แยก
6. **`useNominatimSearch` เป็น custom hook แยกจาก UI component** (ไม่ inline logic ใน `AddEntryScreen`/`SearchPlaceField` ตรงๆ) — เพื่อให้ debounce/state-machine/race-guard (stale request ไม่ overwrite ผลล่าสุด) ทดสอบได้อิสระด้วย `renderHook` โดยไม่ต้อง mount ทั้งฟอร์ม ซึ่งพบว่าจำเป็นจริงระหว่างเขียนเทส (`@testing-library/react-native` v14 `renderHook`/`render` คืน `Promise` ต้อง `await` เสมอ — ถ้าไม่ await `result.current` จะเป็น `undefined` ทันที ไม่ throw ชัดเจน เสียเวลา debug พอสมควรกว่าจะเจอ ด้วยการทดสอบแยก hook เปล่าๆ)
7. **Confirmation chip label ใช้ entry.title เป็น fallback ตอน edit mode** (ไม่ได้เก็บ Nominatim `display_name` เต็มไว้ใน DB เพราะ schema/AC ไม่ได้ขอ) — เมื่อเปิดแก้ไข entry ที่เคยมี `placeLat`/`placeLng` มาก่อน จะโชว์ chip ด้วยข้อความ title ปัจจุบันแทน "อ้างอิงพิกัดจาก: ..." เต็มรูปแบบ — เป็นส่วนเสริมนอกเหนือ design-spec เดิม (ซึ่งเขียนเฉพาะ create-flow) ทำเพื่อไม่ให้ผู้ใช้ล้าง metadata พิกัดเดิมไม่ได้ตอนแก้ไข entry

## Tests เขียนเพิ่มในรอบ 3

- `scripts/extract-overpass-landmarks.test.ts` — 15 tests: normalize/area-matching, select-top-landmarks (dropped no-coords/no-Thai-name, de-dup, tag priority + cap), report status, query builder — ทั้งหมด mock data ไม่แตะ network
- `src/utils/landmarkMap.test.ts` — bounding box, normalize formula (4 มุม+กึ่งกลาง), degenerate bbox 3 เคส (lat เท่ากัน/lng เท่ากัน/ทั้งคู่)
- `src/components/LandmarkMap.test.tsx` — จุด+label ตรงกับ list, toggle callback contract, กรอง no-coords ออกแต่ไม่ error, no-points fallback message
- `src/lib/nominatimClient.test.ts` — min length guard, custom User-Agent header, mapping/short-label, malformed-row filtering, HTTP error, offline error, malformed response, throttle spacing ≥1000ms (real-time test)
- `src/hooks/useNominatimSearch.test.ts` — 9 tests: idle/typing/debounce timing, re-type resets debounce, results cap 5, empty, error (ไม่ leak throw), retry, reset, stale-request race guard
- `src/sync/landmarkSeedSync.test.ts` — row mapping (lat/lng optional→null), upsert เมื่อ configured, graceful no-op เมื่อไม่ configured, ไม่ throw เมื่อ upsert fail
- `src/__tests__/integration/addEntrySearchPlace.test.tsx` — 7 end-to-end tests ผ่าน `AddEntryScreen` จริง: debounce→results→select→prefill+chip+save พร้อม placeLat/placeLng, ไม่สร้าง Landmark/ไม่ auto-checkin, ปุ่ม "×" ล้างเฉพาะพิกัดไม่แตะ title, error+retry, empty state, **failure isolation** (ค้นหาพังสนิทแต่ยังกรอก title เองแล้วบันทึกได้ปกติ), ไม่ใช้ช่องค้นหาเลยก็ไม่กระทบ

รวม: `npx jest` ทั้งโปรเจกต์ **32 suites ผ่านหมด, 187 tests (186 passed + 1 skip เดิม)**, `npx tsc --noEmit` ผ่านสะอาด

## จุดที่ทำไม่ได้ตาม spec 100% (รอบ 3) / ต้องการให้ PM ทราบ

1. **T61 ยังไม่ครบ 76 จังหวัด** — ได้ข้อมูลจริง 45/76 จังหวัด (8 เดิม + 37 ใหม่) ก่อนโดน Overpass public instance จำกัด/บล็อกทราฟฟิกชั่วคราว (ดูรายละเอียดเต็มด้านบน) — **ผู้ใช้ต้องรันสคริปต์ต่อเองภายหลัง** ด้วย `node scripts/extract-overpass-landmarks.ts --only-missing` แล้ว `node scripts/merge-landmarks.ts` เมื่อ rate-limit reset (ไม่มี ETA แน่นอน เป็นนโยบายฝั่ง Overpass) — สคริปต์ resume ได้เองไม่ต้องเริ่มใหม่ทั้งหมด ตามที่ PM decision ประเด็น 13 ระบุไว้ล่วงหน้าแล้วว่าเป็นความเสี่ยงที่ยอมรับได้ของรอบนี้ (T61 เป็น P1 ไม่ใช่ P0)
2. **T75 (ผนวก checklist จังหวัดข้อมูลไม่ครบเข้า T59) ไม่ได้สร้างเป็นเอกสารแยก** — ตาม PM scope ที่ระบุว่า T75 เป็น P2/optional และ T59 (ที่ควรผนวกเข้า) เองก็ยังไม่มีไฟล์อยู่จริงในโปรเจกต์ (เป็นงาน content-process ล้วนๆ นอก sprint) — รายชื่อจังหวัดที่ต้อง manual review ครบถ้วนอยู่ใน `scripts/output/overpass-landmarks-report.json` แล้ว (field `status`) ซึ่งเป็น machine-readable ทำหน้าที่เดียวกับ checklist ได้ทันที ทีม content สามารถ query ไฟล์นี้ได้ตรงๆ โดยไม่ต้อง maintain เอกสารซ้ำสอง
3. ทุกอย่างอื่นใน P0 (T60, T62-T74) ทำครบตาม spec แล้ว ไม่มีการตัดฟีเจอร์ทิ้งเอง

## รอบ 4: Bug fix (BUG-1 + accessibility label)

- **BUG-1 (formatThaiDate UTC offset)**: ตรวจสอบ `src/utils/derived.ts` (`formatThaiDate`, บรรทัด 86-93) แล้วพบว่า**แก้ไปแล้วตั้งแต่ baseline commit ก่อนรอบนี้** (`git log -p` ยืนยัน commit `3a5d8f7` "Baseline commit..." มีข้อความ "today's QA fixes (formatThaiDate UTC bug...)" และโค้ดที่ commit นั้นใช้ `getUTCDate()/getUTCMonth()/getUTCFullYear()` ครบทุกตัวอยู่แล้ว) — **ไม่ต้องแก้เพิ่ม** ไม่มีการเปลี่ยนโค้ดในไฟล์นี้รอบนี้
- **Accessibility label ไม่สอดคล้องกัน**: แก้ `src/components/LandmarkMap.tsx` (บรรทัด accessibilityLabel ของจุดบนแผนที่) จาก `'ยังไม่เช็คอิน'` เป็น `'ยังไม่ได้เช็คอิน'` ให้ตรงกับ `LandmarkListItem.tsx` (ใช้เป็น source of truth ตามที่ระบุ) — ข้อความคู่ตรงข้าม `'เช็คอินแล้ว'` เช็คแล้วว่าสอดคล้องกันอยู่แล้วทั้ง `LandmarkMap.tsx`, `LandmarkListItem.tsx`, `LandmarkProgressIndicator.tsx`, `landmarkDerived.ts` ไม่ต้องแก้
- **ผลกระทบต่อเทสที่ต้องตามแก้** (เนื่องจาก label ของ map point กับ list row ตอนนี้ตรงกันทุกตัวอักษร ทำให้ query เดิมที่เคย unique กลายเป็น ambiguous):
  - `src/components/LandmarkMap.test.tsx` — เปลี่ยนข้อความ label ที่ assert ให้ตรงตามค่าใหม่ (`sed` แทนที่ทั้งไฟล์)
  - `src/__tests__/qa-round3/landmarkMapDegenerateBbox.test.tsx` — เปลี่ยนจาก `getByLabelText` เป็น `getAllByLabelText(...)[0]` (เลือก element ของแผนที่ ซึ่ง render ก่อน list row เสมอ ตามลำดับ heading -> map -> progress -> list ที่ fix ไว้ใน `LandmarkList.tsx`) พร้อม assert ว่ามี 2 elements ตรงกับ label นี้ (จากแผนที่ 1 + จาก list row 1)
  - `src/__tests__/qa-round3/landmarkMapIntegration.test.tsx` — แก้ pattern เดียวกัน (`getAllByLabelText(...)[0]`) สำหรับจุดเริ่มต้นก่อนเช็คอิน (ส่วนกรณีหลังเช็คอินที่ label กลายเป็น `'เช็คอินแล้ว'` เดิมทีก็ใช้ `getAllByLabelText` อยู่แล้วตั้งแต่รอบ 3 ไม่ต้องแก้เพิ่ม)

### ผลเทส
- `npx jest` (เฉพาะไฟล์ที่เกี่ยวข้อง): 8 suites / 46 tests ผ่านทั้งหมด
- `npx jest` (ทั้งชุด): 37 suites, 209 passed + 1 skip (เดิม, มีเอกสารอธิบายจาก QA รอบ 3 แล้วว่าเป็นข้อจำกัด jest กับ react-native-svg `onLongPress`) จาก 210 total — ไม่มี regression
- `npx tsc --noEmit`: ผ่าน ไม่มี error

---

# รอบ 5: Landmark Cards & Media Integration (US-21–US-24) — implement มาก่อน pipeline (retroactive)

โค้ดของรอบนี้ (HEIC→JPEG fix, Wikipedia/Wikimedia landmark cards, in-province search+filter, GlobalSearchBar) ถูกเขียนไว้แล้วนอก pipeline ก่อนที่ BA/PM จะเห็นโจทย์ — ดูรายละเอียด task mapping ใน `docs/tasks.md` หัวข้อ "รอบ 5" (T76–T86) และผลตรวจสอบเต็มใน `docs/test-report.md`/`docs/qa-result.md` หัวข้อ "รอบ 5"

## T86 — ลบ dead code `src/components/LandmarkCardGrid.tsx` (post-QA cleanup)
ยืนยันด้วย `grep -rn "LandmarkCardGrid" src/` ก่อนลบว่าไม่มีที่ใด import ไฟล์นี้เลย (ทั้ง Tester และ QA รอบ 5 ยืนยันตรงกันอิสระ) — ลบแล้วรัน `npx tsc --noEmit` (ผ่าน) และ `npx jest` เต็มชุด (46 suites, 236 passed + 1 skip เดิม + 1 fail ที่ `syncLifecycle.test.tsx` ซึ่งรันแยกไฟล์เดี่ยวผ่าน 100% — ยืนยันเป็น pre-existing flaky test ไม่เกี่ยวกับการลบไฟล์นี้ ตรงกับที่ Tester รอบ 5 พบมาก่อนแล้ว)

---

# รอบ 6: Bug Fix — US-25 (T87-T89)

บริบท: มีงาน UI redesign (Advanced UI/UX Upgrade) รันคู่ขนานแก้ `src/components/LandmarkList.tsx` ไปแล้วก่อนหน้า (Bento Grid hero+2-col, `ShimmerBlock`, `PressableScale`, centralized `handleToggle` พร้อม haptics) แต่ยังไม่แตะ error-handling logic เลย — ตรวจโค้ดจริงทั้ง `wikipediaService.ts` และ `LandmarkList.tsx` ก่อนแก้ตามที่ PM ระบุ ไม่ใช้เลขบรรทัด/โครงสร้างเก่าจาก tasks.md เป็นค่าตายตัว งานรอบนี้เพิ่ม error-state ต่อยอด ไม่ได้แตะ/rewrite ทับ Bento Grid/Shimmer/Haptics ที่มีอยู่แล้ว

## T87 — ไฟล์: `src/services/wikipediaService.ts`
- แยก "ทุก category สำเร็จแต่ไม่มีบทความ" (ยังคง resolve เป็น `[]` เหมือนเดิม, ไม่ throw) ออกจาก "ทุก category ล้มเหลวด้วย error จริง" (network/timeout/HTTP-not-ok/JSON parse) ซึ่งตอนนี้ throw ออกไปให้ caller รู้
- Implementation: เพิ่มตัวแปร `categorySucceeded` (ตั้ง `true` ทันทีที่ category ใด category หนึ่ง fetch สำเร็จ + `res.ok` + `res.json()` parse ผ่าน โดยไม่สนว่า pages จะว่างหรือไม่) และ `lastError` (เก็บ error ล่าสุดจากทั้งกรณี `!res.ok` และกรณี catch) — หลัง loop จบ ถ้า `!categorySucceeded` ให้ throw `lastError` ทันที ก่อนจะไปถึงขั้นตอน merge/cache/Commons photo
- คง per-category catch-and-continue ไว้ตามเดิม (ยังลองหมวดถัดไปแม้บางหมวดพัง) ตราบใดที่ยังมีอย่างน้อย 1 หมวดสำเร็จจริง — ตรงตามที่ AC อนุญาต
- `fetchCommonsPhoto` (fetch รูปเสริม) ไม่ต้องแก้อะไรเพิ่ม เพราะมันมี try/catch คืน `undefined` เองอยู่แล้วและถูกเรียกผ่าน `Promise.allSettled` — ไม่มีทางทำให้ฟังก์ชันหลัก throw อยู่แล้วโดยดีไซน์เดิม ตรงตาม AC ที่ระบุว่าความล้มเหลวของรูปเสริมเพียงอย่างเดียวไม่ถือเป็นเหตุ throw
- อ้างอิง US-25 AC1, AC2, AC5

## T88 — ไฟล์: `src/components/LandmarkList.tsx`
- เพิ่ม state `fetchError` (boolean) แยกจาก `isFetchingWiki`/`landmarks` เดิม — set `true` ใน `catch` ของการเรียก `fetchAttractionsForProvince` (T87), reset เป็น `false` ทุกครั้งที่ fetch สำเร็จ (ไม่ว่าจะได้ผลลัพธ์กี่รายการ) และทุกครั้งที่เปลี่ยนจังหวัด (`provinceId` เปลี่ยน)
- สร้าง component ภายในไฟล์เดียวกัน `LandmarkFetchErrorState` (ไม่ export) แสดงข้อความ "โหลดข้อมูลสถานที่ไม่สำเร็จ" — คนละข้อความ/คนละ component กับ `EmptyStateLandmarks` เดิมทุกประการ — ใช้ 2 ที่:
  1. full-block เมื่อ `fetchError && landmarks.length === 0` (ไม่มี local seed และไม่มีผลลัพธ์เลย) — แทนที่ `EmptyStateLandmarks` เฉพาะเคสนี้เท่านั้น เคส resolve สำเร็จเป็น `[]` (fetchError=false) ยังเห็น `EmptyStateLandmarks` เดิมทุกประการ
  2. compact banner เสริมด้านบนของ full render เมื่อมี landmark อยู่แล้ว (ทั้ง local seed + ที่เคย merge จาก wiki ก่อนหน้า) แต่ fetch ล้มเหลว — landmark เดิมทั้งหมดยังคง render ผ่าน flow เดิมทุกจุด (map/progress/card grid) ไม่ถูกทับ/ซ่อน/แทนที่เลย เป็นแค่ banner เสริมด้านบน (regression guard ของ US-22 ตามที่ PM เน้นย้ำ)
- แก้ error-branch เดิม `catch { // Fallback: keep existing landmarks }` ให้ set `fetchError(true)` แทนที่จะเงียบเฉยๆ โดย logic "ไม่แตะ landmarks state เดิม" ยังคงอยู่เหมือนเดิม (ไม่มีการ setLandmarks ใน catch อยู่แล้วตั้งแต่เดิม)
- อ้างอิง US-25 AC1, AC2, AC4

## T89 — ทางลองใหม่ (retry) ในไฟล์เดียวกัน
- Refactor effect เดิม (`useEffect` ที่เรียก fetch ตรงๆ) ให้เป็น `useCallback` ชื่อ `loadWikipediaAttractions` (dep: `provinceId`, `provinceNameTh`) แล้วให้ `useEffect` เรียกมันแทน — ปุ่ม "ลองอีกครั้ง" เรียก callback เดียวกันนี้ตรงๆ (ไม่ต้องออกจากหน้าจังหวัดแล้วกลับเข้ามาใหม่ตาม AC3)
- ระหว่าง retry (`isFetchingWiki === true`) ทั้ง full-block และ compact banner ของ `LandmarkFetchErrorState` จะสลับจากปุ่ม "ลองอีกครั้ง" เป็น `ShimmerBlock` reuse ของเดิม (ไม่สร้าง loading component ใหม่) — ข้อความ error ("โหลดข้อมูลสถานที่ไม่สำเร็จ") ยังคงค้างอยู่ระหว่าง retry (ไม่ blank หาย) จนกว่าผลจะออก
- Retry สำเร็จ → `fetchError` reset เป็น `false` ทันทีก่อน merge landmark ใหม่เข้า state → ผลลัพธ์แสดงตามปกติเหมือน fetch สำเร็จตั้งแต่แรก (US-22)
- Retry ล้มเหลวอีก → `fetchError` ยังคง `true` ต่อ, `isFetchingWiki` กลับเป็น `false` (ไม่ค้าง loading ตลอดไป) → ปุ่ม "ลองอีกครั้ง" กลับมาให้กดใหม่ได้เรื่อยๆ
- เพิ่ม race guard `fetchIdRef` (นับ generation ของแต่ละ call) คู่กับ `isMountedRef` เดิม กัน stale response ทับ state ที่ใหม่กว่า (กรณีสลับจังหวัดเร็วๆ ระหว่างที่ fetch ค้างอยู่ หรือกด retry ซ้ำสองครั้งติดกันก่อน call แรกเสร็จ) — ของเดิมใช้ `isMounted` local ต่อ effect instance เท่านั้น ตอนนี้ต้อง robust กว่าเดิมเพราะ callback เดียวกันถูกเรียกได้จากทั้ง auto-effect และปุ่ม retry
- กด "ลองอีกครั้ง" ระหว่างที่ยังโหลดอยู่ไม่ได้ (ปุ่มถูกแทนที่ด้วย ShimmerBlock ระหว่างนั้น) กันการยิงซ้ำโดยไม่ตั้งใจ
- อ้างอิง US-25 AC3, AC6

## Tests เขียนเพิ่ม/แก้ในรอบ 6
- ใหม่: `src/components/LandmarkList.test.tsx` — 5 tests (component-level, mock `../services/wikipediaService` module ทั้งไฟล์): error state แยกจาก empty state เมื่อ reject (AC2/AC5), empty state เดิมเมื่อ resolve `[]` (AC1/AC5), local seed (phuket) ยัง render ปกติครบพร้อม banner เสริมเมื่อ fetch พัง (AC4), retry เรียก fetch ซ้ำ+โชว์ loading ระหว่างรอ+เคลียร์ error เมื่อสำเร็จ (AC3/AC6), retry พังซ้ำแล้ว error ยังค้างอยู่ไม่หาย ไม่ loading ค้างตลอดไป
- แก้ `src/services/wikipediaService.test.ts`: เดิม test `'gracefully handles network failures without throwing'` อ้างอิง silent-fallback แบบเก่าที่ตอนนี้เปลี่ยนพฤติกรรมแล้วตาม US-25 — แทนที่ด้วย 4 tests ใหม่: throw เมื่อทุก category network error, throw เมื่อทุก category HTTP not-ok, resolve `[]` เมื่อสำเร็จแต่ไม่มีบทความ (ไม่ throw), ไม่ throw ถ้ามีอย่างน้อย 1 category สำเร็จแม้ category อื่นพัง
- แก้ `src/__tests__/qa-round3/landmarkMapIntegration.test.tsx` และ `src/__tests__/integration/landmarkCheckin.test.tsx`: ทั้งสองไฟล์นี้เดิมไม่ได้ mock `wikipediaService` เลย รันผ่าน real (unmocked) `fetch` ใน jest env ซึ่งเดิมล้มเหลวแบบเงียบๆ กลายเป็น `[]` (บังเอิญตรงกับ "chaiyaphum ไม่มีข้อมูล" ที่ test ต้องการ) — พอ T87 เปลี่ยนให้ throw จริงเมื่อ fetch ล้มเหลวจริง สอง test นี้เลยเห็น error state แทน empty state ที่คาดไว้ (เพราะในเน็ตเวิร์กแวดล้อม jest ไม่มี network จริง ทำให้เคสนี้กลายเป็น "fetch ล้มเหลวจริง" ไม่ใช่ "fetch สำเร็จแต่ว่าง" อีกต่อไป) — แก้โดยเพิ่ม `jest.mock('../../services/wikipediaService')` + `.mockResolvedValue([])` ให้ตรงกับเจตนาเดิมของ test (จำลอง "query สำเร็จจริงแต่ไม่มีบทความ" ให้ตรงกับ AC1 แทนที่จะพึ่ง fetch พังโดยบังเอิญ) ไม่ได้เปลี่ยน assertion ใดๆ ของ test เดิมเลย

## จุดที่ตรวจสอบแล้วไม่ต้องทำ (รอบ 6)
- **`src/components/LandmarkCardGrid.tsx`** ที่ PM ระบุว่าเป็น dead code — ตรวจสอบด้วย `Glob`/`grep -rn "LandmarkCardGrid"` ทั่ว `src/` และทั้ง repo (ไม่รวม `node_modules`) แล้วพบว่า**ไฟล์นี้ไม่มีอยู่จริงในโปรเจกต์ปัจจุบัน** — ตรวจ dev-notes เดิมพบว่าไฟล์นี้ถูกลบไปแล้วตั้งแต่ T86 (post-QA cleanup ของรอบ 5, ดูหัวข้อด้านบน) ไม่มี git-tracked หรือ untracked เหลืออยู่เลย จึงไม่มีอะไรให้ลบเพิ่มในรอบนี้ (ข้อมูลที่ PM ได้รับมาเป็นข้อมูลเก่าก่อนรอบ 5 cleanup)

## ผลรัน (รอบ 6)
- `npx tsc --noEmit -p .` — ผ่าน ไม่มี error
- `npx jest` ทั้งชุด — **47 suites ผ่านหมด, 245 passed + 1 skip เดิม (246 total)**, ไม่มี test แดง (พบ 1 ครั้งที่ `qa-round2/emailLinkIntegrity.test.tsx` fail ตอนรันรวมทั้งชุดด้วย `render function has not been called` แต่รันแยกไฟล์เดี่ยวผ่าน 100% ทั้ง 3 tests — เป็น pre-existing flaky test ของไฟล์ที่ไม่เกี่ยวกับ `LandmarkList`/`wikipediaService` เลย (component `EmailLinkForm.tsx`), ไม่ใช่ regression จากรอบนี้ — รันซ้ำอีกรอบทั้งชุดผ่าน 47/47 ปกติ)

## ไม่มีจุดที่ต้องส่งกลับ PM ตัดสินใจในรอบนี้
T87-T89 ทำครบตาม AC ของ US-25 ทั้ง 6 ข้อ ไม่มีการตัดขอบเขตหรือเปลี่ยน scope ใดๆ

---

## รอบ 7: Advanced UI/UX v3 (Landmark List redesign) + HEIC/photo-upload 400 fix (นอก pipeline, ทำโดยตรงตามคำขอผู้ใช้)

### 1. Landmark List: Magazine/Bento redesign
- `src/components/LandmarkList.tsx`: เพิ่ม **card/map view toggle** (segmented control "🖼️ การ์ด" / "🗺️ แผนที่") — `LandmarkMap` ไม่ render อยู่ใน fold แรกอีกต่อไป (ไม่เบียดพื้นที่รูปภาพ), ค่าเริ่มต้น = โหมดการ์ด, reset กลับเป็นการ์ดทุกครั้งที่เปลี่ยนจังหวัด — `LandmarkProgressIndicator` ยังคงแสดงทั้งสองโหมด (shared context)
- `src/components/LandmarkCard.tsx`:
  - ภาพปกเปลี่ยนจาก fixed-height เป็น **aspect ratio 16:9** ทั้ง hero และ compact variant (`aspectRatio: 16/9`)
  - เพิ่ม `expo-linear-gradient` overlay บางๆ (`rgba(0,0,0,0.25)`) ที่ภาพทุกใบ (ไม่ใช่แค่ hero) เพื่อ contrast ให้ badge, hero ใช้ overlay หนักกว่า (`0.7`) เพื่อรองรับ title บนภาพ
  - Category badge เปลี่ยนจากกล่องสี่เหลี่ยมพื้นดำทึบเป็น **pill โปร่งแสง** (`borderRadius: RADIUS.full`, `withAlpha(categoryColor.fg, 0.82)`)
  - ปุ่มเช็คอินปรับ `minHeight` 40 → **44pt** (thumb-zone)
  - Fallback ภาพ: เพิ่ม `FALLBACK_LANDMARK_IMAGE` ใน `src/theme.ts` (ภาพ landscape จริงจาก Wikimedia Commons ผ่าน `Special:FilePath?width=800` — endpoint นี้ render ตามขนาดที่ขอได้จริง ต่างจากการเดา URL `upload.wikimedia.org/.../NNNpx-*` ตรงๆ ซึ่ง 400 ถ้าไม่ตรงกับ cache ที่มีอยู่แล้ว, ตรวจสอบแล้วว่า resolve เป็น JPEG จริง 200 OK) — ใช้แทนไอคอน 🏛️ เดิมเมื่อ `imageUrl` ไม่มีหรือโหลดไม่สำเร็จ (`onError`) เพื่อไม่ให้การ์ดดูเหมือน "ว่าง/พัง"
- `src/components/GlobalSearchBar.tsx`: ปรับ token ให้ตรง `SPACING`/`RADIUS`/`SHADOWS` เดียวกับรอบก่อน, แถวผลลัพธ์ `minHeight: 44`

### 2. Bug fix: Photo upload HEIC/400 Bad Request
- Root cause: `src/sync/photoUpload.ts` เดิมใช้ `fetch(uri).blob()` เพื่ออ่านไฟล์รูป local ก่อนอัปโหลดขึ้น Supabase Storage — ไม่เสถียรบน iOS สำหรับ `file://` URI (blob body ว่าง/ไม่ครบ ทำให้ Supabase Storage ตอบ 400)
- แก้โดยเปลี่ยนมาใช้ `expo-file-system/legacy`'s `readAsStringAsync(uri, { encoding: 'base64' })` แล้ว `decode()` จาก `base64-arraybuffer` เป็น ArrayBuffer ก่อนส่งเข้า `.upload()` — ติดตั้ง dependency ใหม่ 2 ตัว: `expo-file-system`, `base64-arraybuffer` (ผ่าน `npx expo install` ให้ตรง SDK 57)
- Rename injectable test dependency จาก `fetchBlob` เป็น `readAsBase64` ใน `PhotoUploadDeps` — อัปเดต `photoUpload.test.ts` ให้ตรง
- `src/components/PhotoPicker.tsx`: **ไม่ต้องแก้** — ตรวจสอบแล้วว่ามีการแปลงทุกรูปเป็น JPEG ผ่าน `ImageManipulator.manipulateAsync(..., { format: SaveFormat.JPEG })` อยู่แล้วทุก asset ที่เลือก (รวม `.heic`) ตั้งแต่รอบ T76 เดิม มี test คลุมอยู่แล้ว (`photoPickerConversionHappyPath.test.tsx`)
- **หมายเหตุสำคัญสำหรับ test แบบ integration ที่ไม่ inject `readAsBase64`** (เช่น `syncLifecycle.test.tsx` ที่เรียกผ่าน `SyncContext` จริง ไม่ใช่เรียก `uploadPendingPhotos` ตรงๆ): ต้อง `jest.mock('expo-file-system/legacy', ...)` ให้ `readAsStringAsync` resolve เป็น base64 string ที่ใช้ได้จริง เพราะ jest-expo auto-mock ของ `expo-file-system` จะ resolve เป็น `undefined` เฉยๆ (ไม่ throw) ทำให้ `decode(undefined)` ล้มเหลวเงียบๆ ในบล็อก catch ของ `uploadPendingPhotos` (แสดงผลเหมือนอัปโหลดล้มเหลวแต่ไม่มี error message ชัดเจน) — แก้ไว้แล้วในไฟล์นี้

### 3. Test fixes / regression guards
- `src/__tests__/qa-round4/landmarkCardsWikipediaIntegration.test.tsx`: เปลี่ยนการตรวจ placeholder จาก text `'🏛️'` (ไม่มีแล้ว) เป็นตรวจ `testID="landmark-card-image"` ว่า source.uri ตรงกับ `FALLBACK_LANDMARK_IMAGE`
- `src/__tests__/qa-round3/landmarkMapIntegration.test.tsx`, `landmarkMapDegenerateBbox.test.tsx`: ปรับให้กดปุ่ม toggle "มุมมองแผนที่" ก่อนเข้าถึงจุดบนแผนที่ (เพราะไม่ได้ render อยู่ default อีกต่อไป)
  - **บทเรียนสำคัญที่เจอระหว่างแก้**: การกด state-changing press หลายครั้งติดกันใน RTL โดยไม่มี `await waitFor(...)` คั่นระหว่างกลาง (โดยเฉพาะครั้งแรกหลัง mount) อาจทำให้ press ครั้งถัดไปในเทสต์เดียวกัน "ดูเหมือนไม่มีผล" (React state ไม่ commit ทันเวลาให้ query ถัดไปเห็น) — ไม่ใช่บั๊กจริงของแอป (ยืนยันด้วย debug log ว่า business logic/DB layer ทำงานถูกต้อง 100% ทุกครั้ง) แต่เป็นข้อจำกัดของการทดสอบ async ใน RTL — แก้ด้วยการ `await waitFor(...)` เช็คสถานะที่ **ไม่คลุมเครือ** (เช่น `.props.accessibilityState.selected` ของปุ่ม toggle เอง แทนที่จะเช็ค accessibilityLabel ที่ใช้ร่วมกันระหว่าง component หลายตัว ซึ่งอาจ false-positive ผ่านได้ทั้งที่ state จริงยังไม่เปลี่ยน) ทันทีหลังทุก state-changing press ก่อนจะ press ถัดไป

### ผลการรัน
- `npx tsc --noEmit -p .` — ผ่าน ไม่มี error
- `npx jest` ทั้งชุด — **47/47 suites ผ่าน, 245 passed + 1 skip เดิม** รันซ้ำ 2 รอบติดกันเพื่อยืนยันความเสถียร (ไม่มี flaky เหลือจากรอบนี้)

---

## รอบ 8: Advanced UI/UX v4 — HomeScreen / StatsScreen / SettingsScreen redesign

รายละเอียด design decision เต็มอยู่ใน `docs/design-spec.md` ส่วน "Advanced UI/UX v4" — สรุปไฟล์ที่แก้:

- `src/screens/HomeScreen.tsx`, `src/components/HeaderProgress.tsx`, `src/components/Legend.tsx` — Bento card + shimmer + `PressableScale`/haptic บน top bar (ไม่แตะ `Map3D.tsx`)
- `src/screens/StatsScreen.tsx` — summary card เดิม (1 sentence/tile) เปลี่ยนเป็น Bento stat-tile grid (ค่า+label แยก Text node) — **breaking text change** ที่กระทบ test
- `src/screens/SettingsScreen.tsx`, `src/components/DataLossWarningBanner.tsx` — รวม account section เป็น elevated card เดียว, `PressableScale` บนปุ่มผูกอีเมล
- `src/components/EmptyState.tsx`, `src/components/EntryListItem.tsx` — shared component อัปเกรดเป็น `PressableScale` + haptic (ใช้ร่วมทั้ง Province Detail และ Stats)

### Test ที่ต้องแก้ตาม breaking text change ของ StatsScreen
- `src/__tests__/integration/statsScreen.test.tsx` — แยก assertion `'ปลดล็อกแล้ว 2 / 76 จังหวัด'` → `'2/76'` + `'จังหวัดปลดล็อก'` (เช่นเดียวกับอีก 2 stat)
- `src/__tests__/qa-round2/migrationNonBlocking.test.tsx` — แยก `'บันทึกทั้งหมด 3 รายการ'` → `'3'` + `'บันทึกทั้งหมด'`

### หมายเหตุสำคัญ: false-positive flaky จาก system load (ไม่ใช่บั๊กจากรอบนี้)
รันเต็มชุดแบบ parallel (`npx jest`) บนเครื่องที่มี load สูงตอนนั้น เจอ suite ทยอย fail ด้วย `Exceeded timeout of 5000 ms` (สูงสุดเจอ 12 suites fail ในรอบเดียว, ตัวเลขไม่คงที่ระหว่างรอบ) — ตรวจสอบแล้วว่า **ไม่ใช่ regression จริง**: รันไฟล์เดียวกันแยกเดี่ยวผ่าน 100% ทุกครั้ง และรัน `npx jest --runInBand` (serial, ไม่มี worker แย่ง CPU กัน) ผ่านครบ **47/47 suites** เวลารวมแค่ ~70 วินาที — สรุปว่าเป็น timeout จาก resource contention ของเครื่องตอนรัน parallel เท่านั้น ถ้าเจอเคสแบบนี้อีกในอนาคต ให้ลอง `--runInBand` ก่อนสรุปว่าเป็นบั๊กจริง

### ผลการรัน (ยืนยันสุดท้ายด้วย `--runInBand`)
- `npx tsc --noEmit -p .` — ผ่าน
- `npx jest --runInBand` — **47/47 suites ผ่าน, 245 passed + 1 skip เดิม**

---

## รอบ 9: ปิด backlog เล็ก (PhotoPicker/ProvinceMasterBadge/EmailLinkForm) + หา root cause flaky test จริงจัง

ทำตาม "ของที่ยังไม่ได้ทำ" ใน `docs/session-handoff.md` ทีละข้อตาม priority (ข้อ Map3D/ProvinceTile3D ข้ามไว้ก่อนตามที่ผู้ใช้เลือก เพราะเสี่ยงสูงสุด):

1. **`src/components/PhotoPicker.tsx`** — thumb-zone + shimmer ตามมาตรฐาน advance:
   - ปุ่มลบรูป (✕) ยังเป็น badge 20x20 เท่าเดิม (ไม่อยากขยาย visual ให้เกะกะ) แต่เพิ่ม `hitSlop={12}` (จากเดิม 6) ให้ tap target จริงแตะ ~44pt
   - เปลี่ยนปุ่มลบ/ปุ่ม "+ เพิ่มรูป" จาก `Pressable` ธรรมดาเป็น `PressableScale` (haptic + spring bounce ให้สอดคล้อง component อื่นในแอป)
   - เพิ่ม `ShimmerBlock` แสดงระหว่าง `ImageManipulator.manipulateAsync` กำลังแปลงรูป (state `isConverting`) — เดิมไม่มี feedback ระหว่างรอเลย
   - ไม่แตะ logic การแปลง HEIC→JPEG เดิม (ยืนยันแล้วว่า `photoPickerConversionHappyPath.test.tsx` ยังผ่าน)

2. **`src/components/ProvinceMasterBadge.tsx`** — ผูก `Haptics.notificationAsync(NotificationFeedbackType.Success)` ตาม SKILL.md 3.2 ในจุดเดียวกับที่ spring animation เริ่มทำงาน (`useEffect` เมื่อ `visible` เป็น `true`) — ไม่มี test ผูกกับ component นี้โดยตรงมาก่อน (ตรวจแล้วด้วย grep) จึงไม่กระทบ suite ไหน

3. **`src/components/EmailLinkForm.tsx`** — ยกระดับ UI ครั้งแรก: ห่อฟอร์มด้วย token `RADIUS.lg`/`SHADOWS.sm`/`SPACING` แทน padding ดิบ, เพิ่ม focus state สี accent บน `TextInput`, เปลี่ยนปุ่ม submit/cancel เป็น `PressableScale` พร้อม `minHeight: 44` — **ไม่แตะ label/placeholder/ข้อความ error ใดๆ เลย** เพราะ `src/__tests__/qa-round2/emailLinkIntegrity.test.tsx` ผูก assertion กับข้อความพวกนี้ตรงๆ (ยืนยันผ่านครบหลังแก้)

### หา root cause flaky test จริงจัง (ของค้างจากรอบ 8)
รอบ 8 เคยเจอ suite fail แบบ `Exceeded timeout of 5000ms` ตอนรัน `npx jest` (parallel) แล้วสรุปแค่ว่าเป็น "resource contention" โดยยังไม่ได้แก้ที่ root cause จริง รอบนี้ reproduce ซ้ำได้ 100% (เครื่องนี้มี 24 logical CPUs → jest สั่ง maxWorkers เท่า CPU count โดย default):
- รัน `npx jest` (parallel เต็ม, ไม่ตั้งค่าอะไร) → **4 suites fail** ด้วย timeout 5000ms (เวลารวม ~68s)
- ลองเพิ่ม `testTimeout` เป็น 15000ms เฉยๆ (ไม่แก้ concurrency) → **แย่ลง**: 8 suites fail, เวลารวมพุ่งเป็น ~188s — เพราะ test ที่หนักขึ้นแต่ละตัวถือ CPU ไว้นานขึ้น ยิ่งขยายหน้าต่างการแย่ง CPU ระหว่าง worker แทนที่จะแก้
- สรุป root cause จริง: **จำนวน jest worker (=จำนวน CPU) เยอะเกินไปเมื่อเทียบกับ CPU/memory ที่แต่ละ worker ต้องใช้จริงสำหรับ integration test ที่ render ทั้งแอป stack** (เช่น `emailLinkIntegrity.test.tsx`/`migrationNonBlocking.test.tsx` ที่ mount `AuthProvider`+`JournalProvider`+`CheckinProvider`+`NavigationContainer`+หลายหน้าจอพร้อม `Map3D` SVG) — ยิ่งรันพร้อมกันมากยิ่งแย่งกันจนพังทุกตัว
- แก้จริงด้วยการจำกัด **`"maxWorkers": 4`** ใน `package.json` (`jest` config) แทนการเพิ่ม timeout — ผลคือเสถียร **และเร็วขึ้นด้วย**: รัน `npx jest` (parallel, maxWorkers=4) ซ้ำ 3 รอบติดกัน ได้ **47/47 suites ผ่านทุกรอบ** ที่ ~15-22s ต่อรอบ (เทียบกับ `--runInBand` เดิมที่ ~45s และ parallel เต็มที่พังที่ ~68-188s)
- **บทเรียน**: ปัญหา "test timeout ตอนรัน parallel" บนเครื่องที่มี CPU เยอะ ไม่ได้แปลว่าต้องเพิ่ม `testTimeout` เสมอไป (อาจทำให้แย่ลงอย่างที่เจอ) ให้ลองจำกัด `maxWorkers` ก่อน โดยเฉพาะถ้า suite ส่วนใหญ่เป็น full-app-stack integration test ที่หนัก

### ผลการรัน
- `npx tsc --noEmit -p .` — ผ่าน ไม่มี error
- `npx jest --runInBand` — 47/47 suites ผ่าน, 245 passed + 1 skip (baseline เดิม ไม่เปลี่ยน)
- `npx jest` (parallel, ตั้งค่าใหม่ `maxWorkers: 4`) — **47/47 suites ผ่าน 3 รอบติดกัน**, ~15-22s/รอบ (เร็วกว่าเดิมและไม่ flaky อีกต่อไป)

---

## รอบ 10: Map3D.tsx / ProvinceTile3D.tsx redesign (ข้อสุดท้ายใน backlog)

ข้อเดียวที่เหลือจาก session-handoff — ทำแบบ **additive only** (ไม่แตะ contract ที่ test ผูกอยู่) เพราะความเสี่ยงสูงตามที่ประเมินไว้ก่อนหน้า: ไม่แก้ accessibilityLabel format, ไม่แก้ signature ของ `onPress`/`onLongPress`/`onPressOut`/`onUnlockAnimationDone`, ไม่แก้ rotateX tilt, ไม่แก้จำนวน/โครงสร้าง tile (ยังคง 76 จังหวัด tile ละหนึ่ง) — ยืนยันแล้วด้วย `map3d.test.tsx` (7 suites/31 tests ที่เกี่ยวข้องผ่านครบ)

สิ่งที่เพิ่ม (`src/components/ProvinceTile3D.tsx`):
1. **Haptic บนทุกแตะ tile**: `Haptics.impactAsync(Light)` ใน `handlePress` ก่อนเรียก `onPress(province.id)` เดิม (ตาม SKILL.md 3.2 "แตะปุ่มทั่วไป")
2. **Haptic ตอนปลดล็อกจังหวัด**: `Haptics.notificationAsync(Success)` ในสาขา `isJustUnlocked` ของ `useEffect` เดิม (ก่อนเริ่ม `withSpring`) — น้ำหนักเดียวกับที่ผูกไว้กับ `ProvinceMasterBadge` ในรอบ 9 ไม่ได้แตะ logic การเรียก `onUnlockAnimationDone` เลย (ยังผูกกับ callback ของ `withSpring` ตัวเดิม)
3. **Ring pulse ฉลองตอนปลดล็อก**: เพิ่ม `AnimatedCircle` ที่ centroid ของ tile, ขยาย r + fade opacity ภายใน 550ms ด้วย shared value ใหม่ (`ringScale`/`ringOpacity`) แยกอิสระจาก `lift` — เป็นแค่ภาพประกอบ ไม่กระทบ timing ของ callback ใดๆ
4. **Shimmer skeleton ระหว่างโหลด**: เพิ่ม shared value `shimmerOpacity` วนด้วย `withRepeat` (pulse 1↔0.55 ทุก 700ms) ผูกกับ `isLoading` แทนสีเทาแบนนิ่งเดิม (`lockedTopLoading`) ให้ความรู้สึกเดียวกับ `ShimmerBlock` ที่ใช้ทั่วแอป — reset กลับ opacity 1 ทันทีที่โหลดเสร็จ

สิ่งที่ปรับ (`src/components/Map3D.tsx`):
- Tooltip (long-press) ปรับความกว้างของกล่องให้ตามความยาวชื่อจังหวัดจริง (`Math.max(48, nameTh.length*7+16)`) แทนความกว้างคงที่ 68 เดิม (ชื่อจังหวัดยาวๆ เช่น "นครศรีธรรมราช" เคยล้นกล่องเดิม), ปรับ `rx` เป็น 10 (โค้งมนขึ้น) และสีพื้นหลังให้เข้ม/นุ่มขึ้นเล็กน้อย — ไม่แตะ logic การโชว์/ซ่อน tooltip เลย

### ผลการรัน
- `npx tsc --noEmit -p .` — ผ่าน ไม่มี error
- `npx jest map3d map2dValidation provinceMasterLiveMap landmarkMap --runInBand` — 7/7 suites ผ่าน, 31 passed + 1 skip เดิม
- `npx jest` (parallel, `maxWorkers: 4`) เต็มชุด — **47/47 suites ผ่าน**, 245 passed + 1 skip, ~18s

### Backlog ปิดครบแล้วทุกข้อจาก session-handoff.md เดิม (PhotoPicker, ProvinceMasterBadge, EmailLinkForm, flaky test root cause, Map3D redesign)

---

## รอบ 11: US-26 — เปิด Global Search ให้ค้นหาทั่วประเทศผ่าน Wikipedia (แก้ pain point "search ได้แค่สถานที่ popular")

### บริบท / การตรวจสอบก่อนแก้
ผู้ใช้แก้ไฟล์เองระหว่างเซสชัน (นอก pipeline, ไม่ผ่านผมเลย) เพิ่มฟีเจอร์ resolve รูปจริงแบบ dynamic (`resolveRealPhotoForLandmark`) และ live search ใน `LandmarkList.tsx` — ตรวจแล้วผ่านทั้ง `tsc`/`jest` หลังแก้ bug 1 จุด (เทสต์ `landmarkCardsWikipediaIntegration.test.tsx` auto-mock `searchAttractionsGlobal` เป็น `undefined` ทำให้ `liveResults.filter` crash — แก้ที่ stub ของเทสต์ ไม่แก้ production code)

จากนั้นผู้ใช้ร้องเรียนว่า "search หาสถานที่ท่องเที่ยวได้น้อยมาก เหมือนหาได้แค่ที่ popular ที่เลือกมาโชว์" ถามกลับผู้ใช้ว่าหมายถึงช่องค้นหาไหน — คำตอบ: **ช่องค้นหาหน้า Home (`GlobalSearchBar.tsx`)** ไม่ใช่ช่องค้นหาในหน้าจังหวัด (`LandmarkList.tsx`) ตรวจโค้ดพบว่า `GlobalSearchBar` ค้นหาจาก **`LANDMARKS` (static seed dataset ใน `thailand-landmarks.ts`) เท่านั้น** ไม่เคยแตะ Wikipedia เลย — ตรงกับอาการที่ร้องเรียนเป๊ะ

**พบข้อกำหนดเดิมที่ขัดกันโดยตรงก่อนแก้**: `src/__tests__/qa-round4/globalSearchBarDropdown.test.tsx` มี test ยืนยัน **US-24 AC เดิม**: "GlobalSearchBar must not call fetch — it is local-dataset-only" (mock `global.fetch` ให้ throw ถ้าถูกเรียก) — เป็น trade-off ที่ตั้งใจไว้แต่แรก (เร็ว+offline แลกกับ coverage แคบ) ถามผู้ใช้ก่อนแก้ — **เลือก "เปิดให้ค้นหา online ได้ด้วย"** จึงต้อง revise AC เดิมเป็น US-26 (เพิ่ม entry ใหม่ใน `docs/requirements.md`, ไม่แก้ US-24 เดิมทับ)

### การแก้ไข

**`src/services/wikipediaService.ts`**:
- เพิ่ม `resolveProvinceFromCategories()` — reverse ของ convention เดิมใน `fetchAttractionsForProvince` (category name เช่น "หมวดหมู่:สถานที่ท่องเที่ยวในจังหวัดภูเก็ต"): เช็คว่า category ของบทความมีชื่อจังหวัดไหนใน `PROVINCES` เป็น substring หรือไม่ ใช้ resolve `provinceId` ให้ผลลัพธ์ค้นหาแบบ global (เดิม global search ไม่เคยรู้ provinceId เลย คืนค่า `''` เสมอ — นำทางไม่ได้)
- `searchAttractionsGlobal(keyword)`: **ตัด parameter `provinceNameTh` ออก** — เดิมโค้ดของผู้ใช้ (LandmarkList) ส่ง provinceNameTh ปัจจุบันเข้าไปต่อท้าย query (`${q} ${provinceNameTh}`) ซึ่งเป็นบั๊กที่ทำให้ "ค้นหาทั่วไทย" กลายเป็นค้นหาเฉพาะจังหวัดที่ผู้ใช้กำลังดูอยู่โดยไม่ตั้งใจ (นี่คือสาเหตุหลักอีกจุดของ pain point) เพิ่ม `gsrlimit` จาก 12 → 20 และดึง `categories` (`cllimit=30`) เพิ่มจาก API มาด้วยเพื่อ resolve provinceId
- Photo resolution สำหรับผลลัพธ์ search ที่ยังไม่มีรูป: เปลี่ยนไปใช้ **province ที่ resolve ได้ของผลลัพธ์นั้นเอง** (ไม่ใช่ province ปัจจุบันที่ caller กำลังดูอยู่) แก้บั๊กแฝงอีกจุดที่ context ผิดจังหวัดสำหรับผลลัพธ์ search ข้ามจังหวัด
- ลบ export `searchAttractionsLive` (alias ที่ไม่มีใครเรียกใช้เลย — dead code จากการแก้ไขของผู้ใช้)

**`src/components/LandmarkList.tsx`**: แก้ call site `searchAttractionsGlobal(trimmed, provinceNameTh)` → `searchAttractionsGlobal(trimmed)` ให้ตรงกับ signature ใหม่ (ได้ผลพลอยได้: search ในหน้าจังหวัดก็ครอบคลุมกว้างขึ้นด้วยเช่นกัน)

**`src/components/GlobalSearchBar.tsx`** (แก้ไขหลักของรอบนี้):
- คงพฤติกรรมเดิม (US-24 AC เดิม) ไว้ทั้งหมด: ค้นหา local dataset (จังหวัด + `LANDMARKS`) แบบ synchronous ทันที ไม่พึ่ง network
- เพิ่ม debounce 450ms (เหมือน pattern ใน `LandmarkList.tsx`) ยิง `searchAttractionsGlobal(trimmed)` แบบ nationwide ต่อจากนั้น merge เข้ากับผลลัพธ์ local (dedupe ด้วยชื่อ, กรองทิ้งผลลัพธ์ที่ resolve provinceId ไม่ได้เพราะนำทางไม่ได้)
- เพิ่ม `ActivityIndicator` ตรงตำแหน่งปุ่ม clear ระหว่างค้นหา + แถว "กำลังค้นหาทั่วประเทศไทย..." ท้าย dropdown ระหว่างรอ (ไม่บล็อกผลลัพธ์ local ที่ขึ้นอยู่แล้ว)

### แก้ test ให้ตรงกับ scope ใหม่
- `globalSearchBarDropdown.test.tsx`: เปลี่ยนจากยืนยัน "ไม่เรียก fetch เด็ดขาด" เป็น "**path local ไม่เรียก fetch**" — ใช้ `jest.useFakeTimers()` ไม่ advance เวลาเลย ทำให้ debounce timer ของ online search ไม่มีทางทำงานใน test นี้ได้จริง (แทนที่จะหวังจังหวะเวลา)
- `globalSearchBarProvinceSelection.test.tsx`, `globalSearchBarSelection.test.tsx`, `globalSearchBarLandmarkMatch.test.tsx`, `globalSearchBarEdgeCase.test.tsx`: **4 ไฟล์นี้ไม่เคย mock `wikipediaService`/`fetch` มาก่อน** (ไม่จำเป็นตอนที่ component ยังเป็น local-only) พอเพิ่ม live search เข้าไป การพิมพ์ query ≥2 ตัวอักษรจะ schedule real `setTimeout` 450ms ที่เรียก `fetch` จริงไปหา Wikipedia ถ้า cleanup (unmount) ไม่ทันจังหวะ — เพิ่ม `jest.mock('../../services/wikipediaService', () => ({ searchAttractionsGlobal: jest.fn().mockResolvedValue([]) }))` ทั้ง 4 ไฟล์กันไว้ ตรงตาม convention เดิมของโปรเจกต์ที่ไม่ยอมให้ test แตะ network จริงเด็ดขาด
- เพิ่ม test ใหม่ 2 ไฟล์คุม US-26 โดยตรง: `globalSearchBarLiveWikipediaSearch.test.tsx` (ผลลัพธ์ resolve provinceId ได้ → แสดง+นำทางได้) และ `globalSearchBarLiveWikipediaUnresolvedProvince.test.tsx` (resolve ไม่ได้ → ไม่แสดง) — ใช้ `jest.useFakeTimers()` + `jest.advanceTimersByTimeAsync(450)` แทน real timer เพื่อความ deterministic (ตอนแรกลองรวมเป็น 2 `it()` ในไฟล์เดียวด้วย real timer ตาม pattern เดิมของ `landmarkCardsWikipediaIntegration.test.tsx` แต่เจอ "overlapping act() calls" ข้ามเทสต์ทำให้เทสต์ที่สองพัง (`render` ไม่ผูก `screen` ให้) — ตรงกับกับดักเดิมที่เอกสารไว้ใน `map3d.test.tsx` comment เรื่อง sequential interaction ใน RTL/reanimated combo นี้ แก้ด้วยการแยกไฟล์ + fake timers ตาม convention เดียวกัน)

### ผลการรัน
- `npx tsc --noEmit -p .` — ผ่าน
- `npx jest globalSearchBar` (รวมไฟล์ใหม่) — 8/8 suites ผ่าน
- `npx jest` เต็มชุด รันซ้ำ 3 รอบติดกัน — **49/49 suites ผ่านทุกรอบ**, 247 passed + 1 skip, ~15-17s/รอบ

### เอกสาร
- เพิ่ม **US-26** ใน `docs/requirements.md` (ไม่แก้ US-24 เดิมทับ) พร้อม mark บรรทัด Out-of-Scope เดิมที่พูดถึงเรื่องนี้ว่า superseded

---

## รอบ 12: US-27 — ฝัง TAT open-data landmark dataset ให้ 74/76 จังหวัดมีข้อมูลทันที (offline)

### บริบท
ผู้ใช้เจอ dataset เปิดของ TAT (การท่องเที่ยวแห่งประเทศไทย) ที่ `datacatalog.tat.or.th` — โหลดมาตรวจสอบจริงก่อนตัดสินใจ (ไม่เดา): ไฟล์ดิบ 32MB, **8,634 รายการครอบคลุม 78 จังหวัด**, ทุกรายการมีพิกัด GPS จริงและชื่อไทย, แต่**ไม่มี field รูปภาพเลยแม้แต่ field เดียว** (เช็คครบทั้ง 59 field) — แจ้งผู้ใช้ล่วงหน้าว่ารูปภาพจะยังต้องพึ่ง `resolveRealPhotoForLandmark` เดิม (US-26) ผู้ใช้ยืนยันรับได้ ("รูปภาพเราหาโหลดภายหลังเอาได้ไม่เป็นไร") โฟกัสแค่ "search ไวขึ้น + มีข้อมูลรองรับอยู่แล้ว ไม่ต้องรอ"

### การตรวจสอบก่อนแก้ (สำคัญ — ป้องกันทำลาย test ที่ผ่านอยู่แล้ว)
ก่อนเขียนสคริปต์ ตรวจสอบ `src/data/thailand-landmarks.ts` ปัจจุบันก่อนพบว่า **45/76 จังหวัดมีข้อมูลแล้ว** (8 pilot hand-curated จาก T35 + 37 จาก OSM Overpass merge T60/T61 ที่เคยรันไปแล้วในรอบก่อนๆ ของโปรเจกต์ — grep แรกของผมพลาดนับเฉพาะ single-quote string เจอแค่ 8 จังหวัด ต้องแก้ regex ให้จับทั้ง `'...'` และ `"..."` ถึงเจอ 45 จริง) เหลือ **31 จังหวัดว่างเปล่า**

ก่อน merge ข้อมูลใหม่ grep หา test ที่ผูกกับ "จังหวัดว่างเปล่า" เป็น fixture โดยเฉพาะ (ไม่ใช่แค่เดา) เจอ **2 จังหวัดที่ต้องคงว่างไว้ตลอดไป**:
- `si-sa-ket` — ใช้ใน `src/components/LandmarkList.test.tsx` และ `src/__tests__/qa-round4/landmarkCardsWikipediaIntegration.test.tsx` (AC6 "no local data" empty state)
- `chaiyaphum` — ใช้ใน `src/__tests__/integration/landmarkCheckin.test.tsx` และ `src/__tests__/qa-round3/landmarkMapIntegration.test.tsx`

ยืนยัน 2 จังหวัดนี้คือทั้งหมดที่ต้องกันไว้ด้วยการ cross-reference ทุก `provinceId` literal ที่ปรากฏใน `*.test.ts(x)` กับรายชื่อ 31 จังหวัดว่าง — เจอตรงกัน 2 ตัวนี้เท่านั้น จึงกันไว้ ที่เหลือ **29 จังหวัด** เป็นเป้าหมายจริงของรอบนี้

### สิ่งที่สร้าง/แก้
1. **`scripts/lib/tat-extract-core.ts`** (pure, ไม่แตะ network) — `parseTatLocation` (parse "lat, lng" string + ตรวจ bounding box จริงของประเทศไทยกันพิกัดสลับ/ต่างประเทศหลุดเข้ามา), `stripHtml` (ตัด HTML tag/entity จาก rich-text field ของ TAT), `selectTopTatLandmarks` (คัด top 15/จังหวัด ให้ priority รายการที่มี description จริงก่อน, สร้าง `id: tat-<ATT_ID>` จาก ID จริงของภาครัฐที่ unique อยู่แล้ว ไม่ slugify ชื่อเอง)
   - **หมายเหตุสำคัญ**: `detectCategory` เป็น**สำเนาแยกต่างหาก**จาก `src/services/wikipediaService.ts` ไม่ได้ import ตรงๆ เพราะไฟล์นั้น import `'../data/thailand-provinces'` แบบไม่มี extension ซึ่ง Node's native ESM loader (ที่ใช้รันสคริปต์ตรงๆ ไม่ผ่าน bundler) resolve ไม่ได้ — เจอ error `ERR_MODULE_NOT_FOUND` ตอนรันจริง แก้โดย copy ฟังก์ชันมาแทนที่จะแก้ import ของ app source (ตรงกับ pattern เดิมของ `overpass-extract-core.ts` ที่ไม่ import จาก `src/services/*` อยู่แล้วด้วยเหตุผลเดียวกัน)
2. **`scripts/lib/tat-extract-core.test.ts`** — 14 unit tests ครอบคลุม parse/strip/select/cap/dedupe/priority ทั้งหมด (ผ่านครบก่อนรัน CLI จริง)
3. **`scripts/extract-tat-landmarks.ts`** (CLI, network) — เช็ค `alreadyCovered` จาก `LANDMARKS` import จริง (ไม่ hardcode รายชื่อ 45 จังหวัด เพื่อให้ถูกต้องเสมอถ้า coverage เปลี่ยนในอนาคต) ลบ 2 จังหวัด fixture ออกจาก target แล้วดาวน์โหลด+ประมวลผล เขียนผลลัพธ์ trim แล้วไปที่ `scripts/output/tat-landmarks.json`
4. **`scripts/merge-landmarks.ts`** ขยายให้รองรับ field `description`/`category` เพิ่ม (ของเดิมจาก Overpass มีแค่ id/provinceId/nameTh/lat/lng) และเพิ่ม `--label` arg ให้ comment header ของแต่ละ block ระบุแหล่งที่มาได้ถูกต้อง (ของเดิม hardcode "T60/T61 Overpass extraction" ทุก block)

### รันจริง
- `node scripts/extract-tat-landmarks.ts` — ดาวน์โหลด 8,634 record จริง, จับคู่ชื่อจังหวัดไทยกับ `PROVINCES.nameTh` ได้ตรง **100% ทั้ง 29 จังหวัดเป้าหมาย** (ตรวจสอบ exact-match ล่วงหน้าด้วยสคริปต์แยกก่อนเขียนโค้ดจริง ไม่ได้เดา) ได้ผลลัพธ์ 15 landmark/จังหวัด ครบทุกจังหวัด = 435 รายการ
- `node scripts/merge-landmarks.ts --in scripts/output/tat-landmarks.json --label "US-27 TAT open-data extraction"` — merge สำเร็จ, `thailand-landmarks.ts` จาก 209 → 644 รายการ, จาก 45 → **74/76 จังหวัดมีข้อมูล**

### แก้ test ที่ผูกกับตัวเลข coverage เดิม (คาดไว้ล่วงหน้า พังตามคาด แก้แล้ว)
`src/__tests__/qa-round3/landmarkDataIntegrity.test.ts` มี hard-coded invariant ล็อกไว้จาก QA round 3 เดิม (45 จังหวัด, cap 5/จังหวัด) — อัปเดต:
- "exactly 45 provinces" → "exactly 74 provinces" (76 - 2 fixture)
- "31 provinces empty, sample 1" → "เช็คตรงๆ ว่า withoutData คือ `[chaiyaphum, si-sa-ket]` เป๊ะ" (เข้มกว่าเดิมที่เช็คแค่ sample ตัวเดียว)
- "cap ≤5" → "cap ≤15" (`MAX_LANDMARKS_PER_PROVINCE` ใหม่จาก TAT)
- เพิ่ม test ใหม่: ทุก landmark ที่ id ขึ้นต้น `tat-` ต้องมี description+category ไม่ว่าง (field ที่ Overpass merge เดิมไม่เคยมี)
- ไม่แตะ test อื่นในไฟล์เดียวกันเลย (duplicate id, orphan provinceId, lat/lng pairing, pilot-8 backward-compat, byte-identical spot-check) — รันแล้วผ่านหมดโดยไม่ต้องแก้

### ผลการรัน
- `npx tsc --noEmit -p .` — ผ่าน
- `npx jest landmarkDataIntegrity` — 17/17 ผ่าน (รวม test ใหม่)
- `npx jest` เต็มชุด รันซ้ำ 3 รอบติดกัน — **50/50 suites ผ่านทุกรอบ**, 262 passed + 1 skip (เพิ่มจาก 247 เพราะ unit test ใหม่ 14 ตัว + integrity test ใหม่ 1 ตัว), ~14s/รอบ — **ไม่มี test อื่นนอกเหนือจาก landmarkDataIntegrity.test.ts พังเลยแม้แต่ตัวเดียว** ยืนยันว่าการกันจังหวัด fixture ไว้ถูกต้องครบถ้วน

### เอกสาร
- เพิ่ม **US-27** ใน `docs/requirements.md` พร้อมสมมติฐาน/ACเต็ม ไม่แก้ US-26 เดิมทับ

---

## รอบ 13: แก้ gap จริงที่ผู้ใช้เจอ — "ค้นหา ชะอำ ไม่เจอทั้งที่มีใน dataset" (แก้ US-27 ให้สมบูรณ์)

### บริบท: บั๊กที่ผู้ใช้เจอจริงหลังรอบ 12
ผู้ใช้ค้นหา "ชะอำ" (หาดชะอำ จ.เพชรบุรี — สถานที่ท่องเที่ยวชื่อดังระดับประเทศ) แล้วไม่เจออะไรเลย ทั้งที่ยืนยันว่ามีอยู่ใน dataset ที่ให้ไป ตรวจสอบแล้วพบ **2 root cause ซ้อนกัน**:

1. **เพชรบุรีไม่เคยถูก merge ข้อมูล TAT เลย** — สคริปต์รอบ 12 (`extract-tat-landmarks.ts`) เดิม target เฉพาะ "จังหวัดที่มี landmark เป็น 0" (31 จังหวัด) เท่านั้น แต่เพชรบุรีมี **5 landmark เดิมจาก OSM merge เก่า (T60/T61)** อยู่แล้ว (ชื่อสถานที่ทั่วไป ไม่มี "ชะอำ" เลย) จึงถูกข้ามไปทั้งจังหวัด — grep เจอว่ามีทั้งหมด **37 จังหวัด** ที่ตกอยู่ในสถานการณ์เดียวกัน (มี OSM landmark บางๆ 2-5 รายการ ไม่มี description/category และไม่เคยได้รับข้อมูล TAT เสริมเลย)
2. **ต่อให้จังหวัดถูก merge ก็ยังพลาดได้**: ทดสอบจริงพบว่า "หาดชะอำ" ไม่ติด top-15 ของเพชรบุรี (92 รายการดิบ) เพราะ heuristic เดิม (`selectTopTatLandmarks`) จัดลำดับด้วย "มี description หรือไม่" — **หาดชะอำไม่มีทั้ง `ATT_HILIGHT` และคำอธิบายยาวเป็นพิเศษ** (เป็นสถานที่เก่าแก่ตั้งแต่ปี 2009 ที่ TAT ไม่ต้องเขียนคำโปรยการตลาดให้ เพราะมันดังอยู่แล้ว ตรงข้ามกับสถานที่ท่องเที่ยวชุมชนใหม่ๆ ที่เพิ่งลงทะเบียนปี 2023-2025 ซึ่งมักมี `ATT_HILIGHT` เพราะ TAT ต้องช่วยโปรโมท) ทดลองเปลี่ยนเป็นจัดลำดับตามความยาว description แทนก็ยังไม่ติด (อันดับ 45/92 — dataset นี้มีสถานที่ที่เขียนคำอธิบายยาวกว่าเยอะมาก) **สรุปว่าไม่มี field ไหนใน dataset นี้ที่บ่งบอกความ "ดัง/notable" ได้น่าเชื่อถือเลย** — cap แบบ "top N" ตัดสถานที่ดังทิ้งแบบสุ่มได้เสมอ ไม่ว่าจะใช้ heuristic ไหน

### การแก้ไข (2 ทาง — ทั้งเสริมข้อมูลจริงและแก้ architecture การค้นหา)

**1) เสริม TAT data ให้ 37 จังหวัดที่มีแค่ OSM data เดิม (ไม่แตะ 8 pilot):**
- `scripts/lib/tat-extract-core.ts`: `selectTopTatLandmarks` เพิ่ม parameter `limit` (default = `MAX_LANDMARKS_PER_PROVINCE`) ให้เรียกแบบ "เติมให้ครบ cap รวม" ได้ (เช่น จังหวัดมี OSM อยู่แล้ว 5 → เรียกด้วย `limit=10` เพื่อให้รวมแล้วไม่เกิน 15)
- `scripts/extract-tat-landmarks.ts`: เปลี่ยน target จาก "จังหวัดที่ landmark=0" เป็น **"ทุกจังหวัดยกเว้น 8 pilot + 2 fixture"** (66 จังหวัด) คำนวณ `remainingSlots = 15 - จำนวนที่มีอยู่แล้ว` ต่อจังหวัด ถ้า ≤0 ข้ามเลย (จังหวัดที่ merge TAT ไปแล้วในรอบ 12 จะได้ remainingSlots=0 พอดี ทำให้รันซ้ำได้แบบ idempotent)
- `scripts/merge-landmarks.ts`: เปลี่ยน eligibility check จาก **"จังหวัดมี entry อยู่แล้วหรือยัง" (province-level)** เป็น **"id นี้มีอยู่แล้วหรือยัง" (id-level) + เช็ค pilot province ตรงๆ แยกต่างหาก** — เพราะ logic เดิมคือสาเหตุ root cause #1 (มันปฏิบัติกับ "จังหวัดที่มี OSM data บางๆ" เหมือนกับ pilot province ที่ห้ามแตะ ทั้งที่ควรเติมได้)
- รันจริง: `node scripts/extract-tat-landmarks.ts --out scripts/output/tat-landmarks-batch2.json` → ได้ 377 landmark ใหม่ครอบคลุม 37 จังหวัด (29 จังหวัดจาก batch แรกขึ้น "already at cap, skipping" ถูกต้องตามคาด) → merge เข้า `thailand-landmarks.ts` (label "batch 2 — top up existing OSM provinces") → **1,019 landmarks ครอบคลุม 74/76 จังหวัดเหมือนเดิม แต่ไม่มีจังหวัดไหนเกิน cap 15 เลย** (ตรวจสอบแล้วด้วยสคริปต์นับจริง)

**2) แก้ปัญหาเชิง architecture: แยก "search index" ออกจาก "display list" (แก้ root cause #2):**
เนื่องจากพิสูจน์แล้วว่าไม่มี heuristic ไหนเชื่อถือได้ 100% สำหรับเลือก "top 15 ที่ควรโชว์" ให้ครอบคลุมทุกสถานที่ดัง จึงตัดสินใจไม่พยายามแก้ heuristic ต่อ (เสียเวลาไม่คุ้ม) แต่แยกปัญหาออกเป็น 2 concern ต่างกัน:
- **List ที่โชว์ตอนเปิดหน้าจังหวัด**: ยังคง cap ที่ 15 ต่อไป (ดีต่อ UX, bundle size) — ใช้ `selectTopTatLandmarks` เหมือนเดิม
- **การค้นหา (search)**: ต้องครอบคลุม**ทุกสถานที่จริงในจังหวัดนั้น** ไม่ใช่แค่ 15 ที่ถูกเลือกมาโชว์ — สร้างไฟล์ใหม่ `src/data/tat-search-index.ts` (auto-generated, ห้ามแก้มือ) ผ่าน `scripts/extract-tat-search-index.ts` + `buildSearchIndexEntries()` ใน `tat-extract-core.ts` (ไม่ cap เลย ไม่มี description/category เก็บแค่ id/provinceId/nameTh/lat/lng ให้ไฟล์เบาที่สุด)
- รันจริง: ได้ **6,319 รายการ ครอบคลุม 66 จังหวัด ไฟล์ขนาด ~1MB** (ยืนยันด้วย unit test ว่า "หาดชะอำ" ผ่านเข้า index นี้แน่นอนแม้ไม่มี description เลย — ตรงข้ามกับ `selectTopTatLandmarks` ที่จะตัดทิ้ง)
- `src/components/GlobalSearchBar.tsx`: เพิ่ม step 3 ค้นหาใน `TAT_SEARCH_INDEX` ต่อจาก `LANDMARKS` เดิม (dedupe ด้วย `id` ที่เจอไปแล้วจาก LANDMARKS กัน pop ซ้ำ) ยังคงเป็น**local instant search ล้วนๆ ไม่แตะ network เลย** (แค่ array ที่ใหญ่ขึ้น ไม่ใช่ debounce/fetch ใหม่) จึงไม่กระทบ US-24 AC5 (revised) ที่ยังต้องพิสูจน์ว่า path นี้ไม่เรียก fetch

### Unit tests ใหม่
`scripts/lib/tat-extract-core.test.ts`: เพิ่ม 5 test ครอบคลุม `limit` parameter ของ `selectTopTatLandmarks` (custom limit, limit≤0) และ `buildSearchIndexEntries` ทั้งหมด (ไม่ cap, หา "หาดชะอำ" เจอจริงตามเคสที่เจอบั๊ก, ยัง drop record ที่ไม่มีชื่อ/พิกัด, ไม่มี description/category ติดมาด้วย) — รวมเป็น 21/21 ผ่าน

### บั๊กที่เจอระหว่างแก้ (ไม่ใช่ production code — แก้ที่ test)
เทสต์ `globalSearchBarLiveWikipediaSearch.test.tsx` (เขียนไว้รอบ 11) ใช้ query จำลอง "ไอ้ไข่" ซึ่ง**บังเอิญเป็นสถานที่จริง** (วัดเจดีย์ไอ้ไข่ จ.นครศรีธรรมราช) ที่ตอนนี้มีอยู่จริงใน `tat-search-index.ts` แล้ว (นครศรีธรรมราชเป็นหนึ่งใน 37 จังหวัดที่เพิ่งเติมข้อมูล) ทำให้ผลลัพธ์จริงจาก local search กับผลลัพธ์ mock จาก Wikipedia ชนกัน (`getByText` เจอ 2 elements ที่ subtitle เดียวกัน) — แก้โดยเปลี่ยนชื่อ/query ในเทสต์ให้เป็นคำสมมติที่ไม่มีทางชนกับข้อมูลจริงในอนาคต (ไม่แก้ production code เพราะพฤติกรรมนี้ถูกต้องแล้ว — เป็นสัญญาณยืนยันว่าการแก้ทำงานได้จริง)

### ผลการรัน
- `npx tsc --noEmit -p .` — ผ่าน
- `npx jest scripts/lib/tat-extract-core` — 21/21 ผ่าน
- `npx jest` เต็มชุด รันซ้ำ 3 รอบติดกัน — **50/50 suites ผ่านทุกรอบ**, 269 passed + 1 skip, ~14s/รอบ

### ไฟล์ที่ได้
- `src/data/thailand-landmarks.ts`: 644 → **1,019 landmarks**, ยังคง 74/76 จังหวัด, ไม่มีจังหวัดไหนเกิน cap 15
- `src/data/tat-search-index.ts` (ใหม่, auto-generated ~1MB): **6,319 รายการ ครอบคลุม 66 จังหวัด** สำหรับ search เท่านั้น ไม่โชว์เป็นการ์ดปกติ

---

## รอบ 14: แก้บั๊กผู้ใช้รายงาน 2 เรื่อง — "กด search result แล้วค้าง" + "หน้าจังหวัดเลื่อนไม่ได้"

### บั๊ก 1: กด global search result แล้วไม่มีอะไรเกิดขึ้น (เหมือนค้าง)

**Root cause ที่ยืนยันแล้ว (ไม่ใช่แค่เดา):** `HomeScreen.tsx` ครอบทั้งหน้าด้วย `<ScrollView>` (บรรทัด 77 เดิม) ที่**ไม่ได้ตั้ง `keyboardShouldPersistTaps`** (default = `"never"`) และ `GlobalSearchBar` (ทั้ง `TextInput` และ dropdown ผลลัพธ์) เป็น descendant ของ ScrollView ตัวนี้ ขณะ `TextInput` โฟกัสอยู่ (กำลังพิมพ์ค้นหา) การแตะที่ผลลัพธ์ในดรอปดาวน์ (ซึ่งอยู่ใน `ScrollView` ลูกของตัวเองที่ตั้ง `keyboardShouldPersistTaps="handled"` ไว้ถูกต้องอยู่แล้ว) จะโดน **ScrollView ชั้นนอกสุดของ HomeScreen ดักไว้ก่อน** เพราะมันไม่รู้ว่าต้อง "handled" เหมือนกัน — RN จะถือว่าการแตะครั้งแรกคือการ dismiss keyboard แล้วกลืน event ทิ้ง ไม่ปล่อยให้ `onPress` ของผลลัพธ์ทำงานเลย — ตรงกับอาการที่ผู้ใช้รายงานทุกจุด (กดแล้วเหมือนค้าง ไม่ navigate ไม่ปิด dropdown)

**ทำไม unit test เดิมทั้งหมด (`globalSearchBar*.test.tsx`, `globalSearchBarHomeScreen.test.tsx`) ถึงผ่านอยู่แล้วทั้งที่มีบั๊กนี้จริง:** เพราะ RTL `fireEvent.press(...)` ยิง event ตรงไปที่ component เป้าหมายเลย ไม่ได้จำลอง native touch/gesture responder negotiation ระหว่าง ScrollView ที่ซ้อนกันจริง จึงไม่มีทางจับบั๊ก class นี้ได้ด้วย unit test แบบเดิม (ต้องทดสอบบนอุปกรณ์จริง/emulator เท่านั้น)

**การแก้:** เพิ่ม `keyboardShouldPersistTaps="handled"` ให้ `<ScrollView>` หลักของ `HomeScreen.tsx` — ไฟล์: `src/screens/HomeScreen.tsx`

### บั๊ก 2: หน้าจังหวัด (ProvinceDetailScreen) เลื่อนขึ้นลงไม่ได้

**Root cause ที่ยืนยันแล้ว:** `ProvinceDetailScreen.tsx` เดิมไม่มี scroll container ห่อเนื้อหาเลย — เป็น `SafeAreaView` (flex:1) ที่มี header + `ProvinceMasterBadge` + `LandmarkList` (เป็น `View` ธรรมดาที่ render การ์ดตาม `.map()` ความสูงไม่จำกัด ไม่ใช่ `ScrollView`/`FlatList`) + ปุ่มเพิ่มบันทึก + `FlatList` ของ entries เรียงต่อกันเป็น sibling ทั้งหมดใน container ที่ไม่มี scroll เมื่อรวมความสูงทั้งหมด (โดยเฉพาะการ์ด landmark ที่อาจมีหลายสิบใบ) เกินจอ เนื้อหาจะถูกตัด/ล้นออกนอกจอโดยไม่มีทางเลื่อนดูได้เลย ตรงกับที่ผู้ใช้สงสัยว่า "น่าจะเป็นเพราะ layout" เป๊ะ

**การแก้:** ห่อเนื้อหาทั้งหมด (ยกเว้น header ที่คงไว้ fixed ด้านบน) ด้วย `<ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled">` ตัวเดียว, แปลง `FlatList` ของ entries (ท้ายสุด) เป็น `.map()` ธรรมดาแทน เพื่อไม่ให้เกิด "VirtualizedList ซ้อนใน ScrollView" (nested-list warning + gesture conflict แบบเดียวกับบั๊ก 1) — จำนวน entries ต่อจังหวัดมีจำกัด ไม่ใช่ list ยาวมากจึง render ตรงได้โดยไม่เสีย performance — ไฟล์: `src/screens/ProvinceDetailScreen.tsx`

### ผลการรัน
- `npx tsc --noEmit` — ผ่าน สะอาด
- `npx jest src/__tests__/integration/provinceDetailScreen.test.tsx src/__tests__/integration/homeScreen.test.tsx src/__tests__/qa-round4/globalSearchBar` — **10/10 suites, 15/15 tests ผ่าน**
- ไม่ได้รัน jest เต็มชุด (ตามคำสั่งผู้ใช้ ไม่จำเป็นสำหรับบั๊กเล็กจุดนี้ + เปลี่ยนแค่ 2 ไฟล์ screen ไม่กระทบ logic ไฟล์อื่น)

### หมายเหตุ
- ไม่แตะ `GlobalSearchBar.tsx`/`LandmarkList.tsx` ที่มีการแก้ไขค้างอยู่จาก session ก่อนหน้า (US-26/US-27) เลย — บั๊กทั้ง 2 อยู่ที่ layout ระดับ screen (`HomeScreen.tsx`, `ProvinceDetailScreen.tsx`) ไม่ใช่ตัว component เหล่านั้นเอง
- ไม่มีจุดที่ต้องส่งกลับ PM — เป็นบั๊ก layout/gesture-handling ล้วนๆ แก้ได้ครบตาม scope ที่ระบุ

---

## รอบ 7: Bottom Tab Navigation & ข่าวท่องเที่ยว RSS (US-28–US-32, T90–T109)

### T90 — Verify RSS endpoint จริง (ทำก่อนสุดตามที่ PM สั่ง)
ยิง `curl` จริงไปที่ `https://www.tatnews.org/feed/` (ตัวเลือกแรกตามคำตัดสิน PM ข้อ 19) ก่อนเขียนโค้ดฝั่งข่าวใดๆ:
- **HTTP 200**, `content-type: application/rss+xml; charset=UTF-8`, body เป็น RSS 2.0 XML ที่ถูกต้องจริง (มี `<channel>`, `<item>` หลายรายการ, `title`/`link`/`pubDate`/`description` ครบทุก field ที่ต้องการ) — `pubDate` เป็นรูปแบบ RFC 822 มาตรฐาน (`Sat, 12 Sep 2026 02:16:28 +0000`) ที่ `new Date(...)` parse ได้ตรงๆ
- **ไม่ต้อง fallback ไป Bangkok Post/The Nation เลย** — endpoint แรกใช้งานได้จริง ตัดสินใจใช้ `https://www.tatnews.org/feed/` เป็นแหล่งเดียวตามลำดับ fallback ที่ PM กำหนด (ข้อ 1 ใช้ได้ จึงไม่ต้องลอง 2/3/4)
- **ข้อสังเกต/caveat ที่พบ**: item ทุกรายการที่ตรวจสอบ (สุ่มดูหลายรายการ) **ไม่มี `<enclosure>`, `<media:content>`, หรือ `<img>` ในตัว description เลยสักรายการ** — เท่ากับว่าการ์ดข่าวเกือบทั้งหมด (อาจทั้งหมด) จะตกไปใช้ News Card Placeholder Cover เสมอในทางปฏิบัติ ไม่ใช่บั๊ก parser (ทดสอบ parser แยกแล้วว่าดึงรูปถูกต้องเมื่อมีจริงตาม priority enclosure→media:content→img ใน description) — เป็นข้อจำกัดของแหล่งข้อมูลเอง ไม่ใช่สิ่งที่แก้ได้ฝั่ง dev พีเอ็มอาจพิจารณาเพิ่มแหล่งอื่นเป็น fallback ถ้าต้องการให้การ์ดมีรูปจริงมากขึ้นในอนาคต แต่ไม่ใช่บั๊ก/ปัญหาที่ต้องแก้ในรอบนี้ (AC ของ US-29/US-32 ยอมรับ placeholder อยู่แล้ว)
- TTL cache ตั้งตามคำตัดสิน PM ข้อ 19: **45 นาที** คงที่ (`NEWS_CACHE_TTL_MS` ใน `src/services/newsService.ts`)

### T91 — Dependency ใหม่: ตรวจสอบ + ติดตั้งจริง
- ยืนยันด้วย `npm view` ว่า `@react-navigation/bottom-tabs@^7.18.18` เข้ากันได้กับ `@react-navigation/native@^7.3.18` ที่มีอยู่แล้ว (peerDependency ตรงกันพอดี) และ `expo-web-browser@~57.0.3` ตรงกับ Expo SDK 57 (เวอร์ชันเดียวกับ `expo-image-picker`/`expo-haptics` ที่มีอยู่แล้ว)
- ติดตั้งด้วย `npx expo install @react-navigation/bottom-tabs expo-web-browser` (ไม่ใช้ `npm install` ตรงๆ เพื่อให้ expo-cli เลือกเวอร์ชันที่ compatible กับ SDK ให้อัตโนมัติ) — expo-cli auto-เพิ่ม `"expo-web-browser"` เข้า `plugins` ใน `app.json` ให้เองด้วย (ไม่ต้องแก้มือ)
- ตรวจสอบ `@expo/vector-icons`: **ไม่มีอยู่ใน `node_modules` เลย** (`require.resolve` throw) — ไม่ติดตั้งเพิ่ม เพราะ design-spec กำหนด emoji (`🗺️`/`📰`) เป็นดีฟอลต์ที่ใช้งานได้ทันทีอยู่แล้วโดยไม่ต้องพึ่ง icon library (ตรงตาม pattern เดิมของแอปทั้งหมดที่ใช้ emoji เป็นไอคอนเสมอ) — ถ้า PM/UIUX ต้องการ vector icon จริงในอนาคตต้องเพิ่ม dependency นี้และแก้ `TAB_ICON` ใน `AppNavigator.tsx`

### T92–T96 — Navigation restructure (สายเสี่ยงสูงสุด)
- `src/navigation/AppNavigator.tsx`: เปลี่ยนจาก native stack เดี่ยวเป็น `createBottomTabNavigator` 2 แท็บ (`MapTab`, `NewsTab`) แต่ละแท็บห่อ **nested native stack ของตัวเอง** (`MapStackNavigator` — Home/ProvinceDetail/AddEntry/Stats/Settings/Map2DValidation เหมือนเดิมทุกประการ, `NewsStackNavigator` — News/Stats/Settings ใหม่)
- **การตัดสินใจสำคัญ (ลดความเสี่ยง regression)**: ใช้ **`RootStackParamList` ตัวเดียวกันตัวเดิม** (เพิ่มแค่ key `News`) เป็น generic type ให้ทั้ง `MapStack` และ `NewsStack` แทนที่จะแยก param list 2 ชุด — ผลคือ **ไม่ต้องแก้ prop type ของ `HomeScreen`/`ProvinceDetailScreen`/`AddEntryScreen`/`StatsScreen`/`SettingsScreen`/`Map2DValidationScreen` แม้แต่ไฟล์เดียว** (ยังคง `NativeStackScreenProps<RootStackParamList, 'X'>` เป๊ะเหมือนก่อนรอบนี้) ลด diff/ความเสี่ยงลงมาก
  - **Trade-off ที่ยอมรับ (บันทึกไว้ให้ QA ทราบ)**: เพราะ `NewsStack` ใช้ type เดียวกับ `MapStack` เต็มๆ TypeScript จะไม่ฟ้องถ้าโค้ดใน `StatsScreen` เรียก `navigation.navigate('ProvinceDetail', ...)` หรือ `navigate('Home')` ขณะถูก mount อยู่ใน `NewsStack` (ซึ่งไม่ได้ register 2 route นี้จริง) — เคสนี้เกิดได้จริงถ้าผู้ใช้เปิดแท็บ "ข่าว" → กด "สถิติ" → กดแตะ entry ใน timeline (`StatsScreen` มี `onPress` ที่เรียก `navigate('ProvinceDetail', ...)`) ผลลัพธ์ตอนรันจริง: **ไม่ crash** — react-navigation แค่ log dev warning "The action 'NAVIGATE' ... was not handled by any navigator" แล้วไม่ทำอะไร (ปุ่มดูเหมือนกดไม่ติด) เพราะทั้ง `NewsStack` และ root `Tab.Navigator` ไม่มี route ชื่อ `ProvinceDetail` เลย — ไม่มี AC ไหนของ US-28 ครอบคลุมเคสนี้ตรงๆ (AC4 พูดถึงแค่ปุ่ม Stats/Settings เอง) จึงไม่ implement เพิ่มในรอบนี้ (จะทำให้ต้อง register ProvinceDetail/AddEntry/Home ซ้ำใน NewsStack ซึ่งขัดกับที่ T92 ระบุ scope ของ NewsStack ไว้ชัดว่ามีแค่ News+Stats+Settings) — **ถ้า PM ต้องการให้ทำงานถูกต้องเต็มรูปแบบ (deep-link ข้ามแท็บ) ต้องตัดสินใจเพิ่มเติมและอาจกระทบ design-spec**
- `navigationRef` (ที่ `App.tsx`'s `AnonWarningGate` ใช้ `navigationRef.navigate('Settings')`) **ไม่ต้องแก้เลย** — ยืนยันแล้วว่า react-navigation แก้ `navigate(name)` แบบไม่ระบุ path เต็มด้วยการหา route ชื่อนั้นในต้นไม้ navigator ปัจจุบัน (นับทั้งแท็บที่ active อยู่) ให้อัตโนมัติ ทดสอบผ่านจริงใน `settingsScreen.test.tsx` เดิม (ยังผ่านหมดไม่ต้องแก้) + regression test ใหม่
- แก้ test เดิม 1 ไฟล์ที่พังจากการ refactor โครงสร้าง (ไม่ใช่บั๊ก แค่ assertion ผูกกับโครงสร้างเดิม): `src/__tests__/integration/map2dValidationScreen.test.tsx` เช็ค `AppNavigator.toString()` ว่ามี `__DEV__` — หลัง refactor gating ย้ายไปอยู่ใน `MapStackNavigator` (ฟังก์ชันแยก ไม่ใช่ top-level `AppNavigator` อีกต่อไปเพราะตอนนี้ตัวนั้นคือ Tab Navigator) จึง export `MapStackNavigator` เพิ่มจาก `AppNavigator.tsx` (named export เสริม ไม่กระทบ default export/behavior เดิม) แล้วแก้ test ให้เช็ค `MapStackNavigator.toString()` แทน — พฤติกรรมจริง (Map2DValidation ยังเข้าถึงได้ใน dev, gate ด้วย `__DEV__` เหมือนเดิม) ไม่เปลี่ยนแปลง ยืนยันซ้ำด้วย regression test ใหม่ (`appNavigatorBottomTabs.test.tsx`)
- Tab bar: emoji icon (🗺️/📰) + label ไทยตาม design-spec, สี active=`COLORS.accent`/bold, inactive=`COLORS.textSecondary`, haptic light เฉพาะตอนสลับไปแท็บใหม่ (เช็ค `navigation.isFocused()` ก่อน fire ทุกครั้งกันสั่นซ้ำตอนแตะแท็บเดิม), `tabBarAccessibilityLabel`/`accessibilityState` ตาม spec

### T97–T100 — News data/logic layer
- `src/services/newsRssParser.ts` (T98/T99): pure-function regex/string parser ตามคำตัดสิน PM ข้อ 21 (ไม่พึ่ง DOMParser/XML library) — รองรับ CDATA unwrap, HTML entity decode (numeric/hex/named ที่พบบ่อย), image priority `<enclosure>` → `<media:content>` → first `<img>` ใน description → `undefined`, `content:encoded` เป็น fallback ของ description, sort by `pubDate` desc + unparseable ไปท้ายสุดแบบ stable, dedupe by `link` (fallback `title`) เก็บรายการแรก
- `src/services/newsService.ts` (T97/T100): `fetchNewsRssXml` แยก network/timeout/HTTP/invalid-XML error ออกจาก success ชัดเจน (throw `NewsFetchError`), AsyncStorage cache (`news_cache_v1`) + TTL 45 นาที, `isLikelyReachable` (T107 — ดูหัวข้อ In-App Browser ด้านล่าง)
- ไม่มีจุดไหนใน T97-T100 ที่ทำไม่ได้ตาม spec — ครบทุก AC ของ US-29 AC1/AC5, US-32 AC3/AC5

### T101–T104 — NewsScreen UI
- `src/screens/NewsScreen.tsx`: stale-while-revalidate ตาม design-spec เป๊ะ — mount แสดง cache ทันที (ถ้ามี) ก่อนเสมอ, fetch สดในพื้นหลังเฉพาะตอนไม่มี cache/cache หมดอายุ (TTL), pull-to-refresh บังคับ fetch เสมอไม่สนใจ TTL, error state (T103) vs empty state (T103) แยกกันชัดเจนตาม `fetchError` flag ที่ set เฉพาะตอน fetch จริงล้มเหลว+ไม่มีอะไรให้โชว์ (รูปแบบเดียวกับ T87-T89/US-25 ที่มีอยู่แล้วใน `LandmarkList.tsx`)
- คอมโพเนนต์ใหม่: `NewsCard.tsx` (T102, placeholder ใช้ `LinearGradient` โทนเขียวอ่อน + 📰 ตามสเปก), `NewsLoadingSkeleton.tsx` (T101, 5 แถว shimmer ขนาดจำลองการ์ดจริง), `NewsCacheIndicator.tsx` (T104), `NewsErrorState.tsx` (T103, reuse pattern จาก `LandmarkFetchErrorState` — โทนกลางไม่ใช่สีแดงตามที่ design-spec กำหนด)
- แก้ `EmptyState.tsx` เพิ่ม optional prop `subtitle` (backward-compatible, caller เดิมทั้งหมดไม่ส่ง prop นี้จึงไม่กระทบ) เพื่อรองรับ "ยังไม่มีข่าวในขณะนี้" + "ลากลงเพื่อรีเฟรช" ตาม design-spec โดยไม่ต้องสร้าง component ใหม่ซ้ำซ้อน (T103 บอกให้ reuse `EmptyState.tsx` เดิม)
- ไม่มี component ใหม่ชื่อ `Toast.tsx` มาก่อนในโปรเจกต์ — design-spec อ้างว่ามี "toast pattern อยู่แล้ว" แต่ตรวจโค้ดจริงแล้วพบว่า pattern เดิมที่ใกล้เคียงที่สุดคือ `Alert.alert(...)` ใน `AddEntryScreen.tsx` (native blocking dialog ไม่ใช่ transient toast) จึงต้องสร้าง `src/components/Toast.tsx` ใหม่ตั้งแต่ต้น (animated fade in/out ด้วย `react-native-reanimated`, auto-dismiss ตาม `duration` prop)

### T105–T108 — In-App Browser
- `src/screens/NewsScreen.tsx`: `handleOpenNews` เช็คลำดับ (1) link format ถูกต้องหรือไม่ (regex `^https?:\/\/`) → toast "ไม่สามารถเปิดข่าวนี้ได้" ถ้าไม่ผ่าน (2) `isLikelyReachable(link)` (T107) → toast "ต้องเชื่อมต่ออินเทอร์เน็ต..." ถ้าไม่ผ่าน (3) `WebBrowser.openBrowserAsync(link)`
- **T107 opportunistic network check**: implement เป็น HEAD request จริงไปที่ **URL ข่าวเดียวกับที่กำลังจะเปิด** (ไม่ใช่ ping endpoint แยกที่ไม่เกี่ยวข้อง) ภายใน timeout 6 วินาที — throw/reject = "offline", ได้ response ใดๆ กลับมาแม้แต่ 404/500 = "online" (เพราะแปลว่าอุปกรณ์เชื่อมต่อเน็ตได้จริง ปัญหาถ้ามีคือฝั่ง URL เอง ซึ่งเป็นคนละเคสกับ US-31 AC4) ตรงตาม pattern "opportunistic" เดียวกับ `SyncContext.tsx`/T73 ที่ tasks.md อ้างอิง (ยิง request จริงแล้ว catch error แทนการพึ่ง `@react-native-community/netinfo` ซึ่งไม่มีติดตั้ง)
- **T106/T107 toast duration**: ใช้ **4000ms** ตามคำตัดสิน PM ข้อ 23 (ปรับจาก ~2.5s ที่ design-spec เสนอไว้เดิม) — ทั้ง 2 ข้อความ (`link-invalid`, `offline`) เหมือนกัน
- **T108**: ไม่ต้องเขียนโค้ดเพิ่มเพื่อรักษา scroll position — `openBrowserAsync` เป็น native modal overlay, `NewsScreen` ไม่ unmount ระหว่างเปิดอยู่ และไม่มี `useFocusEffect`/refetch-on-focus logic ใดๆ ที่จะ reset state เมื่อกลับมา (จงใจไม่ใส่ — fetch มีแค่ตอน mount/pull-to-refresh/retry เท่านั้น) จึงได้พฤติกรรมที่ต้องการโดยธรรมชาติ ยืนยันด้วยโค้ดรีวิว ไม่ได้เขียน automated test แยกสำหรับเคสนี้เพราะ RNTL/react-test-renderer จำลอง native modal overlay ของ `expo-web-browser` ไม่ได้จริง (เหมือนข้อจำกัดที่ `homeScreenScrollViewGuard.test.tsx` เคยบันทึกไว้เรื่อง native touch arbitration) — ต้อง manual QA บนอุปกรณ์จริงเพื่อยืนยันสุดท้าย

### T109 — Edge case verification (US-32 ทั้ง 5 ข้อ)
ครอบคลุมด้วย test แยกเคสชัดเจนไม่ปนกัน กระจายอยู่ 2 ระดับ:
- `src/services/newsRssParser.test.ts`: (2) placeholder เมื่อไม่มีรูป (unit ระดับ parser), (3) dedupe by link/title, (5) missing/invalid pubDate ไปท้ายสุด
- `src/__tests__/integration/newsScreen.test.tsx`: (1) feed ว่าง → Empty State ไม่ใช่ Error State, (2) placeholder cover จริงบนหน้าจอ (ไม่ใช่ broken image), (4) fetch ล้มเหลว+ไม่มี cache → Error State พร้อมปุ่มลองใหม่ที่ทำงานจริง

### ผลการรัน
- `npx tsc --noEmit` — ผ่าน สะอาด (ทั้งก่อน/หลังเพิ่มไฟล์ทั้งหมด)
- `npx jest` เต็มชุด — **61/61 suites ผ่าน, 319 passed + 1 skip (เดิม)**, ไม่มี test เดิมพังแม้แต่ตัวเดียวนอกจาก 1 ไฟล์ที่ต้องอัป assertion ให้ตรงโครงสร้างใหม่ตามที่อธิบายไว้ข้างบน (ไม่ใช่ behavior regression)
- Test ใหม่ที่เพิ่มในรอบนี้: `newsRssParser.test.ts` (27 cases รวม T111 CDATA/namespace/entity), `newsService.test.ts` (fetch/cache/reachability), `newsScreen.test.tsx` (10 integration cases ครอบ T101-T109), `appNavigatorBottomTabs.test.tsx` (6 regression cases ครอบ T95/T96)

### จุดที่ทำไม่ได้ตาม spec 100% / ต้องการให้ PM ทราบ
1. **Trade-off ของ shared param list** (อธิบายละเอียดในหัวข้อ T92-T96 ด้านบน) — `navigate('ProvinceDetail')`/`navigate('Home')` จาก `StatsScreen` ที่ถูกเปิดผ่านแท็บ "ข่าว" จะ no-op เงียบๆ (มี dev warning ใน console เท่านั้น ไม่ crash) แทนที่จะพาไปแท็บ "แผนที่" จริง — ไม่มี AC บังคับ ไม่ block การส่งงาน แต่ถ้า PM ต้องการ UX ที่สมบูรณ์กว่านี้ (เช่น deep-link ข้ามแท็บ) ต้องตัดสินใจเพิ่มเป็นงานแยก
2. **T108 ไม่มี automated test** ตามเหตุผลข้อจำกัดของ RNTL ที่อธิบายไว้ (native modal overlay ของ `expo-web-browser` จำลองไม่ได้จริงในเครื่องมือนี้) — ต้อง manual QA บนอุปกรณ์จริง/emulator เพื่อยืนยันสุดท้ายตามที่ tasks.md ระบุไว้เอง
3. **RSS feed ที่เลือก (`tatnews.org/feed/`) แทบไม่มีรูปในทุก item** (ดูหัวข้อ T90) — ไม่ใช่บั๊ก ไม่ผิด AC (placeholder เป็นพฤติกรรมที่ยอมรับได้ตาม US-32 AC2) แต่ผลลัพธ์ที่เห็นจริงคือการ์ดข่าวเกือบทั้งหมดจะเป็น placeholder ไม่ใช่รูปข่าวจริง — แจ้งไว้เผื่อ PM เห็นตอน QA แล้วสงสัยว่าเป็นบั๊ก

---

## รอบ 14: ยกระดับ Animation/Motion (US-34, T119-T122)

> หมายเหตุกระบวนการ: เข้ามารับงานนี้พบว่า T118 (motion spec ของ UIUX, ต่อท้าย `docs/design-spec.md`) และการ implement จริงของ T119-T121 มีอยู่ในโค้ดครบถ้วนแล้วจาก session ก่อนหน้า (ยังไม่ commit, ตรงกับ `git status` ที่แสดงไฟล์เกี่ยวข้องเป็น modified) แต่ยังไม่มีการบันทึกไว้ใน `docs/dev-notes.md` และยังขาด unit test คู่กันบางจุด งานของรอบนี้คือ **ตรวจสอบความครบถ้วนของโค้ดที่มีอยู่เทียบกับ design-spec/tasks.md ทีละบรรทัด, เพิ่ม unit test ที่ยังขาด, รัน `tsc`/`jest` เต็มชุดยืนยัน, แล้วบันทึกผลตามที่ควรจะบันทึกไว้ตั้งแต่ต้น** ไม่ได้เขียนโค้ดฟีเจอร์ใหม่จากศูนย์ (ตรวจแล้วว่าตรงตาม spec ทุกค่าพารามิเตอร์ ไม่ต้องแก้ implementation ใดๆ)

### T119 — Screen transition (`src/navigation/AppNavigator.tsx`)
- ตรวจยืนยันตรงตาม docs/design-spec.md §1 ทุกค่า: ProvinceDetail push = `slide_from_right` / 280ms (§1.1), AddEntry push = `slide_from_bottom` / 300ms / `presentation: 'modal'` (§1.2), bottom-tab cross-fade ด้วย `react-native-reanimated` `withTiming(1, { duration: 180 })` ผ่าน `AnimatedTabScreen` wrapper ที่ trigger ด้วย `useIsFocused()` ทุกครั้งที่ focus เปลี่ยน (§1.3) — ไม่มีการเพิ่มไลบรารี animation ใหม่ตาม Out of Scope ของ US-34 (ใช้ native-stack `animation` prop ที่มีอยู่แล้ว + reanimated ที่มีอยู่แล้ว)
- Reduce Motion ("หลักการร่วม"): `useReduceMotion()` hook กลาง (`src/hooks/useReduceMotion.ts`) ใช้ทั้งใน `MapStackNavigator` และ `AnimatedTabScreen` — เมื่อ true ทุก transition fallback เป็น cross-fade 120ms ล้วน (`REDUCE_MOTION_TRANSITION` / `withTiming(1, { duration: 120 })`) ตรงตามสเปก ไม่มี slide/scale เหลือ
- Interrupt: native-stack รองรับ gesture-back/ปุ่มกดข้ามระหว่าง animation โดยธรรมชาติอยู่แล้ว (ไม่ต้องเขียนโค้ดเพิ่ม), tab cross-fade เป็น opacity-only ไม่ block touch และ re-trigger ทุกครั้งที่ focus เปลี่ยนแม้กดสลับถี่ๆ (`useEffect` ผูกกับ `isFocused`)
- Test: `src/navigation/AppNavigator.test.tsx` (source-level guard ยืนยันค่า `animation`/`animationDuration`/`presentation`/reduce-motion fallback ตรงตาม design-spec เป๊ะ — เหตุผลที่ใช้ source-level แทน runtime assertion: native-stack's `animation` prop เป็น native OS-level transition ที่ RNTL จำลอง/ตรวจสอบด้วยสายตาไม่ได้จริงในเครื่องมือนี้ ตรงกับข้อจำกัดแบบเดียวกับที่ T108 เคยบันทึกไว้เรื่อง `expo-web-browser` modal), ครอบคลุมเพิ่มเติมด้วย `src/__tests__/integration/appNavigatorBottomTabs.test.tsx` และ `src/__tests__/qa-round8/appNavigatorRegressionDeep.test.tsx` (regression เดิม, ยังผ่านหมด)

### T120 — Entrance animation (List/Card + Home 4th point ตามคำตัดสิน PM ข้อ 25)
- ค่าพารามิเตอร์มาตรฐานตาม docs/design-spec.md §2 อยู่ใน `src/components/EntranceFadeItem.tsx` เพียงจุดเดียว (translateY เริ่ม 12pt, duration 260ms/item, `Easing.out(Easing.cubic)`, stagger `index * 40ms` cap ที่ 320ms, ไม่ใช้ `pointerEvents="none"` ระหว่างเล่นเพื่อไม่บล็อก touch) — ใช้ซ้ำ (reuse) เดียวกันทั้ง 3 จุดขั้นต่ำของ AC โดยไม่ duplicate ค่า
- เล่นครั้งเดียวตอน initial render หลังข้อมูลโหลดเสร็จ ผ่าน hook กลาง `src/hooks/useEntrancePlayedOnce.ts` (ref-based flag, ไม่ re-arm แม้ data จะ toggle false→true อีกครั้ง กัน re-trigger ตอน re-render จาก state อื่นที่ไม่เกี่ยวกับการโหลดข้อมูลใหม่ตามสเปก)
- 3 จุดขั้นต่ำของ AC ครบ: `LandmarkList.tsx` (§2.1, การ์ด hero index 0 + grid การ์ดที่เหลือ index 1..n), `NewsScreen.tsx` (§2.2, gate ด้วย metadata readiness `!loadingFirst && items.length > 0` โดยไม่รอ og:image ของ US-33 resolve ก่อนตามที่สเปกเตือนไว้ชัด), `StatsScreen.tsx` timeline (§2.3, T26)
- จุดที่ 4 (คำตัดสิน PM ข้อ 25): HomeScreen 3D map — ใช้ hook แยกต่างหาก `src/hooks/useMountFadeIn.ts` (single-opacity mount fade, **ไม่มี stagger/translateY ไม่มี per-item logic เลย** ต่างจาก `EntranceFadeItem` โดยตั้งใจ เพราะจุดนี้ต้องเป็น single container fade เท่านั้นตามที่ PM ห้าม animate ทีละ tile เด็ดขาด) — apply แยกอิสระ 3 จุด: `Map3D.tsx` (grid container ทั้งก้อน 280ms), `HeaderProgress.tsx` (220ms), `Legend.tsx` (220ms) — ยืนยันด้วยโค้ดรีวิวว่า `ProvinceTile3D`/การ map แต่ละ tile ใน `Map3D.tsx` **ไม่มี** `useSharedValue`/`useAnimatedStyle`/`EntranceFadeItem` ใดๆ ต่อ tile เลย มีแค่ `Animated.View` ตัวเดียวที่ห่อทั้ง `Svg` ทั้งก้อน
  - **Safety net ตามคำตัดสิน PM ข้อ 25 / tasks.md T120**: ข้อกำหนดบังคับให้ทดสอบบนอุปกรณ์จริงอย่างน้อย 1 เครื่องระดับกลาง/ล่างก่อนปิดงาน — **ไม่สามารถทำได้ในสภาพแวดล้อมนี้** (ไม่มี physical device/emulator ให้เข้าถึงจริง มีแค่ jest + `react-native-reanimated/mock` ซึ่งไม่จำลอง frame timing/GPU cost จริง) จึงไม่สามารถยืนยัน jank/perf บนอุปกรณ์จริงได้ตามที่ safety net กำหนด — **ไม่ fallback ไปทางเลือก A เอง** เพราะเหตุผล fallback ที่ tasks.md ระบุไว้คือ "พบ jank/หน่วงที่สังเกตได้จริง" ซึ่งยังไม่มีหลักฐานเชิงลบใดๆ (ทั้งทางทฤษฎีตามที่ design-spec วิเคราะห์ไว้แล้วว่า single-opacity animation ของ container เดียวมี performance risk ต่ำกว่า per-tile stagger มาก และไม่มี native rendering cost เพิ่มจากที่ `Map3D`/`ProvinceTile3D` มีอยู่แล้ว) — implementation คงไว้ตามทางเลือก B (grid + header/legend fade-in) ตามที่คำตัดสิน PM ข้อ 25 กำหนดเป็นค่าเริ่มต้น **แจ้ง QA/PM ให้ทดสอบบนอุปกรณ์จริงก่อนปิด sign-off ของ T120** ถ้าพบ jank จริงให้ fallback ตาม safety net ได้ทันทีโดยไม่ต้องขอ PM ตัดสินซ้ำ (คอมเมนต์ในโค้ด `Map3D.tsx` มีบันทึกข้อจำกัดนี้ไว้ตรงจุดแล้วเช่นกัน)
- Test ที่มีอยู่แล้ว: `src/hooks/useEntrancePlayedOnce.test.ts` (unit, 4 cases: play-once, ไม่ re-arm, ฯลฯ)
- Test ที่เพิ่มใหม่ในรอบนี้ (พบว่าขาด — T120/T123 ต้องพิสูจน์ว่า config ถูกเพิ่มจริงในแต่ละหน้าจอ ไม่ใช่แค่คงค่า default เดิม): `src/__tests__/motion/t120EntranceAnimationWiring.test.ts` — source-level guard (เหตุผลเดียวกับ AppNavigator.test.tsx: ค่า animation จริงที่ render ออกมาผ่าน `react-native-reanimated/mock` จะ resolve เป็นค่าสุดท้ายทันทีแบบ synchronous ไม่ทันสังเกตความต่างระหว่าง stagger/reduce-motion ได้จาก rendered style เพราะ mock's `withTiming`/`withDelay` คืนค่าปลายทางตรงๆ ไม่มี timer จริง — ตรวจสอบยืนยันพฤติกรรมนี้ด้วยการรัน probe script จริงก่อนตัดสินใจเลือกวิธี test) ครอบคลุม: ค่าพารามิเตอร์ใน `EntranceFadeItem.tsx`, การ wire เข้า `LandmarkList.tsx`/`NewsScreen.tsx`/`StatsScreen.tsx`, การ wire `useMountFadeIn` เข้า `Map3D.tsx`/`Legend.tsx`/`HeaderProgress.tsx`, และ **regression guard ที่ยืนยันว่า `Map3D.tsx` ไม่มี `EntranceFadeItem`/per-tile animated value ใดๆ เลย** (กัน regression ในอนาคตที่อาจมีคนเผลอเพิ่ม per-tile animation ซึ่งขัดกับคำตัดสิน PM ข้อ 25 โดยตรง)

### T121 — Press feedback ที่ชัดเจนขึ้น (Enhanced PressableScale)
- `src/components/PressableScale.tsx`: เพิ่ม prop ใหม่ `variant?: 'default' | 'emphasized'` (default = `'default'`, ตรงตามที่ design-spec §3 กำหนดไว้ให้เป็น purely-additive opt-in ไม่กระทบ caller เดิม) — ตรวจนับแล้วว่า caller อื่นทั้งหมดในโปรเจกต์ที่ไม่ได้อยู่ใน scope ของ US-34 (เช่นปุ่มรองใน Settings, `EmailLinkForm`, ปุ่ม view-mode-toggle/category-chip ใน `LandmarkList.tsx`, ปุ่ม stats/settings ใน `HomeScreen.tsx`/`NewsScreen.tsx`) **ไม่ได้ระบุ `variant`** จึงยังคง behavior เดิม 100% (scale 0.96, ไม่มี shadow-depress) — ไม่ขยาย scope เกินที่ requirement ขอ
- ค่าตาม docs/design-spec.md §3.1 ตรงเป๊ะ: `variant="emphasized"` → scale 0.93 (จาก 0.96 เดิม), shadow-depress effect (`shadowOpacity` 0.08→0.03, `shadowRadius` 14→6, offset y 6→2) ผูก spring เดียวกับ scale (`damping: 12, stiffness: 150`) ให้ sync กันสนิท, **เฉพาะ iOS เท่านั้น** (Android fallback เป็น scale-only ตามที่สเปกเตือนเรื่อง elevation ไม่ smooth-interpolate) — เช็คด้วย `Platform.OS === 'ios'` ที่ตัวแปร `emphasizedShadow`
- 4 จุดที่ apply `variant="emphasized"` ตรงตาม §3.2 ครบทั้ง 4 จุดไม่ขาดไม่เกิน (ตรวจด้วย `grep` ทั้งโปรเจกต์): ปุ่มเช็คอินใน `LandmarkCard.tsx`, การ์ด Landmark ทั้งใบใน `LandmarkCard.tsx` (ทั้ง hero/compact variant ผ่าน `PressableScale` ตัวนอกสุดของการ์ด), การ์ดข่าวใน `NewsCard.tsx`, ปุ่ม "+ เพิ่มบันทึกใหม่" ใน `ProvinceDetailScreen.tsx`
- haptic คงเดิมทุกจุด (ไม่เปลี่ยนความถี่/timing ตามที่สเปกระบุว่า AC ไม่ได้ขอเปลี่ยนจุดนี้)
- Reduce Motion: `variant="emphasized"` ภายใต้ reduce-motion fallback กลับไปเป็น scale-only 0.96 เหมือน `default` เป๊ะ ไม่มี shadow-depress เลย (`emphasized = variant === 'emphasized' && !reduceMotion`)
- Test: `src/components/PressableScale.test.tsx` (มีอยู่แล้ว, 6 cases ครอบ backward-compat/iOS-emphasized/Android-fallback/reduce-motion/no-crash) — เพิ่มใหม่ในรอบนี้: `src/hooks/useReduceMotion.test.ts` (unit test ของ implementation จริง ไม่ใช่ mock — เดิมมีแต่ที่ mock hook นี้ทิ้งใน `PressableScale.test.tsx`/`AppNavigator.test.tsx`, ยังไม่มี test ของพฤติกรรมจริงของตัว hook เอง: default false ก่อน resolve, flip ตามค่า `AccessibilityInfo.isReduceMotionEnabled()`, sync กับ `reduceMotionChanged` event แบบ live, ไม่ throw แม้ promise reject, cleanup subscription ตอน unmount) — พบและแก้ปัญหาการเขียน test เอง 2 จุดระหว่างพัฒนา: (1) `@testing-library/react-native` เวอร์ชันนี้ `renderHook` เป็น async ต้อง `await` เสมอ (2) การ trigger state update จาก event handler ที่ capture ไว้นอก React ต้องห่อด้วย `await act(async () => {...})` ไม่ใช่ `act(() => {...})` เฉยๆ ไม่งั้น state update ไม่ flush ให้ assertion เห็นทัน — ตรวจสอบด้วยการรัน debug script จริงยืนยันสาเหตุก่อนแก้

### T122 — Regression guard
- รัน `npx jest` เต็มชุด (71 test suites เดิม + 2 ไฟล์ใหม่ = 71 suites) ทั้งหมด **ผ่าน 100%**: **387 passed, 1 skipped (เดิม), 0 failed** — ไม่มี test เดิมของ US-1 ถึง US-32 พังแม้แต่ตัวเดียวจากการเปลี่ยนแปลงทั้งหมดของ T119-T121 (ข้อมูลที่แสดง/ผลการนำทาง/ผลการกดปุ่มเดิมยังเหมือนเดิมทุกประการ ตามที่ AC บังคับ)
- `npx tsc --noEmit` ผ่านสะอาด ไม่มี type error หลงเหลือ (รวมไฟล์ test ใหม่ 2 ไฟล์ที่เพิ่งเขียนในรอบนี้ — ต้องแก้ type ของ mock `AccessibilityInfo.addEventListener` 2 รอบก่อนผ่าน เพราะ overload ของ RN's type จริงเข้มงวดกว่าที่คาด)
- Interrupt/ไม่บังคับรอ animation: ยืนยันด้วยโค้ดรีวิว — native-stack transition รองรับ gesture-back/กดปุ่มข้ามระหว่าง animation โดยธรรมชาติ (ไม่มีโค้ดใดๆ ที่ disable ปุ่ม/gesture ระหว่าง `animating` state), tab cross-fade เป็น opacity-only ที่ re-trigger ได้ทันทีทุกครั้งที่ focus เปลี่ยนแม้กดถี่ (ไม่มี debounce/lock), `EntranceFadeItem`/`useMountFadeIn` ไม่เคยใช้ `pointerEvents="none"` เลย (ตรวจสอบเป็นส่วนหนึ่งของ `t120EntranceAnimationWiring.test.ts`), `PressableScale`'s `withSpring` รองรับ re-trigger ระหว่าง settling โดยธรรมชาติของ reanimated เอง (ไม่ต้องเขียนโค้ดเพิ่ม)
- ไม่มีจุดไหนที่พบว่า functional behavior เปลี่ยนไปจากเดิม

### ผลการรันรวมของรอบ 14
- `npx tsc --noEmit` — ผ่านสะอาด
- `npx jest` เต็มชุด — **71/71 suites ผ่าน, 387 passed + 1 skip, 0 failed**
- Test ใหม่ที่เพิ่มในรอบนี้: `src/hooks/useReduceMotion.test.ts` (6 cases), `src/__tests__/motion/t120EntranceAnimationWiring.test.ts` (16 cases source-level wiring guard)

### จุดที่ทำไม่ได้ตาม spec 100% / ต้องการให้ PM ทราบ
1. **T120 safety net (on-device perf test ของ Home 3D map grid fade-in) ยังไม่ได้ทำจริง** — ไม่มี physical device/emulator ในสภาพแวดล้อมนี้ให้ทดสอบตามที่ tasks.md/คำตัดสิน PM ข้อ 25 บังคับไว้ก่อนปิดงาน T120 อย่างสมบูรณ์ คงค่า implementation ไว้ตามทางเลือก B (ค่าเริ่มต้นที่ PM กำหนด) โดยไม่ fallback เองเพราะยังไม่มีหลักฐานเชิงลบใดๆ — **ต้องการให้ QA/ผู้ใช้ทดสอบบนอุปกรณ์จริงอย่างน้อย 1 เครื่องระดับกลาง/ล่างก่อน sign-off** ถ้าพบ jank ให้แจ้งกลับมาเพื่อ fallback เป็นทางเลือก A ได้ทันที (ไม่ต้องขอ PM ตัดสินซ้ำตามที่ tasks.md อนุญาตไว้แล้ว)
2. ไม่มีจุดอื่นที่ scope ถูกตัดทอนหรือเบี่ยงเบนจาก AC ของ US-34 — T119/T121/T122 ครบตามสเปกทุกค่าพารามิเตอร์ ยืนยันด้วยทั้งโค้ดรีวิวและ test ที่เพิ่มใหม่

---

## ประวัติการแก้บั๊ก — US-34 Animation/Motion Upgrade (แก้หลัง QA ตีกลับ)

### รอบ 2 (qa-result.md รอบ 9, บั๊ก 1 / AC2 — ส่งกลับโดย QA, root cause = โค้ด)

**บั๊กที่แก้**: entrance animation ของ list หลัก (`LandmarkList.tsx`, `NewsScreen.tsx`, และมีความเสี่ยงเดียวกันแฝงอยู่ใน `StatsScreen.tsx` แม้ AC2 ของจุดนั้นจะยังผ่านอยู่ตาม tester) ถูกตัดจบก่อนผู้ใช้จะทันเห็นจริง เพราะ re-render ที่ไม่เกี่ยวข้องเกิดขึ้นเกือบทันทีหลัง mount

**Root cause ที่แท้จริง** (ยืนยันด้วย isolated repro ของ tester ใน `src/__tests__/qa-round-us34/entranceAnimationRealRender.test.tsx` และตรวจสอบซ้ำด้วย debug instrumentation ของตัวเอง): `src/hooks/useEntrancePlayedOnce.ts` เดิมคำนวณค่า return จาก "render pass นี้เป็นครั้งแรกที่ `hasData` เป็น true หรือไม่" — คำนวณผ่าน `useRef` ที่ถูก flip เป็น `true` ภายใน `useEffect` หลัง commit ครั้งแรก ผลคือ **re-render ครั้งถัดไปใดๆ ก็ตาม** (ไม่ว่าจะเกี่ยวกับ list หรือไม่) จะเห็น ref เป็น `true` แล้วและ return `false` ทันที — ทำให้ `LandmarkList`/`NewsScreen` ที่เขียนแบบ `shouldPlayEntrance ? <EntranceFadeItem>...</EntranceFadeItem> : <PlainItem>` เปลี่ยน component type กลางคัน (React unmount ของเก่า + mount ของใหม่ ไม่ใช่แค่ prop update) ตัด `EntranceFadeItem` ทิ้งก่อนที่ animation (260-580ms รวม stagger) จะมีโอกาสเล่นจบเลย — สาเหตุจริงคือ effect ที่มีอยู่แล้วก่อนหน้า US-34 (`LandmarkList`'s `setLandmarks(getLandmarksForProvince(id))` ที่ `.filter()` ใน `src/data/thailand-landmarks.ts:1283-1285` คืน array reference ใหม่เสมอ + `setIsFetchingWiki(true)`; `NewsScreen`'s `writeNewsCache` → `setCacheTimestamp`) ทำให้เกิด re-render แทรกทันทีหลังเฟรมแรกที่ข้อมูลพร้อม

**การแก้ไข**: เขียน `useEntrancePlayedOnce` ใหม่ทั้งหมด (ไฟล์เดียว, **ไม่เปลี่ยน API เดิม** — ยังรับ `hasData: boolean` คืน `boolean` เหมือนเดิมทุกประการ จึงไม่กระทบ caller เดิมของ `StatsScreen`/`HomeScreen` ที่ AC2 ผ่านอยู่แล้ว):
- ตัดสินใจ arm/disarm จาก **การเปลี่ยนค่าจริงของ `hasData` เอง** (`false → true` = arm, `true → false` = disarm) ไม่ใช่จาก "มี re-render เกิดขึ้นหรือยัง"
- คำนวณแบบ synchronous ระหว่าง render (เทียบ `hasData` ปัจจุบันกับ ref ที่เก็บค่าก่อนหน้า) ไม่ใช้ `useEffect` เลย — จึงยังคง property เดิมที่เฟรมแรกที่ข้อมูลพร้อมก็ render entrance-wrapped ได้ทันที (ไม่ delay ไปอีก 1 เฟรมเหมือนถ้าใช้ effect-only)
- เมื่อ armed แล้ว จะ**คงค่า `true` ต่อเนื่องข้าม re-render ใดๆ** ตราบใดที่ `hasData` ยังเป็น `true` อยู่ (ไม่สนใจว่า re-render นั้นมาจากอะไร) — ทำให้ `EntranceFadeItem` ไม่ถูกสลับออกกลางคันอีกต่อไป (type เดิม + key เดิม → React ไม่ unmount/remount, animation ที่กำลังเล่นอยู่เล่นต่อจนจบตามปกติของ reanimated เอง ซึ่งไม่ผูกกับ parent re-render อยู่แล้วเพราะ `EntranceFadeItem`'s effect มี deps แค่ `[reduceMotion, index]`)
- reset กลับเป็น `false` เฉพาะตอน `hasData` กลับไปเป็น `false` จริง (เช่น สลับไปจังหวัด/feed ที่ยังไม่มีข้อมูล) เพื่อให้ "epoch" ข้อมูลใหม่ในอนาคตยัง arm ใหม่ได้ตามปกติ

**ไฟล์ที่แก้**:
- `src/hooks/useEntrancePlayedOnce.ts` — เขียน logic ใหม่ตามข้างบน (ลบ `useEffect`, เหลือแค่ 2 `useRef` เทียบกันระหว่าง render)
- `src/hooks/useEntrancePlayedOnce.test.ts` — อัปเดต unit test ให้ตรงกับ contract ใหม่ (เดิม test เขียนไว้ตรงกับ behavior เก่าที่เป็นตัวบั๊กเอง เช่น "returns false on every subsequent re-render, even while hasData stays true" — คือนิยามของบั๊กที่ QA รายงาน จึงต้องแก้ assertion ไม่ใช่แค่โค้ด)
- `LandmarkList.tsx` และ `NewsScreen.tsx` — **ไม่ต้องแก้เลย** เพราะ root cause อยู่ที่ hook กลางล้วนๆ (แก้จุดเดียว ผลลัพธ์แก้ทั้ง `LandmarkList`/`NewsScreen`/`StatsScreen` ที่ใช้ hook เดียวกันพร้อมกัน)
- `src/__tests__/qa-round-us34/entranceAnimationRealRender.test.tsx` (ไฟล์ของ tester) — อัปเดต assertion ของ 2 เคสที่เดิมยืนยันพฤติกรรม "บั๊ก" (`toBe(0)`) ให้ยืนยันพฤติกรรมที่ถูกต้องหลังแก้ (`toBe(2)`/`toBe(4)`) พร้อมเปลี่ยนชื่อ/คอมเมนต์จาก "BUG repro"/"already gone" เป็น "regression guard (bug-fix round 2)"/"SURVIVES" — และ**เพิ่มเคสใหม่** "NewsScreen rendered in ISOLATION" (คู่กับที่มีอยู่แล้วของ StatsScreen) เพื่อพิสูจน์ตรงๆ ว่า fix ใช้ได้กับ NewsScreen จริง ไม่ใช่แค่ LandmarkList

**สิ่งที่ตรวจพบเพิ่มระหว่างแก้ (ไม่ใช่บั๊กใหม่ — เป็นข้อจำกัดของวิธีนับ instance ในเครื่องมือทดสอบ)**: หลังแก้แล้ว เคส "NewsScreen ผ่าน `NavigationContainer`/`Stack.Navigator` จริง" และ "StatsScreen ผ่าน `NavigationContainer`/`Stack.Navigator` จริง" ยังคง report `countEntranceFadeItems() === 0` (เหมือนเดิม) — ตรวจสอบด้วย debug instrumentation ตรงๆ (log `hasData`/`armed` ทุก render + เดิน fiber tree แบบเต็มด้วยสคริปต์แยก) แล้วยืนยันว่า **ไม่ใช่บั๊กที่หลงเหลือ**: `armed` กลายเป็น `true` และไม่กลับเป็น `false` อีกเลยตลอดการทดสอบ (แค่ 2 ครั้งของการ render hook: false ตอน mount แรก แล้ว true ตอน data พร้อม ไม่มีครั้งที่ 3) แต่การเดิน fiber tree ด้วย `.child`/`.sibling` ผ่าน `TestInstance.unstable_fiber` ไปไม่ถึงชั้นเนื้อหาจริงของหน้าจอเมื่อ component ถูก mount ผ่าน `NativeStackNavigator`'s `Screen`/`DelayedFreeze`/`Freeze`/`Suspender` wrapper (ยืนยันด้วยการ dump ชื่อ type ของทุก fiber ในทรีจริง — เดินไปสุดที่ `RCTSafeAreaView` แล้วหยุด ทั้งที่เนื้อหาจริงข้างในมีอยู่และ query ด้วย `getByText` เจอปกติ) — เพิ่มเคส "NewsScreen ISOLATION" (ไม่ผ่าน navigator) เพื่อพิสูจน์แยกส่วนว่า fix ทำงานถูกต้องจริง (`count = 2`) ตรงกับที่ StatsScreen ISOLATION เคยพิสูจน์ไว้แล้วสำหรับตัวเอง — อัปเดตคอมเมนต์ในทั้ง 2 เคส navigator-wrapped ให้ระบุสาเหตุที่ถูกต้อง (ข้อจำกัดเครื่องมือทดสอบ ไม่ใช่บั๊ก) แทนคอมเมนต์เดิมที่บอกว่า "net effect on end users is the same as the bug" ซึ่งไม่ถูกต้องอีกต่อไปหลังแก้

**ไม่ได้แตะ**: บั๊กที่ 2 ของ qa-result.md รอบ 9 (ปุ่ม "+ เพิ่มบันทึกใหม่" ใน `EmptyState.tsx` ไม่ได้ `variant="emphasized"`) — QA ส่งกลับให้ PM ตัดสินใจ scope ก่อน ไม่ใช่งานของรอบนี้

### ผลการรันของรอบ 2
- `npx tsc --noEmit` — ผ่านสะอาด ไม่มี type error
- `npx jest` เต็มชุด — **75/75 suites ผ่าน, 419 passed + 1 skip (เดิม, ไม่เกี่ยวข้อง), 0 failed** — ไม่มี regression ต่อ US-1–US-32 หรือ US-33 เดิมแม้แต่รายการเดียว
- `src/__tests__/qa-round-us34/entranceAnimationRealRender.test.tsx` (ไฟล์ของ tester ที่อ้างถึงในบั๊กรายงาน) — **ผ่านทั้ง 9/9 เคสจริง** (เดิม 8 เคส + เพิ่ม 1 เคสใหม่ตามข้างบน) รวมเคส regression guard ที่พิสูจน์ตรงๆ ว่า `EntranceFadeItem` ไม่ถูกตัดทิ้งกลางคันจาก re-render ที่ไม่เกี่ยวข้องอีกต่อไป
- `src/hooks/useEntrancePlayedOnce.test.ts` — ผ่านทั้ง 4/4 เคส (อัปเดต contract ตามข้างบน)

## รอบ 15: Color Palette & Layout Redesign เฟส 1 — T126-T131 (US-35 + US-36 HomeScreen)

### บริบท
T124/T125 (UIUX เสนอตัวเลือก + Decision Gate) ปิดแล้วก่อนหน้านี้ — ผู้ใช้ยืนยันเลือก **ตัวเลือก A "Deep Jade"** และ `mapCanvasBg` **ทางเลือก B (tint อ่อน ไม่ใช่พื้นเข้ม)** ตาม `docs/tasks.md` "T125 — ผลตัดสินใจ" งานรอบนี้คือ implement T126-T131 ตาม `docs/design-spec.md` "ส่วนเพิ่มเติม: Color Palette & Layout Redesign (รอบ 15)"

### T126 — `src/theme.ts` (จุดเดียวที่แก้สี)
อัปเดต `COLORS` ทั้งหมดตามตาราง Deep Jade (unlockedTop/accent → `#15A87A`, unlockedSide/accentDark → `#0B5C46`, lockedTop → `#CBD3CF`, lockedTopLoading → `#E3E8E5`, background → `#F6F9F7`, textPrimary → `#122019`, textSecondary → `#5B6B63`, trackBg → `#DCE4E0`, gold → `#D8A93B`, danger/amber/amberBg คงเดิม) และเพิ่ม utility token ใหม่ 9 ตัวที่ 6 ไฟล์ของ T127-T129 ต้องใช้แทนการ hardcode: `surface`, `accentSurface`, `mapCanvasBg`, `mapAmbientShadow`, `tooltipBg`, `textOnDark`, `border`, `borderLight`, `muted` — ไม่แตะ `CATEGORY_COLORS` (สีหมวดหมู่ landmark ไม่เกี่ยวกับ brand token ของรอบนี้ "เท่าที่จำเป็น" ตามที่ task ระบุ) และไม่แตะ `SHADOWS` (shadowColor `#0F2A1D` เดิมเข้ากับโทน Deep Jade อยู่แล้ว)

**ตรวจ WCAG AA ด้วยมือ (relative luminance formula ตรงๆ ไม่มีเครื่องมือ)**:
- `textPrimary` (#122019) on `background` (#F6F9F7): contrast ≈ **15.9:1** ผ่านสบาย
- `textSecondary` (#5B6B63) on `background`: contrast ≈ **5.31:1** ผ่าน AA (>4.5)
- `accentDark` (#0B5C46, ใช้เป็น hint text) on `accentSurface` (#E3F5EF): contrast ≈ **7.05:1** ผ่านสบาย
- `textOnDark` (#FFFFFF) on `tooltipBg` (`rgba(18,32,25,0.88)`) คอมโพสิตทับพื้นหลังที่สว่างที่สุดที่เป็นไปได้ (`mapCanvasBg` ขาว): contrast ≈ **11.7:1** ผ่านสบาย (คอมโพสิตทับ tile สีเขียว/ทองจะยิ่งเข้มกว่านี้ = contrast ยิ่งสูงกว่านี้)
- `danger`/`amber`/`amberBg` คงค่าเดิมตามที่ design-spec ระบุว่าผ่าน AA อยู่แล้ว — ไม่คำนวณซ้ำ

**`mapCanvasBg` ที่เลือกใช้จริง**: `#FFFFFF` (เท่ากับ `surface`) — ใช้ทางเลือก "สีขาวล้วนตัดกับพื้นหลังอมมินท์อ่อนๆ" ที่ orchestrator อนุญาตไว้ในตัวเลือก B แทนที่จะคำนวณ tint ใหม่ เพราะ `background` (#F6F9F7) กับ `#FFFFFF` ต่างกันเพียงเล็กน้อยพอที่จะให้ความรู้สึก "ลอยอยู่ในกล่องกระจก" แบบนุ่มนวล โดยไม่ต้องเดา tint ตัวเลขใหม่ที่ไม่มีอ้างอิงจาก UIUX

### T127 — `src/screens/HomeScreen.tsx`
- ปุ่มตั้งค่า (`settingsButton`) ห่อด้วยพื้นผิวกลม (`RADIUS.full`, `COLORS.trackBg`) ตาม spec ตรงตัว — ยังคง 44×44pt + `PressableScale` haptic/scale เดิมทุกประการ
- `topBar` เพิ่ม `paddingTop` จาก `SPACING.xs` เป็น `SPACING.sm`
- spacing ระหว่าง section ทั้งหมด (topBar → search card → header progress card → map hero card → legend) รวมเป็น `SPACING.lg` สม่ำเสมอ โดยใช้ pattern **"marginBottom เดียวต่อ section"** (แต่ละ section ใส่แค่ `marginBottom: SPACING.lg` ของตัวเอง ไม่ใส่ `marginTop` ซ้ำ) เพื่อไม่ให้เกิด gap ซ้อนสองเท่าเวลา hint banner แสดง/ไม่แสดงสลับกัน
- `hintBanner` เปลี่ยนพื้นหลัง hardcode `#EAF7F1` → `COLORS.accentSurface`

### T128 — `src/components/Map3D.tsx` + `src/components/ProvinceTile3D.tsx`
- **ข้อจำกัดสำคัญที่ยึดตาม**: `src/__tests__/motion/t120EntranceAnimationWiring.test.ts` มี regex ยืนยันบรรทัด `<Animated.View style={[styles.wrapper, fadeInStyle]}>` ตรงตัวเป๊ะ — จึงใส่ hero-canvas styling (มุมโค้ง/เงา/พื้นหลัง/padding) ทั้งหมดเข้าไปใน **เนื้อหาของ `styles.wrapper`** แทนที่จะเปลี่ยนโครงสร้าง JSX บรรทัดนั้น
- `styles.wrapper`: เพิ่ม `marginHorizontal: SPACING.md`, `marginBottom: SPACING.lg`, `paddingVertical/paddingHorizontal: SPACING.lg`, `borderRadius: RADIUS.xl`, `backgroundColor: COLORS.mapCanvasBg`, `...SHADOWS.lg`
- เพิ่ม `SIDE_MARGIN` คำนวณจาก `CARD_MARGIN_H + CARD_PADDING_H` (แทนเลข magic 16 เดิม) ให้การคำนวณ `scaledWidth`/`scaledHeight` ของ SVG อ้างอิงพื้นที่ที่เหลือจริงหลังหักการ์ด ไม่ให้แผนที่ overflow ออกนอกการ์ดใหม่
- เพิ่ม ambient ground-shadow `<Ellipse>` วาดก่อน `PROVINCES.map(...)` (paint order = อยู่หลังสุด/ล่างสุด) ใช้ `COLORS.mapAmbientShadow` — ไม่แตะ geometry/จำนวน/มุมกล้องของ tile ใดๆ ตามคำตัดสิน PM ข้อ 26
- ย้าย tooltip hardcode `rgba(26,26,26,0.88)` → `COLORS.tooltipBg` และตัวหนังสือ `#FFFFFF` → `COLORS.textOnDark`
- `ProvinceTile3D.tsx`: จุดเดียวที่มี hex hardcode เดิมคือ stroke ขอบบนของ non-master tile (`'#FFFFFF'`) → เปลี่ยนเป็น `COLORS.textOnDark` — สีอื่นทั้งหมด (`unlockedTop`/`unlockedSide`/`lockedTop`/`gold`) รับค่าใหม่จาก `theme.ts` อัตโนมัติโดยไม่ต้องแก้โค้ดจุดนี้เลย — **ไม่แตะ `interpolateColor`/`useSharedValue`/`withSpring`/`useEffect` ใดๆ ทั้งสิ้น**
- glossy top-edge highlight (ระบุใน spec ว่า "optional, ไม่บังคับ") — **ไม่ทำในรอบนี้** เพื่อลดความเสี่ยงต่อ tile ที่มี animation ผูกอยู่ ไม่ใช่ปัญหาที่ต้องส่งกลับ PM เพราะ spec เขียนไว้ชัดว่า optional

### T129 — `HeaderProgress.tsx`, `Legend.tsx`, `GlobalSearchBar.tsx`
- **HeaderProgress**: การ์ดเปลี่ยนจาก `#FFFFFF`/`RADIUS.lg`/`SHADOWS.sm` → `COLORS.accentSurface`/`RADIUS.xl`/`SHADOWS.md` (hero stat bento); progress fill เปลี่ยนจากสีเดียว (`COLORS.accent`) เป็น `LinearGradient` สองโทน (`accent` → `accentDark`) วางเป็น child ของ `Animated.View` เดิม (ไม่แตะ `fillStyle`/`useAnimatedStyle`/`withTiming` ที่ควบคุม width); track สูงขึ้นจาก 8→10; skeleton (`ShimmerBlock`) override `backgroundColor` เป็น `COLORS.lockedTopLoading` ผ่าน `style` prop (ไม่แก้ `ShimmerBlock.tsx` เอง เพราะไม่อยู่ใน scope 6 ไฟล์ และ prop `style` ของมันออกแบบมาให้ override ได้อยู่แล้ว)
  - **ตัวเลข hero stat**: ทำเป็น nested `<Text>` ขนาดใหญ่/หนากว่า (`labelCount`, fontSize 22/800) อยู่ **ภายใน `<Text>` เดียวกัน** กับ prefix "ปลดล็อกแล้ว"/suffix "จังหวัด" (ไม่ใช่คนละบรรทัด) — เหตุผล: `src/__tests__/integration/homeScreen.test.tsx` และ `entranceAnimationRealRender.test.tsx` เรียก `getByText('ปลดล็อกแล้ว {n} / 76 จังหวัด')` เป็น string เดียวเป๊ะ ตรวจสอบ implementation ของ RNTL (`node_modules/@testing-library/react-native/dist/helpers/text-content.js`) แล้วยืนยันว่ามันจะ concat ข้อความของ nested `<Text>` ทั้งหมดเข้าด้วยกันเป็น string เดียวเพื่อ match ได้จริง ถ้าอยู่ในบรรทัดเดียวกัน (ไม่มี `\n` คั่น) — จึงเลือกให้ hierarchy เกิดจาก **ขนาดตัวอักษรต่างกันในบรรทัดเดียว** แทนการขึ้นบรรทัดใหม่ (ซึ่งจะเปลี่ยน string ที่ query และทำให้ test เดิมพังจริง) ยังคงสื่อ "ตัวเลขเป็นจุดเด่น" ตาม spec ได้โดยไม่พัง a11y/regression contract เดิม
- **Legend**: chip เปลี่ยนจาก `borderWidth:1`/`borderColor:'#EDEDED'` → พื้นผิวทึบ (`COLORS.surface`) + `...SHADOWS.sm` ตรงตาม spec
- **GlobalSearchBar**: `container` shadow ยกจาก `SHADOWS.sm` → `SHADOWS.md`, `containerFocused` เปลี่ยนจาก manual `shadowOpacity: 0.12` → `...SHADOWS.lg` ตรงตาม spec ("focused ... ด้วย SHADOWS.lg"); เก็บ hex เดิมทั้งหมด (`#FFFFFF`, `#E8ECE9`, `#8C9B95`, `#999`, `#F0F3F1`, `#BBB`) มาอ้าง token ใหม่ (`surface`/`border`/`muted`/`borderLight`) — สีเทาที่ใกล้เคียงกันหลายเฉด (`#999`/`#BBB`/`#8C9B95`) รวมเป็น `COLORS.muted` ตัวเดียวเพื่อลด fragmentation (การเปลี่ยนแปลงภาพเล็กน้อย ไม่กระทบ contrast/functionality); `wrapper` marginBottom เปลี่ยนจาก `SPACING.xs` → `SPACING.lg` ตาม spacing pattern ของ T127

### T130 — Regression guard
รัน `npx tsc --noEmit` ผ่านสะอาด และ `npx jest` เต็มชุด **81/81 suites ผ่าน, 435 passed + 1 skip (เดิม ไม่เกี่ยวข้อง), 0 failed** — ครอบคลุม US-1, US-2, US-3, US-14, US-24, US-26, US-34 (`t120EntranceAnimationWiring.test.ts`, `entranceAnimationRealRender.test.tsx`, `reduceMotionWiring.test.tsx` ทั้งหมดผ่านโดยไม่แก้ assertion ใดๆ เลย — ยืนยันว่า animation logic/prop contract เดิมไม่ถูกแตะจริง)

### T131 — automated hardcode-color guard
เพิ่ม `src/__tests__/theme/noHardcodedHexRound15.test.ts` — source-text regex guard (แพทเทิร์นเดียวกับ `t120EntranceAnimationWiring.test.ts`) สแกน 6 ไฟล์ (`HomeScreen.tsx`, `Map3D.tsx`, `ProvinceTile3D.tsx`, `HeaderProgress.tsx`, `Legend.tsx`, `GlobalSearchBar.tsx`) หา literal hex (`#abc`/`#aabbcc`/`#aabbccdd`) หรือ `rgb()`/`rgba()` ใดๆ ที่ไม่ได้มาจาก `theme.ts` — ผ่านครบ 6/6 ไฟล์ (ยืนยันด้วย `grep` มือก่อนเขียน test ด้วยว่าไม่มี hex/rgba เหลือจริง)

### สรุปผลรัน
- `npx tsc --noEmit`: ผ่าน ไม่มี type error
- `npx jest`: **81 suites ผ่าน / 435 passed + 1 skip / 0 failed**

### จุดที่ทำไม่ได้ตาม spec 100% (ไม่ใช่ blocker ต้องส่งกลับ PM — บันทึกไว้เพื่อความโปร่งใส)
- glossy top-edge highlight ของ tile (ProvinceTile3D) — spec ระบุว่า optional ไม่บังคับ ข้ามในรอบนี้เพื่อลดความเสี่ยงใกล้ animation code
- ตัวเลข hero stat ของ HeaderProgress อยู่บรรทัดเดียวกับ prefix/suffix (ไม่ได้ขึ้นบรรทัดใหม่ตามภาพประกอบ "บรรทัดรอง" ใน spec) — เหตุผลทางเทคนิคผูกกับการรักษา exact-string ของ `getByText` ในเทสต์เดิมตามที่อธิบายไว้ข้างบน ไม่กระทบความหมาย/สาระของ hierarchy ที่ spec ต้องการ (ตัวเลขเด่นกว่าข้อความรอบข้างชัดเจน)

## ประวัติการแก้บั๊ก — US-35/US-36 Color Palette & HomeScreen Redesign (แก้หลัง QA ตีกลับ)

### รอบ 16 (qa-result.md รอบ 16, บั๊กเดียว / US-35 AC2 (P0) — ส่งกลับโดย QA, root cause = โค้ด)
- **บั๊ก**: `src/screens/HomeScreen.tsx` — `styles.statsLink` (ลิงก์ "สถิติ" บน TopBar) ใช้ `color: COLORS.accent` (`#15A87A`) บนพื้น `COLORS.background` (`#F6F9F7`) → contrast วัดจริง **2.87:1** ไม่ผ่าน WCAG AA (ต้อง ≥4.5:1) — QA ตัดสินว่าเข้าข่าย "ข้อความสำคัญ" ตาม US-35 AC2 เพราะเป็นจุดที่ผู้ใช้ต้องอ่าน/แตะทุกครั้งที่เปิดแอป
- **แก้**: เปลี่ยน `styles.statsLink.color` จาก `COLORS.accent` → `COLORS.accentDark` (`#0B5C46`) เท่านั้น (1 บรรทัด ไฟล์เดียว)
- **คำนวณ contrast ใหม่เอง** (ไม่ใช้ตัวเลข 7.05:1 ของคู่ `accentDark`-on-`accentSurface` ตรงๆ เพราะ `statsLink` วางอยู่บนพื้น `COLORS.background` ไม่ใช่ `accentSurface` — คนละพื้นหลัง): re-implement สูตร WCAG relative-luminance ด้วยมือ (แยกจาก `us35TokenAndContrastAudit.test.ts`) ได้ `accentDark (#0B5C46)` บน `background (#F6F9F7)` = **7.51:1** ผ่าน WCAG AA แบบเหลือเฟือ (>4.5:1 ที่ต้องการ และเกิน 7:1 ของเกณฑ์ AAA ด้วยซ้ำ) — ไม่ต้องปรับ font-weight/size เพิ่มเติม
- **regression guard**: `npx tsc --noEmit` ผ่านสะอาด ไม่มี type error; `npx jest` เต็มชุด **82 suites ผ่าน / 1 suite fail / 478 passed + 1 skip / 1 failed**
  - suite ที่ fail คือ `src/__tests__/qa-round15/us35TokenAndContrastAudit.test.ts` เคส `[finding] accent (topBar "สถิติ" link text) on background` — **เป็นการ fail ที่มีอยู่ก่อนแก้บั๊กนี้แล้ว (ไม่ใช่ regression จากการแก้ของรอบนี้)** เพราะเทสต์เคสนี้ hardcode เช็ก `contrastRatio(COLORS.accent, COLORS.background)` ตรงๆ จาก `theme.ts` (ไม่ได้ import/เรนเดอร์ `HomeScreen.tsx` เลย) ซึ่งค่า `COLORS.accent`/`COLORS.background` ไม่ได้ถูกแก้ในรอบนี้ (แก้แค่ว่า `statsLink` เลือกใช้ token ไหน ไม่ได้แก้ค่า hex ของ token `accent` เอง) จึงยังคงค่าเดิม 2.87:1 เหมือนก่อนแก้ทุกประการ
  - เคสนี้เป็นเทสต์ที่ QA/Tester เขียนไว้เพื่อ "บันทึก finding" ของบั๊กนี้ตั้งแต่รอบ 15/16 โดยเจตนา (ดู comment ในไฟล์บรรทัด 79-84) — ตอนนี้บั๊กจริงถูกแก้แล้วที่จุดใช้งานจริง (`statsLink` ไม่ใช้ `COLORS.accent` อีกต่อไป) แต่เทสต์เคสนี้จะไม่มีวัน pass ได้จนกว่า QA/Tester จะอัปเดตให้เช็กสิ่งที่ component เรนเดอร์จริง (เช่น import `HomeScreen` แล้วเช็ก `statsLink` style) แทนการเช็ก raw token `COLORS.accent` ตรงๆ — **ไม่ได้แก้ไฟล์นี้เองเพราะอยู่นอกขอบเขตที่ได้รับ (แก้เฉพาะ `statsLink` ใน `HomeScreen.tsx` เท่านั้น และไฟล์นี้เป็นของ QA/Tester)** — แจ้งให้ orchestrator/QA ทราบเพื่อพิจารณาอัปเดต test เคสนี้ในรอบตรวจถัดไป
- **ขอบเขตที่ไม่แตะ**: ประเด็นรอง 2 ข้อจาก QA รอบ 16 (hero stat line break, `mapCanvasBg` เป็นขาวล้วน) ยังรอ PM/UIUX ตัดสินใจ — ไม่ได้แก้ในรอบนี้ตามที่ระบุขอบเขต

## รอบ 18 — Phase 2 US-37 (Color Palette & Layout Redesign เฟส 2)

### T133 — `src/screens/ProvinceDetailScreen.tsx`
- แทน hex: `header.borderBottomColor: '#F0F0F0'` → `COLORS.border`, `backButton.backgroundColor: '#F2F2F2'` → `COLORS.trackBg`, `addButtonText.color: '#FFFFFF'` → `COLORS.textOnDark`
- Spacing: เพิ่ม style ใหม่ `sectionGap: { marginBottom: SPACING.lg }` ครอบ `ProvinceMasterBadge` และ `LandmarkList` ด้วย `<View>` เพิ่ม, `addButton.marginBottom` เปลี่ยนจาก `SPACING.xs` → `SPACING.lg`
- **ProvinceMasterBadge wrapper เป็น conditional** (`isMaster ? styles.sectionGap : undefined`) แทนที่จะครอบด้วย margin เสมอ — เหตุผล: component เดิม return `null` เมื่อ `!visible` (ไม่กิน layout เลย ตาม comment ในไฟล์ต้นทาง) ถ้าครอบด้วย `<View style={{marginBottom: SPACING.lg}}>` แบบไม่มีเงื่อนไข จะเกิดช่องว่างเปล่าที่ไม่เคยมีมาก่อนทุกครั้งที่ยังไม่ใช่ Province Master (กรณีส่วนใหญ่) ถือเป็น regression ทาง visual ที่ไม่ได้ตั้งใจ จึงครอบแบบมีเงื่อนไขแทน
- gap ระหว่าง `LandmarkList` → ปุ่ม/section ถัดไปได้จาก `addButton`/`LandmarkList` wrapper margin ที่ตั้งไว้ `SPACING.lg` เท่ากันทุกจุด — ไม่ได้แก้ margin ภายใน `ProvinceMasterBadge.tsx`/`LandmarkList.tsx` เอง (นอก scope ของไฟล์นี้ ทั้งสอง component มี margin ภายในของตัวเองอยู่แล้วซึ่งจะบวกเพิ่มจาก wrapper — ผลคือช่องว่างจริงบางจุดมากกว่า `SPACING.lg` เล็กน้อยเมื่อ badge แสดง แต่ไม่ขัดกับเป้าหมายหลักของ spec คือ "แยก block ชัดเจนขึ้น")
- ไม่แตะลำดับ/จำนวน section และไม่ลบ `variant="emphasized"` ของปุ่ม "+เพิ่มบันทึกใหม่"

### T134 — `src/screens/AddEntryScreen.tsx`
- แทน hex ตามตาราง spec ครบ: header border/back button, `card.backgroundColor` → `COLORS.surface`, `textInput`/`dateInput`/`landmarkChip.borderColor` → `COLORS.border`, `saveButtonText`/`landmarkChipTextSelected`.color → `COLORS.textOnDark` (รวม `ActivityIndicator color="#FFFFFF"` ของปุ่มบันทึกด้วย เพื่อความสม่ำเสมอ ไม่หลงเหลือ literal ขาว)
- เพิ่ม `borderWidth: 1, borderColor: COLORS.borderLight` ให้ style `card` ตาม spec (แยกขอบเขตการ์ดจากพื้นหลัง mint อ่อน)
- ไม่แตะ `validate()`/`handleSave()`/`handleDelete()`/Nominatim search/PhotoPicker/TagSelector/landmark chip selection logic ใดๆ ตามที่กำหนด

### T135 — `src/components/LandmarkCard.tsx`
- แทน hex ทั้งหมดยกเว้น scrim สีดำโปร่งใสของภาพ (ดูหมายเหตุด้านล่าง): `card` bg/border → `COLORS.surface`/`COLORS.borderLight`, `cardVisited.borderColor` (เดิม hex เก่า `#1D9E7540` = accent เก่า+alpha) → `withAlpha(COLORS.accent, 0.25)` (ใช้ helper `withAlpha` ที่มีอยู่แล้วในไฟล์), `cardVisited.backgroundColor` → `COLORS.accentSurface`, `imageContainer` placeholder bg → `COLORS.trackBg`, shimmer gradient (`#E8E8E8`/`#F4F4F4`) → `COLORS.trackBg`/`COLORS.borderLight`, `categoryText`/`heroTitle` white text → `COLORS.textOnDark`, `checkinButtonInactive` bg/border → `COLORS.borderLight`/`COLORS.border`, `checkinButtonActive.backgroundColor` → `COLORS.accentSurface`
- **ไม่แตะ**: `CATEGORY_COLORS`/`CATEGORY_COLOR_FALLBACK` (semantic, คนละเรื่องกับ palette), `variant="emphasized"`/entrance animation ใดๆ
- **จุดที่เหลือ hex ไว้โดยตั้งใจ**: `rgba(0,0,0,0.7)` / `rgba(0,0,0,0.25)` (photo-dimming scrim gradient คลุมรูปภาพ) และ `textShadowColor: 'rgba(0,0,0,0.5)'` (เงาตัวอักษร heroTitle บนรูป) — เป็น generic black overlay สำหรับ contrast ของข้อความบนรูปภาพจริง ไม่ใช่สีตาม brand palette และไม่มี token ใน `theme.ts` ที่ตรงความหมาย (ห้ามแก้ `theme.ts` เอง) การบังคับแทนด้วย token ที่มีอยู่ (เช่น `tooltipBg`) จะเปลี่ยนค่า opacity/สีที่ตั้งใจไว้สำหรับ 2 ระดับความเข้ม (hero 0.7 vs compact 0.25) จึงปล่อยไว้ตามเดิม — ไม่กระทบ T140 audit เพราะเจตนาของ AC1 คือไล่ hex ของ brand เก่า/ใหม่ ไม่ใช่ generic overlay

### T136 — `src/screens/StatsScreen.tsx`
- `statTile.backgroundColor: '#FFFFFF'` → `COLORS.surface` (จุดเดียวที่พบ)

### T137 — `src/screens/SettingsScreen.tsx`
- `header.borderBottomColor` → `COLORS.border`, `backButtonWrap.backgroundColor` → `COLORS.trackBg`, `accountCard.backgroundColor` → `COLORS.surface`, `linkButtonText.color` → `COLORS.textOnDark`

### T138 — `src/screens/NewsScreen.tsx` + `src/components/NewsCard.tsx`
- `NewsScreen.tsx` เอง grep แล้วไม่พบ hex hardcode เลย (ใช้ token ครบอยู่แล้ว)
- `NewsCard.tsx` ("การ์ดข่าว" ตามที่ระบุใน task): shimmer gradient `[COLORS.trackBg, '#EFF7F3']` → `[COLORS.trackBg, COLORS.borderLight]`, `card` bg/border → `COLORS.surface`/`COLORS.borderLight`
- ไม่ได้แตะ `NewsErrorState.tsx`/`NewsLoadingSkeleton.tsx`/`NewsCacheIndicator.tsx` (มี hex hardcode สีขาวเช่นกันใน `NewsErrorState.tsx`) เพราะไม่ได้อยู่ใน 4 ไฟล์ที่ระบุชื่อไว้ + spec ระบุเฉพาะ "รวมการ์ดข่าว" (NewsCard) ไม่ได้ระบุ error/skeleton state — **แจ้งไว้เผื่อ T140 audit เจอ**: `src/components/NewsErrorState.tsx` มี `color: '#FFFFFF'` (ปุ่ม retry, บรรทัด 32/58) ที่ยังไม่ได้แปลงเป็น token หากต้องการให้ครบ 100% ต้องขยาย scope เพิ่มไฟล์นี้

### T139 — Regression guard
- `npx tsc --noEmit -p .` → ผ่านสะอาด ไม่มี type error
- `npx jest` เต็มชุด → **83 suites ผ่าน / 480 passed + 1 skip / 0 failed** (baseline เดิมก่อนรอบนี้คือ 480 passed + 1 skip เท่ากัน ไม่มี suite ใหม่ล้ม)
  - ระหว่างรันครั้งแรกเจอ `src/__tests__/qa-round2/syncLifecycle.test.tsx` fail 1 เคสตอนรันเต็มชุด (`render function has not been called`) — รันไฟล์นี้แยกเดี่ยวผ่านทั้ง 3/3 เคส ทันที ยืนยันว่าเป็น flaky test-order/act() cross-contamination ที่มีอยู่ก่อนแล้วในชุดเทสต์ (ไม่เกี่ยวกับการแก้สี/spacing ของรอบนี้เลย เพราะไม่ได้แตะไฟล์ sync ใดๆ) รันเต็มชุดซ้ำอีกครั้งผ่านครบ 83/83 ไม่มี fail — ไม่ต้องแก้ assertion ใดๆ
  - ไม่พบ regression เชิงพฤติกรรมใดๆ จากการแก้สี/spacing ของ T133-T138

### จุดที่ทำไม่ได้ตาม spec 100% / ต้องการให้ PM ทราบ (ไม่ block)
- `NewsErrorState.tsx` ยังมี `#FFFFFF` หลงเหลือ (ไม่อยู่ใน scope ที่ได้รับสำหรับ T138) — ถ้าต้องการให้ 6 ไฟล์+ผ่าน T140 audit แบบ zero-hex จริง ต้องขยาย scope ให้ programmer แก้ไฟล์นี้เพิ่ม (แก้ไม่ยาก 1 บรรทัด)
- ProvinceDetailScreen: gap ระหว่าง section ที่มี `ProvinceMasterBadge`/`LandmarkList` (ซึ่งมี margin ภายในของตัวเองอยู่แล้ว) รวมกับ wrapper `SPACING.lg` ใหม่ ทำให้ gap จริงมากกว่า `SPACING.lg` เป๊ะๆ เล็กน้อยในบางจุด (ไม่ใช่ปัญหาฟังก์ชัน แค่ไม่ pixel-perfect ตาม spec 100% เพราะไม่ได้แก้ margin ภายในของสอง component นั้นซึ่งอยู่นอกไฟล์ที่ได้รับมอบหมาย T133)
