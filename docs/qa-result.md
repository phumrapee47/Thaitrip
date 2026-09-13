# QA Result

## ผลตัดสิน: PASS with notes

## เหตุผล
- **BUG-1 (formatThaiDate UTC offset):** ตรวจสอบโค้ดจริงอิสระที่ `src/utils/derived.ts:89-91` ยืนยันว่าใช้ `getUTCDate()`, `getUTCMonth()`, `getUTCFullYear()` ครบทั้ง 3 จุด ไม่มี local-time getter หลงเหลือเลย — ยืนยันคำอ้างของ programmer/tester ว่าเป็น false positive ของรอบ 3 จริง (ไม่ใช่บั๊กที่มีอยู่ในโค้ดปัจจุบัน) evidence ที่น่าเชื่อถือคือ tester รอบนี้เขียน regression test บังคับ negative-offset timezone จริง 3 กรณี (`America/New_York`, `Pacific/Midway`, `America/Los_Angeles`) ใน `src/utils/derived.test.ts` เพื่อชดเชยข้อจำกัดที่เครื่อง dev เป็น UTC+7 (positive offset) ซึ่งไม่มีทางจับบั๊กแบบนี้ได้เอง — เป็นวิธีตรวจสอบที่เหมาะสมกับปัญหา ไม่ใช่แค่คำยืนยันปากเปล่า
- **Accessibility label mismatch:** ตรวจสอบโค้ดจริงอิสระด้วย grep เอง (ไม่ใช้ค่าจาก dev-notes.md/test-report.md) พบว่า `src/components/LandmarkMap.tsx:69` และ `src/components/LandmarkListItem.tsx:20` มี expression `accessibilityLabel` เหมือนกันทุกตัวอักษร ทั้งฝั่ง "เช็คอินแล้ว" และ "ยังไม่ได้เช็คอิน" — ปิดประเด็น Low severity จากรอบ 3 ได้จริง
- **Regression:** jest เต็มชุดที่ tester รันอิสระได้ 213 total (212 passed, 1 skip เดิม) เพิ่มขึ้นจาก baseline 210 (209 passed + 1 skip) ของรอบ 3 ตรงกับจำนวน regression test ใหม่ 3 เคสของ BUG-1 พอดี ไม่มี fail, ไม่มี test หาย — tsc --noEmit clean เช่นเดิม ไม่มี regression จากการแก้ label ในเทสที่เกี่ยวข้อง 3 ไฟล์ (`LandmarkMap.test.tsx`, `landmarkMapDegenerateBbox.test.tsx`, `landmarkMapIntegration.test.tsx`)
- ไม่มี P0 AC ใดถูกกระทบจากการเปลี่ยนแปลงรอบนี้ (label ทั้งสองจุดยังอ้างอิง `landmark.id` เดียวกันเหมือนเดิม ไม่กระทบ US-18 AC3) ทั้ง 2 ประเด็นที่ QA รอบ 3 ระบุไว้ถูกปิดจริงด้วย evidence ที่ตรวจสอบได้ ไม่ใช่แค่คำอ้าง

## บั๊กที่ต้องแก้ (เรียงตาม priority)
- ไม่มี — ไม่พบบั๊กใหม่หรือ regression จากการตรวจสอบอิสระรอบนี้

## หมายเหตุสำหรับผู้ใช้
- ทั้ง 2 ประเด็นที่ค้างจาก QA รอบ 3 (BUG-1 P1 และ accessibility label Low severity) ปิดครบแล้วในรอบนี้ ด้วยการยืนยันอิสระทั้งการอ่านโค้ดและการรันเทส ไม่มีข้อกังวลใหม่เพิ่มเติม
- ความเสี่ยงคงเหลืออื่นๆ จากรอบ 1/3 ที่ยังไม่เปลี่ยนแปลง (T30 perf บนอุปกรณ์จริง, T31 icon/splash default, ข้อมูล Overpass ยังไม่ครบ 76 จังหวัด) ยังคงเป็นเช่นเดิม — ดูรายละเอียดในผลตัดสินรอบ 1 และรอบ 3 ด้านบน ยังต้องพิจารณาก่อน release จริงตามเดิม ไม่เกี่ยวข้องกับขอบเขตงานรอบ 4 นี้

## รอบนี้คือรอบที่: 4 (ของ pipeline โดยรวม — เป็นรอบตรวจสอบการปิดบั๊กจาก QA รอบ 3)

---

# QA Result — รอบ 5: Landmark Cards & Media Integration (US-21–US-24)

