import { api, API_BASE } from "./api";


export { API_BASE };

/* ===================================================================================
   BRANCHES
   =================================================================================== */
export const getBranches = () =>
  api("/api/branches");

export const createBranch = (data) =>
  api("/api/branches", { method: "POST", body: JSON.stringify(data) });

export const updateBranch = (id, data) =>
  api(`/api/branches/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const toggleBranchStatus = (id) =>
  api(`/api/branches/${id}/status`, { method: "PATCH" });

export const deleteBranch = (id) =>
  api(`/api/branches/${id}`, { method: "DELETE" });


/* ===================================================================================
   DEPARTMENTS
   Query Param: branch_id (Required)
   =================================================================================== */
export const getDepartments = (branchId) =>
  api(`/api/departments?branch_id=${branchId}`);

export const createDepartment = (data) =>
  api("/api/departments", { method: "POST", body: JSON.stringify(data) });

export const updateDepartment = (id, data) =>
  api(`/api/departments/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteDepartment = (id) =>
  api(`/api/departments/${id}`, { method: "DELETE" });


/* ===================================================================================
   DESIGNATIONS
   Query Params: branch_id (Required), department_id (Required)
   =================================================================================== */
export const getDesignations = (branchId, departmentId) =>
  api(`/api/designations?branch_id=${branchId}&department_id=${departmentId}`);

export const createDesignation = (data) =>
  api("/api/designations", { method: "POST", body: JSON.stringify(data) });

export const updateDesignation = (id, data) =>
  api(`/api/designations/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const toggleDesignationStatus = (id) =>
  api(`/api/designations/${id}/status`, { method: "PATCH" });

export const deleteDesignation = (id) =>
  api(`/api/designations/${id}`, { method: "DELETE" });


/* ===================================================================================
   EMPLOYEE TYPES
   Query Param: branch_id (Required)
   =================================================================================== */
export const getEmployeeTypes = (branchId) =>
  api(`/api/employee-types?branch_id=${branchId}`);

export const createEmployeeType = (data) =>
  api("/api/employee-types", { method: "POST", body: JSON.stringify(data) });

export const updateEmployeeType = (id, data) =>
  api(`/api/employee-types/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const toggleEmployeeTypeStatus = (id) =>
  api(`/api/employee-types/${id}/status`, { method: "PATCH" });

export const deleteEmployeeType = (id) =>
  api(`/api/employee-types/${id}`, { method: "DELETE" });


/* ===================================================================================
   SHIFTS
   Query Param: branch_id (Required)
   =================================================================================== */
export const getShifts = (branchId) =>
  api(`/api/shifts?branch_id=${branchId}`);

export const createShift = (data) =>
  api("/api/shifts", { method: "POST", body: JSON.stringify(data) });

export const updateShift = (id, data) =>
  api(`/api/shifts/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const toggleShiftStatus = (id) =>
  api(`/api/shifts/${id}/status`, { method: "PATCH" });

export const deleteShift = (id) =>
  api(`/api/shifts/${id}`, { method: "DELETE" });



/* ===================================================================================
   HR AUTHENTICATION (PUBLIC)
   =================================================================================== */
export const hrPreLogin = (data) =>
  api("/api/hr/pre-login", { method: "POST", body: JSON.stringify(data) });

export const hrVerifyOtp = (data) =>
  api("/api/hr/verify-otp", { method: "POST", body: JSON.stringify(data) });


/* ===================================================================================
   HR MANAGEMENT (ADMIN ONLY)
   =================================================================================== */
export const getHRList = () =>
  api("/api/hr");

export const getHRDetails = (hrId) =>
  api(`/api/hr/${hrId}`);

export const createHR = (data) =>
  api("/api/hr", { method: "POST", body: JSON.stringify(data) });

export const updateHR = (id, data) =>
  api(`/api/hr/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const toggleHRStatus = (id) =>
  api(`/api/hr/${id}/status`, { method: "PATCH" });

export const deleteHR = (id) =>
  api(`/api/hr/${id}`, { method: "DELETE" });


/* ===================================================================================
   HR PERMISSIONS (ADMIN ONLY)
   =================================================================================== */

/**
 * Get permission setup for an HR user
 */
export const getHRPermissions = (hrId) =>
  api(`/api/hr-permissions/${hrId}`);

/**
 * Save / Update / Reset all permissions for an HR
 * Payload: { permissions: [{ module_key: "...", allowed: 1 }, ...] }
 */
export const saveHRPermissions = (hrId, payload) =>
  api(`/api/hr-permissions/${hrId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });



/* ===================================================================================
 ADMIN – ATTENDANCE (UPGRADED)
 =================================================================================== */

/* 🔹 DAILY ATTENDANCE (ADMIN) */
export const fetchDailyAttendance = (params) =>
  api("/api/admin/attendance", {
    params: {
      viewType: "DAILY",
      ...params
    }
  });





/* 🔹 HISTORY ATTENDANCE (ADMIN – EMPLOYEE WISE) */
export const fetchHistoryAttendance = ({
  employeeId,
  from,
  to,
  page = 1,
  limit = 31
}) =>
  api("/api/admin/attendance", {
    params: {
      viewType: "HISTORY",
      employeeId,
      from,
      to,
      page,
      limit
    }
  });

export const fetchMonthlyAttendance = ({
  fromDate,
  toDate,
  page = 1,
  limit = 20,
  search = "",
  departmentId = "",
  shiftId = ""
}) =>
  api("/api/admin/attendance", {
    params: {
      viewType: "MONTHLY",
      fromDate,
      toDate,
      page,
      limit,
      search,
      departmentId,
      shiftId
    }
  });












/* ===================================================================================
   LEAVE MASTER (ADMIN)
   =================================================================================== */

/* 🔹 Get all leave types (company-wise) */
export const getLeaveTypes = () =>
  api("/api/admin/leave-master/leave-types");

/* 🔹 Create new leave type */
export const createLeaveType = (data) =>
  api("/api/admin/leave-master/leave-types", {
    method: "POST",
    body: JSON.stringify(data),
  });

/* 🔹 Update leave type */
export const updateLeaveType = (id, data) =>
  api(`/api/admin/leave-master/leave-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

/* 🔹 Enable / Disable leave type */
export const toggleLeaveTypeStatus = (id, isActive) =>
  api(`/api/admin/leave-master/leave-types/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
export const deleteLeaveType = (id) =>
  api(`/api/admin/leave-master/leave-types/${id}`, {
    method: "DELETE",
  });
/* ===================================================================================
   LEAVE APPROVAL (ADMIN)
   =================================================================================== */

/* 🔹 Get all pending leave requests */
export const getPendingLeaveRequests = (page = 1, limit = 10, params = {}) =>
  api("/api/admin/leave-approval/pending", {
    params: { page, limit, ...params }
  });

export const getLeaveHistory = (page = 1, limit = 10, params = {}) =>
  api("/api/admin/leave-approval/leave-history", {
    params: { page, limit, ...params }
  });

/* 🔹 Approve leave request */
export const approveLeaveRequest = (requestId) =>
  api(`/api/admin/leave-approval/${requestId}/approve`, {
    method: "POST",
  });

/* 🔹 Reject leave request */
export const rejectLeaveRequest = (requestId, remarks) =>
  api(`/api/admin/leave-approval/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify({ remarks }),
  });




/* ===================================================================================
   PAYROLL (ADMIN)
   =================================================================================== */

/**
 * 🔹 Get employees for payroll processing
 * Query params: pay_month, pay_year
 */
export const getPayrollEmployees = ({ month, year }) =>
  api("/api/admin/payroll/employees", {
    params: { month, year }
  });

/**
 * 🔹 Generate payroll batch (DRAFT)
 * Stores payroll_employee_entries and creates payroll_batches
 */
export const generatePayrollBatch = (payload) =>
  api("/api/admin/payroll/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/**
 * 🔹 Get payroll batch details (Review screen)
 */
export const getPayrollBatch = ({ pay_month, pay_year }) =>
  api("/api/admin/payroll/batch", {
    params: { pay_month, pay_year }
  });

/**
 * 🔹 Confirm payroll batch (Pay Salary)
 * Payload: { payMonth, payYear, action: "CONFIRM" }
 */
export const confirmPayrollBatch = (payload) =>
  api("/api/admin/payroll/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const generateEmployeeCode = (data) =>
  api("/api/admin/employee/code", {
    method: "POST",
    body: JSON.stringify(data),
  });





/* ===================================================================================
 COMPANY DOCUMENTS
 =================================================================================== */

export const getCompanyDocuments = (params = {}) =>
  api("/api/admin/company-documents", {
    params
  });


export const createCompanyDocument = (data) =>
  api("/api/admin/company-documents", {
    method: "POST",
    body: JSON.stringify(data)
  });


export const updateCompanyDocument = (id, data) =>
  api(`/api/admin/company-documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });

/**
 * DELETE – permanently delete company document
 */
export const deleteCompanyDocument = (id) =>
  api(`/api/admin/company-documents/${id}`, {
    method: "DELETE"
  });


/* ===================================================================================
 HOLIDAYS (ADMIN)
 Base: /api/admin/holidays/branch-holidays
 =================================================================================== */


export const getBranchHolidays = (params) =>
  api("/api/admin/holidays/branch-holidays", {
    params
  });


export const createBranchHolidays = (data) =>
  api("/api/admin/holidays/branch-holidays", {
    method: "POST",
    body: JSON.stringify(data)
  });


export const updateBranchHolidays = (data) =>
  api("/api/admin/holidays/branch-holidays", {
    method: "PUT",
    body: JSON.stringify(data)
  });


export const deleteBranchHolidays = (data) =>
  api("/api/admin/holidays/branch-holidays", {
    method: "DELETE",
    body: JSON.stringify(data)
  });





/* ===================================================================================
   COMPANY PAGES / CMS (ADMIN)
   Base: /api/admin/pages
   =================================================================================== */

/**
 * 🔹 Get all pages (Cards view)
 * Auto-creates default pages if missing
 */
export const getCompanyPages = () =>
  api("/api/admin/content/pages");


/**
 * 🔹 Get single page by slug (Edit page)
 */
export const getCompanyPageBySlug = (slug) =>
  api(`/api/admin/content/pages/${slug}`);


/**
 * 🔹 Create new custom page
 * Payload: { title }
 */
export const createCompanyPage = (data) =>
  api("/api/admin/content/pages", {
    method: "POST",
    body: JSON.stringify(data),
  });


/**
 * 🔹 Update page content
 * Payload: { title, content, content_type }
 */
export const updateCompanyPage = (id, data) =>
  api(`/api/admin/content/pages/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });


/**
 * 🔹 Delete custom page (soft delete)
 * System pages are protected by backend
 */
export const deleteCompanyPage = (id) =>
  api(`/api/admin/content/pages/${id}`, {
    method: "DELETE",
  });



/* ===================================================================================
 HELP & SUPPORT (ADMIN)
 Base: /api/admin/support
 =================================================================================== */

/**
 * 🔹 Get all support tickets
 * Optional query params:
 * branch_id, status (OPEN / CLOSED), search
 */
export const getSupportTickets = (params = {}) =>
  api("/api/admin/support", {
    params
  });


/**
 * 🔹 Get single support ticket (Detail view)
 */
export const getSupportTicketById = (ticketId) =>
  api(`/api/admin/support/${ticketId}`);


/**
 * 🔹 Respond to support ticket (Auto closes ticket)
 * Payload: { response }
 */
export const respondToSupportTicket = (ticketId, data) =>
  api(`/api/admin/support/${ticketId}/respond`, {
    method: "POST",
    body: JSON.stringify(data)
  });


/* ===================================================================================
   FAQ MANAGEMENT (ADMIN)
   Base: /api/admin/faqs
   =================================================================================== */

export const createFaq = (data) =>
  api("/api/admin/company-faq", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getFaqs = () =>
  api("/api/admin/company-faq");

export const updateFaq = (id, data) =>
  api(`/api/admin/company-faq/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteFaq = (id) =>
  api(`/api/admin/company-faq/${id}`, {
    method: "DELETE",
  });


export const createBroadcast = (data) =>
  api("/api/admin/broadcast", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getBroadcasts = () =>
  api("/api/admin/broadcast");

export const getBroadcastEmployees = () =>
  api("/api/admin/broadcast/employees");

export const deleteBroadcast = (id) =>
  api(`/api/admin/broadcast/${id}`, {
    method: "DELETE",
  });
