# Session Handoff — สำหรับกลับมาทำงานต่อ

อัปเดตล่าสุด: 2026-09-18 (หลัง "รอบ 18 — Color Palette & Layout Redesign เฟส 2 (US-37/US-38)", ยังไม่ commit — ดู `git log`/`git status` เพื่อความชัวร์)

หมายเหตุ: ไฟล์นี้เป็น **snapshot** ของสถานะ ณ ตอนที่เขียน (เขียนทับรอบใหม่ทุกครั้ง ไม่ใช่ append) ถ้ากลับมาทำงานต่อแล้วพบว่าโค้ด/docs ไม่ตรงกับที่ระบุไว้ ให้เชื่อโค้ดจริง/`git log`/`git status` มากกว่าไฟล์นี้เสมอ

---

## สถานะล่าสุด

Working tree มีการแก้ไขที่**ยังไม่ commit สะสมตั้งแต่รอบ 9 ถึงรอบ 18** — แนะนำให้ commit เป็น checkpoint ก่อนเริ่มงานใหม่ (ยังไม่ commit เพราะไม่มีใครสั่งให้ commit ชัดเจนในเซสชันนี้)

### Epic ปัจจุบัน: "Color Palette & Layout Redesign" (US-35 ถึง US-38)
- **เฟส 1 (US-35 Decision Gate + US-36 HomeScreen)**: **เสร็จและผ่าน QA แล้ว** (`docs/qa-result.md` รอบ 16 FAIL ครั้งเดียวเรื่อง contrast ลิงก์ "สถิติ" → แก้แล้ว → รอบ 17 verify **PASS with notes**) โทนสีที่เลือกคือ **"Deep Jade"** (accent `#15A87A`/`accentDark #0B5C46`, background `#F6F9F7`) กำหนดไว้ที่จุดเดียวใน `src/theme.ts`
- **เฟส 2 (US-37 หน้าจอที่เหลือ + US-38 Visual QA)**: **ทำ P0 ครบแล้วในรอบนี้ (รอบ 18)** — `docs/qa-result.md` รอบ 18 **PASS with notes**
  - Programmer สลับ `COLORS` token + ปรับ layout ใน 6 ไฟล์: `ProvinceDetailScreen.tsx`, `AddEntryScreen.tsx` (ได้ layout spec ใหม่จาก UIUX ด้วย เพราะไม่เคย redesign มาก่อน), `LandmarkCard.tsx`, `StatsScreen.tsx`, `SettingsScreen.tsx`, `NewsCard.tsx`
  - เพิ่ม automated hex-guard test ใหม่ `src/__tests__/theme/noHardcodedHexPhase2.test.ts` (T140)
  - **ค้าง (P1, ไม่ block, ต้องทำก่อนปิด epic ทั้งหมด 100%)**:
    1. **T144 — ต้องรอผู้ใช้จริงเปิดแอปเองอย่างน้อย 1 รอบ** ยืนยันว่า "แอปเปลี่ยนไปจริง ดู advance ขึ้น" (US-38 AC4) — ไม่มีระบบอัตโนมัติแทนได้
    2. T141 — screenshot ก่อน/หลังครบทุกหน้าจอหลัก (US-38 AC1) — ไม่มี runtime/อุปกรณ์จริงในสภาพแวดล้อมนี้ให้ทำได้
    3. [P2] `src/components/NewsErrorState.tsx` ยังมี `#FFFFFF` hardcode 2 จุด (บรรทัด 32, 58) — ไม่อยู่ใน scope ของ T138 เดิม รอ PM ตัดสินใจขยาย scope หรือไม่

### หมายเหตุสำคัญเรื่อง sub-agent pipeline (full-stack-agent skill)
ในเซสชันนี้ sub-agent `pm`/`uiux`/`tester`/`qa` (ทุกตัวมีแค่เครื่องมือ **Write** ไม่มี **Edit**) **ล้มซ้ำหลายครั้งด้วย API error "output เกิน 64000 token"** ตอนพยายามเขียนทับไฟล์เอกสารสะสมที่มีอยู่แล้ว (`docs/tasks.md`, `docs/test-report.md`, `docs/qa-result.md`) แม้ปรับ prompt ให้กระชับที่สุดแล้วก็ตาม — เป็นปัญหาเชิงระบบ ไม่ใช่ปัญหาของ prompt orchestrator จึงต้องทำหน้าที่ PM/UIUX/Tester/QA เองโดยตรงในรอบ 18 (มีแค่ `programmer` sub-agent ที่ทำงานได้ปกติเพราะมีเครื่องมือ Edit) **ถ้าจะเรียก pipeline เต็มรูปแบบต่อในรอบถัดไป ให้ระวังปัญหานี้ไว้ก่อน** — อาจต้องพิจารณาให้ orchestrator ทำหน้าที่แผนกที่มีปัญหาแทน หรือแก้ tool list ของ agent เหล่านั้นให้มี Edit เพิ่ม (นอก scope ของ session นี้ที่จะแก้ config agent เอง)

### ผลทดสอบล่าสุด (รอบ 18)
- `npx tsc --noEmit -p .` — ผ่านสะอาด
- `npx jest` — **84/84 suites ผ่าน, 487 passed + 1 skip, 0 failed** (ตรวจสอบอิสระเอง 2 รอบ ไม่ใช่แค่เชื่อรายงาน programmer)

---

