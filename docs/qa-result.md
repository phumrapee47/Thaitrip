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

---

# QA Result — รอบ 7: Bug Fix — Search Result Tap ค้าง + หน้าจังหวัด Scroll ไม่ได้ (รอบ 14 ใน dev-notes.md)

## ผลตัดสิน: PASS with notes

## เหตุผล
- **ขอบเขตงานนี้เป็นบั๊กเล็ก ข้าม BA/PM/UIUX เดิม ไม่มี tasks.md/design-spec.md ใหม่** — เกณฑ์ P0 ของรอบนี้จึงอิงจากตัวบั๊กที่ผู้ใช้รายงานตรงๆ 2 ข้อ: (1) กด search result แล้วต้องนำทางได้ ไม่ค้าง (2) หน้าจังหวัดต้องเลื่อนขึ้นลงได้ ไม่ใช่จาก AC เอกสารที่เป็นทางการ (ไม่มีในกรณีนี้)
- **ทั้ง 2 บั๊กแก้ตรงกับ root cause ที่วิเคราะห์ไว้จริง** ตรวจสอบได้ทั้งระดับโครงสร้างและพฤติกรรม:
  - บั๊ก 1: `keyboardShouldPersistTaps="handled"` ถูกเพิ่มจริงในทุก ScrollView ที่อยู่ระหว่าง TextInput ที่ focus กับผลลัพธ์ที่กดได้ (`homeScreenScrollViewGuard.test.tsx` เดิน `toJSON()` จริง ไม่ใช่เชื่อโค้ดที่เห็นเฉยๆ) และพฤติกรรมจำลอง sequence ตรงกับที่ผู้ใช้รายงาน (focus → พิมพ์ → ไม่ blur → กดผลลัพธ์ทันที) ผ่านทั้ง landmark และ province result — ตรง root cause ที่ programmer ระบุ (ScrollView ชั้นนอกดัก tap แรกไปเพื่อ dismiss keyboard)
  - บั๊ก 2: body ของ `ProvinceDetailScreen.tsx` ถูกห่อด้วย ScrollView จริง (เดิมไม่มี scroll container เลย ตรงกับ root cause ที่ระบุ), FlatList ท้ายหน้าถูกแปลงเป็น `.map()` จริง ไม่มี VirtualizedList ซ้อนใน ScrollView หลงเหลือ (ยืนยันด้วยการเดิน render tree จริงและตรวจว่าไม่มี console.error "VirtualizedLists should never be nested inside plain ScrollViews"), scroll event ยิงได้จริงโดยไม่ throw, และ landmark card ยังกดได้ระหว่าง in-province search focus อยู่ (บั๊ก class เดียวกับบั๊ก 1 ที่เกิดได้บนหน้านี้ก่อนแก้เช่นกัน)
- **Regression:** `npx jest` เต็มชุด 57/57 suites, 276/277 tests, skip 1 (skip เดิมคือ T30 long-press ที่มีเอกสารอธิบายไว้แล้วตั้งแต่รอบ 1 ไม่เกี่ยวกับรอบนี้) — ไม่มี fail ใหม่, ไม่มี regression จากการแก้ 2 บั๊กนี้ `tsc --noEmit` ผ่านสะอาด
- **วิธีตรวจสอบของ tester น่าเชื่อถือกว่ามาตรฐานเดิม**: เขียน regression test ใหม่ 7 ไฟล์ที่ *เดิน render tree จริง* เพื่อยืนยัน prop ที่ถูกต้อง (จะ fail ทันทีถ้ามีใครลบ prop นี้ออกในอนาคต) แทนที่จะพึ่งแค่ `fireEvent.press` แบบเดิมของ programmer ที่ยอมรับเองแล้วว่าไม่มีทางจับบั๊ก class นี้ได้เลย (ข้าม native gesture arbitration ไปเรียก handler ตรงๆ) — เป็นการยกระดับ coverage ที่ตรงจุดกับ root cause ของบั๊กทั้งสอง
- **ข้อจำกัด "ต้องยืนยันบนอุปกรณ์/emulator จริง" — พิจารณาแล้วว่าเป็น note ประกอบ ไม่ใช่เหตุ FAIL** เทียบกับมาตรฐานที่โปรเจกต์นี้ใช้มาตลอด (เช่น รอบ 1 US-2 AC2 tap-target precision, US-3 AC1 animation feel, T30 perf) ซึ่งล้วนเป็น "native touch/gesture arbitration ระดับพิกเซล/เวลาจริง" ที่ RTL/jest ไม่มีทางจำลองได้ 100% ในสภาพแวดล้อมนี้ (ไม่มี Android/iOS runtime) — ทุกรอบก่อนหน้าตัดสินเป็น PASS (with notes) มาตลอดตราบใดที่มีการตรวจสอบทดแทนที่เข้มงวดเพียงพอในระดับโครงสร้าง+พฤติกรรมเท่าที่เครื่องมือทำได้ ซึ่งรอบนี้ทำได้ครบทั้งสองระดับ (structural guard + behavioral sequence ตรงกับที่ผู้ใช้รายงาน) จึงตัดสินใจตามมาตรฐานเดิมของโปรเจกต์ ไม่ใช่ลดเกณฑ์ใหม่ — **นี่ไม่ใช่ P0 ที่ยังไม่ผ่าน แต่เป็น coverage gap ที่มีอยู่แล้วโดยธรรมชาติของเครื่องมือ (เชื่อมโยงกับ T30 เดิม) จึงคงเป็น note ไม่ใช่เหตุ FAIL**

## บั๊กที่ต้องแก้ (เรียงตาม priority) — กรณี FAIL
- ไม่มี — ไม่พบบั๊กใหม่หรือ regression จากการตรวจสอบอิสระรอบนี้ ทั้ง 2 บั๊กที่รายงานมาถูกปิดจริงเท่าที่ตรวจสอบได้ในสภาพแวดล้อมนี้

## หมายเหตุสำหรับผู้ใช้
- รอบนี้ **PASS with notes** — ทั้ง 2 บั๊กที่รายงาน (search result tap ค้าง, หน้าจังหวัด scroll ไม่ได้) ถูกแก้ตรงกับ root cause จริง ตรวจสอบได้ทั้งระดับโครงสร้างและพฤติกรรมเท่าที่เครื่องมือทดสอบอัตโนมัติทำได้ ไม่มี regression ปล่อยได้
- **ข้อจำกัดที่ต้องทราบก่อนถือว่าปิดเคสสมบูรณ์ 100%:** สภาพแวดล้อมนี้ไม่มีอุปกรณ์/emulator จริง จึงยืนยัน "แตะแล้วไม่ค้างจริงบนจอ" และ "ลากนิ้ว scroll ได้จริงบนจอ" แบบ native touch-responder arbitration ไม่ได้ 100% (ข้อจำกัดเดียวกับ T30 ที่บันทึกไว้ตั้งแต่รอบ 1) แนะนำให้ทดสอบยืนยันซ้ำบนอุปกรณ์จริงหรือ emulator ก่อนหรือหลัง release ก็ได้ตามความเสี่ยงที่ทีมยอมรับได้ — ไม่ใช่เงื่อนไขบล็อกการส่งมอบตามมาตรฐานเดิมของโปรเจกต์นี้
- ประเด็นค้างอื่นจากรอบก่อนหน้า (scope ambiguity ของ `ProvinceMasterBadge`, dead code `LandmarkCardGrid.tsx`, flaky `AuthContext`/`CheckinContext` test, T30/T31 เดิม) ไม่อยู่ใน scope ของรอบนี้ ยังคงค้างอยู่ตามเดิม

## รอบนี้คือรอบที่: 1 (ของ bug-fix scope นี้โดยเฉพาะ — search tap + province scroll)

---

# QA Result — รอบ 8: Bottom Tab Navigation & ข่าวท่องเที่ยว RSS (US-28 – US-32)

## ผลตัดสิน: PASS with notes

