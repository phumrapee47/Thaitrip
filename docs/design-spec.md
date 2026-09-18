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

---

# ส่วนเพิ่มเติม: Advanced UI/UX v4 (HomeScreen / StatsScreen / SettingsScreen)

หมายเหตุขอบเขต: ยกระดับ 3 หน้าจอที่เหลือให้อยู่ในระดับ Advance เดียวกับ Landmark List (v2/v3) ตาม `.claude/skills/advanced-mobile-uiux/SKILL.md` — ไม่แตะโครงสร้าง 3D map/geometry ใน `Map3D.tsx`/`ProvinceTile3D.tsx` (ความเสี่ยงสูง, นอกขอบเขตที่ผู้ใช้ขอ) เน้นที่ chrome รอบข้าง + หน้าจอ Stats/Settings ทั้งหน้า

## HomeScreen
- Top bar: ปุ่ม "สถิติ" และไอคอนตั้งค่าเปลี่ยนเป็น `PressableScale` (bounce + haptic light), ปุ่มตั้งค่าขยาย hit target เป็น 44×44pt
- `HeaderProgress`: ยกเป็น elevated Bento card (พื้นขาว, `SHADOWS.sm`, `RADIUS.lg`) ลอยเหนือพื้นหลัง แทนข้อความ+บาร์ลอยเปล่าเดิม, progress bar หนาขึ้น (5pt → 8pt) และ pill-rounded, loading state ใช้ `ShimmerBlock` แทนกล่องเทาแบน
- `Legend`: แต่ละรายการเปลี่ยนเป็น pill chip พื้นขาวมีเงาบางๆ แทนข้อความลอยเปล่า อ่านง่ายขึ้นเมื่อแยกจากพื้นหลัง

## StatsScreen
- Summary section เปลี่ยนจาก 1 การ์ดข้อความ 3 บรรทัด เป็น **Bento stat-tile grid** (3 การ์ดแนวนอน แต่ละใบมีไอคอน + ตัวเลขใหญ่ + label): จังหวัดปลดล็อก / บันทึกทั้งหมด / ภาคที่ไปมากที่สุด — ไม่แสดง tile ที่ 3 ถ้ายังไม่มี topRegion (พฤติกรรมเดิมคงไว้)
- Loading state: `ShimmerBlock` 3 tile แทนเส้นเทาแบน
- **Breaking text-format change**: ข้อความ "ปลดล็อกแล้ว X / 76 จังหวัด" / "บันทึกทั้งหมด N รายการ" / "ไปเยือน\<ภาค\>มากที่สุด" (1 sentence/1 Text node) แยกเป็นค่า+label คนละ Text node แล้ว (เช่น "2/76" + "จังหวัดปลดล็อก") — test ที่เคย `getByText('บันทึกทั้งหมด 3 รายการ')` ถูกอัปเดตให้ query แยกสองส่วนแล้ว (ดู `statsScreen.test.tsx`, `migrationNonBlocking.test.tsx`)

## SettingsScreen
- ครอบ account-status section (data-loss banner / linked-email text / sync summary) ด้วย elevated card เดียว (`SHADOWS.sm`, `RADIUS.lg`, พื้นขาว) แทนข้อความลอยเปล่าติดกับพื้นหลังหน้าจอ
- ปุ่ม "ผูกกับอีเมล" เปลี่ยนเป็น `PressableScale` (bounce + haptic light), ขยายเป็น min-height 44pt
- `DataLossWarningBanner`: ตัด margin ที่ผูกติดกับตำแหน่งเดิมออก (ให้ parent card คุมระยะห่างแทน) เพื่อให้วางในการ์ดใหม่ได้พอดี — เนื้อหา/สี/พฤติกรรม non-dismissible เดิมไม่เปลี่ยน
- Loading skeleton: `ShimmerBlock` แทนเส้นเทาแบน

## Shared component ที่ได้รับผลด้วย (ใช้ร่วมทั้ง Province Detail / Stats)
- `EmptyState.tsx`: ปุ่ม CTA เปลี่ยนเป็น `PressableScale` + haptic, ขยาย min-height 44pt
- `EntryListItem.tsx`: เปลี่ยนจาก `Pressable` + opacity-fade เป็น `PressableScale` (bounce + haptic light) ตามมาตรฐานเดียวกับ Landmark Card

## ข้อควรระวังสำหรับรอบถัดไป
- `Map3D.tsx`/`ProvinceTile3D.tsx` ยังไม่ได้แตะ (ทั้ง geometry และ interaction) — ถ้าจะทำต่อควรแยกเป็นรอบเฉพาะเพราะเป็น SVG/3D transform ที่ซับซ้อนและมี test coverage เยอะ (`map3d.test.tsx`, `map2dValidationScreen.test.tsx`)
- `EmailLinkForm.tsx` ยังไม่ได้ตรวจ/ยกระดับในรอบนี้

---

# ส่วนเพิ่มเติม: Bottom Tab Navigation & ข่าวท่องเที่ยว RSS (US-28 – US-32)

หมายเหตุขอบเขต: ส่วนนี้ครอบคลุมเฉพาะ task ที่ติดป้าย **[รอ design-spec]** ในรอบนี้ ได้แก่ T94 (ไอคอน tab bar จริง แทน text label ชั่วคราวจาก T92) และ T101–T104 (NewsScreen ทั้งหมด: list/loading/pull-to-refresh, news item card, empty/error state, cache indicator) — ไม่แตะโครงสร้าง navigation wiring จริง (T91–T93, T95–T96 เป็นงาน non-UI ของ programmer) ไม่เพิ่มหน้าจอใหม่นอกเหนือจาก NewsScreen หน้าเดียว ส่วน HomeScreen/StatsScreen/SettingsScreen เดิมไม่เปลี่ยน layout ภายใน (มีแค่ tab bar ห่อรอบนอกเพิ่มเข้ามา)

โทนภาพรวมเพิ่มเติม:
- NewsScreen ต้อง "ดูเป็นแอปเดียวกัน" กับ Landmark List/Card ที่ทำไว้แล้วใน v2–v3 — ใช้ token ชุดเดียวกันทั้งหมด (`COLORS`, `SPACING`, `RADIUS`, `SHADOWS` จาก `src/theme.ts`) การ์ดข่าวใช้ white card + `SHADOWS.sm` + `RADIUS.lg` + border `#EFEFEF` แบบเดียวกับ `LandmarkCard`/`EntryListItem` ไม่ใช่ native list แบบ iOS Mail/plain row ที่ไม่มีเงา/ไม่มีขอบ
- ทั้งแอปยังไม่เคยติดตั้ง icon library ใดๆ (`@expo/vector-icons` ยังไม่ยืนยันว่าใช้ได้จริงในโปรเจกต์นี้ — ดู T91) และ pattern ปัจจุบันของแอปใช้ **emoji เป็นไอคอนเสมอ** (⚙️ settings, ⭐ Province Master, 🖼️/🗺️ segmented toggle) — สเปกนี้ยึด pattern เดิมเป็นดีฟอลต์ที่ implement ได้ทันทีไม่ต้องรอผล T91 พร้อมระบุไอคอนชุด vector สำรองไว้เผื่อ T91 ยืนยันว่าใช้ได้จริง
- Error/offline messaging ของข่าว (T103, T106, T107) ใช้โทนกลาง (`COLORS.textSecondary` + ปุ่ม accent เขียว) เหมือน `LandmarkFetchErrorState` เดิมใน `LandmarkList.tsx` — **ไม่ใช้สีแดง/`COLORS.danger`** เพราะเป็นความล้มเหลวของแหล่งข้อมูลภายนอก/เครือข่าย ไม่ใช่ validation error ของผู้ใช้ ตรงตามหลักการเดิมของแอปที่แยกโทนสีตามความหมาย ("error ของระบบ" vs "แจ้งให้ทราบ/ข้อจำกัดภายนอก")

---

## User Flow: US-28 (Bottom Tab Bar — สลับแท็บ "แผนที่" / "ข่าว")
1. ผู้ใช้เปิดแอป เห็น Bottom Tab Bar ปรากฏอยู่เสมอที่ขอบล่างของจอ (2 แท็บ: "แผนที่" ซ้าย, "ข่าว" ขวา) ไม่ว่าจะอยู่หน้าจอใดในแท็บปัจจุบัน (ยกเว้นตอนอยู่ใน AddEntry ที่ full-screen push ทับ — ดูหมายเหตุ Thumb-zone ด้านล่าง)
2. แท็บ "แผนที่" เป็นแท็บเริ่มต้นเสมอเมื่อเปิดแอปครั้งแรกในแต่ละเซสชัน แสดง HomeScreen เดิมทุกประการ (3D Map, GlobalSearchBar, Header Progress, Legend, ปุ่ม Stats/Settings ใน header)
3. ผู้ใช้แตะแท็บ "ข่าว" → สลับไปแสดง NewsScreen ทันที (ไม่มี transition/animation แบบ push, เป็น swap มาตรฐานของ bottom-tabs) แท็บที่ active เปลี่ยนสีไอคอน/label เป็น `COLORS.accent` ทันที ส่วนแท็บที่ไม่ active เป็น `COLORS.textSecondary`
4. ผู้ใช้แตะจังหวัด/Landmark จากแท็บ "แผนที่" → push ProvinceDetail/AddEntry ภายใน stack ของแท็บ "แผนที่" ตามเดิม (bottom tab bar ยังคงแสดงอยู่ระหว่าง ProvinceDetail เพราะเป็น stack ปกติ ไม่ใช่ modal เต็มจอ — ส่วน AddEntry ที่เป็น full-screen push อาจซ่อน tab bar ชั่วคราวตาม native behavior ของ `bottom-tabs`+`native-stack` ซ้อนกัน ซึ่งเป็นพฤติกรรมมาตรฐานที่ยอมรับได้ ไม่ต้องบังคับให้เห็นตลอด)
5. ผู้ใช้สลับไปแท็บ "ข่าว" แล้วกลับมาแท็บ "แผนที่" → เห็นหน้าจอ/scroll position เดิมที่ค้างอยู่ทันที (nested stack ของแท็บ "แผนที่" ไม่ unmount/reset เมื่อสลับแท็บออกไป ตามพฤติกรรมมาตรฐานของ `@react-navigation/bottom-tabs`)
6. จากทั้ง 2 แท็บ ผู้ใช้แตะไอคอน "สถิติ"/"ตั้งค่า" ใน header ได้เสมอ → push เข้า stack ของแท็บปัจจุบันที่ผู้ใช้อยู่ (ไม่ใช่ข้ามไปแท็บอื่น) กดย้อนกลับแล้วกลับสู่หน้าจอเดิมในแท็บนั้น

## User Flow: US-29 / US-30 (ดูข่าว + cache/offline)
1. ผู้ใช้แตะแท็บ "ข่าว" ครั้งแรกของเซสชัน (หรือเปิดแอปมาที่แท็บนี้)
2. ถ้ายังไม่มี cache เดิมเลย (เปิดแอปครั้งแรกสุด) และกำลังดึงข้อมูลอยู่ → เห็น News Loading Skeleton (shimmer) ทันที ไม่ใช่จอว่างเปล่า
3. ดึงสำเร็จ → เห็นรายการ News Card เรียงจากข่าวล่าสุดไปเก่าสุด แต่ละใบมีรูปปก/placeholder, หัวข้อ, สรุปสั้น, วันที่
4. ถ้ามี cache เดิมอยู่แล้ว (ไม่ว่าจะยังไม่หมดอายุหรือหมดอายุแล้ว) → เห็นรายการจาก cache ทันทีก่อนเสมอ (ไม่รอ network) — ถ้า cache หมดอายุ (เกิน 45 นาที) และมีเน็ต ระบบ fetch ใหม่ในพื้นหลังแบบเงียบๆ แล้วสลับรายการเป็นชุดใหม่เมื่อโหลดเสร็จโดยไม่กระพริบ/ไม่ reset scroll position กลับบนสุด (ถ้าผู้ใช้ยังอยู่ตำแหน่งกลาง list)
5. ผู้ใช้ทำ pull-to-refresh (ลากลงจากบนสุดของ list) → เห็น native RefreshControl spinner สีเขียว (`COLORS.accent`) หมุนขณะดึงใหม่ พร้อม haptic light ทันทีที่ปล่อยนิ้วเข้าเงื่อนไข refresh (ไม่ต้องรอ fetch เสร็จ) → เมื่อเสร็จ list อัปเดตและ spinner หายไป
6. ถ้าตอนนี้ไม่มีเน็ต/ดึงล้มเหลว แต่มี cache เดิม → เห็นรายการจาก cache พร้อม Cache Indicator บาง ๆ ด้านบนสุดของ list บอกว่า "กำลังแสดงข่าวจากแคช • อัปเดตล่าสุด HH:mm" ไม่ใช่ error เต็มจอ
7. ถ้าไม่มีเน็ต/ดึงล้มเหลว และไม่เคยมี cache สำเร็จมาก่อนเลย → เห็น News Error State เต็มพื้นที่ list แทน (ไอคอน + ข้อความ + ปุ่ม "ลองอีกครั้ง")
8. ถ้า feed ดึงสำเร็จแต่ไม่มีข่าวเลย (รายการว่างจริง) → เห็น News Empty State แทน list (แยกจาก error state ข้อ 7 อย่างชัดเจน)

