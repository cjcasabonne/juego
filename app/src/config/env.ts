const required = (key: string): string => {
  const val = import.meta.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
};

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
};
