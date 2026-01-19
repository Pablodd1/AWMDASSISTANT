# American Wellness MD Assistant

> **Advanced Medical Intelligence Platform** for comprehensive clinical documentation, analysis, and personalized health optimization.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🩺 Overview

The **American Wellness MD Assistant** is a sophisticated, client-side medical document analyzer and SOAP note generator designed for healthcare professionals. It combines document extraction, wearable data integration, and AI-powered clinical intelligence to create comprehensive, evidence-based patient reports.

### Key Features

- **📄 Multi-Format Document Processing**: PDF and DOCX extraction with automatic demographic parsing
- **🎤 Voice-to-Text HPI**: Dictate History of Present Illness using Web Speech API
- **📊 Wearable Integration**: Track HR, HRV, BP, and SpO2 for autonomic analysis
- **🧠 Clinical Intelligence Engine**: Generates personalized recommendations based on:
  - Medical history (HTN, diabetes, hyperlipidemia, etc.)
  - Family history (cardiac risk, genetic predispositions)
  - Social history (exercise, smoking, lifestyle)
  - Vitals and biomarkers
  - Missing data and red flags
- **💊 Comprehensive Recommendations**:
  - Evidence-based lifestyle modifications
  - Advanced biohacking protocols (cold exposure, HRV training, etc.)
  - Physician-grade peptide protocols (BPC-157, CJC-1295, TB-500)
  - Supplement stacks tailored to conditions
  - Additional testing recommendations with CPT codes
- **📋 Professional SOAP Notes**: Clinic-branded reports matching clinical documentation standards
- **💬 Med-Consult AI Chatbot**: Extensive medical knowledge base for clinical queries
- **📥 Export Options**: Word (.doc) and PDF formats

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Edge, Firefox)
- No server required for basic functionality (runs entirely client-side)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/american-wellness-md-assistant.git
   cd american-wellness-md-assistant
   ```

2. **Open the application**:
   - **Option 1 (Simple)**: Double-click `index.html` to open in your browser
   - **Option 2 (Recommended for PDF processing)**: Use a local server to avoid CORS issues
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve
     ```
     Then navigate to `http://localhost:8000`

3. **Start analyzing**:
   - Upload a patient document (PDF/DOCX)
   - Enter demographics and vitals
   - Generate comprehensive SOAP notes

## 📖 Usage Guide

### 1. Document Upload
- Drag and drop or click to upload patient documents
- Supports PDF and DOCX formats
- Automatic extraction of demographics, medications, and diagnoses

### 2. Dashboard Input
- **Patient Demographics**: Name, DOB, Age, Sex, Provider, Chart #
- **Chief Complaint & HPI**: Text input or voice dictation
- **Clinical History**: Medical, Surgical, Family, Social, Allergies
- **Vitals & Wearables**: HR, HRV, BP, SpO2

### 3. SOAP Note Generation
- Click "SOAP Note" tab to generate comprehensive report
- Includes all clinical sections matching professional standards
- Personalized recommendations based on patient profile

### 4. Med-Consult AI
- Click chat bubble to access medical knowledge base
- Ask about medications, lab values, procedures, billing codes
- Example queries: "What is HRV?", "Tell me about metformin", "BPC-157 protocol"

## 🧬 Clinical Intelligence

The system analyzes patient data to generate personalized recommendations:

### Lifestyle Modifications
- **Cardiovascular**: Zone 2 training, DASH diet for HTN
- **Metabolic**: Low-glycemic diet, intermittent fasting for diabetes
- **Lipid Management**: Omega-3, plant sterols, exercise protocols

### Advanced Biohacks
- **Autonomic Optimization**: Cold thermogenesis, HRV biofeedback
- **Anti-Inflammatory**: Curcumin, omega-3, fasting protocols
- **Sleep Enhancement**: Magnesium, circadian optimization
- **Mitochondrial Support**: CoQ10, NAD+ precursors, Zone 2 training

### Peptide Protocols
- **BPC-157**: Tissue repair, gut healing (250-500mcg SQ BID)
- **TB-500**: Injury recovery, anti-inflammatory (2-5mg SQ 2x/wk)
- **CJC-1295/Ipamorelin**: GH secretagogue for aging, fatigue (200-300mcg SQ)

### Additional Testing
- Advanced lipid panels (NMR, Lp(a), ApoB)
- Coronary calcium score (CAC)
- Hormone panels (thyroid, testosterone, cortisol)
- Micronutrients (Vitamin D, B12, etc.)
- DEXA body composition

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Document Processing**:
  - [PDF.js](https://mozilla.github.io/pdf.js/) - PDF text extraction
  - [Mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX parsing
  - [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR (included, not fully integrated)
- **Voice Input**: Web Speech API (browser-native)
- **Styling**: Custom minimalist CSS with professional medical theme

## 📁 Project Structure

```
american-wellness-md-assistant/
├── index.html          # Main application structure
├── styles.css          # Minimalist professional styling
├── app.js              # Core application logic
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## 🔒 Privacy & Security

- **100% Client-Side Processing**: All data remains on your device
- **HIPAA Considerations**: No data transmitted to external servers
- **Local Storage**: Session data not persisted (can be added)
- **Recommendation**: Deploy on secure, local network for clinical use

## 🐛 Known Limitations

1. **PDF Processing on `file://` Protocol**: Browser security restrictions may cause CORS errors. Use local server for optimal PDF processing.
2. **Voice Recognition**: Limited browser support (Chrome/Edge recommended)
3. **Medical Intelligence**: Rule-based recommendations, not AI/ML models
4. **Chatbot**: Pre-programmed knowledge base, not connected to live databases

## 🚧 Roadmap

- [ ] Persistent storage (localStorage/IndexedDB)
- [ ] Dynamic health maintenance schedule editor
- [ ] Full OCR integration for scanned documents
- [ ] Enhanced PDF export with proper formatting
- [ ] Integration with wearable APIs (Apple Health, Fitbit, etc.)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is intended for use by licensed healthcare professionals as a clinical documentation tool. It is not a substitute for professional medical judgment. All recommendations should be reviewed and validated by a qualified physician before implementation. The developers assume no liability for clinical decisions made using this software.

## 📧 Contact

For questions, issues, or collaboration opportunities, please open an issue on GitHub.

---

**Built with ❤️ for healthcare professionals seeking to optimize patient care through data-driven, personalized medicine.**
