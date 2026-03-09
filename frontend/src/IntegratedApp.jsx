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

    // New Save Feature State
    const [contractName, setContractName] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

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
    }

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
Extract the structured data from the provided contract text based on the Seltum Contract Intelligence Data Dictionary.

You MUST strictly return JSON that matches this schema exactly:
{
  "legal_entity_name": { "value": "string", "source_snippet": "exact string found in pdf" },
  "mc_number": { "value": "string", "source_snippet": "exact string found in pdf" },
  "effective_date": { "value": "ISO-date", "source_snippet": "exact string found in pdf" },
  "termination_notice": { "value": "string", "source_snippet": "exact string found in pdf" },
  "governing_law": { "value": "string", "source_snippet": "exact string found in pdf" },

  "base_rate_type": { "value": "string", "source_snippet": "exact string found in pdf" },
  "fuel_surcharge_index": { "value": "string", "source_snippet": "exact string found in pdf" },
  "payment_terms": { "value": "string", "source_snippet": "exact string found in pdf" },
  "quickpay_option": { "value": "string", "source_snippet": "exact string found in pdf" },
  "minimum_charge": { "value": "string", "source_snippet": "exact string found in pdf" },

  "detention_rate": { "value": "string", "source_snippet": "exact string found in pdf" },
  "free_time": { "value": "string", "source_snippet": "exact string found in pdf" },
  "tonu_fee": { "value": "string", "source_snippet": "exact string found in pdf" },
  "stop_off_charge": { "value": "string", "source_snippet": "exact string found in pdf" },
  "layover_fee": { "value": "string", "source_snippet": "exact string found in pdf" },

  "cargo_liability_limit": { "value": "string", "source_snippet": "exact string found in pdf" },
  "auto_liability_limit": { "value": "string", "source_snippet": "exact string found in pdf" },
  "claims_filing_window": { "value": "string", "source_snippet": "exact string found in pdf" },
  "commodity_exclusions": { "value": "string", "source_snippet": "exact string found in pdf" },
  "waiver_of_subrogation": { "value": "boolean", "source_snippet": "exact string found in pdf" },

  "no_brokerage_clause": { "value": "string", "source_snippet": "exact string found in pdf" },
  "equipment_requirement": { "value": "string", "source_snippet": "exact string found in pdf" },
  "back_solicitation_window": { "value": "string", "source_snippet": "exact string found in pdf" },
  "tracking_requirement": { "value": "string", "source_snippet": "exact string found in pdf" },

  "unmapped_snippet": { "value": "string", "source_snippet": "exact string found in pdf" },
  "custom_tag": { "value": "string", "source_snippet": "exact string found in pdf" }
}