## ผลตัดสิน: PASS with notes

## เหตุผล
- **ทุก AC ระดับ P0 ของ US-21–US-24 ผ่านครบ** (4/4, 6/6, 3/3, 5/5 ตามลำดับ) โดยอ้างอิงจากการตรวจสอบอิสระของ Tester ที่อ่านโค้ดจริงบรรทัดต่อบรรทัดเทียบกับแต่ละ AC ใน `docs/requirements.md` US-21–US-24 (ไม่ใช่เชื่อรายงานของผู้ implement) และเขียน integration test ใหม่ 18 เคสปิด coverage gap ที่ไม่เคยมีเทสมาก่อน (`LandmarkCard`/`LandmarkList`/`GlobalSearchBar` ไม่เคยถูก render จริงในเทสก่อนรอบนี้เลย) — วิธีตรวจสอบน่าเชื่อถือ ไม่ใช่แค่คำอ้าง
- **US-21 AC1 (happy path การแปลง HEIC จริง) เคยเป็นช่องโหว่ coverage ที่ร้ายแรง**: เทสเดิมของโปรเจกต์ไม่เคย mock `expo-image-manipulator` ทำให้ทุกเทสตกไปที่ fallback branch โดยไม่ได้ตั้งใจ ไม่เคยพิสูจน์ว่าการแปลงสำเร็จจริงทำงานถูกต้อง — Tester รอบนี้ปิดช่องว่างนี้แล้วด้วยเทสใหม่ที่ mock module เองและแยกทดสอบทั้ง 2 เส้นทาง (`src/__tests__/qa-round4/photoPickerConversionHappyPath.test.tsx`) ยอมรับว่าเป็น root cause แบบ **requirement/process gap ของรอบก่อนหน้า ไม่ใช่บั๊กของโค้ดรอบนี้** — โค้ดจริงทำงานถูกต้องตาม AC1 อยู่แล้ว (`ImageManipulator.manipulateAsync` ถูกเรียกก่อนเข้า `photoUris` จริง) เทสเดิมแค่ทดสอบไม่ครบ ไม่ใช่โค้ดผิด
- **จุดเสี่ยง 3 ข้อที่ PM ระบุใน "ประเด็น 16" ตรวจครบและได้ข้อสรุปตรงกับที่ PM คาดไว้ทั้ง 3 ข้อ**: (1) `LandmarkCardGrid.tsx` เป็น dead code จริง ไม่มี import จากที่ใดเลย ไม่กระทบ AC ใดๆ (ดูหัวข้อบั๊กด้านล่าง — เป็น non-blocking cleanup ไม่ใช่ blocking bug เพราะไม่ถูกเรียกใช้งานจริงในแอป ผู้ใช้ปลายทางไม่มีทางสัมผัสโค้ดนี้เลย) (2) รายงาน T79 อ้างผิดว่าแก้ `src/types/landmark.ts` (ของจริงคือ `src/data/thailand-landmarks.ts`) ยืนยันตามที่ PM ตรวจพบ ตรวจเพิ่มไม่พบจุดรายงานผิดอื่นที่กระทบ AC — เป็นความผิดพลาดของ "รายงานผลงาน" ไม่ใช่ของโค้ดหรือ AC เอง ไม่กระทบการตัดสิน PASS/FAIL (3) wiki-landmark id ไม่คงที่ข้ามการ fetch ใหม่ ตรวจโค้ดจริงยืนยันว่า `CheckinContext`/`getLandmarkProgress` ใช้ pattern "filter by current list" อยู่แล้ว ไม่มี throw/crash จริง ผลกระทบสูงสุดคือ orphaned checkin record ที่ไม่ถูกนับใน progress ซึ่ง requirements.md ยอมรับไว้แล้วว่าเป็นพฤติกรรมที่ยอมรับได้ (ไม่ต้องมี migration พิเศษ)
- **Flaky test (AuthContext/CheckinContext) เมื่อรันพร้อม suite เต็ม**: Tester วินิจฉัยด้วยหลักฐานที่เพียงพอ — รันซ้ำ 3 รอบ, ยืนยันว่าไฟล์เหล่านี้ผ่าน 100% เมื่อรันแยกเดี่ยว, อยู่คนละ domain กับ US-21–US-24 โดยสิ้นเชิง (ไม่แตะไฟล์เดียวกันเลย) จึงยอมรับว่าเป็น pre-existing timing/resource flakiness ที่ไม่เกี่ยวกับโค้ดรอบนี้ ไม่ใช่ regression — เพียงพอสำหรับ PASS แต่ควรบันทึกเป็น technical debt ให้ทีมแก้ในรอบถัดไปที่ไม่เร่งด่วน (ดูหมายเหตุผู้ใช้)
- **Design inconsistency ใหม่ (ProvinceMasterBadge vs progress indicator ในการ์ด) — ตัดสินว่าไม่ fail AC ของรอบนี้**: ตรวจ AC เดิมของ US-9 (`docs/requirements.md:114-120`) พบว่า AC1 เขียนไว้แค่ "จำนวน Landmark ที่เช็คอินแล้วเท่ากับจำนวน Landmark **ทั้งหมด**ของจังหวัดนั้น" โดยไม่เคยระบุชัดว่า "ทั้งหมด" หมายถึงเฉพาะ local seed dataset หรือรวม Wikipedia landmarks ด้วย (เพราะ US-9 ถูกเขียนขึ้นก่อน US-22/Wikipedia integration จะมีอยู่) — นี่คือ **scope ambiguity ที่เกิดจาก AC เดิมไม่ได้ปรับปรุงให้ตามทันฟีเจอร์ใหม่ ไม่ใช่บั๊กของโค้ดหรือ design ของรอบนี้** โค้ดปัจจุบันเลือกตีความแบบ "local seed เท่านั้น" ให้ `ProvinceMasterBadge` ซึ่งเป็นการตีความที่สมเหตุสมผล (Landmark จาก Wikipedia เป็น runtime-only ไม่ persist ตาม Out of Scope รอบนี้) แต่ทำให้ตัวเลขสองจุดในหน้าเดียวกันไม่ตรงกัน ผู้ใช้อาจสับสน — **ไม่ตัดสินเป็น FAIL เพราะไม่มี AC ใดถูกละเมิดจริง แต่ต้องส่งกลับ PM ตัดสินใจเชิง scope** ว่าจะ (ก) คงพฤติกรรมปัจจุบันและอัป AC ของ US-9 ให้ชัดว่า "ทั้งหมด" = เฉพาะ local seed dataset เท่านั้น หรือ (ข) เปลี่ยนให้ `ProvinceMasterBadge` นับรวม Wikipedia landmarks ให้ตรงกับ progress indicator — ไม่ใช่ QA ตัดสินเองเพราะเป็นทางเลือกเชิงธุรกิจ/UX ที่กระทบความหมายของ "Province Master"

