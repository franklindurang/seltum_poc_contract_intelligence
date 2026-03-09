import React, { useState, useRef } from 'react';

export default function ContractIntelligenceUI() {
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
        <div className="dashboard-container">
            {/* Left Panel */}
            <aside className="left-panel">
                <div className="header">
                    <h2>Contract Intelligence</h2>
                </div>

                <div className="form-group">
                    <label>Customer Name</label>
                    <input type="text" placeholder="Enter customer name..." />
                </div>

                <div className="form-group">
                    <label>Pricing Structure</label>
                    <input type="text" placeholder="e.g., Tiered, Flat rate..." />
                </div>

                <div className="form-group">
                    <label>Charging Logic</label>
                    <textarea rows="4" placeholder="Extracting logic..."></textarea>
                </div>

                <div className="form-group">
                    <label>Legal Clauses</label>
                    <textarea rows="6" placeholder="Extracted clauses..."></textarea>
                </div>
            </aside>

            {/* Center Panel (Document Viewer) */}
            <main className="center-panel">
                {pdfUrl ? (
                    <iframe
                        src={`${pdfUrl}#toolbar=0`}
                        title="PDF Viewer"
                    />
                ) : (
                    <div className="document-viewer">
                        <h3>Business Contract</h3>
                        <p style={{ marginTop: '16px', lineHeight: '1.6' }}>The agreements are used on this the <span className="highlight">business contract</span>...</p>
                    </div>
                )}
            </main>

            {/* Right Panel (Upload Area) */}
            <aside className="right-panel">
                <div className="upload-card">
                    <h2>Ready to analyze?</h2>
                    <p>Upload your contract below.</p>

                    <div
                        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <p>Drag & Drop your contract here,<br />or click to browse.</p>
                    </div>

                    <input
                        type="file"
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileInput}
                    />

                    <button
                        className="primary-btn"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Upload New Contract
                    </button>

                    {pdfUrl && (
                        <button
                            className="primary-btn"
                            style={{ marginTop: '16px', backgroundColor: 'var(--slate-700)' }}
                            onClick={clearFile}
                        >
                            Clear Current File
                        </button>
                    )}
                </div>
            </aside>
        </div>
    );
}
