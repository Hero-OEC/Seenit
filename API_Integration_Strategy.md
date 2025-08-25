# Seenit API Integration & Affiliate Strategy

## Overview
This document outlines the strategy for integrating multiple entertainment APIs and implementing a direct affiliate network system for the Seenit entertainment tracking application.

## Multi-API Integration Strategy

### API Sources
- **Metadata**: TMDB, TVmaze, AniList
- **Trailers**: TMDB, AniList  
- **Airing schedules**: TVmaze, AniList
- **Where to watch**: TMDB, Consumet/Enime (no JustWatch)
- **Ratings**: OMDb (IMDb + Rotten Tomatoes)
- **Affiliate links**: Direct network integration

### Avoiding Duplicate Content

#### Primary Key Strategy
- **TMDB as primary source**: Use TMDB ID as the main identifier for all content
- Every piece of content gets a TMDB ID as the central reference point

#### Cross-Reference Mapping System
```
Content ID (TMDB: 12345) → TVmaze: 67890, AniList: 54321, IMDb: tt1234567
```

#### Data Merging Hierarchy
- **Metadata**: TMDB → TVmaze → AniList
- **Airing Schedules**: TVmaze → AniList
- **Ratings**: OMDb (for IMDb/RT scores)
- **Trailers**: TMDB → AniList
- **Where to Watch**: TMDB → Consumet/Enime

#### Implementation Flow
1. **Search/Import**: Search TMDB first to get primary ID
2. **Data Enhancement**: Use TMDB ID to fetch additional data from other sources
3. **Caching Strategy**: Store merged data locally to avoid repeated API calls
4. **Update Logic**: Refresh data periodically with newer sources overriding cached data

#### Edge Case Handling
- **Missing TMDB entries**: Create internal IDs for AniList/TVmaze-only content
- **Conflicting data**: Business rules (e.g., always trust TVmaze for air dates)
- **API limits**: Aggressive caching and batch requests

## Database Structure

### Core Tables

#### Content Table
```sql
- id (primary key)
- tmdb_id (main identifier)
- title
- type (movie/tv/anime)
- release_date
- genres
- poster_url
- description
- runtime/episode_count
- status (released/airing/upcoming)
```

#### External IDs Table
```sql
- content_id (links to Content)
- source (tmdb/tvmaze/anilist/imdb)
- external_id
- url (optional direct link)
```

#### Enhanced Data Table
```sql
- content_id
- source (tmdb/tvmaze/consumet)
- data_type (ratings/trailers/streaming/schedule)
- json_data (store raw API response)
- last_updated
```

#### User Content Tracking
```sql
- user_id
- content_id
- status (watching/watched/want_to_watch)
- rating (user's personal rating)
- progress (current episode/minute)
- notes
```

### Database Benefits
- **Fast searches**: Query local database instead of multiple APIs
- **Offline capability**: App works when APIs are down
- **Smart caching**: Only refresh old data
- **User experience**: Instant loading for previously viewed content

## Affiliate System Strategy

### Affiliate Networks
- **Impact.com** → Hulu, Peacock, others
- **Rakuten Advertising** → Disney+, HBO Max (Max), Rakuten TV
- **CJ Affiliate** → Paramount+, Vudu (Fandango), Disney+ (some regions)
- **Partnerize** → Apple TV/iTunes, Crunchyroll
- **ShareASale** → Funimation (legacy, merging into Crunchyroll)
- **Amazon Associates** → Prime Video, Freevee/IMDb TV, movie purchases/rentals

### Non-Affiliate Platforms
- **Netflix** → No affiliate program (include for completeness)

### Database Structure for Affiliates

#### Affiliate Networks Table
```sql
- network_id (impact, rakuten, cj, partnerize, shareasale, amazon)
- network_name
- base_url
- link_template (with placeholders)
- api_endpoint
```

#### Streaming Providers Table
```sql
- provider_id 
- provider_name (as returned by TMDB)
- display_name (user-friendly name)
- affiliate_network_id (links to networks)
- affiliate_id (your specific affiliate ID)
- has_affiliate (true/false)
```

