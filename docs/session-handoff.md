# Session Handoff — สำหรับกลับมาทำงานต่อ

อัปเดตล่าสุด: 2026-09-13 (commit ล่าสุดตอนเขียน: หลัง "Advanced UI/UX v4 — HomeScreen/StatsScreen/SettingsScreen redesign", ยังไม่ commit — ดู `git log`/`git status` เพื่อความชัวร์)

หมายเหตุ: ไฟล์นี้เป็น **snapshot** ของสถานะ ณ ตอนที่เขียน (เขียนทับรอบใหม่ทุกครั้ง ไม่ใช่ append) ถ้ากลับมาทำงานต่อแล้วพบว่าโค้ด/docs ไม่ตรงกับที่ระบุไว้ ให้เชื่อโค้ดจริง/`git log`/`git status` มากกว่าไฟล์นี้เสมอ

---

## สถานะล่าสุด

Working tree มีการแก้ไขที่**ยังไม่ commit** จากรอบ "Advanced UI/UX v4" (HomeScreen/StatsScreen/SettingsScreen redesign) — ให้ commit ก่อนเริ่มงานใหม่ถ้ายังไม่ได้ทำ

### สิ่งที่ทำเสร็จแล้ว (สะสมทุกรอบ)
1. **Landmark List/Card redesign (v2/v3)**: Bento/Magazine card (16:9, gradient, pill badge, shimmer, haptics, bounce), card/map view toggle — component ใหม่: `PressableScale.tsx`, `ShimmerBlock.tsx`, `LandmarkCard.tsx`, `GlobalSearchBar.tsx`; tokens ใหม่ใน `theme.ts`: `SPACING`/`RADIUS`/`SHADOWS`/`CATEGORY_COLORS`/`FALLBACK_LANDMARK_IMAGE`
2. **Bug fix US-25 (T87-T89)**: แยก "จังหวัดยังไม่มีข้อมูล" ออกจาก "Wikipedia fetch ล้มเหลวจริง" พร้อม error state + retry — QA verdict: **PASS**
3. **Bug fix: Photo upload 400/HEIC**: เปลี่ยนจาก `fetch(uri).blob()` เป็น `expo-file-system` base64 + `base64-arraybuffer` decode
4. **HomeScreen/StatsScreen/SettingsScreen redesign (v4, ล่าสุด — ยังไม่ commit)**: Bento stat-tile grid ใน Stats, elevated card ใน Settings/HeaderProgress, pill-chip Legend, `PressableScale`+haptic บนปุ่มโต้ตอบทั้งหมดรวม `EmptyState`/`EntryListItem` (shared component) — **ไม่ได้แตะ `Map3D.tsx`/`ProvinceTile3D.tsx`** (นอกขอบเขต, ความเสี่ยงสูง)

### ผลทดสอบล่าสุด
- `npx tsc --noEmit -p .` — ผ่าน
- `npx jest --runInBand` — **47/47 suites ผ่าน, 245 passed + 1 skip เดิม**
- **ข้อควรระวัง**: ถ้ารัน `npx jest` แบบ parallel (default) แล้วเจอ suite fail ด้วย `Exceeded timeout of 5000ms` หลายไฟล์พร้อมกัน อย่าเพิ่งตกใจว่าพัง — เครื่องนี้เคยมี load สูงจนเกิด false-positive แบบนี้มาแล้ว ให้รันไฟล์ที่ fail แยกเดี่ยว หรือรัน `npx jest --runInBand` (serial) ก่อนสรุปว่าเป็นบั๊กจริง

---

## เอกสารอ้างอิงหลัก (อ่านตามลำดับถ้าจะทำงานต่อ)
- `docs/requirements.md` — user stories ทั้งหมด (US-1 ถึง US-25) + AC
- `docs/tasks.md` — task list ทั้งหมด (T1 ถึง T89) + คำตัดสิน PM ทุกประเด็น (18 ประเด็น)
- `docs/design-spec.md` — design spec สะสมทุกรอบ รวมรอบล่าสุด **"Advanced UI/UX v4"**
- `docs/dev-notes.md` — บันทึกการ implement ทุกรอบ รวม **"รอบ 8"** (v4 redesign ล่าสุด)
- `docs/test-report.md`, `docs/qa-result.md` — ผลทดสอบ/QA สะสมทุกรอบ (ยังหยุดที่รอบ US-25 — รอบ v2/v3/v4 เป็นงาน UI ที่ทำนอก pipeline โดยตรงตามคำขอผู้ใช้ ไม่ได้ผ่าน tester/QA agent แยก)

