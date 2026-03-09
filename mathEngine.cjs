/**
 * mathEngine.js
 * Contains the computational logic for specific Airfreight/RFS contract parameters.
 */

/**
 * Price Escalation Formula
 * Used for fuel and labor adjustments.
 * Formula: P_{New} = P_{Original} * (Index_{Current} / Index_{Base})
 * 
 * @param {number} pOriginal - Original Price
 * @param {number} indexCurrent - Current Index Value (e.g. National Highway Diesel Fuel Price)
 * @param {number} indexBase - Base Index Value from contract inception
 * @returns {number} The new escalated price
 */
function calculatePriceEscalation(pOriginal, indexCurrent, indexBase) {
    if (!indexBase || indexBase === 0) return pOriginal;
    return pOriginal * (indexCurrent / indexBase);
}

/**
 * Detention & Wait Time Logic
 * Calculates the payable detention based on timestamps and free time.
 * Formula: IF (Departure - Arrival) > Free_Time THEN Billing = (Total_Time - Free_Time) * Detention_Rate
 * 
 * @param {Date|string} arrivalTimestamp - Arrival Time
 * @param {Date|string} departureTimestamp - Departure Time
 * @param {number} freeTimeHours - Free time allowance in hours
 * @param {number} detentionRate - Detention hourly rate
 * @returns {number} Calculated detention billing amount
 */
function calculateDetention(arrivalTimestamp, departureTimestamp, freeTimeHours, detentionRate) {
    const arrival = new Date(arrivalTimestamp);
    const departure = new Date(departureTimestamp);

    // Total time in hours
    const totalTimeHours = (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60);

    if (totalTimeHours > freeTimeHours) {
        const billableHours = totalTimeHours - freeTimeHours;
        return billableHours * detentionRate;
    }
    return 0;
}

/**
 * RFS "Block Space" Billing
 * Calculates billing specifically for RFS_SGHA with "Deadload" logic.
 * Formula: IF contract_type == RFS_SGHA AND billing_mode == "Deadload" THEN Invoice_Amount = Lump_Sum_Flat_Rate
 * 
 * @param {string} contractType - Contract Type Enum (e.g. MSA, RFS_SGHA, BROKER_CARRIER)
 * @param {string} billingMode - Billing mode (e.g. "Deadload", "Per_KG")
 * @param {number} lumpSumFlatRate - The flat rate for the vehicle
 * @param {number} alternativeAmount - The alternative calculated amount (e.g., weight * rate) if not Deadload
 * @returns {number} Computed invoice amount
 */
function calculateRFSBlockSpace(contractType, billingMode, lumpSumFlatRate, alternativeAmount = 0) {
    if (contractType === 'RFS_SGHA' && billingMode === 'Deadload') {
        return lumpSumFlatRate;
    }
    return alternativeAmount;
}

module.exports = {
    calculatePriceEscalation,
    calculateDetention,
    calculateRFSBlockSpace
};
