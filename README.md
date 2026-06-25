# 💊 OTC&Me — AI-Powered OTC Aisle Assistant

> Built by pharmacists, for patients. Presented at the **VibeHack: Health x AI Hackathon**.

---

## 🩺 The Problem

Walk into any pharmacy and you'll find dozens of acetaminophen products — extra strength, rapid release, PM formulas, combination cold products — and most patients have no idea which one is safe for *them*. Too many choices, too little guidance, and a pharmacist stretched too thin to answer every question.

**OTC&Me** fixes this.

---

## 💡 What It Does

OTC&Me is a patient-facing web app that helps users safely navigate over-the-counter medication decisions — **with the pharmacist always as the final clinical checkpoint**.

Users pick a symptom, answer a few safety screening questions, and receive personalized, pharmacist-designed guidance. High-risk situations get escalated automatically. Low-risk situations empower the patient to self-serve confidently.

If you're interested 🔗 **Live Demo:** https://me-otc-trade.lovable.app)
---

## ✨ Core Features

### 🧭 Guided Symptom Flow
- Select from categories: headache/pain, cough & cold, allergies, GI symptoms, period cramps, acne/eczema/rash, vitamins & supplements, minor wound care
- One question at a time — large, easy-to-understand buttons designed for in-aisle use

### 🔴🟡🟢 Three-Tier Triage
| Result | When It Fires | What the Patient Sees |
|--------|--------------|----------------------|
| 🟢 **Green** | No major contraindications | Product recommendations + counseling tips |
| 🟡 **Yellow** | Precaution, interaction concern, pregnancy | "Pharmacist check recommended" + summary |
| 🔴 **Red** | Red-flag symptoms detected | "Do not self-treat" + prompt to see pharmacist |

### 📋 Product Recommendation Cards
Brand-name and store-brand comparisons with active ingredient, strength, price, and aisle location — so patients can shop with confidence.

### 🧾 Pharmacist Review Summary
When escalation is needed, patients get a concise, printable summary card to hand to the pharmacist — no app notifications, no auto-escalation. Patient in control.

### 📦 Workflow 2: Scan Your Medicine
Upload a photo of any OTC product and OTC&Me will check it against your health profile (allergies, chronic conditions, current meds) and return a **Yes / No / Maybe** with an explanation.

### 🗂️ OTC History
Save past product selections to help detect duplicate ingredients in future visits.

---

## 🎯 Demo Patient Profile

> 34-year-old female — T2DM, currently pregnant — 5'5" — Rx: Vitamin D, Pioglitazone — Peanut allergy

- **Use Case 1:** Presents with cold & flu symptoms → App recommends **acetaminophen** as the safe NSAID-free option (voice-guided via ElevenLabs)
- **Use Case 2:** Uploads a photo of Sudafed → App flags it as **NOT SAFE** during pregnancy

---

## 🏗️ Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | Lovable / React — clean, healthcare-focused UI |
| Voice | ElevenLabs (AI voice narration) |
| AI Logic | LLM with pharmacist-curated decision rules |
| Safety Rules | Hard-coded clinical logic (AI does not override) |
| Data | Mock data only — no real patient data stored |

---

## 💼 Business Model

OTC&Me is licensed to **retail pharmacy chains** as an embedded SaaS platform.

| Phase | Model | Target |
|-------|-------|--------|
| Pilot | Setup + platform license | $250K–$550K / pilot |
| National rollout | Annual enterprise SaaS | $1M–$2.5M ARR |
| Long-term | Performance-based + store-brand placement fees | $2M–$4M ARR |

**The ROI math:** A 0.25% lift in OTC conversion across CVS's relevant $5.6B OTC category = **~$14M in incremental annual sales** at a cost of $1–2.5M. That's a **2.8× gross-profit ROI**.

### Market Size
- **TAM:** $15M–$25M ARR (10 major retail pharmacy chains × avg enterprise contract)
- **SAM:** $4.5M–$7.5M ARR (CVS, Walgreens, Walmart)
- **SOM:** $250K–$550K pilot → $1M–$2.5M after first national rollout

---

## ⚕️ Safety Principles

- App is an **educational tool**, not a diagnostic tool
- Clinical safety rules are **pharmacist-designed and hard-coded** — AI cannot override them
- No sensitive health data stored in the prototype
- Pharmacist is always the **final checkpoint**
- Sponsored store-brand placement is **strictly separated** from clinical recommendations

---

## 🗺️ Roadmap

- [ ] Retailer inventory integration (real-time stock & pricing)
- [ ] Barcode scanning
- [ ] Multilingual support & accessibility options
- [ ] Pediatric, pregnancy, and older-adult care profiles
- [ ] Pharmacy loyalty account integration
- [ ] In-store aisle navigation map

---

## 👥 Team

Built with ❤️ at the **VibeHack: Health x AI Hackathon** by a team of pharmacists and developers who believe the OTC aisle should be a *safer, smarter frontline healthcare touchpoint*.

---

> *OTC&Me does not provide medical advice. Always confirm with a licensed pharmacist.*
