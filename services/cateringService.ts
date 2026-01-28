import { supabase } from '@/app/integrations/supabase/client';

export interface CateringInquiry {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  event_date?: string;
  guest_count?: number;
  details?: string;
  status?: string;
  created_at?: string;
}

export const cateringService = {
  /**
   * Submit a new catering inquiry
   */
  async submitInquiry(inquiry: Omit<CateringInquiry, 'id' | 'status' | 'created_at'>) {
    return await supabase
      .from('catering_inquiries')
      .insert({
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone || null,
        event_date: inquiry.event_date || null,
        guest_count: inquiry.guest_count || null,
        details: inquiry.details || null,
        status: 'new',
      })
      .select()
      .single();
  },

  /**
   * Get all catering inquiries (admin function)
   */
  async getAllInquiries() {
    return await supabase
      .from('catering_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
  },

  /**
   * Get inquiries by email (for user to see their past inquiries)
   */
  async getInquiriesByEmail(email: string) {
    return await supabase
      .from('catering_inquiries')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });
  },

  /**
   * Update inquiry status (admin function)
   */
  async updateInquiryStatus(id: number, status: string) {
    return await supabase
      .from('catering_inquiries')
      .update({ status })
      .eq('id', id);
  },

  /**
   * Delete inquiry (admin function)
   */
  async deleteInquiry(id: number) {
    return await supabase
      .from('catering_inquiries')
      .delete()
      .eq('id', id);
  },
};