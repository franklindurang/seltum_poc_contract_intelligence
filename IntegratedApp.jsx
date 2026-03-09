import React, { useState, useRef, useEffect } from 'react';

const Spinner = () => (
    <svg className="animate-spin h-8 w-8 text-[var(--indigo-500)] self-center" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

export default function IntegratedApp() {
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [contractData, setContractData] = useState(null);
    const [error, setError] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('All');

    // Database and Navigation States
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'database'
    const [dbContracts, setDbContracts] = useState([]);
    const [selectedDbContract, setSelectedDbContract] = useState(null);

    const fileInputRef = useRef(null);
    const iframeRef = useRef(null);

    // Setup pdfjs-dist
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        return () => {
            document.body.removeChild(script);
        }
    }, [])

    const replaceNullWithEmptyString = (obj) => {
        if (obj === null) return "";
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(replaceNullWithEmptyString);
        const result = {};
        for (const key in obj) {
            result[key] = replaceNullWithEmptyString(obj[key]);
        }
        return result;
    };

    const handleFieldChange = (category, section, field, newValue) => {
        setContractData(prev => {
            const newData = { ...prev };
            if (section) {
                if (!newData[category]) newData[category] = {};
                if (!newData[category][section]) newData[category][section] = {};
                if (!newData[category][section][field]) newData[category][section][field] = { source_snippet: "" };

                // Deep copy to ensure React registers change
                newData[category][section] = {
                    ...newData[category][section],
                    [field]: {
                        ...newData[category][section][field],
                        value: newValue
                    }
                };
            } else {
                if (!newData[category]) newData[category] = {};
                if (!newData[category][field]) newData[category][field] = { source_snippet: "" };

                newData[category] = {
                    ...newData[category],
                    [field]: {
                        ...newData[category][field],
                        value: newValue
                    }
                };
            }
            return newData;
        });
    };

    const saveContract = () => {
        if (!contractData) return;

        const contractId = 'SEL-' + Math.floor(1000 + Math.random() * 9000); // Mock ID
        const date = new Date().toLocaleDateString();
        const type = contractData?.contract_master_data?.contract_type?.value || 'Unknown Text';

        const newContractRecord = {
            id: contractId,
            date: date,
            type: type,
            // Normally deriving name from customer fields, but using type as fallback
            name: type + ' Agreement',
            data: contractData,
            pdfUrl: pdfUrl
        };

        setDbContracts(prev => [newContractRecord, ...prev]);
        alert(`Contract Saved Successfully! ID: ${contractId}`);
    };

    const loadContractFromDb = (contract) => {
        setContractData(contract.data);
        setPdfUrl(contract.pdfUrl);
        // Do not update pdfFile here since we mock it with url
        setActiveView('dashboard');
        setIsUploadModalOpen(false);
    };

    const clearFile = () => {
        setPdfFile(null);
        setPdfUrl(null);
        setContractData(null);
    };

    const extractTextFromPdfBuffer = async (arrayBuffer) => {
        if (!window.pdfjsLib) throw new Error("PDF.js library not loaded yet.");

        const data = new Uint8Array(arrayBuffer);
        const loadingTask = window.pdfjsLib.getDocument({ data });
        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        const pagesText = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageString = textContent.items.map(item => item.str).join(' ');
            pagesText.push(pageString);
        }

        const rawText = pagesText.join('\n');
        return rawText.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
    };

    const callGeminiWithBackoff = async (contractText, maxRetries = 3) => {
        const systemPrompt = `You are an expert contract data extraction system.
Extract the structured data from the provided contract text.

You MUST strictly return JSON that matches this schema exactly:
{
  "contract_type": { "value": "MSA|RFS_SGHA|BROKER_CARRIER", "source_snippet": "exact string found in pdf" },
  "legal_entity_names": { "value": "string", "source_snippet": "exact string found in pdf" },
  "registered_addresses": { "value": "string", "source_snippet": "exact string found in pdf" },
  "jurisdiction": { "value": "string governing law state", "source_snippet": "exact string found in pdf" },
  "performance_standards": { "value": "string", "source_snippet": "exact string found in pdf" },
  "confidentiality_sunset_period_years": { "value": "number", "source_snippet": "exact string found in pdf" },
  "intellectual_property_ownership": { "value": "string", "source_snippet": "exact string found in pdf" },
  "force_majeure_events": { "value": ["string list of events"], "source_snippet": "exact string found in pdf" },
  "notice_period_days": { "value": "number", "source_snippet": "exact string found in pdf" },
  "term_effective_date": { "value": "ISO-date", "source_snippet": "exact string found in pdf" },
  "term_termination_date": { "value": "ISO-date", "source_snippet": "exact string found in pdf" },
  "auto_renewal_window_days": { "value": "number", "source_snippet": "exact string found in pdf" },
  "liability_cap_per_incident": { "value": "number", "source_snippet": "exact string found in pdf" },
  "liability_limit_per_lb": { "value": "number", "source_snippet": "exact string found in pdf" },
  "cargo_insurance_limit": { "value": "number", "source_snippet": "exact string found in pdf" },
  "auto_liability_limit": { "value": "number", "source_snippet": "exact string found in pdf" },
  "general_liability_limit": { "value": "number", "source_snippet": "exact string found in pdf" },
  "mc_dot_number": { "value": "string", "source_snippet": "exact string found in pdf" },
  "tsa_iac_cert": { "value": "string (format XX-0000)", "source_snippet": "exact string found in pdf" },
  "fmcsa_safety_rating_requirement": { "value": "string", "source_snippet": "exact string found in pdf" },
  "cbp_bond_value": { "value": "number", "source_snippet": "exact string found in pdf" },
  "airport_codes": { "value": ["string IATA format"], "source_snippet": "exact string found in pdf" },
  "non_circumvention_prohibition_period_months": { "value": "number", "source_snippet": "exact string found in pdf" },
  "non_circumvention_liquidated_damages": { "value": "number", "source_snippet": "exact string found in pdf" },
  "pricing_model_type": { "value": "Flat-Rate|Tiered Volume|Hybrid|Cost-Plus|Value-Based", "source_snippet": "exact string found in pdf" },
  "escalation_trigger_threshold_percentage": { "value": "number", "source_snippet": "exact string found in pdf" },
  "escalation_index": { "value": "EIA|PPI|CPI|Other", "source_snippet": "exact string found in pdf" },
  "liftgate_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "roller_bed_surcharge": { "value": "number", "source_snippet": "exact string found in pdf" },
  "pallet_jack_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "tarping_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "detention_free_time_hours": { "value": "number", "source_snippet": "exact string found in pdf" },
  "detention_hourly_rate": { "value": "number", "source_snippet": "exact string found in pdf" },
  "layover_daily_rate": { "value": "number", "source_snippet": "exact string found in pdf" },
  "tonu_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "after_hours_weekend_delivery_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "limited_access_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "residential_delivery_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "inside_delivery_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "sort_and_seg_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "hazmat_handling_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "customs_exam_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "reweigh_and_reclassification_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "security_escort_fee": { "value": "number", "source_snippet": "exact string found in pdf" },
  "status_of_parties": { "value": "Independent Contractor|Agent|Employee", "source_snippet": "exact string found in pdf" },
  "freight_volume_requirements_minimum": { "value": "number", "source_snippet": "exact string found in pdf" },
  "receipts_and_bills_of_lading_pod_responsibility": { "value": "string", "source_snippet": "exact string found in pdf" },
  "payment_net_days": { "value": "number", "source_snippet": "exact string found in pdf" },
  "equipment_warranty_condition": { "value": "string", "source_snippet": "exact string found in pdf" },
  "carb_compliance_tru_registration": { "value": "string", "source_snippet": "exact string found in pdf" }
}

CRITICAL RULES:
1. The "source_snippet" MUST be exact quotes from the text. This is critical for our "Hover-to-Highlight" feature.
2. If any value cannot be found in the contract text, you MUST return an empty string "" for its value field, rather than omitting the field from the JSON or returning null. Every field listed in the schema MUST be present in the final output. If the field is an array, return an empty array [].
3. For "contract_type", make a best classification attempt between MSA, RFS_SGHA, or BROKER_CARRIER.
4. "mc_dot_number" is usually prefixed by MC.
5. "tsa_iac_cert" has format XX-0000.
6. Your entire response must be valid JSON matching the schema exactly, with no additional commentary.

Contract Text to Analyze:
"""
${contractText}
"""`;

        let attempt = 0;
        const delays = [1000, 2000, 4000];

        while (attempt <= maxRetries) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }],
                        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
                    })
                });

                if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
                const data = await response.json();

                if (!data.candidates || !data.candidates[0].content) {
                    throw new Error("Invalid API response format received");
                }

                const outputText = data.candidates[0].content.parts[0].text;
                return replaceNullWithEmptyString(JSON.parse(outputText));

            } catch (err) {
                if (attempt >= maxRetries) throw err;
                const delayMs = delays[attempt] || 4000;
                await new Promise(resolve => setTimeout(resolve, delayMs));
                attempt++;
            }
        }
    };

    const handleFileProcess = async (file) => {
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            const url = URL.createObjectURL(file);
            setPdfUrl(url);
            setIsAnalyzing(true);
            setError(null);
            setContractData(null);
            setIsUploadModalOpen(false);

            try {
                const arrayBuffer = await file.arrayBuffer();
                const text = await extractTextFromPdfBuffer(arrayBuffer);
                const extractedData = await callGeminiWithBackoff(text);
                setContractData(extractedData);
            } catch (err) {
                console.error("Pipeline error:", err);
                setError(err.message || "An error occurred during analysis.");
            } finally {
                setIsAnalyzing(false);
            }
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileProcess(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleHoverHighlight = (sourceSnippet) => {
        if (!sourceSnippet) return;
        try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.find(sourceSnippet, false, false, true);
            }
        } catch (err) {
            console.log("Source snippet associated:", sourceSnippet);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: pdfUrl ? 'var(--slate-900)' : 'var(--app-bg)' }}>

            {/* GLOBAL FAR-LEFT NAVIGATION */}
            <nav className="global-nav">
                <button
                    className={`global-nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveView('dashboard')}
                    title="Dashboard"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                        <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                        <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                        <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                    </svg>
                    <span>Dash</span>
                </button>
                <button
                    className={`global-nav-btn ${activeView === 'database' ? 'active' : ''}`}
                    onClick={() => setActiveView('database')}
                    title="Contract Database"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                    </svg>
                    <span>DB</span>
                </button>
            </nav>

            <div className="main-content-wrapper flex-1">
                {/* GLOBAL TOP HEADER */}
                <header className="app-top-header justify-between">
                    <h1 className="brand">
                        CONTRACT INTELLIGENCE <span className="brand-sub">BY SELTUM</span>
                    </h1>

                    {pdfUrl && (
                        <button
                            className="upload-btn-modal"
                            style={{ width: 'auto', padding: '10px 24px', fontSize: '0.9rem', margin: 0 }}
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            Upload New Contract
                        </button>
                    )}
                </header>

                {/* MAIN DYNAMIC CONTENT */}
                <div className="flex-1 relative overflow-hidden">
                    {(!pdfUrl || isUploadModalOpen) && (
                        <div
                            className="upload-modal-wrapper"
                            style={{
                                position: 'absolute',
                                zIndex: 50,
                                backgroundColor: pdfUrl ? 'rgba(13, 17, 26, 0.85)' : 'var(--app-bg)',
                                backdropFilter: pdfUrl ? 'blur(4px)' : 'none'
                            }}
                        >
                            <div className="upload-card-modal relative">
                                {pdfUrl && (
                                    <button
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="absolute top-4 right-4 text-[#94a3b8] hover:text-white transition-colors"
                                        aria-label="Close Modal"
                                    >
                                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}

                                <div className="upload-modal-header">
                                    <h2>Ready to analyze?</h2>
                                    <p>Upload your contract below.</p>
                                </div>

                                <div
                                    className={`drop-zone-modal ${isDragging ? 'dragging' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <svg className="file-outline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                    </svg>

                                    <p className="drop-text">Drag & Drop your contract here,<br />or click to browse.</p>

                                    <div className="file-badges">
                                        <div className="badge badge-pdf">.pdf</div>
                                        <div className="badge badge-doc">.doc</div>
                                        <div className="badge badge-docx">.docx</div>
                                    </div>
                                </div>

                                <input
                                    type="file"
                                    accept="application/pdf"
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileProcess(e.target.files[0])}
                                />

                                <button
                                    className="upload-btn-modal"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {pdfUrl ? 'Upload Different Contract' : 'Upload New Contract'}
                                </button>

                                {pdfUrl && (
                                    <button
                                        className="upload-btn-modal"
                                        style={{ marginTop: '12px', backgroundColor: '#334155', color: 'white' }}
                                        onClick={() => { clearFile(); setIsUploadModalOpen(false); }}
                                    >
                                        Clear Current File
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {pdfUrl && (
                        <div className="dashboard-container">
                            {/* Left Panel */}
                            <aside className="left-panel relative">
                                {/* Filter Sidebar */}
                                <div className="left-sidebar">
                                    {['All', 'Master Data', 'Time Surcharges', 'Asset Surcharges', 'Compliance Surcharges'].map(tab => (
                                        <button
                                            key={tab}
                                            className={`left-sidebar-tab ${activeTab === tab ? 'active' : ''}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Scrollable Content */}
                                <div className="left-content">
                                    {isAnalyzing ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 h-full mt-24">
                                            <Spinner />
                                            <p className="mt-4 text-[14px] text-[var(--slate-400)]">Analyzing document...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center h-full mt-24">
                                            <p className="text-[#f87171] text-[14px] mb-4">{error}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {(activeTab === 'All' || activeTab === 'Master Data') && (
                                                <>
                                                    <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 mt-2 uppercase tracking-wide">Master Data</h3>

                                                    <div className="form-group">
                                                        <label>Contract Type</label>
                                                        <input type="text" placeholder="e.g., MSA, RFS_SGHA..." value={contractData?.contract_type?.value || ''} onChange={(e) => handleFieldChange(null, null, 'contract_type', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.contract_type?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Legal Entity Names</label>
                                                        <textarea rows="2" placeholder="Entities involved..." value={contractData?.legal_entity_names?.value || ''} onChange={(e) => handleFieldChange(null, null, 'legal_entity_names', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.legal_entity_names?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Registered Addresses</label>
                                                        <textarea rows="2" placeholder="Addresses..." value={contractData?.registered_addresses?.value || ''} onChange={(e) => handleFieldChange(null, null, 'registered_addresses', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.registered_addresses?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Jurisdiction</label>
                                                        <input type="text" placeholder="Governing law state..." value={contractData?.jurisdiction?.value || ''} onChange={(e) => handleFieldChange(null, null, 'jurisdiction', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.jurisdiction?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Performance Standards</label>
                                                        <textarea rows="2" placeholder="Standards..." value={contractData?.performance_standards?.value || ''} onChange={(e) => handleFieldChange(null, null, 'performance_standards', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.performance_standards?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Confidentiality Sunset (Yrs)</label>
                                                        <input type="text" placeholder="Years..." value={contractData?.confidentiality_sunset_period_years?.value || ''} onChange={(e) => handleFieldChange(null, null, 'confidentiality_sunset_period_years', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.confidentiality_sunset_period_years?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>IP Ownership</label>
                                                        <input type="text" placeholder="Ownership..." value={contractData?.intellectual_property_ownership?.value || ''} onChange={(e) => handleFieldChange(null, null, 'intellectual_property_ownership', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.intellectual_property_ownership?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Force Majeure Events</label>
                                                        <textarea rows="3" placeholder="Events..." value={Array.isArray(contractData?.force_majeure_events?.value) ? contractData.force_majeure_events.value.join(', ') : contractData?.force_majeure_events?.value || ''} onChange={(e) => handleFieldChange(null, null, 'force_majeure_events', e.target.value.split(',').map(s => s.trim()))} onMouseEnter={() => handleHoverHighlight(contractData?.force_majeure_events?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Notice Period (Days)</label>
                                                        <input type="text" placeholder="Days..." value={contractData?.notice_period_days?.value || ''} onChange={(e) => handleFieldChange(null, null, 'notice_period_days', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.notice_period_days?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Effective Date</label>
                                                        <input type="text" placeholder="ISO Date..." value={contractData?.term_effective_date?.value || ''} onChange={(e) => handleFieldChange(null, null, 'term_effective_date', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.term_effective_date?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Termination Date</label>
                                                        <input type="text" placeholder="ISO Date..." value={contractData?.term_termination_date?.value || ''} onChange={(e) => handleFieldChange(null, null, 'term_termination_date', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.term_termination_date?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Auto Renewal Window (Days)</label>
                                                        <input type="text" placeholder="Days..." value={contractData?.auto_renewal_window_days?.value || ''} onChange={(e) => handleFieldChange(null, null, 'auto_renewal_window_days', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.auto_renewal_window_days?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Liability Cap (Per Incident)</label>
                                                        <input type="text" placeholder="Amount..." value={contractData?.liability_cap_per_incident?.value || ''} onChange={(e) => handleFieldChange(null, null, 'liability_cap_per_incident', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.liability_cap_per_incident?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Liability Limit (Per LB)</label>
                                                        <input type="text" placeholder="Amount..." value={contractData?.liability_limit_per_lb?.value || ''} onChange={(e) => handleFieldChange(null, null, 'liability_limit_per_lb', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.liability_limit_per_lb?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Cargo Insurance Limit</label>
                                                        <input type="text" placeholder="Amount..." value={contractData?.cargo_insurance_limit?.value || ''} onChange={(e) => handleFieldChange(null, null, 'cargo_insurance_limit', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.cargo_insurance_limit?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Auto Liability Limit</label>
                                                        <input type="text" placeholder="Amount..." value={contractData?.auto_liability_limit?.value || ''} onChange={(e) => handleFieldChange(null, null, 'auto_liability_limit', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.auto_liability_limit?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>General Liability Limit</label>
                                                        <input type="text" placeholder="Amount..." value={contractData?.general_liability_limit?.value || ''} onChange={(e) => handleFieldChange(null, null, 'general_liability_limit', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.general_liability_limit?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>MC/DOT Number</label>
                                                        <input type="text" placeholder="Prefix with MC..." value={contractData?.mc_dot_number?.value || ''} onChange={(e) => handleFieldChange(null, null, 'mc_dot_number', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.mc_dot_number?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>TSA IAC Cert</label>
                                                        <input type="text" placeholder="XX-0000..." value={contractData?.tsa_iac_cert?.value || ''} onChange={(e) => handleFieldChange(null, null, 'tsa_iac_cert', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.tsa_iac_cert?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>FMCSA Safety Rating</label>
                                                        <input type="text" placeholder="Rating requirement..." value={contractData?.fmcsa_safety_rating_requirement?.value || ''} onChange={(e) => handleFieldChange(null, null, 'fmcsa_safety_rating_requirement', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.fmcsa_safety_rating_requirement?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>CBP Bond Value</label>
                                                        <input type="text" placeholder="Bond amount..." value={contractData?.cbp_bond_value?.value || ''} onChange={(e) => handleFieldChange(null, null, 'cbp_bond_value', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.cbp_bond_value?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Airport Codes</label>
                                                        <textarea rows="2" placeholder="IATA format..." value={Array.isArray(contractData?.airport_codes?.value) ? contractData.airport_codes.value.join(', ') : contractData?.airport_codes?.value || ''} onChange={(e) => handleFieldChange(null, null, 'airport_codes', e.target.value.split(',').map(s => s.trim()))} onMouseEnter={() => handleHoverHighlight(contractData?.airport_codes?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Non-Circumvention Period (Mos)</label>
                                                        <input type="text" placeholder="Months..." value={contractData?.non_circumvention_prohibition_period_months?.value || ''} onChange={(e) => handleFieldChange(null, null, 'non_circumvention_prohibition_period_months', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.non_circumvention_prohibition_period_months?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Non-Circumvention Damages</label>
                                                        <input type="text" placeholder="Damages amount..." value={contractData?.non_circumvention_liquidated_damages?.value || ''} onChange={(e) => handleFieldChange(null, null, 'non_circumvention_liquidated_damages', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.non_circumvention_liquidated_damages?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Pricing Model Type</label>
                                                        <input type="text" placeholder="Model type..." value={contractData?.pricing_model_type?.value || ''} onChange={(e) => handleFieldChange(null, null, 'pricing_model_type', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.pricing_model_type?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Escalation Threshold (%)</label>
                                                        <input type="text" placeholder="Percentage..." value={contractData?.escalation_trigger_threshold_percentage?.value || ''} onChange={(e) => handleFieldChange(null, null, 'escalation_trigger_threshold_percentage', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.escalation_trigger_threshold_percentage?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Escalation Index</label>
                                                        <input type="text" placeholder="Index used..." value={contractData?.escalation_index?.value || ''} onChange={(e) => handleFieldChange(null, null, 'escalation_index', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.escalation_index?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Status of Parties</label>
                                                        <input type="text" placeholder="Status..." value={contractData?.status_of_parties?.value || ''} onChange={(e) => handleFieldChange(null, null, 'status_of_parties', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.status_of_parties?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Min Freight Volume Req</label>
                                                        <input type="text" placeholder="Volume minimum..." value={contractData?.freight_volume_requirements_minimum?.value || ''} onChange={(e) => handleFieldChange(null, null, 'freight_volume_requirements_minimum', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.freight_volume_requirements_minimum?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>POD Responsibility</label>
                                                        <textarea rows="2" placeholder="Responsibility details..." value={contractData?.receipts_and_bills_of_lading_pod_responsibility?.value || ''} onChange={(e) => handleFieldChange(null, null, 'receipts_and_bills_of_lading_pod_responsibility', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.receipts_and_bills_of_lading_pod_responsibility?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Payment Net Days</label>
                                                        <input type="text" placeholder="Net days..." value={contractData?.payment_net_days?.value || ''} onChange={(e) => handleFieldChange(null, null, 'payment_net_days', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.payment_net_days?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Equipment Warranty Condition</label>
                                                        <textarea rows="2" placeholder="Warranty Details..." value={contractData?.equipment_warranty_condition?.value || ''} onChange={(e) => handleFieldChange(null, null, 'equipment_warranty_condition', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.equipment_warranty_condition?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>CARB Compliance / TRU Reg</label>
                                                        <input type="text" placeholder="Compliance..." value={contractData?.carb_compliance_tru_registration?.value || ''} onChange={(e) => handleFieldChange(null, null, 'carb_compliance_tru_registration', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.carb_compliance_tru_registration?.source_snippet)} />
                                                    </div>
                                                </>
                                            )}

                                            {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                            {(activeTab === 'All' || activeTab === 'Time Surcharges') && (
                                                <>
                                                    <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Time Surcharges</h3>

                                                    <div className="form-group">
                                                        <label>Detention Free Time (Hours)</label>
                                                        <input type="text" placeholder="Hours..." value={contractData?.detention_free_time_hours?.value || ''} onChange={(e) => handleFieldChange(null, null, 'detention_free_time_hours', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.detention_free_time_hours?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Detention Rate (Hourly)</label>
                                                        <input type="text" placeholder="Hourly rate..." value={contractData?.detention_hourly_rate?.value || ''} onChange={(e) => handleFieldChange(null, null, 'detention_hourly_rate', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.detention_hourly_rate?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Layover Rate (Daily)</label>
                                                        <input type="text" placeholder="Daily rate..." value={contractData?.layover_daily_rate?.value || ''} onChange={(e) => handleFieldChange(null, null, 'layover_daily_rate', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.layover_daily_rate?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>TONU Fee</label>
                                                        <input type="text" placeholder="Truck Order Not Used..." value={contractData?.tonu_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'tonu_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.tonu_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>After Hours / Weekend Delivery Fee</label>
                                                        <input type="text" placeholder="Fee amount..." value={contractData?.after_hours_weekend_delivery_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'after_hours_weekend_delivery_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.after_hours_weekend_delivery_fee?.source_snippet)} />
                                                    </div>
                                                </>
                                            )}

                                            {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                            {(activeTab === 'All' || activeTab === 'Asset Surcharges') && (
                                                <>
                                                    <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Asset Surcharges</h3>

                                                    <div className="form-group">
                                                        <label>Liftgate Fee</label>
                                                        <input type="text" placeholder="Liftgate fee..." value={contractData?.liftgate_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'liftgate_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.liftgate_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Roller Bed Surcharge</label>
                                                        <input type="text" placeholder="Roller bed fee..." value={contractData?.roller_bed_surcharge?.value || ''} onChange={(e) => handleFieldChange(null, null, 'roller_bed_surcharge', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.roller_bed_surcharge?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Pallet Jack Fee</label>
                                                        <input type="text" placeholder="Pallet jack fee..." value={contractData?.pallet_jack_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'pallet_jack_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.pallet_jack_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Tarping Fee</label>
                                                        <input type="text" placeholder="Tarping fee..." value={contractData?.tarping_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'tarping_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.tarping_fee?.source_snippet)} />
                                                    </div>
                                                </>
                                            )}

                                            {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                            {(activeTab === 'All' || activeTab === 'Compliance Surcharges') && (
                                                <>
                                                    <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Compliance Surcharges</h3>

                                                    <div className="form-group">
                                                        <label>Limited Access Fee</label>
                                                        <input type="text" placeholder="Fee amount..." value={contractData?.limited_access_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'limited_access_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.limited_access_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Residential Delivery Fee</label>
                                                        <input type="text" placeholder="Fee amount..." value={contractData?.residential_delivery_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'residential_delivery_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.residential_delivery_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Inside Delivery Fee</label>
                                                        <input type="text" placeholder="Fee amount..." value={contractData?.inside_delivery_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'inside_delivery_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.inside_delivery_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Sort and Segregate Fee</label>
                                                        <input type="text" placeholder="Fee amount..." value={contractData?.sort_and_seg_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'sort_and_seg_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.sort_and_seg_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Hazmat Handling</label>
                                                        <input type="text" placeholder="Hazmat fee..." value={contractData?.hazmat_handling_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'hazmat_handling_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.hazmat_handling_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Customs Exam Fee</label>
                                                        <input type="text" placeholder="Customs exam fee..." value={contractData?.customs_exam_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'customs_exam_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.customs_exam_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Reweigh / Reclassification Fee</label>
                                                        <input type="text" placeholder="Fee amount..." value={contractData?.reweigh_and_reclassification_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'reweigh_and_reclassification_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.reweigh_and_reclassification_fee?.source_snippet)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Security Escort Fee</label>
                                                        <input type="text" placeholder="Fee amount..." value={contractData?.security_escort_fee?.value || ''} onChange={(e) => handleFieldChange(null, null, 'security_escort_fee', e.target.value)} onMouseEnter={() => handleHoverHighlight(contractData?.security_escort_fee?.source_snippet)} />
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}

                                    {!isAnalyzing && !error && contractData && (
                                        <div className="save-action-footer">
                                            <button className="save-btn" onClick={saveContract}>
                                                Save Contract
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </aside>

                            {/* Center Panel (Document Viewer) */}
                            <main className="center-panel">
                                <iframe
                                    ref={iframeRef}
                                    src={`${pdfUrl}#toolbar=0`}
                                    title="PDF Viewer"
                                />
                            </main>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
