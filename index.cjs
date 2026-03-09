require('dotenv').config();
const PDFDocument = require('pdfkit');
const { extractTextFromPdfBuffer } = require('./pdfParser.cjs');
const { extractContractData } = require('./aiExtractor.cjs');
const mathEngine = require('./mathEngine.cjs');
const businessRules = require('./businessRules.cjs');

/**
 * Main function: processContract
 * - Extracts all text from the PDF pages.
 * - Cleans the text.
 * - Sends the text to the Gemini API to extract structured fields.
 * 
 * @param {Buffer | ArrayBuffer} fileBuffer 
 * @returns {Promise<Object>} Extracted JSON data
 */
async function processContract(fileBuffer) {
    try {
        const rawText = await extractTextFromPdfBuffer(fileBuffer);
        const contractData = await extractContractData(rawText);
        return contractData;
    } catch (error) {
        console.error("Error processing contract:", error);
        throw error;
    }
}

// ============================================
// Mock Test Execution
// ============================================

async function createMockPdfBuffer(text) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fontSize(16).text('CONSOLIDATED AGREEMENT\n\n');
            doc.fontSize(12).text(text);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

// Run the test
async function runTest() {
    console.log("=== Testing Seltum Airfreight & RFS Logic ===");
    if (!process.env.GEMINI_API_KEY) {
        console.warn("WARNING: GEMINI_API_KEY is not set. Extraction will fail.");
    }

    // 1. Generate & Process Mock MSA
    const msaText = `
    Master Service Agreement (MSA)
    This confirms the BROKER_CARRIER agreement for Acme Logistics Inc.
    Registered Address: 123 Freight Lane, Miami, FL 33126.
    Governing Law: State of Florida.
    Performance Standards: Carrier must maintain 99% OTP (On-Time Performance) and employ TSA trained drivers.
    Confidentiality shall survive for a period of 5 years.
    Intellectual Property: Shipper retains all ownership of logistics data.
    Force Majeure includes Acts of God, Pandemic, and Cyber-attack.
    Term Effective Date: 2024-01-01. Termination Date: 2026-12-31.
    Notice Period: 60 Days.
    Auto-Renewal Window: 30 days prior to termination date.
    
    Insurance & Liability:
    Liability Limit: $0.50 per lb. Liability Cap: $250000 per incident.
    Cargo Insurance: $1000000. Auto Liability: $2000000. General Liability: $5000000.
    MC DOT Number is MC-987654. TSA IAC Cert is AC-4321.
    Carrier must maintain a Satisfactory FMCSA Safety Rating.
    CBP Bond Value: $100000.

    Operational Specifics:
    Approved airport codes are: MIA, JFK, ORD, LAX.
    Non-circumvention prohibition period is 12 months, with liquidated damages of $50000.
    
    Pricing Model: Hybrid (Base + Variable).
    Escalation Index: EIA. Escalation Trigger Threshold: 5%.
    
    Accessorials:
    liftgate_fee is $75.00
    roller_bed_surcharge is $150.00
    pallet_jack_fee is $50.00
    tarping_fee is $200.00
    detention_free_time: 2 hours
    detention_hourly_rate is $85.00
    layover_daily_rate is $350.00
    tonu_fee is $250.00
    after_hours_weekend_delivery_fee is $100.00
    limited_access_fee is $125.00
    residential_delivery_fee is $75.00
    inside_delivery_fee is $150.00
    sort_and_seg_fee is $25.00
    hazmat_handling_fee is $200.00
    customs_exam_fee is $175.00
    reweigh_and_reclassification_fee is $50.00
    security_escort_fee is $400.00
  `;
    const msaBuffer = await createMockPdfBuffer(msaText);

    // 2. Generate & Process Mock SOW
    const sowText = `
    Statement of Work (SOW)
    This SOW applies to Acme.
    Updated Surcharges per this SOW: 
    liftgate_fee is increased to $80.00. 
    roller_bed_surcharge is $120.00.
    liability limit under this SOW is $50000.
  `;
    const sowBuffer = await createMockPdfBuffer(sowText);

    try {
        console.log("\n[1] Extracting MSA Data...");
        const msaData = await processContract(msaBuffer);
        console.log("MSA Extracted successfully.");

        console.log("\n[2] Extracting SOW Data...");
        const sowData = await processContract(sowBuffer);
        console.log("SOW Extracted successfully.");

        console.log("\n[3] Apply Order of Precedence Validation (Flat)...");
        // For a flat schema, the SOW overrides the MSA directly on the top-level keys
        // EXCEPT for liability limits which stick to the MSA.
        const consolidatedContract = { ...msaData, ...sowData };
        if (msaData.liability_cap_per_incident) {
            consolidatedContract.liability_cap_per_incident = msaData.liability_cap_per_incident;
        }
        if (msaData.liability_limit_per_lb) {
            consolidatedContract.liability_limit_per_lb = msaData.liability_limit_per_lb;
        }
        console.log(JSON.stringify(consolidatedContract, null, 2));

        console.log("\n[4] Testing Math Engine...");
        const escalatedPrice = mathEngine.calculatePriceEscalation(100, 150, 100);
        const detentionBilling = mathEngine.calculateDetention("2024-01-01T10:00:00Z", "2024-01-01T15:00:00Z", 2, 75);
        const rfsFlatRate = mathEngine.calculateRFSBlockSpace("RFS_SGHA", "Deadload", 1500, 500);
        console.log(`- Price Escalation ($100 base, index 100->150): $${escalatedPrice}`);
        console.log(`- Detention (10am to 3pm, 2hr free, $75/hr): $${detentionBilling}`);
        console.log(`- RFS SGHA Deadload ($1500 flat vs $500 alt): $${rfsFlatRate}`);

        console.log("\n[5] Testing Business Rule Middleware...");
        const fmcsaCheck = businessRules.evaluateComplianceWatch("Unsatisfactory", "Active");
        console.log("- FMCSA Unsatisfactory Evaluation:", fmcsaCheck.message);

        const renewalCheck = businessRules.checkRenewalAlert("2026-03-20", 30);
        console.log("- Renewal Alert (Terminating in ~12 days with 30-day notice):", renewalCheck ? "TRIGGER ACTIVE" : "No trigger");

        const podCheck = businessRules.processPOD("RFC", true);
        console.log("- POD Processing (RFC & Annex B):", podCheck.message);

        const tsaResult = businessRules.tsaComplianceMiddleware({
            carrierId: "C-123",
            tsa_iac_expiration_date: "2023-01-01" // Expired
        });
        console.log("- TSA Middleware (Simulated Expired Carrier):", tsaResult.risk_status);

    } catch (err) {
        console.error("\nTest failed:", err.message);
    }
}

// Execute the test if this file is run directly
if (require.main === module) {
    runTest();
}

module.exports = {
    processContract
};
