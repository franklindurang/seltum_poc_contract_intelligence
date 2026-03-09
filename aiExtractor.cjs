const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini SDK with apiKey from process.env.GEMINI_API_KEY
// Fallback to empty string to avoid throwing initially if not present
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

/**
 * Exponential backoff helper for API calls
 * @param {Function} asyncFn Function to execute
 * @param {number} maxRetries Maximum number of retries
 */
async function retryWithBackoff(asyncFn, maxRetries = 3) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await asyncFn();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
      attempt++;
      // Exponential backoff with jitter
      const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.warn(`[API] Attempt ${attempt} failed. Retrying in ${Math.round(delayMs)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Replace null values in an object / array with empty strings recursively.
 * "Handle cases where the LLM returns null for a field by returning an empty string."
 */
function replaceNullWithEmptyString(obj) {
  if (obj === null) return "";
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(replaceNullWithEmptyString);
  }

  const result = {};
  for (const key in obj) {
    result[key] = replaceNullWithEmptyString(obj[key]);
  }
  return result;
}

/**
 * Module BE-2: AI Data Extraction
 * Instructs Gemini API to extract strict JSON with source snippets from the parsed text.
 * 
 * @param {string} contractText 
 * @returns {Promise<Object>} The parsed JSON matching the given schema
 */
async function extractContractData(contractText) {
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
"""
`;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const outputText = response.text || response.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(outputText);
    } catch (parseError) {
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}\nResponse was: ${outputText}`);
    }

    // Ensure nulls are strictly converted to "" per requirements
    return replaceNullWithEmptyString(jsonResponse);
  });
}

module.exports = { extractContractData };
