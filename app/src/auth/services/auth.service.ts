import { supabase } from '../../lib/supabase';

export interface AuthInput {
  email: string;
  displayName?: string;
  password?: string;
}

export const authService = {
  async signInWithOtp({ email, displayName }: AuthInput) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: displayName ? { display_name: displayName } : undefined,
      },
    });

    if (error) throw new Error(error.message);
  },

  async signUpWithPassword({ email, password, displayName }: AuthInput) {
    const { error } = await supabase.auth.signUp({
      email,
      password: password ?? '',
      options: {
        data: displayName ? { display_name: displayName } : undefined,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw new Error(error.message);
  },

  async signInWithPassword({ email, password }: AuthInput) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: password ?? '',
    });

    if (error) throw new Error(error.message);
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