**Convention สำคัญ**: เอกสารทุกไฟล์ใน `docs/` (ยกเว้นไฟล์นี้) เป็นแบบสะสม (append รอบใหม่ต่อท้าย ไม่เขียนทับ) — ใช้ Edit ไม่ใช่ Write ทับทั้งไฟล์ ไฟล์นี้ (`session-handoff.md`) เป็นข้อยกเว้น — เขียนทับใหม่ทุกรอบได้เลย เพราะเป็น snapshot ไม่ใช่ประวัติสะสม

---

## ของที่ยังไม่ได้ทำ / ข้อเสนอแนะสำหรับรอบถัดไป
1. **Map3D.tsx / ProvinceTile3D.tsx** ยังไม่ได้ redesign เลย (แผนที่ 3 มิติหน้า Home) — ควรแยกเป็นรอบเฉพาะเพราะเป็น SVG/3D transform ซับซ้อน มี test coverage เยอะ (`map3d.test.tsx`, `map2dValidationScreen.test.tsx`)
2. **Province Master badge** ยังไม่ผูก haptic `Haptics.notificationAsync(NotificationFeedbackType.Success)` ตาม SKILL.md 3.2
3. **PhotoPicker.tsx** ยังไม่ได้ตรวจ thumb-zone/shimmer ตามมาตรฐาน advance
4. **EmailLinkForm.tsx** ยังไม่ได้ยกระดับในรอบไหนเลย
5. Technical debt: `emailLinkIntegrity.test.tsx` และ `migrationNonBlocking.test.tsx` เคย fail เป็นบางครั้งตอนรันรวมแบบ parallel มาก่อน (อาจเป็น pre-existing flaky หรือ system-load false-positive — ยังไม่ได้หา root cause จริงจัง)

## บทเรียน/กับดักที่เจอ (สำคัญ — อ่านก่อนแก้ test เกี่ยวกับ state-changing UI)
1. **React Testing Library + state-changing press ติดกันหลายครั้ง**: การกด press ที่เปลี่ยน state ติดกันหลายครั้งในเทสต์เดียวโดยไม่มี `await waitFor(...)` คั่นกลาง (โดยเฉพาะครั้งแรกหลัง mount) อาจทำให้ press ครั้งถัดไปดูเหมือนไม่มีผล (ไม่ใช่บั๊กจริงของแอป — ยืนยันด้วย debug log แล้วว่า data layer ถูกต้อง 100%) แก้ด้วยการ `await waitFor(...)` เช็คสถานะที่ไม่คลุมเครือ (เช่น `.props.accessibilityState.selected`) ทันทีหลังทุก press ก่อน press ถัดไป (รายละเอียด: `docs/dev-notes.md` รอบ 7)
2. **Jest parallel run บนเครื่อง load สูง** อาจทำให้เทสต์ timeout (5000ms) แบบ false-positive หลายไฟล์พร้อมกัน — ให้ `--runInBand` หรือรันไฟล์เดี่ยวก่อนสรุปว่าพัง (รายละเอียด: `docs/dev-notes.md` รอบ 8)

---

## วิธีเริ่มงานต่อ (checklist)
1. `git log --oneline -5` และ `git status` — เช็คว่ามีอะไรค้าง/ใครแก้เพิ่มหรือยัง (ถ้ามีการแก้ไขค้างจากรอบ v4 ให้พิจารณา commit ก่อน)
2. `npx jest --runInBand` — รันเทสต์เต็มชุดแบบ serial ก่อนเริ่มแก้อะไร ให้แน่ใจว่ายัง 47/47 ผ่าน (baseline)
3. อ่าน "ของที่ยังไม่ได้ทำ" ด้านบน หรือ `docs/tasks.md` หัวข้อ "## P1 (ควรมี)" / "## P2 (ดีถ้ามี)" ถ้าต้องการ task อื่น
4. ถ้าจะสั่งงานแบบ full pipeline (BA→PM→Programmer→Tester→QA) ให้ใช้ `/full-stack-agent <โจทย์>`
5. ถ้าจะสั่งงานเฉพาะ UI/UX ให้ใช้ `/uiux <โจทย์>` (จะอ่าน `.claude/skills/advanced-mobile-uiux/SKILL.md` ให้อัตโนมัติ)
