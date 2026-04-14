export const PYTHON_SERVICE_URL = process.env["PYTHON_SERVICE_URL"] || "http://localhost:8001";
export const INTERNAL_API_KEY = process.env["INTERNAL_API_KEY"] || "";

export function pythonHeaders(): HeadersInit {
  return INTERNAL_API_KEY
    ? { "Content-Type": "application/json", "X-API-Key": INTERNAL_API_KEY }
    : { "Content-Type": "application/json" };
}
