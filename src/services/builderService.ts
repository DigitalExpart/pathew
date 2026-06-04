import { supabase } from '../lib/supabase';

export interface ProfileSource {
  id: string;
  user_id: string;
  source_type: 'uploaded_cv' | 'manual_notes' | 'pathew_profile' | 'pasted_text';
  source_url?: string;
  file_name?: string;
  file_type?: string;
  raw_text?: string;
  parsed_json?: any;
  created_at?: string;
}

export interface BuilderRequest {
  id: string;
  user_id: string;
  builder_type: 'cv' | 'cover_letter' | 'grant';
  task: string;
  document_type?: string;
  opportunity_id?: string;
  source_ids: string[];
  current_text?: string;
  user_prompt?: string;
  word_limit?: number;
  page_count?: number;
  tone_preference?: string;
  preferred_language?: string;
  status: 'pending' | 'success' | 'failed';
  manual_notes?: {
    custom_question_notes?: string;
    leadership_achievements?: string;
    project_notes?: string;
    additional_context?: string;
  };
  custom_questions?: any[];
  career_gap?: boolean;
  career_gap_explanation?: string;
  experience_level?: string;
  cv_type?: string;
  application_stage?: string;
  project_anchor?: string;
  funder_values?: string;
  previous_app_history?: {
    applied_before?: boolean;
    feedback?: string;
  };
  partners?: {
    has_partner?: boolean;
    partner_name?: string;
    partner_role?: string;
  };
  reporting_methods?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedDocument {
  id: string;
  user_id: string;
  builder_request_id?: string;
  document_type: string;
  title: string;
  content: string;
  structured_json: any;
  version: number;
  is_current: boolean;
  opportunity_id?: string;
  manual_notes?: {
    custom_question_notes?: string;
    leadership_achievements?: string;
    project_notes?: string;
    additional_context?: string;
  };
  custom_questions?: any[];
  career_gap?: boolean;
  career_gap_explanation?: string;
  experience_level?: string;
  cv_type?: string;
  application_stage?: string;
  project_anchor?: string;
  funder_values?: string;
  previous_app_history?: {
    applied_before?: boolean;
    feedback?: string;
  };
  partners?: {
    has_partner?: boolean;
    partner_name?: string;
    partner_role?: string;
  };
  reporting_methods?: string[];
  created_at?: string;
  updated_at?: string;
}


export const BuilderService = {
  // === PROFILE SOURCES ===
  async fetchProfileSources(userId: string): Promise<ProfileSource[]> {
    const { data, error } = await supabase
      .from('profile_sources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profile sources:', error);
      throw error;
    }
    return data || [];
  },

  async createProfileSource(source: Omit<ProfileSource, 'id' | 'user_id'>, userId: string): Promise<ProfileSource> {
    const { data, error } = await supabase
      .from('profile_sources')
      .insert({
        ...source,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile source:', error);
      throw error;
    }
    return data;
  },

  async deleteProfileSource(id: string): Promise<void> {
    const { error } = await supabase
      .from('profile_sources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting profile source:', error);
      throw error;
    }
  },

  async updateProfileSource(id: string, updates: Partial<ProfileSource>): Promise<ProfileSource> {
    const { data, error } = await supabase
      .from('profile_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile source:', error);
      throw error;
    }
    return data;
  },

  // === GENERATED DOCUMENTS ===
  async fetchGeneratedDocuments(userId: string, documentType?: string): Promise<GeneratedDocument[]> {
    let query = supabase
      .from('generated_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching generated documents:', error);
      throw error;
    }
    return data || [];
  },

  async saveGeneratedDocument(
    document: Omit<GeneratedDocument, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<GeneratedDocument> {
    // If saving a new version, mark previous versions for this docType & opportunity as is_current = false
    if (document.opportunity_id) {
      await supabase
        .from('generated_documents')
        .update({ is_current: false })
        .eq('user_id', userId)
        .eq('document_type', document.document_type)
        .eq('opportunity_id', document.opportunity_id);
    }

    const { data, error } = await supabase
      .from('generated_documents')
      .insert({
        ...document,
        user_id: userId,
        is_current: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving generated document:', error);
      throw error;
    }
    return data;
  },

  // === BUILDER REQUESTS ===
  async createBuilderRequest(
    request: Omit<BuilderRequest, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<BuilderRequest> {
    const { data, error } = await supabase
      .from('builder_requests')
      .insert({
        ...request,
        user_id: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating builder request:', error);
      throw error;
    }
    return data;
  },

  async updateBuilderRequestStatus(id: string, status: 'success' | 'failed'): Promise<void> {
    const { error } = await supabase
      .from('builder_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating builder request status:', error);
      throw error;
    }
  }
};
