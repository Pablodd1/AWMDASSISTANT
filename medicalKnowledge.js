// Medical Knowledge Base for Med-Consult AI
// Separated for maintainability and scalability

(function(global) {
    const MedicalKnowledge = {
        getResponse: function(query) {
            const q = query.toLowerCase();

            // 1. Peptides & Regenerative (Check first to avoid collisions like 'bp' in 'bpc-157')
            if (q.includes('bpc-157') || q.includes('bpc')) {
                return "BPC-157: 15-amino acid gastric peptide. Mechanism: Angiogenesis, collagen synthesis, anti-inflammatory. Uses: Tendon/ligament injuries, gut healing, neuroprotection. Dosing: 250-500mcg SQ/IM BID. Duration: 4-6 weeks. Physician-grade sourcing essential. Not FDA-approved.";
            }
            if (q.includes('tb-500') || q.includes('thymosin')) {
                return "TB-500 (Thymosin Beta-4): Promotes tissue repair, angiogenesis, cell migration. Uses: Acute injuries, chronic inflammation, wound healing. Dosing: 2-5mg SQ 2x/week for 4-6 weeks, then maintenance 2mg/week. Often stacked with BPC-157. Research-only status.";
            }
            if (q.includes('cjc-1295') || q.includes('ipamorelin') || q.includes('growth hormone')) {
                return "CJC-1295/Ipamorelin: GH secretagogue combo. Benefits: Increased lean mass, fat loss, recovery, sleep quality. Dosing: 200-300mcg each, SQ before bed. Contraindications: Active cancer, uncontrolled diabetes. Monitor: IGF-1, glucose, lipids. Requires MD prescription and clearance labs.";
            }

            // Cardiovascular & Vitals
            if (q.includes('hrv') || q.includes('heart rate variability')) {
                return "HRV (Heart Rate Variability) measures parasympathetic tone and autonomic balance. Normal: 50-100ms. Low HRV (<30ms) indicates chronic stress, inflammation, or overtraining. Interventions: Zone 2 cardio, vagal breathing, cold exposure, magnesium supplementation.";
            }
            if (q.includes('blood pressure') || q.includes('hypertension') || /\b(bp)\b/i.test(q)) {
                return "Optimal BP: <120/80. Elevated: 120-129/<80. Stage 1 HTN: 130-139/80-89. Stage 2: ≥140/90. First-line: Lifestyle (DASH diet, exercise, weight loss). Pharmacologic: ACE-I/ARB, CCB, thiazide diuretics. Monitor for end-organ damage (retinopathy, nephropathy).";
            }

            // Metabolic & Labs
            if (q.includes('hba1c') || q.includes('a1c') || q.includes('diabetes')) {
                return "HbA1c reflects 3-month glucose average. Normal: <5.7%. Prediabetes: 5.7-6.4%. Diabetes: ≥6.5%. Target for diabetics: <7% (individualize). Correlates with microvascular complications. Recheck q3mo if uncontrolled, q6mo if stable. CPT 83036.";
            }
            if (q.includes('ldl') || q.includes('cholesterol')) {
                return "LDL-C targets: Primary prevention <100mg/dL, high-risk <70mg/dL, very high-risk <55mg/dL. Consider advanced lipid panel (NMR) for particle size/number. Statins are first-line. Monitor CK, LFTs. Add ezetimibe or PCSK9-i if needed. Lifestyle: Mediterranean diet, omega-3, exercise.";
            }
            if (q.includes('crp') || q.includes('c-reactive') || q.includes('inflammation')) {
                return "CRP-hs (high-sensitivity) is a marker of systemic inflammation and CV risk. Low: <1mg/L, Average: 1-3mg/L, High: >3mg/L. Elevated CRP + low HRV suggests increased CV event risk. Interventions: anti-inflammatory diet, omega-3 (2g EPA/DHA), curcumin, exercise.";
            }
            if (q.includes('vitamin d') || q.includes('vit d')) {
                return "Vitamin D (25-OH) optimal: 50-80 ng/mL. Deficiency: <20ng/mL. Insufficiency: 20-30ng/mL. Dose: 2000-5000 IU daily (adjust based on levels). Always pair with K2 (MK-7) to prevent vascular calcification. Recheck in 3 months. CPT 82306.";
            }
            if (q.includes('thyroid') || q.includes('tsh')) {
                return "TSH optimal: 0.5-2.5 mIU/L (functional range). Standard: 0.4-4.0. Order full panel: TSH, Free T4, Free T3, TPO antibodies, Thyroglobulin Ab. Subclinical hypo: TSH >2.5 with normal T4/T3. Consider treatment if symptomatic or TPO+. Levothyroxine dosing: 1.6mcg/kg.";
            }

            // Medications
            if (q.includes('metoprolol') || q.includes('beta blocker')) {
                return "Metoprolol: Cardioselective β1-blocker. Indications: HTN, angina, post-MI, HFrEF. Caution: Masks hypoglycemia in diabetics, suppresses HR/HRV response. Contraindications: Asthma, severe bradycardia, heart block. Monitor HR, BP. Taper to discontinue.";
            }
            if (q.includes('metformin')) {
                return "Metformin: First-line for T2DM. Mechanism: Decreases hepatic glucose production, increases insulin sensitivity. Dose: Start 500mg BID, titrate to 1000mg BID. SE: GI upset, B12 deficiency (monitor annually). Contraindication: eGFR <30. Lactic acidosis risk if contrast/surgery.";
            }
            if (q.includes('statin') || q.includes('atorvastatin') || q.includes('lipitor')) {
                return "Statins: HMG-CoA reductase inhibitors. High-intensity (Atorvastatin 40-80mg, Rosuvastatin 20-40mg) lowers LDL ~50%. Monitor: Baseline + annual LFTs, CK if symptomatic. SE: Myalgia (10%), rhabdomyolysis (rare). Supplement CoQ10 (100-200mg) for muscle symptoms.";
            }
            if (q.includes('lisinopril') || q.includes('ace inhibitor') || q.includes('ace-i')) {
                return "ACE Inhibitors (Lisinopril, Enalapril): Block angiotensin II formation. Indications: HTN, HFrEF, post-MI, diabetic nephropathy. SE: Dry cough (10%), hyperkalemia, angioedema (rare). Monitor: K+, Cr, BP. Contraindication: Pregnancy, bilateral renal artery stenosis.";
            }

            // Procedures & Diagnostics
            if (q.includes('dexa') || q.includes('bone density')) {
                return "DEXA Scan: Dual-energy X-ray absorptiometry. Measures: Bone mineral density (osteoporosis screening) and body composition (lean mass, fat %, visceral fat). T-score: >-1 normal, -1 to -2.5 osteopenia, <-2.5 osteoporosis. CPT 77080. Frequency: q2 years.";
            }
            if (q.includes('ekg') || q.includes('ecg') || q.includes('electrocardiogram')) {
                return "EKG: 12-lead electrocardiogram. Evaluates: Rhythm, ischemia, infarction, conduction abnormalities, chamber enlargement. Indications: Chest pain, palpitations, syncope, pre-op clearance. Normal: NSR 60-100bpm, PR <200ms, QRS <120ms, QTc <450ms (M), <460ms (F). CPT 93000.";
            }

            // Lifestyle & Biohacks
            if (q.includes('sleep') || q.includes('apnea') || q.includes('cpap')) {
                return "Sleep Apnea (OSA): Defined by AHI > 5. Symptoms: Snoring, daytime fatigue, morning headaches. Risks: HTN, AFib, Stroke, insulin resistance. Diagnosis: Home sleep test or PSG (CPT 95810). Treatment: CPAP, oral appliance, weight loss, position therapy.";
            }
            if (q.includes('zone 2') || q.includes('cardio') || q.includes('aerobic')) {
                return "Zone 2 Training: Aerobic exercise at 60-70% max HR (conversational pace). Benefits: Mitochondrial biogenesis, fat oxidation, metabolic flexibility, VO2max improvement. Prescription: 150-180 min/week. Modalities: Cycling, rowing, incline walking. Monitor via HR or lactate (2mmol/L).";
            }
            if (q.includes('cold') || q.includes('thermogenesis') || q.includes('ice bath')) {
                return "Cold Thermogenesis: Deliberate cold exposure (50-59°F). Benefits: Increases norepinephrine, improves vagal tone, brown fat activation, reduces inflammation. Protocol: 3-11 min total per week (can split). Start 30sec, build tolerance. Post-workout timing may blunt hypertrophy.";
            }
            if (q.includes('magnesium')) {
                return "Magnesium: Essential for 300+ enzymatic reactions. Deficiency: Common (50% US population). Forms: Glycinate (best absorption, sleep), Threonate (cognitive), Citrate (GI motility). Dosing: 400-600mg elemental Mg daily. Benefits: Sleep, HRV, muscle recovery, BP reduction, insulin sensitivity.";
            }

            // Billing & Coding
            if (q.includes('cpt') || q.includes('billing') || q.includes('code')) {
                return "Common CPT Codes:\n" +
                    "• E/M: 99213 (Level 3), 99214 (Level 4), 99215 (Level 5)\n" +
                    "• Cardiovascular: 93000 (EKG), 93010 (EKG report), 93306 (Echo), 95921 (Autonomic Testing)\n" +
                    "• Imaging: 77080 (DEXA), 75571 (CAC Score), 71045 (Chest X-ray)\n" +
                    "• Labs: 80053 (CMP), 80061 (Lipid), 83036 (HbA1c), 82306 (Vit D), 84443 (TSH), 86141 (hs-CRP)\n" +
                    "• Procedures: 96372 (IM Injection), 99401 (Preventive Counseling)\n\n" +
                    "Common DX (ICD-10) Codes:\n" +
                    "• Metabolic: E11.9 (T2DM w/out complications), E78.5 (Hyperlipidemia), E66.9 (Obesity)\n" +
                    "• Cardiovascular: I10 (Essential HTN), I48.91 (AFib), I25.10 (CAD)\n" +
                    "• General: Z00.00 (Adult Medical Exam), M54.50 (Low Back Pain), F41.1 (GAD)";
            }

            // Default
            return "I can assist with clinical queries on: cardiovascular health, metabolic markers (HbA1c, lipids, CRP), medications (beta-blockers, statins, ACE-I, metformin), regenerative peptides (BPC-157, TB-500, CJC/Ipamorelin), diagnostic procedures (DEXA, EKG), lifestyle interventions (Zone 2, cold exposure, supplements), and billing codes. Please specify your question.";
        }
    };

    global.MedicalKnowledge = MedicalKnowledge;

})(window);
