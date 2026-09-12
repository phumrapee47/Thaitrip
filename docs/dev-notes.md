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