## บั๊กที่ต้องแก้ (เรียงตาม priority) — non-blocking, ไม่กระทบ PASS ของรอบนี้
1. [P2] Scope ambiguity: `ProvinceMasterBadge` (US-9 เดิม) นับเฉพาะ local seed landmark ขณะที่ progress indicator ในการ์ด (US-22/23) นับรวม Wikipedia landmarks ด้วย ทำให้ตัวเลขสองจุดในหน้าเดียวกันไม่ตรงกัน — อ้างอิง: test-report.md หัวข้อ "Coverage ที่ยังขาด — รอบ 5" — Root cause: **requirement** (AC เดิมของ US-9 เขียนก่อน Wikipedia integration จะมีอยู่ ไม่ได้ตัดสิทธิ์/รวม Wikipedia landmark ไว้ชัดเจนทั้งสองทาง) — ส่งกลับ: PM (ตัดสินใจเชิง scope แล้วอัป AC ของ US-9 ให้ชัดเจน จากนั้นค่อยส่งต่อ programmer ถ้าต้องแก้โค้ด)
2. [P2] `src/components/LandmarkCardGrid.tsx` เป็น dead code ยืนยันแล้วว่าไม่มี import จากที่ใดเลย ไม่กระทบผู้ใช้ปลายทางเพราะไม่ถูกเรียกใช้งาน — อ้างอิง: test-report.md หัวข้อ "ตรวจ 3 จุดเสี่ยงที่ PM ระบุไว้ — ข้อ (1)" — Root cause: **โค้ด** (ไฟล์ leftover จากการ implement ที่ไม่ได้ลบ ไม่ใช่ AC หรือ design ที่คลุมเครือ) — ส่งกลับ: programmer (ลบไฟล์ทิ้งในรอบแก้บั๊ก/cleanup ถัดไป ไม่เร่งด่วน)
3. [P2] Flaky test ของ `AuthContext.test.tsx`/`CheckinContext.test.tsx` เมื่อรันพร้อม jest suite เต็ม (ผ่าน 100% เมื่อรันแยกเดี่ยว) — อ้างอิง: test-report.md หัวข้อ "รัน jest เต็มชุด + tsc อิสระ" — Root cause: **โค้ด** (แนวโน้มเป็น test isolation/timing issue เช่น shared async storage mock หรือ timer ข้าม test file ไม่ใช่ปัญหา AC/design) แต่เป็น pre-existing ก่อนรอบนี้ ไม่เกี่ยวกับ US-21–US-24 — ส่งกลับ: programmer (ไม่เร่งด่วน เก็บเป็น technical debt แยกจากรอบนี้)