### Direct Network Integration

#### Content → Platform → Network Flow
1. **Content Search**: User searches for content
2. **Platform Check**: TMDB provides streaming availability
3. **Network Mapping**: Map platform to affiliate network
4. **API Call**: Call network API directly for tracking link
5. **Link Generation**: Get tracked affiliate URL
6. **Display**: Show affiliate and non-affiliate options

#### Network API Integrations
- **Impact.com**: Partner API for real-time link generation
- **Rakuten Advertising**: Link Generator API for content-specific deep links
- **CJ Affiliate**: Link Service API for product-specific URLs
- **Partnerize**: Tracking API for deep linking to specific content
- **Amazon Associates**: Product Advertising API for ASIN-based affiliate links

#### Provider Mapping Example
```json
{
  "netflix": {
    "network": null,
    "has_affiliate": false,
    "display_name": "Netflix"
  },
  "hulu": {
    "network": "impact",
    "affiliate_id": "your_impact_id",
    "api_endpoint": "https://impact.com/api/...",
    "has_affiliate": true
  },
  "disney_plus": {
    "network": "rakuten", 
    "affiliate_id": "your_rakuten_id",
    "api_endpoint": "https://rakutenadvertising.com/api/...",
    "has_affiliate": true
  }
}
```

### Link Generation System

#### Backend Function Structure
```javascript
function generateAffiliateLink(contentId, provider, metadata) {
  const providerData = affiliateMapping[provider];
  
  if (!providerData.has_affiliate) {
    return directPlatformURL; // For Netflix, etc.
  }
  
  // Call network API directly
  return callNetworkAPI(providerData.network, {
    contentId,
    affiliateId: providerData.affiliate_id,
    metadata
  });
}
```

#### Frontend Implementation
- Display affiliate links with clear labeling
- Include non-affiliate platforms for completeness
- Add proper affiliate disclosure text
- Prioritize platforms with affiliate programs

## Technical Implementation Notes

### API Rate Limiting
- Implement aggressive caching for all API responses
- Use database to store and merge data from multiple sources
- Batch requests when possible
- Implement fallback systems for API failures

### Data Consistency
- TMDB ID as universal identifier
- Regular data refresh cycles
- Conflict resolution rules for contradictory data
- Audit logs for data source tracking

### Performance Optimization
- Cache affiliate link generation
- Pre-generate popular content links
- Use CDN for static content (posters, etc.)
- Implement lazy loading for non-critical data

### Security Considerations
- Store affiliate IDs securely
- Validate all external API responses
- Implement rate limiting on internal APIs
- Monitor for unusual affiliate link generation patterns

## Practical Implementation Guide

### Real-World User Journey Example

#### Scenario: User searches for "Stranger Things"

**Step 1: Initial Search**
```javascript
// Frontend search request
const searchResults = await apiRequest('/api/search', {
  method: 'POST',
  body: { query: 'Stranger Things', type: 'tv' }
});
```

