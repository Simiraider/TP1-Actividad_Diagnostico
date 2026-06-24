import { supabase } from './supabase.js';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithPasswordAndRequestOtp(email, password) {
  const signInResult = await signIn(email, password);

  let otpError;
  try {
    await requestEmailOtp(email);
  } catch (error) {
    otpError = error;
  }

  try {
    await signOut();
  } catch (error) {
    if (!otpError) throw error;
  }

  if (otpError) throw otpError;

  return signInResult;
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
