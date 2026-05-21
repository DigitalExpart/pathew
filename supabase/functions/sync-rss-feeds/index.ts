import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4'
import { parse } from 'https://deno.land/x/xml@2.1.0/mod.ts' // Note: Use Deno's XML parser or similar. xml@2.1.0 is commonly used for basic feeds

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const requestBody = req.body ? await req.json().catch(() => ({})) : {}
    const targetSourceId = requestBody.sourceId

    // 1. Fetch enabled sources
    let sourcesQuery = supabase.from('rss_sources').select('*').eq('enabled', true)
    if (targetSourceId) {
      sourcesQuery = sourcesQuery.eq('id', targetSourceId)
    }

    const { data: sources, error: sourcesError } = await sourcesQuery
    if (sourcesError) throw sourcesError

    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ message: 'No enabled sources found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const results = []

    // 2. Process each source
    for (const source of sources) {
      // Create a sync log entry
      const { data: logEntry, error: logError } = await supabase
        .from('rss_sync_logs')
        .insert({ source_id: source.id, status: 'running' })
        .select()
        .single()

      if (logError) {
        console.error('Error creating log entry:', logError)
        continue
      }

      let logUpdates = {
        status: 'success',
        items_found: 0,
        items_new: 0,
        items_updated: 0,
        items_skipped: 0,
        error_message: null as string | null,
        completed_at: new Date().toISOString()
      }

      try {
        console.log(`Fetching RSS feed: ${source.feed_url}`)
        const response = await fetch(source.feed_url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const xmlText = await response.text()
        const parsed = parse(xmlText) as any
        
        const channel = parsed?.rss?.channel || parsed?.feed // Handle basic RSS 2.0 or Atom
        const items = channel?.item || channel?.entry || []
        
        // Ensure items is an array
        const itemsArray = Array.isArray(items) ? items : [items]
        logUpdates.items_found = itemsArray.length
        
        console.log(`Found ${itemsArray.length} items in feed`)

        const rules = source.classification_rules || {}

        for (const item of itemsArray) {
          // Extract basic fields
          const title = (item.title?.['#text'] || item.title || '').trim()
          let description = (item.description?.['#text'] || item.description || '').trim()
          const link = (item.link?.['#text'] || item.link || '').trim()
          const guid = (item.guid?.['#text'] || item.guid || link || '').trim()
          const pubDate = item.pubDate?.['#text'] || item.pubDate || new Date().toISOString()
          
          let categories: string[] = []
          if (Array.isArray(item.category)) {
            categories = item.category.map((c: any) => c['#text'] || c || '')
          } else if (item.category) {
            categories = [item.category['#text'] || item.category || '']
          }

          let content = ''
          // check for content:encoded or atom content
          if (item['content:encoded']) {
             content = item['content:encoded']['#text'] || item['content:encoded'] || ''
          } else if (item.content) {
             content = item.content['#text'] || item.content || ''
          }

          // Fallback to content if description is empty or too short
          if (!description || description.length < 50) {
            description = content;
          }
          
          // Basic HTML strip for description to avoid messy text while preserving paragraphs
          description = description
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>?/gm, '')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

          if (!title || !guid) {
            logUpdates.items_skipped++
            continue
          }

          // Classification logic based on rules
          let type = null
          const lowerTitle = title.toLowerCase()
          const titleToJob = rules.title_to_job || ["now hiring", "hiring:"]
          const titleToFellowship = rules.title_to_fellowship || ["fellowship"]
          const titleToScholarship = rules.title_to_scholarship || ["scholarship"]
          const titleToGrant = rules.title_to_grant || ["grant", "funding", "fund "]
          const categoriesToJob = rules.categories_to_job || ["Remote Jobs"]
          const categoriesToOpp = rules.categories_to_opportunity || ["Opportunities for Women"]

          if (categoriesToJob.some((c: string) => categories.includes(c)) || titleToJob.some((t: string) => lowerTitle.includes(t.toLowerCase()))) {
            type = 'job'
          } else if (titleToFellowship.some((t: string) => lowerTitle.includes(t.toLowerCase()))) {
            type = 'fellowship'
          } else if (titleToScholarship.some((t: string) => lowerTitle.includes(t.toLowerCase()))) {
            type = 'scholarship'
          } else if (titleToGrant.some((t: string) => lowerTitle.includes(t.toLowerCase()))) {
            type = 'grant'
          } else if (categoriesToOpp.some((c: string) => categories.includes(c))) {
            type = 'other' // Maps to general opportunity
          }

          // If it doesn't match any target categories/keywords, it's likely an editorial post
          if (!type) {
            logUpdates.items_skipped++
            continue
          }

          // Extract thumbnail from content
          let thumbnailUrl = null
          const imgMatch = content.match(/<img[^>]+src="([^">]+)"/)
          if (imgMatch && imgMatch[1]) {
            thumbnailUrl = imgMatch[1]
          }

          // Extract apply link (naive approach: find first 'apply' link)
          let applyLink = link
          const applyMatch = content.match(/<a[^>]+href="([^">]+)"[^>]*>(?:[^<]*)(?:apply|click here)(?:[^<]*)<\/a>/i)
          if (applyMatch && applyMatch[1]) {
            applyLink = applyMatch[1]
          }

          // Combine text for regex searching before stripping too much
          const rawDescription = item.description?.['#text'] || item.description || '';
          const textForRegex = (title + '\n' + rawDescription + '\n' + content).replace(/<[^>]*>?/gm, '\n');

          // Try to find deadline
          let deadline = null
          const deadlineMatch = textForRegex.match(/(?:application deadline|due date|deadline|closes|closing date)\s*[:-]\s*([^\n.\-(]+)/i)
          if (deadlineMatch && deadlineMatch[1]) {
             deadline = deadlineMatch[1].trim()
             if (deadline.length > 40) deadline = deadline.substring(0, 40).trim();
          }

          // Try to find location from title
          let location = null
          const locationMatch = title.match(/\b(?:in|at|for)\s+([A-Z][a-zA-Z\s]+?)(?:\(|-|:|$)/)
          if (locationMatch && locationMatch[1]) {
             const loc = locationMatch[1].trim()
             if (loc.length > 2 && loc.length < 30) {
               location = loc;
             }
          }
          if (!location) {
             const commonLocations = ['Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Rwanda', 'Uganda', 'Africa', 'United States', 'UK', 'Canada', 'Europe', 'Asia', 'Global', 'Caribbean'];
             for (const loc of commonLocations) {
                if (title.includes(loc)) {
                   location = loc;
                   break;
                }
             }
          }

          // Prepare payload
          const opportunityPayload = {
            title,
            description,
            original_url: link,
            apply_link: applyLink,
            type,
            status: 'published',
            source_name: source.name,
            source_url: source.website_url,
            tags: categories,
            rss_guid: guid,
            rss_source_id: source.id,
            rss_imported_at: new Date().toISOString(),
            thumbnail_url: thumbnailUrl,
            deadline: deadline,
            location: location,
            created_at: new Date(pubDate).toISOString(),
            updated_at: new Date().toISOString()
          }

          // Upsert logic based on rss_guid
          const { data: existing, error: findError } = await supabase
            .from('opportunities')
            .select('id, title, updated_at')
            .eq('rss_guid', guid)
            .maybeSingle()

          if (findError && findError.code !== 'PGRST116') {
             console.error('Error finding existing:', findError)
             continue
          }

          if (existing) {
             // Only update if needed or just count as skipped/updated
             // Here we do an update for safety on fresh data
             const { error: updateError } = await supabase
                .from('opportunities')
                .update(opportunityPayload)
                .eq('id', existing.id)
                
             if (!updateError) logUpdates.items_updated++
             else console.error('Update error:', updateError)
          } else {
             // Insert
             const { error: insertError } = await supabase
                .from('opportunities')
                .insert(opportunityPayload)
             
             if (!insertError) logUpdates.items_new++
             else console.error('Insert error:', insertError)
          }
        }

        // Update source stats
        await supabase
          .from('rss_sources')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            items_imported: (source.items_imported || 0) + logUpdates.items_new
          })
          .eq('id', source.id)

      } catch (err: any) {
        logUpdates.status = 'error'
        logUpdates.error_message = err.message || String(err)
        console.error(`Sync error for ${source.name}:`, err)
        
        await supabase
          .from('rss_sources')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'error',
            last_sync_error: err.message || String(err)
          })
          .eq('id', source.id)
      } finally {
         logUpdates.completed_at = new Date().toISOString()
         await supabase
           .from('rss_sync_logs')
           .update(logUpdates)
           .eq('id', logEntry.id)
           
         results.push({ source: source.name, ...logUpdates })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