## User Flow: US-31 / US-32 (เปิดอ่านข่าวผ่าน in-app browser + edge case)
1. ผู้ใช้แตะ News Card ใดใน list → การ์ดหด scale ลงเบาๆ (PressableScale, scale 0.96) พร้อม haptic light ทันทีตอนกด ก่อนเปิด in-app browser (`expo-web-browser`) ไปยัง `link` ของข่าวนั้น
2. ผู้ใช้อ่านเนื้อหาเต็มใน in-app browser (native modal overlay) แล้วกดปิด (ปุ่ม Done/กากบาทของ browser เอง) → กลับสู่ NewsScreen ที่ scroll position และรายการเดิมยังอยู่ครบ ไม่ reset กลับบนสุด (เพราะ NewsScreen ไม่ unmount ระหว่าง browser เปิดอยู่)
3. ถ้า `link` ของข่าวนั้นว่างเปล่า/parse ผิดพลาด → แตะแล้วไม่เปิด browser แต่เห็น Inline Toast ข้อความ "ไม่สามารถเปิดข่าวนี้ได้" ปรากฏสั้นๆ แล้วหายไปเอง ไม่ crash ไม่ค้าง
4. ถ้าไม่มีเน็ต ณ ตอนแตะข่าว → เห็น Inline Toast ข้อความ "ต้องเชื่อมต่ออินเทอร์เน็ตเพื่ออ่านข่าวเต็ม" แทนการเปิด browser ค้างเป็นหน้าขาว
5. ข่าวที่ไม่มีรูป/รูปโหลดไม่สำเร็จ → เห็น News Card Placeholder Cover แทนรูปจริง (ไม่ใช่พื้นที่ว่าง/broken-image icon)
6. ข่าวที่ซ้ำกัน (link/title ซ้ำ) หรือไม่มี pubDate ที่ parse ได้ → ผู้ใช้ไม่เห็นรายการซ้ำในลิสต์ และข่าวที่ไม่มีวันที่ถูกจัดไว้ท้ายสุดของ list เสมอ (พฤติกรรม data-layer ล้วนๆ ไม่มี UI แยก — News Card ของแถวนั้นแสดงผลปกติทุกอย่างยกเว้นส่วนวันที่ ดู Content ของ News Card ด้านล่าง)

---

## Components (ส่วนเพิ่มเติม รอบ Bottom Tab Navigation & ข่าวท่องเที่ยว RSS)

