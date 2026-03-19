import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  Building2,
  FileText,
  FileCheck,
  CheckCircle,
  Trash2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  UploadCloud,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import "../styles/EmployeeForm.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { getDepartments, getDesignations, getEmployeeTypes, getShifts } from "../../../api/master.api";
import { getLastEmployeeCode, getAvailableCompanyForms } from "../../../api/employees.api";
import { useToast } from "../../../context/ToastContext";
import { useBranch } from "../../../hooks/useBranch"; // Import Hook
import {
  validateEmail,
  validatePhone,
  validateAge,
  validateConfirmationDate,
  validateJoiningDate,
  validateSalary,
  validateExperience,
  validateIFSC,
  validatePAN,
  validateAadhaar,
  validateUAN,
  validateESIC,
  validateFile,
  formatFileSize
} from "../../../utils/validation";

const COUNTRY_CODES = [
  "+91 (India)",
  "+1 (USA)",
  "+44 (UK)",
  "+61 (Australia)",
  "+81 (Japan)",
  "+49 (Germany)",
  "+33 (France)",
  "+86 (China)",
  "+971 (UAE)",
  "+65 (Singapore)",
  "+92 (Pakistan)",
  "+880 (Bangladesh)",
];

// ✅ MUST be outside the component
const DEFAULT_DOCUMENTS = [
  { form_code: "PAN", form_name: "PAN Card" },
  { form_code: "AADHAAR", form_name: "Aadhaar Card" },
  { form_code: "APPLICATION_FORM", form_name: "Application Form" },
  { form_code: "APPOINTMENT_LETTER_HINDI", form_name: "Appointment Letter ( Hindi )" },
  { form_code: "APPOINTMENT_LETTER_ENGLISH", form_name: "Appointment Letter ( English )" },
  { form_code: "JOINING_LETTER", form_name: "Joining Letter" },
  { form_code: "CONFIRMATION_LETTER", form_name: "Confirmation Letter" },
  { form_code: "OFFER_LETTER", form_name: "Offer Letter" },
  { form_code: "History Confirmation Letter", form_name: "History Confirmation Letter" },
  { form_code: "ID", form_name: "ID Card" },
  { form_code: "ESIC FORM 1", form_name: "ESIC FORM 1" },
  { form_code: "EPF FORM 2", form_name: "EPF Form 2" },
  { form_code: "FORM 11", form_name: "Form 11" },
  { form_code: "FORM 16", form_name: "Form 16" },
];