## เหตุผล
- **ตรวจสอบทั้ง 21 AC ย่อยของ US-28–US-32 เทียบกับ `docs/requirements.md` และ `docs/tasks.md`** — 20/21 ผ่านตามรายงานของ tester ซึ่งเป็นการตรวจสอบอิสระที่น่าเชื่อถือ (ไม่ mock `newsService` ทั้งโมดูลในชุดเทสใหม่ `src/__tests__/qa-round8/newsScreenRealServiceIntegration.test.tsx` — เดินจริงทั้ง fetch → parse XML → dedupe/sort → cache → render) และ regression เต็มชุด 64/64 suites, 330/331 tests (skip 1 เดิม T30 ไม่เกี่ยวข้องกับรอบนี้), `tsc --noEmit` clean — ไม่มี regression ต่อ US-1/2/3/14/24/26 เดิมที่ย้ายเข้า Bottom Tab แล้ว
- **US-31 AC2 (scroll/state คงอยู่หลังปิด in-app browser) — coverage gap ที่ยอมรับได้ ไม่ใช่เหตุ FAIL** เทียบกับมาตรฐานเดิมของโปรเจกต์ (รอบ 1 T30, รอบ 7 native gesture arbitration): เป็นข้อจำกัดของเครื่องมือทดสอบ (RNTL/react-test-renderer จำลอง native modal overlay ของ `expo-web-browser` ไม่ได้) ไม่ใช่ P0 AC ที่ตรวจแล้วพบว่าพัง — tester เสริมหลักฐานทดแทนระดับ static analysis (ยืนยันว่า `NewsScreen.tsx` ไม่มี logic ใดๆ ที่ unmount/reset `<FlatList>` หรือ state ของ `items`/scroll ในเส้นทาง `handleOpenNews`) ซึ่งเป็นระดับการตรวจสอบทดแทนที่เข้มงวดเทียบเท่ากับที่โปรเจกต์นี้เคยยอมรับมาก่อน จึงคงเป็น note ต้อง manual QA บนอุปกรณ์จริงก่อน release แบบเดียวกับ T30 ไม่ใช่เหตุ FAIL
- **บั๊ก Cache Indicator แสดงผิดเงื่อนไข (Medium severity) — พิจารณาแล้วว่า "ไม่ถึงระดับ FAIL รอบนี้" แต่ต้องยกระดับเป็นบั๊กที่ต้องแก้ก่อน release จริง ไม่ใช่แค่ note เฉยๆ** เหตุผลในการชั่งน้ำหนัก:
  - **ต่อ AC ตามตัวอักษร**: `requirements.md` US-30 AC2 เขียนเชิงบวกว่า "เปิดแท็บข่าวโดยไม่มีเน็ต (หรือ RSS request ล้มเหลว) ... แสดงข่าวชุดล่าสุดที่ cache ไว้ทันที ... พร้อม indicator" — เงื่อนไขนี้ยังคงเป็นจริงเสมอ (indicator ขึ้นในกรณีนั้นถูกต้อง) AC ไม่ได้เขียนห้ามกรณีตรงข้ามไว้ชัดเจน ดังนั้น **ไม่ถือเป็นการละเมิด AC ตามตัวอักษรแบบตรงๆ** — ต่างจากเกณฑ์ FAIL ที่ต้องมี "acceptance criteria ระดับ P0 ไม่ผ่าน" ตามตัวหนังสือ
  - **แต่ root cause เป็น "โค้ด" ล้วนๆ ไม่ใช่ requirement/design คลุมเครือ**: `docs/design-spec.md:559,599` ระบุเงื่อนไขไว้ชัดเจนไม่กำกวม ("ถ้าตอนนี้ไม่มีเน็ต/ดึงล้มเหลว แต่มี cache เดิม → เห็น Cache Indicator") และ `docs/tasks.md` T104 (อยู่ในหมวด P0 ของไฟล์) เขียนตรงกันว่า indicator ต้องขึ้น "เมื่อ offline หรือ fetch ล้มเหลวแต่มี cache เดิม" เท่านั้น — โค้ดจริงที่ `src/screens/NewsScreen.tsx:~93-105` กลับ `setIsShowingCache(true)` ทันทีที่อ่าน cache สำเร็จโดยไม่แยกว่า stale หรือไม่ ไม่ reset จนกว่า `loadLive()` จะสำเร็จ — เป็น implementation ที่ไม่ตรงกับ design-spec/task ที่เขียนไว้ชัดเจนและทดสอบได้จริง (มี repro test อัตโนมัติยืนยันแล้วใน `newsScreenRealServiceIntegration.test.tsx`) ตรงตามนิยาม **root cause = โค้ด**
  - **Impact ต่อผู้ใช้จริง**: เกิดขึ้นทุกครั้งที่เปิดแท็บข่าวซ้ำภายใน TTL 45 นาที (สถานการณ์ใช้งานปกติที่พบบ่อยที่สุด ไม่ใช่ edge case) แม้ไม่ crash และไม่ทำให้ข้อมูลผิด (ข้อมูลที่แสดงยังถูกต้อง สดจริง) แต่ทำให้ผู้ใช้เข้าใจผิดว่าเน็ต/ข้อมูลมีปัญหาทั้งที่ไม่มี กระทบ first impression ของฟีเจอร์ใหม่ทุก session
  - **เทียบมาตรฐานเดิมของโปรเจกต์**: ต่างจาก dead code (`LandmarkCardGrid.tsx`, รอบ 5) หรือ flaky test ที่ไม่กระทบผู้ใช้ปลายทางเลย บั๊กนี้กระทบสิ่งที่ผู้ใช้ *เห็น* จริงทุกครั้ง แต่ก็ไม่ถึงขั้นทำให้ AC ที่เขียนไว้ตรงๆ ล้มเหลว (ต่างจากสมมติฐานว่าจะ FAIL P0 AC ตรงๆ) — จึงจัดเป็น **[P1] ไม่ใช่ [P0]** เพราะไม่ได้ละเมิด AC ที่เป็นลายลักษณ์อักษร แต่ severity/ความถี่สูงพอที่จะไม่ปล่อยเป็นแค่ note เฉยๆ โดยไม่มีการติดตาม — ต้องส่งกลับ programmer แก้เป็นลำดับแรกในรอบ bug-fix ถัดไป ก่อนพิจารณาว่า "ปิดเคสสมบูรณ์" สำหรับ US-30
- **ประเด็นอื่นที่ programmer/tester เห็นตรงกันว่าไม่ใช่บั๊ก** — ยืนยันแล้วว่าสมเหตุสมผล ไม่กระทบ AC ใด: (1) deep-link ข้ามแท็บ (StatsScreen → "ไปที่แผนที่" จากแท็บข่าว) เป็น safe no-op จริง ไม่ crash ไม่มี AC บังคับพฤติกรรมข้ามแท็บ แต่มี UX dead-end จริงที่ tester พบเพิ่มเติม (ค้างหน้า Stats ว่างเปล่าไม่มีทางกลับแผนที่ในบางเส้นทาง) — ไม่ block แต่ควรเป็น follow-up item ให้ PM พิจารณา (2) feed จริงแทบไม่มีรูปในข่าวเป็นข้อจำกัดของแหล่งข้อมูลต้นทาง (`tatnews.org/feed/`) ไม่ใช่ logic ของแอปผิด placeholder ทำงานถูกต้องตาม US-32 AC2 ทุกกรณีที่ตรวจ

## บั๊กที่ต้องแก้ (เรียงตาม priority)
1. [P1] Cache Indicator ("กำลังแสดงข่าวจากแคช...") แสดงผิดเงื่อนไข — โผล่ทุกครั้งที่เปิดแท็บข่าวซ้ำภายใน TTL 45 นาทีแม้ cache ยังสดและไม่เคย fetch ใหม่เลย ขัดกับ `docs/design-spec.md:559,599` และ `docs/tasks.md` T104 (P0 task) — อ้างอิง: test-report.md หัวข้อ "บั๊กที่พบ — บั๊ก 1" — Root cause: **โค้ด** (`src/screens/NewsScreen.tsx:~93-105` ตั้ง `setIsShowingCache(true)` ทันทีที่อ่าน cache สำเร็จโดยไม่แยกกรณี stale/fresh และไม่ reset จนกว่า `loadLive()` สำเร็จ) — ส่งกลับ: programmer (แก้ในรอบ bug-fix ถัดไป ไม่ block release รอบนี้เพราะไม่ crash/ไม่ทำข้อมูลผิด แต่ควรแก้เร็วเพราะกระทบผู้ใช้ทุก session)
2. [P2] UX dead-end: ผู้ใช้ที่เข้าแท็บข่าวตรงๆ โดยไม่มี entry เลย แล้วกด Stats → "ไปที่แผนที่" จะค้างอยู่หน้า Stats ว่างเปล่าโดยไม่มีปุ่มกลับแผนที่ที่ใช้งานได้ในหน้านั้น (มีแค่ "‹ กลับ" ที่พากลับไป News) — อ้างอิง: test-report.md หัวข้อ "ประเด็นที่ programmer flag ไว้ 3 ข้อ — ข้อ 1" — Root cause: **requirement** (ไม่มี AC ใดบังคับ/ระบุพฤติกรรม deep-link ข้ามแท็บไว้ตั้งแต่ต้น เป็นช่องว่างของ AC ไม่ใช่โค้ดทำผิดจากสิ่งที่ระบุไว้) — ส่งกลับ: PM (พิจารณาว่าจะเพิ่ม AC ให้ชัดเจนหรือยอมรับ non-blocking edge case นี้ต่อไป)

## หมายเหตุสำหรับผู้ใช้
- รอบนี้ **PASS with notes** — ทุก P0 AC ตามลายลักษณ์อักษรของ US-28–US-32 ผ่านครบ (20/21 นับ AC ย่อย, ข้อที่เหลือคือ coverage gap ของเครื่องมือทดสอบ ไม่ใช่บั๊กที่พบ) ไม่มี regression ต่อฟีเจอร์เดิม ปล่อยได้
- **ข้อควรทราบก่อน release จริง**: มีบั๊ก Cache Indicator (P1, root cause โค้ด) ที่แม้ไม่ block การส่งมอบรอบนี้เพราะไม่ crash/ไม่ทำข้อมูลผิด แต่ผู้ใช้จะเห็นข้อความ "กำลังแสดงข่าวจากแคช" ผิดๆ แทบทุกครั้งที่เปิดแท็บข่าวซ้ำในช่วง 45 นาทีแรกหลังเปิดแอปครั้งก่อน แนะนำให้จัดคิวแก้เป็นลำดับแรกในรอบ bug-fix ถัดไป ก่อนที่จะถือว่าฟีเจอร์ข่าวสมบูรณ์ 100%
- **ข้อจำกัดที่ต้องทราบ**: US-31 AC2 (scroll/state คงอยู่หลังปิด in-app browser) ยืนยันได้แค่ระดับ static analysis ในสภาพแวดล้อมนี้ (ไม่มี native runtime จำลอง `expo-web-browser` modal) แนะนำ manual QA บนอุปกรณ์จริงก่อน release เพื่อความมั่นใจ 100% เช่นเดียวกับ T30 เดิม — ไม่ใช่เงื่อนไขบล็อก
- Deep-link ข้ามแท็บที่ทำให้ UX ค้างในบางเส้นทาง (P2) ไม่บล็อกการปล่อย แต่ควรให้ PM พิจารณา follow-up
- ประเด็นค้างอื่นจากรอบก่อนหน้า (scope ambiguity ของ `ProvinceMasterBadge`, dead code `LandmarkCardGrid.tsx`, flaky `AuthContext`/`CheckinContext`) ไม่อยู่ใน scope ของรอบนี้ ยังคงค้างอยู่ตามเดิม

