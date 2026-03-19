export const FORMS_CONFIG = {
    pf: {
        id: "pf",
        title: "Provident Fund",
        subtitle: "Compliance forms for Employee Provident Fund contributions.",
        showEligibility: true,
        eligibilityKey: "pfEligible",
        allowMissingState: true,
        emptyStateText: "No employees eligible for PF contributions."
    },
    esic: {
        id: "esic",
        title: "ESIC Forms",
        subtitle: "Employee State Insurance Corporation compliance documents.",
        showEligibility: true,
        eligibilityKey: "esicEligible",
        allowMissingState: true,
        emptyStateText: "No employees eligible for ESIC registration."
    },
    "income-tax": {
        id: "income-tax",
        title: "Income Tax",
        subtitle: "Annual tax deduction certificates for employees.",
        showEligibility: false,
        allowMissingState: false,
        emptyStateText: "No Form-16 documents generated for current financial year.",
        columns: ["employee_code", "name", "department", "year", "actions"]
    },
    bonus: {
        id: "bonus",
        title: "Bonus Act",
        subtitle: "Statutory bonus calculation and payment records.",
        showEligibility: true,
        eligibilityKey: "pfEligible", // Usually bonus follows PF eligibility or custom
        allowMissingState: true,
        emptyStateText: "No employees eligible for statutory bonus."
    },
    labour: {
        id: "labour",
        title: "Labour Law",
        subtitle: "Registers and returns under various Labour Laws.",
        showEligibility: false,
        allowMissingState: true,
        emptyStateText: "No labour compliance records found."
    },
    factories: {
        id: "factories",
        title: "Factories Act",
        subtitle: "Maintenance and safety compliance forms for factory premises.",
        showEligibility: false,
        allowMissingState: true,
        emptyStateText: "No factory compliance records found."
    },
    gratuity: {
        id: "gratuity",
        title: "Gratuity Act",
        subtitle: "Payment of Gratuity records and nominations.",
        showEligibility: false,
        allowMissingState: true,
        emptyStateText: "No gratuity compliance records found."
    }
};
