// Central source for API base URL used by the frontend
export const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
    throw new Error("CRITICAL ERROR: VITE_API_BASE_URL is not defined in environment variables. Production build will fail API calls.");
}