### Bottom Tab Bar (T92, T94)
- Purpose: root-level navigation ให้สลับระหว่างแท็บ "แผนที่" กับ "ข่าว" เข้าถึงได้จากทุกที่ในแอปด้วยการแตะครั้งเดียว
- โครงสร้าง: `@react-navigation/bottom-tabs`, 2 แท็บคงที่เสมอ (ไม่มีแท็บที่ 3, ไม่ซ่อน/แสดงแบบมีเงื่อนไข)
- ตำแหน่ง/Safe area: ยึดขอบล่างของจอเสมอ ใช้ safe-area inset อัตโนมัติของ `bottom-tabs` (มี `SafeAreaProvider` ของ `react-navigation` อยู่แล้วในโปรเจกต์) — iOS: bar สูง 49pt + safe-area bottom inset (รวมกันมักได้ ~83pt บนจอมี home indicator), Android: bar สูง 56pt + safe-area bottom inset ของ gesture nav (ถ้ามี) — ไม่ hardcode ความสูงเองเพื่อไม่ให้ชนกับ gesture bar ของแต่ละเครื่อง
- Visual: พื้นหลังขาว (`COLORS.background`), เส้นขอบบน/เงาบาง (`SHADOWS.sm`) แยกจากเนื้อหาด้านบน แทนเส้นขีดทึบ 1px แบบ native ดีฟอลต์ ให้ดูเป็น elevated bar สอดคล้องกับ Bento card style ที่เหลือของแอป
- Icon (ดีฟอลต์ที่ใช้งานได้ทันที — ไม่ต้องรอ T91): emoji ตาม pattern เดิมของแอป — "🗺️" สำหรับแท็บ "แผนที่", "📰" สำหรับแท็บ "ข่าว" วางเหนือ label ข้อความ ขนาด emoji ~20-22pt
- Icon (ทางเลือกถ้า T91 ยืนยันว่า `@expo/vector-icons` ใช้งานได้จริง): Ionicons `map`/`map-outline` (แท็บแผนที่), `newspaper`/`newspaper-outline` (แท็บข่าว) — outline variant เมื่อ inactive, filled variant เมื่อ active ตาม native tab bar convention ทั่วไป โดยไม่เปลี่ยน label/สี/เลย์เอาต์อื่นใดจากที่ระบุด้านล่าง
- สี:
  - active: ไอคอน + label สี `COLORS.accent` (#1D9E75), label ตัวหนา (`fontWeight: '700'`)
  - inactive: ไอคอน + label สี `COLORS.textSecondary` (#6B6B6B), label น้ำหนักปกติ (`fontWeight: '500'`)
- States:
  - active: ตามสี active ด้านบน, `accessibilityState={{ selected: true }}`
  - inactive: ตามสี inactive ด้านบน, `accessibilityState={{ selected: false }}`
  - pressed: ใช้ ripple/opacity feedback มาตรฐานของ `bottom-tabs` (ไม่ต้องเพิ่ม `PressableScale` custom เพราะ tab bar item เป็น native touchable ของ library ที่มี feedback ในตัวอยู่แล้ว — การ custom ทับอาจขัดกับ accessibility ที่ library จัดการให้)
  - haptic: `Haptics.impactAsync(ImpactFeedbackStyle.Light)` ทุกครั้งที่แตะสลับแท็บสำเร็จ (แตะแท็บที่ active อยู่แล้วซ้ำไม่ trigger haptic ซ้ำ เพื่อไม่ให้รู้สึกสั่นพร่ำเพรื่อ)
- Accessibility: แต่ละแท็บตั้ง `accessibilityRole="tab"` (หรือ `"button"` ถ้า library บังคับ role อื่น), `accessibilityLabel="แท็บแผนที่"` / `"แท็บข่าว"`, `accessibilityState={{ selected }}` ตามสถานะ active/inactive ปัจจุบัน — ให้ screen reader อ่านลำดับ "แท็บแผนที่, เลือกอยู่" ได้ถูกต้อง
- Content: 2 tab item ("แผนที่", "ข่าว") เรียงจากซ้ายไปขวาตามลำดับที่ requirement ระบุ (แผนที่ก่อนเสมอเพราะเป็นฟีเจอร์หลักเดิม)

### NewsScreen — List Container (T101)
- Purpose: หน้าจอหลักของแท็บ "ข่าว" แสดงรายการข่าวทั้งหมด พร้อม pull-to-refresh
- โครงสร้าง: `FlatList` (ไม่ใช่ `ScrollView` + `.map` เพราะต้องรองรับ `RefreshControl` + จำนวนข่าวที่อาจมากได้ตาม T112), header ของหน้าเป็น `SafeAreaView` + topBar เดียวกับ HomeScreen (ชื่อแอป/หัวข้อ "ข่าวท่องเที่ยว" ด้านซ้าย, ปุ่มไอคอน Stats/Settings ด้านขวา — เหมือน topBar ของ HomeScreen ทุกประการเพื่อความ consistent)
- List spacing (8pt grid): screen padding แนวนอน `SPACING.md` (16), gap ระหว่างการ์ด `SPACING.sm` (12), padding บน/ล่างของ list content `SPACING.md`/`SPACING.xl` (เผื่อพื้นที่เหนือ Bottom Tab Bar ไม่ให้การ์ดสุดท้ายชิดขอบจอเกินไป)
- States:
  - loading-first (ยังไม่มี cache เลย กำลังดึงครั้งแรก): แสดง News Loading Skeleton แทน list ทั้งหมด (ดู component ด้านล่าง)
  - success-fresh / success-cache (มีรายการอย่างน้อย 1 ชิ้นไม่ว่าจะจาก network สดหรือ cache): แสดง list ของ News Card ปกติ, ถ้าเป็นข้อมูล cache ที่ fetch สดล้มเหลว/ไม่มีเน็ตขณะนี้ → แสดง Cache Indicator เป็น `ListHeaderComponent` ด้านบนสุดของ list เพิ่มเข้ามา
  - refreshing: `RefreshControl` แสดงระหว่าง pull-to-refresh (native spinner, ไม่ใช่ shimmer เพราะเป็น native gesture-driven indicator ที่ผู้ใช้คุ้นเคยอยู่แล้ว ไม่ขัดกับกฎ SKILL.md 4.1 ซึ่งพูดถึงการโหลดเนื้อหาเริ่มต้นที่มี layout ชัดเจน ไม่ใช่ refresh gesture) — list เดิมยังแสดงอยู่ด้านล่าง ไม่ใช่แทนที่ด้วย skeleton
  - empty: feed คืนรายการว่างเปล่าจริง → แสดง News Empty State แทน list ทั้งหมด
  - error (ล้มเหลว + ไม่มี cache): แสดง News Error State แทน list ทั้งหมด
- Content: `ListHeaderComponent` (Cache Indicator ถ้ามี) + array ของ News Card + `ItemSeparatorComponent` (ระยะห่าง `SPACING.sm` ระหว่างการ์ด — ใช้ margin ของการ์ดเองแทนก็ได้)

### News Loading Skeleton (T101)
- Purpose: shimmer skeleton ระหว่างดึงข้อมูลครั้งแรกที่ยังไม่มี cache — ตามกฎ SKILL.md 4.1 (ห้าม `ActivityIndicator` เดี่ยวกลางจอสำหรับเนื้อหาที่มี layout ชัดเจน) ใช้ `ShimmerBlock` ที่มีอยู่แล้วในโปรเจกต์
- จำนวน/layout: 5 การ์ด skeleton เรียงแนวตั้ง ขนาด/สัดส่วนจำลอง News Card จริงเป๊ะ (thumbnail 88×88 ซ้าย + 2 บรรทัดข้อความยาวไม่เท่ากันขวา + 1 บรรทัดวันที่สั้นด้านล่าง) เพื่อไม่เกิด layout shift ตอนข้อมูลจริงมาแทน
- States: single state (แสดงเฉพาะตอน loading-first เท่านั้น หายไปทันทีที่มีข้อมูล — ไม่ว่าจาก network หรือ cache)
- Content: pulse opacity 0.4↔0.9 ต่อ block เดียวกับ `ShimmerBlock` เดิมที่ใช้ใน Landmark List

### News Card (T102)
- Purpose: 1 แถวต่อข่าว 1 ชิ้น สรุปข้อมูลให้กวาดตาอ่านเร็ว แตะแล้วเปิดอ่านเต็มผ่าน in-app browser
- Layout: horizontal row card (ไม่ใช่ vertical hero เหมือน Landmark hero card เพราะข่าวเป็น continuous feed เรียงตามเวลา ไม่มีแนวคิด "อันดับ 1" ที่ควรเด่นกว่ารายการอื่นแบบ Landmark) — thumbnail สี่เหลี่ยมจัตุรัส 88×88pt ชิดซ้าย (`RADIUS.md`), เว้นระยะ `SPACING.sm` แล้วตามด้วยคอลัมน์ข้อความด้านขวาที่เหลือ (title, summary, date เรียงแนวตั้ง)
- Card container: พื้นขาว, `RADIUS.lg`, `SHADOWS.sm`, border `#EFEFEF` 1px, padding `SPACING.sm` รอบทั้งใบ — สไตล์เดียวกับ `LandmarkCard`/`EntryListItem` ทุกประการเพื่อความ consistent กับ design language เดิม
- Content:
  - thumbnail: รูปปกข่าว (จาก `enclosure`/`media:content`/รูปแรกใน description) หรือ News Card Placeholder Cover ถ้าไม่มี/โหลดไม่สำเร็จ (`onError` fallback แบบเดียวกับ `LandmarkCard`'s `imgError` state)
  - title: ตัวหนา 15pt, `COLORS.textPrimary`, ตัดที่ **2 บรรทัด** (`numberOfLines={2}`) ด้วย ellipsis
  - summary: 13pt, `COLORS.textSecondary`, ตัดที่ **2 บรรทัด** (`numberOfLines={2}`) ด้วย ellipsis — เนื้อหาผ่านการตัด HTML tag ออกแล้วจาก parser ก่อนถึง component นี้
  - date: 12pt, `COLORS.textSecondary`, format ไทยอ่านง่ายแบบเดียวกับ `EntryListItem` เดิม (เช่น "12 ก.ย. 2569") — ถ้าข่าวนั้นไม่มี `pubDate` ที่ parse ได้ ไม่แสดงบรรทัดวันที่เลย (เว้นว่างไป ไม่แสดงคำว่า "ไม่ระบุวันที่" เพื่อไม่ให้ดูเป็นข้อมูลผิดปกติ — ตำแหน่ง list ของรายการนี้ที่ถูกจัดไว้ท้ายสุดเป็นตัวสื่อความหมายอยู่แล้วว่าไม่มีวันที่อ้างอิง)
- States:
  - default: ตาม Content ด้านบน
  - image-loading: thumbnail แสดง `ShimmerBlock` ขนาด 88×88 แทนระหว่างรอโหลดรูป (ถ้า loading เป็น async แยกจาก data fetch — ถ้ารูปโหลดพร้อม data ให้ข้าม state นี้ไปเลย)
  - pressed: `PressableScale` ทั้งการ์ด (scale 0.96 + spring กลับ) พร้อม haptic light ก่อนเปิด in-app browser (ดู Micro-interaction ด้านล่าง)
- Accessibility: การ์ดทั้งใบ `accessibilityRole="button"`, `accessibilityLabel="${title}, เผยแพร่ ${dateFormatted หรือละไว้ถ้าไม่มีวันที่}"`, `accessibilityHint="แตะเพื่อเปิดอ่านข่าวเต็มในเบราว์เซอร์ในแอป"` — ตาม pattern เดียวกับ `LandmarkCard` ที่มี `accessibilityRole="switch"` (T110)

### News Card Placeholder Cover (T102, US-32 AC2)
- Purpose: ภาพแทนเมื่อข่าวไม่มีรูปเลย หรือ URL รูปโหลดไม่สำเร็จ — ต้องไม่ใช่พื้นที่ว่าง/broken-image icon ของระบบ
- แนวทาง: **ไม่ hotlink ภาพ stock ภายนอก** (ต่างจาก `FALLBACK_LANDMARK_IMAGE` ของ Landmark ที่ hotlink จาก Wikimedia ได้เพราะเป็นโดเมนที่ทีมตรวจสอบ/ควบคุมได้ในระดับหนึ่ง) เพราะข่าวมาจากโดเมนข่าวสารทั่วไปที่ทีมไม่ได้ curate ความน่าเชื่อถือของ asset ใดๆ ไว้ล่วงหน้า — ใช้ **placeholder ในแอปเอง** แทน: กล่องสี่เหลี่ยม 88×88 พื้นหลัง gradient อ่อนโทนเขียว (เช่น `COLORS.trackBg` → `#EFF7F3`) มีไอคอน emoji "📰" วางกึ่งกลาง
- States: single state (แสดงแทน `<Image>` ทันทีที่ไม่มี image URL หรือ `onError` ทำงาน — เหมือนกลไก `imgError` ของ `LandmarkCard`)
- Content: กล่อง placeholder ตามด้านบน ไม่มี text label ซ้อนทับ (ไอคอนสื่อความหมายเพียงพอในบริบทของการ์ดข่าวที่มี title ข้างๆ อยู่แล้ว)

### Cache Indicator (T104)
- Purpose: บอกผู้ใช้ว่ากำลังดูข่าวจาก cache (ไม่ใช่ข้อมูลสดล่าสุด) แบบไม่รบกวนการอ่าน list
- ตำแหน่ง: `ListHeaderComponent` ของ NewsScreen List Container อยู่เหนือการ์ดข่าวใบแรก
- States:
  - visible: แสดงเมื่อรายการที่เห็นอยู่มาจาก cache และการ fetch สดล่าสุด (ถ้ามีการพยายาม) ไม่สำเร็จ หรือกำลังอยู่ระหว่าง background refresh ที่ยังไม่เสร็จ
  - hidden: ไม่ render เมื่อรายการที่เห็นเป็นผลจาก fetch สดที่สำเร็จล่าสุดแล้ว (ไม่มี indicator ค้างเมื่อข้อมูล up-to-date จริง)
- Content: แถบบาง (pill เต็มความกว้าง, พื้นหลัง `COLORS.trackBg`, `RADIUS.md`, padding `SPACING.xs`/`SPACING.sm`) ไอคอน 🕐 เล็กด้านซ้าย + ข้อความ 12pt `COLORS.textSecondary` "กำลังแสดงข่าวจากแคช • อัปเดตล่าสุด HH:mm" (format เวลาแบบ 24 ชม.ไทย) — ไม่มีปุ่ม action ในแถบนี้ (การ refresh ทำผ่าน pull-to-refresh gesture ของ list อยู่แล้ว ไม่ต้องมีปุ่มซ้ำซ้อน)

### News Empty State (T103, US-32 AC1)
- Purpose: feed ดึงสำเร็จแต่ไม่มีข่าวเลย (รายการว่างเปล่าจริง) — แยกจาก error state ให้ชัดเจนตามที่ AC ระบุ
- แนวทาง: reuse `EmptyState.tsx` component เดิม (ใช้ซ้ำ ไม่สร้าง component ใหม่) เพราะ pattern เดียวกันเป๊ะกับ Empty State (Province)/(Stats) เดิม
- States: single state
- Content: ข้อความ "ยังไม่มีข่าวในขณะนี้" + ข้อความรองเล็กกว่า (ถ้าต้องการ) "ลากลงเพื่อรีเฟรช" เพื่อบอกใบ้วิธี retry เพราะหน้านี้ไม่มีปุ่ม action ชัดเจนเหมือน error state (ไม่มี actionLabel/onAction ส่งเข้า `EmptyState` — ปล่อยให้ pull-to-refresh gesture เป็นทางเดียวในการลองใหม่ สอดคล้องกับความหมายว่า "นี่ไม่ใช่ความผิดพลาด แค่ยังไม่มีข่าวตอนนี้")

### News Error State (T103, US-32 AC4)
- Purpose: RSS request ล้มเหลวจริง (network error, timeout, HTTP error, XML parse error) และไม่มี cache เดิมให้ fallback — ต้องมีทางลองใหม่ได้ทันทีในหน้าเดิม
- แนวทาง: reuse pattern เดียวกับ `LandmarkFetchErrorState` ใน `LandmarkList.tsx` (ตามที่ T103 ระบุให้ reuse) — คือ่ข้อความสื่อความหมาย + ปุ่ม/ลิงก์ "ลองอีกครั้ง" ที่เรียก fetch logic เดิมซ้ำ ไม่ต้องออกจากแท็บ
- States:
  - default: แสดงเต็มพื้นที่ list (แทนที่ News Loading Skeleton/list) — ไอคอนกลางๆ (เช่น 📡 หรือ pin-off outline สีเทา ไม่ใช่ไอคอนสีแดง/อันตราย), ข้อความหลัก "ดึงข่าวไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่", ปุ่ม `PressableScale` พื้นเขียว `COLORS.accent`, ข้อความขาว "ลองอีกครั้ง", min-height 44pt, haptic light ตอนกด
  - retrying: ปุ่ม "ลองอีกครั้ง" เปลี่ยนเป็น disabled + loading indicator เล็กในปุ่ม ระหว่างรอผล retry (เหมือน `LandmarkFetchErrorState` ที่มี `retrying` prop อยู่แล้ว)
- Content: ตามที่ระบุใน `default` state ด้านบน — สีข้อความ `COLORS.textSecondary` (ไม่ใช่ `COLORS.danger`) ตามโทนที่กำหนดไว้ต้นหัวข้อนี้

### News Open-Failure Toast (T106, T107)
- Purpose: แจ้งผู้ใช้แบบไม่บล็อกเมื่อเปิดข่าวไม่ได้ (ลิงก์เสีย) หรือไม่มีเน็ตตอนกด — โดยไม่ crash และไม่เปิด browser ค้างเป็นหน้าขาว
- แนวทาง: transient toast/snackbar ที่ลอยขึ้นจากด้านล่างจอ (เหนือ Bottom Tab Bar เล็กน้อย ไม่บังแท็บ) auto-dismiss เองหลัง ~2.5 วินาที ไม่ต้องกดปิดเอง (เทียบเท่ากับ toast "ผูกอีเมลสำเร็จ"/"บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" ที่มี pattern อยู่แล้วในเอกสารส่วน Landmark ด้านบน — ใช้ pattern เดียวกัน)
- States:
  - link-invalid: ข้อความ "ไม่สามารถเปิดข่าวนี้ได้"
  - offline: ข้อความ "ต้องเชื่อมต่ออินเทอร์เน็ตเพื่ออ่านข่าวเต็ม"
- Content: พื้นหลังเทาเข้ม/`#1A1A1A` โปร่งแสงเล็กน้อย (toast มาตรฐาน ไม่ใช่โทน amber/แดง เพราะเป็นข้อความแจ้งเหตุผลสั้นๆ ไม่ใช่ warning ที่ต้องเรียกร้องความสนใจสูง), ข้อความขาว 14pt กึ่งกลาง, `RADIUS.md`, ไม่มีปุ่ม action ในตัว toast เอง (ผู้ใช้แค่รับทราบแล้ว list ข่าวยังอยู่ที่เดิมให้ลองข่าวอื่นได้)

---

## Micro-interactions & Haptics สรุป (รอบ Bottom Tab Navigation & ข่าว)
- แตะสลับแท็บ (Bottom Tab Bar): `Haptics.impactAsync(Light)` เมื่อสลับไปแท็บใหม่สำเร็จเท่านั้น (ไม่ trigger ซ้ำถ้าแตะแท็บที่ active อยู่แล้ว)
- ลาก pull-to-refresh จนถึง threshold: `Haptics.impactAsync(Light)` ทันทีที่ระบบเริ่ม fetch จริง (ไม่ต้องรอผลลัพธ์)
- แตะ News Card: `PressableScale` (scale 0.96, spring `damping:12, stiffness:150` เหมือนมาตรฐานเดิมของแอป) + `Haptics.impactAsync(Light)` ทันทีตอนกด ก่อน `openBrowserAsync` เพื่อลดความรู้สึกหน่วงระหว่างรอ native modal เปิด
- แตะปุ่ม "ลองอีกครั้ง" ใน News Error State: haptic light เหมือนปุ่ม CTA อื่นในแอป (`PressableScale`/`EmptyState` เดิม)

## Thumb-zone & Accessibility สรุป (รอบ Bottom Tab Navigation & ข่าว)
- Bottom Tab Bar เป็นตัวอย่าง thumb-zone ที่ดีอยู่แล้วโดยธรรมชาติของ pattern (อยู่ล่างสุดของจอเสมอ) — ไม่ต้องออกแบบเพิ่ม
- News Card ทั้งใบเป็น touch target เดียว (ไม่ใช่แค่ thumbnail หรือแค่ title) สูง ≥ 88pt (สูงกว่าเกณฑ์ 44pt ขั้นต่ำอยู่แล้วโดยธรรมชาติของ layout)
- ปุ่ม "ลองอีกครั้ง" ใน News Error State และปุ่มในทุก state อื่นของหน้านี้ยึด min-height 44pt ตามมาตรฐานเดิมของแอปเสมอ
- Tab bar accessibility label ภาษาไทยชัดเจนตามที่ระบุใน component ด้านบน, News Card accessibility label รวม title + วันที่ (ถ้ามี) ให้ screen reader อ่านได้ครบในครั้งเดียวโดยไม่ต้องไล่อ่านทีละ sub-element

---

## ข้อเสนอแนะที่อาจขัดกับ requirement (รอบ Bottom Tab Navigation & ข่าว)

- ประเด็น E: requirement (T106/T107, US-31 AC3–4) ระบุเพียงว่าต้อง "แสดงข้อความแจ้ง" เมื่อเปิดข่าวไม่ได้/ไม่มีเน็ต แต่ไม่ได้ระบุรูปแบบ UI ที่แน่นอนว่าเป็น toast ชั่วคราว, inline banner ค้างในหน้า, หรือ modal alert — เอกสารนี้เลือกออกแบบเป็น **transient toast auto-dismiss** (ทางเลือก A) ด้วยเหตุผลว่าไม่บล็อกผู้ใช้จากการอ่านข่าวอื่นต่อและสอดคล้องกับความถี่ที่ค่อนข้างต่ำของ edge case นี้ (ลิงก์เสีย/ไม่มีเน็ต ไม่ใช่ทุกครั้งที่กด)
  - ทางเลือก A (ตามที่ spec นี้ออกแบบ): transient toast ~2.5 วินาทีแล้วหายเอง ไม่มีปุ่มปิด ไม่บล็อก interaction อื่น
  - ทางเลือก B: inline banner ค้างอยู่ด้านบนของ list (คล้าย Cache Indicator) จนกว่าผู้ใช้จะแตะข่าวอื่นสำเร็จหรือปิดเอง — เห็นชัดกว่าถ้าผู้ใช้พลาดดู toast ที่หายเร็ว แต่เพิ่ม state ค้างในหน้าจอที่ต้อง manage เพิ่ม (ต้อง clear เมื่อไหร่ ฯลฯ)
  - เอกสารนี้เลือกทางเลือก A เป็นดีฟอลต์เพื่อให้ programmer เริ่มงานได้ทันที แต่ระบุไว้ให้ PM ทราบเผื่อเห็นว่า toast สั้นเกินไปจนผู้ใช้อาจพลาดข้อความ (โดยเฉพาะกรณี "ไม่มีเน็ต" ที่อาจอยากให้ผู้ใช้เห็นชัดกว่านี้) และต้องการเปลี่ยนเป็นทางเลือก B แทน

- ประเด็น F (ไม่ใช่ conflict แต่เป็นข้อสังเกตทางเทคนิคส่งต่อ programmer): requirement ไม่ได้พูดถึงพฤติกรรมของ Bottom Tab Bar ระหว่างอยู่ใน AddEntryScreen (full-screen push จากแท็บ "แผนที่") — ตาม native behavior มาตรฐานของ `@react-navigation/bottom-tabs` ซ้อนกับ `native-stack` ปกติแล้ว tab bar จะยังคงแสดงอยู่ระหว่าง stack screen ใดๆ ที่ push ทับ เว้นแต่ตั้ง `tabBarStyle: { display: 'none' }` ใน `screenOptions` ของ screen นั้นโดยเฉพาะ — เอกสารนี้ไม่บังคับให้ซ่อน/ไม่ซ่อน tab bar ตอนอยู่ใน AddEntry เพราะไม่มี AC ใดกำหนดไว้ และไม่กระทบ UX หลักไม่ว่าจะเลือกทางใด ปล่อยเป็นดุลยพินิจของ programmer ตาม default behavior ของ library เพื่อลด effort ที่ไม่จำเป็น

- ประเด็น G (ไม่ใช่ conflict แต่เป็นข้อสังเกตเรื่อง asset reliability ส่งต่อ programmer/PM): ต่างจาก `FALLBACK_LANDMARK_IMAGE` ที่ทีมเลือก hotlink ภาพจาก Wikimedia Commons ได้เพราะเป็นโดเมนที่ตรวจสอบแล้วว่าเสถียรพอสมควร เอกสารนี้จงใจ**ไม่**เสนอ hotlink ภาพ placeholder จากภายนอกสำหรับข่าว (ดู News Card Placeholder Cover) เพราะไม่มีโดเมนที่ทีม curate ไว้ล่วงหน้าสำหรับ asset ประเภทนี้ และการ hotlink จากแหล่งใหม่ที่ไม่ได้ตรวจสอบเพิ่มความเสี่ยงเรื่อง broken link/เนื้อหาที่เปลี่ยนได้โดยไม่แจ้งล่วงหน้า จึงเลือก in-app icon placeholder แทนซึ่งไม่ต้องพึ่งเน็ตเลย — เป็นดุลยพินิจ UIUX ในกรอบเดิม ไม่ต้องรอ PM ตัดสินใจ แต่ระบุไว้เผื่อ PM ต้องการภาพ placeholder ที่ "ดูเป็นรูปจริง" มากกว่า icon (เช่นภาพ Thailand-tourism stock 1 ภาพที่ทีมเลือกเองและ bundle ไว้ใน assets ของแอปแทนการ hotlink — ทางเลือกนี้ทำได้เช่นกันถ้าต้องการ แต่เพิ่ม asset size ของ app bundle เล็กน้อย)

---

# ส่วนเพิ่มเติม: Advanced UI/UX v5 (ProvinceDetailScreen container + AddEntryScreen form)

หมายเหตุขอบเขต: รอบก่อนหน้า (v2–v4 + รอบ Bottom Tab/ข่าว) ยกระดับ `LandmarkList`/`LandmarkCard`, `HomeScreen`, `StatsScreen`, `SettingsScreen`, `NewsScreen` ไปแล้ว แต่ยังเหลือ 2 จุดที่ค้างอยู่ที่ระดับ Prototype เดิม (border เทาแบน `#D9D9D9`, radius 8pt คงที่, ไม่มีเงา, ปุ่มเป็น `Pressable` ธรรมดาไม่มี bounce/haptic, skeleton เป็นบล็อกสีเทานิ่งแทน shimmer): **ProvinceDetailScreen** (container/header/CTA/skeleton — ส่วนที่ไม่ใช่ `LandmarkList`) และ **AddEntryScreen** (ฟอร์มทั้งหน้ารวม field group, chip, ปุ่ม) รอบนี้ปิด gap นี้โดยใช้ token ชุดเดิมจาก `src/theme.ts` (`SPACING`/`RADIUS`/`SHADOWS`/`COLORS`) และ component เดิม (`PressableScale`, `ShimmerBlock`) ทั้งหมด — ไม่เพิ่ม dependency ใหม่ ไม่เปลี่ยน logic/state/validation ใดๆ

## Layout & Design Tokens

### ProvinceDetailScreen
- Header: back button เปลี่ยนจากข้อความ "‹ กลับ" ล้วนเป็นปุ่มวงกลม (`RADIUS.full`, 40×40pt, พื้นหลัง `#F2F2F2`, hitSlop 8) ครอบด้วย `PressableScale` haptic light — เพิ่ม tap target ให้ชัดเจนขึ้นแบบ thumb-friendly โดยไม่เปลี่ยนตำแหน่ง/การนำทาง
- เพิ่มเส้นแบ่งบางๆ ใต้ header (`borderBottomWidth:1, borderBottomColor:'#F0F0F0'`) แทนพื้นที่ว่างเฉยๆ เพื่อแยก header ออกจาก scroll body ให้มีมิติมากขึ้นแบบเบาๆ (ไม่ใช้เงาเพราะ header ไม่ลอย)
- เพิ่ม section label เล็ก "บันทึกทั้งหมด (N)" เหนือ Entry List (แสดงเฉพาะตอน success + length > 0) ให้ผู้ใช้ scan ได้เร็วว่ามีกี่รายการ โดยไม่กระทบ AC ใดของ US-5 (เป็นข้อความเสริม ไม่ใช่ state ใหม่)
- ปุ่ม "+ เพิ่มบันทึกใหม่": ยกเป็น elevated CTA (`RADIUS.lg`, `SHADOWS.md`, พื้นหลัง `COLORS.accent`) ครอบด้วย `PressableScale` haptic medium (เทียบเท่าน้ำหนักของ action ที่นำไปสู่ฟอร์มใหม่ ตามระดับเดียวกับ "กดเช็คอินสถานที่สำเร็จ" ใน SKILL.md 3.2) — ตำแหน่ง/เงื่อนไขการแสดงผล (เฉพาะเมื่อมี entry อยู่แล้ว) เหมือนเดิมทุกประการ
- Skeleton (loading state ของ Entry List): แทนที่ `View` สีเทาแบนนิ่งด้วย `ShimmerBlock` ขนาดเท่าแถวจริง (สูง 56pt + padding เท่า `EntryListItem`) ให้ตรงตามกฎ SKILL.md 4.1 (ต้องไม่ใช้บล็อกสีเทานิ่ง + ขนาดต้องตรงของจริง 100%)

### AddEntryScreen
- Header: back button วงกลมแบบเดียวกับ ProvinceDetailScreen (label "ยกเลิก" ยังคงเป็นข้อความเดิมภายในปุ่ม แต่ยกระดับเป็น pill `PressableScale` พื้นหลัง `#F2F2F2` แทนข้อความลอยเฉยๆ) — เส้นแบ่งใต้ header เหมือนกัน
- Field group card: จัดกลุ่มฟิลด์เป็น 2 การ์ดลอย (`SHADOWS.sm`, `RADIUS.lg`, พื้นหลังขาว, padding `SPACING.md`, คั่นด้วย `SPACING.lg`) แทนการเรียง label/input ต่อกันแบนราบทั้งหน้า:
  1. การ์ด "ข้อมูลหลัก": วันที่ (required) + ชื่อสถานที่ (required) + ช่องค้นหาสถานที่/chip ยืนยัน
  2. การ์ด "รายละเอียดเพิ่มเติม": บันทึกความทรงจำ, รูปภาพ, แท็ก, เช็คอินสถานที่ (ถ้ามี)
- Text input / date input: `RADIUS.md` (เดิม 8pt คงที่), border สีเทาอ่อนตอน default, เปลี่ยนเป็น `COLORS.accent` + `SHADOWS.sm` ตอน focus (ผูก `onFocus`/`onBlur` state ต่อฟิลด์) ให้ผู้ใช้เห็นชัดว่ากำลังพิมพ์ฟิลด์ไหนอยู่ — ไม่เปลี่ยนพฤติกรรม validation/error message ใดๆ (inline error ใต้ฟิลด์ยังคงเดิมทุกประการ)
- Landmark chip ("เช็คอินสถานที่"): ปรับเป็น pill ชัดเจนขึ้น (`RADIUS.full`, `SPACING.sm` padding แนวนอน) ครอบด้วย `PressableScale` haptic light ต่อชิป แทน `Pressable` ธรรมดา
- ปุ่ม "บันทึก"/"บันทึกการแก้ไข": elevated CTA (`SHADOWS.md`, `RADIUS.lg`) ครอบด้วย `PressableScale` haptic medium ตอนกด และเพิ่ม `Haptics.notificationAsync(Success)` ทันทีหลังบันทึกสำเร็จจริง (ก่อน `navigation.goBack()`) — ให้ความรู้สึกฉลองบันทึกสำเร็จ สอดคล้องกับรูปแบบเดิมที่แอปใช้กับ Province Master badge; ตอน `saving=true` ยังคงแสดง `ActivityIndicator` ในปุ่มเหมือนเดิม (ไม่ใช่ layout ที่มี "รูปทรงชัดเจน" แบบ skeleton rule ข้อ 4.1 จึงไม่ต้องเปลี่ยนเป็น shimmer)
- ปุ่ม "ลบบันทึกนี้": ครอบด้วย `PressableScale` haptic light (คงสี/ตำแหน่ง/`Alert.alert` confirm เดิมทุกประการ — ไม่ใช้ haptic แรงกว่านี้เพราะเป็นแค่จุดเปิด confirm dialog ยังไม่ใช่การลบจริง)

## States (ไม่มี state ใหม่เพิ่มจาก AC เดิม — ระบุเฉพาะจุดที่เปลี่ยนการแสดงผลของ state ที่มีอยู่แล้ว)
- Loading (ProvinceDetailScreen Entry List): shimmer แทนบล็อกเทานิ่ง (ดูด้านบน)
- Focus (AddEntryScreen inputs): เพิ่ม visual state ใหม่ระดับ micro-UI เท่านั้น (border+shadow) ไม่ใช่ state ทางธุรกิจ ไม่กระทบ validation/AC ใดๆ
- Success (AddEntryScreen save): เพิ่ม haptic ฉลองก่อนปิดฟอร์ม (ดูด้านบน) — ระยะเวลา/การ navigate กลับเหมือนเดิมทุกประการ
- Error/Empty/Saving state อื่นๆ ทั้งหมด: ไม่เปลี่ยนแปลงจาก spec เดิม (T21 Empty State, validation-error, saving disabled)

## Micro-interactions & Haptics สรุป (รอบนี้)
- ปุ่มกลับ/ยกเลิก (ทั้ง 2 หน้า): `PressableScale` haptic light
- CTA "+ เพิ่มบันทึกใหม่" (ProvinceDetail): `PressableScale` haptic medium
- Landmark chip (AddEntry): `PressableScale` haptic light ต่อชิป
- ปุ่ม "บันทึก"/"บันทึกการแก้ไข": `PressableScale` haptic medium ตอนกด + `Haptics.notificationAsync(Success)` ตอนบันทึกสำเร็จจริง
- ปุ่ม "ลบบันทึกนี้": `PressableScale` haptic light

## Thumb-zone & Accessibility
- ปุ่มกลับวงกลมทั้ง 2 หน้า: 40×40pt + hitSlop 8 (รวม effective tap target ≥ 44pt ตามเกณฑ์ขั้นต่ำ) พร้อม `accessibilityRole="button"` + `accessibilityLabel` ภาษาไทย ("กลับ" / "ยกเลิก")
- CTA หลักทั้ง 2 หน้า (`+ เพิ่มบันทึกใหม่`, `บันทึก`) อยู่ตำแหน่งเดิม (ท้ายเนื้อหาที่ scroll ถึง/บริเวณล่างของฟอร์ม) ซึ่งอยู่ใน thumb zone อยู่แล้วตาม layout เดิม — รอบนี้ไม่ย้ายตำแหน่ง เพิ่มแค่มิติ/bounce/haptic
- Landmark chip แต่ละอันคง `minHeight` ให้ไม่ต่ำกว่า 32pt ผลรวมกับ padding แนวตั้งให้ tap ได้สะดวกแม้เป็นชิปเล็ก (ยังต่ำกว่าเกณฑ์ 44pt ของปุ่มหลัก แต่เป็น pattern เดียวกับ chip อื่นทั้งแอปที่ยอมรับแล้วในรอบก่อนๆ เพราะอยู่เป็นกลุ่มชิดกันหลายอันในแถวเดียว)

## ข้อเสนอแนะที่อาจขัดกับ requirement (รอบนี้)
ไม่มี — รอบนี้เป็นการปรับ visual/micro-interaction ล้วนๆ บน 2 หน้าที่ logic/state/validation คงเดิมทั้งหมด ไม่มีจุดใดต้องให้ PM ตัดสินใจเพิ่ม

## Consistency fix เพิ่มเติม (พบระหว่างตรวจรอบนี้)
- `TagSelector.tsx` (ใช้ใน AddEntryScreen การ์ด "รายละเอียดเพิ่มเติม"): เดิมยังเป็น `Pressable` ธรรมดา + hardcoded spacing ไม่ผ่าน token — เปลี่ยนเป็น `PressableScale` haptic light ทุกชิป/ปุ่มเพิ่มแท็ก และเปลี่ยน spacing/radius ทั้งหมดให้อ้างอิง `SPACING`/`RADIUS` แทน
- `SettingsScreen.tsx`: back button เดิมเป็นข้อความลอย (`Pressable` ธรรมดา) ไม่ตรงกับ pattern ปุ่มกลับวงกลมที่ ProvinceDetailScreen/AddEntryScreen ใช้แล้ว — ปรับให้เป็น pattern เดียวกัน (`PressableScale` haptic light, pill background, เส้นแบ่งใต้ header)
- ตรวจสอบเพิ่มเติมพบ hardcoded `borderRadius: 8`/`#D9D9D9` หลงเหลืออยู่บางจุดใน `PhotoPicker.tsx`, `ProvinceMasterBadge.tsx`, `SearchPlaceField.tsx`, `DataLossWarningModal.tsx` (ค่าตัวเลขเท่ากับ `RADIUS.sm`/border สีเทาเริ่มต้นอยู่แล้ว ไม่ต่างจาก token ทางสายตา) — เป็นแค่ไม่ได้ reference ชื่อ token โดยตรง ไม่ใช่ความไม่สอดคล้องด้าน UX ที่มองเห็นได้ ปล่อยไว้เป็น tech-debt เล็กน้อยของรอบถัดไปถ้ามีเวลา ไม่กระทบ output ของรอบนี้

---

# ส่วนเพิ่มเติม: Motion & Animation Upgrade (US-34, รอบ 14)

> อ้างอิง: US-34 (docs/requirements.md), T118-T123 (docs/tasks.md), `.claude/skills/advanced-mobile-uiux/SKILL.md` §3 (Micro-interactions)
> ขอบเขต: เอกสารนี้กำหนดค่าที่ programmer เอาไปเขียนโค้ดตรงได้ทันที ไม่เปลี่ยน information architecture / สี / data model ตาม Out of Scope ของ US-34

## หลักการร่วม: Reduce Motion

ทุก animation ที่ระบุในเอกสารนี้ (screen transition, entrance animation, press feedback แบบ enhanced) ต้อง check `AccessibilityInfo.isReduceMotionEnabled()` ก่อนเล่นเสมอ:

- เรียกครั้งเดียวตอน mount ระดับ root (เช่นใน `AppNavigator.tsx` หรือ hook กลาง `useReduceMotion()`) เก็บผลใน state/context แล้ว subscribe event `AccessibilityInfo.addEventListener('reduceMotionChanged', ...)` เพื่ออัปเดตถ้าผู้ใช้เปลี่ยนค่าระหว่างใช้แอป
- ถ้า `true`: screen transition ให้ fallback เป็น cross-fade duration 120ms (ไม่ slide/scale), entrance animation ของ list ให้ตัด stagger ออกทั้งหมดและ opacity เข้า 0→1 ทันทีในเฟรมเดียว (หรือข้ามไปเลยก็ได้), press feedback enhanced ให้ตัด shadow-depress effect ออกเหลือแค่ scale เดิม 0.96 (ไม่เพิ่ม scale ให้แรงขึ้น) เพื่อลดการเคลื่อนไหวที่อาจกระตุ้นอาการเวียนศีรษะ
- นี่คือข้อกำหนดบังคับของทุก component ในหัวข้อ 1-3 ด้านล่าง ไม่ใช่ optional enhancement

---

## 1. Screen Transition (`AppNavigator.tsx`)

โครงสร้างปัจจุบันมี 2 nested native-stack (`MapStack`, `NewsStack`) ภายใต้ bottom-tabs — ยืนยันว่า **ควบคุมผ่าน native-stack `screenOptions`/`animation` prop ได้จริง** โดยไม่ต้องเพิ่มไลบรารีใหม่ (`@react-navigation/native-stack` รองรับ prop `animation` บน iOS/Android ผ่าน native screen transition อยู่แล้ว, ส่วน bottom-tabs ใช้ custom cross-fade ผ่าน `tabBarStyle`/screen wrapper ด้วย reanimated ที่มีอยู่แล้วในโปรเจกต์)

### 1.1 เปิด ProvinceDetailScreen (push จาก HomeScreen)
- Transition: `slide_from_right`
- ตั้งค่าใน `MapStack.Screen` (name="ProvinceDetail") ผ่าน `options={{ animation: 'slide_from_right', animationDuration: 280 }}`
- Easing: native default ของ native-stack (`easeInEaseOut` ฝั่ง iOS, standard Android Activity transition) — ไม่ต้อง custom easing เพิ่มเพราะ native-stack ใช้ native driver ของแพลตฟอร์มอยู่แล้ว ให้ความรู้สึกเป็น native จริง
- States: `default` (อยู่ที่ HomeScreen) → `animating` (280ms slide, กดข้ามได้ด้วยการแตะปุ่ม/gesture back ทันทีโดยไม่ต้องรอ, native-stack รองรับ interrupt โดยธรรมชาติ) → `settled` (ProvinceDetailScreen อยู่นิ่ง)
- Back (pop): ใช้ transition เดียวกันย้อนกลับ (native-stack จัดการอัตโนมัติเมื่อกำหนด `animation` ที่ screen)

### 1.2 เปิด AddEntryScreen (push จาก ProvinceDetailScreen)
- Transition: `slide_from_bottom` (สื่อความหมายว่าเป็น "โมดัลเพิ่มข้อมูลใหม่" ต่างจากการเข้าไปดูรายละเอียดที่ใช้ slide_from_right — ช่วยให้ผู้ใช้แยกความรู้สึกระหว่าง "navigate deeper" กับ "เปิดฟอร์มชั่วคราว" ได้โดยสัญชาตญาณ)
- ตั้งค่าใน `MapStack.Screen` (name="AddEntry") ผ่าน `options={{ animation: 'slide_from_bottom', animationDuration: 300, presentation: 'modal' }}`
- States: `default` → `animating` (300ms, กดปุ่ม "ยกเลิก"/gesture-dismiss ระหว่าง animation ได้ทันที) → `settled`

### 1.3 สลับแท็บ "แผนที่" / "ข่าว"
- bottom-tabs (`@react-navigation/bottom-tabs`) ไม่มี built-in cross-fade prop ที่ปรับ duration ได้ตรงๆ เหมือน native-stack ดังนั้นให้ implement cross-fade เองด้วย `react-native-reanimated` ที่มีอยู่แล้ว: wrap เนื้อหาของแต่ละ `Tab.Screen` (หรือใช้ custom `tabBar`/screen listener) ให้ opacity animate จาก 0 → 1 ด้วย `withTiming(1, { duration: 180 })` ทุกครั้งที่ tab นั้น gain focus (ใช้ `useIsFocused()` หรือ `useFocusEffect` เป็น trigger)
- ค่าที่แน่นอน: fade-out ของแท็บเดิม 100ms (opacity 1→0.3, ไม่ต้อง 0 เต็มเพราะ tab ถูกสลับ mount/unmount visibility อยู่แล้วโดย navigator) ตามด้วย fade-in ของแท็บใหม่ 180ms (opacity →1) — รวมความรู้สึก transition ~180-220ms ไม่ควรเกิน 250ms เพราะเป็นจุดที่ผู้ใช้กดถี่บ่อย (thumb-zone bottom tab) ความหน่วงจะรู้สึกน่ารำคาญถ้ายาวกว่านี้
- Haptic: คงพฤติกรรมเดิม (`Haptics.impactAsync(Light)` เมื่อกดแท็บที่ยังไม่ focus) ไม่เปลี่ยน — motion เพิ่มเป็นแค่ visual layer ทับของเดิม
- States: `default` (แท็บ A active) → `animating` (fade cross-over 180-220ms, กดแท็บอื่นซ้ำระหว่างนี้ต้อง interrupt ทันทีไม่ค้างคิว) → `settled` (แท็บ B active, เนื้อหาโหลด/แสดงตามปกติ)

---

## 2. List/Card Entrance Animation

รูปแบบร่วม: **fade (opacity 0→1) + translateY เล็กน้อย (12pt → 0)** ใช้ `react-native-reanimated` (`useAnimatedStyle` + `withDelay`/`withTiming`) ต่อรายการ ไม่ใช่ `LayoutAnimation` ของ RN core (เพื่อความสม่ำเสมอกับ `PressableScale` ที่ใช้ reanimated อยู่แล้ว)

ค่าพารามิเตอร์มาตรฐาน (ใช้ร่วมกันทุกจุด เว้นแต่ระบุเป็นอย่างอื่น):
- translateY เริ่มต้น: 12pt (ตาม 8pt grid: ใกล้เคียง `sm` spacing เพื่อไม่ให้ระยะเคลื่อนไหวมากเกินจนรู้สึกสั่นไหว)
- Duration ต่อ item: 260ms, easing `Easing.out(Easing.cubic)`
- Stagger delay: `index * 40ms` โดย **cap ที่ 320ms** (เทียบเท่า item ที่ 8 เป็นต้นไปทั้งหมดเริ่มพร้อมกันที่ 320ms ไม่ต้องรอ delay สะสมไปเรื่อยๆ) — ป้องกันไม่ให้รายการท้ายๆ ของ list ยาวต้องรอ animation หลายวินาทีก่อนเห็น ซึ่งขัดกับ AC ที่ห้ามบังคับผู้ใช้รอ
- Interrupt: ผู้ใช้ scroll/แตะรายการระหว่าง entrance animation กำลังเล่นได้ทันที (animation เป็นแค่ opacity/transform overlay ไม่ block touch handler ของ item เดิม, ต้องไม่ใช้ `pointerEvents="none"` ระหว่างเล่น)
- เล่นเฉพาะตอน **initial render ครั้งแรกหลังข้อมูลโหลดเสร็จ** ของแต่ละ mount (ไม่เล่นซ้ำตอน re-render จาก state อื่นที่ไม่เกี่ยวกับการโหลดข้อมูลใหม่ เช่นไม่เล่นซ้ำตอนกดเช็คอินแล้ว re-render item เดิม) — ใช้ ref แฟลก `hasAnimatedRef` per list-instance กันการเล่นซ้ำ

### 2.1 `LandmarkList.tsx` (รายการ Landmark ในหน้าจังหวัด)
- Component ที่ได้รับ spec ใหม่: `LandmarkList` (ครอบ `LandmarkCard` แต่ละใบ)
- Apply ตามค่ามาตรฐานด้านบนทั้งหมด (translateY 12→0, 260ms, stagger 40ms/cap 320ms)
- States: `loading` (shimmer skeleton ตามมาตรฐานเดิม ไม่เปลี่ยน) → `entrance-animating` (การ์ดทยอย fade+slide เข้า) → `settled` (การ์ดทั้งหมด opacity 1 / translateY 0, กดเช็คอิน/แตะดูรายละเอียดได้ปกติแม้ยังอยู่ระหว่าง entrance ของการ์ดใบอื่น)

### 2.2 List ข่าวใน `NewsScreen.tsx`
- Component: news list container ที่ครอบ `NewsCard`
- Apply ตามค่ามาตรฐาน เหมือน 2.1
- ข้อควรระวังเพิ่ม: ต้องไม่ผูก entrance animation กับ state ของการโหลดรูปภาพ (US-33/placeholder) — animation ของการ์ดต้องเล่นทันทีที่ list metadata (title/summary/date) พร้อม ไม่ต้องรอรูปโหลดเสร็จ เพื่อคง AC เดิมที่ title/summary ต้องขึ้นทันที

### 2.3 Timeline entry ในหน้าสถิติ (`Stats Timeline`, T26)
- Component: Stats Timeline entry item (ดู component เดิมชื่อ "Stats Timeline" ใน design-spec.md)
- Apply ตามค่ามาตรฐาน เหมือน 2.1 แต่ทิศทาง translateY แนะนำให้เหมือนเดิม (12pt จากด้านล่างขึ้น) เพื่อความสอดคล้องกับทิศทางการอ่าน timeline แนวตั้ง (เรียงจากบนลงล่าง เข้าใหม่จากล่างขึ้นแบบเดียวกับ list อื่น ไม่ต้องคิดทิศทางแยก)

### 2.4 Home — Province Tile 3D Map (76 tiles): **ไม่รวมใน scope entrance animation รอบนี้**
เหตุผล: เอกสาร design-spec.md เดิม (v1) เคยระบุความเสี่ยง performance ของการ animate tile จำนวนมากพร้อมกันบน 3D map component (`ProvinceTile3D.tsx` ผ่าน `Map3D.tsx`) ไว้แล้ว — การเพิ่ม fade+translateY แบบ staggered ให้ 76 tile พร้อมกันตอนเปิด HomeScreen มีความเสี่ยงจริงที่จะทำให้ frame drop/jank บนอุปกรณ์ทั่วไป ซึ่งขัดกับ AC ของ US-34 เองที่ระบุชัดว่า "ต้องไม่ทำให้แอปรู้สึกหน่วง/ค้าง" ดังนั้นเพื่อไม่ละเมิด AC ข้อนี้ ขอไม่ใส่ entrance animation ระดับ per-tile ให้ 3D map ในรอบนี้ (US-34 AC2 ระบุ list ที่ต้องมี entrance animation ไว้ชัดเจนแค่ 3 จุด คือ Landmark list/News list/Stats timeline เท่านั้น ไม่รวม Home map จึงไม่ถือว่าขาด AC) — ดูหัวข้อ "ข้อเสนอแนะที่อาจขัดกับ requirement" ท้ายไฟล์สำหรับทางเลือกเสริมถ้า PM ต้องการ motion บน Home ด้วย

---

## 3. Press Feedback ที่ชัดเจนขึ้น (Enhanced PressableScale)

Baseline ปัจจุบัน (`PressableScale.tsx`): scale 0.96 on press-in, spring กลับ (`damping: 12, stiffness: 150`) + haptic — ตาม SKILL.md §3.1/3.2 เดิม ทีมยืนยันแล้วว่าค่านี้ "เบาไป" จึงต้อง enhance ดังนี้ (คงไลบรารีเดิม `react-native-reanimated`, ไม่เพิ่ม prop ใหม่ที่กระทบ API เดิมของ component อื่นที่ import อยู่ — เพิ่มเป็น opt-in prop ใหม่)

### 3.1 ค่าพารามิเตอร์ใหม่
เพิ่ม prop ใหม่ `variant?: 'default' | 'emphasized'` ใน `PressableScaleProps` (default = `'default'` เพื่อไม่กระทบ caller เดิมที่ไม่ระบุ, ป้องกัน regression ตาม T122):

- **scale**: จาก 0.96 → **0.93** เมื่อ `variant="emphasized"` (deeper press, สังเกตเห็นชัดกว่าเดิมอย่างมีนัยสำคัญแต่ยังไม่บิดเบี้ยวจนแปลก)
- **shadow-depress effect** (ของใหม่ที่ baseline ไม่มี): ระหว่างกดค้าง ให้ animate `shadowOpacity`/`elevation` ของ container ลดลงพร้อมกับ scale เพื่อสื่อความรู้สึก "การ์ดถูกกดจมลงไปในพื้นผิว" — ใช้ค่าเงาเดิมจาก SHADOWS token (`SKILL.md` §1.2) เป็นฐาน:
  - จาก `SHADOWS.md` (shadowOpacity 0.08, shadowRadius 14, elevation 4, offset y:6) → ตอนกด (press-in) ลดเหลือ shadowOpacity **0.03**, shadowRadius **6**, elevation **1**, offset y **2** (เหมือนเงาแบนราบลงจริง)
  - Animate ด้วย `withSpring` **ชุดเดียวกับ scale** (`damping: 12, stiffness: 150`) เพื่อให้ scale กับ shadow กลับคืนพร้อมกัน sync กันสนิท ไม่ใช้ timing แยกที่จะทำให้ดู "หลุด" กัน
  - หมายเหตุ implementation: shadow property (`shadowOpacity`, `shadowRadius`, `elevation`) ไม่ animate ผ่าน native driver ได้ตรงๆ บน Android (elevation ไม่ smooth-interpolate ได้ดีเท่า iOS shadow) — ให้ programmer ประเมินว่าใช้ interpolate shadowOpacity/shadowRadius แบบ JS-driven เฉพาะ iOS และบน Android fallback เป็นแค่ scale-only effect (คง `elevation` คงที่) เพื่อไม่เกิด jank ตาม AC "ต้อง smooth ไม่ jank"
- **haptic**: คงเดิม (`Light`/`Medium` ตาม caller เดิม) ไม่เปลี่ยนความถี่/timing ของ haptic เพราะ AC ไม่ได้ขอเปลี่ยนจุดนี้ การเปลี่ยนที่ขอคือ "visual feedback"

### 3.2 จุดที่ apply `variant="emphasized"`
- ปุ่มเช็คอินใน `LandmarkCard.tsx`
- การ์ด Landmark (ทั้งใบการ์ดใน `LandmarkCard.tsx`/`LandmarkList.tsx`)
- การ์ดข่าวใน `NewsCard.tsx`
- ปุ่ม "+ เพิ่มบันทึกใหม่" (ปุ่ม CTA หลักใน ProvinceDetailScreen ที่ไปเปิด AddEntryScreen)

จุดอื่นที่ใช้ `PressableScale` อยู่แล้วแต่ไม่ได้ระบุใน AC ของ US-34 (เช่นปุ่มรองใน Settings, EmailLinkForm) ให้คง `variant="default"` (behavior เดิม 0.96 ไม่มี shadow-depress) ไม่ต้องเปลี่ยน เพื่อไม่ขยาย scope เกินที่ requirement ขอ

### 3.3 States
- `default`: scale 1, shadow ตาม SHADOWS.md ปกติ
- `pressing` (press-in จนถึงปล่อยนิ้ว): scale 0.93, shadow ลดตาม 3.1, haptic ยิงตอน `onPress` (ตำแหน่งเดิม ไม่เปลี่ยน)
- `settling` (หลังปล่อยนิ้ว, spring กำลังคืนค่า): scale/shadow กำลัง interpolate กลับ 1/ปกติ — ต้อง**กดซ้ำ/interrupt ระหว่าง settling ได้ทันที** (spring ของ reanimated รองรับการ re-trigger ระหว่าง animate อยู่แล้วโดยธรรมชาติ ไม่ต้องรอ settle ก่อน)
- `settled`: กลับสู่ default

---

## ข้อเสนอแนะที่อาจขัดกับ requirement

- **ประเด็น**: US-34 AC2 ระบุ list ที่ต้องมี entrance animation ไว้ 3 จุด (Landmark list, News list, Stats timeline) ไม่ได้รวม Home 3D map (76 tiles) แต่ผู้ใช้บ่นภาพรวมว่า "ทั้งแอปรู้สึกเหมือนเดิม" ซึ่ง Home คือหน้าแรกที่ผู้ใช้เห็นทุกครั้งที่เปิดแอป ถ้าไม่มี motion อะไรเลยบนหน้านี้ ผู้ใช้อาจยังรู้สึกว่า "หน้าแรกไม่เปลี่ยน" แม้หน้าอื่นจะมี motion ชัดเจนแล้วก็ตาม
  - **ทางเลือก A (ปลอดภัยด้าน performance, ตรงตาม AC ขั้นต่ำ)**: ไม่เพิ่ม entrance animation ให้ 76 tiles เลยตามที่ระบุในหัวข้อ 2.4 — ใช้ motion อื่นที่มีอยู่แล้วทดแทนความรู้สึก "หน้าแรกก็เปลี่ยนไปด้วย" เช่น header/legend ด้านบน Home (ไม่ใช่ tile grid) fade-in ครั้งเดียวตอนเปิดแอป (~200ms) ซึ่งมี element จำนวนน้อยจึงไม่เสี่ยง performance
  - **ทางเลือก B (motion ครอบคลุมกว่า แต่มี performance risk)**: เพิ่ม entrance animation ให้ tile เป็น "กลุ่ม" แทนที่จะเป็น per-tile stagger เต็มรูปแบบ เช่น fade ทั้ง grid เข้าพร้อมกันเป็นก้อนเดียว (opacity 0→1, 200ms, ไม่มี stagger ต่อ tile) เพื่อให้เห็น motion แต่ยังไม่ต้อง animate transform ของ tile แต่ละอันแยกกัน (ความเสี่ยง performance ต่ำกว่า staggered เพราะเป็น single opacity animation ของ container เดียว ไม่ใช่ 76 animated value พร้อมกัน) — แต่ยังต้องให้ programmer ทดสอบบนอุปกรณ์จริงก่อนว่าราบรื่นจริงเพราะ `ProvinceTile3D`/`Map3D` มี native rendering cost ของตัวเองอยู่แล้วนอกเหนือจาก animation layer
  - ให้ orchestrator ส่งประเด็นนี้ให้ PM ตัดสินใจว่าจะทำ A (ตาม literal scope ของ AC) หรือ B (ขยาย scope เล็กน้อยเพื่อแก้ปัญหาความรู้สึก "หน้าแรกเหมือนเดิม" ที่ผู้ใช้บ่นโดยตรง) ก่อนที่ programmer จะเริ่ม T120

- **ประเด็น**: การเพิ่ม `variant="emphasized"` เป็น prop ใหม่ของ `PressableScale` เป็นการตัดสินใจเชิง implementation (ไม่ใช่แค่ design spec) — ทีม UIUX เสนอแนวทางนี้เพราะรักษา backward compatibility ได้ง่ายที่สุด (caller เดิมไม่ต้องแก้ถ้าไม่ระบุ prop) แต่ถ้าโปรแกรมเมอร์เห็นวิธีอื่นที่คุ้มค่ากว่า (เช่นแยก component ใหม่ `PressableScaleEmphasized`) ให้ทีม Programmer ตัดสินใจรายละเอียด implementation เองได้ ตราบใดที่ตัวเลข scale/shadow ตามหัวข้อ 3.1 ยังคงถูกต้องตรงตาม spec

---

# ส่วนเพิ่มเติม: Color Palette & Layout Redesign (รอบ 15)

## T124: ตัวเลือกทิศทาง Color Palette ใหม่ทั้งระบบ (Decision Gate)

หมายเหตุ: ทุกตัวเลือกคง semantic เดิม (เขียว=unlocked, เทา=locked, เหลือง/ทอง=warning/Province Master, แดง=danger) ตามสมมติฐานใน requirements.md — ต่างกันแค่ว่า "เขียว" ยังเป็น brand accent หลักด้วยหรือถูกแยกบทบาทออกจากกัน คู่สีข้อความ/ปุ่มสำคัญผ่านเกณฑ์ WCAG AA (≥4.5:1) โดยประมาณจากคู่สีเข้ม/อ่อนตัดกันชัดเจนที่เลือกไว้ — **ต้องยืนยันตัวเลขจริงด้วยเครื่องมือคำนวณ contrast อีกครั้งระหว่าง T126** ตาม AC ของ US-35

### ตัวเลือก A: "Deep Jade" — evolve จากเขียวเดิม (#1D9E75/#0F6E56)
**Mood**: เขียวมรกตแบบอัญมณี (jewel-tone) เข้มและอิ่มตัวขึ้นกว่าเขียวมิ้นต์แบนเดิม พื้นหลังเปลี่ยนจากขาวล้วนเป็นขาวอมมินท์อ่อนๆ ให้การ์ด/เงาดูมีมิติขึ้นโดยไม่ทิ้งอัตลักษณ์เขียวที่ผู้ใช้คุ้นเคย — ความเสี่ยงต่ำที่สุด เพราะยังอยู่ตระกูลสีเดิม

| token | เดิม | ใหม่ |
|---|---|---|
| unlockedTop / accent | #1D9E75 | #15A87A |
| unlockedSide / accentDark | #0F6E56 | #0B5C46 |
| lockedTop | #D9D9D9 | #CBD3CF (เทาอมเขียวอุ่นขึ้น) |
| lockedTopLoading | #E8E8E8 | #E3E8E5 |
| background | #FFFFFF | #F6F9F7 |
| textPrimary | #1A1A1A | #122019 |
| textSecondary | #6B6B6B | #5B6B63 |
| trackBg | #E5E5E5 | #DCE4E0 |
| gold | #E5B93C | #D8A93B (โทน old-gold หรูขึ้น) |
| danger/amber/amberBg | เดิม | คงเดิม (ผ่าน AA อยู่แล้ว) |

**ภาพหน้า Home ที่เปลี่ยนไป**: แผนที่ 3 มิติดูเหมือนเกาะลอยบนพื้นขาวอมมินท์นุ่มตากว่าขาวจ้าเดิม บล็อกจังหวัดที่ปลดล็อกเป็นเขียวมรกตสดเข้มแบบอัญมณีแทนเขียวมิ้นต์แบน แถบ progress/legend ดูกลมกลืนเป็นตระกูลเดียวกันทั้งหน้าแต่ "เข้มขึ้น หรูขึ้น" ชัดเจนเมื่อเทียบข้าง

### ตัวเลือก B: "Twilight Lagoon" — เปลี่ยนทิศทางใหม่ (โทนเย็นทีล/คราม)
**Mood**: แยกบทบาท "สี unlocked" ออกจาก "สี brand accent" เป็นครั้งแรก — ปัจจุบัน `accent` กับ `unlockedTop` เป็น hex เดียวกันเป๊ะ (#1D9E75) ทำให้เขียวต้องแบกทั้งความหมาย "ปุ่ม/ลิงก์ทั่วไป" และ "ปลดล็อกแล้ว" พร้อมกัน ตัวเลือกนี้ให้เขียวทำหน้าที่ unlocked อย่างเดียว (ชัดเจนขึ้น ไม่ปนกับปุ่มทั่วไป) ส่วน brand accent/ปุ่ม CTA/แถบค้นหา focus เปลี่ยนเป็นทีล-คราม ให้ความรู้สึกทันสมัย/travel-app ระดับพรีเมียมแบบใหม่

| token | ใหม่ |
|---|---|
| accent (CTA/ลิงก์/focus) | #0E7C86 |
| accentDark | #0A5860 |
| unlockedTop (คงเป็นเขียว ทำหน้าที่ unlocked อย่างเดียว) | #1FAE72 |
| unlockedSide | #0E7A52 |
| lockedTop | #D7DEE4 |
| lockedTopLoading | #E9EDF1 |
| background | #F5F8FA |
| textPrimary | #101826 |
| textSecondary | #5B6B7A |
| trackBg | #DEE6EA |
| gold | #D6A94A |
| (เสนอ token ใหม่) heroCanvasBg | #0F2233 (พื้นหลังเข้มเฉพาะการ์ด Map3D เท่านั้น ดูหัวข้อ Layout ด้านล่าง) |

**การคงความหมาย unlocked**: เขียว (#1FAE72) ยังใช้เฉพาะกับ unlockedTop/side/legend swatch/checkmark เท่านั้น ไม่ปนกับปุ่มทั่วไปอีกต่อไป — ทำให้ "เห็นเขียว = ปลดล็อกแล้ว" ชัดกว่าปัจจุบันด้วยซ้ำ เพราะตอนนี้เขียวไปโผล่ที่ปุ่ม "สถิติ" ทั่วไปด้วย ทำให้ความหมายเจือจาง

**ภาพหน้า Home ที่เปลี่ยนไป**: แถบค้นหา/ลิงก์สถิติ/focus state เปลี่ยนเป็นทีลเข้ม ให้โทนเย็น-หรูแบบรีสอร์ท ส่วนบล็อกจังหวัดปลดล็อกยังเขียวชัดเจนแยกจากกัน ถ้ารวมกับการ์ด `heroCanvasBg` เข้มด้านหลังแผนที่ (ตัวเลือก layout ด้านล่าง) บล็อกเขียวจะเรืองเด่นตัดกับพื้นเข้มแบบจอ dashboard พรีเมียม

### ตัวเลือก C: "Sunset Ember" — โทนใหม่ต่างชัดเจนที่สุด (อุ่น/dark-leaning)
**Mood**: พื้นหลังโทนถ่านอุ่น (espresso charcoal) + accent ส้มอิฐ (terracotta) ให้ความรู้สึก "premium travel diary ยามเย็น" ต่างจากเดิมชัดเจนที่สุดใน 3 ตัวเลือก แต่มี **ความเสี่ยงสูงสุด**: เป็นทิศทางกึ่ง dark-theme ที่ต้องดูแล contrast ทุกจุดอย่างระมัดระวัง และถ้าทำแค่ Home ก่อน (ตามลำดับเฟสที่วางไว้) หน้าอื่นที่ยังไม่ redesign ใน US-37 จะดู "สว่าง-มืดปนกัน" ชัดกว่าตัวเลือก A/B ระหว่างรอเฟส 2

| token | ใหม่ |
|---|---|
| accent | #E8722E |
| accentDark | #B84F1B |
| unlockedTop (คงเขียวไว้เพื่อ semantic) | #2FAE7A |
| unlockedSide | #177A54 |
| lockedTop | #4A453E |
| lockedTopLoading | #5C574F |
| background | #1C1917 |
| textPrimary | #F5F1EA |
| textSecondary | #B8AFA3 |
| trackBg | #332E29 |
| danger | #E5645F (ปรับให้สว่างขึ้นจากเดิม เพื่อให้อ่านออกบนพื้นเข้ม) |
| amber / amberBg | #F0A63A / #3A2E1B |
| gold | #E8C468 |

**ข้อควรระวังเฉพาะตัวเลือกนี้**: (1) ปุ่ม CTA บนพื้น accent (#E8722E) ควรใช้ตัวอักษรสีเข้ม (เช่น textPrimary ของตัวเลือกนี้) แทนสีขาว เพราะส้มเป็นโทนกลาง สีขาวบนพื้นนี้จะไม่ผ่าน 4.5:1 (2) ระบบเงา (`SHADOWS`) ปัจจุบันอิงเงาสีเข้มบนพื้นสว่าง — บนพื้นถ่านเข้มเงาแทบไม่เห็นผล ต้องพิจารณาใช้ขอบเรืองแสง (subtle border/glow) แทนเงาแบบเดิมสำหรับสร้างมิติ

**ภาพหน้า Home ที่เปลี่ยนไป**: ทั้งหน้าเข้มแบบธีมมืด บล็อกจังหวัดปลดล็อกสีเขียวสดตัดกับพื้นถ่านชัดมาก ดาว Province Master สีทองอุ่นเรืองเด่นเป็นพิเศษบนพื้นเข้ม ให้ความรู้สึก "ยกระดับ" แรงที่สุดในสามตัวเลือก แต่ effort/ความเสี่ยงด้าน contrast และความสอดคล้องกับหน้าที่ยังไม่ redesign สูงสุดด้วย

---

## Layout Redesign Spec: HomeScreen (T127–T129)

ใช้ชื่อ token เท่านั้น (`COLORS.xxx`/`SPACING.xxx`/`RADIUS.xxx`/`SHADOWS.xxx`) ใช้ได้กับทุกตัวเลือกสีด้านบนโดยไม่ต้องแก้ spec — **ไม่เปลี่ยน information architecture**: ตำแหน่งปุ่มสถิติ/ตั้งค่า, แถบค้นหา, header progress, แผนที่, legend เรียงลำดับเดิมทุกประการ เปลี่ยนเฉพาะ spacing/elevation/พื้นผิว/สี

### User Flow: US-36 (ไม่เปลี่ยนจากเดิม)
1. ผู้ใช้เปิดแอป เห็น top bar (ชื่อแอป + ปุ่มสถิติ/ตั้งค่า) → แถบค้นหา → การ์ดความคืบหน้า → (ถ้ายังไม่ปลดล็อกจังหวัดใดเลย) hint banner → การ์ดแผนที่ 3 มิติ 76 จังหวัด → legend
2. ผู้ใช้แตะจังหวัดบนแผนที่ → ระบบนำทางไป ProvinceDetailScreen (เหมือนเดิมทุกประการ)
3. ผู้ใช้พิมพ์ค้นหาในแถบค้นหา → เห็น dropdown ผลลัพธ์ (สไตล์เปลี่ยน ฟังก์ชันเดิม) → เลือกแล้วนำทางเหมือนเดิม
4. ผู้ใช้เห็นความแตกต่างภาพรวมทันทีจาก: จังหวะ spacing ระหว่าง section ที่โปร่งขึ้น, การ์ดแผนที่ที่ดูมีความลึก/ยกตัวขึ้นจากพื้นหลังชัดเจนกว่าเดิม (จุดที่ผู้ใช้บ่นตรงที่สุด)

### Components

#### TopBar (ส่วนหนึ่งของ HomeScreen.tsx)
- **Purpose**: แสดงชื่อแอป + ทางเข้าสถิติ/ตั้งค่า
- **การเปลี่ยนแปลง layout**: เพิ่ม padding บนจาก `SPACING.xs` เป็น `SPACING.sm`/`SPACING.md` ให้หายใจมากขึ้นตาม 8pt grid; ปุ่มตั้งค่า (⚙️) ห่อด้วยพื้นผิวกลม (`RADIUS.full`, พื้นหลัง `COLORS.trackBg` หรือ surface tint ของแต่ละตัวเลือก) แทนไอคอนลอยเปล่าๆ ให้อ่านเป็น tap target ชัดเจนขึ้น (แตะยังคง 44×44pt เดิม)
- **States**: default / pressed (PressableScale scale 0.96 เดิมจาก US-34 — ไม่แตะ) ไม่มี loading/empty/error (เป็น static header)
- **Content**: ชื่อแอป, ลิงก์ "สถิติ", ปุ่มตั้งค่า — เหมือนเดิมทุกประการ

#### GlobalSearchBar (เฉพาะจุดแสดงผลในหน้า Home)
- **Purpose**: ค้นหาจังหวัด/แลนด์มาร์กแล้วนำทาง
- **การเปลี่ยนแปลง layout**: ห่อด้วยการ์ดลอย (`RADIUS.xl`, `SHADOWS.md`) แทนแถบแบนชิดหน้าจอเดิม ให้เป็น bento block ของตัวเอง ระยะขอบ `SPACING.md`
- **States**: default / focused (border/shadow เข้มขึ้นเล็กน้อยด้วย `SHADOWS.lg`) / loading ผลค้นหา (ใช้ ShimmerBlock เดิม แต่สี shimmer อ้างอิง `COLORS.trackBg`/`lockedTopLoading` ของธีมใหม่ ไม่ใช่เทาลอยตัวเก่า) / empty (ไม่พบผลลัพธ์ — ข้อความ `textSecondary`) / error (เครือข่ายล้มเหลวตอนค้นหา Wikipedia live — ข้อความ `danger`) / success (dropdown ผลลัพธ์)
- **Micro-interaction**: ไม่เปลี่ยนจาก US-34 (แตะผลลัพธ์ = light haptic เดิม)
- **หมายเหตุ**: ถ้าเลือกตัวเลือก B/C ที่มี `heroCanvasBg` เข้มด้านหลังแผนที่ ต้อง verify ว่าสี dropdown ยัง contrast พอ เพราะ dropdown แสดงทับ scroll content ซึ่งพื้นหลังหน้าโดยรวมยังสว่างอยู่ (ไม่ใช่พื้นเข้ม) — ไม่กระทบถ้า background หลักยังคงสว่างตามที่ออกแบบ

#### HeaderProgress
- **Purpose**: แสดง "ปลดล็อกแล้ว X/76 จังหวัด" + progress bar
- **การเปลี่ยนแปลง layout**: ยกระดับจากการ์ดขาวเรียบเป็น "hero stat bento" — ตัวเลข X/76 ใช้ font ใหญ่ขึ้นเป็นจุดเด่น ส่วนคำอธิบาย "จังหวัด" เป็นบรรทัดรองเล็กกว่า (สร้าง hierarchy ใหม่แทนประโยคบรรทัดเดียวเท่ากันหมด); พื้นหลังการ์ดใช้ surface tint อ่อนๆ ของ accent แทนขาวล้วน; แถบ progress fill ใช้ gradient สองโทน (`accent` → `accentDark`) แทนสีเดียวแบน เพิ่มความสูง track เล็กน้อยให้เข้ากับสัดส่วนใหม่
- **States**: default / **loading** (คงกลไก ShimmerBlock เดิมทั้งหมดจาก US-34 ไม่แตะ logic แค่ปรับสี skeleton ให้ตรงธีมใหม่) / success (แสดงตัวเลขจริง)
- **Micro-interaction**: animation fill bar (`withTiming` 300ms) และ fade-in mount 220ms จาก US-34 คงเดิมทุกประการ — ไม่แตะ

#### Map3D + ProvinceTile3D (หัวใจของรอบนี้)
- **Purpose**: แผนที่ 3 มิติ 76 จังหวัด แสดงสถานะ unlocked/locked/Province Master
- **การเปลี่ยนแปลง layout (จุดที่ต้อง "รู้สึกว่าเปลี่ยนจริง" ที่สุด)**:
  - ห่อ `Svg`/`tiltContainer` เดิมด้วยการ์ด "hero canvas" ใหม่: มุมโค้ง `RADIUS.xl`, เงา `SHADOWS.lg`, พื้นหลังเป็น surface โทนต่างจากพื้นหลังหน้า (เสนอ token ใหม่ เช่น `mapCanvasBg`) — ให้ความรู้สึกว่าแผนที่ "ลอยอยู่ในกล่องกระจก/จอแสดงผล" แทนที่จะวางแบนอยู่บนพื้นหลังหน้าตรงๆ เหมือนปัจจุบัน padding รอบ SVG เพิ่มเป็น `SPACING.lg`
  - เพิ่มเงาวงรีจางๆ ใต้กลุ่ม tile ที่เอียงอยู่ (ambient shadow) เพื่อ "ขาย" ความลึก 3 มิติที่ปัจจุบันดูแบน — เป็นแค่ shape/opacity เพิ่มเติมใน SVG ไม่แตะ geometry ของ tile ใดๆ (สอดคล้องคำตัดสิน PM ข้อ 26)
  - `topPathProps`/`sidePathProps` ใน ProvinceTile3D: อัปเดตแค่ค่าสี fill จาก `COLORS.unlockedTop`/`unlockedSide`/`lockedTop`/`gold` เป็นชุดใหม่จาก T126 — ไม่แตะ logic การ interpolate/spring ใดๆ; เสนอเพิ่มขอบบนบางๆ โทนอ่อนกว่า unlockedTop (glossy top-edge highlight) เพื่อเสริมความรู้สึก "วัสดุ" ให้บล็อกดูมีมิติ (optional, ไม่บังคับ)
  - Tooltip (long-press แสดงชื่อจังหวัด) ปัจจุบัน hardcode `rgba(26,26,26,0.88)` — **ต้องย้ายมาอ้างอิง token ใหม่ด้วยใน T128/T131** (ไม่ใช่แค่ tile) มิฉะนั้นจะเป็น hex เดิมหลงเหลือที่ผิด AC ของ US-36 และถ้าเลือกตัวเลือก B/C ที่มี `mapCanvasBg` เข้ม อาจกลืนกับพื้นหลังจนอ่านไม่ออก
- **States**: default (locked/unlocked/master ตามเดิมทั้งหมด) / loading (shimmer เดิมจาก US-34 คงกลไก) / success (unlock spring), isJustMastered (sparkle sequence) — **ทุก animation/haptic ของ US-34 คงเดิม 100%** เปลี่ยนเฉพาะค่าสีที่ animate ระหว่างไป (`interpolateColor` ยังทำงานเหมือนเดิม แค่ปลายทางสีเปลี่ยน)

#### Legend
- **Purpose**: อธิบายความหมายสี locked/unlocked/master
- **การเปลี่ยนแปลง layout**: เปลี่ยนจาก pill ขอบบาง 1px เป็น chip พื้นผิวทึบ + `SHADOWS.sm` บางๆ ให้เข้าชุดกับการ์ด HeaderProgress/Map hero ที่ยกระดับแล้ว แทนที่จะดู "ตกยุค" เมื่อเทียบกับส่วนอื่นที่ปรับแล้ว
- **States**: static เท่านั้น ไม่มี loading/error (ข้อมูล fix)

#### จังหวะ spacing ระหว่าง section (ภาพรวม HomeScreen.tsx)
- เปลี่ยนจาก gap แบบผสม (`xs`/`sm` ปนกัน) เป็น `SPACING.lg` สม่ำเสมอระหว่างบล็อกหลักทุกตัว (topBar → search card → header progress card → map hero card → legend) เพื่อให้ scroll แล้วเห็นเป็น section ที่แยกจากกันชัดเจนแบบ bento แทนการเรียงชิดกันเหมือนก่อน — เป็นการเปลี่ยนที่ "เห็นผลทันที" โดยไม่กระทบ IA ใดๆ เลย

### Regression checklist สำหรับ T130 (อ้างอิงจาก spec นี้)
- จำนวนจังหวัดปลดล็อก/แตะจังหวัด/ผลค้นหา/Province Master ต้องทำงานเหมือนเดิมทุกประการ (ตรวจ prop contract เดิมของ Map3D/ProvinceTile3D ไม่เปลี่ยน)
- Animation ทุกตัวจาก US-34 (fade-in 220-280ms, spring unlock, sparkle master, shimmer loading) ต้องยัง trigger ด้วย props/logic เดิมทุกประการ — spec นี้แตะเฉพาะ StyleSheet/สี ไม่แตะ `useEffect`/`useSharedValue`/`withSpring` ใดๆ

## Layout Redesign Spec: ProvinceDetailScreen + AddEntryScreen (T132, เฟส 2 US-37)

ทั้งสองหน้ายังไม่เคย redesign อย่างเป็นทางการมาก่อน (ใช้ header/card pattern เดิมตั้งแต่รอบแรกของโปรเจกต์) งานนี้คือ**ยกระดับ spacing/hierarchy + สลับ hex เดิมเป็น token** ไม่ใช่ออกแบบ IA ใหม่ — ไม่เพิ่ม/ลด field, ปุ่ม, หรือ section ใดๆ ที่ไม่เคยมี

### สิ่งที่ต้องแก้ (ใช้ token แทน hex เดิมทั้งหมด — เดิม `'#F0F0F0'`/`'#F2F2F2'`/`'#D9D9D9'`/`'#FFFFFF'` เป็น literal string กระจายอยู่ในทั้งสองไฟล์)
| จุดเดิม (hardcode) | Token ใหม่ที่ต้องใช้แทน |
|---|---|
| `header.borderBottomColor: '#F0F0F0'` | `COLORS.border` |
| `backButton.backgroundColor: '#F2F2F2'` | `COLORS.trackBg` |
| `card.backgroundColor` / `textInput` bg ที่เป็น `'#FFFFFF'` | `COLORS.surface` |
| `textInput`/`dateInput`/`landmarkChip.borderColor: '#D9D9D9'` | `COLORS.border` |
| `saveButtonText.color` / `addButtonText.color: '#FFFFFF'` | `COLORS.textOnDark` (ความหมายเดิม สีขาวบนพื้นเข้ม/accent เหมือนเดิม แค่ไม่ hardcode) |

### ProvinceDetailScreen — การเปลี่ยนแปลง layout
- **Header**: คงโครงเดิม (ปุ่มกลับซ้าย/ชื่อจังหวัดกลาง/spacer ขวา) ตามที่ US-37 AC4 ห้ามแตะ IA — เปลี่ยนแค่สี border/พื้นปุ่มตามตารางบน
- **ระยะห่างระหว่าง section ในสาย scroll** (ProvinceMasterBadge → LandmarkList → ปุ่ม "+เพิ่มบันทึกใหม่" → รายการบันทึก): ปัจจุบันชิดกันมาก (`marginBottom: SPACING.xs` เท่านั้นระหว่างปุ่มกับ list) — เพิ่มเป็น `SPACING.lg` สม่ำเสมอทุกจุดต่อ section ตาม pattern เดียวกับ HomeScreen (T127) ให้ scroll แล้วรู้สึกเป็น block ที่แยกกันชัดเจนแทนการเรียงชิดแบบ list แบนเดิม
- **`ProvinceMasterBadge`**: ไม่แตะ component ภายใน (ผ่าน redesign มาแล้วรอบก่อน) มีแค่ระยะห่างรอบนอกที่เปลี่ยนตามข้อบน
- **State อื่น** (loading skeleton, empty state): ใช้ component เดิม (`ShimmerBlock`/`EmptyState`) ไม่เปลี่ยน ไม่มี state ใหม่

### AddEntryScreen — การเปลี่ยนแปลง layout
- **Header**: เหมือน ProvinceDetailScreen ด้านบน (สี border/ปุ่มเท่านั้น)
- **การ์ด "ข้อมูลหลัก"/"รายละเอียดเพิ่มเติม"**: นอกจากสลับ `backgroundColor` เป็น `COLORS.surface` แล้ว เพิ่มเส้นขอบบาง `1px COLORS.borderLight` รอบการ์ด (การ์ดเดิมพึ่งเงา `SHADOWS.sm` อย่างเดียวซึ่งบนพื้นหลัง mint อ่อนใหม่ (`COLORS.background` #F6F9F7) ที่ใกล้เคียงสีขาวของการ์ดมาก เงาบางๆ อาจไม่พอให้ขอบเขตการ์ดชัดเจน — ขอบบางช่วยแยกภาพได้แน่นอนกว่าโดยไม่ต้องเพิ่มเงาหนักขึ้น)
- **Input fields** (`textInput`/`dateInput`): border → `COLORS.border` ตามตาราง, focus state (`textInputFocused`, border `COLORS.accent` + `SHADOWS.sm`) ไม่ต้องแก้ (ใช้ token เดิมอยู่แล้ว ทำงานถูกต้องกับสีใหม่โดยอัตโนมัติ)
- **`landmarkChip`**: border → `COLORS.border`, selected state (`COLORS.accent` bg) ไม่ต้องแก้เช่นกัน
- **ปุ่ม CTA "บันทึก"/deleteButton**: คงพฤติกรรม/สีพื้น (`COLORS.accent`/`COLORS.danger`) เดิมทุกประการ ตัวอักษรขาวบนปุ่ม accent เป็น pattern เดียวกับปุ่ม "+เพิ่มบันทึกใหม่" ที่มีอยู่แล้วทั้งแอป (ผ่านการใช้งานจริงมาตั้งแต่รอบแรกโดยไม่เคยถูก QA ตีกลับเรื่อง contrast) — **ไม่ต้อง audit ซ้ำ** เป็นการสลับจาก hardcode `'#FFFFFF'` เป็น `COLORS.textOnDark` (ค่าเท่ากัน) เท่านั้น ไม่ใช่คู่สีใหม่ที่ไม่เคยตรวจ

### Regression checklist สำหรับ T139 (ส่วนของสองหน้านี้)
- Validation ของฟอร์ม (title/date required, error text แสดง/หายถูกจุด) ต้องทำงานเหมือนเดิม — สเปกนี้ไม่แตะ logic `validate()`/state ใดๆ
- Nominatim search chip, PhotoPicker, TagSelector, landmark auto-checkin chip ต้องทำงานเหมือนเดิมทุกประการ (ไม่แตะ handler ใดๆ)
- ปุ่ม "+ เพิ่มบันทึกใหม่" ใน `ProvinceDetailScreen.tsx:89` ต้องยังมี `variant="emphasized"` เดิมจาก US-34 (ไม่ใช่ scope ของ task นี้แต่ต้องไม่ถูกลบโดยไม่ตั้งใจตอนแก้ style)

## ข้อเสนอแนะที่อาจขัดกับ requirement (ให้ PM ตัดสินใจ)

**ประเด็น**: `mapCanvasBg` เข้ม (dark hero canvas) หลังแผนที่ 3 มิติ — ควรใช้พื้นเข้มตัดกันแรงเพื่อ "ขาย" ความรู้สึกเปลี่ยนแปลงชัดที่สุด (ตรงกับที่ผู้ใช้บ่น) หรือใช้พื้น tint อ่อนที่กลืนกับพื้นหลังหน้ามากกว่าเพื่อความสม่ำเสมอกับหน้าที่ยังไม่ redesign ในเฟส 2

- **ทางเลือกA**: `mapCanvasBg` เข้ม (โดดเด่นเฉพาะจุด, effort เพิ่มเรื่อง contrast ของ tooltip/ข้อความ, อาจดูเป็น "เกาะแยก" จากหน้าอื่นที่ยังสว่างในช่วงเฟส 1→2)
- **ทางเลือก B**: `mapCanvasBg` เป็น tint อ่อนของพื้นหลังหลัก (ปลอดภัยกว่า, สม่ำเสมอกับทั้งแอประหว่างรอเฟส 2, แต่ผลกระทบด้าน "รู้สึกเปลี่ยนจริง" อาจน้อยกว่าทางเลือก A)
- ข้อเสนอ: ทางเลือกนี้ผูกกับตัวเลือกสี — ถ้าเลือกโทน A ("Deep Jade") แนะนำทางเลือก B (tint อ่อน) เพราะพื้นเข้มจะขัดกับโทนอ่อนทั้งระบบ; ถ้าเลือกโทน B/C แนะนำทางเลือก A (เข้ม) เพราะเข้ากับทิศทางที่ตั้งใจต่างจากเดิมชัดเจนอยู่แล้ว — แต่สุดท้ายให้ PM/ผู้ใช้ยืนยันพร้อมกับ T125