## รอบนี้คือรอบที่: 1 (ของ scope Bottom Tab Navigation & ข่าวท่องเที่ยว RSS นี้โดยเฉพาะ)

---

# QA Result — รอบ 9: Animation/Motion Upgrade (US-34, T119-T122)

## ผลตัดสิน: PASS with notes

## เหตุผล
- **จัดลำดับความสำคัญตาม `docs/tasks.md` ก่อนตัดสิน**: US-34 ทั้งหมด (T118-T123) อยู่ในหมวด **"## P1 (ควรมี)"** ของ `docs/tasks.md` (บรรทัด 193, 210) ไม่ได้อยู่ในหมวด P0 — ต่างจาก T104 (Cache Indicator, รอบ 8) ที่อยู่ในหมวด P0 ชัดเจน เกณฑ์ FAIL ของ QA คือ "มี AC ระดับ P0 ไม่ผ่าน แม้แต่ข้อเดียว" ดังนั้นแม้ AC2 จะ FAIL จริง (มีบั๊กพิสูจน์ได้จริง ไม่ใช่แค่ coverage gap) ก็ไม่เข้าเกณฑ์ FAIL ของ pipeline เพราะไม่มี P0 AC ใดถูกกระทบ — **AC4 (regression ต่อ US-1–US-32 ซึ่งรวม P0 เดิมทั้งหมด) ผ่านเต็ม 100%** (75/75 suites, 418/419 tests, skip 1 เดิม ไม่เกี่ยวข้อง) ยืนยันว่า P0 ของ epic ก่อนหน้าไม่ถูกกระทบเลย
- **AC1 (screen transition) — PASS พร้อม coverage gap ที่ยอมรับได้**: ยืนยันทั้ง functional (นำทางถูกต้อง) และ static config (`slide_from_right`/280ms, `slide_from_bottom`/300ms/modal, cross-fade 180ms ตรง design-spec §1) — ข้อจำกัดที่พิสูจน์ "เห็นชัดด้วยสายตาจริง" ไม่ได้ในเครื่องมือทดสอบนี้เป็นมาตรฐานเดิมของโปรเจกต์ (เทียบเท่า T30/T108) ไม่ใช่เหตุ FAIL
- **AC2 (entrance animation ของ list หลัก) — FAIL จริง ไม่ใช่แค่ข้อจำกัดเครื่องมือ**: ตรวจสอบหลักฐานที่ tester อ้างแล้วเห็นด้วยว่าเป็น root cause เชิงโครงสร้างที่ยืนยันได้แน่นอน — `LandmarkList.tsx` effect sync จังหวัด (~77-83) เรียก `setLandmarks(getLandmarksForProvince(...))` แบบไม่มีเงื่อนไขทุก mount และ `getLandmarksForProvince` (`src/data/thailand-landmarks.ts:1283-1285`) ใช้ `.filter()` ซึ่งคืน array reference ใหม่เสมอ ทำให้เกิด re-render ทันทีหลัง mount ก่อน entrance animation (260ms/580ms ตามสเปก) จะมีโอกาสเล่นจบ และ `useEntrancePlayedOnce`'s ref พลิกเป็น `true` ทันทีจาก re-render ที่ไม่เกี่ยวข้องนี้ ตัด `EntranceFadeItem` ทิ้งก่อนเวลา — ยืนยันด้วย isolated repro (`entranceAnimationRealRender.test.tsx`) ที่แยกตัวแปรได้ชัดเจน (list เดียวกันทุกประการ ต่างกันแค่มี/ไม่มี effect ที่ไม่เกี่ยวข้อง) นี่คือข้อเท็จจริงเชิงโค้ดที่ตรวจสอบได้โดยไม่ขึ้นกับข้อจำกัดของเครื่องมือทดสอบ (แม้จะพิสูจน์ "กี่ ms หลัง mount บนอุปกรณ์จริง" แบบ 100% ไม่ได้ก็ตาม)
- **AC3 (press feedback) — PASS เป็นส่วนใหญ่ พร้อม gap ที่ควรพิจารณา**: `LandmarkCard`, `NewsCard` มี `variant="emphasized"` จริงตามที่ mount ออกมา ยืนยันด้วย real fiber prop ไม่ใช่ grep ข้อความเฉยๆ — gap อยู่ที่ปุ่ม "+ เพิ่มบันทึกใหม่" 1 ใน 2 จุดจริงที่มี label เดียวกันเป๊ะ (จุดใน `EmptyState.tsx` ที่ผู้ใช้ใหม่ทุกคนเจอก่อนเสมอเมื่อจังหวัดยังไม่มี entry) ไม่ได้รับ `variant="emphasized"` ขณะที่จุด header ได้รับ
- **AC5/AC6 — PASS เต็ม**: ยืนยันด้วยพฤติกรรมจริง (rapid-press/interrupt ไม่ค้าง) และ call-count+rendered-output จริงของ `useReduceMotion()` ครบ 6 จุดตาม design-spec
- **บทวิเคราะห์ root cause ของ AC2 (บั๊ก 1) = โค้ด**: requirements.md AC2 (บรรทัด 473) และ design-spec (T118 motion spec) ระบุชัดเจนและทดสอบได้ว่า list ต้องมี entrance animation ที่ผู้ใช้สังเกตเห็นได้ตอน render ครั้งแรก ไม่คลุมเครือ ไม่ขัดแย้งกันเอง — ปัญหาคือ `useEntrancePlayedOnce`'s การตัดสินใจ "เล่นครั้งเดียว" ผูกกับ re-render ใดๆ ก็ตามแทนที่จะผูกกับ "animation เล่นจบจริงหรือยัง" ซึ่งเป็นข้อบกพร่องเชิง implementation logic ล้วนๆ ไม่ใช่ spec ที่ตีความได้หลายทาง — ส่งกลับ **programmer**
- **บทวิเคราะห์ root cause ของ AC3 gap (บั๊ก 2) = requirement (คลุมเครือ/ไม่ครอบคลุม edge case)**: requirements.md AC3 (บรรทัด 474) และ T121 ระบุปุ่มที่ต้อง enhance ด้วย**ชื่อ/label ทั่วไป** ("ปุ่ม '+ เพิ่มบันทึกใหม่'") ไม่ได้ระบุ code path/ตำแหน่งเจาะจงว่าหมายถึงจุดใดเมื่อปุ่มเดียวกัน (label เดียวกันเป๊ะ, ผลลัพธ์เดียวกัน, ปลายทางเดียวกัน) ปรากฏอยู่จริง 2 จุดในหน้าเดียวกันคนละ component — AC ไม่ได้ระบุไว้ชัดว่า "ทุกจุดที่ปุ่มนี้ปรากฏ" หรือ "เฉพาะ instance หลัก" จึงเป็นช่องว่างของการเขียน AC ที่ไม่ได้คาดการณ์ล่วงหน้าว่าปุ่มเดียวกันจะถูก reuse ผ่าน component กลาง (`EmptyState.tsx`) หลายจุด — การตัดสินใจของ programmer ที่จะไม่แตะ `EmptyState.tsx` (component กลางที่ใช้ร่วมกับ StatsScreen/NewsScreen) เพื่อไม่ขยาย scope เกินเป็นการตัดสินใจทางเทคนิคที่สมเหตุสมผลภายใต้ AC ที่คลุมเครือนี้ ไม่ใช่การไม่ทำตาม spec ที่ระบุไว้ชัด — ส่งกลับ **PM** (ให้ตัดสินใจว่า AC3 ควรครอบคลุมทั้ง 2 จุดหรือไม่ ก่อนส่งต่อ programmer ถ้าต้องแก้)
- **สรุปน้ำหนักการตัดสิน**: ทั้งสองประเด็นไม่กระทบ P0 AC ใดๆ ตาม tasks.md (US-34 เป็น P1 ทั้งหมด) และไม่มี regression ต่อ P0 เดิมเลย จึงไม่เข้าเกณฑ์ FAIL — แต่ AC2 เป็นบั๊กที่มี severity สูงในทางปฏิบัติ (มีโอกาสสูงที่ผู้ใช้จะไม่เห็น entrance animation เลยในสถานการณ์ใช้งานจริงปกติ ณ 3 จุดหลักที่เป็นเป้าหมายหลักของทั้ง epic) จึงต้องยกระดับเป็นบั๊กที่ต้องแก้ก่อนถือว่า US-34 สมบูรณ์ตามเจตนารมณ์ ไม่ใช่แค่ note เฉยๆ

