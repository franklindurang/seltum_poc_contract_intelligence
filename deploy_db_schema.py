import re

def update_server_cjs():
    with open("server.cjs", "r") as f:
        content = f.read()

    schema_fields = [
        "contract_type", "legal_entity_names", "registered_addresses", "jurisdiction", 
        "performance_standards", "confidentiality_sunset_period_years", "intellectual_property_ownership", 
        "force_majeure_events", "notice_period_days", "term_effective_date", "term_termination_date", 
        "auto_renewal_window_days", "liability_cap_per_incident", "liability_limit_per_lb", 
        "cargo_insurance_limit", "auto_liability_limit", "general_liability_limit", "mc_dot_number", 
        "tsa_iac_cert", "fmcsa_safety_rating_requirement", "cbp_bond_value", "airport_codes", 
        "non_circumvention_prohibition_period_months", "non_circumvention_liquidated_damages", 
        "pricing_model_type", "escalation_trigger_threshold_percentage", "escalation_index", 
        "liftgate_fee", "roller_bed_surcharge", "pallet_jack_fee", "tarping_fee", "detention_free_time_hours", 
        "detention_hourly_rate", "layover_daily_rate", "tonu_fee", "after_hours_weekend_delivery_fee", 
        "limited_access_fee", "residential_delivery_fee", "inside_delivery_fee", "sort_and_seg_fee", 
        "hazmat_handling_fee", "customs_exam_fee", "reweigh_and_reclassification_fee", "security_escort_fee", 
        "status_of_parties", "freight_volume_requirements_minimum", 
        "receipts_and_bills_of_lading_pod_responsibility", "payment_net_days", "equipment_warranty_condition", 
        "carb_compliance_tru_registration"
    ]

    # 1. Replace the CREATE TABLE schema
    table_columns = ",\n            ".join([f"{field} TEXT" for field in schema_fields])
    new_create_table = f"""db.run(`CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_name TEXT,
            customer_id TEXT,
            pdf_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            {table_columns}
        )`);"""
    
    content = re.sub(r'db\.run\(`CREATE TABLE IF NOT EXISTS contracts \([\s\S]*?\)`\);', new_create_table, content)

    # 2. Replace the INSERT INTO statement
    columns_str = ",\n            ".join(schema_fields)
    placeholders_str = ", ".join(["?"] * len(schema_fields))
    new_stmt = f"""const stmt = db.prepare(`INSERT INTO contracts (
            contract_name, customer_id, pdf_path,
            {columns_str}
        ) VALUES (?, ?, ?, {placeholders_str})`);"""
    
    content = re.sub(r'const stmt = db\.prepare\(`INSERT INTO contracts \([\s\S]*?\) VALUES \([\s\S]*?\)`\);', new_stmt, content)

    # 3. Replace the stmt.run arguments
    # Note: the events & arrays may come as strings or arrays depending on the frontend so extractVal must stringify arrays
    extract_statements = ",\n            ".join([
        f"extractVal('{field}')" for field in schema_fields
    ])
    
    new_run = f"""stmt.run([
            contractName || "Untitled Contract",
            customerId || "Unknown",
            pdfPath,
            {extract_statements}
        ]"""
    
    content = re.sub(r'stmt\.run\(\[[\s\S]*?unmapped_snippet\'\), extractVal\(\'custom_tag\'\)\n\s*\]', new_run, content)


    # Fix the extractVal helper to handle arrays
    new_extract_val = """const extractVal = (key) => {
            const val = parsedData[key]?.value;
            if (Array.isArray(val)) return val.join(', ');
            return val || "";
        };"""
    content = re.sub(r'const extractVal = \(key\) => parsedData\[key\]\?\.value \|\| "";', new_extract_val, content)

    with open("server.cjs", "w") as f:
        f.write(content)
    
    print("Schema updated successfully.")

if __name__ == "__main__":
    update_server_cjs()
