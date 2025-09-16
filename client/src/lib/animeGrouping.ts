import type { Content } from "@shared/schema";

export interface AnimeSeries {
  seriesKey: string;
  seriesRootSourceId: string;
  title: string; // Title of the representative season (usually Season 1 or latest)
  seasons: Content[];
  representativeContent: Content; // The content item to display in lists
}

/**
 * Groups anime content by series key and returns series objects
 * Each series contains all seasons sorted by season number
 */
export function groupAnimeIntoSeries(animeList: Content[]): AnimeSeries[] {
  const seriesMap = new Map<string, AnimeSeries>();

  // Group anime by seriesKey
  for (const anime of animeList) {
    if (anime.type !== 'anime') continue;

    // Use seriesKey if available, otherwise treat as standalone
    const seriesKey = anime.seriesKey || `jikan:series:${anime.sourceId}`;
    
    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, {
        seriesKey,
        seriesRootSourceId: anime.seriesRootSourceId || anime.sourceId,
        title: anime.title,
        seasons: [],
        representativeContent: anime
      });
    }

    const series = seriesMap.get(seriesKey)!;
    series.seasons.push(anime);

    // Update representative content (prefer Season 1, then latest season)
    const currentRep = series.representativeContent;
    const currentRepSeasonNum = currentRep.seasonNumber || 1;
    const animeSeasonNum = anime.seasonNumber || 1;

    if (animeSeasonNum === 1) {
      // Always prefer Season 1 as representative
      series.representativeContent = anime;
      series.title = getSeriesTitle(anime);
    } else if (currentRepSeasonNum !== 1 && animeSeasonNum > currentRepSeasonNum) {
      // If no Season 1, prefer latest season
      series.representativeContent = anime;
      series.title = getSeriesTitle(anime);
    }
  }

  // Sort seasons within each series and finalize
  for (const series of seriesMap.values()) {
    series.seasons.sort((a, b) => {
      const aSeasonNum = a.seasonNumber || 1;
      const bSeasonNum = b.seasonNumber || 1;
      return aSeasonNum - bSeasonNum;
    });

    // Update series title to remove season info for the series name
    series.title = getSeriesTitle(series.representativeContent);
  }

  return Array.from(seriesMap.values());
}

/**
 * Gets a clean series title by removing season-specific parts
 */
function getSeriesTitle(anime: Content): string {
  let title = anime.title;

  // Remove common season patterns
  title = title.replace(/\s*(Season\s+\d+|Season\s+[IVX]+|Final\s+Season|2nd\s+Season|3rd\s+Season|\d+(st|nd|rd|th)\s+Season)$/i, '');
  title = title.replace(/\s*:\s*(Season\s+\d+|Season\s+[IVX]+|Final\s+Season)$/i, '');
  title = title.replace(/\s+S\d+$/i, ''); // Remove S2, S3 etc.
  title = title.replace(/\s+\d+(st|nd|rd|th)$/i, ''); // Remove 2nd, 3rd etc.
  
  return title.trim();
}

/**
 * Gets all seasons for a given series key, sorted by season number
 */
export function getSeriesSeasons(animeList: Content[], seriesKey: string): Content[] {
  return animeList
    .filter(anime => anime.type === 'anime' && (anime.seriesKey === seriesKey))
    .sort((a, b) => {
      const aSeasonNum = a.seasonNumber || 1;
      const bSeasonNum = b.seasonNumber || 1;
      return aSeasonNum - bSeasonNum;
    });
}

/**
 * Formats season display text for UI
 */
export function formatSeasonTitle(anime: Content): string {
  if (!anime.seasonTitle && anime.seasonNumber === 1) {
    return "Season 1";
  }
  return anime.seasonTitle || `Season ${anime.seasonNumber || 1}`;
}

/**
 * Helper to convert series back to content items for display
 */
export function seriesToContentItems(seriesList: AnimeSeries[]): Content[] {
  return seriesList.map(series => series.representativeContent);
}