## บั๊กที่ต้องแก้ (เรียงตาม priority)
1. [P1] Entrance animation ของ `LandmarkList.tsx`/`NewsScreen.tsx` (และมีความเสี่ยงเดียวกันใน `StatsScreen.tsx` เมื่อ render ผ่าน navigator จริง) ถูกตัดจบก่อนเวลาโดย re-render ที่ไม่เกี่ยวข้องซึ่งเกิดขึ้นแทบทันทีหลัง mount (`setLandmarks` จาก `.filter()` reference ใหม่ทุกครั้ง ใน `LandmarkList.tsx` ~77-83 และ `src/data/thailand-landmarks.ts:1283-1285`; `writeNewsCache`→`setCacheTimestamp` ใน `NewsScreen.tsx` ~79-80) ทำให้ `useEntrancePlayedOnce`'s `hasPlayedRef` พลิกเป็น `true` ก่อน animation จะมีโอกาสเล่นจบ — อ้างอิง: test-report.md รอบ 9 หัวข้อ "บั๊กที่พบ — บั๊ก 1" (AC2) — Root cause: **โค้ด** — ส่งกลับ: programmer (แนะนำแนวทางจาก tester: ผูกการตัดสินใจ `shouldPlayEntrance` กับ "animation เล่นจบจริงหรือยัง"/data epoch แทนการ recompute ทุก re-render)
2. [P2] ปุ่ม "+ เพิ่มบันทึกใหม่" ใน `EmptyState.tsx` (ใช้งานจริงผ่าน `ProvinceDetailScreen.tsx:100-105`, สถานการณ์แรกที่ผู้ใช้ใหม่ทุกคนเจอเมื่อจังหวัดยังไม่มี entry) ไม่ได้รับ `variant="emphasized"` ต่างจากปุ่มเดียวกันที่ header ของหน้าเดียวกัน (`ProvinceDetailScreen.tsx:89`) — อ้างอิง: test-report.md รอบ 9 หัวข้อ "บั๊กที่พบ — บั๊ก 2" (AC3) — Root cause: **requirement** (AC3/T121 ระบุปุ่มด้วย label ทั่วไปโดยไม่ได้ระบุว่าครอบคลุมทุก instance ของปุ่มเดียวกันที่ reuse ผ่าน component กลางหรือไม่) — ส่งกลับ: PM (ตัดสินใจ scope ก่อน แล้วค่อยส่งต่อ programmer ถ้าต้องเพิ่ม opt-in `variant` prop ให้ `EmptyState`)

## หมายเหตุสำหรับผู้ใช้
- รอบนี้ **PASS with notes** — ไม่มี P0 AC ใดถูกกระทบ (US-34 ทั้งหมดอยู่ในหมวด P1 ของ tasks.md และไม่มี regression ต่อ P0 เดิมของ US-1–US-32 เลยแม้แต่รายการเดียว) จึงปล่อยรอบนี้ได้ตามเกณฑ์ P0
- **ข้อควรทราบสำคัญก่อนถือว่า US-34 "เสร็จสมบูรณ์ตามเจตนารมณ์"**: มีบั๊กจริง (ไม่ใช่แค่ coverage gap) ที่ AC2 — entrance animation ของ list หลักมีความเสี่ยงสูงที่จะไม่ถูกมองเห็นจริงในสถานการณ์ใช้งานปกติ (ไม่ใช่ edge case) ที่ทั้ง 3 จุดหลักที่ AC กำหนด ซึ่งเป็นเป้าหมายหลักของทั้ง epic (ให้ผู้ใช้รู้สึกว่าแอป "redesign ใหม่จริง") แนะนำให้จัดคิวแก้เป็นลำดับแรกก่อนถือว่า US-34 เสร็จสมบูรณ์จริง แม้จะไม่ block การส่งมอบรอบนี้ตามเกณฑ์ P0 ก็ตาม
- ปุ่ม "+ เพิ่มบันทึกใหม่" จุดใน `EmptyState` ที่ยังไม่ได้ enhance (P2) ไม่บล็อกการปล่อย แต่ควรให้ PM ตัดสินใจ scope โดยเร็วเพราะเป็นจุดที่ผู้ใช้ใหม่ทุกคนเจอก่อนเสมอ
- ข้อจำกัดเดิมที่ยังคงอยู่ (ไม่ใช่ประเด็นใหม่): ไม่มี physical device ในสภาพแวดล้อมนี้ จึงยืนยัน "ไม่ jank"/ความชัดเจนทางสายตาของ screen transition (AC1) และ HomeScreen grid fade-in (T120, ประเด็น PM ข้อ 25) แบบ 100% ไม่ได้ — ต้อง manual QA บนอุปกรณ์จริงตาม safety net ที่ PM กำหนดไว้แล้วก่อน release จริง (ตรวจสอบว่า dev-notes.md บันทึกผลทดสอบอุปกรณ์จริงของ T120 ไว้ตามที่คำตัดสิน PM ข้อ 25 กำหนดหรือไม่ ก่อน sign-off ขั้นสุดท้าย)
- ประเด็นค้างอื่นจากรอบก่อนหน้า (Cache Indicator P1 จากรอบ 8, scope ambiguity ของ `ProvinceMasterBadge`, dead code `LandmarkCardGrid.tsx`, flaky test, deep-link dead-end) ไม่อยู่ใน scope ของรอบนี้ ยังคงค้างอยู่ตามเดิม

## รอบนี้คือรอบที่: 1 (ของ scope US-34 Animation/Motion Upgrade นี้โดยเฉพาะ)

---

# QA Result — รอบ 10 (Verify): US-34 AC2 บั๊ก 1 — ยืนยันการแก้ของ programmer

## ผลตัดสิน: PASS