const EmployeeForm = ({ initial, onSave, onClose }) => {
  const isEdit = Boolean(initial);
  const toast = useToast();

  // Use Global Branch Context
  const { branches, selectedBranch } = useBranch();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [shifts, setShifts] = useState([]);
  // const [branches, setBranches] = useState([]); // REMOVED
  const [showPassword, setShowPassword] = useState(false);
  const [companyForms, setCompanyForms] = useState([]);

  // Validation State
  const [errors, setErrors] = useState({});
  const [sameAddress, setSameAddress] = useState(false);

  // Initialize with selectedBranch if available
  const [employeeForm, setEmployeeForm] = useState({
    employee_code: "",
    full_name: "",
    email: "",
    password: "",

    country_code: "+91",
    phone_number: "",

    employee_status: "ACTIVE",

    employee_type_id: "",
    shift_id: "",

    joining_date: "",
    confirmation_date: "",
    notice_period_days: "90",

    experience_years: "",
    salary: "",
    ctc_annual: "",

    job_location: "",
    site_location: "",

    branch_id: selectedBranch || "",
    department_id: "",
    designation_id: "",
  });

  const [profileForm, setProfileForm] = useState({
    gender: "",
    dob: "",
    father_name: "",
    religion: "",
    marital_status: "",
    qualification: "",
    emergency_country_code: "+91",
    emergency_contact_number: "",
    address: "",
    permanent_address: "",

    uan_number: "",
    esic_number: "",
    pan_number: "",
    aadhaar_number: "",

    bank_name: "",
    account_number: "",
    ifsc_code: "",
    bank_branch_name: "",
    profile_photo: null,
  });


  const [documentsForm, setDocumentsForm] = useState({
    files: {},
    existing: [],
  });



  // 1️⃣ Initialize Form for Edit
  useEffect(() => {
    if (!isEdit || !initial) {
      if (!isEdit && selectedBranch && !employeeForm.branch_id) {
        setEmployeeForm(prev => ({ ...prev, branch_id: selectedBranch }));
      }
      return;
    }

    // Handle initial data which might be structured differently
    const ef = initial.employee || initial;
    // In some API responses, bio metadata is inside 'profile', in others it's flattened in 'employee'
    const pf = initial.profile || ef || {}; 
    const docs = initial.documents || [];

    setEmployeeForm({
      employee_code: ef.employee_code || ef.employeeCode || "",
      full_name: ef.full_name || ef.fullName || "",
      email: ef.email || "",
      password: "", // Always empty on edit

      country_code: ef.country_code || ef.countryCode || "+91",
      phone_number: ef.phone_number || ef.phone || "",

      employee_status: ef.employee_status || ef.status || "ACTIVE",

      employee_type_id: ef.employee_type_id || ef.employee_type?.id || "",
      shift_id: ef.shift_id || ef.shift?.id || "",

      joining_date: (ef.joining_date || ef.joiningDate) ? (ef.joining_date || ef.joiningDate).split("T")[0] : "",
      confirmation_date: (ef.confirmation_date || ef.confirmationDate) ? (ef.confirmation_date || ef.confirmationDate).split("T")[0] : "",
      notice_period_days: ef.notice_period_days || ef.noticePeriodDays || "",

      experience_years: ef.experience_years || ef.experienceYears || "",
      salary: ef.salary || "",
      ctc_annual: ef.ctc_annual || ef.ctcAnnual || "",

      job_location: ef.job_location || ef.jobLocation || "",
      site_location: ef.site_location || ef.siteLocation || "",

      branch_id: ef.branch_id || ef.branch?.id || selectedBranch || "",
      department_id: ef.department_id || ef.department?.id || "",
      designation_id: ef.designation_id || ef.designation?.id || "",
    });

    if (pf) {
      const cleanVal = (val) => (val === "UPLOADED" ? "" : (val || ""));

      setProfileForm({
        gender: pf.gender || "",
        dob: pf.dob ? pf.dob.split("T")[0] : "",
        father_name: pf.father_name || pf.fatherName || "",
        religion: pf.religion || "",
        marital_status: pf.marital_status || pf.maritalStatus || "",
        qualification: pf.qualification || "",
        emergency_country_code: pf.emergency_country_code || pf.emergencyCountryCode || "+91",
        emergency_contact_number: pf.emergency_contact_number || pf.emergency_contact || pf.emergencyContact || "",
        address: pf.address || "",
        permanent_address: pf.permanent_address || pf.permanentAddress || "",

        uan_number: cleanVal(pf.uan_number || pf.uanNumber),
        esic_number: cleanVal(pf.esic_number || pf.esicNumber),
        pan_number: cleanVal(pf.pan_number || pf.panNumber),
        aadhaar_number: cleanVal(pf.aadhaar_number || pf.aadhaarNumber),

        bank_name: pf.bank_name || pf.bankName || "",
        account_number: pf.account_number || pf.accountNumber || "",
        ifsc_code: pf.ifsc_code || pf.ifscCode || "",
        bank_branch_name: pf.bank_branch_name || pf.bankBranchName || "",
        profile_photo: null,
      });
    }

    // Map existing docs to the form numbers if needed
    // However, the backend expects 'pan', 'aadhaar' in documentsForm
    // We'll try to find them from the docs array if they are not already in pf (though pf doesn't have them)
    setDocumentsForm({
      files: {},
      existing: docs || [],
    });

  }, [isEdit, initial, selectedBranch]);

  // 2️⃣ Employee Code (only on create)
  useEffect(() => {
    if (isEdit) return;                // no auto code on edit
    if (!employeeForm.branch_id) return; // wait until branch selected

    getLastEmployeeCode(employeeForm.branch_id)
      .then((res) => {
        if (res?.code) {
          setEmployeeForm((prev) => ({
            ...prev,
            employee_code: res.code,
          }));
        }
      })
      .catch((err) => {
        toast.error("Code Generation Error: " + err.message);
      });
  }, [employeeForm.branch_id, isEdit]);

  const dynamicDocuments = companyForms.filter(
    (f) =>
      f.status === "ACTIVE" &&
      !DEFAULT_DOCUMENTS.some((d) => d.form_code === f.form_code)
  );

  const ALL_DOCUMENTS = [...DEFAULT_DOCUMENTS, ...dynamicDocuments];



  useEffect(() => {
    getAvailableCompanyForms()
      .then((res) => {
        // expecting array [{ form_code, form_name, status }]
        setCompanyForms(Array.isArray(res) ? res : res.data || []);
      })
      .catch((err) => {
        toast.error("Forms Load Error: " + err.message);
        setCompanyForms([]);
      });
  }, []);


  // No local branch loading needed, context handles it.



  // 3️⃣ Load departments (when branch changes)
  useEffect(() => {
    if (!employeeForm.branch_id) {
      setDepartments([]);
      return;
    }

    getDepartments(employeeForm.branch_id)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setDepartments(list);
      })
      .catch((err) => {
        toast.error("Dept Load Error: " + err.message);
        setDepartments([]);
      });
  }, [employeeForm.branch_id]);


  // 4️⃣ Load designations (when branch + department changes)
  useEffect(() => {
    if (!employeeForm.branch_id || !employeeForm.department_id) {
      setDesignations([]);
      return;
    }

    getDesignations(
      employeeForm.branch_id,
      employeeForm.department_id
    )
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setDesignations(list);
      })
      .catch((err) => {
        toast.error("Desig Load Error: " + err.message);
        setDesignations([]);
      });
  }, [employeeForm.branch_id, employeeForm.department_id]);


  // 5️⃣ Load employee types & shifts (when branch changes)
  useEffect(() => {
    if (!employeeForm.branch_id) {
      setEmployeeTypes([]);
      setShifts([]);
      return;
    }

    getEmployeeTypes(employeeForm.branch_id)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setEmployeeTypes(list);
      })
      .catch((err) => {
        toast.error("EmpType Load Error: " + err.message);
        setEmployeeTypes([]);
      });

    getShifts(employeeForm.branch_id)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setShifts(list);
      })
      .catch((err) => {
        toast.error("Shifts Load Error: " + err.message);
        setShifts([]);
      });
  }, [employeeForm.branch_id]);



  const handleValidate = (name, value, formType = "employee") => {
    let error = "";

    // Employee Form Validations
    if (formType === "employee") {
      switch (name) {
        case "email":
          error = validateEmail(value);
          break;
        case "phone_number":
          error = value ? validatePhone(value, employeeForm.country_code) : "";
          break;
        case "salary":
          error = value ? validateSalary(value, employeeForm.ctc_annual) : "";
          break;
        case "ctc_annual":
          // Re-validate salary when CTC changes
          const salaryError = employeeForm.salary ? validateSalary(employeeForm.salary, value) : "";
          setErrors(prev => ({ ...prev, salary: salaryError }));
          error = "";
          break;
        case "experience_years":
          error = value ? validateExperience(value) : "";
          break;
        case "confirmation_date":
          error = value ? validateConfirmationDate(value) : "";
          break;
        case "joining_date":
          error = value ? validateJoiningDate(value, employeeForm.confirmation_date) : "";
          break;
        default:
          break;
      }
    }

    // Profile Form Validations
    if (formType === "profile") {
      switch (name) {
        case "dob":
          error = validateAge(value);
          break;
        case "ifsc_code":
          error = value ? validateIFSC(value) : "";
          break;
        case "uan_number":
          error = value ? validateUAN(value) : "";
          break;
        case "esic_number":
          error = value ? validateESIC(value) : "";
          break;
        case "pan_number":
          error = value ? validatePAN(value) : "";
          break;
        case "aadhaar_number":
          error = value ? validateAadhaar(value) : "";
          break;
        default:
          break;
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const changeEmployee = (k, v) => {
    setEmployeeForm(p => ({ ...p, [k]: v }));
    // Clear error on change, or validate on change? 
    // Requirement: "On change → clear errors", "On blur → field validation"
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: "" }));
    }
  };

  const handleBlurEmployee = (k) => {
    handleValidate(k, employeeForm[k], "employee");
  };

  const changeProfile = (k, v) => {
    setProfileForm(p => ({ ...p, [k]: v }));
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: "" }));
    }
  };

  const handleBlurProfile = (k) => {
    handleValidate(k, profileForm[k], "profile");
  };

  // Address Sync Logic
  useEffect(() => {
    if (sameAddress) {
      setProfileForm(prev => ({ ...prev, permanent_address: prev.address }));
    }
  }, [sameAddress, profileForm.address]);

  const toggleSameAddress = (checked) => {
    setSameAddress(checked);
    if (checked) {
      setProfileForm(prev => ({ ...prev, permanent_address: profileForm.address }));
    }
  };


  const handleNext = () => {
    // Validate Step 1 before moving to Step 2
    if (step === 1) {
      if (!employeeForm.branch_id) return toast.error("Please select a branch");
      if (!employeeForm.full_name?.trim()) return toast.error("Full Name is required");
      if (!employeeForm.email?.trim()) return toast.error("Email is required");
      if (errors.email) return toast.error("Please fix email errors");
      if (!employeeForm.joining_date) return toast.error("Joining Date is required");
      if (!employeeForm.department_id) return toast.error("Department is required");
      if (!employeeForm.designation_id) return toast.error("Designation is required");
      if (!isEdit && !employeeForm.password?.trim()) return toast.error("Password is required");
    }

    // Validate Step 2 before moving to Step 3
    if (step === 2) {
      if (!profileForm.dob) return toast.error("Date of Birth is required");
      if (errors.dob) return toast.error("Please fix date of birth errors");
    }

    setStep((prev) => prev + 1);
  };

  const submit = async () => {
    // 1. Full Validation before Submit
    let isValid = true;
    let jumpToStep = null;
    const newErrors = {}; // Collect errors for setErrors later

    // --- Step 1 Validations ---
    if (!employeeForm.branch_id) { isValid = false; toast.error("Branch is required"); jumpToStep = 1; }
    else if (!employeeForm.full_name?.trim()) { isValid = false; toast.error("Full Name is required"); jumpToStep = 1; }
    else if (!employeeForm.email?.trim()) { isValid = false; toast.error("Email is required"); jumpToStep = 1; }
    else if (errors.email) { isValid = false; toast.error("Please fix email format"); jumpToStep = 1; }
    else if (!employeeForm.joining_date) { isValid = false; toast.error("Joining Date is required"); jumpToStep = 1; }
    else if (!employeeForm.department_id) { isValid = false; toast.error("Department is required"); jumpToStep = 1; }
    else if (!employeeForm.designation_id) { isValid = false; toast.error("Designation is required"); jumpToStep = 1; }
    else if (!isEdit && !employeeForm.password?.trim()) { isValid = false; toast.error("Password is required"); jumpToStep = 1; }

    if (!isValid) {
      setStep(jumpToStep);
      return;
    }

    // --- Step 2 Validations ---
    if (!profileForm.dob) { isValid = false; toast.error("Date of Birth is required"); jumpToStep = 2; }
    else if (errors.dob) { isValid = false; toast.error("Invalid Date of Birth"); jumpToStep = 2; }

    if (!isValid) {
      setStep(jumpToStep);
      return;
    }

    // --- Step 3 Validations ---
    const mandatoryDocs = ["PAN", "AADHAAR"];
    for (const code of mandatoryDocs) {
      const isUploaded = documentsForm.files[code];
      const isExisting = documentsForm.existing?.some(d => (d.document_type || d.type) === code);
      if (!isUploaded && !isExisting) {
        isValid = false;
        toast.error(`Missing Document: ${code === 'PAN' ? 'PAN Card' : 'Aadhaar Card'}`);
        jumpToStep = 3;
        break;
      }
    }

    if (!isValid) {
      setStep(jumpToStep);
      return;
    }

    // --- Format Validations check (from errors state) ---
    // Re-run all validations to ensure `errors` state is up-to-date for all fields
    const empFields = ["email", "phone", "salary", "joining_date"]; // Mandatory check
    empFields.forEach(f => {
      const err = handleValidate(f, employeeForm[f], "employee");
      if (err) {
        newErrors[f] = err;
        isValid = false;
      }
    });

    const profFields = ["dob", "ifsc_code", "uan_number", "pan_number", "aadhaar_number", "esic_number"];
    profFields.forEach(f => {
      // For statutory fields, only block if there's an actual error string in state
      // handleValidate already handles the empty value logic now
      const err = handleValidate(f, profileForm[f], "profile");
      if (err) {
        newErrors[f] = err;
        isValid = false;
      }
    });

    if (!isValid) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      toast.error("Please fix invalid fields highlighted in red");

      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector(".error-border, .error-text");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    setIsSaving(true);
    try {
      // Build FormData
      const formData = new FormData();

      // JSON parts
      const employeeData = {
        ...employeeForm,
        employee_type_id: employeeForm.employee_type_id ? Number(employeeForm.employee_type_id) : null,
        shift_id: employeeForm.shift_id ? Number(employeeForm.shift_id) : null,
        branch_id: employeeForm.branch_id ? Number(employeeForm.branch_id) : null,
        department_id: employeeForm.department_id ? Number(employeeForm.department_id) : null,
        designation_id: employeeForm.designation_id ? Number(employeeForm.designation_id) : null,
        salary: employeeForm.salary !== "" ? Number(employeeForm.salary) : null,
        ctc_annual: employeeForm.ctc_annual !== "" ? Number(employeeForm.ctc_annual) : null,
        experience_years: employeeForm.experience_years !== "" ? Number(employeeForm.experience_years) : null,
        notice_period_days: employeeForm.notice_period_days !== "" ? Number(employeeForm.notice_period_days) : null,
      };

      if (isEdit) {
        delete employeeData.password;
      }

      formData.append("employeeForm", JSON.stringify(employeeData));

      // Clean profile form: remove File object before stringifying
      const profileData = { ...profileForm };
      delete profileData.profile_photo;
      formData.append("profileForm", JSON.stringify(profileData));

      // Build documentsForm
      const documentsMeta = {};

      // 1. Include existing documents so they are not deleted on PUT
      (documentsForm.existing || []).forEach(doc => {
        const type = doc.document_type || doc.type;
        if (type && type !== 'profile_photo') {
          documentsMeta[type] = "UPLOADED";
        }
      });

      // 2. Mark newly uploaded files
      Object.keys(documentsForm.files || {}).forEach((key) => {
        documentsMeta[key] = "UPLOADED";
      });

      // 🔥 THIS LINE WAS MISSING
      formData.append("documentsForm", JSON.stringify(documentsMeta));



      // Profile Photo
      if (profileForm.profile_photo instanceof File) {
        formData.append("profile_photo", profileForm.profile_photo);
      }

      // Dynamic Files from documentsForm.files
      Object.entries(documentsForm.files || {}).forEach(([type, file]) => {
        if (file instanceof File) {
          formData.append(type, file);
        }
      });

      await onSave(formData);
      // toast is handled in parent handleSave or can be handled here if we await it 
    } catch (err) {
      toast.error(err.message || "Failed to save employee");
    } finally {
      setIsSaving(false);
    }
  };


  const FileField = ({ label, field, accept }) => {
    const existing = documentsForm.existing?.find(d => (d.document_type || d.type) === field);
    const uploadedFile = documentsForm.files?.[field];
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const err = validateFile(file);
      if (err) return toast.error(err);
      setDocumentsForm((p) => ({
        ...p,
        files: { ...p.files, [field]: file },
      }));
    };

    const removeFile = (e) => {
      e.stopPropagation();
      setDocumentsForm((p) => {
        const newFiles = { ...p.files };
        delete newFiles[field];
        // Also remove from existing list to "clear" it from UI
        const newExisting = p.existing?.filter(d => (d.document_type || d.type) !== field);
        return { ...p, files: newFiles, existing: newExisting };
      });
      const el = document.getElementById(`file-input-${field}`);
      if (el) el.value = "";
    };

    return (
      <div
        className={`file-field-container ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id={`file-input-${field}`}
          type="file"
          accept={accept}
          className="hidden-file-input"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const err = validateFile(file);
            if (err) return toast.error(err);
            setDocumentsForm((p) => ({
              ...p,
              files: { ...p.files, [field]: file },
            }));
          }}
        />

        <div
          className="file-trigger-zone"
          onClick={() => {
            const el = document.getElementById(`file-input-${field}`);
            if (el) el.click();
          }}
        >
          {!uploadedFile && !existing && (
            <>
              <div className="file-field-icon"><Upload size={24} /></div>
              <div className="file-label">{label}</div>
              <div className="file-placeholder">Click or drag to upload</div>
            </>
          )}

          {(uploadedFile || existing) && (
            <div className="file-details">
              <div className="file-field-icon">
                {uploadedFile ? <FileText size={26} /> : <FileText size={26} style={{ opacity: 0.6 }} />}
              </div>
              <div className="file-name">
                {uploadedFile ? uploadedFile.name : (existing.original_name || existing.filename || "Existing Document")}
              </div>
              {uploadedFile && (
                <div className="file-size">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
          )}
        </div>

        {(uploadedFile || existing) && (
          <div className="file-field-actions" onClick={(e) => e.stopPropagation()}>
            {existing && (
              <a
                href={existing.file_url || existing.view_url || existing.url || existing.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="view-link"
              >
                View
              </a>
            )}
            <button
              type="button"
              className="replace-btn"
              onClick={() => {
                const el = document.getElementById(`file-input-${field}`);
                if (el) el.click();
              }}
            >
              {uploadedFile ? "Change" : "Replace"}
            </button>
            {(uploadedFile || existing) && (
              <button
                type="button"
                className="remove-btn-danger"
                onClick={removeFile}
                title="Remove Selection"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="emp-modal-backdrop">
      <div className="emp-modal">
        <div className="emp-modal-header">
          <h3>{isEdit ? "Edit Employee" : "Add Employee"}</h3>
          <span>Step {step} / 3</span>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="emp-step-tabs">
          <div
            className={step === 1 ? "step active" : "step"}
            onClick={() => !isSaving && setStep(1)}
          >
            <User /> Employee
          </div>
          <div
            className={step === 2 ? "step active" : "step"}
            onClick={() => !isSaving && setStep(2)}
          >
            <Building2 /> Bio Data
          </div>
          <div
            className={step === 3 ? "step active" : "step"}
            onClick={() => setStep(3)}
          >
            <FileText /> Documents
          </div>
        </div>

        {step === 1 && (
          <div className="emp-form-section">
            <h4>Employee & Login Information</h4>

            <div className="form-grid">
              <div>
                <label>Branch *</label>
                <select
                  value={employeeForm.branch_id}
                  onChange={(e) =>
                    changeEmployee("branch_id", e.target.value)
                  }
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Employee Code + Status */}
            <div className="form-grid">
              <div>
                <label>Employee Code *</label>
                <input
                  placeholder="Auto-generated or enter manually"
                  value={employeeForm.employee_code}
                  onChange={(e) => changeEmployee("employee_code", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label>Employee Status</label>
                <select
                  value={employeeForm.employee_status}
                  onChange={(e) =>
                    changeEmployee("employee_status", e.target.value)
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* Name + Email */}
            <label>Full Name (As per Govt ID) *</label>
            <input
              placeholder="Employee full name"
              value={employeeForm.full_name}
              onChange={(e) =>
                changeEmployee("full_name", e.target.value)
              }
            />

            <label>Email * <span className="helper-text">Use official email address</span></label>
            <input
              className={errors.email ? "error-border" : ""}
              placeholder="employee@email.com"
              value={employeeForm.email}
              onChange={(e) =>
                changeEmployee("email", e.target.value)
              }
              onBlur={() => handleBlurEmployee("email")}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}

            <div className="phone-input-wrapper-premium">
              <label>Phone Number * <span className="helper-text">Official mobile number</span></label>
              <PhoneInput
                country={"in"}
                value={`${employeeForm.country_code}${employeeForm.phone_number}`}
                onChange={(value, country) => {
                  const dialCode = `+${country.dialCode}`;
                  const number = value.startsWith(country.dialCode)
                    ? value.slice(country.dialCode.length)
                    : value;
                  changeEmployee("country_code", dialCode);
                  changeEmployee("phone_number", number);
                }}
                onBlur={() => handleBlurEmployee("phone_number")}
                containerClass={errors.phone_number ? "phone-error" : ""}
                inputStyle={{ width: "100%", height: "45px", borderRadius: "8px", border: errors.phone_number ? "1px solid #ef4444" : "1px solid #e2e8f0" }}
                buttonStyle={{ borderRadius: "8px 0 0 8px", border: errors.phone_number ? "1px solid #ef4444" : "1px solid #e2e8f0" }}
              />
              {errors.phone_number && <span className="error-text">{errors.phone_number}</span>}
            </div>

            {/* Password (Create only) */}
            {!isEdit && (
              <>
                <label>Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={employeeForm.password}
                    onChange={(e) =>
                      changeEmployee("password", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </>
            )}
            {/* Org Mapping */}


            {/* Type + Shift */}
            <div className="form-grid">
              <div>
                <label>Employee Type</label>
                <select
                  value={employeeForm.employee_type_id}
                  onChange={(e) =>
                    changeEmployee("employee_type_id", e.target.value)
                  }
                >
                  <option value="">Select Employee Type</option>
                  {employeeTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.type_name || type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Shift</label>
                <select
                  value={employeeForm.shift_id}
                  onChange={(e) =>
                    changeEmployee("shift_id", e.target.value)
                  }
                >
                  <option value="">Select Shift</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shift_name || shift.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="form-grid">

              <div>
                <label>Confirmation Date</label>
                <input
                  className={errors.confirmation_date ? "error-border" : ""}
                  type="date"
                  value={employeeForm.confirmation_date}
                  onChange={(e) =>
                    changeEmployee("confirmation_date", e.target.value)
                  }
                  onBlur={() => handleBlurEmployee("confirmation_date")}
                />
                {errors.confirmation_date && <span className="error-text">{errors.confirmation_date}</span>}
              </div>

              <div>
                <label>Joining Date *</label>
                <input
                  className={errors.joining_date ? "error-border" : ""}
                  type="date"
                  value={employeeForm.joining_date}
                  onChange={(e) =>
                    changeEmployee("joining_date", e.target.value)
                  }
                  onBlur={() => handleBlurEmployee("joining_date")}
                />
                {errors.joining_date && <span className="error-text">{errors.joining_date}</span>}
              </div>
            </div>

            {/* Salary */}
            <div className="form-grid">
              <div>
                <label>Salary (Monthly) <span className="helper-text">CTC must be ≥ Salary</span></label>
                <input
                  className={errors.salary ? "error-border" : ""}
                  type="number"
                  placeholder="e.g. 25000"
                  value={employeeForm.salary}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < 0) return toast.warning("Negative values are not allowed");
                    changeEmployee("salary", e.target.value);
                  }}
                  onBlur={() => handleBlurEmployee("salary")}
                />
                {errors.salary && <span className="error-text">{errors.salary}</span>}
              </div>
              <div>
                <label>CTC (Annual)</label>
                <input
                  className={errors.ctc_annual ? "error-border" : ""}
                  type="number"
                  placeholder="e.g. 300000"
                  value={employeeForm.ctc_annual}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < 0) return toast.warning("Negative values are not allowed");
                    changeEmployee("ctc_annual", e.target.value);
                  }}
                  onBlur={() => handleBlurEmployee("ctc_annual")}
                />
                {errors.ctc_annual && <span className="error-text">{errors.ctc_annual}</span>}
              </div>
            </div>

            {/* Experience */}
            <div className="form-grid">
              <div>
                <label>Experience (Years)</label>
                <input
                  className={errors.experience_years ? "error-border" : ""}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={employeeForm.experience_years}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < 0) return toast.warning("Negative values are not allowed");
                    changeEmployee("experience_years", e.target.value);
                  }}
                  onBlur={() => handleBlurEmployee("experience_years")}
                />
                {errors.experience_years && <span className="error-text">{errors.experience_years}</span>}
              </div>
              <div>
                <label>Notice Period (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={employeeForm.notice_period_days}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < 0) return toast.warning("Negative values are not allowed");
                    changeEmployee("notice_period_days", e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Location */}
            <div className="form-grid">
              <div>
                <label>Job Location</label>
                <input
                  placeholder="e.g. Head Office"
                  value={employeeForm.job_location}
                  onChange={(e) =>
                    changeEmployee("job_location", e.target.value)
                  }
                />
              </div>
              <div>
                <label>Site Location</label>
                <input
                  placeholder="e.g. Branch Site A"
                  value={employeeForm.site_location}
                  onChange={(e) =>
                    changeEmployee("site_location", e.target.value)
                  }
                />
              </div>
            </div>



            <div className="form-grid">
              <div>
                <label>Department *</label>
                <select
                  value={employeeForm.department_id}
                  onChange={(e) =>
                    changeEmployee("department_id", e.target.value)
                  }
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.department_name || d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Designation *</label>
                <select
                  value={employeeForm.designation_id}
                  onChange={(e) =>
                    changeEmployee("designation_id", e.target.value)
                  }
                >
                  <option value="">Select Designation</option>
                  {designations.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.designation_name || g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}


        {step === 2 && (
          <div className="emp-form-section">
            <h4>Personal Information</h4>

            <div className="form-grid">
              <div>
                <label>Gender</label>
                <select
                  value={profileForm.gender}
                  onChange={(e) =>
                    changeProfile("gender", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label>Date of Birth *</label>
                <input
                  className={errors.dob ? "error-border" : ""}
                  type="date"
                  value={profileForm.dob}
                  onChange={(e) =>
                    changeProfile("dob", e.target.value)
                  }
                  onBlur={() => handleBlurProfile("dob")}
                />
                {errors.dob && <span className="error-text">{errors.dob}</span>}
              </div>
            </div>

            <label>Father's Name</label>
            <input
              placeholder="As per documents"
              value={profileForm.father_name}
              onChange={(e) =>
                changeProfile("father_name", e.target.value)
              }
            />

            <div className="form-grid">
              <div>
                <label>Religion</label>
                <input
                  placeholder="e.g. Hindu / Muslim / Christian"
                  value={profileForm.religion}
                  onChange={(e) =>
                    changeProfile("religion", e.target.value)
                  }
                />
              </div>

              <div>
                <label>Marital Status</label>
                <select
                  value={profileForm.marital_status}
                  onChange={(e) =>
                    changeProfile("marital_status", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option>Single</option>
                  <option>Married</option>
                </select>
              </div>
            </div>

            <label>Qualification</label>
            <input
              placeholder="e.g. MBA / B.Tech / Graduation"
              value={profileForm.qualification}
              onChange={(e) =>
                changeProfile("qualification", e.target.value)
              }
            />

            <div className="phone-input-wrapper-premium" style={{ marginBottom: '1.5rem' }}>
              <label>Emergency Contact Number</label>
              <PhoneInput
                country={"in"}
                value={`${profileForm.emergency_country_code}${profileForm.emergency_contact_number}`}
                onChange={(value, country) => {
                  const dialCode = `+${country.dialCode}`;
                  const number = value.startsWith(country.dialCode)
                    ? value.slice(country.dialCode.length)
                    : value;
                  changeProfile("emergency_country_code", dialCode);
                  changeProfile("emergency_contact_number", number);
                }}
                inputStyle={{ width: "100%", height: "45px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                buttonStyle={{ borderRadius: "8px 0 0 8px", border: "1px solid #e2e8f0" }}
              />
              <p className="helper-text" style={{ marginTop: '4px' }}>Provide a number reachable 24/7 for emergencies</p>
            </div>

            <label>Address</label>
            <textarea
              placeholder="Current address"
              value={profileForm.address}
              onChange={(e) =>
                changeProfile("address", e.target.value)
              }
            />

            <div className="address-header">
              <label>Permanent Address</label>
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="sameAddress"
                  checked={sameAddress}
                  onChange={(e) => toggleSameAddress(e.target.checked)}
                />
                <label htmlFor="sameAddress">Same as Current Address</label>
              </div>
            </div>
            <textarea
              placeholder="Full permanent address"
              value={profileForm.permanent_address}
              onChange={(e) =>
                changeProfile("permanent_address", e.target.value)
              }
              disabled={sameAddress}
            />

            <label>Profile Picture</label>
            <div className="upload-inline profile-upload-box">
              <div className="preview-bubble">
                {profileForm.profile_photo ? (
                  <img
                    src={URL.createObjectURL(profileForm.profile_photo)}
                    alt="Preview"
                  />
                ) : (initial?.profile?.profile_photo_url || initial?.employee?.profile_photo_url || initial?.profile?.profile_photo || initial?.employee?.profile_photo) ? (
                  <img src={initial.profile?.profile_photo_url || initial.employee?.profile_photo_url || initial.profile?.profile_photo || initial.employee?.profile_photo} alt="Current" />
                ) : (
                  <div className="no-photo">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
              <div className="upload-controls">
                <input
                  type="file"
                  id="profile-photo-input"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      changeProfile("profile_photo", file);
                    }
                  }}
                />
                <label htmlFor="profile-photo-input" className="file-upload-label">
                  <Upload size={16} /> {profileForm.profile_photo ? "Change Photo" : initial?.profile?.profile_photo ? "Replace Photo" : "Upload Photo"}
                </label>
                {profileForm.profile_photo && (
                  <span className="file-ready-text">{profileForm.profile_photo.name}</span>
                )}
              </div>
            </div>

            <h4>Bank Details</h4>

            <label>Bank Name</label>
            <input
              placeholder="e.g. State Bank of India"
              value={profileForm.bank_name}
              onChange={(e) =>
                changeProfile("bank_name", e.target.value)
              }
            />

            <div className="form-grid">
              <div>
                <label>Account Number</label>
                <input
                  placeholder="Enter full account number"
                  value={profileForm.account_number}
                  onChange={(e) =>
                    changeProfile("account_number", e.target.value)
                  }
                  onBlur={() => handleBlurProfile("account_number")}
                />
                {errors.account_number && <span className="error-text">{errors.account_number}</span>}
              </div>

              <div>
                <label>IFSC Code</label>
                <input
                  className={errors.ifsc_code ? "error-border" : ""}
                  placeholder="e.g., SBIN0123456"
                  value={profileForm.ifsc_code}
                  onChange={(e) =>
                    changeProfile(
                      "ifsc_code",
                      e.target.value.toUpperCase()
                    )
                  }
                  onBlur={() => handleBlurProfile("ifsc_code")}
                />
                {errors.ifsc_code && <span className="error-text">{errors.ifsc_code}</span>}
              </div>
            </div>

            <label>Bank Branch Name</label>
            <input
              placeholder="City or Branch name"
              value={profileForm.bank_branch_name}
              onChange={(e) =>
                changeProfile("bank_branch_name", e.target.value)
              }
            />
          </div>
        )}


        {step === 3 && (
          <div className="emp-form-section">
            <h4>Statutory Information</h4>

            {/* ===== Document Numbers ===== */}
            <div className="form-grid">
              <div>
                <label>UAN Number</label>
                <input
                  className={errors.uan_number ? "error-border" : ""}
                  placeholder="Universal Account Number"
                  value={profileForm.uan_number}
                  onChange={(e) =>
                    changeProfile("uan_number", e.target.value.replace(/\D/g, ""))
                  }
                  onBlur={() => handleBlurProfile("uan_number")}
                />
                {errors.uan_number && <span className="error-text">{errors.uan_number}</span>}
              </div>

              <div>
                <label>ESIC Number</label>
                <input
                  className={errors.esic_number ? "error-border" : ""}
                  placeholder="ESIC Insurance Number"
                  value={profileForm.esic_number}
                  onChange={(e) =>
                    changeProfile("esic_number", e.target.value)
                  }
                  onBlur={() => handleBlurProfile("esic_number")}
                />
                {errors.esic_number && <span className="error-text">{errors.esic_number}</span>}
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label>PAN Number</label>
                <input
                  className={errors.pan_number ? "error-border" : ""}
                  placeholder="e.g., ABCDE1234F"
                  value={profileForm.pan_number || ""}
                  onChange={(e) =>
                    changeProfile("pan_number", e.target.value.toUpperCase())
                  }
                  onBlur={() => handleBlurProfile("pan_number")}
                />
                {errors.pan_number && <span className="error-text">{errors.pan_number}</span>}
              </div>

              <div>
                <label>Aadhaar Number</label>
                <input
                  className={errors.aadhaar_number ? "error-border" : ""}
                  maxLength={12}
                  placeholder="12 digit number"
                  value={profileForm.aadhaar_number || ""}
                  onChange={(e) =>
                    changeProfile("aadhaar_number", e.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                  onBlur={() => handleBlurProfile("aadhaar_number")}
                />
                {errors.aadhaar_number && <span className="error-text">{errors.aadhaar_number}</span>}
              </div>
            </div>

            <h4>Upload Documents</h4>

            <div className="document-grid">
              {ALL_DOCUMENTS.map((doc) => (
                <div key={doc.form_code} className="document-item">
                  <label>{doc.form_name}</label>
                  <FileField
                    label={`Upload ${doc.form_name}`}
                    field={doc.form_code}
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                  />
                </div>
              ))}
            </div>
          </div>
        )}




        <div className="emp-form-footer">
          <div className="footer-left">
            <button className="btn-secondary" onClick={onClose} disabled={isSaving}>
              <XCircle size={18} /> Cancel
            </button>
            {step > 1 && (
              <button
                className="btn-secondary"
                onClick={() => setStep(step - 1)}
                disabled={isSaving}
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
          </div>

          <div className="footer-right">
            {step < 3 && (
              <button className="btn-primary" onClick={handleNext} disabled={isSaving}>
                Next <ChevronRight size={18} />
              </button>
            )}

            {step === 3 && (
              <button className="btn-primary" onClick={submit} disabled={isSaving}>
                <CheckCircle size={18} /> {isSaving ? "Saving..." : isEdit ? "Update" : "Save"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeForm;
