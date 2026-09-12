# QA Result

## ผลตัดสิน: PASS with notes

## เหตุผล
- ทุก acceptance criteria ระดับ P0 (US-1 ถึง US-7, รวม T32 long-press tooltip ที่ PM เพิ่มเข้ามาใน P0 ของ US-2) มีสถานะ PASS ใน docs/test-report.md — 57/58 automated tests ผ่าน, 1 skip ที่มีเอกสารอธิบายชัดเจนว่าเป็นข้อจำกัดสภาพแวดล้อมทดสอบ (jest ไม่ forward `onLongPress` ของ react-native-svg ได้) ไม่ใช่ฟีเจอร์พัง — ยืนยันด้วยการตรวจโค้ดแทนว่าโครงสร้างตรงตาม design-spec.md
- ไม่พบบั๊ก High severity ในระบบ ไม่มี P0 AC ข้อใด FAIL
- พบบั๊ก 1 จุด (BUG-1: `formatThaiDate` แสดงวันที่ผิดบนอุปกรณ์ timezone offset ติดลบ) จากการตรวจโค้ดของ Tester — เป็นบั๊กจริง (โค้ด parse เป็น UTC แต่ read กลับด้วย local-time getters) แต่ไม่กระทบ AC ใดของ P0 โดยตรง เพราะ requirements.md ไม่มีข้อกำหนดเรื่อง timezone และ target market ของแอป (ผู้ใช้ไทย, เครื่องตั้งเวลา Asia/Bangkok = UTC+7 ซึ่งเป็น positive offset) ไม่โดนผลกระทบเลย — จัดเป็น P1 (ควรแก้ก่อน release จริงเพราะกระทบความถูกต้องของข้อมูลที่แสดง หากมีผู้ใช้ที่ตั้งเครื่อง/เดินทางไปโซนลบ) ไม่ใช่ P0 จึงไม่ทำให้ผลตัดสินเป็น FAIL
- T30 (perf บนอุปกรณ์สเปคต่ำ) และ T31 (icon/splash ยังเป็นค่า default) เป็น task ระดับ P2 ทั้งคู่ ไม่ใช่ P0/P1 — ยังไม่เสร็จ แต่ทั้งสองข้อเป็นข้อจำกัดของสภาพแวดล้อมการทำงาน (ไม่มี device/emulator จริง, ไม่มีความสามารถ generate raster image ในสภาพแวดล้อมนี้) ไม่ใช่ backlog ที่ programmer แก้ไขต่อในสภาพแวดล้อมเดียวกันได้ จึงไม่นับเป็นเหตุ FAIL แต่ต้องแจ้งผู้ใช้ให้ทราบก่อนตัดสินใจปล่อยจริง

## Root cause / การจัดหมวดของแต่ละประเด็น (ไม่มีข้อไหนเป็นเหตุ FAIL แต่ต้อง track)

1. **[P1] BUG-1: `formatThaiDate` วันที่คลาดเคลื่อน 1 วันบน timezone offset ติดลบ** — อ้างอิง: test-report.md "บั๊กที่พบ" BUG-1, กระทบฟิลด์ date ที่ US-4/US-5/US-6 แสดงผล
   - Root cause: **โค้ด** — จุดนี้ไม่ใช่ AC คลุมเครือ เป็น implementation bug ที่ระบุ fix ได้ชัดเจน (`new Date('YYYY-MM-DD')` parse เป็น UTC midnight แต่โค้ดอ่านกลับด้วย `getDate()/getMonth()/getFullYear()` local-time แทนที่จะใช้ `getUTCDate()/getUTCMonth()/getUTCFullYear()`) — reproduce ได้แน่นอน ไม่ขึ้นกับการตีความ spec
   - ส่งกลับ: **programmer** (แก้ที่ `src/utils/derived.ts`, `formatThaiDate`) — ไม่จำเป็นต้องบล็อกรอบนี้เพราะไม่ใช่ P0 แต่แนะนำให้แก้ในรอบถัดไปก่อนขยายตลาดนอกไทยหรือก่อน publish บน store ที่อาจโดน emulator/reviewer ตั้ง timezone อื่นตรวจ

