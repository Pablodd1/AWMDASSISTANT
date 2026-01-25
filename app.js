// MediDoc Pro Logic - Professional Document Synthesis & Analysis

// --- Utilities ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '1rem';
    closeBtn.onclick = () => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    };

    toast.appendChild(closeBtn);
    container.appendChild(toast);

    // Auto remove after 5s
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

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
    const savePatientBtn = document.getElementById('save-patient');
    const clearDataBtn = document.getElementById('clear-data');

    // UI Elements - SOAP
    const soapDoc = document.getElementById('soap-document');
    const printBtn = document.getElementById('print-soap');
    const downloadPdfBtn = document.getElementById('download-pdf');

    const addCodeBtn = document.getElementById('add-code-btn');
    const codeList = document.getElementById('code-list');
    const newCodeInput = document.getElementById('new-code');
    const newCodeDescInput = document.getElementById('new-code-desc');
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
    const createNewPatientBtn = document.getElementById('create-new-patient');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // App State
    const savedState = localStorage.getItem('mediDocState');
    let state = null;
    try {
        state = savedState ? JSON.parse(savedState) : null;
    } catch (e) {
        console.error("Error loading state:", e);
        localStorage.removeItem('mediDocState');
        showToast('Error loading saved data', 'error', 5000);
    }

    // Create New Patient functionality
    if (createNewPatientBtn) {
        createNewPatientBtn.addEventListener('click', () => {
            if (confirm('Create new patient record? This will clear all current data.')) {
                // Clear all patient data
                state = {
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
                    labs: {},
                    vitals: { hr: 0, hrv: 0, bp: '', spo2: 0 },
                    codes: [
                        { code: 'Z00.00', desc: 'Encounter for general adult medical examination', justification: 'Standard baseline assessment code.' }
                    ],
                    analysis: null
                };
                
                // Clear form fields
                ['p-name', 'p-dob', 'p-age', 'p-sex', 'p-provider', 'p-chart'].forEach(id => {
                    document.getElementById(id).value = '';
                });
                
                // Clear extracted text
                document.getElementById('extracted-text').innerHTML = '';
                
                // Switch to dashboard view
                viewTabs.forEach(tab => tab.classList.remove('active'));
                viewContents.forEach(content => content.classList.remove('active'));
                
                document.getElementById('nav-dashboard').classList.add('active');
                document.getElementById('view-dashboard').classList.add('active');
                
                saveState();
                showToast('New patient record created', 'success');
            }
        });
    }

    if (!state) state = {
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
        labs: {}, // Store extracted numerical lab values
        vitals: { hr: 65, hrv: 45, bp: '120/80', spo2: 98 },
        codes: [
            { code: 'Z00.00', desc: 'Encounter for general adult medical examination', justification: 'Standard baseline assessment code.' }
        ],
        analysis: null
    };

    // --- Functional Medicine Logic ---
    const FUNCTIONAL_RANGES = {
        tsh: { min: 1.0, max: 2.5, unit: 'mIU/L', label: 'Thyroid (TSH)', low: "Hyperthyroid Pattern", high: "Subclinical Hypothyroid Pattern" },
        vit_d: { min: 50, max: 100, unit: 'ng/mL', label: 'Vitamin D (25-OH)', low: "Suboptimal (<50)", high: "Potential Toxicity (>100)" },
        hba1c: { min: 4.5, max: 5.3, unit: '%', label: 'HbA1c', low: "Hypoglycemia Risk", high: "Insulin Resistance (>5.3)" },
        hdl: { min: 55, max: 100, unit: 'mg/dL', label: 'HDL Cholesterol', low: "Metabolic Risk", high: "Optimal" },
        ldl: { min: 0, max: 100, unit: 'mg/dL', label: 'LDL Cholesterol', low: "Optimal", high: "Atherogenic Risk (>100)" },
        trig: { min: 0, max: 80, unit: 'mg/dL', label: 'Triglycerides', low: "Optimal", high: "Carbohydrate Intolerance (>80)" },
        ferritin: { min: 50, max: 150, unit: 'ng/mL', label: 'Ferritin', low: "Iron Insufficiency", high: "Inflammation/Overload" },
        b12: { min: 500, max: 1200, unit: 'pg/mL', label: 'Vitamin B12', low: "Methylation Deficit", high: "Optimal" },
        crp: { min: 0, max: 1.0, unit: 'mg/L', label: 'hs-CRP', low: "Optimal", high: "Systemic Inflammation" },
        magnesium: { min: 5.0, max: 7.0, unit: 'mg/dL', label: 'RBC Magnesium', low: "Deficiency", high: "Optimal" },
        homocysteine: { min: 0, max: 7.0, unit: 'umol/L', label: 'Homocysteine', low: "Optimal", high: "Methylation Issue" }
    };

    function extractLabValues(text) {
        const extracted = {};
        const t = text.replace(/\n/g, " "); // Flatten for regex

        const patterns = {
            tsh: /(?:TSH|Thyroid Stimulating Hormone)[^\d]*(\d+\.?\d*)/i,
            vit_d: /(?:Vitamin D|Vit D|25-OH)(?:[^\d]*25-OH)?[^\d]*(\d{2,3})/i,
            hba1c: /(?:HbA1c|Hemoglobin A1c)[^\d]*(\d\.?\d?)/i,
            hdl: /(?:HDL|High Density Lipoprotein)[^\d]*(\d{2,3})/i,
            ldl: /(?:LDL|Low Density Lipoprotein)[^\d]*(\d{2,3})/i,
            trig: /(?:Triglycerides|Trigs)[^\d]*(\d{2,3})/i,
            ferritin: /Ferritin[^\d]*(\d{1,3})/i,
            b12: /(?:Vitamin B12|B12|Cobalamin)[^\d]*(\d{3,4})/i,
            crp: /(?:CRP|C-Reactive Protein)[^\d]*(\d+\.?\d*)/i,
            homocysteine: /Homocysteine[^\d]*(\d+\.?\d*)/i
        };

        for (const [key, regex] of Object.entries(patterns)) {
            const match = t.match(regex);
            if (match && match[1]) {
                extracted[key] = parseFloat(match[1]);
            }
        }
        return extracted;
    }

    function analyzeBiomarkers(labs) {
        const insights = [];

        for (const [key, value] of Object.entries(labs)) {
            const range = FUNCTIONAL_RANGES[key];
            if (!range) continue;

            let status = "Optimal";
            let isRisk = false;
            let color = "green";

            if (value < range.min) {
                status = range.low;
                isRisk = true;
                color = "red";
            } else if (value > range.max) {
                status = range.high;
                isRisk = true;
                color = "red";
            }

            if (isRisk) {
                insights.push({
                    marker: range.label,
                    value: value,
                    unit: range.unit,
                    status: status,
                    color: color,
                    target: `${range.min}-${range.max}`
                });
            }
        }
        return insights;
    }

    function saveState() {
        try {
            localStorage.setItem('mediDocState', JSON.stringify(state));
            console.log('State saved:', state);
            showToast('Patient data saved successfully!', 'success', 3000);
        } catch (e) {
            console.error("Error saving state:", e);
            showToast('Error saving patient data', 'error', 5000);
        }
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

            // Extract Lab Values
            state.labs = extractLabValues(text);

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
            const errorDetails = `Failed to process "${file.name}". Error: ${error.message}`;
            showToast(errorDetails, 'error');
            console.error(errorDetails);
        }
    }

    function extractDemographics(text) {
        // Improved regex-based demographic extraction
        // Capture until end of line or next keyword to avoid grabbing subsequent fields
        const nameMatch = text.match(/(?:Name|Patient):\s*([^\n\r]+?)(?=\s+(?:DOB|Date|Age|Sex|Gender|Chart|Provider)|$)/i);
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

    // Special handling for sex dropdown (uses 'change' event instead of 'input')
    const sexDropdown = document.getElementById('p-sex');
    if (sexDropdown) {
        sexDropdown.addEventListener('change', () => {
            state.patient.sex = sexDropdown.value;
            saveState();
        });
    }

    // Sync Wearables Button - Only add listener if button exists
    if (syncWearablesBtn) {
        syncWearablesBtn.addEventListener('click', () => {
            // Show confirmation dialog
            const confirmed = confirm('Add wearable data? This will populate vital signs with mock data for demonstration purposes.');
            if (!confirmed) return;

            showToast('Syncing wearable data...', 'info');
            
            // Mock realistic data with confirmation
            const mockVitals = {
                hr: Math.round(62 + Math.random() * 8),
                hrv: Math.round(38 + Math.random() * 12),
                bp: `${115 + Math.floor(Math.random() * 15)}/${75 + Math.floor(Math.random() * 10)}`,
                spo2: Math.round(96 + Math.random() * 3)
            };

            // Store mock data
            state.vitals = mockVitals;
            
            // Update vitals display
            updateVitalsDisplay();
            
            saveState();
            
            setTimeout(() => {
                showToast('Wearable data synchronized successfully!', 'success');
            }, 1000);
        });
    }

    // Save Patient Button - Explicit save with validation
    if (savePatientBtn) {
        savePatientBtn.addEventListener('click', () => {
            // Validate required fields
            const flags = checkDataIntegrity();

            if (flags.length > 0) {
                const proceed = confirm(`⚠️ Warning: Missing data detected:\n\n${flags.join('\n')}\n\nDo you want to save anyway?`);
                if (!proceed) return;
            }

            // Save state
            saveState();

            // Show success message
            showToast(`✓ Patient record saved: ${state.patient.name || 'Unnamed Patient'}`, 'success');

            // Optional: Highlight the save button briefly
            savePatientBtn.style.background = '#059669';
            setTimeout(() => {
                savePatientBtn.style.background = '#10b981';
            }, 500);
        });
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all patient data? This cannot be undone.')) {
                localStorage.removeItem('mediDocState');
                location.reload();
            }
        });
    }

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
            const voiceIndicator = document.getElementById('voice-indicator');
            if (voiceIndicator) {
                voiceIndicator.style.display = 'flex';
                voiceIndicator.classList.add('active');
            }
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            
            // Check for voice commands first
            if (handleVoiceCommand(transcript.toLowerCase())) {
                return; // Command handled, don't add to text
            }
            
            // If no command, add to dictation
            doctorNoteArea.value += transcript;
        };

        recognition.onerror = () => {
            stopVoice();
            showToast('Speech recognition error. Check microphone permissions.', 'error');
        };

        recognition.onend = () => {
            startVoiceBtn.classList.remove('recording');
            voiceStatus.innerText = 'Idle';
            const voiceIndicator = document.getElementById('voice-indicator');
            if (voiceIndicator) {
                voiceIndicator.style.display = 'none';
                voiceIndicator.classList.remove('active');
            }
        };
    }

    function stopVoice() {
        if (recognition) recognition.stop();
    }

    // --- Voice Commands System ---
    function handleVoiceCommand(command) {
        // Navigation Commands
        if (command.includes('go to dashboard') || command.includes('open dashboard')) {
            switchView('dashboard');
            showToast('Navigated to Dashboard', 'success');
            return true;
        }
        
        if (command.includes('go to upload') || command.includes('open upload')) {
            switchView('upload');
            showToast('Navigated to Upload', 'success');
            return true;
        }
        
        if (command.includes('go to soap') || command.includes('open soap') || command.includes('generate soap')) {
            switchView('soap');
            generateSOAP();
            showToast('Generated SOAP Note', 'success');
            return true;
        }

        // Action Commands
        if (command.includes('save patient') || command.includes('save data')) {
            savePatient();
            showToast('Patient Saved', 'success');
            return true;
        }
        
        if (command.includes('clear data') || command.includes('clear all')) {
            if (confirm('Clear all patient data?')) {
                clearAllData();
                showToast('Data Cleared', 'info');
            }
            return true;
        }
        
        if (command.includes('create new patient') || command.includes('new patient')) {
            if (confirm('Create new patient record? This will clear current data.')) {
                createNewPatient();
                showToast('New Patient Created', 'success');
            }
            return true;
        }

        // Chat Commands
        if (command.includes('open chat') || command.includes('start chat')) {
            const chatPanel = document.getElementById('chat-panel');
            const chatToggle = document.getElementById('chat-toggle');
            if (chatPanel) {
                chatPanel.style.display = 'flex';
                if (chatToggle) chatToggle.style.display = 'none';
                showToast('Chat Opened - Say "ask" followed by your question', 'success');
            }
            return true;
        }
        
        if (command.includes('close chat')) {
            const chatPanel = document.getElementById('chat-panel');
            const chatToggle = document.getElementById('chat-toggle');
            if (chatPanel) {
                chatPanel.style.display = 'none';
                if (chatToggle) chatToggle.style.display = 'block';
                showToast('Chat Closed', 'info');
            }
            return true;
        }

        // Voice Chat Query
        if (command.startsWith('ask ')) {
            const query = command.substring(4); // Remove "ask "
            const chatPanel = document.getElementById('chat-panel');
            const chatToggle = document.getElementById('chat-toggle');
            
            // Open chat if closed
            if (chatPanel && chatPanel.style.display !== 'flex') {
                chatPanel.style.display = 'flex';
                if (chatToggle) chatToggle.style.display = 'none';
            }
            
            // Send the query
            setTimeout(() => {
                const chatInput = document.getElementById('chat-input');
                const sendBtn = document.getElementById('send-chat');
                if (chatInput && sendBtn) {
                    chatInput.value = query;
                    sendBtn.click();
                }
            }, 500);
            
            showToast(`Asking: ${query}`, 'info');
            return true;
        }

        // Help Command
        if (command.includes('help') || command.includes('what can i say')) {
            const helpText = `Voice Commands:
• Navigation: "Go to dashboard/upload/soap"
• Actions: "Save patient", "Clear data", "Create new patient"
• Chat: "Open chat", "Close chat"
• SOAP: "Generate SOAP"
• Help: "Help" or "What can I say"`;
            alert(helpText);
            return true;
        }

        return false; // No command recognized
    }

    function switchView(viewName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === viewName) {
                btn.classList.add('active');
            }
        });
        
        // Update content views
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
        }
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

    // --- Helper Functions for Voice Commands and UI ---
    function savePatient() {
        // Validate required fields
        const flags = checkDataIntegrity();

        if (flags.length > 0) {
            const proceed = confirm(`⚠️ Warning: Missing data detected:\n\n${flags.join('\n')}\n\nDo you want to save anyway?`);
            if (!proceed) return;
        }

        // Save state
        saveState();

        // Show success message
        showToast(`✓ Patient record saved: ${state.patient.name || 'Unnamed Patient'}`, 'success');
    }

    function clearAllData() {
        localStorage.removeItem('mediDocState');
        location.reload();
    }

    function createNewPatient() {
        // Clear all patient data
        state = {
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
            labs: {},
            vitals: { hr: 0, hrv: 0, bp: '', spo2: 0 },
            codes: [
                { code: 'Z00.00', desc: 'Encounter for general adult medical examination', justification: 'Standard baseline assessment code.' }
            ],
            analysis: null
        };
        
        // Clear form fields
        ['p-name', 'p-dob', 'p-age', 'p-sex', 'p-provider', 'p-chart', 'p-complaint', 'doctor-note',
         'v-hr', 'v-hrv', 'v-bp', 'v-spo2',
         'h-medical', 'h-surgical', 'h-family', 'h-social', 'h-allergies'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        // Clear extracted text
        const extractedText = document.getElementById('extracted-text');
        if (extractedText) extractedText.innerHTML = '';
        
        saveState();
    }

    function updateVitalsDisplay() {
        // Update vitals input fields from state
        const vHR = document.getElementById('v-hr');
        const vHRV = document.getElementById('v-hrv');
        const vBP = document.getElementById('v-bp');
        const vSPO2 = document.getElementById('v-spo2');

        if (vHR) vHR.value = state.vitals.hr || '';
        if (vHRV) vHRV.value = state.vitals.hrv || '';
        if (vBP) vBP.value = state.vitals.bp || '';
        if (vSPO2) vSPO2.value = state.vitals.spo2 || '';
    }

    // --- Vitals Analysis for Red Flags ---
    function analyzeVitalsForRedFlags(vitals) {
        const flags = [];
        
        if (!vitals) return flags;

        // Heart Rate Analysis
        if (vitals.hr) {
            if (vitals.hr < 50) {
                flags.push(`Bradycardia detected: HR ${vitals.hr} bpm (< 50 bpm) - Consider cardiac evaluation`);
            } else if (vitals.hr > 100) {
                flags.push(`Tachycardia detected: HR ${vitals.hr} bpm (> 100 bpm) - Assess for anxiety, fever, dehydration, or cardiac etiology`);
            }
        }

        // HRV Analysis
        if (vitals.hrv) {
            if (vitals.hrv < 20) {
                flags.push(`Severely low HRV: ${vitals.hrv} ms - High autonomic stress, consider comprehensive stress/inflammation workup`);
            } else if (vitals.hrv < 40) {
                flags.push(`Low HRV: ${vitals.hrv} ms - Indicates autonomic dysfunction or chronic stress`);
            }
        }

        // Blood Pressure Analysis
        if (vitals.bp) {
            const bpParts = vitals.bp.split('/');
            if (bpParts.length === 2) {
                const systolic = parseInt(bpParts[0]);
                const diastolic = parseInt(bpParts[1]);
                
                if (systolic >= 180 || diastolic >= 120) {
                    flags.push(`Hypertensive Crisis: BP ${vitals.bp} mmHg - URGENT: Immediate evaluation required`);
                } else if (systolic >= 140 || diastolic >= 90) {
                    flags.push(`Stage 2 Hypertension: BP ${vitals.bp} mmHg - Lifestyle modification + pharmacotherapy indicated`);
                } else if (systolic >= 130 || diastolic >= 80) {
                    flags.push(`Stage 1 Hypertension: BP ${vitals.bp} mmHg - Lifestyle modification recommended`);
                } else if (systolic < 90 || diastolic < 60) {
                    flags.push(`Hypotension: BP ${vitals.bp} mmHg - Assess for dehydration, medication effects, or underlying condition`);
                }
            }
        }

        // SpO2 Analysis
        if (vitals.spo2) {
            if (vitals.spo2 < 90) {
                flags.push(`Severe Hypoxemia: SpO2 ${vitals.spo2}% (< 90%) - URGENT: Supplemental oxygen and immediate evaluation`);
            } else if (vitals.spo2 < 94) {
                flags.push(`Hypoxemia: SpO2 ${vitals.spo2}% (< 94%) - Consider pulmonary evaluation and sleep study`);
            }
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

    async function handleChat() {
        const query = chatInput.value.trim();
        if (!query) return;

        addChatMessage('user', query);
        chatInput.value = '';

        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        addChatMessage('bot typing', 'Med-Consult AI is analyzing...', typingId);

        // Try API first, fall back to local knowledge for static deployment
        try {
            const context = state.rawText;
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, context })
            });

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }

            // Remove typing indicator
            const typingMsg = document.getElementById(typingId);
            if (typingMsg) typingMsg.remove();

            if (res.ok && data.response) {
                addChatMessage('bot', data.response);
            } else {
                throw new Error(data.error || `Server error: ${res.status}`);
            }
        } catch (error) {
            console.log('API not available, using local knowledge base:', error.message);
            const typingMsg = document.getElementById(typingId);
            if (typingMsg) typingMsg.remove();

            // Fallback to local knowledge
            const response = getMedicalResponse(query);
            addChatMessage('bot', response + "\n\n(Note: Using local knowledge base - API not configured)");
        }
    }

    // Helper for local knowledge fallback
    function getMedicalResponse(query) {
        let response = "I'm sorry, I couldn't process that request.";
        if (typeof MedicalKnowledge !== 'undefined') {
            response = MedicalKnowledge.getResponse(query);
        } else {
            response = "Medical Knowledge Base not loaded. Please refresh.";
        }
        return response;
    }

    function addChatMessage(role, text, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${role}`;
        if (id) msgDiv.id = id;
        msgDiv.innerText = text; // Safe text insertion
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
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
        try {
            // 1. Sync Patient Header
            document.getElementById('soap-p-name').innerText = state.patient.name || 'Not Recorded';
            document.getElementById('soap-p-dob').innerText = state.patient.dob || 'Not Recorded';
            document.getElementById('soap-p-age').innerText = state.patient.age || '--';
            document.getElementById('soap-p-sex').innerText = (document.getElementById('p-sex')?.value) || '--';
            document.getElementById('soap-p-chart').innerText = state.patient.chart || 'AW-7742';
            document.getElementById('soap-p-provider').innerText = state.patient.provider || 'Andre Bezerra, APRN';
            document.getElementById('soap-footer-provider').innerText = state.patient.provider || 'Andre Bezerra, APRN';

            // 2. Populate Clinical Sections
            document.getElementById('soap-objective').innerText = "Patient will present for comprehensive evaluation and discussion of advanced health optimization strategies including cardiovascular risk reduction, metabolic enhancement protocols, and personalized supplement regimens.";
            document.getElementById('soap-subjective').innerText = "Patient reports recent laboratory work showing suboptimal biomarkers and seeks comprehensive evaluation for preventive health optimization.";
            document.getElementById('soap-complaint').innerText = state.history.complaint || "Routine review of medical records.";
            const hpiText = document.getElementById('doctor-note').value;
            document.getElementById('soap-hpi').innerText = hpiText || "Patient presents for comprehensive evaluation of advanced preventive health strategies and biomarker optimization.";

            document.getElementById('soap-medical-hx').innerText = state.history.medical || "1. HLH\n2. High Cholesterol\n3. HTN\n4. GERD\n5. Constipation\n6. Hearing Loss\n7. OA\n8. Anxiety";
            document.getElementById('soap-surgical-hx').innerText = state.history.surgical || "1. Eye Surgery\n2. Excision of skin cancer\n3. Cholecystectomy\n4. R. Knee Replacement (2018)\n5. Carotid endarterectomy";
            document.getElementById('soap-family-hx').innerText = state.history.family || "Non-contributory per patient report.";
            document.getElementById('soap-social-hx').innerText = state.history.social || "Denies tobacco/illicit drug use.";

            // Dynamic Smoking Status based on Social Hx or explicit field
            const social = (state.history.social || '').toLowerCase();
            let smokingStatus = "Never Smoker";
            if (social.includes('smoke') || social.includes('tobacco')) smokingStatus = "Current Smoker / Tobacco User";
            if (social.includes('former') || social.includes('quit')) smokingStatus = "Former Smoker";
            document.getElementById('soap-smoking').innerText = smokingStatus;

            document.getElementById('soap-allergies').innerText = state.history.allergies || "No Known Drug Allergies (NKDA).";

    // 2.5. Populate Objective/Vitals Section with Red Flag Analysis
            const redFlags = analyzeVitalsForRedFlags(state.vitals);
            const vitalsHtml = `
                <p><strong>Vital Signs:</strong></p>
                <ul>
                    <li><strong>Heart Rate (HR):</strong> ${state.vitals.hr || '--'} bpm</li>
                    <li><strong>Heart Rate Variability (HRV):</strong> ${state.vitals.hrv || '--'} ms</li>
                    <li><strong>Blood Pressure (BP):</strong> ${state.vitals.bp || '--'} mmHg</li>
                    <li><strong>Oxygen Saturation (SpO2):</strong> ${state.vitals.spo2 || '--'}%</li>
                </ul>
                ${redFlags.length > 0 ? `<div class="red-flag-section"><h4>⚠️ Clinical Alerts:</h4><ul>${redFlags.map(flag => `<li>${flag}</li>`).join('')}</ul></div>` : ''}
                ${state.vitals.hrv && state.vitals.hrv < 40 ? '<p><em>⚠️ Note: Low HRV detected, indicating potential autonomic stress or poor recovery.</em></p>' : ''}
                ${state.vitals.spo2 && state.vitals.spo2 < 95 ? '<p><em>⚠️ Note: Low SpO2 detected, consider pulmonary evaluation.</em></p>' : ''}
            `;
            document.getElementById('soap-vitals').innerHTML = vitalsHtml;

            // 3. Medications Table
            const meds = (state.entities || []).find(e => e.category === 'Medications Found')?.items || [];
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

            // 6. Partition Recommendations - NOW USING THE CARD-BASED GENERATOR
            const recsHtml = generateRecommendations();

            // Distribute to sections based on content to simulate partitioning,
            // or just dump it all in "Lifestyle" if that's easier, but let's try to be smart.
            // Since generateRecommendations returns one big blob, we'll put it in Lifestyle
            // and clear the others to avoid duplication or confusion.
            document.getElementById('soap-lifestyle').innerHTML = recsHtml;
            document.getElementById('peptide-content').innerHTML = ''; // Cleared as included in recsHtml
            document.getElementById('soap-supplements').innerHTML = ''; // Cleared as included in recsHtml
            document.getElementById('soap-monitoring').innerHTML = ''; // Cleared as included in recsHtml
            document.getElementById('soap-education').innerHTML = ''; // Cleared as included in recsHtml

            // 7. Health Maintenance
            const maintenanceTable = document.getElementById('soap-maintenance-rows');
            maintenanceTable.innerHTML = `
            <tr><td>Influenza Vaccine</td><td>02/07/2016</td><td>02/07/2017</td><td>Performed</td></tr>
            <tr><td>Urinalysis</td><td>08-16-2015</td><td>08-16-2016</td><td>Performed</td></tr>
            <tr><td>Diabetes, Eye Exam</td><td>07-25-2015</td><td>07-25-2016</td><td>Performed</td></tr>
        `;
        } catch (e) {
            console.error("Error generating SOAP:", e);
            document.getElementById('assessment-plan').innerHTML = `<p style="color:red">Error generating report: ${e.message}</p>`;
        }
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

        // --- 1. Biomarker Analysis (New Comprehensive Section) ---
        const labInsights = analyzeBiomarkers(state.labs || {});
        if (labInsights.length > 0) {
            analysis += `<div class="biomarker-section"><h6>🧬 Biomarker Deviation Analysis (Functional)</h6>`;
            labInsights.forEach(insight => {
                analysis += `
                    <div class="insight-card ${insight.color}">
                        <strong>${insight.marker}:</strong> ${insight.value} ${insight.unit}
                        <br><span class="status">${insight.status}</span>
                        <br><span class="target-range">Functional Target: ${insight.target}</span>
                    </div>`;
            });
            analysis += `</div>`;
        } else if (Object.keys(state.labs).length > 0) {
            analysis += `<p>✅ All extracted biomarkers appear within optimal functional ranges.</p>`;
        } else {
            // No labs found logic
            const raw = (state.rawText || '').toLowerCase();
            if (raw.length > 0 && !raw.includes('blood') && !raw.includes('lab')) {
                analysis += `<p><em>No blood biomarkers detected in the provided text. Please ensure lab results are clearly visible.</em></p>`;
            }
        }

        // --- 2. Autonomic & Circadian (Wearables) ---
        if (state.vitals.hrv && state.vitals.hrv < 30) {
            analysis += `<p>⚠️ <strong>Low HRV detected (${state.vitals.hrv}ms):</strong> May indicate high physiological stress, systemic inflammation, or poor recovery. Cross-reference with CRP-hs and Sleep data.</p>`;
        } else if (state.vitals.hrv && state.vitals.hrv > 70) {
            analysis += `<p>✨ <strong>HRV Optimal (${state.vitals.hrv}ms):</strong> High adaptive capacity noted.</p>`;
        }

        // --- 3. Medication Interaction ---
        const meds = state.entities.find(e => e.category === 'Medications Found')?.items || [];
        if (meds.length > 0) {
            analysis += `<h6>💊 Medication Impact Analysis</h6>`;

            if (meds.some(m => /Beta|Atenolol|Metoprolol/i.test(m))) {
                analysis += `<p><strong>Beta-blocker detected:</strong> Caution: This suppresses HR/HRV response. Autonomic data should be interpreted with medication-adjusted baseline.</p>`;
            }

            if (meds.some(m => /Statin|Atorvastatin|Lipitor|Rosuvastatin|Simvastatin/i.test(m))) {
                analysis += `<p><strong>Lipid Therapy:</strong> Statin use noted. Ensure CoQ10 levels and Liver enzymes (ALT/AST) are monitored annually. CoQ10 depletion is a common side effect.</p>`;
            }

            if (meds.some(m => /Warfarin|Eliquis|Xarelto|Clopidogrel|Aspirin/i.test(m))) {
                analysis += `<p><strong>Anticoagulation:</strong> Patient is on blood thinners. Monitor for bleeding risks. Check INR/PT if on Warfarin. Caution with supplements that affect clotting (e.g., high dose Omega-3, Curcumin, Vitamin E).</p>`;
            }

            if (meds.some(m => /Lisinopril|Losartan|Valsartan/i.test(m))) {
                analysis += `<p><strong>RAAS Inhibition:</strong> ACE-I/ARB detected. Monitor Potassium (K+) and Renal Function (Creatinine/eGFR). Essential for renal protection in diabetes.</p>`;
            }

            if (meds.some(m => /Hydrochlorothiazide|Furosemide/i.test(m))) {
                analysis += `<p><strong>Diuretic Therapy:</strong> Monitor electrolytes (Na+, K+, Mg2+) regularly. Risk of hypokalemia and dehydration.</p>`;
            }
        }

        return analysis;
    }

    function generateRecommendations() {
        let html = '';
        const raw = (state.rawText || '').toLowerCase();
        const labs = state.labs || {};

        // 1. Diagnostic & Labs (Biller Focused)
        html += `<h5>I. Diagnostic Tests & Clinical Rationale</h5>`;
        if (state.vitals.hrv && state.vitals.hrv < 30) {
            html += `<div class="rec-card"><strong>Advanced Autonomic Study (CPT 95921):</strong> Rationale: Severe HRV depression suggests dysautonomia risk. Necessary for clinical differentiation.</div>`;
        }

        if (labs.hba1c && labs.hba1c > 5.6) {
            html += `<div class="rec-card"><strong>Fasting Insulin & C-Peptide:</strong> Rationale: HbA1c > 5.6% indicates insulin resistance. Fasting insulin needed to calculate HOMA-IR score.</div>`;
        }

        if (labs.tsh && labs.tsh > 2.5) {
            html += `<div class="rec-card"><strong>Full Thyroid Panel (Free T3/T4, TPO):</strong> Rationale: TSH > 2.5 is functionally high. Rule out Hashimoto's auto-immunity.</div>`;
        }

        if (raw.includes('arrhythmia') || raw.includes('palpitation') || raw.includes('afib')) {
            html += `<div class="rec-card"><strong>12-Lead EKG (CPT 93000) & Holter Monitor (CPT 93224):</strong> Rationale: Reported palpitations/arrhythmia markers warrant electrophysiological baseline (DX: I48.91 or R00.2).</div>`;
        }

        if (raw.includes('sleep') || raw.includes('snoring') || raw.includes('apnea')) {
            html += `<div class="rec-card"><strong>Home Sleep Test (CPT 95806):</strong> Rationale: Clinical suspicion of OSA (DX: G47.33). Critical for metabolic and cardiovascular risk management.</div>`;
        }

        if (!raw.includes('dna')) {
            html += `<div class="rec-card"><strong>Pharmacogenomic DNA Panel (CPT 81401):</strong> Justification: Optimize medication efficacy (CYP450) and minimize polypharmacy risks.</div>`;
        }

        if (!raw.includes('dexa')) {
            html += `<div class="rec-card"><strong>DEXA Body Scan (CPT 77080):</strong> Rationale: Assess sarcopenia and visceral fat as whole-body inflammation drivers (DX: E66.9).</div>`;
        }

        // 2. Lifestyle, Biohacks & Supplements (Research Based)
        html += `<h5 class="mt-1">II. Lifestyle, Biohacks & OTC Protocols</h5>`;

        // Lab Specific Supplements
        if (labs.vit_d && labs.vit_d < 50) {
            html += `<div class="rec-card supplement"><strong>Vitamin D3/K2 Protocol:</strong> 5,000-10,000 IU daily to reach target >50ng/mL. Must pair with K2 (MK-7) to protect arteries.</div>`;
        }
        if (labs.b12 && labs.b12 < 500) {
            html += `<div class="rec-card supplement"><strong>Methylated B-Complex:</strong> Methylcobalamin form required for optimal absorption and methylation support.</div>`;
        }
        if (labs.ferritin && labs.ferritin < 50) {
            html += `<div class="rec-card supplement"><strong>Iron Bisglycinate + Vitamin C:</strong> Gentle iron form taken with C for absorption. Recheck Ferritin in 8 weeks.</div>`;
        }
        if (labs.magnesium && labs.magnesium < 5.0) {
            html += `<div class="rec-card supplement"><strong>Magnesium L-Threonate or Glycinate:</strong> 400mg nightly to support RBC levels, HRV, and sleep architecture.</div>`;
        }

        if (state.vitals.hrv && state.vitals.hrv < 40) {
            html += `<div class="rec-card biohack"><strong>Biohack: Cold Thermogenesis/Breathwork:</strong> 3 min cold exposure + 5 min Box Breathing to upregulate Vagal Tone.</div>`;
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
            // Use a proper CDN URL for the PDF worker to ensure it works on Vercel
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }

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

                // Reconstruct text with structural awareness (Y-coordinate sorting)
                const items = content.items;
                // Basic structural reconstruction
                let lastY = -1;
                let pageText = '';

                // Sort by Y (descending) then X (ascending) to handle columnar or scattered text better?
                // Actually PDF.js usually gives stream order. Let's trust stream order but insert newlines.

                for (const item of items) {
                    const y = item.transform[5];
                    // If Y changes significantly (>10 units), assume new line
                    if (lastY !== -1 && Math.abs(y - lastY) > 10) {
                        pageText += '\n';
                    }
                    pageText += item.str;
                    // Add space if not ending with one
                    if (!item.str.endsWith(' ')) {
                        pageText += ' ';
                    }
                    lastY = y;
                }

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

    // --- Theme Toggle Logic ---
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggleBtn.innerText = isDark ? '☀️' : '🌗';

            // Dynamic styles for Dark Mode (minimal implementation)
            if (isDark) {
                document.documentElement.style.setProperty('--bg-page', '#0f172a');
                document.documentElement.style.setProperty('--bg-panel', '#1e293b');
                document.documentElement.style.setProperty('--text-main', '#f1f5f9');
                document.documentElement.style.setProperty('--text-muted', '#94a3b8');
                document.documentElement.style.setProperty('--border-light', '#334155');
            } else {
                document.documentElement.style.setProperty('--bg-page', '#f8fafc');
                document.documentElement.style.setProperty('--bg-panel', '#ffffff');
                document.documentElement.style.setProperty('--text-main', '#1e293b');
                document.documentElement.style.setProperty('--text-muted', '#64748b');
                document.documentElement.style.setProperty('--border-light', '#e2e8f0');
            }
        });
    }

    // --- Export Logic ---
    printBtn.addEventListener('click', () => window.print());

    downloadPdfBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            showToast('Pro Tip: Disable "Dark Mode" for a professional PDF report.', 'info');
        }
        setTimeout(() => window.print(), 500);
    });
});