## หมายเหตุสำหรับผู้ใช้
- รอบนี้ **PASS with notes** — ทุก P0 AC ของ US-21–US-24 ผ่านครบ ไม่มีบั๊กที่กระทบการใช้งานจริงหรือทำให้แอปพังในส่วนที่ตรวจ ปล่อยได้ แต่มี 3 ประเด็นที่ต้องติดตามตามที่ระบุในตารางด้านบน (ไม่บล็อกการส่งมอบรอบนี้)
- ประเด็นที่สำคัญที่สุดที่ควรตัดสินใจก่อนคือเรื่อง scope ambiguity ของ US-9 (ProvinceMasterBadge vs progress indicator ตัวเลขไม่ตรงกัน) เพราะกระทบความรู้สึกผู้ใช้โดยตรง (เช็คอินครบตามที่การ์ดบอกแต่ยังไม่ได้ badge) แนะนำให้ PM ตัดสินใจแนวทางก่อนรอบถัดไป
- Dead code (`LandmarkCardGrid.tsx`) และ flaky test เป็นรายการ cleanup/technical debt ระดับต่ำ ไม่กระทบผู้ใช้ปลายทาง เก็บไว้ในรอบแก้บั๊กถัดไปที่สะดวกได้ ไม่ต้องเร่งแก้ก่อน release
- Coverage gap ที่ Tester ปิดไปแล้วในรอบนี้ (US-21 AC1 happy path, `LandmarkCard`/`LandmarkList`/`GlobalSearchBar` integration tests) ถือเป็นคุณค่าเพิ่มของรอบนี้ ไม่ใช่ข้อบกพร่อง — ยกระดับความน่าเชื่อถือของ regression suite ในอนาคต
- ยังมี coverage gap เล็กน้อยที่เหลืออยู่ (end-to-end chain ของ PhotoPicker → AddEntryScreen save → EntryListItem ยังไม่มีเทสเดียวที่ครอบคลุมทั้ง flow) ความเสี่ยงต่ำ ไม่บล็อก แต่ควรเพิ่มถ้ามีเวลารอบถัดไป

## รอบนี้คือรอบที่: 5 (ของ pipeline โดยรวม — รอบแรกของ QA สำหรับ Landmark Cards & Media Integration เนื่องจากงาน implement ย้อนหลัง)

---

# QA Result — รอบ 6: Bug Fix — US-25 / T87-T89 (แยก "ไม่มีข้อมูล" ออกจาก "ดึงข้อมูล Wikipedia ล้มเหลว" + retry)

## ผลตัดสิน: PASS

## เหตุผล
- **ตรวจสอบ AC ทั้ง 6 ข้อของ US-25 ด้วยการอ่านโค้ดจริงเองอิสระ (ไม่เชื่อคำว่า "PASS" ในรายงานเฉยๆ)** — spot-check ตรงกับที่ tester อ้างอิงทุกจุด:
  - `wikipediaService.ts:81-144` ยืนยันแล้วว่ามี flag `categorySucceeded` ตั้งเป็น `true` ทันทีที่อย่างน้อย 1 category `fetch`+`res.ok`+`res.json()` สำเร็จ (บรรทัด 90-97) โดยไม่สนจำนวนบทความ และ `throw` เกิดขึ้นเฉพาะเมื่อ `!categorySucceeded` คือทุก category fail จริง (บรรทัด 140-144) — ตรงกับ AC1/AC2 เป๊ะ และตรงกับสมมติฐานที่ระบุไว้ใน `requirements.md:42`
  - `LandmarkList.tsx:167` (`fetchError && landmarks.length === 0` → error state เต็มจอ), `:189-196` (`landmarks.length === 0` เฉยๆ → `EmptyStateLandmarks`), `:204` (`fetchError` ร่วมกับมี landmarks อยู่ → compact banner เสริม ไม่ทับ list) — ยืนยันว่า error state กับ empty state เป็นคนละ component/คนละข้อความจริง ("โหลดข้อมูลสถานที่ไม่สำเร็จ" vs "ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้") ตรง AC2/AC5 และ local seed landmark ไม่หายเมื่อ fetch เสริมล้มเหลว ตรง AC4
  - `LandmarkList.test.tsx` มี 5 เทสจริงครอบคลุมครบ AC1–AC6 รวม edge case "retry แล้วยัง fail อีก" ที่เกินจาก AC ที่ระบุไว้ (เป็นส่วนเสริมที่ดี ไม่ใช่ปัญหา) — ตรวจแล้วว่าเป็น RTL render component จริงทั้งต้นไม้ ไม่ใช่ shallow mock ที่หลอกตัวเอง
  - AC3/AC6 (ปุ่มลองใหม่ + เคลียร์ error เมื่อสำเร็จ) ตรวจโค้ดยืนยันว่า `onRetry={loadWikipediaAttractions}` เรียก callback เดิมจากหน้าจอเดิม ไม่ navigate ออก และ `setFetchError(false)` ถูกเรียกก่อน merge ผลลัพธ์ใหม่เข้า `landmarks` state จริง
  - สรุป: **หลักฐานที่ tester อ้างอิงในรายงานตรงกับโค้ดจริงทุกจุดที่สุ่มตรวจ ไม่ใช่การอ้างลอยๆ** — ทั้ง 6 AC ของ US-25 ผ่านจริง ไม่มีข้อใดต้อง fail