2. **[P2] T30 ไม่ได้ทำ perf testing บนอุปกรณ์สเปคต่ำจริง** — อ้างอิง: tasks.md T30, dev-notes.md, test-report.md coverage gap #1
   - Root cause: ไม่เข้าเกณฑ์ 3 หมวด (โค้ด/requirement/design) ตรงๆ — เป็น**ข้อจำกัดเครื่องมือ/สภาพแวดล้อม** (ไม่มี Android/iOS device หรือ emulator ให้ใช้งานได้เลยตลอด pipeline นี้ ทั้งฝั่ง programmer และ tester ยืนยันตรงกัน) โค้ดได้ทำ mitigation เชิงโครงสร้างแล้ว (memo/isolate re-render ตามที่ design-spec.md ประเด็น 2 แนะนำ)
   - ส่งกลับ: ไม่มีใครแก้ต่อได้ในสภาพแวดล้อมนี้ — เสนอ**ผู้ใช้ตัดสินใจ**ว่าจะ (ก) ยอมรับความเสี่ยงนี้และปล่อยแบบมีข้อจำกัดที่บันทึกไว้ หรือ (ข) จัดหาอุปกรณ์/บริการทดสอบภายนอก (เช่น cloud device farm) ก่อน release จริง

3. **[P2] T31 app icon/splash ยังเป็นค่า default ของ Expo ไม่ใช่ solid-color ตาม "คำตัดสิน PM ข้อ 4"** — อ้างอิง: tasks.md T31, test-report.md coverage gap #2
   - Root cause: การตัดสินใจ (AC) ของ PM ถูกต้องและชัดเจนอยู่แล้ว ("ใช้สีธีมหลัก #1D9E75/#0F6E56 solid + สัญลักษณ์/ตัวอักษรพื้นฐาน") ไม่ใช่ requirement คลุมเครือ ไม่ใช่โค้ดผิด ไม่ใช่ design ที่ใช้งานไม่ได้ — เป็น**ข้อจำกัดเครื่องมือ/สภาพแวดล้อม**ล้วนๆ (ไม่มีความสามารถ generate/export ไฟล์ raster image ในสภาพแวดล้อมนี้)
   - ส่งกลับ: ไม่มีใครแก้ต่อได้ด้วยเครื่องมือชุดนี้ — เสนอ**ผู้ใช้ตัดสินใจ**ว่าจะ (ก) สร้างไฟล์ icon/splash เองนอกสภาพแวดล้อมนี้ (เช่น ใช้ image editor ธรรมดาทำ solid-color PNG ตามสเปคที่ PM ให้ไว้แล้ว ใช้เวลาไม่กี่นาที) แล้วนำมาวางแทนไฟล์ default ใน `assets/` หรือ (ข) ยอมรับ default Expo icon ไปก่อนใน v1 นี้แล้วตามแก้ทีหลัง

## หมายเหตุสำหรับผู้ใช้ (กรณี PASS with notes)
- แอปพร้อมส่งมอบในแง่ฟังก์ชันหลักทั้งหมด (P0 ครบ, P1 เกือบครบยกเว้น T30/T31 ที่เป็น P2 อยู่แล้ว)
- ก่อน publish จริงขึ้น store แนะนำอย่างน้อย: (1) แก้ BUG-1 ด้วยการเปลี่ยนไปใช้ UTC getters ใน `formatThaiDate` (แก้เร็ว ไม่กระทบโครงสร้างอื่น) และ (2) แทนที่ app icon/splash default ด้วยไฟล์ solid-color ตามสเปค PM ก่อน เพราะ default Expo icon จะดูไม่สมบูรณ์ในสายตาผู้ใช้ปลายทางแม้ไม่กระทบการทำงาน
- T30 (perf บนอุปกรณ์จริง) และรายการ "Coverage ที่ยังขาด" อื่นๆ ใน test-report.md (อนิเมชันจริง, tap-target precision จริง, sqlite เขียนไฟล์ดิสก์จริง) ยังไม่เคยถูกทดสอบบนอุปกรณ์จริงเลยตลอดทั้ง pipeline นี้ (ไม่มี device ให้ใช้) — เป็นความเสี่ยงคงเหลือที่ควรทดสอบ manual บนมือถือจริงอย่างน้อย 1 รอบก่อนปล่อยให้ผู้ใช้จริงใช้งาน แม้ logic ทั้งหมดถูกตรวจสอบแล้วว่าตรงตาม spec ผ่านการอ่านโค้ด

## รอบนี้คือรอบที่: 1
