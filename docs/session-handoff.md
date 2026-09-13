# Session Handoff — สำหรับกลับมาทำงานต่อ

อัปเดตล่าสุด: 2026-09-13 (commit `ec0badb` — "Advanced UI/UX redesign for landmark cards + fix Wikipedia loading and photo-upload bugs")

หมายเหตุ: ไฟล์นี้เป็น snapshot ของสถานะ ณ ตอนที่เขียน ถ้ากลับมาทำงานต่อแล้วพบว่าโค้ด/docs ไม่ตรงกับที่ระบุไว้ ให้เชื่อโค้ดจริง/`git log`/`git status` มากกว่าไฟล์นี้เสมอ (โดยเฉพาะถ้าเวลาผ่านไปนานแล้ว)

---

## สถานะล่าสุด (commit ล่าสุด: `ec0badb`)

Working tree สะอาด — ทุกอย่าง commit แล้ว ไม่มีค้าง

### สิ่งที่ทำเสร็จในรอบล่าสุด
1. **Advanced UI/UX redesign** ของ Landmark List/Card ตามมาตรฐาน `.claude/skills/advanced-mobile-uiux/SKILL.md`:
   - Bento/Magazine card (16:9 ภาพ, gradient overlay, pill category badge, shimmer skeleton, haptics, bounce feedback)
   - Card/Map view toggle ใน `LandmarkList.tsx` (แผนที่ไม่ render ใน fold แรกอีกต่อไป)
   - Component ใหม่: `src/components/PressableScale.tsx`, `src/components/ShimmerBlock.tsx`, `src/components/LandmarkCard.tsx`, `src/components/GlobalSearchBar.tsx`
   - Design tokens ใหม่ใน `src/theme.ts`: `SPACING`, `RADIUS`, `SHADOWS`, `CATEGORY_COLORS`, `FALLBACK_LANDMARK_IMAGE`

2. **Bug fix US-25 (T87-T89)**: แยก "จังหวัดยังไม่มีข้อมูล Landmark" (ตั้งใจ) ออกจาก "ดึงข้อมูล Wikipedia ล้มเหลวจริง" (บั๊ก) — ตอนนี้มี error state ที่มองเห็นได้จริงพร้อมปุ่มลองใหม่ ใน `src/components/LandmarkList.tsx` + `src/services/wikipediaService.ts` throw error จริงเมื่อ fetch ล้มเหลวทุก category

3. **Bug fix: Photo upload 400/HEIC**: `src/sync/photoUpload.ts` เปลี่ยนจาก `fetch(uri).blob()` (ไม่เสถียรบน iOS) เป็น `expo-file-system`'s `readAsStringAsync(base64)` + `base64-arraybuffer` decode — dependency ใหม่ที่ติดตั้งแล้ว: `expo-file-system`, `base64-arraybuffer`, `expo-haptics`, `expo-linear-gradient`

4. Pipeline เต็มรูปแบบ (BA→PM→Programmer→Tester→QA) รันผ่าน US-25 แล้ว **QA verdict: PASS** (ดู `docs/qa-result.md` หัวข้อ "รอบ 6")

### ผลทดสอบล่าสุด (ก่อน commit)
- `npx tsc --noEmit -p .` — ผ่าน
- `npx jest` — **47/47 suites ผ่าน, 245 passed + 1 skip เดิม** (รันซ้ำ 2 รอบยืนยันเสถียร ไม่มี flaky จากรอบนี้)

---

## เอกสารอ้างอิงหลัก (อ่านตามลำดับถ้าจะทำงานต่อ)
- `docs/requirements.md` — user stories ทั้งหมด (US-1 ถึง US-25) + AC
- `docs/tasks.md` — task list ทั้งหมด (T1 ถึง T89) + คำตัดสิน PM ทุกประเด็น (18 ประเด็น)
- `docs/design-spec.md` — design spec สะสมทุกรอบ รวมรอบล่าสุด "Advanced UI/UX v3"
- `docs/dev-notes.md` — บันทึกการ implement ของ programmer ทุกรอบ รวม "รอบ 7" (redesign + bug fixes ล่าสุด)
- `docs/test-report.md`, `docs/qa-result.md` — ผลทดสอบ/QA สะสมทุกรอบ

