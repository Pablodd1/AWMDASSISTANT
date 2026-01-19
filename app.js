// MediDoc Pro Logic - Professional Document Synthesis & Analysis

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements - View Management
    const viewTabs = document.querySelectorAll('.tab-btn');
    const viewContents = document.querySelectorAll('.view-content');

    // UI Elements - Extraction
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const extractedTextDiv = document.getElementById('extracted-text');

    // UI Elements - Vitals
    const vHR = document.getElementById('v-hr');
    const vHRV = document.getElementById('v-hrv');
    const vBP = document.getElementById('v-bp');
    const vSPO2 = document.getElementById('v-spo2');
    const syncWearablesBtn = document.getElementById('sync-wearables');

    // UI Elements - SOAP
    const soapDoc = document.getElementById('soap-document');
    const printBtn = document.getElementById('print-soap');
    const downloadPdfBtn = document.getElementById('download-pdf');

    const addCodeBtn = document.getElementById('add-code-btn');
    const statusText = document.getElementById('status-text') || { textContent: '' }; // Fallback

    // UI Elements - Voice
    const doctorNoteArea = document.getElementById('doctor-note');
    const startVoiceBtn = document.getElementById('start-voice');
    const voiceStatus = document.getElementById('voice-status');

    // UI Elements - Chat
    const chatToggle = document.getElementById('chat-toggle');
    const chatPanel = document.getElementById('chat-panel');
    const closeChatBtn = document.getElementById('close-chat');
    const sendChatBtn = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    const downloadWordBtn = document.getElementById('download-word');

    // App State
    const savedState = localStorage.getItem('mediDocState');
    let state = savedState ? JSON.parse(savedState) : {
        rawText: '',
        patient: { name: '', dob: '', age: '', sex: '', chart: 'AW-7742', provider: 'Andre Bezerra, APRN' },
        history: {
            medical: '',
            surgical: '',
            family: '',
            social: '',
            allergies: '',
            complaint: ''
        },
        entities: [],
        vitals: { hr: 65, hrv: 45, bp: '120/80', spo2: 98 },
        codes: [
            { code: 'Z00.00', desc: 'Encounter for general adult medical examination', justification: 'Standard baseline assessment code.' }
        ],
        analysis: null
    };

    function saveState() {
        localStorage.setItem('mediDocState', JSON.stringify(state));
    }

    // Initialize UI with state
    if (savedState) {
        // Restore demographics
        if (state.patient.name) document.getElementById('p-name').value = state.patient.name;
        if (state.patient.dob) document.getElementById('p-dob').value = state.patient.dob;
        if (state.patient.age) document.getElementById('p-age').value = state.patient.age;
        if (state.patient.sex) document.getElementById('p-sex').value = state.patient.sex;

        // Restore other fields
        if (state.history.medical) document.getElementById('h-medical').value = state.history.medical;
        if (state.history.surgical) document.getElementById('h-surgical').value = state.history.surgical;
        if (state.history.family) document.getElementById('h-family').value = state.history.family;
        if (state.history.social) document.getElementById('h-social').value = state.history.social;
        if (state.history.allergies) document.getElementById('h-allergies').value = state.history.allergies;
        if (state.history.complaint) document.getElementById('p-complaint').value = state.history.complaint;

        if (state.vitals.hr) document.getElementById('v-hr').value = state.vitals.hr;
        if (state.vitals.hrv) document.getElementById('v-hrv').value = state.vitals.hrv;
        if (state.vitals.bp) document.getElementById('v-bp').value = state.vitals.bp;
        if (state.vitals.spo2) document.getElementById('v-spo2').value = state.vitals.spo2;

        if (state.patient.provider) document.getElementById('p-provider').value = state.patient.provider;
        if (state.patient.chart) document.getElementById('p-chart').value = state.patient.chart;

        if (state.codes.length > 0) renderCodes();
    }

    // --- Tab Management ---
    viewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const viewId = tab.getAttribute('data-view');
            switchView(viewId);
        });
    });

    function switchView(viewId) {
        viewTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-view') === viewId));
        viewContents.forEach(c => c.classList.toggle('active', c.id === `view-${viewId}`));

        if (viewId === 'soap') generateSOAP();
        if (viewId === 'dashboard') updateDashboard();
    }

    // --- File Processing ---
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processFile(e.target.files[0]);
    });

    async function processFile(file) {
        statusText.textContent = `Processing ${file.name}...`;
        statusText.style.color = '#0284c7';
        try {
            let text = '';
            // Basic extraction (Existing logic preserved mentally)
            if (file.type === 'application/pdf') {
                text = await extractTextFromPDF(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                text = await extractTextFromWord(file);
            } else {
                throw new Error('Unsupported file type. Please upload PDF or DOCX.');
            }

            state.rawText = text;
            state.entities = performMedicalAnalysis(text);

            // Auto-extract demographics
            const demographics = extractDemographics(text);
            Object.assign(state.patient, demographics);
            saveState();

            // Auto-populate dashboard
            if (state.patient.name) document.getElementById('p-name').value = state.patient.name;
            if (state.patient.dob) document.getElementById('p-dob').value = state.patient.dob;
            if (state.patient.age) document.getElementById('p-age').value = state.patient.age;

            statusText.textContent = `✓ Successfully processed ${file.name}`;
            statusText.style.color = '#10b981';
            switchView('dashboard');
        } catch (error) {
            console.error('File Processing Error:', error);
            statusText.textContent = `✗ Error: ${error.message}`;
            statusText.style.color = '#ef4444';

            // Show detailed error to user
            const errorDetails = `Failed to process "${file.name}"\n\nError: ${error.message}\n\nTroubleshooting:\n• Ensure the file is not corrupted\n• Try re-saving the PDF from the source\n• For local files, consider using a local web server\n• Check browser console for detailed logs`;
            alert(errorDetails);
        }
    }

    function extractDemographics(text) {
        // Improved regex-based demographic extraction
        // Capture until end of line to avoid grabbing subsequent fields
        const nameMatch = text.match(/(?:Name|Patient):\s*([^\n\r]+)/i);
        const dobMatch = text.match(/(?:DOB|Date of Birth):\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        const ageMatch = text.match(/(?:Age):\s*(\d{1,3})/i);
        const sexMatch = text.match(/(?:Sex|Gender):\s*(M|F|Male|Female|Other)/i);

        const demographics = {};
        if (nameMatch) demographics.name = nameMatch[1].trim();
        if (dobMatch) demographics.dob = dobMatch[1].trim();
        if (ageMatch) demographics.age = ageMatch[1].trim();
        if (sexMatch) demographics.sex = sexMatch[1].trim().charAt(0).toUpperCase();

        return demographics;
    }

    // --- Vitals & History Sync ---
    const dashboardInputs = [
        'p-name', 'p-dob', 'p-age', 'p-provider', 'p-chart', 'p-complaint',
        'v-hr', 'v-hrv', 'v-bp', 'v-spo2',
        'h-medical', 'h-surgical', 'h-family', 'h-social', 'h-allergies'
    ];

    dashboardInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (id.startsWith('p-')) state.patient[id.split('-')[1]] = el.value;
                if (id.startsWith('v-')) state.vitals[id.split('-')[1]] = el.value;
                if (id.startsWith('h-')) state.history[id.split('-')[1]] = el.value;
                saveState();
            });
        }
    });

    syncWearablesBtn.addEventListener('click', () => {
        // Mock sync
        document.getElementById('v-hr').value = 62;
        document.getElementById('v-hrv').value = 58;
        document.getElementById('v-bp').value = "118/76";
        document.getElementById('v-spo2').value = 99;
        state.vitals = { hr: 62, hrv: 58, bp: "118/76", spo2: 99 };
        alert('Data synced from Oura/Apple Health (Mock)');
    });

    // --- Clinical Coding Logic ---
    addCodeBtn.addEventListener('click', () => {
        const code = newCodeInput.value.trim();
        const desc = newCodeDescInput.value.trim();
        if (code) {
            // Simulated Medical Biller Justification logic
            const justification = `Medical necessity documented via clinical document review and physiological flags (HRV/Bloodwork). Supporting DX for CPT ${code}.`;
            state.codes.push({ code, desc, justification });
            newCodeInput.value = '';
            newCodeDescInput.value = '';
            renderCodes();
        }
    });

    function renderCodes() {
        codeList.innerHTML = '';
        state.codes.forEach((item, index) => {
            const tag = document.createElement('div');
            tag.className = 'code-tag';
            tag.title = item.justification;
            tag.innerHTML = `<strong>${item.code}</strong> ${item.desc} <span style="cursor:pointer;margin-left:5px" onclick="this.parentElement.remove()">×</span>`;
            codeList.appendChild(tag);
        });

        // Update SOAP Assessment view with clinical justifications for billing
        const assessmentCodes = document.getElementById('assessment-codes');
        if (assessmentCodes) {
            assessmentCodes.innerHTML = state.codes.map(c => `
                <div class="billing-entry">
                    <p><strong>• ${c.code}:</strong> ${c.desc}</p>
                    <p class="medical-rationale"><em>Justification:</em> ${c.justification}</p>
                </div>
            `).join('');
        }
    }

    // --- Voice Implementation (Web Speech API) ---
    let recognition;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            startVoiceBtn.classList.add('recording');
            voiceStatus.innerText = 'Listening...';
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            doctorNoteArea.value += transcript;
        };

        recognition.onerror = () => {
            stopVoice();
            alert('Speech recognition error. Check microphone permissions.');
        };

        recognition.onend = () => {
            startVoiceBtn.classList.remove('recording');
            voiceStatus.innerText = 'Idle';
        };
    }

    function stopVoice() {
        if (recognition) recognition.stop();
    }

    startVoiceBtn.addEventListener('click', () => {
        if (startVoiceBtn.classList.contains('recording')) {
            stopVoice();
        } else {
            recognition.start();
        }
    });

    // --- Red Flag System (Data Integrity) ---
    function checkDataIntegrity() {
        const flags = [];
        if (!state.patient.name || state.patient.name === '') {
            flags.push('Patient Name Missing');
        }
        if (!state.patient.dob || state.patient.dob === '') {
            flags.push('Patient DOB Missing');
        }
        if (!state.patient.age || state.patient.age === '') {
            flags.push('Patient Age Missing');
        }
        if (!state.patient.sex || state.patient.sex === '') {
            flags.push('Patient Sex Missing');
        }
        if (state.patient.chart === 'AW-7742' || !state.patient.chart) {
            flags.push('Verify Chart #');
        }

        // History Checks
        if (!state.history.medical) flags.push('Medical History Missing');
        if (!state.history.surgical) flags.push('Surgical History Missing');
        if (!state.history.family) flags.push('Family History Missing');

        if (!state.vitals.hrv || state.vitals.hrv === 45) { // 45 is placeholder
            document.getElementById('card-hrv').classList.add('red-flag');
            flags.push('HRV Missing/Default');
        } else {
            document.getElementById('card-hrv').classList.remove('red-flag');
        }

        if (!state.vitals.bp || state.vitals.bp === '120/80') {
            document.getElementById('card-bp').classList.add('red-flag');
            flags.push('Blood Pressure Missing/Default');
        } else {
            document.getElementById('card-bp').classList.remove('red-flag');
        }

        return flags;
    }

    // --- Medical Chatbot (Med-Consult AI) ---
    chatToggle.addEventListener('click', () => {
        chatPanel.style.display = chatPanel.style.display === 'none' ? 'flex' : 'none';
    });

    closeChatBtn.addEventListener('click', () => chatPanel.style.display = 'none');

    sendChatBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });

    function handleChat() {
        const query = chatInput.value.trim();
        if (!query) return;

        addChatMessage('user', query);
        chatInput.value = '';

        // Simulate Clinical Database Search
        setTimeout(() => {
            const response = getMedicalResponse(query);
            addChatMessage('bot', response);
        }, 800);
    }

    function addChatMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${role}`;
        msgDiv.innerText = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getMedicalResponse(query) {
        const q = query.toLowerCase();

        // Cardiovascular & Vitals
        if (q.includes('hrv') || q.includes('heart rate variability')) {
            return "HRV (Heart Rate Variability) measures parasympathetic tone and autonomic balance. Normal: 50-100ms. Low HRV (<30ms) indicates chronic stress, inflammation, or overtraining. Interventions: Zone 2 cardio, vagal breathing, cold exposure, magnesium supplementation.";
        }
        if (q.includes('blood pressure') || q.includes('hypertension') || q.includes('bp')) {
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

        // Peptides & Regenerative
        if (q.includes('bpc-157') || q.includes('bpc')) {
            return "BPC-157: 15-amino acid gastric peptide. Mechanism: Angiogenesis, collagen synthesis, anti-inflammatory. Uses: Tendon/ligament injuries, gut healing, neuroprotection. Dosing: 250-500mcg SQ/IM BID. Duration: 4-6 weeks. Physician-grade sourcing essential. Not FDA-approved.";
        }
        if (q.includes('tb-500') || q.includes('thymosin')) {
            return "TB-500 (Thymosin Beta-4): Promotes tissue repair, angiogenesis, cell migration. Uses: Acute injuries, chronic inflammation, wound healing. Dosing: 2-5mg SQ 2x/week for 4-6 weeks, then maintenance 2mg/week. Often stacked with BPC-157. Research-only status.";
        }
        if (q.includes('cjc-1295') || q.includes('ipamorelin') || q.includes('growth hormone')) {
            return "CJC-1295/Ipamorelin: GH secretagogue combo. Benefits: Increased lean mass, fat loss, recovery, sleep quality. Dosing: 200-300mcg each, SQ before bed. Contraindications: Active cancer, uncontrolled diabetes. Monitor: IGF-1, glucose, lipids. Requires MD prescription and clearance labs.";
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
            return "Common CPT Codes: 99213 (Level 3 office visit, 20-29min), 99214 (Level 4, 30-39min), 99215 (Level 5, 40-54min). Labs: 80053 (CMP), 80061 (Lipid panel), 83036 (HbA1c), 82306 (Vitamin D). Procedures: 77080 (DEXA), 93000 (EKG). Ensure medical necessity documentation.";
        }

        // Default
        return "I can assist with clinical queries on: cardiovascular health, metabolic markers (HbA1c, lipids, CRP), medications (beta-blockers, statins, ACE-I, metformin), regenerative peptides (BPC-157, TB-500, CJC/Ipamorelin), diagnostic procedures (DEXA, EKG), lifestyle interventions (Zone 2, cold exposure, supplements), and billing codes. Please specify your question.";
    }

    // --- Word Document Export (.docx) ---
    downloadWordBtn.addEventListener('click', () => {
        const soapHtml = document.getElementById('soap-document').innerHTML;
        // Simple HTML-to-Word blob as a POC (professional versions use docx.js)
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Clinical Report</title></head><body>";
        const footer = "</body></html>";
        const sourceLayout = header + soapHtml + footer;

        const blob = new Blob(['\ufeff', sourceLayout], {
            type: 'application/msword'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "AmericanWellness_ClinicalReport.doc";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- Enhanced SOAP Generation ---
    function generateSOAP() {
        // 1. Sync Patient Header
        document.getElementById('soap-p-name').innerText = state.patient.name || 'Not Recorded';
        document.getElementById('soap-p-dob').innerText = state.patient.dob || 'Not Recorded';
        document.getElementById('soap-p-age').innerText = state.patient.age || '--';
        document.getElementById('soap-p-sex').innerText = (document.getElementById('p-sex')?.value) || '--';
        document.getElementById('soap-p-chart').innerText = state.patient.chart || 'AW-7742';
        document.getElementById('soap-p-provider').innerText = state.patient.provider || 'Andre Bezerra, APRN';
        document.getElementById('soap-footer-provider').innerText = state.patient.provider || 'Andre Bezerra, APRN';

        // 2. Populate Clinical Sections
        document.getElementById('soap-complaint').innerText = state.history.complaint || "Routine review of medical records.";

        const hpiText = document.getElementById('doctor-note').value;
        document.getElementById('soap-hpi').innerText = hpiText || "Patient presents for a comprehensive review of laboratory results. Reports no acute complaints at this time. Denies fatigue, polyuria, polydipsia, weight changes, chest pain, shortness of breath, or abdominal pain.";

        document.getElementById('soap-medical-hx').innerText = state.history.medical || "1. HLH\n2. High Cholesterol\n3. HTN\n4. GERD\n5. Constipation\n6. Hearing Loss\n7. OA\n8. Anxiety";
        document.getElementById('soap-surgical-hx').innerText = state.history.surgical || "1. Eye Surgery\n2. Excision of skin cancer\n3. Cholecystectomy\n4. R. Knee Replacement (2018)\n5. Carotid endarterectomy";
        document.getElementById('soap-family-hx').innerText = state.history.family || "Non-contributory per patient report.";
        document.getElementById('soap-social-hx').innerText = state.history.social || "Denies tobacco/illicit drug use.";

        // Dynamic Smoking Status based on Social Hx or explicit field
        const social = state.history.social.toLowerCase();
        let smokingStatus = "Never Smoker";
        if (social.includes('smoke') || social.includes('tobacco')) smokingStatus = "Current Smoker / Tobacco User";
        if (social.includes('former') || social.includes('quit')) smokingStatus = "Former Smoker";
        document.getElementById('soap-smoking').innerText = smokingStatus;

        document.getElementById('soap-allergies').innerText = state.history.allergies || "No Known Drug Allergies (NKDA).";

        // 3. Medications Table
        const meds = state.entities.find(e => e.category === 'Medications Found')?.items || [];
        const medsTable = document.getElementById('soap-meds-table');
        if (meds.length) {
            let html = `<table class="clinical-table"><thead><tr><th>Medication</th><th>Dose/Freq</th></tr></thead><tbody>`;
            meds.forEach(m => html += `<tr><td>${m}</td><td>One Po Q Day</td></tr>`);
            html += `</tbody></table>`;
            medsTable.innerHTML = html;
        } else {
            // Default clinical example if nothing found
            medsTable.innerHTML = `<table class="clinical-table"><thead><tr><th>Medication</th><th>Dose/Freq</th></tr></thead><tbody>
                <tr><td>Potassium Chloride Crys Er 10MEQ</td><td>One Po Q Day</td></tr>
                <tr><td>Azithromycin 250MG Tablet</td><td>Take 2 Tabs Po X 1, Then 1 Tab Daily X4 Days</td></tr>
                <tr><td>Metformin Hcl 500MG Tablet</td><td>1 Bid</td></tr>
                <tr><td>Atenolol 25MG Tablet</td><td>1 Po Q Am at T</td></tr>
            </tbody></table>`;
        }

        // 4. Assessment (ICD Codes)
        renderCodes();

        // 5. Plan & Synthesis
        document.getElementById('assessment-plan').innerHTML = performFunctionalSynthesis();

        // 6. Partition Recommendations
        renderStructuredRecommendations();

        // 7. Health Maintenance
        const maintenanceTable = document.getElementById('soap-maintenance-rows');
        maintenanceTable.innerHTML = `
            <tr><td>Influenza Vaccine</td><td>02/07/2016</td><td>02/07/2017</td><td>Performed</td></tr>
            <tr><td>Urinalysis</td><td>08-16-2015</td><td>08-16-2016</td><td>Performed</td></tr>
            <tr><td>Diabetes, Eye Exam</td><td>07-25-2015</td><td>07-25-2016</td><td>Performed</td></tr>
        `;
    }

    function checkDataIntegrity() {
        const gaps = [];
        if (!state.patient.name) gaps.push('Patient Name');
        if (!state.patient.dob) gaps.push('Patient DOB');
        if (!state.vitals.hrv) gaps.push('HRV data');
        // Add more checks as needed
        return gaps;
    }

    function renderStructuredRecommendations() {
        const raw = state.rawText.toLowerCase();
        const medicalHx = (state.history.medical || '').toLowerCase();
        const familyHx = (state.history.family || '').toLowerCase();
        const socialHx = (state.history.social || '').toLowerCase();

        // Collect red flags and missing data
        const dataGaps = checkDataIntegrity();

        // === LIFESTYLE & DIET RECOMMENDATIONS ===
        let lifestyleHtml = '<ul>';

        // Based on HRV
        if (state.vitals.hrv && state.vitals.hrv < 40) {
            lifestyleHtml += '<li><strong>Autonomic Recovery Protocol:</strong> Low HRV detected. Implement Zone 2 cardio (150min/wk), vagal breathing exercises (5min 2x/day), and prioritize 7-9hr sleep.</li>';
        }

        // Based on medical history
        if (medicalHx.includes('diabetes') || medicalHx.includes('prediabetes') || raw.includes('hba1c')) {
            lifestyleHtml += '<li><strong>Glycemic Control:</strong> Low-glycemic Mediterranean diet, 30min post-meal walks, intermittent fasting (12-16hr window). Target HbA1c <5.7%.</li>';
        }

        if (medicalHx.includes('hypertension') || medicalHx.includes('htn') || medicalHx.includes('high blood pressure')) {
            lifestyleHtml += '<li><strong>Blood Pressure Management:</strong> DASH diet (high K+, low Na+), daily aerobic exercise, stress reduction via meditation/breathwork. Target <120/80.</li>';
        }

        if (medicalHx.includes('cholesterol') || medicalHx.includes('hyperlipidemia') || raw.includes('ldl')) {
            lifestyleHtml += '<li><strong>Lipid Optimization:</strong> Increase omega-3 intake (fatty fish 3x/wk or 2g EPA/DHA daily), soluble fiber (oats, beans), plant sterols. Eliminate trans fats.</li>';
        }

        // Based on family history
        if (familyHx.includes('heart') || familyHx.includes('cardiac') || familyHx.includes('mi')) {
            lifestyleHtml += '<li><strong>Cardiovascular Prevention:</strong> Family history of heart disease warrants aggressive lifestyle modification. VO2max testing recommended. Target Zone 2 training + HIIT 1x/wk.</li>';
        }

        // Based on social history
        if (socialHx.includes('sedentary') || !socialHx.includes('exercise')) {
            lifestyleHtml += '<li><strong>Physical Activity:</strong> No documented exercise routine. Initiate with 30min daily walking, progress to 150min/wk moderate-intensity aerobic + 2x/wk resistance training.</li>';
        }

        // Default recommendations
        if (lifestyleHtml === '<ul>') {
            lifestyleHtml += '<li><strong>Foundational Health:</strong> Mediterranean diet, 150min/wk Zone 2 cardio, 7-9hr sleep, stress management, social connection.</li>';
            lifestyleHtml += '<li><strong>Circadian Optimization:</strong> Morning sunlight exposure (10min), blue-light blocking after sunset, consistent sleep/wake times.</li>';
        }

        lifestyleHtml += '</ul>';
        document.getElementById('soap-lifestyle').innerHTML = lifestyleHtml;

        // === BIOHACKS & ADVANCED INTERVENTIONS ===
        let biohackHtml = '<ul>';

        if (state.vitals.hrv && state.vitals.hrv < 35) {
            biohackHtml += '<li><strong>Cold Thermogenesis:</strong> 3-11min total cold exposure per week (50-59°F). Increases norepinephrine, improves vagal tone, activates brown fat.</li>';
            biohackHtml += '<li><strong>HRV Biofeedback:</strong> Daily resonance frequency breathing (5-6 breaths/min for 10min). Use HRV tracking app for real-time feedback.</li>';
        }

        if (medicalHx.includes('inflammation') || raw.includes('crp')) {
            biohackHtml += '<li><strong>Anti-Inflammatory Protocol:</strong> Curcumin 500mg BID with black pepper, omega-3 (2g EPA/DHA), eliminate processed foods, consider 16:8 intermittent fasting.</li>';
        }

        if (raw.includes('sleep') || raw.includes('insomnia') || raw.includes('fatigue')) {
            biohackHtml += '<li><strong>Sleep Optimization:</strong> Magnesium glycinate 400mg before bed, blackout curtains, room temp 65-68°F, no screens 1hr before sleep, consider sleep study if persistent.</li>';
        }

        biohackHtml += '<li><strong>Mitochondrial Support:</strong> CoQ10 100-200mg daily, NAD+ precursors (NMN or NR), regular Zone 2 training for mitochondrial biogenesis.</li>';
        biohackHtml += '</ul>';
        document.getElementById('soap-lifestyle').innerHTML += '<h4 style="margin-top:1rem;">Advanced Biohacks:</h4>' + biohackHtml;

        // === PEPTIDE PROTOCOLS ===
        let peptideHtml = '';
        let peptideIndicated = false;

        if (raw.includes('injury') || raw.includes('tendon') || raw.includes('ligament') || medicalHx.includes('arthritis')) {
            peptideHtml += '<li><strong>BPC-157 (250-500mcg SQ BID):</strong> Tissue repair protocol for musculoskeletal injuries, gut healing. Duration: 4-6 weeks. Physician-grade sourcing required.</li>';
            peptideHtml += '<li><strong>TB-500 (2-5mg SQ 2x/wk):</strong> Acute injury recovery, anti-inflammatory. Often stacked with BPC-157 for synergistic effects.</li>';
            peptideIndicated = true;
        }

        if (raw.includes('fatigue') || raw.includes('aging') || state.vitals.hrv < 35 || medicalHx.includes('sarcopenia')) {
            peptideHtml += '<li><strong>CJC-1295/Ipamorelin (200-300mcg each SQ before bed):</strong> GH secretagogue for lean mass, fat loss, recovery, sleep quality. Requires baseline IGF-1, glucose, lipids. Contraindicated in active cancer.</li>';
            peptideIndicated = true;
        }

        if (medicalHx.includes('neuropathy') || raw.includes('nerve')) {
            peptideHtml += '<li><strong>Cerebrolysin or Semax:</strong> Neuroprotective peptides for cognitive function and nerve regeneration. Requires specialist consultation.</li>';
            peptideIndicated = true;
        }

        if (peptideIndicated) {
            document.getElementById('peptide-content').innerHTML = '<ul>' + peptideHtml + '</ul><p><em>*All peptide protocols require MD prescription, baseline labs, and ongoing monitoring. Not FDA-approved for these indications.</em></p>';
        } else {
            document.getElementById('peptide-content').innerHTML = 'No regenerative peptide protocols indicated based on current clinical picture. Consider for future optimization if performance/recovery goals emerge.';
        }

        // === SUPPLEMENTS ===
        let suppHtml = '<ul>';
        suppHtml += '<li><strong>Foundational Stack:</strong> Multivitamin, Vitamin D3/K2 (target 50-80ng/mL), Omega-3 (2g EPA/DHA), Magnesium Glycinate (400mg).</li>';

        if (medicalHx.includes('diabetes') || raw.includes('glucose')) {
            suppHtml += '<li><strong>Glycemic Support:</strong> Berberine 500mg TID or Alpha-lipoic acid 600mg daily. Chromium picolinate 200mcg. Monitor glucose closely.</li>';
        }

        if (state.vitals.hrv && state.vitals.hrv < 40) {
            suppHtml += '<li><strong>Autonomic Support:</strong> L-Theanine 200mg BID, Ashwagandha KSM-66 600mg, Rhodiola rosea 300mg AM.</li>';
        }

        if (medicalHx.includes('statin') || raw.includes('atorvastatin')) {
            suppHtml += '<li><strong>Statin Support:</strong> CoQ10 100-200mg daily (statins deplete CoQ10). Monitor for myalgia.</li>';
        }

        suppHtml += '</ul>';
        document.getElementById('soap-supplements').innerHTML = suppHtml;

        // === ADDITIONAL TESTING RECOMMENDATIONS ===
        let monitoringHtml = '<ul>';

        // Based on missing data
        if (dataGaps.length > 0) {
            monitoringHtml += '<li><strong>⚠️ Data Integrity:</strong> Missing critical information: ' + dataGaps.join(', ') + '. Complete baseline assessment before finalizing treatment plan.</li>';
        }

        // Cardiovascular risk
        if (medicalHx.includes('htn') || medicalHx.includes('diabetes') || familyHx.includes('heart')) {
            monitoringHtml += '<li><strong>Advanced Lipid Panel (NMR):</strong> LDL particle number/size, Lp(a), ApoB. Superior to standard lipid panel for CV risk stratification. CPT 83704.</li>';
            monitoringHtml += '<li><strong>Coronary Calcium Score (CAC):</strong> Non-invasive CT scan for atherosclerosis burden. Indicated if 10-yr ASCVD risk >5%. CPT 75571.</li>';
        }

        // Metabolic
        if (!raw.includes('hba1c') && (medicalHx.includes('prediabetes') || familyHx.includes('diabetes'))) {
            monitoringHtml += '<li><strong>HbA1c + Fasting Insulin:</strong> Assess glycemic control and insulin resistance. HOMA-IR calculation. CPT 83036, 83525.</li>';
        }

        // Inflammation
        if (!raw.includes('crp')) {
            monitoringHtml += '<li><strong>CRP-hs (High-Sensitivity):</strong> Systemic inflammation marker and CV risk predictor. Target <1mg/L. CPT 86141.</li>';
        }

        // Hormonal
        if (raw.includes('fatigue') || raw.includes('low energy')) {
            monitoringHtml += '<li><strong>Comprehensive Hormone Panel:</strong> TSH, Free T4, Free T3, TPO Ab, Total/Free Testosterone, DHEA-S, Cortisol (AM). Rule out endocrine causes.</li>';
        }

        // Micronutrients
        if (!raw.includes('vitamin d')) {
            monitoringHtml += '<li><strong>Vitamin D (25-OH):</strong> Deficiency common (50% population). Target 50-80ng/mL. Recheck q3mo until optimized. CPT 82306.</li>';
        }

        monitoringHtml += '<li><strong>Comprehensive Metabolic Panel (CMP):</strong> Baseline kidney/liver function, electrolytes. Annual monitoring. CPT 80053.</li>';

        // Advanced testing
        if (state.vitals.hrv && state.vitals.hrv < 30) {
            monitoringHtml += '<li><strong>Autonomic Function Testing:</strong> Formal HRV analysis, tilt table test if indicated. Rule out dysautonomia. CPT 95921-95924.</li>';
        }

        monitoringHtml += '<li><strong>DEXA Body Composition:</strong> Lean mass, fat %, visceral fat, bone density. Baseline + annual. Assess sarcopenia risk. CPT 77080.</li>';
        monitoringHtml += '</ul>';
        document.getElementById('soap-monitoring').innerHTML = monitoringHtml;

        // === PATIENT EDUCATION ===
        let educationHtml = '<ul>';
        educationHtml += '<li>Personalized lifestyle medicine approach based on your unique medical history and risk factors.</li>';
        educationHtml += '<li>Importance of consistent health metrics tracking (HRV, BP, glucose, weight) for data-driven optimization.</li>';

        if (medicalHx.includes('diabetes')) {
            educationHtml += '<li>Diabetes self-management: glucose monitoring, hypoglycemia recognition, sick day rules.</li>';
        }

        if (medicalHx.includes('hypertension')) {
            educationHtml += '<li>Home blood pressure monitoring technique, target ranges, medication compliance.</li>';
        }

        educationHtml += '<li>Evidence-based biohacking vs. pseudoscience: critical evaluation of health interventions.</li>';
        educationHtml += '<li>Shared decision-making for peptide/advanced protocols: risks, benefits, alternatives.</li>';
        educationHtml += '</ul>';
        document.getElementById('soap-education').innerHTML = educationHtml;
    }

    function performFunctionalSynthesis() {
        let analysis = `<h5>Functional Synthesis</h5>`;

        // --- 1. Autonomic & Circadian (Wearables) ---
        if (state.vitals.hrv < 30) {
            analysis += `<p>⚠️ <strong>Low HRV detected (${state.vitals.hrv}ms):</strong> May indicate high physiological stress, systemic inflammation, or poor recovery. Cross-reference with CRP-hs and Sleep data.</p>`;
        } else if (state.vitals.hrv > 70) {
            analysis += `<p>✨ <strong>HRV Optimal (${state.vitals.hrv}ms):</strong> High adaptive capacity noted.</p>`;
        }

        // --- 2. Glycemic & Metabolic (Blood Work Markers) ---
        // Simulated check for markers in raw text or labs state
        const raw = state.rawText.toLowerCase();
        if (raw.includes('hba1c') || raw.includes('hemoglobin a1c')) {
            analysis += `<p>🩸 <strong>Glycemic Control:</strong> HbA1c review recommended. <em>Rationale:</em> Chronic hyperglycemia (HbA1c > 5.7%) correlates with vascular damage. Justifies CPT 83036 for monitoring.</p>`;
        }

        if (raw.includes('crp') || raw.includes('c-reactive')) {
            analysis += `<p>🔥 <strong>Inflammatory Status:</strong> CRP-hs markers indicate systemic inflammation. High CRP + Low HRV suggests increased risk of CV event. <em>Justification:</em> Medical rationale for aggressive lifestyle/statin intervention.</p>`;
        }

        // --- 3. Medication Interaction ---
        const meds = state.entities.find(e => e.category === 'Medications Found')?.items || [];
        if (meds.some(m => /Beta|Atenolol|Metoprolol/i.test(m))) {
            analysis += `<p>💊 <strong>Medication Impact:</strong> Beta-blocker detected. Caution: This suppresses HR/HRV response. Autonomic data should be interpreted with medication-adjusted baseline.</p>`;
        }

        if (meds.some(m => /Statin|Atorvastatin|Lipitor|Rosuvastatin|Simvastatin/i.test(m))) {
            analysis += `<p>🛡️ <strong>Lipid Therapy:</strong> Statin use noted. Ensure CoQ10 levels and Liver enzymes (ALT/AST) are monitored annually. CoQ10 depletion is a common side effect.</p>`;
        }

        if (meds.some(m => /Warfarin|Eliquis|Xarelto|Clopidogrel|Aspirin/i.test(m))) {
             analysis += `<p>🩸 <strong>Anticoagulation:</strong> Patient is on blood thinners. Monitor for bleeding risks. Check INR/PT if on Warfarin. Caution with supplements that affect clotting (e.g., high dose Omega-3, Curcumin, Vitamin E).</p>`;
        }

        if (meds.some(m => /Lisinopril|Losartan|Valsartan/i.test(m))) {
             analysis += `<p>🫀 <strong>RAAS Inhibition:</strong> ACE-I/ARB detected. Monitor Potassium (K+) and Renal Function (Creatinine/eGFR). Essential for renal protection in diabetes.</p>`;
        }

        if (meds.some(m => /Hydrochlorothiazide|Furosemide/i.test(m))) {
             analysis += `<p>💧 <strong>Diuretic Therapy:</strong> Monitor electrolytes (Na+, K+, Mg2+) regularly. Risk of hypokalemia and dehydration.</p>`;
        }

        return analysis;
    }

    function generateRecommendations() {
        let html = '';
        const raw = state.rawText.toLowerCase();

        // 1. Diagnostic & Labs (Biller Focused)
        html += `<h5>I. Diagnostic Tests & Clinical Rationale</h5>`;
        if (state.vitals.hrv < 30) {
            html += `<div class="rec-card"><strong>Advanced Autonomic Study (CPT 95921):</strong> Rationale: Severe HRV depression suggests dysautonomia risk. Necessary for clinical differentiation.</div>`;
        }

        if (!raw.includes('dna')) {
            html += `<div class="rec-card"><strong>Pharmacogenomic DNA Panel:</strong> Justification: Optimize medication efficacy (CYP450) and minimize polypharmacy risks.</div>`;
        }

        if (!raw.includes('dexa')) {
            html += `<div class="rec-card"><strong>DEXA Body Scan (CPT 77080):</strong> Rationale: Assess sarcopenia and visceral fat as whole-body inflammation drivers.</div>`;
        }

        // 2. Lifestyle, Biohacks & Supplements (Research Based)
        html += `<h5 class="mt-1">II. Lifestyle, Biohacks & OTC Protocols</h5>`;
        if (state.vitals.hrv < 40) {
            html += `<div class="rec-card biohack"><strong>Biohack: Cold Thermogenesis/Breathwork:</strong> 3 min cold exposure + 5 min Box Breathing to upregulate Vagal Tone.</div>`;
            html += `<div class="rec-card supplement"><strong>Protocol: Magnesium Bisglycinate (400mg):</strong> High bioavailability for nervous system recovery and sleep.</div>`;
        }
        html += `<div class="rec-card exercise"><strong>Zone 2 Aerobic Training:</strong> 150 min/wk to improve mitochondrial density and VO2 max.</div>`;
        html += `<div class="rec-card sleep"><strong>Circadian Optimization:</strong> Blue-light blocking after sunset; 10 min morning sun exposure for cortisol regulation.</div>`;

        // 3. Physician-Only Grade Peptides (Clinical Only)
        html += `<h5 class="mt-1">III. Physician-Grade Peptide Protocols (Subject to MD Approval)</h5>`;
        if (raw.includes('fracture') || raw.includes('injury') || raw.includes('joint')) {
            html += `<div class="rec-card peptide"><strong>BPC-157 / TB-500:</strong> High-grade regenerative peptide protocol for soft tissue and gut health recovery.</div>`;
        }
        if (raw.includes('fatigue') || raw.includes('aging')) {
            html += `<div class="rec-card peptide"><strong>CJC-1295 / Ipamorelin:</strong> GH secretagogues suggested for cellular repair and metabolic enhancement.</div>`;
        }

        return html;
    }

    function updateDashboard() {
        extractedTextDiv.textContent = state.rawText || "No document loaded yet.";
    }

    // --- Existing Document Extraction Logic (Refactored) ---
    // --- Existing Document Extraction Logic (Refactored) ---
    async function extractTextFromPDF(file) {
        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded. Check internet connection.');
            }
            // FORCE DISABLE WORKER for file:// protocol to avoid CORS errors
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

            loadingTask.onProgress = function (progressData) {
                const percent = Math.round((progressData.loaded / progressData.total) * 100);
                statusText.textContent = `Loading PDF... ${percent}%`;
            };

            const pdf = await loadingTask.promise;
            let text = '';
            const totalPages = pdf.numPages;

            for (let i = 1; i <= totalPages; i++) {
                statusText.textContent = `Extracting text form page ${i} of ${totalPages}...`;
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                // Improved joining logic to prevent words mashing
                const pageText = content.items.map(item => item.str + (item.str.endsWith(' ') ? '' : ' ')).join('');
                text += `--- Page ${i} ---\n${pageText}\n`;
            }
            return text;
        } catch (error) {
            console.error('PDF Extraction Error:', error);
            throw new Error(`Failed to process PDF: ${error.message}`);
        }
    }

    async function extractTextFromWord(file) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        return res.value;
    }

    function performMedicalAnalysis(text) {
        const entities = [];
        // Expanded medication list (Top 30 prescribed + common)
        const medRegex = /\b(Aspirin|Metformin|Lisinopril|Atorvastatin|Amlodipine|Metoprolol|Albuterol|Omeprazole|Warfarin|Levothyroxine|Simvastatin|Losartan|Gabapentin|Hydrochlorothiazide|Sertraline|Furosemide|Pantoprazole|Prednisone|Ibuprofen|Tylenol|Eliquis|Xarelto|Insulin|Glipizide|Rosuvastatin|Clopidogrel|Montelukast|Escitalopram|Bupropion|Amphetamine)\b/gi;
        const meds = [...new Set(text.match(medRegex) || [])];
        if (meds.length) entities.push({ category: 'Medications Found', items: meds });

        // Expanded diagnosis list
        const dxRegex = /\b(Hypertension|Diabetes|Asthma|COPD|Arthritis|Anxiety|Depression|Obesity|Hypothyroidism|Hyperlipidemia|GERD|Sleep Apnea|Insomnia|Migraine|Back Pain|Osteoporosis|Kidney Disease|CKD|Heart Failure|CHF|Arrhythmia|Atrial Fibrillation|AFib|Stroke|TIA|Neuropathy|Dementia|Alzheimer|Cancer)\b/gi;
        const diagnoses = [...new Set(text.match(dxRegex) || [])];
        if (diagnoses.length) entities.push({ category: 'Symptoms Found', items: diagnoses });

        return entities;
    }

    function autoExtractCodes(text) {
        const icd10Regex = /[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?/g;
        const matches = text.match(icd10Regex) || [];
        return [...new Set(matches)].map(code => ({ code, desc: 'Extracted from document' }));
    }

    // --- Export Logic ---
    printBtn.addEventListener('click', () => window.print());

    downloadPdfBtn.addEventListener('click', () => {
        alert('PDF Export: Printing to PDF via browser print is recommended for highest clinical fidelity. Opening print dialog...');
        window.print();
    });
});
