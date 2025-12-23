import { supabase } from '@/app/integrations/supabase/client';

export interface ReservationInput {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
}

export const reservationService = {
  /**
   * Create a new reservation
   */
  async createReservation(reservation: ReservationInput) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: userId || null,
          name: reservation.name,
          email: reservation.email,
          phone: reservation.phone,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.guests,
          special_requests: reservation.specialRequests || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create reservation error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's reservations
   */
  async getUserReservations() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user reservations error:', error);
      return { data: null, error };
    }
  },

  /**
   * Cancel a reservation
   */
  async cancelReservation(reservationId: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Cancel reservation error:', error);
      return { data: null, error };
    }
  },
};
