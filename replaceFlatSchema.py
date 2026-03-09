import re

with open("src/IntegratedApp.jsx", "r") as f:
    text = f.read()

# find the fragment from {(activeTab === 'All' || activeTab === 'Master Data') && (
# until the matching ))}

replacement = """                                        {(activeTab === 'All' || activeTab === 'Master Data') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 mt-2 uppercase tracking-wide">Master Data</h3>

                                                <div className="form-group">
                                                    <label>Contract Type</label>
                                                    <input type="text" placeholder="e.g., MSA, RFS_SGHA..." value={contractData?.contract_type?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.contract_type?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Legal Entity Names</label>
                                                    <textarea rows="2" placeholder="Entities involved..." value={contractData?.legal_entity_names?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.legal_entity_names?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Registered Addresses</label>
                                                    <textarea rows="2" placeholder="Addresses..." value={contractData?.registered_addresses?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.registered_addresses?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Jurisdiction</label>
                                                    <input type="text" placeholder="Governing law state..." value={contractData?.jurisdiction?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.jurisdiction?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Performance Standards</label>
                                                    <textarea rows="2" placeholder="Standards..." value={contractData?.performance_standards?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.performance_standards?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Confidentiality Sunset (Yrs)</label>
                                                    <input type="text" placeholder="Years..." value={contractData?.confidentiality_sunset_period_years?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.confidentiality_sunset_period_years?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>IP Ownership</label>
                                                    <input type="text" placeholder="Ownership..." value={contractData?.intellectual_property_ownership?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.intellectual_property_ownership?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Force Majeure Events</label>
                                                    <textarea rows="3" placeholder="Events..." value={contractData?.force_majeure_events?.value ? contractData.force_majeure_events.value.join(', ') : ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.force_majeure_events?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Notice Period (Days)</label>
                                                    <input type="text" placeholder="Days..." value={contractData?.notice_period_days?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.notice_period_days?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Effective Date</label>
                                                    <input type="text" placeholder="ISO Date..." value={contractData?.term_effective_date?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.term_effective_date?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Termination Date</label>
                                                    <input type="text" placeholder="ISO Date..." value={contractData?.term_termination_date?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.term_termination_date?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Auto Renewal Window (Days)</label>
                                                    <input type="text" placeholder="Days..." value={contractData?.auto_renewal_window_days?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.auto_renewal_window_days?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Liability Cap (Per Incident)</label>
                                                    <input type="text" placeholder="Amount..." value={contractData?.liability_cap_per_incident?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.liability_cap_per_incident?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Liability Limit (Per LB)</label>
                                                    <input type="text" placeholder="Amount..." value={contractData?.liability_limit_per_lb?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.liability_limit_per_lb?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Cargo Insurance Limit</label>
                                                    <input type="text" placeholder="Amount..." value={contractData?.cargo_insurance_limit?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.cargo_insurance_limit?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Auto Liability Limit</label>
                                                    <input type="text" placeholder="Amount..." value={contractData?.auto_liability_limit?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.auto_liability_limit?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>General Liability Limit</label>
                                                    <input type="text" placeholder="Amount..." value={contractData?.general_liability_limit?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.general_liability_limit?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>MC/DOT Number</label>
                                                    <input type="text" placeholder="Prefix with MC..." value={contractData?.mc_dot_number?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.mc_dot_number?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>TSA IAC Cert</label>
                                                    <input type="text" placeholder="XX-0000..." value={contractData?.tsa_iac_cert?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.tsa_iac_cert?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>FMCSA Safety Rating</label>
                                                    <input type="text" placeholder="Rating requirement..." value={contractData?.fmcsa_safety_rating_requirement?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.fmcsa_safety_rating_requirement?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>CBP Bond Value</label>
                                                    <input type="text" placeholder="Bond amount..." value={contractData?.cbp_bond_value?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.cbp_bond_value?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Airport Codes</label>
                                                    <textarea rows="2" placeholder="IATA format..." value={contractData?.airport_codes?.value ? contractData.airport_codes.value.join(', ') : ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.airport_codes?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Non-Circumvention Period (Mos)</label>
                                                    <input type="text" placeholder="Months..." value={contractData?.non_circumvention_prohibition_period_months?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.non_circumvention_prohibition_period_months?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Non-Circumvention Damages</label>
                                                    <input type="text" placeholder="Damages amount..." value={contractData?.non_circumvention_liquidated_damages?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.non_circumvention_liquidated_damages?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Pricing Model Type</label>
                                                    <input type="text" placeholder="Model type..." value={contractData?.pricing_model_type?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.pricing_model_type?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Escalation Threshold (%)</label>
                                                    <input type="text" placeholder="Percentage..." value={contractData?.escalation_trigger_threshold_percentage?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.escalation_trigger_threshold_percentage?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Escalation Index</label>
                                                    <input type="text" placeholder="Index used..." value={contractData?.escalation_index?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.escalation_index?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Status of Parties</label>
                                                    <input type="text" placeholder="Status..." value={contractData?.status_of_parties?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.status_of_parties?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Min Freight Volume Req</label>
                                                    <input type="text" placeholder="Volume minimum..." value={contractData?.freight_volume_requirements_minimum?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.freight_volume_requirements_minimum?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>POD Responsibility</label>
                                                    <textarea rows="2" placeholder="Responsibility details..." value={contractData?.receipts_and_bills_of_lading_pod_responsibility?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.receipts_and_bills_of_lading_pod_responsibility?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Payment Net Days</label>
                                                    <input type="text" placeholder="Net days..." value={contractData?.payment_net_days?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.payment_net_days?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Equipment Warranty Condition</label>
                                                    <textarea rows="2" placeholder="Warranty Details..." value={contractData?.equipment_warranty_condition?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.equipment_warranty_condition?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>CARB Compliance / TRU Reg</label>
                                                    <input type="text" placeholder="Compliance..." value={contractData?.carb_compliance_tru_registration?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.carb_compliance_tru_registration?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                        {(activeTab === 'All' || activeTab === 'Time Surcharges') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Time Surcharges</h3>

                                                <div className="form-group">
                                                    <label>Detention Free Time (Hours)</label>
                                                    <input type="text" placeholder="Hours..." value={contractData?.detention_free_time_hours?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.detention_free_time_hours?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Detention Rate (Hourly)</label>
                                                    <input type="text" placeholder="Hourly rate..." value={contractData?.detention_hourly_rate?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.detention_hourly_rate?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Layover Rate (Daily)</label>
                                                    <input type="text" placeholder="Daily rate..." value={contractData?.layover_daily_rate?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.layover_daily_rate?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>TONU Fee</label>
                                                    <input type="text" placeholder="Truck Order Not Used..." value={contractData?.tonu_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.tonu_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>After Hours / Weekend Delivery Fee</label>
                                                    <input type="text" placeholder="Fee amount..." value={contractData?.after_hours_weekend_delivery_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.after_hours_weekend_delivery_fee?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                        {(activeTab === 'All' || activeTab === 'Asset Surcharges') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Asset Surcharges</h3>

                                                <div className="form-group">
                                                    <label>Liftgate Fee</label>
                                                    <input type="text" placeholder="Liftgate fee..." value={contractData?.liftgate_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.liftgate_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Roller Bed Surcharge</label>
                                                    <input type="text" placeholder="Roller bed fee..." value={contractData?.roller_bed_surcharge?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.roller_bed_surcharge?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Pallet Jack Fee</label>
                                                    <input type="text" placeholder="Pallet jack fee..." value={contractData?.pallet_jack_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.pallet_jack_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Tarping Fee</label>
                                                    <input type="text" placeholder="Tarping fee..." value={contractData?.tarping_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.tarping_fee?.source_snippet)} />
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'All' && <div className="w-full h-px bg-[var(--slate-700)] my-6"></div>}

                                        {(activeTab === 'All' || activeTab === 'Compliance Surcharges') && (
                                            <>
                                                <h3 className="text-[12px] font-bold text-[var(--indigo-500)] mb-4 uppercase tracking-wide">Compliance Surcharges</h3>

                                                <div className="form-group">
                                                    <label>Limited Access Fee</label>
                                                    <input type="text" placeholder="Fee amount..." value={contractData?.limited_access_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.limited_access_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Residential Delivery Fee</label>
                                                    <input type="text" placeholder="Fee amount..." value={contractData?.residential_delivery_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.residential_delivery_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Inside Delivery Fee</label>
                                                    <input type="text" placeholder="Fee amount..." value={contractData?.inside_delivery_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.inside_delivery_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Sort and Segregate Fee</label>
                                                    <input type="text" placeholder="Fee amount..." value={contractData?.sort_and_seg_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.sort_and_seg_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Hazmat Handling</label>
                                                    <input type="text" placeholder="Hazmat fee..." value={contractData?.hazmat_handling_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.hazmat_handling_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Customs Exam Fee</label>
                                                    <input type="text" placeholder="Customs exam fee..." value={contractData?.customs_exam_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.customs_exam_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Reweigh / Reclassification Fee</label>
                                                    <input type="text" placeholder="Fee amount..." value={contractData?.reweigh_and_reclassification_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.reweigh_and_reclassification_fee?.source_snippet)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Security Escort Fee</label>
                                                    <input type="text" placeholder="Fee amount..." value={contractData?.security_escort_fee?.value || ''} readOnly onMouseEnter={() => handleHoverHighlight(contractData?.security_escort_fee?.source_snippet)} />
                                                </div>
                                            </>
                                        )}"""

# We need to find the exact block and replace it
import re

start_flag = "{(activeTab === 'All' || activeTab === 'Master Data') && ("
end_flag = "                                    </>\n                                )}\n                            </div>\n                        </aside>"

start_idx = text.find(start_flag)
end_idx = text.find("</>\n                                )}", start_idx)


if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + replacement + text[end_idx:]
    with open("src/IntegratedApp.jsx", "w") as f:
        f.write(new_text)
    print("Replacement successful")
else:
    print("Could not find blocks")

