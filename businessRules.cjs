/**
 * businessRules.js
 * Validations, lifecycle and operational triggers for Airfreight contracts.
 */

/**
 * Trigger: COMPLIANCE_WATCH
 * Scans FMC and TSA status. If "Unsatisfactory", disable service.
 * @param {string} fmcsaRating - e.g. "Satisfactory", "Conditional", "Unsatisfactory"
 * @param {string} tsaStatus - e.g. "Active", "Expired", "Unsatisfactory"
 * @returns {Object} status resulting from the check
 */
function evaluateComplianceWatch(fmcsaRating, tsaStatus) {
    let serviceActive = true;
    let blockLoadTenders = false;
    let message = "Compliance checks passed.";

    if (fmcsaRating.toUpperCase() === 'UNSATISFACTORY' || tsaStatus.toUpperCase() === 'UNSATISFACTORY') {
        serviceActive = false;
        blockLoadTenders = true;
        message = "COMPLIANCE_WATCH FLAG: Carrier rating is Unsatisfactory. Service deactivated and tenders blocked.";
    }

    return { serviceActive, blockLoadTenders, message };
}

/**
 * Trigger: RENEWAL_ALERT
 * Evaluates current date vs termination date minus notice period.
 * @param {string|Date} terminationDateStr 
 * @param {number} noticePeriodDays 
 * @returns {Object|null} The JSON payload intended for the frontend if a renewal warning triggers
 */
function checkRenewalAlert(terminationDateStr, noticePeriodDays) {
    const terminationDate = new Date(terminationDateStr);
    const currentDate = new Date();

    // Calculate the 'action window' boundary date
    const actionBoundaryDate = new Date(terminationDate);
    actionBoundaryDate.setDate(actionBoundaryDate.getDate() - noticePeriodDays);

    // If we've entered the action window (current date is on or past the boundary, but before termination)
    if (currentDate >= actionBoundaryDate && currentDate <= terminationDate) {
        return {
            event: "NON_RENEWAL_ALERT",
            payload: {
                message: `Contract is within the ${noticePeriodDays} day notice period window. Take action.`,
                termination_date: terminationDate.toISOString().split('T')[0],
                action_required_by: actionBoundaryDate.toISOString().split('T')[0]
            }
        };
    }
    return null; // No alert
}

/**
 * Trigger: POD_PROCESSING
 * Cross-references Ready for Carriage (RFC) POD details and Annex B logic for airport fees.
 * @param {string} rfcStatus - "Ready for Carriage" POD marker
 * @param {boolean} hasAnnexB - Flag indicating if airport-specific fees applies
 * @returns {Object} Extracted routing assessment
 */
function processPOD(rfcStatus, hasAnnexB) {
    if (rfcStatus === 'RFC') {
        if (hasAnnexB) {
            return {
                status: 'POD Processed',
                feeStructureRequired: 'Annex_B_Airport_Specific_Handling_Fees',
                message: 'POD indicates RFC state. Cross-referencing against Annex B handling fees triggered.'
            };
        }
    }
    return {
        status: 'Pending or Standard',
        message: 'No active RFC + Annex B flags applied.'
    };
}

/**
 * Validation: Order of Precedence
 * SOW Pricing overrides MSA Pricing.
 * MSA Legal Liability overrides SOW Legal Liability.
 * 
 * @param {Object} sowData - Parsed JSON extracted from SOW
 * @param {Object} msaData - Parsed JSON extracted from MSA
 * @returns {Object} The merged/validated single payload of truth
 */
function applyOrderOfPrecedence(sowData, msaData) {
    // Start with MSA as base framework
    const finalContractData = JSON.parse(JSON.stringify(msaData));

    // Override Accessorials / Surcharges dynamically from SOW
    if (sowData.accessorials) {
        finalContractData.accessorials = {
            ...finalContractData.accessorials,
            ...sowData.accessorials
        };
    }

    // Preserve the liability cap from the MSA rigidly
    if (msaData.contract_master_data?.liability_cap && finalContractData.contract_master_data) {
        finalContractData.contract_master_data.liability_cap = msaData.contract_master_data.liability_cap;
    }

    return finalContractData;
}

/**
 * Compliance Enforcement Middleware Simulation
 * Simulates middleware intercepting carrier certifications.
 * If TSA IAC expires, flags properties.
 * 
 * @param {Object} carrierData 
 * @returns {Object} Filtered state of the carrier
 */
function tsaComplianceMiddleware(carrierData) {
    const isExpired = new Date(carrierData.tsa_iac_expiration_date) < new Date();

    if (isExpired) {
        return {
            ...carrierData,
            risk_status: "High Risk/Action Required",
            flagged_reason: "TSA IAC Certification Expired."
        };
    }
    return carrierData;
}

module.exports = {
    evaluateComplianceWatch,
    checkRenewalAlert,
    processPOD,
    applyOrderOfPrecedence,
    tsaComplianceMiddleware
};
