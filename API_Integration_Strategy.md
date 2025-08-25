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

## Next Steps

1. **Set up affiliate network accounts** with each provider
2. **Implement database schema** for content and affiliate mapping
3. **Create API integration layer** for each external service
4. **Build affiliate link generation system** with direct network APIs
5. **Test data merging logic** with real API responses
6. **Implement caching strategy** for performance optimization
7. **Add monitoring and analytics** for affiliate link performance