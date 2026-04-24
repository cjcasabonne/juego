import { useEffect, useState } from 'react';
import { useAuthSession } from '../../auth/hooks/useAuthSession';
import { profilesService } from '../services/profiles.service';
import type { Database } from '../../shared/types/db';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const { user } = useAuthSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) {
        if (!active) return;
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!active) return;
      setLoading(true);

      try {
        const next = await profilesService.getCurrentProfile(user.id);
        if (!active) return;
        setProfile(next);
        setLoading(false);
      } catch {
        if (!active) return;
        setProfile(null);
        setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user]);

  return { profile, loading };
}
