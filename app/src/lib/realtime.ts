import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToSession(
  sessionId: string,
  onStatusChange: (status: string) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        const newStatus = (payload.new as { status: string }).status;
        onStatusChange(newStatus);
      },
    )
    .subscribe();
  return channel;
}

export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