**Step 2: Backend Processing**
```javascript
// Backend search handler
async function searchContent(query, type) {
  // 1. Search TMDB first (primary source)
  const tmdbResults = await fetch(`https://api.themoviedb.org/3/search/${type}?query=${query}`);
  
  // 2. Check if we already have this content in our database
  const existingContent = await db.select().from(content)
    .where(eq(content.tmdb_id, tmdbResults.results[0].id));
  
  if (existingContent.length > 0) {
    // Return cached data with fresh streaming links
    return await enhanceWithStreamingData(existingContent[0]);
  }
  
  // 3. New content - create full record
  return await createContentRecord(tmdbResults.results[0]);
}
```

**Step 3: Data Enhancement Process**
```javascript
async function createContentRecord(tmdbData) {
  // Save basic content from TMDB
  const contentId = await saveContent(tmdbData);
  
  // Parallel API calls for enhancement
  const [tvmazeData, anilistData, streamingData, ratingsData] = await Promise.all([
    fetchTVMazeData(tmdbData.name),
    fetchAniListData(tmdbData.name),
    fetchStreamingData(tmdbData.id),
    fetchOMDbRatings(tmdbData.imdb_id)
  ]);
  
  // Save external IDs and enhanced data
  await saveExternalMappings(contentId, { tvmazeData, anilistData });
  await saveEnhancedData(contentId, { streamingData, ratingsData });
  
  return buildContentResponse(contentId);
}
```

**Step 4: Streaming Platform Detection**
```javascript
async function fetchStreamingData(tmdbId) {
  // Get watch providers from TMDB
  const watchProviders = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/watch/providers`);
  
  // Map TMDB provider names to our affiliate system
  const streamingOptions = [];
  
  for (const provider of watchProviders.results.US.flatrate || []) {
    const affiliateData = await getAffiliateMapping(provider.provider_name);
    
    if (affiliateData.has_affiliate) {
      // Generate affiliate link
      const affiliateLink = await generateAffiliateLink(tmdbId, provider, affiliateData);
      streamingOptions.push({
        provider: provider.provider_name,
        type: 'subscription',
        url: affiliateLink,
        is_affiliate: true,
        commission_rate: affiliateData.commission_rate
      });
    } else {
      // Direct link for non-affiliate platforms
      streamingOptions.push({
        provider: provider.provider_name,
        type: 'subscription',
        url: provider.link,
        is_affiliate: false
      });
    }
  }
  
  return streamingOptions;
}
```

### Affiliate Network Integration Examples

#### Impact.com Integration (Hulu, Peacock)
```javascript
async function generateImpactLink(contentData, provider) {
  const impactAPI = {
    endpoint: 'https://api.impact.com/Mediapartners/YOUR_ACCOUNT_ID/Campaigns/YOUR_CAMPAIGN_ID/Ads',
    headers: {
      'Authorization': `Bearer ${process.env.IMPACT_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  
  const linkRequest = {
    CampaignId: provider.campaign_id,
    MediaTypeId: 1, // Text link
    AdSizeId: 1,
    LandingPageUrl: buildProviderURL(contentData, provider),
    CustomData: {
      content_id: contentData.tmdb_id,
      content_title: contentData.title,
      user_tracking: generateUserTracker()
    }
  };
  
  const response = await fetch(impactAPI.endpoint, {
    method: 'POST',
    headers: impactAPI.headers,
    body: JSON.stringify(linkRequest)
  });
  
  const result = await response.json();
  return result.Uri; // Tracked affiliate URL
}

function buildProviderURL(contentData, provider) {
  // Example for Hulu deep linking
  if (provider.name === 'hulu') {
    return `https://www.hulu.com/series/${slugify(contentData.title)}-${contentData.tmdb_id}`;
  }
  // Example for Peacock
  if (provider.name === 'peacock') {
    return `https://www.peacocktv.com/watch/playback/vod/${contentData.external_ids.peacock_id}`;
  }
  return provider.default_url;
}
```

#### Amazon Associates Integration
```javascript
async function generateAmazonLink(contentData) {
  // Use Amazon Product Advertising API to find content
  const paapi = {
    endpoint: 'https://webservices.amazon.com/paapi5/searchitems',
    headers: {
      'Authorization': buildAmazonSignature(),
      'Content-Type': 'application/json; charset=utf-8',
      'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
    }
  };
  
  const searchRequest = {
    Keywords: `${contentData.title} ${contentData.release_year}`,
    SearchIndex: 'MoviesAndTV',
    ItemCount: 1,
    PartnerTag: process.env.AMAZON_ASSOCIATE_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com',
    Resources: ['ItemInfo.Title', 'Offers.Listings.Price']
  };
  
  const response = await fetch(paapi.endpoint, {
    method: 'POST',
    headers: paapi.headers,
    body: JSON.stringify(searchRequest)
  });
  
  const result = await response.json();
  if (result.SearchResult && result.SearchResult.Items.length > 0) {
    return result.SearchResult.Items[0].DetailPageURL; // Pre-tracked affiliate URL
  }
  
  return null;
}
```

#### Rakuten Advertising Integration (Disney+, HBO Max)
```javascript
async function generateRakutenLink(contentData, provider) {
  const rakutenAPI = {
    endpoint: 'https://api.linksynergy.com/createcustomlink',
    params: {
      token: process.env.RAKUTEN_API_TOKEN,
      mid: provider.merchant_id, // Disney+ or HBO Max merchant ID
      murl: buildProviderDeepLink(contentData, provider)
    }
  };
  
  const url = new URL(rakutenAPI.endpoint);
  Object.keys(rakutenAPI.params).forEach(key => 
    url.searchParams.append(key, rakutenAPI.params[key])
  );
  
  const response = await fetch(url);
  const result = await response.json();
  
  return result.link; // Tracked affiliate URL
}

function buildProviderDeepLink(contentData, provider) {
  switch (provider.name) {
    case 'disney_plus':
      return `https://www.disneyplus.com/series/${slugify(contentData.title)}/${contentData.external_ids.disney_plus_id}`;
    case 'hbo_max':
      return `https://www.hbomax.com/series/${contentData.external_ids.hbo_max_id}`;
    default:
      return provider.base_url;
  }
}
```

### Complete Data Flow Example

#### Backend API Route Implementation
```javascript
// GET /api/content/:id/streaming
app.get('/api/content/:id/streaming', async (req, res) => {
  try {
    const contentId = req.params.id;
    
    // 1. Get content from database
    const contentData = await db.select().from(content)
      .where(eq(content.id, contentId))
      .limit(1);
    
    if (!contentData.length) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // 2. Check if we have recent streaming data (less than 24 hours old)
    const cachedStreaming = await db.select().from(enhanced_data)
      .where(
        and(
          eq(enhanced_data.content_id, contentId),
          eq(enhanced_data.data_type, 'streaming'),
          gte(enhanced_data.last_updated, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      );
    
    if (cachedStreaming.length > 0) {
      // Return cached data with fresh affiliate links
      const streamingOptions = JSON.parse(cachedStreaming[0].json_data);
      const freshLinks = await refreshAffiliateLinks(streamingOptions, contentData[0]);
      return res.json(freshLinks);
    }
    
    // 3. Fetch fresh streaming data
    const streamingData = await fetchStreamingData(contentData[0].tmdb_id);
    
    // 4. Generate affiliate links for each platform
    const enhancedStreamingData = await Promise.all(
      streamingData.map(async (platform) => {
        if (platform.is_affiliate) {
          platform.affiliate_url = await generateAffiliateLink(
            contentData[0], 
            platform.provider, 
            platform.affiliate_data
          );
        }
        return platform;
      })
    );
    
    // 5. Cache the results
    await db.insert(enhanced_data).values({
      content_id: contentId,
      source: 'streaming_aggregated',
      data_type: 'streaming',
      json_data: JSON.stringify(enhancedStreamingData),
      last_updated: new Date()
    }).onConflictDoUpdate({
      target: [enhanced_data.content_id, enhanced_data.data_type],
      set: {
        json_data: JSON.stringify(enhancedStreamingData),
        last_updated: new Date()
      }
    });
    
    res.json(enhancedStreamingData);
    
  } catch (error) {
    console.error('Streaming data error:', error);
    res.status(500).json({ error: 'Failed to fetch streaming data' });
  }
});
```

#### Frontend Implementation
```javascript
// StreamingOptions.tsx
function StreamingOptions({ contentId }) {
  const { data: streamingOptions, isLoading } = useQuery({
    queryKey: ['/api/content', contentId, 'streaming'],
    queryFn: () => apiRequest(`/api/content/${contentId}/streaming`),
  });

  if (isLoading) return <StreamingSkeleton />;

  return (
    <div className="streaming-options">
      <h3>Where to Watch</h3>
      
      {/* Affiliate platforms first */}
      <div className="affiliate-platforms">
        <h4>Subscription Services</h4>
        {streamingOptions
          .filter(option => option.is_affiliate && option.type === 'subscription')
          .map(option => (
            <StreamingButton
              key={option.provider}
              provider={option.provider}
              url={option.affiliate_url}
              isAffiliate={true}
              commissionRate={option.commission_rate}
            />
          ))}
      </div>
      
      {/* Purchase/rental options */}
      <div className="purchase-options">
        <h4>Buy or Rent</h4>
        {streamingOptions
          .filter(option => option.type === 'purchase' || option.type === 'rent')
          .map(option => (
            <StreamingButton
              key={`${option.provider}-${option.type}`}
              provider={option.provider}
              url={option.affiliate_url || option.url}
              price={option.price}
              type={option.type}
              isAffiliate={option.is_affiliate}
            />
          ))}
      </div>
      
      {/* Non-affiliate platforms */}
      <div className="non-affiliate-platforms">
        {streamingOptions
          .filter(option => !option.is_affiliate)
          .map(option => (
            <StreamingButton
              key={option.provider}
              provider={option.provider}
              url={option.url}
              isAffiliate={false}
            />
          ))}
      </div>
      
      <AffiliateDisclosure />
    </div>
  );
}

function StreamingButton({ provider, url, isAffiliate, price, type, commissionRate }) {
  const handleClick = () => {
    // Track click for analytics
    if (isAffiliate) {
      trackAffiliateClick(provider, url, commissionRate);
    }
    
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button 
      onClick={handleClick}
      className={`streaming-btn ${isAffiliate ? 'affiliate' : 'direct'}`}
      data-testid={`streaming-button-${provider}`}
    >
      <img src={`/provider-logos/${provider}.png`} alt={provider} />
      <span>{provider}</span>
      {price && <span className="price">{price}</span>}
      {type && <span className="type">{type}</span>}
      {isAffiliate && <span className="affiliate-badge">📈</span>}
    </button>
  );
}
```

### Error Handling and Fallbacks

#### API Failure Scenarios
```javascript
async function fetchWithFallback(primaryAPI, fallbackAPIs, params) {
  const errors = [];
  
  // Try primary API first
  try {
    const result = await primaryAPI(params);
    if (result && result.data) return result;
  } catch (error) {
    errors.push({ api: 'primary', error: error.message });
  }
  
  // Try fallback APIs
  for (const fallbackAPI of fallbackAPIs) {
    try {
      const result = await fallbackAPI(params);
      if (result && result.data) {
        // Log fallback usage for monitoring
        console.warn(`Using fallback API for ${params.contentId}:`, { 
          primary_failed: true, 
          fallback_used: fallbackAPI.name 
        });
        return result;
      }
    } catch (error) {
      errors.push({ api: fallbackAPI.name, error: error.message });
    }
  }
  
  // All APIs failed - return cached data if available
  const cachedData = await getCachedData(params.contentId);
  if (cachedData) {
    console.warn(`All APIs failed, returning stale cache for ${params.contentId}`);
    return cachedData;
  }
  
  // Complete failure
  throw new Error(`All APIs failed: ${JSON.stringify(errors)}`);
}
```

#### Rate Limiting Management
```javascript
class RateLimitManager {
  constructor() {
    this.limits = {
      tmdb: { requests: 0, resetTime: 0, maxRequests: 40, windowMs: 10000 },
      tvmaze: { requests: 0, resetTime: 0, maxRequests: 20, windowMs: 10000 },
      omdb: { requests: 0, resetTime: 0, maxRequests: 1000, windowMs: 86400000 }
    };
  }
  
  async checkLimit(apiName) {
    const limit = this.limits[apiName];
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now > limit.resetTime) {
      limit.requests = 0;
      limit.resetTime = now + limit.windowMs;
    }
    
    // Check if we've hit the limit
    if (limit.requests >= limit.maxRequests) {
      const waitTime = limit.resetTime - now;
      throw new Error(`Rate limit exceeded for ${apiName}. Wait ${waitTime}ms`);
    }
    
    limit.requests++;
    return true;
  }
  
  async makeRequest(apiName, requestFn) {
    await this.checkLimit(apiName);
    return await requestFn();
  }
}
```

### Performance Optimization Examples

#### Batch Processing for Popular Content
```javascript
// Nightly job to pre-populate streaming data for trending content
async function preloadTrendingContent() {
  // Get trending content from TMDB
  const trending = await fetch('https://api.themoviedb.org/3/trending/all/day');
  
  // Process in batches to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < trending.results.length; i += batchSize) {
    const batch = trending.results.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (item) => {
      try {
        // Check if we already have recent data
        const existing = await checkCachedData(item.id, 'streaming');
        if (existing && existing.age < 24 * 60 * 60 * 1000) return;
        
        // Pre-generate streaming data and affiliate links
        const streamingData = await fetchStreamingData(item.id);
        await cacheStreamingData(item.id, streamingData);
        
        console.log(`Preloaded streaming data for: ${item.title || item.name}`);
      } catch (error) {
        console.error(`Failed to preload ${item.title}:`, error);
      }
    }));
    
    // Rate limiting delay between batches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

#### Intelligent Caching Strategy
```javascript
class ContentCacheManager {
  constructor() {
    this.cacheStrategy = {
      metadata: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
      streaming: { ttl: 24 * 60 * 60 * 1000 },     // 1 day
      ratings: { ttl: 30 * 24 * 60 * 60 * 1000 },  // 30 days
      schedules: { ttl: 60 * 60 * 1000 },          // 1 hour
      affiliate_links: { ttl: 60 * 60 * 1000 }     // 1 hour
    };
  }
  
  async get(contentId, dataType) {
    const strategy = this.cacheStrategy[dataType];
    if (!strategy) throw new Error(`Unknown data type: ${dataType}`);
    
    const cached = await db.select().from(enhanced_data)
      .where(
        and(
          eq(enhanced_data.content_id, contentId),
          eq(enhanced_data.data_type, dataType),
          gte(enhanced_data.last_updated, new Date(Date.now() - strategy.ttl))
        )
      );
    
    return cached.length > 0 ? JSON.parse(cached[0].json_data) : null;
  }
  
  async set(contentId, dataType, data) {
    await db.insert(enhanced_data).values({
      content_id: contentId,
      source: `cached_${dataType}`,
      data_type: dataType,
      json_data: JSON.stringify(data),
      last_updated: new Date()
    }).onConflictDoUpdate({
      target: [enhanced_data.content_id, enhanced_data.data_type],
      set: {
        json_data: JSON.stringify(data),
        last_updated: new Date()
      }
    });
  }
}
```

### Analytics and Monitoring

#### Affiliate Link Performance Tracking
```javascript
async function trackAffiliateClick(provider, url, commissionRate, userId, contentId) {
  // Log click for analytics
  await db.insert(affiliate_clicks).values({
    user_id: userId,
    content_id: contentId,
    provider: provider,
    affiliate_url: url,
    commission_rate: commissionRate,
    clicked_at: new Date(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });
  
  // Send to analytics service
  analytics.track('Affiliate Link Clicked', {
    provider,
    content_id: contentId,
    user_id: userId,
    commission_rate: commissionRate,
    timestamp: new Date().toISOString()
  });
}

// Daily analytics report
async function generateAffiliateReport() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const report = await db.select({
    provider: affiliate_clicks.provider,
    clicks: sql`count(*)`,
    unique_users: sql`count(distinct user_id)`,
    unique_content: sql`count(distinct content_id)`,
    avg_commission_rate: sql`avg(commission_rate)`
  })
  .from(affiliate_clicks)
  .where(gte(affiliate_clicks.clicked_at, yesterday))
  .groupBy(affiliate_clicks.provider);
  
  console.log('Daily Affiliate Report:', report);
  return report;
}
```

## Next Steps

1. **Set up affiliate network accounts** with each provider
2. **Implement database schema** for content and affiliate mapping
3. **Create API integration layer** for each external service
4. **Build affiliate link generation system** with direct network APIs
5. **Test data merging logic** with real API responses
6. **Implement caching strategy** for performance optimization
7. **Add monitoring and analytics** for affiliate link performance