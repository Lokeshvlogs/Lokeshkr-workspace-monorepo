// The Django service (services/vivaah4u-api) defaults to port 8001 - see service.bat / project.json.
// Only read from server-side route handlers, so this stays a non-NEXT_PUBLIC_ variable.
export const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL ?? "http://127.0.0.1:8001"
export const DJANGO_API_ENDPOINT = `${DJANGO_BASE_URL}/api`