CRITICAL RULES:
1. The "source_snippet" MUST be exact quotes from the text.
2. If any value cannot be found in the contract text, you MUST return an empty string "" for its value field, rather than omitting the field from the JSON or returning null. Every field listed in the schema MUST be present in the final output.
3. Your entire response must be valid JSON matching the schema exactly, with no additional commentary.

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
            setSaveStatus(null);
            setContractName(file.name.replace(/\.pdf$/i, ''));
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

    const handleSaveContract = async () => {
        if (!pdfFile || !contractData) return;
        setIsSaving(true);
        setSaveStatus(null);

        try {
            const formData = new FormData();
            formData.append('pdfFile', pdfFile);
            formData.append('contractName', contractName);
            formData.append('customerId', customerId);
            formData.append('contractData', JSON.stringify(contractData));

            const response = await fetch('http://localhost:3000/api/contracts', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setSaveStatus({ type: 'success', message: `Saved Successfully! Contract ID: #${data.contractId}` });
            } else {
                throw new Error(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error("Save error:", error);
            setSaveStatus({ type: 'error', message: "Error saving contract: " + error.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ backgroundColor: pdfUrl ? 'var(--slate-900)' : 'var(--app-bg)' }}>

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
                                {['All', 'Entity & Governance', 'Commercial & Financial', 'Accessorials & Fees', 'Risk & Liability', 'Compliance & Standards', 'Unmapped'].map(tab => (
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
                                        {(activeTab === 'All' || activeTab === 'Entity & Governance') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 mt-2 uppercase tracking-wide">Entity & Governance</h3>

                                                <div className="form-group">
                                                    <label>Legal Entity Name</label>
                                                    <input type="text" placeholder="e.g., FastTrack Logistics, Inc." value={contractData?.legal_entity_name?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.legal_entity_name?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>MC Number</label>
                                                    <input type="text" placeholder="e.g., MC# 889231" value={contractData?.mc_number?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.mc_number?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Effective Date</label>
                                                    <input type="text" placeholder="e.g., January 15th, 2024" value={contractData?.effective_date?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.effective_date?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Termination Notice (Days)</label>
                                                    <input type="text" placeholder="e.g., 30 days written notice" value={contractData?.termination_notice?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.termination_notice?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Governing Law</label>
                                                    <input type="text" placeholder="e.g., State of Delaware" value={contractData?.governing_law?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.governing_law?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                        {(activeTab === 'All' || activeTab === 'Commercial & Financial') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Commercial & Financial Logic</h3>

                                                <div className="form-group">
                                                    <label>Base Rate Type</label>
                                                    <input type="text" placeholder="e.g., Flat Rate" value={contractData?.base_rate_type?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.base_rate_type?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Fuel Surcharge (FSC) Index</label>
                                                    <input type="text" placeholder="e.g., DOE Weekly Retail..." value={contractData?.fuel_surcharge_index?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.fuel_surcharge_index?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Payment Terms</label>
                                                    <input type="text" placeholder="e.g., Net 30 days" value={contractData?.payment_terms?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.payment_terms?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>QuickPay Option</label>
                                                    <input type="text" placeholder="e.g., 3% discount for 24-hr pay" value={contractData?.quickpay_option?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.quickpay_option?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Minimum Charge</label>
                                                    <input type="text" placeholder="e.g., $450.00 minimum" value={contractData?.minimum_charge?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.minimum_charge?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                        {(activeTab === 'All' || activeTab === 'Accessorials & Fees') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Accessorials & Operational Fees</h3>

                                                <div className="form-group">
                                                    <label>Detention Rate</label>
                                                    <input type="text" placeholder="e.g., $75.00 per hour" value={contractData?.detention_rate?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.detention_rate?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Free Time</label>
                                                    <input type="text" placeholder="e.g., 2 hours free time" value={contractData?.free_time?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.free_time?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>TONU Fee</label>
                                                    <input type="text" placeholder="e.g., $250.00 flat fee" value={contractData?.tonu_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.tonu_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Stop-Off Charge</label>
                                                    <input type="text" placeholder="e.g., $100 per stop" value={contractData?.stop_off_charge?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.stop_off_charge?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Layover Fee</label>
                                                    <input type="text" placeholder="e.g., $350.00 per day" value={contractData?.layover_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.layover_fee?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                        {(activeTab === 'All' || activeTab === 'Risk & Liability') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Risk, Insurance & Liability</h3>

                                                <div className="form-group">
                                                    <label>Cargo Liability Limit</label>
                                                    <input type="text" placeholder="e.g., $100,000 per shipment" value={contractData?.cargo_liability_limit?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.cargo_liability_limit?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Auto Liability Limit</label>
                                                    <input type="text" placeholder="e.g., $1,000,000 CSL" value={contractData?.auto_liability_limit?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.auto_liability_limit?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Claims Filing Window</label>
                                                    <input type="text" placeholder="e.g., 9 months from delivery" value={contractData?.claims_filing_window?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.claims_filing_window?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Commodity Exclusions</label>
                                                    <textarea rows="2" placeholder="e.g., No hazmat, no bullion" value={contractData?.commodity_exclusions?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.commodity_exclusions?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Waiver of Subrogation</label>
                                                    <input type="text" placeholder="e.g., true/false" value={contractData?.waiver_of_subrogation?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.waiver_of_subrogation?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                        {(activeTab === 'All' || activeTab === 'Compliance & Standards') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Compliance & Service Standards</h3>

                                                <div className="form-group">
                                                    <label>No-Brokerage Clause</label>
                                                    <input type="text" placeholder="e.g., Carrier shall not re-broker" value={contractData?.no_brokerage_clause?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.no_brokerage_clause?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Equipment Requirement</label>
                                                    <input type="text" placeholder="e.g., 53' Air-Ride Van" value={contractData?.equipment_requirement?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.equipment_requirement?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Back-Solicitation Window</label>
                                                    <input type="text" placeholder="e.g., 24 months post-termination" value={contractData?.back_solicitation_window?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.back_solicitation_window?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Tracking Requirement</label>
                                                    <input type="text" placeholder="e.g., Carrier must utilize ELD" value={contractData?.tracking_requirement?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.tracking_requirement?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                        {(activeTab === 'All' || activeTab === 'Unmapped') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Residual Intelligence</h3>

                                                <div className="form-group">
                                                    <label>Custom Tag</label>
                                                    <input type="text" placeholder="e.g., Peak_Season_Rules" value={contractData?.custom_tag?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.custom_tag?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Unmapped Snippet</label>
                                                    <textarea rows="3" placeholder="Any remaining constraints or conditions not covered above..." value={contractData?.unmapped_snippet?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.unmapped_snippet?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                    </>
                                )}
                            </div>
                        </aside>

                        {/* Center Panel (Document Viewer) */}
                        <main className="center-panel flex flex-col h-full overflow-hidden">
                            {contractData && !isAnalyzing && (
                                <div className="bg-[#1e293b] border-b border-[#334155] p-3 shadow-sm z-10 flex items-center justify-between">
                                    <div className="flex space-x-4 items-center flex-1">
                                        <div className="flex flex-col flex-1 max-w-[300px]">
                                            <label className="text-[10px] uppercase text-[#94a3b8] font-bold mb-1 tracking-wider">Contract Name</label>
                                            <input
                                                type="text"
                                                value={contractName}
                                                onChange={(e) => setContractName(e.target.value)}
                                                className="bg-[#0f172a] border border-[#334155] text-white text-[13px] px-2 py-1.5 focus:outline-none focus:border-[#6366f1] transition-colors"
                                                placeholder="Enter Contract Name..."
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1 max-w-[200px]">
                                            <label className="text-[10px] uppercase text-[#94a3b8] font-bold mb-1 tracking-wider">Customer ID</label>
                                            <input
                                                type="text"
                                                value={customerId}
                                                onChange={(e) => setCustomerId(e.target.value)}
                                                className="bg-[#0f172a] border border-[#334155] text-white text-[13px] px-2 py-1.5 focus:outline-none focus:border-[#6366f1] transition-colors"
                                                placeholder="e.g. CUST-12345"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {saveStatus && (
                                            <span className={`text-[12px] font-medium ${saveStatus.type === 'success' ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                                                {saveStatus.message}
                                            </span>
                                        )}
                                        <button
                                            onClick={handleSaveContract}
                                            disabled={isSaving}
                                            className={`px-4 py-2 font-medium text-[13px] text-white flex items-center space-x-2 transition-colors ${isSaving ? 'bg-[#4f46e5] opacity-70 cursor-not-allowed' : 'bg-[#6366f1] hover:bg-[#4f46e5] shadow-sm'
                                                }`}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                        <polyline points="7 3 7 8 15 8"></polyline>
                                                    </svg>
                                                    <span>Save Contract</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <iframe
                                ref={iframeRef}
                                src={`${pdfUrl}#toolbar=0`}
                                title="PDF Viewer"
                                className="flex-1 w-full border-none m-0 p-0 block"
                                style={{ height: '100%', display: 'block' }}
                            />
                        </main>
                    </div>
                )}
            </div>
        </div>
    );
}