## เหตุผล
- **ตรวจสอบไม่เชื่อคำอ้างเฉยๆ ตามที่ได้รับมอบหมาย — อ่าน `src/hooks/useEntrancePlayedOnce.ts` เองบรรทัดต่อบรรทัด (ไม่พึ่ง comment ในไฟล์หรือ dev-notes.md)**: ของใหม่ใช้ `armedRef`/`prevHasDataRef` เทียบ `hasData !== prevHasDataRef.current` แบบ synchronous ระหว่าง render (ไม่มี `useEffect`) — ไล่ trace เอง 3 กรณี: (1) `hasData` false→true: เงื่อนไขเป็นจริง → `armedRef.current = true` ทันที คืนค่า `true` ตั้งแต่ render pass แรกที่มีข้อมูล ตรงตาม AC2 (2) `hasData` true ต่อเนื่องข้าม re-render ใดๆ (รวมของ `LandmarkList`/`NewsScreen` ที่ยังคงยิง setState ที่ไม่เกี่ยวข้องอยู่เหมือนเดิม — ตรวจโค้ด `LandmarkList.tsx:77-83`/`thailand-landmarks.ts:1283-1285`/`NewsScreen.tsx:79-80` ยืนยันว่ายังไม่ได้ถูกลบ/แก้ทิ้งไป): เงื่อนไขเป็นเท็จ (`true !== true`) → `armedRef.current` ไม่ถูกแตะต้อง คงค่า `true` เดิมไว้ — นี่คือจุดที่แก้ root cause จริง (ของเดิมผูกกับ "มี re-render เกิดขึ้นหรือยัง" ของใหม่ผูกกับ "hasData เปลี่ยนค่าจริงหรือยัง") (3) `hasData` true→false: re-arm เป็น `false` ให้ epoch ใหม่ถูกต้อง — สรุปด้วยตัวเองว่า **นี่คือการแก้ที่ตรงกับ root cause ที่ระบุไว้ในคำตัดสินรอบ 9 จริง ไม่ใช่การ patch ผิวๆ หรือ mock ผลลัพธ์**
- **ตรวจ unit test `useEntrancePlayedOnce.test.ts` แยกจาก integration test** — ยืนยันว่า contract ตรงกับที่อ่านโค้ดได้ (`false` ตอน `hasData=false`, `true` ทันทีที่เปลี่ยนเป็น `true`, คงเป็น `true` ข้าม re-render ซ้ำๆ ขณะ `hasData` ไม่เปลี่ยน, re-arm เมื่อกลับไป `false` แล้วกลับมา `true` ใหม่) — สอดคล้องกับผลที่ trace เองในโค้ดจริง ไม่ใช่ assertion ที่เขียนขึ้นมาเพื่อกลบบั๊ก
- **ตรวจการแก้ assertion ในไฟล์ test ของ tester เอง (`entranceAnimationRealRender.test.tsx`, `toBe(0)` → `toBe(2)`/`toBe(4)`) ตามที่ต้องระวังเป็นพิเศษ**: เห็นด้วยกับการวิเคราะห์ของ tester ว่าเป็นทิศทางที่ถูกต้อง — assertion เดิม `toBe(0)` มีไว้เพื่อบันทึกพฤติกรรม "บั๊ก" (wrapper หายก่อน settle) เป็นหลักฐาน ไม่ใช่ค่าที่ถูกต้องตาม spec ในตัวเอง เมื่อ root cause ถูกแก้แล้ว ค่าที่ตรงตาม design-spec.md §2 (entrance animation ต้องเล่นตอนข้อมูลพร้อม) คือ wrapper ต้องรอดถึง settle จริง (`toBe(2)`/`toBe(4)` ตรงจำนวนรายการจริงในเคสนั้น) — การไม่แก้ assertion นี้ต่างหากที่จะทำให้เกิด false-negative ค้าง ไม่ใช่การลด severity เพื่อให้ผ่านง่าย
- **ตรวจสอบอิสระเรื่อง "NavigationContainer count=0" ตามที่ต้องสงสัยเป็นพิเศษ (ไม่เชื่อคำอธิบาย "ข้อจำกัดเครื่องมือ" ของ programmer เฉยๆ)**: ยอมรับแนวทางที่ tester ใช้ว่าเข้มงวดเพียงพอ — เขียน synthetic screen ที่ไม่มีบั๊ก (unconditional entrance wrapper) mount ผ่าน `NavigationContainer` เดียวกันแล้วนับได้ถูกต้อง (count=2, ไม่ใช่ 0) พิสูจน์ว่า custom fiber-walk ที่ tester เขียนเองไม่ได้ถูก navigator wrapper บล็อกโดยทั่วไปเสมอไป จากนั้นเปลี่ยนไปใช้ `screen.toJSON()` ซึ่งเป็น RNTL official API มาตรฐาน (ไม่ใช่ fiber-walk ที่เขียนขึ้นเอง จึงตัดความเสี่ยงเรื่อง helper บกพร่องออกไปได้) นับ host node ที่มี `opacity`+`transform translateY` (ลายเซ็นเฉพาะของ `EntranceFadeItem`'s `Animated.View` ก่อนแอนิเมชันเริ่ม) ได้ `count=2` ทั้ง `NewsScreen` และ `StatsScreen` เมื่อ mount ผ่าน `NavigationContainer` จริง — เป็นหลักฐานที่เป็นกลางที่สุดเท่าที่ทำได้ในสภาพแวดล้อมนี้ (ไม่ขึ้นกับ custom helper ที่อาจมีจุดบอด) และตรงกับที่ระบุไว้ว่า `hasData` ถูกเรียกแค่ 2 ครั้งไม่มีครั้งที่ 3 ที่พลิกกลับเป็น `false` — **เห็นด้วยว่าข้อสรุป "count=0 ไม่ใช่บั๊กที่หลงเหลือ" ถูกต้อง** แม้คำอธิบายเชิงเทคนิคเดิมใน dev-notes.md ("Screen/Freeze wrapper บล็อกการเดิน fiber โดยทั่วไป") จะไม่แม่นยำ 100% ก็ตาม (จุดนี้ tester เองก็ระบุไว้ตรงไปตรงมาแล้วว่าไม่กระทบข้อสรุปสุดท้ายเพราะมี ground-truth แยกยืนยันแล้ว)
- **Regression:** `npx jest` เต็มชุด 80/80 suites, 429/430 tests, skip 1 เดิม (ไม่เกี่ยวข้อง), 0 failed — ไม่มี regression ต่อ US-1–US-32/US-33 หรือ US-34 AC อื่นแม้แต่รายการเดียว ตรงกับตัวเลขที่ tester รายงาน
- **สรุปการตัดสินใจ**: ทั้ง 3 จุดเสี่ยงที่ต้องตรวจสอบเป็นพิเศษ (root cause ในโค้ด, ความสมเหตุสมผลของการแก้ assertion, ข้อสงสัยเรื่อง NavigationContainer) ผ่านการตรวจสอบอิสระของ QA เองครบ ไม่พบจุดที่น่าสงสัยเพิ่มเติมนอกเหนือจากที่ tester ระบุไว้แล้ว — **AC2 ถือว่า PASS จริง เปลี่ยนจาก FAIL ในรอบ 9** เป็นการแก้ root cause จริง ไม่ใช่แค่ทำให้ test ผ่านง่ายขึ้นหรือ mock ผลลัพธ์

## บั๊กที่ต้องแก้ (เรียงตาม priority)
- ไม่มีบั๊กใหม่จากรอบนี้สำหรับ AC2 — ปิดประเด็นบั๊ก 1 ของรอบ 9 ได้สมบูรณ์
- ประเด็นเดิมที่ยังไม่ปิด (คงไว้ตามเดิม ไม่ได้ถูกแก้ในรอบนี้เพราะไม่อยู่ใน scope): [P2] ปุ่ม "+ เพิ่มบันทึกใหม่" ใน `EmptyState.tsx` (ใช้งานจริงผ่าน `ProvinceDetailScreen.tsx:100-105`) ไม่ได้รับ `variant="emphasized"` ต่างจากปุ่มเดียวกันที่ header ของหน้าเดียวกัน (`ProvinceDetailScreen.tsx:89`) — อ้างอิง: test-report.md รอบ 9 หัวข้อ "บั๊กที่พบ — บั๊ก 2" (AC3) — Root cause: **requirement** (AC3/T121 ระบุปุ่มด้วย label ทั่วไปโดยไม่ได้ระบุว่าครอบคลุมทุก instance ของปุ่มเดียวกันที่ reuse ผ่าน component กลางหรือไม่ — QA รอบ 9 วิเคราะห์ไว้แล้วว่าไม่ใช่บั๊กโค้ด ไม่ใช่การไม่ทำตาม spec ที่ระบุไว้ชัด) — ส่งกลับ: PM (ยังรอ PM ตัดสินใจ scope ว่า AC3 ควรครอบคลุมทั้ง 2 จุดหรือไม่ ก่อนส่งต่อ programmer ถ้าต้องเพิ่ม opt-in `variant` prop ให้ `EmptyState`) — ไม่ใช่ P0/ไม่ block การส่งมอบ

## หมายเหตุสำหรับผู้ใช้
- รอบนี้ **PASS** สำหรับ AC2 (บั๊ก 1 ของรอบ 9) — ตรวจสอบอิสระยืนยันแล้วว่า programmer แก้ root cause จริง ไม่ใช่แค่ปรับ test ให้ผ่านง่ายขึ้น
- **สรุปสถานะรวมของ US-34 ทั้ง epic ณ ตอนนี้**: ผ่านครบ 5/6 AC เต็ม (AC1 ยังมี coverage gap ที่ยอมรับได้เหมือนเดิม — ต้อง manual QA อุปกรณ์จริงก่อน sign-off สุดท้ายตามที่ระบุไว้ตั้งแต่รอบ 9, AC2 ผ่านแล้วหลังแก้ในรอบนี้, AC4/AC5/AC6 ผ่านเต็มมาตั้งแต่รอบ 9) เหลือเพียง AC3 บั๊ก 2 (severity P2/Medium, ปุ่ม "+ เพิ่มบันทึกใหม่" ใน `EmptyState.tsx`) ที่ยังรอ PM ตัดสินใจเรื่อง scope ตามที่ระบุไว้ตั้งแต่รอบ 9 — **ไม่ใช่ P0 และไม่ block การส่งมอบ** สามารถปล่อยรอบนี้ได้โดยติดตามประเด็นนี้แยกต่างหาก
- ข้อจำกัดเดิมที่ยังคงอยู่ (ไม่ใช่ประเด็นใหม่ของรอบนี้): ไม่มี physical device ในสภาพแวดล้อมนี้ จึงยืนยัน "ไม่ jank"/ความชัดเจนทางสายตาของ screen transition (AC1) แบบ 100% ไม่ได้ — ต้อง manual QA บนอุปกรณ์จริงก่อน release จริงตามที่ระบุไว้แล้วตั้งแต่รอบ 9
- ประเด็นค้างอื่นจากรอบก่อนหน้า (Cache Indicator P1 จากรอบ 8, scope ambiguity ของ `ProvinceMasterBadge`, dead code `LandmarkCardGrid.tsx`, flaky test, deep-link dead-end) ไม่อยู่ใน scope ของรอบนี้ ยังคงค้างอยู่ตามเดิม

## รอบนี้คือรอบที่: 2 (ของ scope US-34 Animation/Motion Upgrade — รอบ verify การแก้บั๊ก AC2 หลังรอบ 9)

---

# QA Result — รอบ 16: Color Palette & Layout Redesign เฟส 1 (US-35 Decision Gate + US-36 HomeScreen)

## ผลตัดสิน: FAIL

## เหตุผล
- **ขอบเขต P0 ของรอบนี้**: `docs/tasks.md` บรรทัด 379-386 จัด T125–T131 ไว้ในหมวด **"### P0 (ต้องมี — เฟส 1)"** ทั้งหมด รวมถึง T126 ที่ระบุตรงตัวว่าต้อง "ตรวจสอบคู่สีข้อความสำคัญผ่านเกณฑ์ WCAG AA (contrast ≥ 4.5:1)" (อ้างอิง US-35 AC2,3,4,5) — ดังนั้น US-35 AC2 เป็น P0 AC ของรอบนี้จริง ไม่ใช่ P1/P2
- **ตรวจสอบอิสระ FINDING-1 ที่ tester รายงาน (ลิงก์ "สถิติ" บน HomeScreen TopBar, `src/screens/HomeScreen.tsx` styles.statsLink ใช้ `COLORS.accent` บนพื้น `COLORS.background`) แล้วเห็นว่าเข้าข่าย FAIL ของ AC2 จริง ไม่ใช่แค่ finding เสริมนอก scope ตามที่ dev-notes.md ตีความไว้แคบ**: ข้อความ AC2 ของ US-35 ("คู่สีที่ใช้แสดงข้อความสำคัญ **เช่น** textPrimary บน background, สีตัวอักษรบนปุ่ม CTA หลัก") ใช้คำว่า "เช่น" ซึ่งเป็นตัวอย่างประกอบ ไม่ใช่รายการปิด (exhaustive list) — เจตนารมณ์ของ AC คือ "ข้อความสำคัญที่ผู้ใช้ต้องอ่าน/ใช้งานจริง" ต้องผ่าน WCAG AA ลิงก์ "สถิติ" เป็นข้อความนำทางที่อยู่บน TopBar ของหน้าแรกสุดของแอป (ส่วนหนึ่งของ US-36 AC1/AC3 ที่ตรวจอยู่ในรอบนี้ด้วย) ผู้ใช้ต้องอ่าน/แตะใช้งานจริงทุกครั้งที่เปิดแอป จึงเข้าข่าย "ข้อความสำคัญ" ตามเจตนารมณ์ของ AC2 อย่างสมเหตุสมผล ไม่ใช่การตีความเกินเลย
- **ค่า contrast วัดได้จริงแค่ 2.87:1 ไม่ผ่านเกณฑ์ 4.5:1 ที่ AC2 กำหนดไว้ชัดเจนและวัดได้เป็นตัวเลข** — ไม่ใช่ AC ที่กำกวม/ตีความได้หลายทาง (ต่างจากกรณี "บรรทัดรอง"/"tint อ่อน" ในหัวข้อ observation) ตัวเลขนี้ทดสอบได้ตรงไปตรงมาด้วยสูตร WCAG relative-luminance มาตรฐาน จึงเป็นการ FAIL ที่ชัดเจนของ AC ที่ทดสอบได้จริง ไม่ใช่ข้อพิพาทเชิงตีความ
- **น้ำหนักจาก "แย่ลงจากเดิม" มีผลต่อการตัดสินให้เป็นบั๊กของรอบนี้ ไม่ใช่แค่ legacy debt ที่ปล่อยผ่านได้**: แม้ค่าเดิมก่อนรอบ 15 (3.39:1) ก็ไม่ผ่าน AA อยู่แล้วและไม่เคยถูก flag มาก่อน แต่การเปลี่ยนแปลงที่ทำในรอบนี้เอง (เลือก accent ใหม่ #15A87A + background ใหม่ #F6F9F7 ภายใต้ T126) เป็นสาเหตุโดยตรงที่ทำให้ค่าแย่ลง (3.39→2.87) และรอบนี้คือรอบที่ AC2 กำหนดให้ต้องตรวจสอบ WCAG AA ของคู่สีที่เปลี่ยนโดยเฉพาะ — การที่ audit ของ T126 ตรวจครบเฉพาะ 4 คู่ที่เลือกไว้ล่วงหน้าแต่พลาดคู่สีอื่นที่ใช้ accent ตัวเดียวกันจริงบนหน้าเดียวกัน ถือเป็น P0 task (T126) ที่ยังทำไม่ครบถ้วนตามเจตนารมณ์ ไม่ใช่แค่ debt เก่าที่ไม่เกี่ยวกับรอบนี้
- **Root cause = โค้ด ไม่ใช่ requirement หรือ design**: (1) ไม่ใช่ requirement คลุมเครือ เพราะเกณฑ์ 4.5:1 วัดผลได้ชัดเจนและ AC2 ระบุเจตนารมณ์ "ข้อความสำคัญ" ไว้กว้างพอที่จะครอบคลุมลิงก์นำทางบน TopBar อย่างสมเหตุสมผล (2) ไม่ใช่ design ที่ทำตาม spec แล้วผลลัพธ์ใช้งานไม่ได้ เพราะ `docs/design-spec.md` เองก็ออกแบบ token `accentDark` ไว้แล้วสำหรับกรณีที่ต้องการ contrast สูงกว่า `accent` บนพื้นสว่าง (ยืนยันจากค่าที่วัดได้จริงในรอบนี้เอง: accentDark on accentSurface = 7.05:1 ผ่านสบายๆ) — ระบบ token ที่ถูกต้องมีอยู่แล้วในโค้ด เพียงแต่ `HomeScreen.tsx` เลือกใช้ `COLORS.accent` แทน `COLORS.accentDark` สำหรับ `styles.statsLink` ซึ่งเป็นการเลือก token ผิดจุดในระดับ implementation ล้วนๆ แก้ได้ตรงจุดง่าย (สลับ token เดียว) ไม่ต้องออกแบบใหม่หรือปรับ AC ใดๆ
- **Regression และ AC อื่นของ US-35/US-36 ผ่านครบตามที่ tester ตรวจสอบอิสระอย่างละเอียดแล้ว** (คำนวณ contrast อิสระตรงกับ programmer ใน 4 คู่หลัก, สแกน hardcode hex สะอาด, hue family คงความหมายเดิม, before/after ต่างกันจับต้องได้จริง, render tree จริงยืนยัน token/regression ของ Map3D/HeaderProgress/Legend/GlobalSearchBar/US-34 animation ไม่พัง, regression เต็มชุด 82/83 suites) — ไม่มีเหตุผลให้สงสัยคุณภาพงานส่วนอื่น มีเพียงจุดเดียวคือ FINDING-1 ที่ทำให้ตัดสิน FAIL รอบนี้

## บั๊กที่ต้องแก้ (เรียงตาม priority) — กรณี FAIL
1. [P0] ลิงก์ "สถิติ" บน TopBar ของ `HomeScreen.tsx` (`styles.statsLink`, `{ color: COLORS.accent }` บนพื้น `styles.container` ที่เป็น `COLORS.background`) มี contrast จริงแค่ **2.87:1** ไม่ผ่านเกณฑ์ WCAG AA 4.5:1 ที่ US-35 AC2 กำหนด (แย่ลงจากเดิม 3.39:1 ก่อนรอบนี้) — อ้างอิง: test-report.md รอบ 16 หัวข้อ "บั๊กที่พบ — FINDING-1" — Root cause: **โค้ด** (เลือกใช้ `COLORS.accent` แทนที่จะเป็น `COLORS.accentDark` ซึ่งเป็น token ที่ระบบออกแบบไว้แล้วสำหรับกรณีต้องการ contrast สูงกว่าบนพื้นสว่าง — ยืนยันว่า accentDark on accentSurface วัดได้ 7.05:1 ผ่านสบาย) — ส่งกลับ: **programmer** (แก้ตรงจุด: เปลี่ยน `styles.statsLink.color` เป็น `COLORS.accentDark` หรือทางเลือกอื่นที่ tester เสนอ [เพิ่ม fontWeight เป็น 700 + ขนาดใหญ่ขึ้นเพื่อเข้าเกณฑ์ large-text 3:1] แล้ว**คำนวณ contrast ของตัวเลือกที่เลือกซ้ำก่อนส่งกลับ QA** ไม่ใช่แค่เปลี่ยนแล้วเชื่อว่าใช้ได้)

## ประเด็นรองที่ไม่ block แต่ต้องแจ้ง PM/UIUX (ไม่ใช่ P0 ของรอบนี้)
1. [P2] hero stat ("ปลดล็อกแล้ว X/76 จังหวัด") ใน `HeaderProgress.tsx` แสดงในบรรทัดเดียวแทนขึ้นบรรทัดใหม่ตามถ้อยคำ "บรรทัดรอง" ใน design-spec.md — บรรลุเจตนารมณ์ของ AC (ตัวเลขเด่นกว่าจริง 22px/800 vs 15px/600) แต่ไม่ตรงตัวอักษร 100% — Root cause: **requirement/design wording** (คำว่า "บรรทัดรอง" ใน design-spec.md คลุมเครือระหว่าง "บรรทัดถัดไป" กับ "ส่วนย่อยขนาดเล็กกว่าในบรรทัดเดียวกัน") — ส่งกลับ: PM/UIUX (ยืนยันด้วยสายตาว่ายอมรับได้หรือไม่ ไม่ใช่ QA อัตโนมัติตัดสินเอง ตรงกับที่ US-38 AC3 กำหนดไว้แล้วว่าต้องมีคนดูจริง)
2. [P2] `mapCanvasBg` ใช้ `#FFFFFF` เท่ากับ `COLORS.surface` แทนที่จะเป็น "tint อ่อนของพื้นหลังหลัก" ตามถ้อยคำใน `docs/tasks.md` "T125 — ผลตัดสินใจ" — ไม่มี AC ใดห้ามใช้ขาวล้วนเจาะจง ผลลัพธ์จริงยังต่างจากพื้นหลังมินท์อ่อนอย่างเห็นได้ชัด — Root cause: **requirement wording** (คำว่า "tint อ่อน" ในเอกสาร decision-gate ตีความได้กว้างกว่าที่ตั้งใจ) — ส่งกลับ: PM (ยืนยันอีกครั้งว่ายอมรับขาวล้วนได้หรือต้องคำนวณ tint ใหม่จริง)

## หมายเหตุสำหรับผู้ใช้
- รอบนี้ **FAIL** เพราะ US-35 AC2 (P0 ตาม T126) ไม่ผ่านจริง 1 จุด (ลิงก์ "สถิติ" contrast 2.87:1) — เป็นบั๊กเล็ก แก้ง่าย (คาดว่าเป็นการสลับ color token 1 บรรทัดในโค้ด + ยืนยัน contrast ซ้ำ) ไม่ใช่ปัญหาเชิงโครงสร้างหรือ requirement/design ที่ต้องออกแบบใหม่ จึงไม่ควรใช้เวลานานในการแก้และ verify รอบถัดไป
- งานส่วนที่เหลือของ US-35/US-36 คุณภาพดีและตรวจสอบอิสระผ่านครบจริง (ไม่ใช่การ FAIL ทั้ง scope) — แนะนำให้ programmer แก้เฉพาะจุดนี้แล้วส่งกลับ QA verify รอบถัดไปแบบเจาะจง (เหมือนรูปแบบรอบ 10 ที่ verify เฉพาะบั๊กเดียวหลังรอบ 9) ไม่จำเป็นต้องรัน manual visual QA เต็มรูปแบบใหม่ทั้งหมด
- ประเด็นรอง 2 ข้อ (hero stat line-wrap, mapCanvasBg tint) ไม่ block การแก้บั๊กหลัก แต่ควรให้ PM/UIUX ยืนยันคู่กันไปในรอบเดียวกันเพื่อประหยัดรอบ — ทั้งสองข้อนี้ไม่ใช่เหตุ FAIL หากแก้เฉพาะ FINDING-1 แล้วปล่อยรอบนี้ได้เลย
- ยังไม่ได้ทำ manual visual QA จริงบนอุปกรณ์ (US-36 AC2/US-38 AC3) ตามที่ tester ระบุเป็น coverage gap ไว้แล้ว — เป็นเงื่อนไขที่ต้องทำก่อนปิด epic ทั้งหมด (US-38) ไม่ใช่เงื่อนไขบล็อกของรอบ US-35/US-36 นี้โดยเฉพาะ แต่ควรวางแผนล่วงหน้า
- ประเด็นค้างอื่นจากรอบก่อนหน้า (Cache Indicator P1 รอบ 8, scope ambiguity ProvinceMasterBadge, dead code, flaky test, ปุ่ม EmptyState variant รอบ 9) ไม่อยู่ใน scope ของรอบนี้ ยังคงค้างอยู่ตามเดิม

## รอบนี้คือรอบที่: 1 (ของ scope US-35 Color Palette Decision Gate + US-36 HomeScreen Redesign นี้โดยเฉพาะ)

---

# QA Result — รอบ 17 (Verify): US-35 AC2 FINDING-1 บั๊ก contrast ลิงก์ "สถิติ" — ยืนยันการแก้ของ programmer

## ผลตัดสิน: PASS with notes

## เหตุผล
- **ตรวจสอบไม่เชื่อคำอ้างเฉยๆ ตามมาตรฐานเดียวกับรอบ 10** — อ้างอิง `test-report.md` หัวข้อ "รอบ Verify ที่ 2: บั๊ก contrast ลิงก์ 'สถิติ'" ซึ่งทำครบ 3 ชั้นที่จำเป็นต่อการปิดบั๊ก P0 นี้จริง ไม่ใช่แค่เชื่อคำอ้างของ programmer:
  1. **คำนวณ contrast อิสระด้วยสูตร WCAG relative-luminance เอง** (node script แยกจากทั้ง dev-notes.md และไฟล์ test เดิม) ได้ `contrastRatio(COLORS.accentDark #0B5C46, COLORS.background #F6F9F7) = 7.5230:1` — **ผ่าน AA (≥4.5:1) และผ่านระดับ AAA (≥7:1) ด้วย** ตัวเลขตรงกับที่ programmer อ้าง (7.51:1) ส่วนต่างเล็กน้อยเป็นแค่ rounding ไม่กระทบผลตัดสิน — นี่คือหลักฐานเชิงตัวเลขที่หนักแน่นที่สุดว่าบั๊กที่ QA รอบ 16 ตีกลับ (contrast 2.87:1 ไม่ผ่าน AA) ถูกแก้ไขจริง
  2. **เดิน render tree จริงของ `HomeScreen.tsx`** (mount เต็มรูปแบบผ่าน `NavigationContainer`+`JournalProvider`+`CheckinProvider` จริง) แล้วดึง node ข้อความ "สถิติ" จริงจาก `toJSON()`/`getByText` มาอ่านค่า `style.color` ที่ resolve จริง — ได้ `#0B5C46` (`COLORS.accentDark`) ไม่ใช่ `COLORS.accent` เดิม — ยืนยันว่าการแก้ไขไปถึงหน้าจอจริงที่ผู้ใช้เห็น ไม่ใช่แค่เปลี่ยนที่ source แล้วไม่ได้ถูกเรียกใช้จริง (ข้อกังวลมาตรฐานเดียวกับที่ QA เคยเน้นไว้ในรอบ 2/10)
  3. **ตรวจสอบการแก้ไฟล์ test เดิมของ tester เอง (`us35TokenAndContrastAudit.test.ts` → เปลี่ยนเป็น `.test.tsx`)** ว่าเป็นการแก้ที่สมเหตุสมผลไม่ใช่การลด coverage เพื่อให้ผ่านง่าย — เห็นด้วยกับเหตุผลที่ให้ไว้: เคสเดิมเช็ก `contrastRatio(COLORS.accent, COLORS.background)` ตรงจาก token โดยไม่เคย render component จริงเลย เป็นการ "เช็กผิดจุด" ตั้งแต่ต้น (เช็ก token ที่ไม่ได้ถูกใช้งานที่จุดนี้อีกต่อไปหลังบั๊กถูกแก้) จะ fail ตลอดไปไม่ว่าการแก้จะถูกต้องแค่ไหนก็ตาม ไม่มีค่าเป็น regression guard — การแทนที่ด้วยเคสใหม่ที่ (ก) เช็ก `accentDark`/`background` ตรงคู่ที่ใช้งานจริง และ (ข) เรนเดอร์ `HomeScreen` จริงยืนยัน resolved color ทั้งสองแบบ **เพิ่ม coverage ไม่ใช่ลด** และคงเคสอื่นทั้งหมดในไฟล์ไว้ครบ ไม่ได้แตะ/ลบเคสที่ไม่เกี่ยวข้อง
- **Regression:** `npx jest` เต็มชุด 83/83 suites, 480/480 passed + 1 skip เดิม (documented environment limitation จากรอบก่อนๆ ไม่เกี่ยวข้อง), 0 failed — ตัวเลขเพิ่มขึ้นจาก 82 passed/1 failed ของรอบ 16 เป็น 83 passed/0 failed พอดี ตรงกับที่คาดหวังจากการปิดบั๊กเดียวนี้ ไม่มี regression ใหม่จากการแก้โค้ดหลักหรือการแก้ไฟล์ test
- **สรุปการตัดสินใจ**: บั๊ก P0 เดียวที่ทำให้รอบ 16 FAIL (FINDING-1, contrast ลิงก์ "สถิติ") ได้รับการแก้ไขและตรวจสอบอิสระยืนยันแล้วครบทั้งตัวเลข, render tree จริง, และความสมเหตุสมผลของการปรับ test — **ถือว่าปิดบั๊กนี้ได้จริง ไม่ใช่แค่ทำให้ตัวเลขในรายงานดูดีขึ้น** ไม่มี P0 AC ใดเหลือค้างจากรอบ 16 อีกต่อไป

## บั๊กที่ต้องแก้ (เรียงตาม priority)
- ไม่มีบั๊กใหม่จากรอบนี้ — FINDING-1 (P0 เดียวของรอบ 16) ปิดสมบูรณ์แล้ว

## ประเด็นรองที่ยังไม่ถูกแก้ (คงไว้ตามเดิมจากรอบ 16 — ไม่ได้อยู่ใน scope ของรอบ verify นี้ ไม่ block)
1. [P2] hero stat ("ปลดล็อกแล้ว X/76 จังหวัด") ใน `HeaderProgress.tsx` แสดงในบรรทัดเดียวแทนขึ้นบรรทัดใหม่ตามถ้อยคำ "บรรทัดรอง" ใน design-spec.md — บรรลุเจตนารมณ์ของ AC (ตัวเลขเด่นกว่าจริง 22px/800 vs 15px/600) แต่ไม่ตรงตัวอักษร 100% — Root cause: **requirement/design wording** (คำว่า "บรรทัดรอง" ใน design-spec.md คลุมเครือระหว่าง "บรรทัดถัดไป" กับ "ส่วนย่อยขนาดเล็กกว่าในบรรทัดเดียวกัน") — ส่งกลับ: PM/UIUX (ยืนยันด้วยสายตาว่ายอมรับได้หรือไม่ ไม่ใช่ QA อัตโนมัติตัดสินเอง ตรงกับที่ US-38 AC3 กำหนดไว้แล้วว่าต้องมีคนดูจริง) — ยังไม่ได้รับการยืนยันจาก PM/UIUX ในรอบนี้เช่นกัน
2. [P2] `mapCanvasBg` ใช้ `#FFFFFF` เท่ากับ `COLORS.surface` แทนที่จะเป็น "tint อ่อนของพื้นหลังหลัก" ตามถ้อยคำใน `docs/tasks.md` "T125 — ผลตัดสินใจ" — ไม่มี AC ใดห้ามใช้ขาวล้วนเจาะจง ผลลัพธ์จริงยังต่างจากพื้นหลังมินท์อ่อนอย่างเห็นได้ชัด — Root cause: **requirement wording** (คำว่า "tint อ่อน" ในเอกสาร decision-gate ตีความได้กว้างกว่าที่ตั้งใจ) — ส่งกลับ: PM (ยืนยันอีกครั้งว่ายอมรับขาวล้วนได้หรือต้องคำนวณ tint ใหม่จริง) — ยังไม่ได้รับการยืนยันจาก PM ในรอบนี้เช่นกัน

## หมายเหตุสำหรับผู้ใช้
- รอบนี้ **PASS with notes** — บั๊ก P0 เดียวที่ตีกลับในรอบ 16 (contrast ลิงก์ "สถิติ" 2.87:1) ได้รับการแก้ไขและตรวจสอบอิสระยืนยันแล้วว่าแก้จริง (7.5230:1 ผ่านทั้ง AA และ AAA, ยืนยันด้วย render tree จริงว่า HomeScreen ใช้สีใหม่จริง) ไม่มี P0 ใดเหลือค้าง สามารถปล่อย scope US-35/US-36 นี้ได้
- ประเด็นรอง 2 ข้อที่ค้างจากรอบ 16 (hero stat line-break ในบรรทัดเดียวแทนขึ้นบรรทัดใหม่, mapCanvasBg ใช้ขาวล้วนแทน tint อ่อน) **ยังไม่ถูกแก้และยังไม่ได้รับการยืนยันจาก PM/UIUX** ในรอบ verify นี้ ทั้งสองข้อเป็น P2 ไม่ block การส่งมอบรอบนี้ (ไม่มี AC ใดถูกละเมิดตรงๆ) แต่ PM/UIUX ควรยืนยันก่อนปิด epic ทั้งหมด (US-38) ตามที่ระบุไว้ตั้งแต่รอบ 16
- ยังไม่ได้ทำ manual visual QA จริงบนอุปกรณ์ (US-36 AC2/US-38 AC3) เหมือนเดิม — เป็นเงื่อนไขที่ต้องทำก่อนปิด epic ทั้งหมด (US-38) ไม่ใช่เงื่อนไขบล็อกของ scope US-35/US-36 นี้โดยเฉพาะ
- ประเด็นค้างอื่นจากรอบก่อนหน้า (Cache Indicator P1 รอบ 8, scope ambiguity ProvinceMasterBadge, dead code, flaky test, ปุ่ม EmptyState variant รอบ 9) ไม่อยู่ใน scope ของรอบนี้ ยังคงค้างอยู่ตามเดิม

## รอบนี้คือรอบที่: 2 (ของ scope US-35 Color Palette Decision Gate + US-36 HomeScreen Redesign นี้โดยเฉพาะ — รอบ verify การแก้บั๊ก FINDING-1 หลังรอบ 16)

---

# QA Result — รอบ 18: Color Palette & Layout Redesign เฟส 2 (US-37 หน้าจอที่เหลือ + US-38 Visual QA)

## หมายเหตุกระบวนการ
Sub-agent `pm`/`uiux`/`tester`/`qa` (ทุกตัวมีแค่เครื่องมือ Write ไม่มี Edit) ล้มด้วย API error "output เกิน 64000 token" ซ้ำหลายครั้งตอนพยายามเขียนทับไฟล์เอกสารที่มีอยู่แล้วในรอบนี้ แม้ปรับ prompt ให้กระชับที่สุดแล้วก็ตาม — เป็นปัญหาเชิงระบบของ subagent เหล่านี้ในสภาพแวดล้อมนี้ ไม่ใช่ปัญหาของ scope งาน orchestrator จึงทำหน้าที่ PM/UIUX/Tester/QA ในรอบนี้เอง (มีแค่ `programmer` subagent ที่ทำงานได้ปกติเพราะมีเครื่องมือ Edit) — ยึดหลักเดียวกับ QA ทุกรอบก่อนหน้า: ตรวจสอบอิสระเอง ไม่เชื่อรายงานของ programmer เฉยๆ (ดูรายละเอียดการตรวจใน `docs/test-report.md` รอบ 18)

## ผลตัดสิน: PASS with notes

## เหตุผล
- **ขอบเขต P0 ของรอบนี้**: `docs/tasks.md` หัวข้อ "รอบ 18" จัด T132-T139 (ครอบคลุม US-37 AC1-4 ทั้งหมด) เป็น P0 — ตรวจสอบอิสระ (grep เอง 6 ไฟล์ + รัน `tsc`/`jest` เอง ไม่พึ่ง dev-notes.md อย่างเดียว) ยืนยันว่า **P0 ทั้งหมดผ่านจริง**: ไม่มี hex เดิมหลงเหลือในขอบเขตที่มอบหมาย, `ProvinceDetailScreen`/`AddEntryScreen` ได้ layout spec ใหม่จาก UIUX (T132) และ implement ตรงตาม spec, regression suite เดิมทั้งหมดผ่าน 84/84 suites (487 passed + 1 skip, 0 failed — เพิ่มจาก baseline 480 passed พอดี 7 เคสของ test ใหม่ T140 ที่เขียนเพิ่มในรอบนี้)
- **T140 (P1, hex-hardcode guard สำหรับ 6 ไฟล์ใหม่) ไม่ได้ถูกมอบหมายให้ programmer ทำในรอบแรก จึงเขียนเองเพิ่มในรอบนี้**: pattern เดียวกับ `noHardcodedHexRound15.test.ts` เดิม (T131) พร้อม allowlist เฉพาะจุดของ `LandmarkCard.tsx` (3 จุด `rgba(0,0,0,x)` ที่เป็น photo-dimming scrim/text-shadow ทั่วไป ไม่ใช่ brand color — เหตุผลเดียวกับที่ dev-notes.md ระบุไว้ล่วงหน้า ตรวจสอบแล้วว่าสมเหตุสมผล ไม่ใช่การลด coverage เพื่อให้ผ่านง่าย) — ผ่านครบ 7/7 ไฟล์
- **US-38 AC1/AC4 (screenshot checklist + user live confirmation) ยังไม่เสร็จ — เป็น P1/manual step ไม่ใช่ P0 จึงไม่ทำให้ FAIL**: สอดคล้องกับมาตรฐานเดิมของโปรเจกต์ทุกรอบก่อนหน้า (T30 perf บนอุปกรณ์จริง, US-31 AC2 scroll หลังปิด in-app browser) ที่ยอมรับว่าสภาพแวดล้อมนี้ไม่มี runtime/อุปกรณ์จริงให้ capture ภาพหรือให้ผู้ใช้ยืนยันได้ — ไม่ใช่ P0 ของ tasks.md รอบนี้ (อยู่ในหมวด P1) และ AC4 เขียนไว้ชัดว่าต้องเป็น **ผู้ใช้จริง** ยืนยัน ไม่ใช่ QA อัตโนมัติตัดสินแทน (คำตัดสิน PM ประเด็น 28) — ยังไม่ปิด epic ทั้งหมด (US-35 ถึง US-38) ได้ 100% จนกว่าจะมีผู้ใช้เปิดแอปจริงยืนยัน แต่ไม่บล็อกการส่งมอบรอบนี้
- **`NewsErrorState.tsx` มี hex เดิม (`#FFFFFF`) หลงเหลือ 2 จุด — ไม่ใช่ regression ของรอบนี้**: เป็นไฟล์ที่ไม่อยู่ใน 6 ไฟล์ที่ระบุชื่อไว้ใน T138 (task ระบุ "NewsScreen.tsx (รวมการ์ดข่าว)" ซึ่งตีความได้สมเหตุสมผลว่าหมายถึง `NewsCard.tsx` ไม่ใช่ทุก sub-component ของหน้าข่าว) ยืนยันด้วย grep อิสระว่า hex นี้มีอยู่ก่อนรอบนี้แล้ว ไม่ใช่ของใหม่ที่เพิ่มขึ้น — Root cause: **requirement/task wording** (T138 ระบุชื่อไฟล์ไม่ครอบคลุมทุก sub-component ของหน้าข่าว) ไม่ใช่โค้ดที่ทำผิดจากสิ่งที่ระบุไว้ชัด
- **Regression และคุณภาพงานส่วนอื่นตรวจสอบอิสระผ่านครบ**: ไม่มีเหตุผลให้สงสัยคุณภาพของ T132-T140 — มีเพียงช่องว่างของ US-38 ที่เป็น manual step กับ 1 ไฟล์นอกสโคปที่ทำให้ตัดสิน "PASS with notes" แทน "PASS" เฉยๆ

## บั๊กที่ต้องแก้ (เรียงตาม priority) — ไม่ block การส่งมอบ
1. [P2] `src/components/NewsErrorState.tsx` มี `color: '#FFFFFF'` hardcode 2 จุด (บรรทัด 32, 58) ไม่ได้อ้างอิง `COLORS.textOnDark` — อ้างอิง: test-report.md รอบ 18 ข้อ 3 — Root cause: **requirement/task wording** (T138 ระบุชื่อไฟล์ไม่ครอบคลุม sub-component นี้) — ส่งกลับ: PM (ตัดสินใจว่าจะขยาย scope ให้ programmer แก้เพิ่มหรือปล่อยเป็น cleanup ภายหลัง — แก้ไม่ยาก 2 บรรทัด)

## หมายเหตุสำหรับผู้ใช้
- รอบนี้ **PASS with notes** — ทุก P0 AC ของ US-37 (T132-T139) ผ่านครบจริง ตรวจสอบอิสระแล้วไม่ใช่แค่เชื่อรายงาน ปล่อยรอบนี้ได้
- **ก่อนจะถือว่า epic "Color Palette & Layout Redesign" (US-35 ถึง US-38) ปิดสมบูรณ์ 100% ยังเหลือ 2 เรื่องที่ต้องทำ**: (1) เปิดแอปจริงอย่างน้อย 1 รอบเพื่อยืนยันด้วยตาตัวเองว่า "แอปเปลี่ยนไปจริง ดู advance ขึ้น" ทุกหน้าจอหลัก (US-38 AC4, T144) — ไม่มีใครแทนผู้ใช้ทำขั้นตอนนี้ได้ (2) ถ่าย screenshot ก่อน/หลังของทั้ง 6 หน้าจอเก็บไว้เป็นหลักฐาน (US-38 AC1, T141) ถ้าต้องการ — ทั้งสองข้อนี้เป็น manual step ที่ระบบอัตโนมัติในสภาพแวดล้อมนี้ทำแทนไม่ได้
- `NewsErrorState.tsx` (P2, hex เดิม 2 จุด) ไม่บล็อก แต่ควรให้ PM ตัดสินใจว่าจะขยาย scope เก็บงานให้ครบ 100% หรือปล่อยไว้
- ประเด็นค้างอื่นจากรอบก่อนหน้าทั้งหมด (Cache Indicator P1 รอบ 8, scope ambiguity ProvinceMasterBadge, dead code `LandmarkCardGrid.tsx`, flaky test, ปุ่ม EmptyState variant, hero stat line-wrap, mapCanvasBg tint) ไม่อยู่ใน scope ของรอบนี้ ยังคงค้างอยู่ตามเดิม

## รอบนี้คือรอบที่: 1 (ของ scope US-37 หน้าจอที่เหลือ + US-38 Visual QA เฟส 2 นี้โดยเฉพาะ)
