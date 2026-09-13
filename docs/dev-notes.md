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