**Convention สำคัญ**: เอกสารทุกไฟล์ใน `docs/` เป็นแบบสะสม (append รอบใหม่ต่อท้าย ไม่เขียนทับ) — ถ้าจะแก้ไฟล์เหล่านี้ ให้ใช้ Edit (แทรก/ต่อท้าย) ไม่ใช่ Write ทับทั้งไฟล์ เพื่อรักษาประวัติทุกรอบก่อนหน้า

---

## ของที่ยังไม่ได้ทำ / ข้อเสนอแนะสำหรับรอบถัดไป

จาก `docs/design-spec.md` ("ข้อเสนอแนะสำหรับรอบถัดไป" ท้ายรอบ v2/v3):
1. **ยังไม่ได้ redesign HomeScreen (แผนที่ 3 มิติ)** และหน้า Stats/Settings ให้เป็น Advance UI ระดับเดียวกับ Landmark List — ขอบเขตรอบที่แล้วจำกัดเฉพาะ Landmark List/Card/Search
2. **Province Master badge ยังไม่ผูก haptic** `Haptics.notificationAsync(NotificationFeedbackType.Success)` ตาม SKILL.md 3.2 (ตัวอย่างสุดท้าย) — เสนอให้ทำพร้อม badge animation ที่มีอยู่แล้ว (`ProvinceMasterBadge.tsx`, T46)
3. **PhotoPicker.tsx** ยังไม่ได้ตรวจ thumb-zone ergonomics / shimmer loading ตามมาตรฐาน advance
4. Technical debt: `src/__tests__/qa-round2/emailLinkIntegrity.test.tsx` และ `migrationNonBlocking.test.tsx` เป็น **pre-existing flaky test** (fail เป็นบางครั้งตอนรันรวมทั้งชุด, ผ่าน 100% เวลารันแยกไฟล์เดี่ยว) — ไม่เกี่ยวกับโค้ดที่แก้ในรอบล่าสุด แต่ควรหา root cause จริงถ้ามีเวลา (ดูรายละเอียดใน `docs/dev-notes.md` "รอบ 7")

## บทเรียน/กับดักที่เจอ (ห้ามลืมถ้าจะแก้ test ที่เกี่ยวกับ LandmarkList/LandmarkMap อีก)
เขียนไว้ละเอียดใน `docs/dev-notes.md` "รอบ 7" ข้อ 3 — สรุปสั้นๆ: การกด state-changing press หลายครั้งติดกันใน React Testing Library โดยไม่มี `await waitFor(...)` คั่นระหว่างกลาง อาจทำให้ press ครั้งถัดไปดูเหมือนไม่มีผล (ไม่ใช่บั๊กจริงของแอป ยืนยันด้วย debug log แล้วว่า data layer ถูกต้อง 100%) — แก้ด้วยการรอ assert สถานะที่ไม่คลุมเครือ (เช่น `.props.accessibilityState.selected`) ทันทีหลังทุก press ก่อน press ถัดไป

---

## วิธีเริ่มงานต่อ (checklist)
1. `git log --oneline -5` และ `git status` — เช็คว่ามีคน/agent อื่นแก้อะไรเพิ่มหรือยัง
2. `npx jest --silent` — รันเทสต์เต็มชุดก่อนเริ่มแก้อะไร ให้แน่ใจว่ายัง 47/47 ผ่าน (baseline)
3. อ่าน `docs/tasks.md` หัวข้อ "## P1 (ควรมี)" / "## P2 (ดีถ้ามี)" ถ้าต้องการ task ที่ยังไม่ทำ
4. ถ้าจะสั่งงานแบบ full pipeline (BA→PM→Programmer→Tester→QA) ให้ใช้ `/full-stack-agent <โจทย์>`
5. ถ้าจะสั่งงานเฉพาะ UI/UX ให้ใช้ `/uiux <โจทย์>` (จะอ่าน `.claude/skills/advanced-mobile-uiux/SKILL.md` ให้อัตโนมัติ)
