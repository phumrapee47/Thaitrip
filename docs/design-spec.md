# Design Spec: Travel Journal ไทย (unlock-map app)

หมายเหตุขอบเขต: เอกสารนี้ครอบคลุมเฉพาะ task ที่ PM ทำเครื่องหมาย **[รอ design-spec]** ใน docs/tasks.md ได้แก่ T8–T10 (3D map), T12 (AddEntry form), T16 (unlock animation), T20–T21 (entry list + empty state), T23 (legend), T24/T26/T27 (stats), T28 (แก้ไข entry), T31 (icon/splash — ระบุ placeholder เพราะไม่มี AC เฉพาะ) รวม 3 หน้าจอหลักตามที่ระบุ: Home (3D Map), Province Detail + Add/Edit Entry, Stats/Overview

โทนภาพรวม: minimal, ภาษาไทย sentence case (เช่น "เพิ่มบันทึกใหม่" ไม่ใช่ "เพิ่มบันทึกใหม่ทุกคำขึ้นต้นใหญ่"), แผนที่คือพระเอกของหน้าจอ — UI รอบข้าง (header, legend, ปุ่ม) ต้องเบา ไม่แย่งพื้นที่/ความสนใจจากแผนที่

โทนสี (อ้างอิงจาก requirements):
- Locked tile: เทาอ่อน (แนะนำ #D9D9D9 top, ไม่มี side face)
- Unlocked tile: top face #1D9E75, side face #0F6E56
- Accent/CTA: ใช้โทนเดียวกับ unlocked (#1D9E75) เพื่อ consistency ระหว่าง "สิ่งที่ทำสำเร็จแล้ว" กับ "ปุ่มที่ชวนให้ทำ"

---

## User Flow: US-1 (ดูภาพรวมความคืบหน้าบนแผนที่ 3 มิติ)
1. ผู้ใช้เปิดแอป ระบบโหลดข้อมูล journal entries ทั้งหมดจาก local storage แล้วคำนวณสถานะ isVisited (entries.length > 0) ของแต่ละจังหวัดจากทั้ง 76 จังหวัด
2. ผู้ใช้เห็นหน้า Home แสดง Header Progress Bar ด้านบนสุด ("ปลดล็อกแล้ว X / 76 จังหวัด" + progress bar) ตามด้วยแผนที่ 3 มิติของทั้ง 76 จังหวัด (จังหวัดปลดล็อกเป็นบล็อกยกตัวสีเขียว, จังหวัดยังไม่ปลดล็อกเป็นแผ่นแบนสีเทา) และ Legend อธิบายสีอยู่ใต้แผนที่
3. ผู้ใช้เลื่อนดูภาพรวมทั้งแผนที่ได้ทันทีโดยไม่ต้องโต้ตอบเพิ่มเติม ตัวเลข X ในส่วนหัวตรงกับจำนวนจังหวัดที่มี entry จริงเสมอ และอัปเดตทันทีเมื่อค่าจำนวนจังหวัดปลดล็อกเปลี่ยน

## User Flow: US-2 (เปิดดูรายละเอียดจังหวัดจากแผนที่)
1. ผู้ใช้แตะ Province Tile ใดก็ได้บนแผนที่ (ไม่ว่าจะ locked หรือ unlocked)
2. ระบบ navigate ไปหน้า ProvinceDetailScreen ของ province.id ที่ตรงกับ tile ที่แตะเสมอ (tap target ครอบคลุมพื้นที่ path จริงของจังหวัดนั้น แม้จังหวัดพื้นที่เล็ก)
3. ผู้ใช้เห็นหน้ารายละเอียดจังหวัดพร้อมใช้งานได้ทันที — ถ้าจังหวัดนั้นยังไม่มี entry เลย (locked) ผู้ใช้ยังเห็นปุ่ม/ทางเข้าไปเพิ่มบันทึกแรกได้จากหน้านี้เสมอ ไม่ใช่ dead-end หรือ error

## User Flow: US-3 (อนิเมชันปลดล็อก)
1. ผู้ใช้บันทึก entry แรกสำเร็จในหน้า AddEntry แล้วกด "บันทึก"
2. ระบบปิดฟอร์มและ navigate กลับสู่หน้า Home (3D Map) โดยอัตโนมัติ
3. จังหวัดที่เพิ่งได้ entry แรกนั้นเปลี่ยนจาก flat/เทา เป็น elevated/เขียวด้วยอนิเมชัน spring/bounce ทันทีที่หน้า Home ปรากฏ (ใช้ flag "justUnlocked" เพื่อเล่นอนิเมชันเฉพาะ tile ที่เพิ่งเปลี่ยนสถานะจริงเท่านั้น) จังหวัดอื่นที่ unlocked อยู่ก่อนแล้วไม่เล่นอนิเมชันซ้ำ
4. ตลอดเวลาแผนที่ยังคงอยู่ในกรอบเอียง (rotateX ประมาณ 30–40 องศา) เหมือน state ปกติ ไม่ใช่มุมมองพิเศษเฉพาะตอนอนิเมชัน

## User Flow: US-4 (เพิ่มบันทึกทริปใหม่)
1. ผู้ใช้อยู่ในหน้า ProvinceDetailScreen ของจังหวัดหนึ่ง กดปุ่ม "+ เพิ่มบันทึกใหม่"
2. ระบบเปิดฟอร์ม AddEntry (แนะนำ: modal/full-screen push พร้อม header "จังหวัด <nameTh>") พร้อมฟิลด์ date (default = วันนี้), title (ว่าง), notes (ว่าง), photos (ว่าง), tags (ยังไม่เลือก)
3. ผู้ใช้กรอก title และ date (บังคับ) พร้อม notes/เลือกรูปผ่าน expo-image-picker/เลือก tags ตามต้องการ (ทั้งหมด optional) แล้วกด "บันทึก"
4. ถ้า title หรือ date ว่าง ระบบแสดง inline error ใต้ฟิลด์นั้นทันที ไม่ปิดฟอร์ม ให้ผู้ใช้แก้ไขแล้วกดบันทึกใหม่ได้
5. บันทึกสำเร็จ: entry ใหม่ถูกเขียนลง local storage (expo-sqlite) ผูกกับ provinceId ทันที ฟอร์มปิดและ navigate กลับไปหน้า ProvinceDetailScreen เดิมที่เห็น entry ใหม่ปรากฏในรายการทันที — ถ้าเป็น entry แรกของจังหวัดนั้น สถานะจังหวัดเปลี่ยนเป็น unlocked ทันที ต่อด้วย flow US-3 (อนิเมชันปลดล็อก) เมื่อกลับไปหน้า Home

## User Flow: US-5 (ดูรายการบันทึกของจังหวัด)
1. ผู้ใช้เปิดหน้า ProvinceDetailScreen ของจังหวัดหนึ่ง (จาก flow US-2)
2. ผู้ใช้เห็นชื่อจังหวัด (nameTh) เป็นหัวข้อหลัก ตามด้วยรายการ entry ทั้งหมดของจังหวัดนั้นเรียงจากวันที่ล่าสุดไปเก่าสุด แต่ละแถวแสดง thumbnail รูปแรก (ถ้ามี), title, date
3. ถ้าจังหวัดนั้นยังไม่มี entry เลย ผู้ใช้เห็น Empty State (Province Detail) แทน list พร้อมปุ่มชวนเพิ่มบันทึกแรกทันที

## User Flow: US-6 (ดูภาพรวมสถิติ)
1. ผู้ใช้เข้าหน้า Stats/Overview (จาก entry point บนหน้า Home)
2. ผู้ใช้เห็น Stats Summary Card สรุปจำนวนจังหวัดที่ unlocked (X/76), จำนวน entry ทั้งหมด, และภาคที่ไปเยือนมากที่สุด ตามด้วย Stats Timeline แสดง entry ทั้งหมดจากทุกจังหวัดเรียงล่าสุดไปเก่าสุด ระบุจังหวัดของแต่ละรายการ
3. ถ้ายังไม่มี entry ใดๆ เลยในระบบ ผู้ใช้เห็น Empty State (Stats) แทนทั้ง Summary Card และ Timeline ป้องกันค่าที่ไม่มีความหมาย เช่น NaN/undefined

## Components

### Header Progress Bar (T10)
- Purpose: บอกความคืบหน้ารวมของการปลดล็อกทั้ง 76 จังหวัด อยู่เหนือแผนที่ 3 มิติบนหน้า Home
- States:
  - loading: skeleton bar เทาจางระหว่างอ่านข้อมูล entries ครั้งแรก
  - success: ข้อความ "ปลดล็อกแล้ว X / 76 จังหวัด" + progress bar เติมสีตามสัดส่วน X/76 อัปเดตแบบ real-time ทันทีที่ X เปลี่ยน (ไม่ต้อง refresh หน้า)
- Content: ข้อความตัวเลข X/76, progress bar แนวนอนสีเขียว (`COLORS.accent`) บนพื้นหลังเทาอ่อน (`COLORS.trackBg`)

### 3D Map Container (T8)
- Purpose: กรอบหลักที่ render Province Tile ทั้ง 76 จังหวัดในมุมมองเอียงแบบ pseudo-3D (top face + side face ต่อ block)
- States: default เท่านั้น (กรอบเอียง rotateX ~30–40 องศาคงที่ตลอดเวลา ไม่เปลี่ยนมุมมองระหว่างใช้งาน)
- Content: Province Tile ทั้ง 76 จังหวัดตาม path data จาก `thailand-provinces.ts` จัดวางตามตำแหน่งจริงสัมพัทธ์กัน ไม่มี label ชื่อจังหวัดค้างอยู่บนแผนที่ (ดูประเด็น 1 ด้านล่างเรื่อง long-press tooltip)

### Province Tile (T9)
- Purpose: บล็อกแทนจังหวัด 1 จังหวัด แสดงสถานะ locked/unlocked ด้วยสีและความสูง
- States:
  - locked: top face สีเทาอ่อน (`COLORS.lockedTop`) แผ่นแบน ไม่มี side face มองเห็น
  - unlocked: top face สีเขียว (`COLORS.unlockedTop`) ยกตัวขึ้น พร้อม side face สีเขียวเข้ม (`COLORS.unlockedSide`) มองเห็นได้ชัดเจน
  - pressed: tap feedback เบาๆ ก่อน navigate ไปหน้า ProvinceDetailScreen
- Content: ไม่มี text label บน tile (ตาม requirement) — accessibility label เป็น nameTh + สถานะ locked/unlocked สำหรับ screen reader

### Legend (T23)
- Purpose: อธิบายความหมายของสี locked/unlocked ให้ผู้ใช้เข้าใจแผนที่โดยไม่ต้องเดา
- States: default เท่านั้น (static ไม่เปลี่ยนตาม state ข้อมูล)
- Content: swatch สีเทา + ข้อความ "ยังไม่ได้ไป", swatch สีเขียว + ข้อความ "ไปแล้ว" วางเป็นแถวแนวนอนใต้แผนที่

### Unlock Animation Controller (T16, T17)
- Purpose: ควบคุมการเล่นอนิเมชัน spring/bounce เฉพาะ Province Tile ที่เพิ่งเปลี่ยนจาก locked เป็น unlocked ตอนกลับมาหน้า Home หลังบันทึก entry แรก
- States:
  - idle: ไม่มี tile ใดอยู่ระหว่างเปลี่ยนสถานะ ไม่เล่นอนิเมชัน
  - animating: tile ที่ provinceId ตรงกับ entry ที่เพิ่งบันทึก (flag "justUnlocked") เล่นอนิเมชัน spring/bounce จาก flat/เทา เป็น elevated/เขียว ครั้งเดียว แล้วเคลียร์ flag ทันทีหลังเล่นจบ
- Content: ไม่มี UI แยกที่มองเห็นเพิ่มเติมนอกจาก Province Tile ที่กำลังอนิเมท — ต้อง isolate re-render เฉพาะ tile ที่เปลี่ยนสถานะจริง ไม่ re-render ทั้ง 76 tile พร้อมกัน (ดูประเด็น 2 ด้านล่าง)

### Province Detail Header (T18)
- Purpose: หัวข้อหน้ารายละเอียดจังหวัด
- States: default เท่านั้น (ชื่อจังหวัดคงที่ ไม่เปลี่ยนตาม state ข้อมูล)
- Content: nameTh เป็นหัวข้อหลัก (ขนาดใหญ่สุดในหน้า), ปุ่มย้อนกลับไป Home

### Entry List (T19, T20)
- Purpose: แสดงรายการบันทึกทริปทั้งหมดของจังหวัด เรียงล่าสุดก่อน
- States:
  - loading: skeleton row (2–3 แถวเทาจาง) ระหว่างอ่านจาก storage
  - empty: ไม่มี entry เลย → แสดง Empty State (Province) component แทน list ทั้งหมด
  - success: list ของ Entry List Item เรียง reverse-chronological
- Content: แต่ละแถวคือ Entry List Item

### Entry List Item (T20)
- Purpose: สรุปข้อมูล entry 1 รายการในแนวแถว ให้กดเข้าไปดู/แก้ไขได้
- States:
  - default: thumbnail (รูปแรกถ้ามี, หรือ placeholder icon กลางๆ ถ้าไม่มีรูป — ไม่ใช่ error), title, date (format ไทยอ่านง่าย เช่น "12 ก.ย. 2569")
  - pressed: tap feedback เบาๆ ก่อน navigate ไปหน้ารายละเอียด/แก้ไข entry
- Content: thumbnail, title, date, (optional) tag chip เล็กๆ ถ้ามีพื้นที่เหลือ ไม่บังคับตาม AC แต่ช่วย scan ได้เร็วขึ้น
- ดูส่วนขยายเพิ่มเติมของ component นี้ (Sync Status Badge inline) ในหัวข้อ "Sync Status Badge (T51)" ด้านล่างของเอกสาร (รอบ Landmark & Supabase)

### Empty State (Province Detail) (T21)
- Purpose: บอกผู้ใช้ว่าจังหวัดนี้ยังไม่มีบันทึก พร้อมชวนเพิ่มรายการแรกทันที (ไม่ dead-end ตาม US-2 AC)
- States: single state (ไม่มี loading/error ซ้อน เพราะเป็น state ปลายทางของ Entry List เมื่อ success + length=0)
- Content: ข้อความสั้นเป็นกันเอง เช่น "ยังไม่มีบันทึกของจังหวัดนี้" + ปุ่ม CTA เด่น "+ เพิ่มบันทึกใหม่" (ปุ่มเดียวกับปุ่มหลักบนหน้า ไม่ใช่ปุ่มซ้ำซ้อน)

### AddEntry Form (T12)
- Purpose: ฟอร์มกรอก/แก้ไขข้อมูล journal entry 1 รายการ
- States:
  - default: ฟิลด์ทั้งหมดว่าง ยกเว้น date = วันนี้
  - edit-mode (T28, ใช้ component เดียวกัน): ฟิลด์ prefill ด้วยข้อมูล entry เดิม, ปุ่มบันทึกเปลี่ยนข้อความเป็น "บันทึกการแก้ไข", header เปลี่ยนเป็น "แก้ไขบันทึก"
  - validation-error: title หรือ date ว่าง → inline error message สีแดงใต้ฟิลด์นั้น (เช่น "กรุณากรอกชื่อสถานที่") ปุ่มบันทึกยังกดได้แต่กดแล้วเด้ง error แทนการ save
  - saving: ปุ่มบันทึกเปลี่ยนเป็น disabled + loading indicator เล็กๆ ในปุ่ม ระหว่างเขียนลง sqlite (กันกดซ้ำ)
  - success: ปิดฟอร์ม navigate กลับอัตโนมัติ
- Content (ฟิลด์ตาม data model):
  - date: date picker, required, default = วันนี้
  - title: text input, required, placeholder "ชื่อสถานที่"
  - notes: multiline text input, optional, placeholder "บันทึกความทรงจำ..."
  - photos: image picker (expo-image-picker) แสดงเป็นแถวรูป thumbnail ที่เลือกแล้ว + ปุ่ม "+ เพิ่มรูป" เลือกได้หลายรูป, แต่ละรูปมีปุ่มลบ (x) เล็กมุมบนขวา
  - tags: multi-select chip แบบกดเลือกได้หลายอัน จาก set คงที่: ทะเล / ภูเขา / วัด / คาเฟ่ (และอื่นๆ ตามที่ requirement ยกตัวอย่าง — ดูหมายเหตุในส่วนข้อเสนอแนะด้านล่างเรื่อง tag set ที่ยังไม่ปิด)
- ดูส่วนขยายเพิ่มเติมของ component นี้ (field เลือก Landmark) ในหัวข้อ "AddEntry Landmark Field (T47)" ด้านล่างของเอกสาร (รอบ Landmark & Supabase) และ (ช่องค้นหา Nominatim) ในหัวข้อ "Search Place Field (T70)" (รอบ OSM Data Integration)

### Stats Summary Card (T24, T25)
- Purpose: สรุปตัวเลขภาพรวมด้านบนหน้า Stats
- States:
  - loading: skeleton ตัวเลข
  - has-data: แสดง 3 ค่า — "ปลดล็อกแล้ว X / 76 จังหวัด", "บันทึกทั้งหมด N รายการ", "ไปเยือนภาค <ชื่อภาคไทย> มากที่สุด"
  - empty (0 entries ทั้งระบบ): ไม่แสดง card นี้เต็มรูปแบบ — แทนที่ด้วย Empty State (Stats) ทั้งหน้า (ดูด้านล่าง) เพื่อเลี่ยงข้อความที่ไม่มีความหมาย เช่น "ไปเยือนภาค - มากที่สุด" เมื่อยังไม่มีข้อมูลภาคใดเลย
- Content: ตัวเลข 3 ค่าข้างต้น, ชื่อภาคแปลไทยตาม mapping ที่กำหนด (เหนือ/อีสาน/กลาง/ตะวันออก/ตะวันตก/ใต้)

### Stats Timeline (T26)
- Purpose: แสดง entry ทั้งหมดจากทุกจังหวัดเรียงล่าสุดไปเก่าสุด
- States:
  - loading: skeleton rows
  - empty: ไม่ render แยก — ถูกครอบด้วย Empty State (Stats) เดียวกับ Summary Card เพราะทั้งหน้าว่างพร้อมกัน
  - success: list ของแถว entry แต่ละแถวระบุ nameTh ของจังหวัด + title + date (รูปแบบคล้าย Entry List Item แต่เพิ่มชื่อจังหวัดเป็น label/badge เล็กๆ)
- Content: nameTh, title, date, thumbnail (ถ้ามี) ต่อรายการ

### Empty State (Stats) (T27)
- Purpose: ทดแทน Summary Card + Timeline ทั้งคู่เมื่อไม่มี entry เลยในระบบ ป้องกัน NaN/undefined/0 ที่ไม่มีความหมาย
- States: single state
- Content: ข้อความเช่น "ยังไม่มีบันทึกการเดินทางเลย เริ่มบันทึกทริปแรกได้จากแผนที่" + ปุ่ม/ลิงก์กลับไปหน้า Home (ไม่มีปุ่ม "+ เพิ่มบันทึก" ตรงนี้เพราะหน้า Stats ไม่ผูกกับจังหวัดใดจังหวัดหนึ่ง ต้องพาไปเลือกจังหวัดที่แผนที่ก่อน)

### Empty State (Home — ยังไม่มีจังหวัดปลดล็อกเลย)
- Purpose: ต้อนรับผู้ใช้ใหม่ที่เพิ่งเปิดแอปครั้งแรก โดยไม่บดบังแผนที่ 76 tile ซึ่งยังต้อง render ปกติ (ตาม AC ของ US-1 ที่ระบุว่าแผนที่ต้องแสดงครบ 76 จังหวัดเสมอ)
- States: single state (แสดงเมื่อ X=0 เท่านั้น หายไปทันทีที่ X≥1)
- Content: banner บางๆ เหนือ progress bar หรือใต้ legend เช่น "แตะจังหวัดไหนก็ได้เพื่อเริ่มบันทึกทริปแรกของคุณ" — เป็น hint ไม่ใช่ full-screen takeover

---

## ข้อเสนอแนะที่อาจขัดกับ requirement (ถ้ามี)

- ประเด็น 1: Requirement ระบุห้ามมี label จังหวัดบนแผนที่เพราะ 76 อันจะอ่านไม่ออก และ "label โชว์แค่ตอน tap/detail screen" — แต่ในทางปฏิบัติ tap จะ navigate ไปหน้า detail ทันที ผู้ใช้จึงไม่มีโอกาสเห็น label "บนแผนที่" เลยแม้แต่ตอน tap (เห็นแค่ในหน้าถัดไป) ซึ่งอาจทำให้ผู้ใช้ที่แค่อยาก "สำรวจ" ว่า tile นี้คือจังหวัดไหนโดยไม่อยากออกจากหน้าแผนที่ ทำไม่ได้เลย ต้อง tap เข้าไปทุกครั้งแล้วกดย้อนกลับ
  - ทางเลือก A (ตามที่ requirement เขียนตรงตัว): ไม่มี label ใดๆ บนแผนที่เลย tap = navigate ทันทีเท่านั้น (เรียบง่ายที่สุด ไม่ต้องมี state เพิ่ม)
  - ทางเลือก B (เสริม UX โดยไม่ขัด "ไม่มี label ค้างบนแผนที่"): เพิ่ม press-and-hold (long press) แสดง tooltip ชื่อจังหวัดลอยขึ้นชั่วคราวเหนือ tile โดยยังไม่ navigate จนกว่าจะปล่อยนิ้ว/tap สั้นๆ ต่างหาก — ยังคง "ไม่มี label ถาวรบนแผนที่" ตาม requirement แต่เพิ่ม affordance สำรวจได้ ทางเลือกนี้เพิ่ม T ใหม่เล็กน้อย (gesture handling) จึงต้องให้ PM ตัดสินใจว่าคุ้มกับ scope v1 หรือไม่
  - **อัปเดต: PM เลือกทางเลือก B แล้ว (ดู docs/tasks.md คำตัดสิน PM ข้อ 1 → T32)** ประเด็นนี้ปิดแล้ว

- ประเด็น 2: Performance ของอนิเมชัน spring/bounce กับ 76 tile บนจอเดียวกัน — requirement ต้องการเฉพาะ tile ที่เพิ่ง unlock เล่นอนิเมชัน (1 tile ต่อครั้ง) ซึ่งเบา แต่ tasks.md มี T30 (P2) ที่ยอมรับแล้วว่าอาจมีปัญหา performance บนอุปกรณ์สเปคต่ำระหว่างอนิเมชัน โดยเฉพาะถ้า 76 SVG/tile ทั้งหมด re-render พร้อมกันตอนอนิเมชันจาก state update ที่ไม่ได้ isolate เฉพาะ tile เดียว — ไม่ใช่ประเด็น UX โดยตรงแต่เป็นความเสี่ยงทางเทคนิคที่ programmer ควรทราบตอนอ่าน spec นี้: ให้ memo/isolate re-render เฉพาะ Province Tile ที่ state เปลี่ยนจริง ไม่ใช่ re-render ทั้ง container ทั้ง 76 tile ต่อครั้ง (ไม่ใช่จุดขัดแย้งที่ต้องให้ PM ตัดสิน เป็นข้อสังเกตส่งต่อโปรแกรมเมอร์)

- ประเด็น 3: Tag set สำหรับฟอร์ม AddEntry — requirement ยกตัวอย่างเพียง "เช่น ทะเล/ภูเขา/วัด/คาเฟ่" โดยไม่ได้ปิด list ว่ามีกี่แท็กทั้งหมด/แก้ไขเพิ่มเองได้หรือไม่ (เป็น business logic ที่ requirement ไม่ได้ระบุชัด จึงไม่ตัดสินใจเองตามขอบเขตหน้าที่)
  - ทางเลือก A: fixed tag set ที่ตกลงไว้ล่วงหน้า (เช่น 8-10 แท็กครอบคลุม ทะเล/ภูเขา/วัด/คาเฟ่/น้ำตก/เมือง/ธรรมชาติ/อาหาร ฯลฯ) เลือกได้หลายอัน ไม่มี custom tag
  - ทางเลือก B: fixed tag set เริ่มต้น + ผู้ใช้พิมพ์ custom tag เพิ่มเองได้ (เพิ่ม complexity ของ storage/UI แต่ยืดหยุ่นกว่า)
  - เอกสารนี้ออกแบบ UI ไว้รองรับทั้ง 2 ทาง (multi-select chip) แต่ต้องให้ PM ยืนยัน fixed list สุดท้ายและว่าอนุญาต custom tag หรือไม่ ก่อน programmer เขียน T12
  - **อัปเดต: PM เลือกทางเลือก B แล้ว (ดู docs/tasks.md คำตัดสิน PM ข้อ 3) — fixed 8 แท็ก (ทะเล/ภูเขา/วัด/คาเฟ่/น้ำตก/เมือง/ธรรมชาติ/อาหาร) + custom tag พิมพ์เพิ่มเองได้** ประเด็นนี้ปิดแล้ว ตรงกับ AddEntry Form เนื้อหาด้านบนที่อัปเดตแล้ว

- ประเด็น 4: T31 (app icon/splash) ถูกติดป้าย [รอ design-spec] ใน tasks.md แต่ไม่มี AC ใดใน requirements.md ระบุรายละเอียดภาพ/โทนสีของ icon โดยตรง (เกินขอบเขตของ UX flow/component spec) — เอกสารนี้ขอเสนอเพียงแนวทาง: ใช้โทนสีเดียวกับ unlocked tile (#1D9E75/#0F6E56) เป็นอัตลักษณ์หลัก ส่วนภาพประกอบ/ไอคอนจริงเป็นงาน visual design ที่ควรส่งต่อให้ PM ตัดสินใจเรื่อง creative direction เพิ่มเติมนอกเหนือจาก UX spec
  - **อัปเดต: PM ยืนยันแนวทางสายกลางแล้ว (ดู docs/tasks.md คำตัดสิน PM ข้อ 4) — solid background สีธีมหลัก + สัญลักษณ์/ตัวอักษรพื้นฐาน ไม่ต้อง custom illustration** ประเด็นนี้ปิดแล้ว

---

# ส่วนเพิ่มเติม: Landmark Check-in & Supabase Integration (US-8 – US-15)

หมายเหตุขอบเขต: ส่วนนี้ครอบคลุมเฉพาะ task ที่ติดป้าย **[รอ design-spec]** ในรอบ Landmark & Supabase Integration ได้แก่ T43–T46 (Landmark list/check-in/badge บน ProvinceDetailScreen), T47 (Landmark field บน AddEntryScreen), T49/T50/T54 (Settings/Profile screen: email-link + data-loss warning + error state), T51 (sync status indicator), T52–T53 (Province Master visual effect บนแผนที่ 3 มิติ + legend update) เพิ่มหน้าจอใหม่ 1 หน้า คือ **Settings/Profile Screen** ส่วนหน้าจอเดิม (Home, ProvinceDetail, AddEntry) ได้รับ component เพิ่มเติมแบบต่อยอด ไม่เปลี่ยน layout หลักที่ออกแบบไว้ใน v1 ด้านบน

โทนภาพรวมเพิ่มเติม:
- คำเตือนเรื่องข้อมูลอาจหาย (data-loss) ต้องให้ความรู้สึก "แจ้งให้ทราบ" ไม่ใช่ "ระบบผิดพลาด" — ใช้โทนสีเหลือง/ส้มอ่อน (amber, เช่น #F5A623 หรือใกล้เคียง) แทนสีแดงของ validation error เพราะไม่ใช่ error ของระบบ แต่เป็นความเสี่ยงเชิงพฤติกรรมผู้ใช้ที่ต้องรับทราบ
- เอฟเฟกต์ Province Master ใช้โทนทอง (แนะนำ #E5B93C) เพื่อสื่อ "รางวัลระดับสูงกว่า unlocked ปกติ" โดยไม่ทับกับโทนเขียว (unlocked/CTA) หรือแดง (error) ที่ใช้อยู่แล้วในระบบ
- Sync status ใช้ไอคอนขนาดเล็กเท่านั้น ไม่ใช้สีแดงกับสถานะ "รอซิงก์" (เพราะไม่ใช่ error — ข้อมูลปลอดภัยอยู่ใน local storage แล้วเสมอ) เพื่อไม่ให้ผู้ใช้ตกใจว่าข้อมูลหาย

---

## User Flow: US-8 (ดูรายการ Landmark และเช็คอิน)
1. ผู้ใช้เปิดหน้า ProvinceDetailScreen ของจังหวัดหนึ่ง (มาจาก flow US-2 เดิม)
2. ระบบดึงรายการ Landmark ของ provinceId นั้นจาก `thailand-landmarks.ts` + สถานะเช็คอินจาก local storage
3. ถ้ามีข้อมูล Landmark: ผู้ใช้เห็นส่วน "สถานที่แนะนำ" อยู่ถัดจาก Province Detail Header (เหนือปุ่ม "+ เพิ่มบันทึกใหม่" และ Entry List) แสดง progress "เช็คอินแล้ว X/Y แห่ง" ด้านบนของ list และรายชื่อ Landmark แต่ละแห่งพร้อมสวิตช์เช็คอิน
4. ผู้ใช้กดสวิตช์เช็คอินที่ Landmark หนึ่ง → ระบบ persist ทันที (optimistic, ไม่มี loading spinner เพราะเขียน local เร็ว) → progress "X/Y" อัปเดตทันที
5. ถ้าเช็คอินครบ Y/Y → ต่อด้วย flow US-9 (badge ปรากฏ) ทันทีในหน้าเดียวกัน
6. ถ้าจังหวัดนั้นไม่มีข้อมูล Landmark เลย (68 จังหวัดที่ยังไม่ curate) → ผู้ใช้เห็น Empty State (Landmarks — Not Curated) แทนส่วนนี้ทั้งหมด อ่านแล้วรู้สึกว่า "ยังไม่ได้ทำ" ไม่ใช่ "เสีย/error"

## User Flow: US-9 (ได้รับตราสัญลักษณ์ Province Master)
1. ผู้ใช้ toggle เช็คอิน Landmark สุดท้ายที่เหลือของจังหวัดจนครบ Y/Y (Y ≥ 1)
2. ระบบคำนวณสถานะ Province Master ใหม่ทันที (คำนวณสดทุกครั้งที่ toggle เปลี่ยน ไม่ cache ค่าจากอดีต)
3. ผู้ใช้เห็น Province Master Badge ปรากฏขึ้นทันทีใกล้ Province Detail Header ด้วย animation scale-in สั้นๆ (~300ms) ให้ความรู้สึกฉลอง
4. ถ้าผู้ใช้ toggle ยกเลิกเช็คอินแห่งใดแห่งหนึ่งภายหลังจนไม่ครบอีกต่อไป → badge หายไปทันที (ไม่มี animation ตอนหาย เพื่อไม่ให้รู้สึกเหมือนถูก "ลงโทษ" เพียงแค่หายเงียบๆ สอดคล้องกับข้อเท็จจริงว่าเป็นสถานะคำนวณสด)

## User Flow: US-10 (เลือก Landmark ตอนเพิ่มบันทึก — auto check-in)
1. ผู้ใช้เปิดฟอร์ม AddEntry จากจังหวัดที่มีข้อมูล Landmark (ต่อจาก flow US-4 เดิม)
2. ผู้ใช้เห็น field เพิ่มเติม "เช็คอินสถานที่ (ถ้ามี)" เป็น picker แบบ optional อยู่ต่อจาก field tags แสดงตัวเลือกเฉพาะ Landmark ของจังหวัดนั้น + ตัวเลือกเริ่มต้น "ไม่ระบุ"
3. ผู้ใช้เลือก Landmark หนึ่งแห่ง (หรือปล่อยเป็น "ไม่ระบุ") แล้วกรอกฟิลด์อื่นตามปกติ กด "บันทึก"
4. ระบบบันทึก entry ตาม flow US-4 เดิม และถ้ามีการเลือก Landmark ไว้ → อัปเดตสถานะเช็คอินของ Landmark นั้นเป็น visited โดยอัตโนมัติในพื้นหลัง (ผู้ใช้ไม่ต้องไปกดซ้ำที่ ProvinceDetailScreen)
5. ถ้าจังหวัดนั้นไม่มีข้อมูล Landmark เลย → field นี้ไม่ปรากฏในฟอร์มเลย (ซ่อนทั้งหมด ไม่ใช่ disabled — เหตุผล: การซ่อนทำให้ฟอร์มดูสะอาดกว่าสำหรับจังหวัดส่วนใหญ่ 68/76 ที่ยังไม่มีข้อมูล ซึ่งเป็นเคสส่วนมาก และ AC เปิดทางให้เลือกได้ทั้งซ่อนหรือ disabled อยู่แล้ว)

## User Flow: US-11 (Anonymous Auth + ผูก Email ภายหลัง + คำเตือนข้อมูลหาย)
1. ผู้ใช้เปิดแอปครั้งแรก (หรือไม่มี session ผูกอยู่) → ระบบสร้าง Anonymous session อัตโนมัติในพื้นหลังโดยผู้ใช้ไม่ต้องทำอะไร
2. ทันทีหลังสร้าง session สำเร็จครั้งแรก ผู้ใช้เห็น Data-Loss Warning Modal (One-Time) ปรากฏขึ้นก่อนเข้าสู่หน้า Home (บล็อกการโต้ตอบจนกว่าจะกดรับทราบ ตาม constraint ที่ PM กำหนด)
3. ผู้ใช้กด "เข้าใจแล้ว เริ่มใช้งาน" → modal ปิด เข้าสู่หน้า Home ตาม flow US-1 ปกติ ใช้งานแอปได้ทันทีโดยไม่มีอุปสรรคเพิ่มเติม (หรือกด "ผูกอีเมลตอนนี้เลย" เพื่อข้ามไปหน้า Email Link Form ทันที)
4. ต่อมาผู้ใช้เข้าหน้า Settings/Profile Screen (จาก entry point บน Home — ดู component ด้านล่าง) → เห็น Data-Loss Warning Banner (Persistent) แสดงอยู่เสมอตราบใดที่ยังเป็น anonymous พร้อมปุ่ม "ผูกอีเมลตอนนี้"
5. ผู้ใช้กดปุ่ม → เปิด Email Link Form กรอกอีเมล + รหัสผ่าน → กด "ผูกอีเมล"
6. สำเร็จ: ระบบ link เข้ากับ anonymous session เดิม, entries/check-ins เดิมยังอยู่ครบ, Settings Screen อัปเดตแสดงอีเมลที่ผูกแล้ว, Data-Loss Warning Banner หายไปถาวร (ไม่ anonymous อีกต่อไป)
7. ล้มเหลว (อีเมลซ้ำ/รหัสผ่านไม่ผ่านเงื่อนไข): ผู้ใช้เห็น Email Link Error Banner แสดงข้อความสื่อความหมายในฟอร์มเดิม ข้อมูลที่กรอกไว้ไม่หาย ฟอร์มไม่ปิด anonymous session เดิมยังใช้งานต่อได้ปกติ ผู้ใช้แก้ไขแล้วลองใหม่ หรือกดยกเลิกกลับ Settings ได้

## User Flow: US-12 / US-13 (Sync status ของ entries, check-ins และรูปภาพ)
1. ผู้ใช้เพิ่ม/แก้ไข/ลบ entry, toggle check-in, หรือแนบรูปใหม่ — ข้อมูล/รูป local URI แสดงผลทันทีบนหน้าจอ (ไม่รอ sync ตาม flow US-4/US-5/US-8 เดิมทุกประการ)
2. รายการที่เพิ่งสร้าง/แก้ไขนี้แสดง Sync Status Badge เป็น "รอซิงก์" (ไอคอนเทาเล็กๆ) ต่อจาก title/date ใน Entry List Item และ Stats Timeline
3. เมื่อแอปตรวจพบอินเทอร์เน็ต ระบบ sync ในพื้นหลัง (ผู้ใช้ยังใช้หน้าจออื่นได้ตามปกติ ไม่มี loading บล็อกหน้าจอ) — เมื่อ sync entry ใดสำเร็จ (รวมถึงรูปที่แนบอัปโหลดเสร็จ) badge ของแถวนั้นเปลี่ยนเป็น "ซิงก์แล้ว" (ไอคอนเขียวอ่อน) แบบ real-time โดยไม่ต้อง refresh หน้าจอ
4. ถ้ารูปภาพที่แนบยังอัปโหลดไม่เสร็จ (US-13) แต่ตัวข้อมูล entry เองซิงก์สำเร็จแล้ว badge ของแถวนั้นยังคงแสดง "รอซิงก์" ต่อไปจนกว่ารูปทุกรูปในแนบจะอัปโหลดสำเร็จครบ (นับรวมเป็นสถานะเดียวของทั้ง entry ไม่แยก badge ย่อยต่อรูป)
5. ถ้า sync ล้มเหลวต่อเนื่องหลายครั้งติดกัน (เช่นเน็ตไม่เสถียร) badge เปลี่ยนเป็น "retry-issue" (ไอคอนอำพัน) แทนที่จะค้างเป็น "รอซิงก์" เฉยๆ เพื่อไม่ให้ผู้ใช้เข้าใจผิดว่าระบบไม่ได้พยายามซิงก์เลย — ระบบยัง retry อัตโนมัติต่อไปเรื่อยๆ เมื่อมีเน็ต ไม่ต้องให้ผู้ใช้กดปุ่มใดๆ เอง

## User Flow: US-14 (Visual Feedback "Province Master" บนแผนที่ 3 มิติ)
1. ผู้ใช้กลับมาหน้า Home (3D Map) ไม่ว่าจากการเปิดแอปใหม่ หรือ navigate กลับมาจาก ProvinceDetailScreen หลัง toggle เช็คอินจนครบ
2. ระบบคำนวณสถานะ Province Master ของทุกจังหวัดสดจากจำนวนเช็คอินปัจจุบันเทียบกับจำนวน Landmark ทั้งหมดของแต่ละจังหวัด (เหมือน flow US-9) ไม่ cache ค่าจากอดีต
3. จังหวัดที่เป็น Province Master แสดง Province Tile — Province Master Variant (ขอบทอง + ไอคอนดาว/มงกุฎ) แทนที่ tile unlocked ปกติทันที ส่วนจังหวัดอื่นที่ unlocked ทั่วไปแต่ยังไม่ครบ Landmark ยังคงแสดงสถานะ unlocked ปกติตาม US-1 ไม่ปนกัน
4. ถ้าเพิ่งเปลี่ยนจาก unlocked ปกติ → province-master ระหว่างอยู่ในแอป (เช่นกลับจาก ProvinceDetailScreen ทันทีหลัง toggle ครบ) tile เล่น transient state `just-mastered` (shimmer/sparkle สั้นๆ ~500–700ms คล้าย pattern ของ Unlock Animation Controller) แล้ว settle เป็น `province-master` นิ่ง — ใช้กลไก flag เดียวกับ "justUnlocked" (เพิ่มเป็น "justMastered") ไม่ต้องปิดเปิดแอปใหม่

หมายเหตุ: US-15 (migrate ข้อมูล local-only เดิมขึ้น cloud) เป็นกระบวนการอัตโนมัติล้วนๆ ที่ทำงานเบื้องหลังทันทีที่มี session (ไม่มี UI ให้ผู้ใช้กดเริ่ม/ยืนยัน) จึงไม่มี User Flow/component แยกต่างหากในเอกสารนี้ — สถานะของมันแสดงผลผ่าน Sync Status Badge เดียวกับ US-12/13 ที่ออกแบบไว้ข้างต้นอยู่แล้ว (entry เก่าที่รอ migrate จะแสดง "รอซิงก์" เหมือน entry ใหม่ทุกประการ)

## Components (ส่วนเพิ่มเติม)

### Landmark List (T43)
- Purpose: แสดงรายการ Landmark แนะนำของจังหวัดที่กำลังดูอยู่ พร้อมให้เช็คอินได้ทีละแห่ง
- ตำแหน่งในหน้า: ProvinceDetailScreen ถัดจาก Province Detail Header (และ Province Master Badge ถ้ามี) อยู่เหนือปุ่ม "+ เพิ่มบันทึกใหม่" และ Entry List
- States:
  - loading: skeleton row (1–2 แถวเทาจาง) ระหว่างอ่านสถานะเช็คอินจาก local storage
  - empty (not-curated): จังหวัดไม่มีข้อมูล Landmark ใน seed dataset → แสดง Empty State (Landmarks — Not Curated) แทนทั้ง section
  - has-data: แสดง Landmark Map (ถ้ามีพิกัด) + Landmark Progress Indicator + list ของ Landmark List Item (3–5 แถว)
- Content: header เล็ก "สถานที่แนะนำ", Landmark Map, Landmark Progress Indicator, รายการ Landmark List Item
- ดูส่วนขยายเพิ่มเติมของ component นี้ (Landmark Map) ในหัวข้อ "Landmark Map (T67)" ด้านล่างของเอกสาร (รอบ OSM Data Integration)

### Landmark List Item (T43)
- Purpose: 1 แถวต่อ Landmark หนึ่งแห่ง พร้อมสวิตช์เช็คอิน
- States:
  - not-visited: สวิตช์/checkbox อยู่ในสถานะปิด, ข้อความชื่อ Landmark สีปกติ
  - visited: สวิตช์/checkbox เปิด (สีเขียว #1D9E75 ให้สอดคล้องกับโทน "ทำสำเร็จแล้ว" เดียวกับ unlocked tile), มีไอคอนเครื่องหมายถูกเล็กๆ ข้างชื่อ
  - toggling: เป็น optimistic update ทันที ไม่มี loading spinner คั่นกลาง (เพราะเขียน local เร็วมาก) — ถ้าเขียนล้มเหลวจริง (edge case เช่น storage เต็ม) ให้ revert สวิตช์กลับพร้อม toast สั้นๆ "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"
- Content: ชื่อ Landmark, สวิตช์/checkbox เช็คอิน

### Landmark Progress Indicator (T44)
- Purpose: บอกจำนวนเช็คอินแล้วเทียบทั้งหมดของจังหวัดนั้น
- States:
  - in-progress (X < Y): ข้อความ "เช็คอินแล้ว X/Y แห่ง" โทนสีปกติ
  - complete (X = Y, Y ≥ 1): ข้อความเดียวกันแต่เน้นด้วยโทนทอง/เขียวเข้มขึ้นเล็กน้อยเพื่อ lead-in ไปสู่ Province Master Badge ที่ปรากฏพร้อมกัน
  - hidden: ไม่แสดงเมื่อ Y = 0 (ครอบคลุมด้วย Empty State (Landmarks) แทนอยู่แล้ว)
- Content: ข้อความ "เช็คอินแล้ว X/Y แห่ง" อัปเดตทันทีที่ toggle เปลี่ยน (ไม่ animate ตัวเลข เพื่อความเรียบง่าย ต่างจาก Header Progress Bar ที่ animate เพราะ context ต่างกัน — อันนี้เป็นแค่ list ย่อยในหน้าเดียว)

### Empty State (Landmarks — Not Curated) (T45)
- Purpose: สื่อสารว่าจังหวัดนี้ "ยังไม่ถูกคัดสรรข้อมูล" ไม่ใช่ "error" หรือพื้นที่ว่างเปล่าดิบๆ ครอบคลุม 68/76 จังหวัดในรอบนี้
- States: single state
- Content: ไอคอนกลางๆ (เช่น pin outline สีเทา ไม่ใช่ไอคอน error/warning), ข้อความหลัก "ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้", ข้อความรองเล็กกว่า "เร็วๆ นี้จะทยอยเพิ่มให้ครบทุกจังหวัด" — ไม่มีปุ่ม CTA ในส่วนนี้ (ไม่มี action ให้ผู้ใช้ทำต่อ เพราะเป็นข้อมูล static ที่ทีมจะทยอยเพิ่มเอง)

### Province Master Badge (T46)
- Purpose: ฉลองความสำเร็จเมื่อเช็คอิน Landmark ครบทุกแห่งของจังหวัด
- States:
  - hidden: ยังไม่ครบ หรือจังหวัดไม่มี Landmark เลย (0 แห่ง) — ไม่ render อะไรเลย ไม่เว้นพื้นที่ค้าง
  - earned: แสดง badge "Province Master ⭐" โทนทอง (#E5B93C) ใกล้ Province Detail Header พร้อมข้อความรอง "เที่ยวครบทุกสถานที่แนะนำแล้ว!" เล่น scale-in animation สั้นๆ (~300ms) ตอนปรากฏ
- Content: label "Province Master ⭐", caption สั้น, ไอคอนดาว/มงกุฎ — คำนวณสดทุกครั้งจากจำนวนเช็คอินปัจจุบัน ไม่มี state ค้างจากอดีต

### AddEntry Landmark Field (T47)
- Purpose: field optional ในฟอร์ม AddEntry ให้เลือก Landmark ที่ไปเยือนเพื่อ auto check-in — เป็นส่วนขยายของ AddEntry Form (T12) ด้านบน
- States:
  - hidden: จังหวัดที่กำลังเพิ่ม entry ไม่มีข้อมูล Landmark ใน seed dataset เลย → field นี้ไม่ปรากฏในฟอร์ม (ดูเหตุผลใน User Flow US-10 ข้อ 5)
  - available-unselected: จังหวัดมีข้อมูล Landmark → แสดง picker พร้อมตัวเลือก "ไม่ระบุ" เป็นค่าเริ่มต้น + รายชื่อ Landmark ของจังหวัดนั้น
  - selected: แสดงชื่อ Landmark ที่เลือกไว้ในตัว picker
- Content: label "เช็คอินสถานที่ (ถ้ามี)", picker ตัวเลือก = ["ไม่ระบุ", ...ชื่อ Landmark ของจังหวัดนั้น] — วางในฟอร์มถัดจาก field tags ก่อนปุ่มบันทึก

### Settings Screen (T49)
- Purpose: หน้าจอใหม่สำหรับจัดการสถานะบัญชี (anonymous/ผูก email แล้ว), แสดงคำเตือนข้อมูลหาย, และสรุปสถานะ sync แบบเบาๆ
- Entry point: ไอคอน/ปุ่มเข้าถึงจากมุมบนของหน้า Home (เช่น ไอคอนรูปคนหรือเฟืองที่มุมขวาบนของ Header Progress Bar) — เป็น navigation stack ใหม่แยกจาก Home/ProvinceDetail/AddEntry/Stats เดิม
- States:
  - anonymous (ยังไม่ผูก email): แสดง Data-Loss Warning Banner (Persistent) เด่นด้านบนสุดของหน้า + ปุ่ม "ผูกกับอีเมล"
  - linked (ผูก email แล้ว): แสดงอีเมลที่ผูกไว้แทน banner คำเตือน (banner หายไปถาวร) เช่น "ผูกอีเมลแล้ว: xxx@xxx.com"
  - loading: skeleton ขณะอ่านสถานะ session ครั้งแรก
- Content: ส่วนสถานะบัญชี (anonymous/linked), Data-Loss Warning Banner (ถ้า anonymous), ปุ่ม "ผูกกับอีเมล" (ถ้า anonymous), สรุป sync แบบข้อความสั้น เช่น "มี N รายการรอซิงก์" (ถ้า N > 0, ไม่แสดงถ้า N = 0 เพื่อไม่ให้รกโดยไม่จำเป็น), เลขเวอร์ชันแอปที่ท้ายหน้า

### Email Link Form (T49)
- Purpose: ฟอร์มกรอกอีเมล+รหัสผ่านเพื่อผูกกับ anonymous session เดิม
- States:
  - default: field email/password ว่างเปล่า
  - validation-error (client-side): รูปแบบอีเมลไม่ถูกต้อง/รหัสผ่านสั้นเกินไป → inline error ใต้ field ที่เกี่ยวข้อง ก่อนแม้แต่จะยิง request
  - submitting: ปุ่ม "ผูกอีเมล" disabled + loading indicator เล็กในปุ่ม
  - server-error: ดูรายละเอียดใน Email Link Error Banner ด้านล่าง (T54)
  - success: ปิดฟอร์ม, กลับสู่ Settings Screen ที่อัปเดตเป็น state "linked" แล้ว, แสดง toast สั้นๆ "ผูกอีเมลสำเร็จ"
- Content: field email (text input), field password (secure text input), ปุ่ม "ผูกอีเมล", ปุ่ม/ลิงก์ "ยกเลิก" กลับ Settings โดยไม่กระทบ session เดิม

### Email Link Error Banner (T54)
- Purpose: แสดง error ที่มีความหมายเมื่อ link email ล้มเหลวจาก server-side โดยไม่ปิดฟอร์มหรือทำลาย anonymous session เดิม
- States:
  - duplicate-email: ข้อความ "อีเมลนี้ถูกใช้งานแล้ว ลองใช้อีเมลอื่น หรือเข้าสู่ระบบด้วยอีเมลนี้แทน" (ถ้ามี flow login แยกในอนาคต — รอบนี้เสนอเพียงข้อความแจ้ง ไม่ implement login flow เพิ่มตาม Out of Scope)
  - weak-password: ข้อความ "รหัสผ่านไม่ตรงตามเงื่อนไข กรุณาตั้งรหัสผ่านใหม่" (เงื่อนไขจริงเช่นความยาวขั้นต่ำ ให้ programmer ระบุตาม Supabase Auth default/config)
  - generic-failure (เช่นเน็ตหลุดระหว่าง request): ข้อความ "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง"
- Content: banner สีแดง (ต่างจากโทน amber ของ data-loss warning เพราะนี่คือ error จริงของ action ที่ล้มเหลว) วางอยู่บนสุดของ Email Link Form, field ที่กรอกไว้ไม่ถูกล้าง, ผู้ใช้แก้ไขแล้วลองใหม่ได้ทันที

### Data-Loss Warning Modal (One-Time) (T50)
- Purpose: แจ้งความเสี่ยงข้อมูลหายทันทีหลังสร้าง anonymous session ครั้งแรก ตาม constraint ข้อ 1 ที่ PM กำหนด (non-negotiable)
- States:
  - shown-once: ปรากฏเพียงครั้งเดียวในชีวิตของ session นั้น (track ด้วย flag local เช่น `hasSeenAnonWarning`) ทันทีหลัง Anonymous session ถูกสร้างสำเร็จ ก่อนที่ผู้ใช้จะเห็นหน้า Home — บล็อกการโต้ตอบกับหน้าจออื่นจนกว่าจะกดปุ่มใดปุ่มหนึ่ง (ไม่ปิดด้วยการแตะพื้นหลัง/swipe เพื่อให้แน่ใจว่าผู้ใช้เห็นจริง)
  - dismissed: หลังกดปุ่มใดปุ่มหนึ่งแล้ว จะไม่แสดง modal นี้ซ้ำอีกตลอดไป (ความรับผิดชอบเรื่อง "มองเห็นได้เสมอ" ต่อจากนี้อยู่ที่ Data-Loss Warning Banner ใน Settings แทน)
- Content: หัวข้อ "ข้อมูลของคุณเก็บอยู่ในเครื่องนี้", เนื้อหา "หากลบแอปหรือเปลี่ยนเครื่องก่อนผูกอีเมล ข้อมูลทั้งหมดจะกู้คืนไม่ได้", ปุ่มหลัก "เข้าใจแล้ว เริ่มใช้งาน" (ปิด modal → Home), ปุ่มรอง "ผูกอีเมลตอนนี้เลย" (ปิด modal → เปิด Email Link Form ทันที) — โทนสี amber/เป็นกลาง ไม่ใช้สีแดงเพื่อไม่ให้รู้สึกเหมือนแอป error ตั้งแต่เปิดครั้งแรก

### Data-Loss Warning Banner (Persistent) (T50)
- Purpose: จุด "มองเห็นได้เสมอ" ตราบใดที่ยัง anonymous ตาม constraint ข้อ 2–4 ที่ PM กำหนด
- States:
  - visible: แสดงเสมอที่ด้านบนสุดของ Settings Screen ทุกครั้งที่เปิดหน้านี้ ตราบใดที่ session ยัง anonymous (ออกแบบเป็น **non-dismissible โดยเจตนา** — ไม่มีปุ่มปิด/กากบาทใดๆ บน banner นี้เลย เพื่อรับประกัน constraint ข้อ 4 ("ห้ามมีทางลบคำเตือนออกถาวรด้วยปุ่มเดียว") โดยไม่ต้องพึ่ง logic re-surface ทุก 7 วันที่ซับซ้อนกว่า)
  - hidden: หายไปถาวรทันทีที่ผูก email สำเร็จ (ไม่ใช่ anonymous อีกต่อไป จึงไม่มีความเสี่ยงนี้แล้ว)
- Content: ไอคอน warning โทน amber (ไม่ใช้สีแดง), ข้อความ "ยังไม่ได้ผูกอีเมล — ข้อมูลอาจกู้คืนไม่ได้ถ้าลบแอปหรือเปลี่ยนเครื่อง", ปุ่ม inline "ผูกอีเมลตอนนี้" เปิด Email Link Form

### Sync Status Badge (T51)
- Purpose: ให้ผู้ใช้เห็นได้ทันทีว่า entry ใด "รอซิงก์" หรือ "ซิงก์แล้ว" โดยไม่ทำเป็นหน้า activity log เต็มรูปแบบ
- ตำแหน่ง: ไอคอนเล็กๆ inline ต่อจาก title/date ใน Entry List Item และ Stats Timeline แถวเดียวกัน (ไม่ใช่ column แยก ไม่ใช้พื้นที่มาก)
- States:
  - pending: ไอคอน outline เทา (เช่น นาฬิกา/cloud-outline) — สื่อว่า "บันทึกอยู่ในเครื่องแล้วปลอดภัย แค่ยังไม่ขึ้น cloud" ไม่ใช้สีแดง/ไม่ใช้คำว่า error เพื่อไม่ให้เข้าใจผิดว่าข้อมูลหาย
  - synced: ไอคอน filled สีเขียวอ่อน (cloud-check) — เปลี่ยนจาก pending แบบ real-time ทันทีที่ sync สำเร็จ ไม่ต้อง refresh หน้า
  - retry-issue (เกิดขึ้นเฉพาะหลัง sync ล้มเหลวต่อเนื่องหลายครั้ง ไม่ใช่ครั้งแรก): ไอคอนอำพัน (cloud + เครื่องหมายตกใจเล็ก) — แตะ/กดค้างที่ไอคอนแสดง tooltip สั้น "จะลองใหม่อัตโนมัติเมื่อมีเน็ต" เท่านั้น ไม่มีหน้ารายละเอียดเพิ่มเติม
- Content: ไอคอนเดี่ยว (ไม่มี text label ถาวรข้างๆ เพื่อประหยัดพื้นที่ในแถว) + tooltip ข้อความสั้นเมื่อแตะ
- เพิ่มเติมใน Settings Screen: บรรทัดสรุปข้อความล้วน (ไม่ใช่ list) เช่น "มี 3 รายการรอซิงก์" แสดงเฉพาะเมื่อมี pending มากกว่า 0 — ไม่ลงรายละเอียดว่ารายการไหนบ้าง (คงความเรียบง่ายตามที่ต้องการ)

### Province Tile — Province Master Variant (ส่วนขยาย T52)
- Purpose: ขยาย component Province Tile (T9, v1) เพิ่ม state ใหม่สำหรับจังหวัดที่ได้ Province Master โดยไม่กระทบ state เดิม (locked/unlocked/pressed)
- States (เพิ่มจากเดิม):
  - province-master: คงสี top face #1D9E75 / side face #0F6E56 ของ unlocked เดิมไว้ แล้วเพิ่มขอบทอง (แนะนำ 2px, #E5B93C) รอบ top face + ไอคอนดาว/มงกุฎเล็กที่มุมบนขวาของ top face — ต้องแตกต่างชัดเจนจาก unlocked ปกติเมื่อมองจากภาพรวมทั้ง 76 tile
  - just-mastered (transient): เล่น shimmer/sparkle สั้นๆ (~500–700ms) ตอนเปลี่ยนจาก unlocked → province-master ระหว่างอยู่ในแอป (ไม่ใช้ spring/bounce แบบเดียวกับ just-unlocked เป๊ะๆ เพื่อให้ผู้ใช้แยกความรู้สึก "ปลดล็อกใหม่" กับ "อัปเกรดเป็นมาสเตอร์" ออกจากกันได้ แม้จะสั้นๆ คล้ายกัน) แล้ว settle เป็น province-master นิ่ง
- Content: ไม่มี text label เพิ่มเติมบน tile (ยังคงกฎ "ไม่มี label ถาวรบนแผนที่" ของ v1) — accessibility label ต่อท้ายด้วย "ครบ Province Master" เมื่อเป็น state นี้

### Legend (Updated, ส่วนขยาย T53)
- Purpose: ขยาย component Legend (T23, v1) เพิ่มคำอธิบายสถานะ Province Master
- States: default เท่านั้น (ยังคง static เหมือนเดิม)
- Content: เพิ่มรายการที่ 3 ต่อจาก 2 รายการเดิม (เทา="ยังไม่ได้ไป", เขียว="ไปแล้ว") — swatch เขียวขอบทอง+ไอคอนดาวเล็ก พร้อมข้อความ "เที่ยวครบทุกที่แนะนำ" ถ้า 3 รายการในแนวนอนเดียวแล้วแน่นเกินไปบนจอแคบ อนุญาตให้ wrap เป็น 2 บรรทัด (2+1) ได้ ไม่จำเป็นต้องอยู่แถวเดียวเป๊ะเหมือน v1 เดิม

---

## ข้อเสนอแนะที่อาจขัดกับ requirement (รอบ Landmark & Supabase)

- ประเด็น A: ความละเอียดของ Sync Status Badge — AC ของ US-12 ต้องการเพียง 2 สถานะขั้นต่ำคือ "รอซิงก์" กับ "ซิงก์แล้ว" ("อย่างน้อยในระดับที่ไม่ทำให้ผู้ใช้เข้าใจผิดว่าข้อมูลหาย") แต่เอกสารนี้ออกแบบเพิ่ม state ที่ 3 คือ "retry-issue" (สำหรับกรณี sync ล้มเหลวต่อเนื่องหลายครั้ง) เพื่อความโปร่งใสมากขึ้น ซึ่งเกินขอบเขตขั้นต่ำของ AC เล็กน้อยและมีผลต่อ effort ของ T39/T51 (ต้องมี logic นับจำนวนครั้งที่ sync ล้มเหลวติดต่อกันเพื่อ trigger state นี้)
  - ทางเลือก A (ขั้นต่ำตาม AC): มีแค่ 2 สถานะ "รอซิงก์"/"ซิงก์แล้ว" ไม่มี state พิเศษสำหรับ sync ล้มเหลวต่อเนื่อง (เรียบง่ายที่สุด ตรงตาม AC เป๊ะ)
  - ทางเลือก B (ตามที่ออกแบบไว้ในเอกสารนี้): เพิ่ม state ที่ 3 "retry-issue" เพื่อไม่ให้ผู้ใช้ที่เจอปัญหาเน็ต/sync ล้มเหลวนานผิดปกติรู้สึกว่าแอป "เงียบ" ทั้งที่จริงมีปัญหาเกิดขึ้นต่อเนื่อง — เพิ่ม effort เล็กน้อยฝั่ง sync engine (T39) แต่ยังไม่ถึงขั้น "full activity log" ตามที่ PM ห้ามไว้
  - ขอให้ PM ยืนยันว่าจะรับทางเลือก B (ตามที่ spec ออกแบบไว้) หรือให้ตัดกลับเป็นทางเลือก A เพื่อลด scope ของ T39/T51 ในรอบนี้

- ประเด็น B (ไม่ใช่ conflict แต่เป็นข้อสังเกตส่งต่อ PM/QA): PM decision ข้อ 6 ระบุว่าถ้าใช้ dismissible banner ต้อง re-surface ทุก 7 วันหรือทุกครั้งที่เปิด Settings — เอกสารนี้เลือกออกแบบ Data-Loss Warning Banner ให้เป็น **non-dismissible ไปเลย** (ไม่มีปุ่มปิดใดๆ) แทนที่จะทำ dismissible + re-surface logic เพราะเป็นทางที่ตรงตาม constraint ทั้ง 4 ข้อได้ง่ายและชัวร์ที่สุดโดยไม่ต้องมี logic นับวัน/track dismissal state เพิ่ม — ถือเป็นการตัดสินใจ UX ภายในกรอบที่ PM ให้อิสระไว้แล้ว (ข้อความ PM: "รายละเอียดภาพ/wording/ตำแหน่งที่แน่นอนเป็นดุลยพินิจ UIUX") จึงไม่ใช่ประเด็นขัดแย้งที่ต้องรอ PM ตัดสินใจเพิ่ม แต่ระบุไว้ให้ทราบเผื่อ PM ต้องการ dismissible banner จริงๆ ด้วยเหตุผลอื่น (เช่น ไม่อยากให้ banner กินพื้นที่ถาวรใน Settings) ก็แจ้งกลับมาเพื่อปรับ spec

---

# ส่วนเพิ่มเติม: OSM Data Integration (US-16 – US-20)

หมายเหตุขอบเขต: ส่วนนี้ครอบคลุมเฉพาะ task ที่ติดป้าย **[รอ design-spec]** ในรอบ OSM Data Integration ได้แก่ T67 (จุด Landmark บนแผนที่ระดับจังหวัด ใน ProvinceDetailScreen), T70/T73 (ช่องค้นหาสถานที่ผ่าน Nominatim + error/offline/empty/rate-limit state ใน AddEntryScreen) ไม่มีหน้าจอใหม่เพิ่ม — เป็นการต่อยอด component เดิมของ ProvinceDetailScreen (Landmark List, T43) และ AddEntryScreen (AddEntry Form, T12 / AddEntry Landmark Field, T47) เท่านั้น ไม่เปลี่ยน layout หลักที่ออกแบบไว้ก่อนหน้านี้

โทนภาพรวมเพิ่มเติม:
- "แผนที่ระดับจังหวัด" ของ T67 **ไม่ใช่แผนที่จริงแบบ interactive/zoomable/GPS** ตาม Out of Scope รอบนี้ — เป็นภาพ static แบบ scatter plot ตำแหน่งสัมพัทธ์ของ Landmark ที่มีพิกัดภายในจังหวัดเดียวกันเท่านั้น วาดด้วย `react-native-svg` (มีอยู่แล้วในโปรเจกต์จาก Map3D/ProvinceTile3D) ไม่พึ่ง map library ภายนอก ไม่มี tile/background ภูมิประเทศจริงใดๆ
- ช่องค้นหา Nominatim (T70/T73) เป็นกลไกที่ **แยกขาดโดยสมบูรณ์** จาก AddEntry Landmark Field (T47) เดิม — ห้าม UI ทั้งสองใช้ state ร่วมกันหรือทำให้ผู้ใช้สับสนว่าเป็นกลไกเดียวกัน (T47 = เลือก Landmark ที่ curate ไว้แล้ว → auto check-in, T70 = ค้นหาสถานที่ทั่วไปผ่าน Nominatim → prefill title เฉยๆ ไม่ check-in ไม่สร้าง Landmark)
- ทุก error/loading/empty state ของการค้นหาต้องเป็น **inline อยู่ในฟอร์มเดิม** ไม่ใช้ full-screen error/blocking modal ใดๆ เพราะ AC ของ US-20 ย้ำว่าความล้มเหลวของการค้นหาต้อง "ไม่กระทบ flow กรอก/บันทึก entry ปกติของ US-4 เลย"

---

## User Flow: US-18 (เห็นตำแหน่ง Landmark บนแผนที่ระดับจังหวัด)
1. ผู้ใช้เปิดหน้า ProvinceDetailScreen ของจังหวัดหนึ่งที่มีข้อมูล Landmark (ต่อจาก flow US-8 เดิม)
2. ระบบกรอง Landmark ของจังหวัดนั้นที่มี `lat`/`lng` ครบทั้งคู่ (ไม่รวม landmark ที่ยังไม่มีพิกัด)
3. ถ้ามี Landmark ที่มีพิกัดครบอย่างน้อย 1 แห่ง: ผู้ใช้เห็น Landmark Map แสดงเป็นจุดกระจายตามตำแหน่งสัมพัทธ์ในกรอบสี่เหลี่ยม อยู่ในส่วน "สถานที่แนะนำ" เดิม (Landmark List, T43) เหนือ Landmark Progress Indicator
4. ผู้ใช้แตะจุดใดจุดหนึ่งบนแผนที่ → ระบบ toggle สถานะเช็คอินของ Landmark นั้น (landmark id เดียวกับที่ผูกกับแถวใน list ด้านล่างเสมอ ใช้ callback `onToggle` เดียวกับ Landmark List Item) — จุดเปลี่ยนสีทันทีแบบ optimistic เหมือนสวิตช์ใน list
5. ถ้าไม่มี Landmark ใดของจังหวัดนี้มีพิกัดครบเลยสักแห่ง (แต่จังหวัดมี Landmark ใน list ปกติ) → ส่วนแผนที่แสดงข้อความ placeholder สั้นๆ แทนจุด ส่วน list ด้านล่างยังแสดงครบตามปกติไม่มี error
6. ถ้าจังหวัดนั้นไม่มีข้อมูล Landmark เลย (68 จังหวัดที่ยังไม่ curate) → ทั้ง section รวมทั้ง Landmark Map ไม่แสดงเลย ถูกแทนที่ด้วย Empty State (Landmarks — Not Curated) เดิม (T45) เหมือนที่ออกแบบไว้แล้ว ไม่มีการเปลี่ยนแปลงจากเดิม

## User Flow: US-19 / US-20 (ค้นหาสถานที่ผ่าน Nominatim ตอนเพิ่มบันทึก + error/offline/rate-limit)
1. ผู้ใช้เปิดฟอร์ม AddEntry (สร้างใหม่หรือแก้ไข ต่อจาก flow US-4/US-10 เดิม) และเห็นช่อง "ค้นหาสถานที่ (ถ้ามี)" อยู่ใต้ field "ชื่อสถานที่ *" เดิมทันที (ก่อน field "บันทึกความทรงจำ")
2. ผู้ใช้พิมพ์คำค้นอย่างน้อย 3 ตัวอักษร ระบบรอจนผู้ใช้หยุดพิมพ์ครบ 1000ms (debounce) ก่อนยิง request จริงไปยัง Nominatim ผ่าน client module T68 — ถ้าผู้ใช้พิมพ์ต่อเนื่องเร็วกว่านั้น ระบบไม่ยิง request ซ้ำถี่ๆ (throttle ที่ระดับ client รับประกัน ~1 req/sec อีกชั้นหนึ่งตาม T72)
3. ระหว่างรอผลลัพธ์ ผู้ใช้เห็น loading indicator เล็กๆ ในช่องค้นหา (ไม่บล็อกฟิลด์อื่นในฟอร์ม)
4. เมื่อได้ผลลัพธ์ ผู้ใช้เห็นรายการผลลัพธ์เป็น dropdown/list ใต้ช่องค้นหา (สูงสุด 5 แถว) แต่ละแถวคือชื่อ + ที่อยู่แบบย่อ
5. ผู้ใช้แตะเลือกผลลัพธ์หนึ่งรายการ → ระบบ prefill ค่าไปยังฟิลด์ "ชื่อสถานที่ *" ทันที (เขียนทับค่าที่มีอยู่เดิมในฟิลด์นั้น ถ้ามี), เก็บ lat/lng ของผลลัพธ์นั้นไว้แนบกับ entry เป็น metadata เสริม (`placeLat`/`placeLng`, T69) แบบเงียบๆ เบื้องหลัง, ช่องค้นหายุบกลับเป็นสถานะ "อ้างอิงสถานที่แล้ว" แสดง chip เล็กๆ ใต้ field title พร้อมปุ่ม "x" เพื่อล้างเฉพาะ metadata พิกัดที่แนบไว้ (ไม่กระทบข้อความในฟิลด์ title ที่ผู้ใช้แก้ไขต่อได้อิสระเสมอตาม AC)
6. ผู้ใช้กรอกฟิลด์อื่นต่อ (notes/photos/tags/Landmark check-in field เดิม) แล้วกด "บันทึก"/"บันทึกการแก้ไข" ตาม flow US-4 เดิมทุกประการ — การมี/ไม่มีผลค้นหาที่เลือกไว้ไม่กระทบ validation หรือปุ่มบันทึกเลย
7. ถ้าผู้ใช้ค้นหาขณะไม่มีเน็ต หรือ request ล้มเหลว/timeout → ใต้ช่องค้นหาแสดงข้อความ "ค้นหาไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง" พร้อมลิงก์ข้อความ "ลองอีกครั้ง" เพื่อยิง query เดิมซ้ำโดยไม่ต้องพิมพ์ใหม่ — ฟิลด์อื่นในฟอร์มใช้งานได้ตามปกติระหว่างนี้เสมอ
8. ถ้าค้นหาแล้วไม่พบผลลัพธ์เลย → ใต้ช่องค้นหาแสดงข้อความ "ไม่พบสถานที่ที่ค้นหา" แทน list ว่างเปล่า
9. ผู้ใช้ที่ไม่สนใจใช้ช่องค้นหานี้เลย สามารถพิมพ์ title เองตรงๆ แล้วบันทึกได้ปกติทุกประการ เหมือนไม่มีฟีเจอร์นี้อยู่เลย (ตาม AC206/US-20 AC6)

---

## Components (ส่วนเพิ่มเติม รอบ OSM Data Integration)

### Landmark Map (T67)
- Purpose: แสดงตำแหน่งสัมพัทธ์ของ Landmark ที่มีพิกัดครบภายในจังหวัดเดียวกัน เป็นภาพ static ง่ายๆ (ไม่ใช่แผนที่จริง/ไม่ interactive แบบเลื่อน-ซูม) ตาม US-18
- ตำแหน่งในหน้า: อยู่ภายในส่วน "สถานที่แนะนำ" (Landmark List, T43 has-data state) — ลำดับคือ heading "สถานที่แนะนำ" → **Landmark Map** → Landmark Progress Indicator → รายการ Landmark List Item เดิม (ต่อท้ายลำดับเดิม ไม่แทรกกลาง ไม่เปลี่ยนตำแหน่ง progress indicator/list เดิม)
- ที่มาของพิกัด/bounding box: **ไม่ใช้พิกัดจังหวัด (thailand-provinces.ts ไม่มี lat/lng จริง มีแค่ SVG path ในพิกัดหน้าจอ 2D ของแผนที่ 76 จังหวัด ซึ่งเป็นคนละระบบพิกัดกับ lat/lng ของ Landmark โดยสิ้นเชิง ห้ามนำมาปนกัน)** ให้คำนวณ bounding box (min/max lat, min/max lng) จาก **เฉพาะ Landmark ของจังหวัดนั้นที่มี lat/lng ครบทั้งคู่** เท่านั้น แล้ว normalize ตำแหน่งแต่ละจุดเทียบกับ bounding box นั้นเอง (ไม่ใช่เทียบกับพิกัดของทั้งประเทศ)
- ขนาด/รูปแบบภาพ: กรอบสี่เหลี่ยมจัตุรัสหรือใกล้เคียง (แนะนำ aspect ~4:3, สูงประมาณ 160–180) วาดด้วย `<Svg>` จาก `react-native-svg`, พื้นหลังกรอบใช้โทนอ่อนกลางๆ ที่ต่างจาก background การ์ดของ Landmark List เล็กน้อยเพื่อให้แยกส่วนได้ (เช่น `#F0F0F0` มีเส้นขอบบางสี `#E5E5E5` ตาม `COLORS.trackBg`) ไม่มี grid/เส้นละติจูด-ลองจิจูดใดๆ (จะสื่อว่าเป็นแผนที่จริงเกินไป) — วาดจุดเป็น `<Circle>` รัศมีคงที่ (เช่น 6) เท่านั้น
- การคำนวณตำแหน่งจุด (normalize):
  - padding รอบขอบกรอบ (เช่น 12% ของความกว้าง/สูง) กันจุดชิดขอบเกินไป
  - x = padding + (lng − minLng) / (maxLng − minLng) × (width − 2×padding)
  - y = padding + (1 − (lat − minLat) / (maxLat − minLat)) × (height − 2×padding) — กลับแกน y เพราะค่า lat มากกว่า = ทิศเหนือ = อยู่ด้านบนของภาพ ขณะที่พิกัดหน้าจอ y มากกว่า = อยู่ด้านล่าง
  - **กรณี degenerate bounding box** (มี Landmark ที่มีพิกัดแค่ 1 แห่ง หรือทุกแห่งมี lat/lng ตรงกันเป๊ะ ทำให้ maxLat−minLat = 0 หรือ maxLng−minLng = 0): วางจุดทั้งหมดไว้กึ่งกลางกรอบพอดี (x = width/2, y = height/2) ห้ามหารด้วยศูนย์/ห้าม NaN
- States:
  - has-points: มี Landmark ที่มีพิกัดครบอย่างน้อย 1 แห่งในจังหวัดนี้ → วาดจุดตามจำนวนนั้น แต่ละจุดมีสีตามสถานะเช็คอิน (ดู Content ด้านล่าง)
  - no-points (fallback): จังหวัดนี้มี Landmark ใน list แต่ไม่มีแห่งใดมีพิกัดครบเลยสักแห่ง (ยังไม่ผ่าน backfill ของ T63/T64) → **ไม่วาดกรอบ/จุดใดๆ** แสดงข้อความสั้นแทนที่ เช่น "ยังไม่มีข้อมูลตำแหน่งสำหรับสถานที่แนะนำของจังหวัดนี้" ด้วย style เดียวกับ Empty State (Landmarks — Not Curated) แต่เป็น inline text ไม่ใช่เต็ม section (list ของ Landmark List Item ด้านล่างยังคงแสดงตามปกติ)
  - hidden: ไม่ render เมื่อ Landmark List อยู่ใน empty (not-curated) state อยู่แล้วตั้งแต่ต้น (ไม่มี Landmark เลยในจังหวัดนี้) — ครอบคลุมโดย Empty State (Landmarks — Not Curated) เดิมทั้ง section ไม่ต้องมี logic แยกซ้ำ
- Content: จุด (`<Circle>`) 1 จุดต่อ 1 Landmark ที่มีพิกัดครบ
  - not-visited: จุดสีเทา (เช่น `COLORS.textSecondary` หรือ `COLORS.trackBg` เข้มขึ้นเล็กน้อยให้มองเห็นบนพื้นหลังกรอบ) — คนละสีจากพื้นหลังกรอบชัดเจน
  - visited: จุดสีเขียว `COLORS.accent` (#1D9E75) ให้ตรงกับโทน "ทำสำเร็จแล้ว" เดียวกับ Landmark List Item/unlocked tile
  - แตะจุด (tappable): เพิ่ม hit area รอบจุดจริง (เช่น `<Circle>` โปร่งใสรัศมีใหญ่กว่าเช่น 16 ครอบจุดที่มองเห็น 6 ไว้ ใช้เป็น touch target เพื่อไม่ให้พลาดกดยาก) กดแล้ว toggle เช็คอินของ landmark id นั้นด้วย callback เดียวกับที่ LandmarkList ส่งให้ Landmark List Item (`onToggle(landmarkId, provinceId)`) รับประกันว่า id อ้างอิงตรงกับ list เสมอ (AC195) — ไม่มี tooltip/popup ชื่อ landmark ลอยขึ้นตอนแตะ (ให้ผู้ใช้ดูชื่อจาก list ด้านล่างแทน เพื่อไม่เพิ่ม state ซับซ้อน)
- Accessibility: แต่ละจุด (touch target) ตั้ง accessibility label เป็น "<nameTh>, <เช็คอินแล้ว|ยังไม่เช็คอิน>" ให้ screen reader อ่านได้ความหมายเดียวกับแถวใน list

### Search Place Field (T70)
- Purpose: ช่อง optional สำหรับค้นหาสถานที่ทั่วไปที่ไม่อยู่ใน Top Landmarks ผ่าน Nominatim เพื่อช่วย prefill ฟิลด์ "ชื่อสถานที่" — เป็นกลไกที่แยกขาดจาก AddEntry Landmark Field (T47) โดยสิ้นเชิง
- ตำแหน่งในฟอร์ม AddEntry: อยู่ใต้ field "ชื่อสถานที่ *" (title) และ error text ของมันทันที ก่อน field "บันทึกความทรงจำ" — ไม่แทรกก่อน title, ไม่ย้าย field เดิมใดๆ
- Content เมื่ออยู่ใน state พิมพ์ค้นหา: label รอง (เล็กกว่า field label ปกติ, สี `COLORS.textSecondary`) ข้อความ "หรือค้นหาสถานที่ (ถ้ามี)", `TextInput` placeholder "ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว..." สไตล์เดียวกับ `textInput` เดิมในฟอร์ม (border `#D9D9D9`, radius 8) มีไอคอนแว่นขยายเล็กด้านซ้ายในช่อง
- States:
  - idle: ช่องว่าง ไม่มี dropdown ผลลัพธ์ใดๆ ด้านล่าง
  - typing (< 3 ตัวอักษร หรือยังไม่ครบ debounce 1000ms): ไม่ยิง request ยัง ไม่แสดง loading/ผลลัพธ์ใดๆ (เงียบ รอจนครบเงื่อนไข)
  - loading: ไอคอนแว่นขยายด้านซ้ายเปลี่ยนเป็น `ActivityIndicator` ขนาดเล็ก (สีเดียวกับ accent) ระหว่างรอ response จาก T68 หลังผ่าน debounce แล้ว
  - results: dropdown การ์ดสีขาวใต้ช่อง border `#D9D9D9` radius 8 แสดงผลลัพธ์สูงสุด 5 แถวแรกที่ client module ส่งกลับมา (ตัดที่ 5 ฝั่ง UI แม้ backend ส่งมากกว่า) แต่ละแถวคือ Search Result Item (ดูด้านล่าง)
  - empty (ค้นแล้วไม่พบ): ข้อความเดี่ยวใต้ช่อง (ไม่ใช่การ์ด dropdown) "ไม่พบสถานที่ที่ค้นหา" สีเทา `COLORS.textSecondary`
  - error (offline/timeout/ล้มเหลว — ไม่แยกสองกรณีนี้ในข้อความ เพราะการตรวจสอบเน็ตเป็นแบบ opportunistic ตาม AC216 บอกแยกแม่นยำไม่ได้): ข้อความ "ค้นหาไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง" สี `COLORS.textSecondary` (ไม่ใช้สีแดง/`COLORS.danger` เพราะไม่ใช่ validation error ของฟอร์ม เป็นความล้มเหลวของบริการภายนอกที่ไม่กระทบการบันทึก entry) พร้อมข้อความลิงก์ "ลองอีกครั้ง" สี `COLORS.accent` ต่อท้ายบรรทัดเดียวกัน กดแล้วยิง query ล่าสุดซ้ำ (ผ่าน debounce/throttle เดิมของ T72 เหมือนเดิม ไม่ bypass)
  - selected (หลังเลือกผลลัพธ์แล้ว): ช่องค้นหายุบ/เคลียร์ข้อความค้นหาเดิม (กลับสู่ placeholder ว่าง) dropdown ปิด ระบบแสดง Search Result Confirmation Chip แทน (ดูด้านล่าง) ผู้ใช้พิมพ์ค้นหาใหม่ในช่องนี้ได้ทันทีอีกครั้งถ้าต้องการเปลี่ยนสถานที่ (การเลือกผลลัพธ์ใหม่จะ overwrite ทั้ง title และ metadata เดิม)
- Interaction เพิ่มเติม: การพิมพ์/ค้นหา/error ของช่องนี้ **ไม่ trigger validation ใดๆ ของฟอร์มหลัก** (title/date) และไม่ทำให้ปุ่ม "บันทึก" ถูก disable เลยไม่ว่า state ไหน — เป็นไปตาม US-20 AC6/T74 (isolate failure boundary)

### Search Result Item (T70)
- Purpose: 1 แถวผลลัพธ์จาก Nominatim ในการ์ด dropdown ของ Search Place Field
- Content: บรรทัดหลัก (ตัวหนา, `COLORS.textPrimary`) = ส่วนแรกของ `display_name` ที่ Nominatim ส่งมา (ตัดที่ comma แรกเป็น short label เช่น "วัดพระธาตุดอยคำ"), บรรทัดรอง (เล็กกว่า, `COLORS.textSecondary`, 1 บรรทัด ตัดด้วย ellipsis ถ้ายาวเกิน) = `display_name` เต็มเป็นที่อยู่บริบทประกอบ
- States: default / pressed (tap feedback เบาๆ แบบเดียวกับ Entry List Item ก่อน select)
- Interaction: แตะแล้ว trigger การ prefill ทันที (ดู flow ด้านบนข้อ 5), มีเส้นคั่นบางๆ (`#EEEEEE`) ระหว่างแถว ไม่มีแถวสุดท้ายมีเส้นคั่นด้านล่าง

### Search Result Confirmation Chip (T70)
- Purpose: ให้ผู้ใช้เห็นชัดเจนว่าฟิลด์ title ถูก prefill มาจากผลค้นหา Nominatim แล้ว (พร้อมพิกัดแนบ) และยังแก้ไข title ต่อได้อิสระ ไม่ได้ผูกติดกันแบบแก้ไม่ได้
- ตำแหน่ง: แสดงใต้ Search Place Field ทันทีหลังเลือกผลลัพธ์ (แทนที่ dropdown ผลลัพธ์)
- States:
  - visible: chip ทรงแคปซูล พื้นหลังอ่อน (เช่น `COLORS.trackBg`) ไอคอน pin เล็กด้านซ้าย ข้อความ "อ้างอิงพิกัดจาก: <ชื่อผลลัพธ์ที่เลือกแบบย่อ>" ปุ่ม "×" เล็กด้านขวาสุด
  - hidden: ยังไม่เคยเลือกผลลัพธ์ใด หรือกด "×" ไปแล้ว
- Interaction: กด "×" → ล้างเฉพาะ metadata พิกัดที่แนบไว้ (`placeLat`/`placeLng` จะไม่ถูกส่งตอนบันทึก entry) chip หายไป **ไม่แตะต้องข้อความในฟิลด์ title เลย** (ผู้ใช้พิมพ์/แก้ title เองต่อได้ตามปกติ เป็นแค่ text ธรรมดาอยู่แล้วตั้งแต่ตอน prefill) — ถ้าผู้ใช้ค้นหาและเลือกผลลัพธ์ใหม่อีกครั้งโดยไม่กด "×" ก่อน จะ overwrite ทั้ง title และ chip/metadata เดิมไปเลย (เป็นพฤติกรรม "เลือกล่าสุดชนะ" ไม่ต้อง confirm ซ้ำ)

---

## ข้อเสนอแนะที่อาจขัดกับ requirement (รอบ OSM Data Integration)

- ประเด็น C: Requirement (US-19 AC3) ระบุเพียงว่า "ผู้ใช้ยังแก้ไขค่าที่ prefill มาได้ก่อนบันทึกจริง" แต่ไม่ได้พูดถึงกลไกยกเลิก/ล้าง metadata พิกัด (`placeLat`/`placeLng`) ที่แนบไปแล้วหลังเลือกผลลัพธ์ เอกสารนี้เพิ่ม Search Result Confirmation Chip พร้อมปุ่ม "×" เพื่อให้ผู้ใช้ล้าง metadata ได้โดยไม่ต้องแก้ข้อความ title (เช่น กรณีเลือกผลลัพธ์ผิดแล้วอยากพิมพ์ title เองล้วนๆ โดยไม่มีพิกัดแนบ) เป็นส่วนเสริม UX เล็กน้อยที่ไม่ขัดกับ AC ใดๆ (ไม่ได้เปลี่ยนพฤติกรรม prefill/ไม่สร้าง Landmark/ไม่ auto check-in ตามเดิมทุกประการ) จึงถือเป็นดุลยพินิจ UIUX ในกรอบเดิม ไม่ต้องรอ PM ตัดสินใจ แต่ระบุไว้ให้ทราบเผื่อ PM เห็นว่าเป็น scope เกินความจำเป็นและต้องการตัด chip/ปุ่ม "×" ออกเพื่อลด effort ของ T70/T71
- ประเด็น D: ข้อความ error ของ US-20 AC3 ยกตัวอย่างไว้ว่า "เช่น 'ค้นหาไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง'" เอกสารนี้ใช้ข้อความนี้ตรงตัวเป็นทั้ง offline และ generic failure โดยไม่แยกสองข้อความ เพราะการตรวจจับเน็ตเป็นแบบ opportunistic (AC216) ไม่สามารถแยกสาเหตุได้แม่นยำอยู่แล้ว ไม่ถือเป็นจุดขัดแย้งกับ requirement (ยังตรงตาม AC ทุกข้อ) เป็นเพียงข้อสังเกตทางเทคนิคส่งต่อ programmer ว่าไม่ต้องพยายามสร้าง state แยก "offline" กับ "server error" ให้ซับซ้อนเกินความจำเป็น

---

# ส่วนเพิ่มเติม: Advanced UI/UX Upgrade (Design System v2)

หมายเหตุขอบเขต: รอบนี้ยกระดับ **visual/interaction layer** จากระดับ Prototype ไปสู่ระดับ Advance ตามมาตรฐาน `.claude/skills/advanced-mobile-uiux/SKILL.md` (8pt grid, Bento Grid, Modern Elevation, Shimmer Skeleton, Haptic Feedback, Thumb-zone, Accessibility) — ไม่เพิ่ม user flow ใหม่ ไม่เปลี่ยน business logic ใดๆ ครอบคลุมเฉพาะ component ที่มีอยู่แล้ว: **Landmark List / Landmark Card / Global Search Bar** (ProvinceDetailScreen, HomeScreen) เท่านั้น ส่วนโค้ดจริงได้ implement คู่ขนานไปแล้วในรอบนี้ (ไม่ใช่แค่เอกสารเสนอแนวทาง): `src/theme.ts`, `src/components/LandmarkCard.tsx`, `src/components/LandmarkList.tsx`, `src/components/GlobalSearchBar.tsx`, และ shared component ใหม่ `src/components/PressableScale.tsx` / `src/components/ShimmerBlock.tsx` — เพิ่ม dependency `expo-haptics` และ `expo-linear-gradient` (ติดตั้งด้วย `npx expo install` ให้ตรง SDK 57 แล้ว)

## Design Tokens v2 (`src/theme.ts`)
- `SPACING` (8pt grid): xxs4/xs8/sm12/md16/lg20/xl24/xxl32 — แทนที่ตัวเลข spacing ที่ hardcode กระจายอยู่ในแต่ละไฟล์
- `RADIUS`: sm8/md12/lg18/xl26/full9999
- `SHADOWS.sm/md/lg`: เงาสีเขียวเข้มโปร่งแสงหลายชั้น (`shadowColor: '#0F2A1D'`) แทนเงาสีดำทึบเดิม (`shadowColor: '#000', shadowOpacity: 0.05`)
- `CATEGORY_COLORS` + `CATEGORY_COLOR_FALLBACK`: จับคู่สีตามหมวดหมู่ตรงกับ `CATEGORIES` ใน LandmarkList.tsx เป๊ะทั้ง 5 หมวด (ธรรมชาติ=Emerald, วัด=Amber, ทะเล=Ocean Azure, ประวัติศาสตร์=Violet, ช้อปปิ้ง=Rose)

## Layout: Landmark List → Bento Grid
- Landmark อันดับแรกของรายการ (หลัง filter) แสดงเป็น **Hero Card** (`LandmarkCard variant="hero"`) สูง 220pt เต็มความกว้าง รูปเต็มพื้นที่ + `expo-linear-gradient` ไล่จากโปร่งใสไปดำ 70% ทับ 55% ล่าง ชื่อสถานที่วางบนภาพเป็นตัวหนังสือขาว
- ที่เหลือแสดงเป็น **2-column compact grid** (`variant="compact"`, width 48.5%, `flexWrap`) แทนรายการแนวตั้งเต็มความกว้างเดิม
- Category badge บนรูปเปลี่ยนจากพื้นดำทึบ (`rgba(0,0,0,0.65)`) เป็นสีตาม `CATEGORY_COLORS[category].fg` ของหมวดนั้นๆ ให้สแกนหมวดหมู่ได้เร็วขึ้นด้วยสี ไม่ต้องอ่านข้อความอย่างเดียว
- Category filter chip: ตอน active ใช้สีของหมวดหมู่นั้นแทนสี accent เขียวเดียวทุกหมวด, ปรับ `minHeight: 44` ให้ผ่านเกณฑ์ tap target ขั้นต่ำ (เดิม paddingVertical 5 ทำให้แถวสูงจริง ~26pt ไม่ผ่านเกณฑ์)

## States
- **Loading**: แทนที่ `ActivityIndicator` เดี่ยวกลางจอด้วย `ShimmerBlock` (pulse opacity 0.4↔0.9) ที่มีขนาดจำลอง Hero+Grid จริง (220pt hero + 2 tile 180pt) กัน layout shift ตอนข้อมูลมาจริง ตรงตามกฎ SKILL.md 4.1 ("ห้ามใช้ ActivityIndicator เดี่ยวๆ สำหรับส่วนที่มี layout ชัดเจน") — ส่วน loading indicator เล็กๆ ระหว่าง background-enrich (ไม่บล็อกเนื้อหาที่โหลดแล้ว) ยังคงมีอยู่แต่เปลี่ยนจาก spinner เป็นจุด shimmer เล็กแทน
- **Empty / Error**: ดูหัวข้อ US-21 (ส่วนเพิ่มเติมถัดไปด้านล่าง จากรอบ bug-fix ที่รันคู่ขนานกันในเซสชันเดียวกัน) ที่แยก "ยังไม่ curate" ออกจาก "ดึงข้อมูลล้มเหลว" อย่างชัดเจน ทั้งสอง state ยังคงอยู่ใน scope เดียวกับ Empty State (Landmarks — Not Curated, T45) เดิม ไม่ได้ทำ UI ใหม่แยกในรอบ visual-only นี้
- **Success**: Landmark Card เพิ่ม state `visited` เดิมไว้ครบ (border/background เขียวอ่อน) เพียงเปลี่ยนปุ่มเช็คอินให้เป็น `PressableScale` (bounce + haptic) แทน `Pressable` เฉยๆ

## Micro-interactions
- `PressableScale` (component ใหม่ใช้ `react-native-reanimated`): กดค้าง scale 0.96 → ปล่อยเด้งกลับด้วย spring (`damping: 12, stiffness: 150`) ตรงตาม SKILL.md 3.1 เป๊ะ ใช้กับ: ปุ่มเช็คอินใน Landmark Card, category filter chip, แถวผลลัพธ์ใน Global Search Bar
- Haptic feedback (`expo-haptics`):
  - `ImpactFeedbackStyle.Light`: กด category chip, กดเลือกผลลัพธ์ค้นหาใน Global Search Bar
  - `ImpactFeedbackStyle.Medium`: กดเช็คอิน/ยกเลิกเช็คอิน landmark (รวมจุดบน Landmark Map ด้วย — centralize ที่ `handleToggle` ใน `LandmarkList.tsx` จุดเดียว ครอบคลุมทั้ง card และ map แทนที่จะ implement ซ้ำสองที่)
  - Province Master (`notificationAsync Success`) ยังไม่ implement ในรอบนี้ (อยู่นอก scope ของไฟล์ที่แตะรอบนี้ — ProvinceMasterBadge.tsx ไม่ได้แก้) ระบุไว้เป็นข้อเสนอแนะสำหรับรอบถัดไป

## Thumb-zone & Accessibility
- Category chip และแถวผลลัพธ์ค้นหา (`resultRow`) ปรับเป็น `minHeight: 44` ทั้งคู่ (ของเดิมเล็กกว่าเกณฑ์)
- Category chip เพิ่ม `accessibilityRole="button"` + `accessibilityState={{ selected }}` + `accessibilityLabel` ระบุหมวดหมู่และสถานะเลือกอยู่หรือไม่ (ของเดิมไม่มี accessibility props เลย)
- Landmark Card title (ทั้ง hero และ compact) ยังคง `onPress={onToggle}` ไว้เหมือน component เดิม (ไม่ใช่แค่ปุ่มด้านล่างที่กดเช็คอินได้) — สำคัญเพราะมี integration test อยู่แล้วที่ผูกกับพฤติกรรมนี้ (`landmarkCheckin.test.tsx`) ต้องคงไว้ไม่ให้ regression

## ข้อเสนอแนะสำหรับรอบถัดไป (ไม่ใช่ conflict กับ requirement ใดๆ ในรอบนี้)
- ยังไม่ได้ทำ Bento redesign ให้ HomeScreen (แผนที่ 3 มิติ) และ Stats/Settings screens — ขอบเขตรอบนี้จำกัดเฉพาะ Landmark List/Card/Search ตามที่ผู้ใช้ระบุปัญหาเรื่อง "โหลดสถานที่ท่องเที่ยว" เป็นจุดโฟกัสหลัก
- Province Master badge ยังไม่ผูก haptic `notificationAsync(Success)` ตาม SKILL.md 3.2 ตัวอย่างสุดท้าย — เสนอให้ทำในรอบถัดไปพร้อมกับ badge animation ที่มีอยู่แล้ว (T46)
- PhotoPicker.tsx ยังไม่ได้ตรวจ thumb-zone/shimmer ในรอบนี้ (ไม่ได้อยู่ใน critical path ของปัญหา "โหลดสถานที่ไม่ขึ้น")

---

# ส่วนเพิ่มเติม: Advanced UI/UX v3 (Landmark List — Card/Map Toggle + Magazine Card)

หมายเหตุขอบเขต: ยกระดับต่อจาก Design System v2 ตามคำขอผู้ใช้ 3 ข้อ (redesign LandmarkList/LandmarkCard, แก้บั๊ก HEIC/photo-upload 400, แก้บั๊กรูป/สถานที่จาก Wikipedia ไม่ขึ้น) — ทำโดยตรงในโค้ดจริง (ไม่ผ่าน full pipeline เพราะขอบเขตชัดเจนจากผู้ใช้อยู่แล้ว)

## Layout: Card/Map View Toggle (แทนที่การ render แผนที่ใน fold แรกเสมอ)
- Component ใหม่: segmented toggle 2 ปุ่ม ("🖼️ การ์ด" / "🗺️ แผนที่") อยู่ใต้ heading "สถานที่แนะนำ" แทนตำแหน่งเดิมของ `LandmarkMap`
- States: `cards` (default, reset ทุกครั้งที่เปลี่ยนจังหวัด) / `map` — mutually exclusive (แสดงอย่างใดอย่างหนึ่ง ไม่ซ้อนกัน) เพื่อไม่ให้แผนที่เบียดพื้นที่รูปภาพการ์ดตาม fold แรก
- `LandmarkProgressIndicator` และ error banner (จากรอบ US-25) ยังคงแสดงอยู่นอก toggle เสมอ (shared ทั้งสอง mode)
- Accessibility: แต่ละปุ่ม `accessibilityRole="button"` + `accessibilityState={{selected}}` + label ระบุมุมมองชัดเจน

## LandmarkCard: Magazine/Bento Card v2
- ภาพปก: อัตราส่วนคงที่ 16:9 ทุก variant (เดิมเป็น fixed height ไม่สม่ำเสมอ), gradient overlay บางๆ ทุกใบ (หนักขึ้นเฉพาะ hero เพื่อรองรับ title บนภาพ)
- Category badge: pill โปร่งแสง (border-radius เต็ม, สีหมวดหมู่ opacity 0.82) แทนกล่องดำทึบเดิม
- Fallback ภาพ: ใช้ภาพ landscape จริงจาก Wikimedia (`FALLBACK_LANDMARK_IMAGE`) แทนไอคอนเดี่ยวๆ เมื่อไม่มีรูป/โหลดไม่สำเร็จ — การ์ดไม่ดูว่าง/พังอีกต่อไป
- ปุ่มเช็คอิน: ขยายเป็น min 44pt ตาม thumb-zone

## Bug Fix ที่เกี่ยวข้อง (ดูรายละเอียดเต็มใน docs/dev-notes.md "รอบ 7")
- Photo upload 400/HEIC: เปลี่ยนกลไกอ่านไฟล์ก่อนอัปโหลดจาก `fetch().blob()` เป็น `expo-file-system` base64 + `base64-arraybuffer` decode
- Wikipedia image/landmark ไม่ขึ้น: ครอบคลุมโดย fallback image ด้านบน (กรณีไม่มี thumbnail) ร่วมกับกลไก error-state แยกจาก empty-state ที่ทำไปแล้วในรอบ US-25 (T87-T89)
