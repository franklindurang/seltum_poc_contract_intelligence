const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup Uploads Directory for PDFs
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure Multer for PDF storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Database Setup
const dbPath = path.join(__dirname, 'contracts.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create Contracts Table matching the Seltum Data Dictionary
        db.run(`CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_name TEXT,
            customer_id TEXT,
            pdf_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Entity & Governance
            legal_entity_name TEXT,
            mc_number TEXT,
            effective_date TEXT,
            termination_notice TEXT,
            governing_law TEXT,
            
            -- Commercial & Financial
            base_rate_type TEXT,
            fuel_surcharge_index TEXT,
            payment_terms TEXT,
            quickpay_option TEXT,
            minimum_charge TEXT,
            
            -- Accessorials & Fees
            detention_rate TEXT,
            free_time TEXT,
            tonu_fee TEXT,
            stop_off_charge TEXT,
            layover_fee TEXT,
            
            -- Risk & Liability
            cargo_liability_limit TEXT,
            auto_liability_limit TEXT,
            claims_filing_window TEXT,
            commodity_exclusions TEXT,
            waiver_of_subrogation TEXT,
            
            -- Compliance & Standards
            no_brokerage_clause TEXT,
            equipment_requirement TEXT,
            back_solicitation_window TEXT,
            tracking_requirement TEXT,
            
            -- Unmapped
            unmapped_snippet TEXT,
            custom_tag TEXT
        )`);
    }
});

// API Endpoints

// 1. Save Contract API
app.post('/api/contracts', upload.single('pdfFile'), (req, res) => {
    try {
        const { contractName, customerId, contractData } = req.body;

        // Parse the JSON string sent via form-data back into an object
        const parsedData = JSON.parse(contractData || "{}");
        const pdfPath = req.file ? req.file.path : null;

        // Helper to extract nested { value: "..." } structure safely
        const extractVal = (key) => parsedData[key]?.value || "";

        const stmt = db.prepare(`INSERT INTO contracts (
            contract_name, customer_id, pdf_path,
            legal_entity_name, mc_number, effective_date, termination_notice, governing_law,
            base_rate_type, fuel_surcharge_index, payment_terms, quickpay_option, minimum_charge,
            detention_rate, free_time, tonu_fee, stop_off_charge, layover_fee,
            cargo_liability_limit, auto_liability_limit, claims_filing_window, commodity_exclusions, waiver_of_subrogation,
            no_brokerage_clause, equipment_requirement, back_solicitation_window, tracking_requirement,
            unmapped_snippet, custom_tag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        stmt.run([
            contractName || "Untitled Contract",
            customerId || "Unknown",
            pdfPath,
            extractVal('legal_entity_name'), extractVal('mc_number'), extractVal('effective_date'), extractVal('termination_notice'), extractVal('governing_law'),
            extractVal('base_rate_type'), extractVal('fuel_surcharge_index'), extractVal('payment_terms'), extractVal('quickpay_option'), extractVal('minimum_charge'),
            extractVal('detention_rate'), extractVal('free_time'), extractVal('tonu_fee'), extractVal('stop_off_charge'), extractVal('layover_fee'),
            extractVal('cargo_liability_limit'), extractVal('auto_liability_limit'), extractVal('claims_filing_window'), extractVal('commodity_exclusions'), extractVal('waiver_of_subrogation'),
            extractVal('no_brokerage_clause'), extractVal('equipment_requirement'), extractVal('back_solicitation_window'), extractVal('tracking_requirement'),
            extractVal('unmapped_snippet'), extractVal('custom_tag')
        ], function (err) {
            if (err) {
                console.error("Database insert error:", err);
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                success: true,
                message: "Contract saved successfully",
                contractId: this.lastID
            });
        });

        stmt.finalize();
    } catch (error) {
        console.error("Save API Error:", error);
        res.status(500).json({ error: "Failed to process contract data" });
    }
});

// 2. Fetch Contracts by Customer API
app.get('/api/contracts/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    db.all(`SELECT id, contract_name, customer_id, created_at FROM contracts WHERE customer_id = ? ORDER BY id DESC`, [customerId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ contracts: rows });
    });
});

app.listen(PORT, () => {
    console.log(`Contract Persistence Server running on port ${PORT}`);
});
