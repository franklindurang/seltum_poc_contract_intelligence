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
            contract_type TEXT,
            legal_entity_names TEXT,
            registered_addresses TEXT,
            jurisdiction TEXT,
            performance_standards TEXT,
            confidentiality_sunset_period_years TEXT,
            intellectual_property_ownership TEXT,
            force_majeure_events TEXT,
            notice_period_days TEXT,
            term_effective_date TEXT,
            term_termination_date TEXT,
            auto_renewal_window_days TEXT,
            liability_cap_per_incident TEXT,
            liability_limit_per_lb TEXT,
            cargo_insurance_limit TEXT,
            auto_liability_limit TEXT,
            general_liability_limit TEXT,
            mc_dot_number TEXT,
            tsa_iac_cert TEXT,
            fmcsa_safety_rating_requirement TEXT,
            cbp_bond_value TEXT,
            airport_codes TEXT,
            non_circumvention_prohibition_period_months TEXT,
            non_circumvention_liquidated_damages TEXT,
            pricing_model_type TEXT,
            escalation_trigger_threshold_percentage TEXT,
            escalation_index TEXT,
            liftgate_fee TEXT,
            roller_bed_surcharge TEXT,
            pallet_jack_fee TEXT,
            tarping_fee TEXT,
            detention_free_time_hours TEXT,
            detention_hourly_rate TEXT,
            layover_daily_rate TEXT,
            tonu_fee TEXT,
            after_hours_weekend_delivery_fee TEXT,
            limited_access_fee TEXT,
            residential_delivery_fee TEXT,
            inside_delivery_fee TEXT,
            sort_and_seg_fee TEXT,
            hazmat_handling_fee TEXT,
            customs_exam_fee TEXT,
            reweigh_and_reclassification_fee TEXT,
            security_escort_fee TEXT,
            status_of_parties TEXT,
            freight_volume_requirements_minimum TEXT,
            receipts_and_bills_of_lading_pod_responsibility TEXT,
            payment_net_days TEXT,
            equipment_warranty_condition TEXT,
            carb_compliance_tru_registration TEXT
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
        const extractVal = (key) => {
            const val = parsedData[key]?.value;
            if (Array.isArray(val)) return val.join(', ');
            return val || "";
        };

        const stmt = db.prepare(`INSERT INTO contracts (
            contract_name, customer_id, pdf_path,
            contract_type,
            legal_entity_names,
            registered_addresses,
            jurisdiction,
            performance_standards,
            confidentiality_sunset_period_years,
            intellectual_property_ownership,
            force_majeure_events,
            notice_period_days,
            term_effective_date,
            term_termination_date,
            auto_renewal_window_days,
            liability_cap_per_incident,
            liability_limit_per_lb,
            cargo_insurance_limit,
            auto_liability_limit,
            general_liability_limit,
            mc_dot_number,
            tsa_iac_cert,
            fmcsa_safety_rating_requirement,
            cbp_bond_value,
            airport_codes,
            non_circumvention_prohibition_period_months,
            non_circumvention_liquidated_damages,
            pricing_model_type,
            escalation_trigger_threshold_percentage,
            escalation_index,
            liftgate_fee,
            roller_bed_surcharge,
            pallet_jack_fee,
            tarping_fee,
            detention_free_time_hours,
            detention_hourly_rate,
            layover_daily_rate,
            tonu_fee,
            after_hours_weekend_delivery_fee,
            limited_access_fee,
            residential_delivery_fee,
            inside_delivery_fee,
            sort_and_seg_fee,
            hazmat_handling_fee,
            customs_exam_fee,
            reweigh_and_reclassification_fee,
            security_escort_fee,
            status_of_parties,
            freight_volume_requirements_minimum,
            receipts_and_bills_of_lading_pod_responsibility,
            payment_net_days,
            equipment_warranty_condition,
            carb_compliance_tru_registration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        stmt.run([
            contractName || "Untitled Contract",
            customerId || "Unknown",
            pdfPath,
            extractVal('contract_type'),
            extractVal('legal_entity_names'),
            extractVal('registered_addresses'),
            extractVal('jurisdiction'),
            extractVal('performance_standards'),
            extractVal('confidentiality_sunset_period_years'),
            extractVal('intellectual_property_ownership'),
            extractVal('force_majeure_events'),
            extractVal('notice_period_days'),
            extractVal('term_effective_date'),
            extractVal('term_termination_date'),
            extractVal('auto_renewal_window_days'),
            extractVal('liability_cap_per_incident'),
            extractVal('liability_limit_per_lb'),
            extractVal('cargo_insurance_limit'),
            extractVal('auto_liability_limit'),
            extractVal('general_liability_limit'),
            extractVal('mc_dot_number'),
            extractVal('tsa_iac_cert'),
            extractVal('fmcsa_safety_rating_requirement'),
            extractVal('cbp_bond_value'),
            extractVal('airport_codes'),
            extractVal('non_circumvention_prohibition_period_months'),
            extractVal('non_circumvention_liquidated_damages'),
            extractVal('pricing_model_type'),
            extractVal('escalation_trigger_threshold_percentage'),
            extractVal('escalation_index'),
            extractVal('liftgate_fee'),
            extractVal('roller_bed_surcharge'),
            extractVal('pallet_jack_fee'),
            extractVal('tarping_fee'),
            extractVal('detention_free_time_hours'),
            extractVal('detention_hourly_rate'),
            extractVal('layover_daily_rate'),
            extractVal('tonu_fee'),
            extractVal('after_hours_weekend_delivery_fee'),
            extractVal('limited_access_fee'),
            extractVal('residential_delivery_fee'),
            extractVal('inside_delivery_fee'),
            extractVal('sort_and_seg_fee'),
            extractVal('hazmat_handling_fee'),
            extractVal('customs_exam_fee'),
            extractVal('reweigh_and_reclassification_fee'),
            extractVal('security_escort_fee'),
            extractVal('status_of_parties'),
            extractVal('freight_volume_requirements_minimum'),
            extractVal('receipts_and_bills_of_lading_pod_responsibility'),
            extractVal('payment_net_days'),
            extractVal('equipment_warranty_condition'),
            extractVal('carb_compliance_tru_registration')
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
