export const PATTERNS = {
    EMAIL: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    PHONE: /^\d+$/,
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    AADHAAR: /^\d{12}$/,
    UAN: /^\d{12}$/,
    IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    // Simple check for numbers, can be refined based on specific bank rules if needed
    ACCOUNT_NUMBER: /^\d{9,18}$/,
};

export const validateEmail = (email) => {
    if (!email) return "Email is required";
    if (!PATTERNS.EMAIL.test(email)) return "Invalid email address";
    return "";
};

export const validatePhone = (phone, countryCode) => {
    if (!phone) return "Phone number is required";
    if (!PATTERNS.PHONE.test(phone)) return "Phone must contain digits only";

    // +91 specific check
    if (countryCode?.includes("+91")) {
        if (phone.length !== 10) return "Indian numbers must be exactly 10 digits";
    } else {
        if (phone.length < 6 || phone.length > 15) return "Phone number must be between 6 and 15 digits";
    }
    return "";
};

export const validateAge = (dob) => {
    if (!dob) return "Date of Birth is required";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age < 18) return "Employee must be at least 18 years old";
    return "";
};

export const validateConfirmationDate = (date) => {
    if (!date) return ""; // Optional field? If required, caller handles "required" check or we return "" if empty and let required check handle it.
    // Requirement: Allow only dates from current month onward
    // This is strict. Let's interpret "from current month onward" as:
    // Any date in the current month or future months. 
    // Past months are invalid.

    const d = new Date(date);
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Reset time for comparison
    d.setHours(0, 0, 0, 0);

    if (d < currentMonthStart) return "Date cannot be in a past month";
    return "";
};

export const validateJoiningDate = (joiningDate, confirmationDate) => {
    if (!joiningDate) return "Joining Date is required";
    if (confirmationDate) {
        const join = new Date(joiningDate);
        const confirm = new Date(confirmationDate);
        join.setHours(0, 0, 0, 0);
        confirm.setHours(0, 0, 0, 0);

        // Requirement: Joining date must be SAME AS or AFTER confirmation date?
        // Usually it's the other way around: You join, THEN you get confirmed.
        // "Joining date must be same as or after confirmation date" <-- This request seems backwards for standard HR logic?
        // Standard: Joining -> Probation -> Confirmation. So Confirmation >= Joining.
        // Request: "Joining date must be same as or after confirmation date"
        // Wait, maybe I misread.
        // Request text: "Joining date must be same as or after confirmation date"
        // IF this is literally the requirement, I will implement it. 
        // BUT, commonly Validation is: Confirmation Date cannot be BEFORE Joining Date.
        // let's re-read carefully: "Joining date must be same as or after confirmation date"
        // That implies Confirmation comes FIRST. That is weird.
        // However, I must follow constraints.
        // WARNING: I will implement strictly as requested but this sounds like a typo in requirements.
        // ... Actually, usually Confirmation Date (of employment offering) is separate from Confirmation (Probation end).
        // Let's assume standard logic: Joining Date <= Confirmation Date (Probation End).
        // Let's look at the constraint "Prevent selection of earlier dates".
        // Maybe it meant "Confirmation date must be same or after Joining Date"?
        // I'll stick to logic that makes sense: JOINING happens first. CONFIRMATION happens later.
        // So Confirmation >= Joining.
        // If requirement says "Joining >= Confirmation", that implies Confirmation is "Offer Confirmation"?
        // Let's look at requirement 3: "Allow only dates from current month onward" for Confirmation Date.
        // Let's look at requirement 4: "Joining date must be same as or after confirmation date"
        // Combining them: Confirmation (this month+) <= Joining.
        // This implies a logical flow of "Confirmed Offer" -> "Join".
        // Okay, I will implement: Joining >= Confirmation.

        if (join < confirm) return "Joining Date cannot be before Confirmation Date";
    }
    return "";
};

export const validateSalary = (salary, ctc) => {
    if (salary && Number(salary) < 0) return "Salary cannot be negative";
    if (salary && ctc && Number(salary) > Number(ctc)) return "Salary cannot be greater than CTC";
    return "";
};

export const validateExperience = (years) => {
    if (years === "" || years === null) return ""; // Optional?
    const y = Number(years);
    if (isNaN(y)) return "Must be a number";
    if (y < 0) return "Experience cannot be negative";
    if (y > 100) return "Experience cannot exceed 100 years";
    return "";
};

export const validateIFSC = (code) => {
    if (!code) return "";
    if (code.length !== 11) return "IFSC must be exactly 11 characters";
    if (!PATTERNS.IFSC.test(code)) return "Invalid IFSC format (e.g., SBIN0123456)";
    return "";
};

export const validatePAN = (pan) => {
    if (!pan) return "";
    if (!PATTERNS.PAN.test(pan)) return "Invalid PAN format (e.g., ABCDE1234F)";
    return "";
};

export const validateAadhaar = (num) => {
    if (!num) return "";
    if (!PATTERNS.AADHAAR.test(num)) return "Aadhaar must be exactly 12 digits";
    return "";
};

export const validateUAN = (uan) => {
    if (!uan) return "";
    if (!PATTERNS.UAN.test(uan)) return "UAN must be exactly 12 digits";
    return "";
};

export const validateESIC = (esic) => {
    if (!esic) return "";
    const reg = /^\d{10,17}$/;
    if (!reg.test(esic)) return "ESIC must be between 10-17 digits";
    return "";
};

export const validateFile = (file) => {
    if (!file) return "";
    const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
        "application/vnd.ms-excel" // xls
    ];
    if (!validTypes.includes(file.type)) return "Invalid file type (PDF, JPG, PNG, XLS/XLSX only)";

    // 5MB limit example (adjust as needed)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) return "File size exceeds 5MB";

    return "";
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
