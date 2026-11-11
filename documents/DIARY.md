# 📓 RideTrace Developer & Architecture Diary

> **Project:** RideTrace - Smart Motorcycle Telemetry & Safety System  
> **Repository:** `d:\Academic\Short Sem 02\3yp\firebase\`  
> **Maintainer / Lead:** Danuja Chandrasena (Team 14)  
> **Course:** CO3060 Computer Systems Design Project  

---

## 🗓️ 2026-10-13 — Day 01: Project Kickoff & Proposal Formulation
- **කළ දේ:**
  - CO3060 3rd Year Project එක ලෙස යතුරුපැදි ආරක්ෂාව හා Telemetry පද්ධතියක් සැලසුම් කිරීම ඇරඹුවා.
  - ආරම්භක LaTeX Proposal එක `proposal/proposal_v1.tex` නමින් සකසා compile කර බැලුවා.
  - පද්ධතියට **Plug-and-Play Add-on Concept** එක (Handlebar Monitor & Emission Pre-Check) හඳුන්වා දුන්නා.
  - නම **RideTrace** ලෙස නම් කර, 2-page Proposal එකක් ලෙස `proposal/proposal_v2.tex` සාදා සාර්ථකව compile කළා (`proposal_v2.pdf`).
  - Rider සහ Guardian දෙදෙනාට වෙන වෙනම apps නොහදා **Single Role-Based App** එකක් සෑදීමට තීරණය කළා.

---

## 🗓️ 2026-10-14 — Day 02: Proposal Presentation Preparation
- **කළ දේ:**
  - Proposal Presentation එක සඳහා විනාඩි 15 ක කණ්ඩායමේ 4 දෙනාට (Danuja, Ashen, Kavindu, Janith) Slides 12 ක Flow එකක් සැලසුම් කළා.
  - Canva එකෙන් modern tech pitch deck එකක් generate කරගැනීමට අවශ්‍ය සම්පූර්ණ Slide Copy-Paste Prompt එක සකස් කළා.
  - සෑම සාමාජිකයෙකුටම විනාඩි 3.5 බැගින් කතා කිරීමට අවශ්‍ය සම්පූර්ණ Formal English Speech Script එක ලියා අවසන් කළා.

---

## 🗓️ 2026-10-16 — Day 03: ESCAL Lab Inventory Analysis & Costing
- **කළ දේ:**
  - ESCAL Lab Inventory Excel Sheet එක පරීක්ෂා කර, අපේ Project එකට අවශ්‍ය sensors වලින් **80% ක්ම Lab එකෙන් නොමිලේ ලබාගත හැකි බව** තහවුරු කරගත්තා (MPU6050, GPS NEO-6M, SIM808A, DS18B20, 0.96" OLED, MQ Sensors, BME280, Buck Converters).
  - Lab එකට බාරදිය යුතු `Item | Item No` ලැයිස්තුව [escal_lab_components_request.csv](file:///d:/Academic/Short%20Sem%2002/3yp/escal_lab_components_request.csv) නමින් හැදුවා.
  - [duino.lk](https://www.duino.lk) එකෙන් live search කර, Lab එකේ නැති අමතර කොටස් වල (ESP32, Hall Sensor, Mini Vacuum Pump, MicroSD Card) සැබෑ මිල ගණන් තහවුරු කර CSV ගොනුවට ඇතුළත් කළා.

---

## 🗓️ 2026-10-20 — Day 04: Technical Clarifications & Vocabulary
- **කළ දේ:**
  - First Speaker (Danuja) ගේ presentation script එක මතක තියාගන්න පහසු bullet points වලට කැඩුවා.
  - **Telemetry** කියන්නේ කුමක්ද යන්න සහ F1/IoT උදාහරණ සහිතව තාක්ෂණිකව පැහැදිලි කරගත්තා.

---

## 🗓️ 2026-10-27 — Day 05: CAD & Enclosure Design Strategy
- **කළ දේ:**
  - AutoCAD වෙනුවට 3D Printing & Enclosure Mounting වලට ගැලපෙන්නේ **SolidWorks** හෝ **Autodesk Fusion 360** බව තීරණය කළා (Waterproof Box & Handlebar Mounts).

---

## 🗓️ 2026-10-28 — Day 06: Deep Architecture & Dual-Core Planning
- **කළ දේ:**
  - Instructors ලා සමඟ සාකච්ඡාවට සූදානම් වීම.
  - **Crash Detection:** Deterministic Multi-condition Sensor Fusion Algorithm (Edge Computing).
  - **ESP32 Dual-Core (FreeRTOS) සැලසුම:** `Core 0` (Safety) සහ `Core 1` (Networking/GPS).

---

## 🗓️ 2026-10-29 — Day 07: Cloud & Firebase Deployment
- **කළ දේ:**
  - Firebase Realtime Database එක Singapore Region (`asia-southeast1`) තුළ සාර්ථකව Enable කළා (`initial_database.json`).

---

## 🗓️ 2026-11-03 — Day 08: Standalone GPS Dashboard & Expo Go Exploration
- **කළ දේ:**
  - අනවශ්‍ය Background Subagents ඉවත් කර Token කාර්යක්ෂමතාවය රැකගත්තා.
  - **Auto Trip Detection & Haversine Distance Logic:** Cloud එකේ පසුබිමෙන් සිදුවන බව සැලසුම් කළා.
  - **Backend Adaptability:** යාළුවා Supabase (PostgreSQL) තෝරාගෙන ඇති බැවින්, SQL GIS ශක්තිය Trip Analytics වලට වාසියක් ලෙස පිළිගත්තා.
  - **Standalone GPS Dashboard App (`3yp\dashboard_app\`):**
    - `pubspec.yaml`: `supabase_flutter`, `shared_preferences`, Material icons.
    - `TelemetryData`: GPS Speed, Coordinates සහ Standby Sensor fallbacks සහිත Model එක.
    - `SpeedometerGauge`: CustomPainter මගින් සකස් කළ Neon Cyan Circular Arc Speedometer එක.
    - `ConfigService`: App එක ඇතුළෙන්ම ⚙️ Settings dialog එකක් මගින් Supabase URL, Anon Key, සහ Device ID (`RT-001`) ගසා connect වීමේ පහසුකම.
    - `DashboardScreen`: GPS Live Speed, Lat/Lon Coordinates, Standby Cards (Lean Angle, Engine Temp), සහ Crash Safety Status Banner සහිත Cockpit UI එක.
  - **Tablet Testing & Expo Go Shift:** පරිගණකයේ Android SDK නොමැතිවීම නිසා ඉක්මන් Testing සඳහා Tablet එකේ Expo Go භාවිතයට තීරණය කර `dashboard_expo` ආරම්භ කළා.

---

## 🗓️ 2026-11-04 — Day 09: Expo SDK 58 Migration, Live Google Maps & Cloud Tunneling
- **කළ දේ:**
  - **Expo SDK 58 Migration (`ridetrace_app`):**
    - Tablet එකේ අලුත්ම Expo Go අනුවාදයට (SDK 58) සහ React 19 / React Native 0.88 වලට ගැලපෙන ලෙස `ridetrace_app` ව්‍යාපෘතිය පිරිසිදුව පිහිටුවා packages (`expo@~58.0.22`, `react-native-svg@15.16.0`, `@react-native-async-storage/async-storage@2.2.0`) සාර්ථකව install කළා.
    - Windows node_modules file lock (`EPERM`) හා network timeout ගැටලු නිරාකරණය කර Project build එක ස්ථාවර කළා.
  - **Live Google Maps Integration (`react-native-maps`):**
    - `react-native-maps: 1.29.11` install කර [App.js](file:///d:/Academic/Short%20Sem%2002/3yp/ridetrace_app/App.js) එක තුළට සජීවී Google MapView සවි කළා.
    - Cockpit Dark UI තේමාවට ගැළපෙන **Custom Dark Map Style (JSON)** එකතු කළා.
    - Firebase වෙතින් එන `lat`, `lon` අනුව සජීවීව පාර දිගේ චලනය වන Cyan Pulse Effect සහිත **Animated Bike Marker (🏍️)** නිර්මාණය කළා.
    - සිතියම ඔබ්බට pan කළ විට නැවත බයිසිකලය වෙත ක්ෂණිකව කැඳවන **"🎯 Focus Bike"** auto-center පහසුකම එක් කළා.
    - [app.json](file:///d:/Academic/Short%20Sem%2002/3yp/ridetrace_app/app.json) හි `android.config.googleMaps.apiKey` සඳහා configuration සකස් කර, Expo Go හි zero-config Google Maps ක්‍රියාකාරීත්වය තහවුරු කළා.
  - **Polyglot Persistence Architecture (Firebase + Supabase):**
    - Live sub-second telemetry සහ dashboard streaming සඳහා Firebase Realtime DB ද, Historical Trip Analytics & SQL වාර්තා සඳහා Supabase (PostgreSQL) ද එකවර යොදාගැනීමේ වාසිදායක සැලසුම තහවුරු කළා.
    - Firebase Security Rules (`now < 1795804200000` / 2026-11-28) අනුව දැනට Testing සඳහා කිසිදු Private Key / Auth Token එකක් අවශ්‍ය නොවන බවත්, ESP32/Supabase වෙතින් කෙළින්ම HTTP PATCH මගින් දත්ත ලිවිය හැකි බවත් තහවුරු කර සාම්පල `curl` පරීක්ෂණ සටහන් කළා.
  - **Expo Cloud Tunneling & Collaboration:**
    - `npx expo start --tunnel` මගින් Cloudflare/ngrok public tunnel එකක් පිහිටුවා, ඕනෑම තැනක සිටින කණ්ඩායම් සාමාජිකයෙකුට Expo Go මගින් QR Code හෝ URL හරහා සජීවීව App එක test කිරීමේ හැකියාව සනාථ කළා.
    - Project directory පැටලීම (`dashboard_app` vs `dashboard_expo` vs `ridetrace_app`) නිරවුල් කර, නිල ක්‍රියාකාරී Project එක `ridetrace_app` බව ලේඛනගත කළා.
  - **Enterprise Admin & Hardware Provisioning Portal (`admin_dashboard`):**
    - **Privacy by Design:** පාරිභෝගිකයාගේ පෞද්ගලික Live Location හෝ ගමන් මාර්ග Admin ට නොපෙනෙන ලෙස (Zero Location Snooping) හුදෙක් Hardware Modules ලියාපදිංචි කිරීම සහ Customer Email Verification සඳහා පමණක් Admin Portal එක සැලසුම් කළා.
    - **Zero-Leak 3-Tier Security Architecture:** TypeScript + React (Clean Enterprise Light SaaS UI) Frontend එක සහ Node.js + Express (TypeScript) Backend API එක ලෙස කොටස් දෙකකට වෙන් කර, සියලුම Database URLs සහ Private Keys `server/.env` තුළ පමණක් ආරක්ෂිතව තැබුවා.
    - **Plug-and-Play Database Adapter (`db.service.ts`):** පසුව Supabase / Firebase URLs එකතු කරන තෙක් ස්වයංක්‍රීයව Local Vault (`server/data/vault.json`) මගින් ක්‍රියාත්මක වන ලෙසත්, `.env` හි URLs දැමූ සැණින් Cloud sync වන ලෙසත් ගොඩනැගුවා.
    - **Security Features:** Bcrypt-12 password hashing, 256-bit JWT session guard, Zod schema input validation, Rate Limiting, 6-digit Cryptographic Activation Token generation, Branded Verification Email Dispatcher & Interactive Preview Modal, Printable Box QR Label Generator, සහ Immutable Security Audit Trail එකක් සම්පූර්ණයෙන්ම නිර්මාණය කළා.
