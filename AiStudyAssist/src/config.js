export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_START_URL = `${API_BASE_URL}/`; 

export const SUPABASE_BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET_NAME;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const SUPABASE_BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/`;