## เอกสารอ้างอิงหลัก (อ่านตามลำดับถ้าจะทำงานต่อ)
- `docs/requirements.md` — user stories ทั้งหมด (US-1 ถึง US-38) + AC (US-37/US-38 AC บางข้อยัง `[ ]` ค้างเพราะเป็น manual step — ดูด้านบน)
- `docs/tasks.md` — task list ทั้งหมด (T1 ถึง T144) + คำตัดสิน PM ทุกประเด็น (28 ประเด็น) — รอบล่าสุดคือ "## รอบ 18: Color Palette & Layout Redesign — เฟส 2"
- `docs/design-spec.md` — design spec สะสมทุกรอบ รวมรอบล่าสุด "Layout Redesign Spec: ProvinceDetailScreen + AddEntryScreen (T132, เฟส 2 US-37)"
- `docs/dev-notes.md` — บันทึกการ implement ทุกรอบ รวม **"รอบ 18 — Phase 2 US-37"** (ล่าสุด)
- `docs/test-report.md`, `docs/qa-result.md` — ผลทดสอบ/QA สะสมทุกรอบ รวมรอบ 18 (ล่าสุด, PASS with notes)

**Convention สำคัญ**: เอกสารทุกไฟล์ใน `docs/` (ยกเว้นไฟล์นี้) เป็นแบบสะสม (append รอบใหม่ต่อท้าย ไม่เขียนทับ) — ใช้ Edit ไม่ใช่ Write ทับทั้งไฟล์ ไฟล์นี้ (`session-handoff.md`) เป็นข้อยกเว้น — เขียนทับใหม่ทุกรอบได้เลย เพราะเป็น snapshot ไม่ใช่ประวัติสะสม

---

## ของที่ยังไม่ได้ทำ / ข้อเสนอแนะสำหรับรอบถัดไป
1. **รอผู้ใช้เปิดแอปจริงยืนยัน (T144, US-38 AC4)** — ขั้นตอนสุดท้ายก่อนปิด epic "Color Palette & Layout Redesign" ทั้งหมด (US-35-US-38) อย่างสมบูรณ์ 100%
2. [P2] แก้ `NewsErrorState.tsx` hex เดิม 2 จุด (`#FFFFFF` → `COLORS.textOnDark`) ถ้าต้องการ zero-hex ครบ 100% ทั้งแอป — แก้ไม่ยาก
3. ประเด็นค้างเก่าที่ไม่เกี่ยวกับ redesign epic นี้ (ดู `docs/qa-result.md` ท้ายแต่ละรอบสำหรับรายละเอียด): Cache Indicator P1 (รอบ 8), scope ambiguity `ProvinceMasterBadge` vs progress indicator (รอบ 5), dead code `LandmarkCardGrid.tsx`, flaky `AuthContext`/`CheckinContext` test, ปุ่ม `EmptyState` variant (รอบ 9), hero stat line-wrap + `mapCanvasBg` tint (รอบ 16/17)
4. ถ้าไม่มีโจทย์ใหม่ ให้ดู `docs/tasks.md` หัวข้อ "## P2 (ดีถ้ามี)" เดิม

## บทเรียน/กับดักที่เจอ (สำคัญ)
1. **React Testing Library + state-changing press ติดกันหลายครั้ง**: ต้อง `await waitFor(...)` คั่นกลางทุกครั้งหลัง press ที่เปลี่ยน state ก่อน press ถัดไป (รายละเอียด: `docs/dev-notes.md` รอบ 7)
2. **Jest parallel timeout บนเครื่อง CPU เยอะ ≠ ต้องเพิ่ม testTimeout**: จำกัด `maxWorkers` แทน (แก้แล้วรอบ 9 ด้วย `maxWorkers: 4` ใน `package.json`)
3. **sub-agent ที่มีแค่ Write tool (ไม่มี Edit) เสี่ยงล้มด้วย output-token-limit เวลาต้องเขียนทับไฟล์สะสมที่ใหญ่ขึ้นเรื่อยๆ** (`pm`/`uiux`/`tester`/`qa` ใน `.claude/agents/`) — เจอครั้งแรกในรอบ 18 (ดูรายละเอียดหัวข้อด้านบน)

---

## วิธีเริ่มงานต่อ (checklist)
1. `git log --oneline -5` และ `git status` — เช็คว่ามีอะไรค้าง (มีงานสะสมตั้งแต่รอบ 9-18 ที่ยังไม่ commit)
2. `npx jest` — ให้แน่ใจว่ายัง 84/84 suites ผ่าน (baseline ล่าสุด)
3. ถามผู้ใช้ว่าเปิดแอปจริงยืนยัน US-38 AC4 (T144) แล้วหรือยัง ถ้ายัง ให้เตือนว่าเป็นขั้นตอนสุดท้ายที่เหลือของ epic นี้
4. ถ้าจะสั่งงานแบบ full pipeline (BA→PM→Programmer→Tester→QA) ให้ใช้ `/full-stack-agent <โจทย์>` — **ระวังปัญหา sub-agent Write-only ล้มที่ระบุไว้ด้านบน** ถ้าเจอซ้ำให้ orchestrator ทำหน้าที่แผนกนั้นเอง (อ่าน `.claude/agents/<role>.md` เพื่อทำตาม role/format เดิม)
5. ถ้าจะสั่งงานเฉพาะ UI/UX ให้ใช้ `/uiux <โจทย์>` (จะอ่าน `.claude/skills/advanced-mobile-uiux/SKILL.md` ให้อัตโนมัติ)
