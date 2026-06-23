import { supabase } from './supabase.js';

function getRedirectUrl(path) {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${path}`;
}

export async function signUp(email, password) {
  const emailRedirectTo = getRedirectUrl('/login');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function requestEmailOtp(email) {
  const emailRedirectTo = getRedirectUrl('/catalog');
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });
  if (error) throw error;
  return data;
}

export async function verifyEmailOtp(email, token) {
  const cleanToken = token.replace(/\D/g, '');
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: cleanToken,
    type: 'email',
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
