import { supabase } from '../lib/supabase';

export interface RssSource {
  id: string;
  name: string;
  website_url: string;
  feed_url: string;
  enabled: boolean;
  sync_interval_hours: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  items_imported: number;
  classification_rules: any;
  created_at: string;
}

export interface RssSyncLog {
  id: string;
  source_id: string;
  started_at: string;
  completed_at: string;
  status: string;
  items_found: number;
  items_new: number;
  items_updated: number;
  items_skipped: number;
  error_message: string | null;
}

export const rssService = {
  async fetchSources(): Promise<RssSource[]> {
    const { data, error } = await supabase
      .from('rss_sources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async addSource(source: Partial<RssSource>): Promise<RssSource> {
    const { data, error } = await supabase
      .from('rss_sources')
      .insert(source)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSource(id: string, updates: Partial<RssSource>): Promise<RssSource> {
    const { data, error } = await supabase
      .from('rss_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSource(id: string): Promise<void> {
    const { error } = await supabase
      .from('rss_sources')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async fetchSyncLogs(sourceId?: string): Promise<RssSyncLog[]> {
    let query = supabase
      .from('rss_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);
      
    if (sourceId) {
      query = query.eq('source_id', sourceId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async triggerSync(sourceId?: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('sync-rss-feeds', {
      body: sourceId ? { sourceId } : {}
    });
    
    if (error) throw error;
    return data;
  }
};
