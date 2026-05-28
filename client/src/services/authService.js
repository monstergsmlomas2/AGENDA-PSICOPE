import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en las variables de entorno'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TOKEN_KEY = 'psicope_token';

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const token = data.session?.access_token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function logout() {
  localStorage.removeItem(TOKEN_KEY);
  await supabase.auth.signOut();
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;

  try {
    // Decodificamos solo el payload (parte media del JWT)
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

export default supabase;