- **Regression:** `npx jest --silent` เต็มชุด 47/47 suites, 245/246 tests (skip 1 เดิม) — ไม่มี suite ใดแตกใหม่จากการแก้ครั้งนี้ และ `tsc --noEmit` ผ่านสะอาด
- **การประเมิน flaky test `emailLinkIntegrity.test.tsx`:** พิจารณาแล้วว่า **ไม่เป็นเหตุให้ FAIL รอบนี้** ด้วยเหตุผล — (1) error message เป็น timing/`act`-wrapping issue ภายในไฟล์ email-link เอง ไม่เกี่ยวกับโค้ดที่แก้ในรอบนี้เลย (`wikipediaService.ts`/`LandmarkList.tsx` ไม่แตะ auth/email flow ใดๆ) (2) เมื่อรันไฟล์นี้แยกเดี่ยวและรันรวมซ้ำอีกครั้ง ผ่านทั้งคู่ ยืนยันว่าไม่ใช่ regression ที่เกิดขึ้นซ้ำแน่นอน เป็น intermittent flake จริง (3) ไม่มี AC ใดของ US-25 หรือฟีเจอร์ email-link ถูกกระทบจากผลนี้ — จัดเป็น pre-existing technical debt ของ test suite เดิม ไม่บล็อกการปล่อยรอบนี้ แต่บันทึกเป็นหมายเหตุให้ทีมแก้ต้นเหตุในรอบทำความสะอาด test suite ถัดไป

## บั๊กที่ต้องแก้ (เรียงตาม priority) — กรณี FAIL
- ไม่มี — ผ่านครบ 6/6 AC ของ US-25 ไม่พบ P0/P1/P2 ใดที่ต้องส่งกลับ

## หมายเหตุสำหรับผู้ใช้
- รอบนี้เป็น bug-fix scope เล็ก (US-25, T87-T89) ผ่านครบทุก AC จริง ปล่อยได้ทันที ไม่มีเงื่อนไขผูกพัน
- `emailLinkIntegrity.test.tsx` มี timing flake เดิมที่ไม่เกี่ยวกับรอบนี้ (คนละฟีเจอร์ ไม่ถูกแก้ในรอบนี้) — ไม่บล็อกการปล่อย แต่ควรจัดคิวแก้ที่ต้นเหตุ (`waitFor`/`act` wrapping) ในรอบทำความสะอาด test suite ที่ไม่เร่งด่วน เพื่อลดความสับสนระหว่าง flake จริงกับ regression จริงในอนาคต
- ประเด็นค้างจากรอบ 5 ที่ยังไม่ถูกแก้ในรอบนี้ (scope ambiguity ของ `ProvinceMasterBadge`, dead code `LandmarkCardGrid.tsx`, flaky `AuthContext`/`CheckinContext`) ไม่อยู่ใน scope ของ US-25/T87-T89 รอบนี้ ยังคงค้างอยู่ตามเดิม รอ PM/ทีมพิจารณาแยกต่างหาก

## รอบนี้คือรอบที่: 1 (ของ bug-fix scope US-25/T87-T89 นี้โดยเฉพาะ)
