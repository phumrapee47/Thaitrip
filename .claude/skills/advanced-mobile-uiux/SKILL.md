---
name: advanced-mobile-uiux
description: มาตรฐานและแนวทางการออกแบบ UI/UX ระดับ Advance สำหรับ Mobile Application (React Native / Expo) ครอบคลุม Modern Bento Grid, Design Tokens (8pt Grid, Typography, Semantic Colors), Micro-interactions, Shimmer Skeleton Loading, Haptic Feedback, Thumb-zone Ergonomics, และ Accessibility (WCAG). ใช้เมื่อต้องการยกระดับหน้าตาและประสบการณ์การใช้งานจากระดับ Prototype สู่ระดับ Production-Ready คุณภาพสูง
---

# Advanced Mobile UI/UX Design System & Implementation Guide

คู่มือมาตรฐานและแนวทางปฏิบัติสำหรับการออกแบบและพัฒนาหน้าตาแอปพลิเคชันมือถือ (React Native / Expo) ในระดับ Advance

---

## 1. Design Tokens & Visual Fundamentals

### 1.1 8pt Spatial Grid System
ห้ามใช้ตัวเลข Spacing แบบสุ่ม ให้ใช้ทวีคูณของ 4pt / 8pt เสมอ:
- `xxs`: 4pt (ระยะห่างไอคอนกับข้อความเล็ก)
- `xs`: 8pt (ช่องว่างภายในปุ่ม/ชิป)
- `sm`: 12pt (Padding ภายในการ์ดขนาดเล็ก)
- `md`: 16pt (ระยะขอบหน้าจอมาตรฐาน Standard Screen Margin)
- `lg`: 20pt (ช่องว่างระหว่าง Section)
- `xl`: 24pt (ระยะห่างระหว่างกลุ่ม Content หลัก)
- `xxl`: 32pt (ระยะห่างส่วนหัว Header / Hero)

### 1.2 Elevation & Shadow Layers
หลีกเลี่ยงเงาสีดำทึบกระด้าง (`rgba(0,0,0,0.5)`) ให้ใช้เงาสีโปร่งแสงหลายชั้นที่มีมิติ:
```ts
export const SHADOWS = {
  sm: {
    shadowColor: '#0F2A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F2A1D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F2A1D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
```

### 1.3 Border Radii (ความโค้งมนที่เป็นเอกภาพ)
- `sm`: 8pt (ปุ่มขนาดเล็ก, Text input ขนาดกะทัดรัด)
- `md`: 12pt (ปุ่มหลัก Action Button, ชิปตัวกรอง)
- `lg`: 16pt–20pt (การ์ดเนื้อหา Card Containers)
- `xl`: 24pt–28pt (Modal Dialog, Floating Search Bar)
- `full`: 9999pt (Pill badges, Avatar วงกลม)

---

## 2. Layout Patterns: Modern Bento Grid & Travel Magazine Style

### 2.1 Magazine Hero Card (จุดเด่นประจำจังหวัด)
- นำเสนอ Landmark อันดับ 1 ประจำจังหวัดด้วยการ์ดขนาดใหญ่ (Hero Bento) ความสูง 200–240pt
- วางรูปภาพเต็มพื้นที่ พร้อม Linear Gradient สีดำโปร่งแสง (`rgba(0,0,0,0.7)`) ซ้อนทับบริเวณด้านล่าง 40% เพื่อให้อ่านตัวหนังสือสีขาวได้ชัดเจนบนทุกรูป
- สถานที่ลำดับถัดไปแสดงเป็น Compact Grid 2 คอลัมน์ หรือแนวสลับ (Asymmetric)

