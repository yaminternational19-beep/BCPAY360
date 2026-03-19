/**
 * Company Mapper
 * -------------------------------
 * Uses SAME company names as Login page
 * Does NOT modify employee generator
 * Temporary frontend-only logic
 */

/* 🔹 MUST MATCH LOGIN PAGE */
const COMPANIES = [
  "Black Cube Technologies",
  "Acme Corp",
  "Innova Solutions",
  "NextGen Systems",
  "Demo Organization",
];

/**
 * @param {Array} employees - flat employee list
 * @returns {Array} companies with departments & designations
 */
export function mapEmployeesToCompanies(employees) {
  // Step 1: Create empty company buckets
  const buckets = {};
  COMPANIES.forEach((c) => (buckets[c] = []));

  // Step 2: Distribute employees evenly
  employees.forEach((emp, index) => {
    const company =
      COMPANIES[index % COMPANIES.length];
    buckets[company].push(emp);
  });

  // Step 3: Build hierarchical structure
  return Object.entries(buckets).map(
    ([companyName, emps], idx) => {
      const deptMap = {};

      emps.forEach((e) => {
        if (!deptMap[e.department]) {
          deptMap[e.department] = new Set();
        }
        deptMap[e.department].add(e.role);
      });

      return {
        id: `COMP${idx + 1}`,
        name: companyName,
        departments: Object.entries(deptMap).map(
          ([dept, roles]) => ({
            name: dept,
            designations: Array.from(roles),
          })
        ),
      };
    }
  );
}
