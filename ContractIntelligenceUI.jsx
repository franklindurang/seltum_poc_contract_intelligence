import React, { useState, useRef } from 'react';

// --- Icons (Tailored to image) ---
const LogoIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500">
        <path d="M12 2L15 9.5H22L16.5 14L18.5 21.5L12 17L5.5 21.5L7.5 14L2 9.5H9L12 2Z" fill="currentColor" />
    </svg>
);

const SparkleIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2l2.4 7.6 7.6 2.4-7.6 2.4L12 22l-2.4-7.6-7.6-2.4 7.6-2.4L12 2z" />
    </svg>
);

const BellIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
);

const GlobeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        <path d="M2 12h20" />
    </svg>
);

const FileOutlineIcon = ({ className }) => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

// Sidebar Icons
const NavFileIcon = ({ active }) => (
    <div className={`p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${active ? 'bg-[#293042] text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
    </div>
);

const NavFolderIcon = () => (
    <div className="p-2.5 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    </div>
);

const NavBoxIcon = () => (
    <div className="p-2.5 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
        </svg>
    </div>
);

const NavGearIcon = () => (
    <div className="p-2.5 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    </div>
);

const NavLogoutIcon = () => (
    <div className="p-2.5 rounded-lg text-slate-600 hover:text-slate-400 cursor-pointer transition-colors mt-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    </div>
);

// --- Form Element Components ---
const Field = ({ label }) => (
    <div className="mb-5">
        <label className="block text-[13px] font-medium text-slate-300 mb-2">{label}</label>
        <input
            type="text"
            className="w-full rounded-md bg-transparent border border-slate-700/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#5a67d8] transition-colors"
        />
    </div>
);

const TextArea = ({ label, rows = 3 }) => (
    <div className="mb-5">
        <label className="block text-[13px] font-medium text-slate-300 mb-2">{label}</label>
        <textarea
            rows={rows}
            className="w-full rounded-md bg-transparent border border-slate-700/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#5a67d8] transition-colors resize-none"
        />
    </div>
);

// --- Main Application Component ---
export default function ContractIntelligenceApp() {
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileProcess = (file) => {
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            const url = URL.createObjectURL(file);
            setPdfUrl(url);

            setIsAnalyzing(true);
            setTimeout(() => {
                setIsAnalyzing(false);
            }, 3500);
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileProcess(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
        }
    };

    const clearFile = () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
        setPdfFile(null);
        setPdfUrl(null);
        setIsAnalyzing(false);
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#11141e] font-sans text-slate-200 overflow-hidden">

            {/* Top Navigation Bar */}
            <header className="h-[60px] bg-[#11141e] border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center space-x-3">
                    <LogoIcon />
                    <span className="font-semibold text-slate-100 tracking-wide text-[15px]">Seltum</span>
                </div>
                <div className="flex items-center space-x-6">
                    <BellIcon />
                    <button className="flex items-center space-x-2 text-[13px] text-slate-400 hover:text-white border border-slate-700/60 hover:border-slate-500 rounded-md px-3 py-1.5 transition-colors bg-[#171a26]">
                        <GlobeIcon />
                        <span>Design</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    <button className="bg-[#5a67d8] hover:bg-[#4c51bf] text-white text-[13px] font-medium px-5 py-1.5 rounded-md transition-colors shadow-sm">
                        Sign up
                    </button>
                </div>
            </header>

            {/* Main Body */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Left Icon Sidebar */}
                <aside className="w-[60px] border-r border-slate-800/60 bg-[#141824] flex flex-col items-center py-4 space-y-4 shrink-0 z-10">
                    <NavFileIcon active={true} />
                    <NavBoxIcon />
                    <NavFolderIcon />
                    <NavGearIcon />
                    <div className="flex-1"></div>
                    <NavLogoutIcon />
                </aside>

                {/* Form Panel (Contract Intelligence) */}
                <aside className="w-[300px] border-r border-slate-800/60 bg-[#1b202f] flex flex-col shrink-0 z-10 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.3)]">
                    <div className="px-5 py-5 pb-2 shrink-0">
                        <h2 className="text-[16px] font-semibold text-slate-100">Contract Intelligence</h2>
                    </div>
                    <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                        <Field label="Customer Name" />
                        <TextArea label="Pricing Structure" rows={2} />
                        <TextArea label="Charging Logic" rows={3} />
                        <TextArea label="Legal Clauses" rows={4} />
                    </div>
                </aside>

                {/* Interactive Workspace (Split between Document UI and Upload Request based on image) */}
                <main className="flex-1 bg-[#11141e] flex p-6 relative overflow-hidden">

                    {/* Decorative Sparkle (bottom right corner matching UI identity) */}
                    <SparkleIcon className="absolute -bottom-10 -right-10 w-96 h-96 text-slate-800/20 pointer-events-none" />

                    {/* Conditional Layout based on pdfUrl state */}
                    {!pdfUrl ? (
                        /* Layout matching the provided Figma/Mockup image: Docs + Upload Overlay */
                        <div className="w-full h-full flex flex-row gap-6 relative">

                            {/* Dummy Document Panel (to match the image aesthetic perfectly) */}
                            <div className="w-[50%] h-full flex flex-col shrink-0 border border-slate-800/80 rounded-lg overflow-hidden bg-[#181d2a] shadow-lg">
                                <div className="h-12 border-b border-slate-800/80 flex items-center justify-between px-4 bg-[#1b202f]">
                                    <div className="flex items-center text-[13px] text-slate-400">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                        Document
                                    </div>
                                    <div className="flex items-center space-x-3 text-slate-500">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    </div>
                                </div>

                                {/* The "Paper" view inside the document panel */}
                                <div className="flex-1 bg-[#181d2a] p-4 lg:p-6 overflow-y-auto">
                                    <div className="bg-white rounded w-full min-h-full p-8 shadow-sm text-slate-900 mx-auto max-w-[650px] font-[Times] text-[11px] leading-relaxed relative">
                                        <div className="absolute top-0 left-0 w-full h-[60px] bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
                                        <div className="absolute bottom-0 left-0 w-full h-[150px] bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10 flex items-end pb-8"></div>

                                        <h1 className="text-center font-bold text-lg mb-6 font-sans">Business Contract</h1>

                                        <p className="mb-4 text-justify">
                                            The CONTRACT AME of _________ resources the suites of the assessment to the consolidation back assessment of _________, and <span className="bg-[#e0e7ff] text-[#3730a3] px-1 font-medium font-sans rounded-sm">data center all policies applied</span> and the the business contract of _________ addresses for suspected to furthest economic the business contract load assessment.
                                        </p>

                                        <h2 className="font-bold text-[12px] mb-2 font-sans mt-6">1. Nontenet</h2>
                                        <ul className="list-disc pl-5 mb-6 space-y-1">
                                            <li>The agreements are used on this the <span className="bg-[#e0e7ff] text-[#3730a3] px-1 font-medium font-sans rounded-sm">business model of business contract</span> customers such or more data should include the sentence AI detected <span className="bg-[#e0e7ff] text-[#3730a3] px-1 font-medium font-sans rounded-sm">control of sentence.</span></li>
                                            <li>The sentences of primary tenderness clashing trust business ambitions <span className="bg-[#e0e7ff] text-[#3730a3] px-1 font-medium font-sans rounded-sm">realised.</span></li>
                                            <li>The contract will until the a decuone of the tome in add donor to any specific and</li>
                                            <li>The same and time engagement <span className="bg-[#e0e7ff] text-[#3730a3] px-1 font-medium font-sans rounded-sm">control eceder to software, leaticides to data and confidence.</span></li>
                                            <li>The contracts also viewing application underlines used to constrain surveiled AI observers.</li>
                                        </ul>

                                        <h2 className="font-bold text-[12px] mb-2 font-sans mt-6">2. Legal Clauses</h2>
                                        <ol className="list-decimal pl-5 mb-8 space-y-1">
                                            <li>The Legal Clauses shall be since and conditions shall review promises through glowing the contract contracts and contract to their rehuiliced, with the confilernain, placement or form context in that abyssal clauses.</li>
                                            <li>The contract conciliate anbereconari nekvidat paupated in cent and contracts of quaeves clesars.</li>
                                            <li>The contract of reatement status has tarive onown by lowerevate clauses.</li>
                                            <li>The contract of the company shall nudge the retrieve monenatial assessment.</li>
                                            <li>The contract information detectes and cascade paned on any amother proninddo-indrite status of and/or clamment.</li>
                                        </ol>

                                        <p className="mb-6">Goal: Create a clean, expert-level interface that looks like a functional, high-end enterprise tool for legal and operations teams. 4k resolution, studio lighting, vector-style clarity.</p>

                                        <p className="mb-2">Sincerely,</p>
                                        <div className="w-[150px] border-b border-black mt-10 mb-2"></div>
                                        <p>Seltum Name<br />Business Contract</p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Card Floating Overlay / Panel */}
                            <div className="flex-1 flex items-center justify-center p-6 h-full border border-slate-700/50 bg-[#161b27] rounded-lg shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1a202c]/50 to-[#0f121b]/80 border border-slate-800/50 mix-blend-overlay"></div>

                                <div className="relative z-10 w-full max-w-[500px]">
                                    <h2 className="text-[26px] font-semibold text-slate-100 text-center mb-1">Ready to analyze?</h2>
                                    <p className="text-slate-400 text-[15px] text-center mb-8">Upload your contract below.</p>

                                    <div
                                        className={`border border-dashed rounded-xl bg-[#141824]/60 backdrop-blur-sm shadow-inner flex flex-col items-center justify-center py-14 px-8 transition-all duration-300 cursor-pointer mb-6 group ${isDragging ? "border-[#5a67d8] bg-[#5a67d8]/10" : "border-slate-700 hover:border-slate-500 hover:bg-[#1a1f2e]"
                                            }`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FileOutlineIcon className="text-slate-500 mb-6 group-hover:text-slate-400 group-hover:-translate-y-1 transition-all duration-300" />

                                        <p className="text-slate-300 text-[15px] font-medium text-center leading-relaxed">
                                            Drag & Drop your contract here,<br />or click to browse.
                                        </p>

                                        <div className="flex items-center space-x-3 mt-8">
                                            <div className="w-8 h-8 rounded shrink-0 bg-[#E53E3E] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">.pdf</div>
                                            <div className="w-8 h-8 rounded shrink-0 bg-[#3182CE] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">.doc</div>
                                            <div className="w-8 h-8 rounded shrink-0 bg-[#2B6CB0] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">.docx</div>
                                        </div>
                                    </div>

                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileInput}
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-[14px] bg-[#5a67d8] hover:bg-[#4c51bf] focus:ring-4 focus:ring-[#5a67d8]/30 outline-none text-white text-[15px] rounded-lg font-medium transition-colors shadow-[0_4px_14px_0_rgba(90,103,216,0.39)]"
                                    >
                                        Upload New Contract
                                    </button>
                                </div>
                            </div>

                        </div>
                    ) : (

                        /* File Uploaded Layout State (Viewer replacing the dual panel) */
                        <div className="w-full h-full border border-slate-700/60 rounded-xl overflow-hidden bg-[#181d2a] shadow-2xl flex flex-col relative z-20">
                            <div className="h-12 border-b border-slate-800/80 flex items-center justify-between px-4 bg-[#1b202f] shrink-0">
                                <div className="flex items-center text-[13px] text-slate-300 font-medium">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-indigo-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    {pdfFile?.name}
                                </div>
                                <button
                                    onClick={clearFile}
                                    className="text-[11px] font-medium text-slate-400 hover:text-white px-3 py-1.5 border border-slate-700 rounded bg-[#13161f] hover:bg-slate-800 transition-colors uppercase tracking-wider"
                                >
                                    Clear File
                                </button>
                            </div>

                            <div className="flex-1 relative bg-slate-900/50">
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-[#0f131a]/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                                        <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-slate-200 font-medium text-[15px] animate-pulse">Running Contract Intelligence Analysis...</p>
                                    </div>
                                )}
                                <iframe
                                    src={`${pdfUrl}#toolbar=0`}
                                    className="w-full h-full border-none bg-white rounded-b-xl"
                                    title="PDF Viewer"
                                />
                            </div>
                        </div>

                    )}

                </main>
            </div>
        </div>
    );
}