### 2.2 Category Color Semantic
ใช้สีระบุหมวดหมู่ที่จำง่ายและสร้างความรู้สึกทางอารมณ์:
- 🌲 **ธรรมชาติและภูเขา**: Emerald Green (`#10B981`, พื้นหลัง `#ECFDF5`)
- ⛩️ **วัดและศาสนสถาน**: Amber / Gold (`#F59E0B`, พื้นหลัง `#FFFBEB`)
- 🏖️ **ทะเลและชายหาด**: Ocean Azure (`#0284C7`, พื้นหลัง `#F0F9FF`)
- 🏛️ **ประวัติศาสตร์และวัฒนธรรม**: Violet Purple (`#7C3AED`, พื้นหลัง `#F5F3FF`)
- 🛍️ **ช้อปปิ้งและสันทนาการ**: Rose Pink (`#E11D48`, พื้นหลัง `#FFF1F2`)

---

## 3. Micro-Interactions & Tactile Feedback

### 3.1 Physics-based Button Press (Bounce Feel)
ใช้ `react-native-reanimated` หรือ `Pressable` ร่วมกับ Animated Scale เพื่อให้ปุ่มตอบสนองต่อนิ้ว:
- เมื่อกดค้าง: ย่อขนาดลง `scale: 0.96`
- เมื่อปล่อย: เด้งกลับด้วย Spring Physics (`damping: 12`, `stiffness: 150`)

### 3.2 Haptic Feedback (การสั่นตอบสนอง)
เชื่อมต่อ `expo-haptics` เพื่อให้แอปมีความรู้สึกของการสัมผัสจริง:
```ts
import * as Haptics from 'expo-haptics';

// เมื่อกดสลับตัวกรอง / แตะปุ่มทั่วไป
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// เมื่อกดเช็คอินสถานที่สำเร็จ
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// เมื่อปลดล็อกครบจังหวัด (Province Master ⭐)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

## 4. Perceived Performance: Shimmer Skeleton vs Raw Spinners

### 4.1 Skeleton Rule
**ห้ามใช้ ActivityIndicator (วงกลมหมุน) ตรงกลางหน้าจอเดี่ยวๆ สำหรับส่วนเนื้อหาที่มี Layout ชัดเจน**
ให้ใช้ Skeleton Placeholder ที่จำลองรูปทรงของการ์ดและข้อความ เพื่อลดการรับรู้ระยะเวลาในการโหลด (Perceived Latency):
- แสดงบล็อกสีเทาอ่อน (`#EAEAEA`) วิ่งผ่านด้วย Pulse Effect (Fade In/Out 0.4 ↔ 0.9)
- ขนาดของ Skeleton ต้องตรงกับขนาดการ์ดจริง 100% เพื่อไม่ให้เกิด Layout Shift (CLS) เมื่อรูปภาพและข้อความโหลดเสร็จ

---

## 5. Thumb-Zone Ergonomics & Navigation

### 5.1 One-Handed Reachability
- จัดวางปุ่มสำคัญ (Primary Action CTA เช่น "+ เพิ่มบันทึก", "เช็คอิน") ไว้ในโซนล่างของหน้าจอที่นิ้วโป้งเอื้อมถึงง่าย (Natural Thumb Zone)
- สำหรับหน้าที่มีรายการยาว (เช่น สถานที่ท่องเที่ยว) ใช้ Bottom Sheet Drawer ที่ปัดขึ้น-ลงได้แทนการกดเปลี่ยนหน้าจอไปมา
- ปรับขนาด Tap Target ขั้นต่ำไม่น้อยกว่า 44×44pt พร้อมตั้งค่า `hitSlop: 8-12` เสมอ

---

## 6. Accessibility & Contrast (WCAG 2.1 AA)

1. **Color Contrast**: อัตราส่วนความต่างสีของข้อความทั่วไปเทียบกับพื้นหลังต้องไม่ต่ำกว่า **4.5:1**
2. **Accessible Labels**: ทุกปุ่มที่เป็นไอคอนหรือการ์ดแบบสลับสถานะ ต้องระบุ:
   - `accessibilityRole="button"` หรือ `"switch"`
   - `accessibilityLabel="คำอธิบายที่อ่านออกเสียงได้"`
   - `accessibilityState={{ checked: isVisited, disabled: false }}`
