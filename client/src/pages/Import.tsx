import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RefreshCw, Database, Calendar, Clock, Trash2, Terminal } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ImportStatus {
  id: string;
  source: string;
  isActive: boolean;
  lastSyncAt: string | null;
  totalImported: number;
  totalAvailable: number;
  currentPage: number;
  phase1Progress?: string;
  phase2Progress?: string;
  errors: string[];
  createdAt: string;
  updatedAt: string;
}

interface TVMazeContent {
  count: number;
  content: Array<{
    id: string;
    title: string;
    type: string;
    year: number | null;
    rating: number | null;
    status: string;
    totalSeasons: number | null;
    totalEpisodes: number | null;
    network: string | null;
    genres: string[] | null;
  }>;
}

interface AniListContent {
  count: number;
  content: Array<{
    id: string;
    title: string;
    type: string;
    year: number | null;
    rating: number | null;
    status: string;
    episodes: number | null;
    season: number | null;
    studio: string | null;
    sourceMaterial: string | null;
    genres: string[] | null;
  }>;
}

function Import() {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [tvmazeConsoleMessages, setTvmazeConsoleMessages] = useState<Array<{id: number, timestamp: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([]);
  const [anilistConsoleMessages, setAnilistConsoleMessages] = useState<Array<{id: number, timestamp: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([]);
  const tvmazeConsoleRef = useRef<HTMLDivElement>(null);
  const anilistConsoleRef = useRef<HTMLDivElement>(null);
  const lastStatusRef = useRef<ImportStatus | null>(null);
  const lastAniListStatusRef = useRef<ImportStatus | null>(null);

  // Query for TVmaze import status
  const { data: tvmazeStatus, isLoading: statusLoading } = useQuery<ImportStatus | null>({
    queryKey: ['/api/import/tvmaze/status'],
    refetchInterval: 3000, // Fixed 3s polling to ensure consistent updates
    staleTime: 0, // Always refetch, don't use stale data
  });

  // Query for AniList import status
  const { data: anilistStatus, isLoading: anilistStatusLoading } = useQuery<ImportStatus | null>({
    queryKey: ['/api/import/anilist/status'],
    refetchInterval: 3000, // Fixed 3s polling to ensure consistent updates
    staleTime: 0, // Always refetch, don't use stale data
  });

  // Add console message for TVmaze
  const addTvmazeConsoleMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTvmazeConsoleMessages(prev => {
      const newMessages = [...prev, { id: Date.now() + Math.random(), timestamp, message, type }];
      // Keep only last 50 messages
      return newMessages.slice(-50);
    });
  };

  // Add console message for AniList
  const addAnilistConsoleMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setAnilistConsoleMessages(prev => {
      const newMessages = [...prev, { id: Date.now() + Math.random(), timestamp, message, type }];
      // Keep only last 50 messages
      return newMessages.slice(-50);
    });
  };

  // Auto-scroll consoles to bottom
  useEffect(() => {
    if (tvmazeConsoleRef.current) {
      tvmazeConsoleRef.current.scrollTop = tvmazeConsoleRef.current.scrollHeight;
    }
  }, [tvmazeConsoleMessages]);

  useEffect(() => {
    if (anilistConsoleRef.current) {
      anilistConsoleRef.current.scrollTop = anilistConsoleRef.current.scrollHeight;
    }
  }, [anilistConsoleMessages]);

  // Watch for TVmaze status changes and generate console messages
  useEffect(() => {
    if (!tvmazeStatus) return;
    
    const lastStatus = lastStatusRef.current;
    lastStatusRef.current = tvmazeStatus;
    
    // Don't log on first load
    if (!lastStatus) {
      if (tvmazeStatus.isActive) {
        addTvmazeConsoleMessage("🔄 TVmaze import is currently active", 'info');
        // Since page 26 is stuck from previous sync, assume Phase 1 on first load when active
        addTvmazeConsoleMessage("📋 Phase 1: Updating existing shows with new episodes", 'info');
      } else {
        addTvmazeConsoleMessage("⏸️ TVmaze import is paused", 'warning');
      }
      addTvmazeConsoleMessage(`📊 Current status: ${tvmazeStatus.totalImported} shows imported`, 'info');
      return;
    }

    // Status changed from inactive to active
    if (!lastStatus.isActive && tvmazeStatus.isActive) {
      addTvmazeConsoleMessage("🚀 TVmaze import started", 'success');
      addTvmazeConsoleMessage("🔍 Running health check to verify database consistency", 'info');
    }

    // Status changed from active to inactive
    if (lastStatus.isActive && !tvmazeStatus.isActive) {
      addTvmazeConsoleMessage("⏹️ TVmaze import stopped", 'warning');
    }

    // Page progress - only log actual page changes for Phase 2
    if (lastStatus.currentPage !== tvmazeStatus.currentPage && tvmazeStatus.isActive) {
      if (tvmazeStatus.currentPage === 0) {
        addTvmazeConsoleMessage("📋 Starting Phase 1: Updating existing shows with new episodes", 'info');
      } else if (tvmazeStatus.currentPage > 26) {
        // Only show page progress when we're actually past the stuck page 26
        addTvmazeConsoleMessage(`📄 Phase 2: Processing page ${tvmazeStatus.currentPage} (importing new shows)`, 'info');
      }
    }

    // Import count increased
    if (lastStatus.totalImported < tvmazeStatus.totalImported) {
      const diff = tvmazeStatus.totalImported - lastStatus.totalImported;
      addTvmazeConsoleMessage(`✅ Imported/updated ${diff} shows (Total: ${tvmazeStatus.totalImported})`, 'success');
    }

    // Phase 1 progress updated
    if (lastStatus.phase1Progress !== tvmazeStatus.phase1Progress && tvmazeStatus.phase1Progress) {
      if (tvmazeStatus.phase1Progress.includes('Phase 1 Complete')) {
        addTvmazeConsoleMessage(`✅ ${tvmazeStatus.phase1Progress}`, 'success');
      } else {
        addTvmazeConsoleMessage(`📋 Phase 1 Progress: ${tvmazeStatus.phase1Progress} shows updated`, 'info');
      }
    }

    // Phase 2 progress updated
    if (lastStatus.phase2Progress !== tvmazeStatus.phase2Progress && tvmazeStatus.phase2Progress) {
      if (tvmazeStatus.phase2Progress.includes('Phase 2 Complete')) {
        addTvmazeConsoleMessage(`🎉 ${tvmazeStatus.phase2Progress}`, 'success');
      } else {
        addTvmazeConsoleMessage(`📄 Phase 2 Progress: ${tvmazeStatus.phase2Progress}`, 'info');
      }
    }

    // Errors detected
    if (tvmazeStatus.errors && tvmazeStatus.errors.length > (lastStatus.errors?.length || 0)) {
      const newErrors = tvmazeStatus.errors.slice(lastStatus.errors?.length || 0);
      newErrors.forEach(error => {
        addTvmazeConsoleMessage(`❌ Error: ${error}`, 'error');
      });
    }

  }, [tvmazeStatus]);

  // Watch for AniList status changes and generate console messages
  useEffect(() => {
    if (!anilistStatus) return;
    
    const lastStatus = lastAniListStatusRef.current;
    lastAniListStatusRef.current = anilistStatus;
    
    // Don't log on first load
    if (!lastStatus) {
      if (anilistStatus.isActive) {
        addAnilistConsoleMessage("🔄 AniList import is currently active", 'info');
        addAnilistConsoleMessage("📋 Phase 1: Updating existing anime with new episodes", 'info');
      } else {
        addAnilistConsoleMessage("⏸️ AniList import is paused", 'warning');
      }
      addAnilistConsoleMessage(`📊 Current status: ${anilistStatus.totalImported} anime imported`, 'info');
      return;
    }

    // Status changed from inactive to active
    if (!lastStatus.isActive && anilistStatus.isActive) {
      addAnilistConsoleMessage("🚀 AniList import started", 'success');
      addAnilistConsoleMessage("🔍 Running health check to verify database consistency", 'info');
    }

    // Status changed from active to inactive
    if (lastStatus.isActive && !anilistStatus.isActive) {
      addAnilistConsoleMessage("⏹️ AniList import stopped", 'warning');
    }

    // Page progress - only log actual page changes for Phase 2
    if (lastStatus.currentPage !== anilistStatus.currentPage && anilistStatus.isActive) {
      if (anilistStatus.currentPage === 0) {
        addAnilistConsoleMessage("📋 Starting Phase 1: Updating existing anime with new episodes", 'info');
      } else if (anilistStatus.currentPage > 1) {
        addAnilistConsoleMessage(`📄 Phase 2: Processing page ${anilistStatus.currentPage} (importing new anime)`, 'info');
      }
    }

    // Import count increased
    if (lastStatus.totalImported < anilistStatus.totalImported) {
      const diff = anilistStatus.totalImported - lastStatus.totalImported;
      addAnilistConsoleMessage(`✅ Imported/updated ${diff} anime (Total: ${anilistStatus.totalImported})`, 'success');
    }

    // Phase 1 progress updated
    if (lastStatus.phase1Progress !== anilistStatus.phase1Progress && anilistStatus.phase1Progress) {
      if (anilistStatus.phase1Progress.includes('Phase 1 Complete')) {
        addAnilistConsoleMessage(`✅ ${anilistStatus.phase1Progress}`, 'success');
      } else {
        addAnilistConsoleMessage(`📋 Phase 1 Progress: ${anilistStatus.phase1Progress} anime updated`, 'info');
      }
    }

    // Phase 2 progress updated
    if (lastStatus.phase2Progress !== anilistStatus.phase2Progress && anilistStatus.phase2Progress) {
      if (anilistStatus.phase2Progress.includes('Complete')) {
        addAnilistConsoleMessage(`🎉 ${anilistStatus.phase2Progress}`, 'success');
        addAnilistConsoleMessage(`🔄 Starting Phase 3: Migration - searching for anime in TV shows...`, 'info');
      } else {
        addAnilistConsoleMessage(`📄 Phase 2: ${anilistStatus.phase2Progress}`, 'info');
      }
    }

    // Phase 3 progress updated
    // @ts-ignore - temporary fix for type loading
    if (lastStatus.phase3Progress !== anilistStatus.phase3Progress && anilistStatus.phase3Progress) {
      // @ts-ignore
      if (anilistStatus.phase3Progress.includes('Phase 3 Complete')) {
        // @ts-ignore
        addAnilistConsoleMessage(`✅ ${anilistStatus.phase3Progress}`, 'success');
      } else {
        // @ts-ignore
        addAnilistConsoleMessage(`🔄 Phase 3: ${anilistStatus.phase3Progress}`, 'info');
      }
    }

    // Errors
    if (anilistStatus.errors && anilistStatus.errors.length > (lastStatus.errors?.length || 0)) {
      const newErrors = anilistStatus.errors.slice(lastStatus.errors?.length || 0);
      newErrors.forEach(error => {
        addAnilistConsoleMessage(`❌ AniList Error: ${error}`, 'error');
      });
    }
  }, [anilistStatus]); // Track AniList phase updates

  // Query for TVmaze content stats
  const { data: tvmazeContent } = useQuery<TVMazeContent>({
    queryKey: ['/api/import/tvmaze/content'],
    refetchInterval: 10000, // Fixed 10s polling for content
    staleTime: 5000, // Allow some stale data for content
  });

  // Query for AniList content
  const { data: anilistContent } = useQuery<AniListContent>({
    queryKey: ['/api/import/anilist/content'],
    refetchInterval: 10000, // Fixed 10s polling for content
    staleTime: 5000, // Allow some stale data for content
  });

  // Mutation to start TVmaze import
  const startImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/tvmaze/start'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/tvmaze/status'] });
    },
  });

  // Mutation to pause TVmaze import
  const pauseImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/tvmaze/pause'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/tvmaze/status'] });
    },
  });

  // Mutation to start AniList import
  const startAniListImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/anilist/start'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/anilist/status'] });
    },
  });

  // Mutation to pause AniList import
  const pauseAniListImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/anilist/pause'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/anilist/status'] });
    },
  });

  // Delete mutations for each API source
  const deleteTVmazeData = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/import/tvmaze/data'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/tvmaze/content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content/type/tv'] });
      setRefreshKey(prev => prev + 1);
    },
  });

  const deleteTMDBData = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/import/tmdb/data'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/type/movie'] });
      setRefreshKey(prev => prev + 1);
    },
  });

  const deleteAniListData = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/import/anilist/data'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/anilist/content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content/type/anime'] });
      setRefreshKey(prev => prev + 1);
    },
  });

  // Auto-start import only once on initial page load, not after deletions
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  useEffect(() => {
    if (tvmazeContent !== undefined) {
      setIsFirstLoad(false);
    }
  }, [tvmazeContent]);
  
  useEffect(() => {
    if (!hasAutoStarted && 
        isFirstLoad &&
        tvmazeContent?.count === 0 && 
        !tvmazeStatus?.isActive && 
        !statusLoading &&
        !startImport.isPending) {
      console.log('Initial page load with no TVmaze content, auto-starting import...');
      setHasAutoStarted(true);
      startImport.mutate();
    }
  }, [tvmazeContent?.count, tvmazeStatus?.isActive, statusLoading, hasAutoStarted, startImport.isPending, isFirstLoad]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (isActive: boolean, hasContent: boolean, isInitialLoading: boolean) => {
    // Priority: Active state always wins, then loading only if no status exists yet
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800" data-testid="status-active">Importing</Badge>;
    }
    if (isInitialLoading && !tvmazeStatus) {
      return <Badge className="bg-yellow-100 text-yellow-800" data-testid="status-loading">Loading...</Badge>;
    }
    if (hasContent) {
      return <Badge className="bg-blue-100 text-blue-800" data-testid="status-ready">Ready</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800" data-testid="status-idle">Idle</Badge>;
  };

  const calculateProgress = () => {
    if (!tvmazeStatus || tvmazeStatus.totalAvailable === 0) return 0;
    return Math.min((tvmazeStatus.totalImported / Math.max(tvmazeStatus.totalAvailable, tvmazeStatus.totalImported)) * 100, 100);
  };

  const confirmDelete = (source: string, action: () => void) => {
    if (window.confirm(`Are you sure you want to delete ALL ${source} data? This action cannot be undone.`)) {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Import Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/import/tvmaze/status'] });
              queryClient.invalidateQueries({ queryKey: ['/api/import/tvmaze/content'] });
              queryClient.invalidateQueries({ queryKey: ['/api/import/anilist/status'] });
              queryClient.invalidateQueries({ queryKey: ['/api/import/anilist/content'] });
            }}
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TMDB Section */}
          <Card data-testid="card-tmdb">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                TMDB (Movies)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <Badge className="bg-gray-100 text-gray-800" data-testid="status-tmdb">Not Configured</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-gray-400" data-testid="text-tmdb-sync">Never</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Content:</span>
                <span className="text-gray-400" data-testid="text-tmdb-count">0</span>
              </div>
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete('TMDB', () => deleteTMDBData.mutate())}
                  disabled={deleteTMDBData.isPending}
                  className="w-full flex items-center gap-2"
                  data-testid="button-delete-tmdb"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteTMDBData.isPending ? 'Deleting...' : 'Delete All TMDB Data'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* TVmaze Section */}
          <Card data-testid="card-tvmaze">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                TVmaze (TV Shows)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                {getStatusBadge(
                  tvmazeStatus?.isActive || false, 
                  (tvmazeContent?.count || 0) > 0,
                  statusLoading && !tvmazeStatus
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-sm text-gray-500" data-testid="text-tvmaze-sync">
                  {formatDate(tvmazeStatus?.lastSyncAt || null)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Content:</span>
                <span className="font-medium text-blue-600" data-testid="text-tvmaze-count">
                  {tvmazeContent?.count || 0}
                </span>
              </div>
              {tvmazeStatus?.errors && tvmazeStatus.errors.length > 0 && (
                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-red-600">
                      {tvmazeStatus.errors.length} error(s)
                    </summary>
                    <div className="mt-1 text-xs text-red-500 max-h-20 overflow-y-auto">
                      {tvmazeStatus.errors.slice(-3).map((error, i) => (
                        <div key={i} className="truncate">{error}</div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete('TVmaze', () => deleteTVmazeData.mutate())}
                  disabled={deleteTVmazeData.isPending || tvmazeStatus?.isActive}
                  className="w-full flex items-center gap-2"
                  data-testid="button-delete-tvmaze"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteTVmazeData.isPending ? 'Deleting...' : 'Delete All TVmaze Data'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AniList Section */}
          <Card data-testid="card-anilist">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                AniList (Anime)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                {getStatusBadge(
                  anilistStatus?.isActive || false, 
                  (anilistContent?.count || 0) > 0,
                  anilistStatusLoading && !anilistStatus
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-sm text-gray-600 dark:text-gray-300" data-testid="text-anilist-sync">
                  {formatDate(anilistStatus?.lastSyncAt || null)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Content:</span>
                <span className="font-medium text-gray-900 dark:text-white" data-testid="text-anilist-count">
                  {anilistContent?.count || 0}
                </span>
              </div>
              
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete('AniList', () => deleteAniListData.mutate())}
                  disabled={deleteAniListData.isPending}
                  className="w-full flex items-center gap-2"
                  data-testid="button-delete-anilist"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteAniListData.isPending ? 'Deleting...' : 'Delete All AniList Data'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TVmaze Controls Section */}
        <Card className="mt-8" data-testid="card-controls">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              TVmaze Import Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex gap-2">
                {tvmazeStatus?.isActive ? (
                  <Button
                    variant="outline"
                    onClick={() => pauseImport.mutate()}
                    disabled={pauseImport.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-stop-import"
                  >
                    <Pause className="w-4 h-4" />
                    {pauseImport.isPending ? 'Stopping...' : 'Stop Import'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => startImport.mutate()}
                    disabled={startImport.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-start-import"
                  >
                    <Play className="w-4 h-4" />
                    {startImport.isPending ? 'Starting...' : 'Start Import'}
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Import Schedule: Rolling sync starting each morning</span>
                </div>
                <div>Rate Limited: 15 requests per 10 seconds to respect TVmaze API limits</div>
                {tvmazeStatus?.isActive && (
                  <div className="mt-2 text-blue-600 dark:text-blue-400">
                    Currently importing TV shows from TVmaze API...
                  </div>
                )}
              </div>
            </div>
            
            {/* Live Import Console */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4" />
                <h3 className="font-medium">Import Console</h3>
                <Badge variant="outline" className={tvmazeStatus?.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}>
                  {tvmazeStatus?.isActive ? 'Active' : 'Idle'}
                </Badge>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 shadow-inner h-80 overflow-hidden">
                <div 
                  ref={tvmazeConsoleRef}
                  className="h-full overflow-y-auto space-y-1 font-mono text-sm p-4 console-scrollbar"
                  data-testid="tvmaze-console"
                >
                  {tvmazeConsoleMessages.length === 0 ? (
                    <div className="text-gray-400 flex items-center gap-2">
                      <span className="text-green-400 font-semibold">seenit@tvmaze:~$</span> 
                      <span className="text-gray-500">Waiting for TVmaze import activity...</span>
                      <span className="animate-pulse text-green-400">▊</span>
                    </div>
                  ) : (
                    tvmazeConsoleMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-3 py-1 px-2 rounded hover:bg-gray-800/30 transition-colors duration-200">
                        <span className="text-gray-500 text-xs shrink-0 min-w-[65px] font-medium">{msg.timestamp}</span>
                        <span className={`leading-relaxed ${
                          msg.type === 'success' ? 'text-green-400' :
                          msg.type === 'warning' ? 'text-yellow-400' :
                          msg.type === 'error' ? 'text-red-400' :
                          'text-gray-200'
                        }`}>
                          {msg.message}
                        </span>
                      </div>
                    ))
                  )}
                  
                  {/* Live cursor */}
                  {tvmazeStatus?.isActive && (
                    <div className="flex items-center text-green-400 py-1 px-2 bg-green-400/10 rounded border-l-2 border-green-400 mt-2">
                      <span className="text-gray-500 text-xs mr-3 min-w-[65px] font-medium">{new Date().toLocaleTimeString()}</span>
                      <span className="text-green-300 leading-relaxed">
                        {/* Determine current phase based on latest activity */}
                        {tvmazeConsoleMessages.some(msg => msg.message.includes("Phase 2")) ? 
                          `📄 Phase 2: Processing page ${tvmazeStatus.currentPage}...` :
                          tvmazeConsoleMessages.some(msg => msg.message.includes("Phase 1")) && 
                          !tvmazeConsoleMessages.some(msg => msg.message.includes("Phase 1 Complete")) ? 
                          "📋 Phase 1: Updating existing shows..." :
                          tvmazeStatus.currentPage === 0 ? 
                          "🔄 Health check and setup..." : 
                          "🔄 Processing..."
                        }
                      </span>
                      <span className="ml-2 animate-pulse text-green-400 font-bold">▊</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Console Controls */}
              <div className="mt-3 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">
                  <Terminal className="inline w-3 h-3 mr-1" />
                  {tvmazeConsoleMessages.length} messages logged
                </span>
                <button 
                  onClick={() => setTvmazeConsoleMessages([])}
                  className="px-3 py-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors duration-200 font-medium"
                  data-testid="clear-tvmaze-console"
                >
                  Clear Console
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AniList Controls Section */}
        <Card className="mt-8" data-testid="card-anilist-controls">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              AniList Import Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex gap-2">
                {anilistStatus?.isActive ? (
                  <Button
                    variant="outline"
                    onClick={() => pauseAniListImport.mutate()}
                    disabled={pauseAniListImport.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-pause-anilist"
                  >
                    <Pause className="w-4 h-4" />
                    {pauseAniListImport.isPending ? 'Stopping...' : 'Stop Import'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => startAniListImport.mutate()}
                    disabled={startAniListImport.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-start-anilist"
                  >
                    <Play className="w-4 h-4" />
                    {startAniListImport.isPending ? 'Starting...' : 'Start Import'}
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Smart Import: Automatic duplicate detection and TV show migration</span>
                </div>
                <div>Phase 1: Updates existing anime | Phase 2: Imports new anime with migration</div>
                {anilistStatus?.isActive && (
                  <div className="mt-2 text-purple-600 dark:text-purple-400">
                    Currently importing anime from AniList API with migration detection...
                  </div>
                )}
              </div>
            </div>
            
            {/* AniList Import Console */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4" />
                <h3 className="font-medium">AniList Import Console</h3>
                <Badge variant="outline" className={anilistStatus?.isActive ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'}>
                  {anilistStatus?.isActive ? 'Active' : 'Idle'}
                </Badge>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg border border-purple-700 shadow-inner h-80 overflow-hidden">
                <div 
                  ref={anilistConsoleRef}
                  className="h-full overflow-y-auto space-y-1 font-mono text-sm p-4 console-scrollbar"
                  data-testid="anilist-console"
                >
                  {anilistConsoleMessages.length === 0 ? (
                    <div className="text-gray-400 flex items-center gap-2">
                      <span className="text-purple-400 font-semibold">seenit@anilist:~$</span> 
                      <span className="text-gray-500">Waiting for AniList import activity...</span>
                      <span className="animate-pulse text-purple-400">▊</span>
                    </div>
                  ) : (
                    anilistConsoleMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-3 py-1 px-2 rounded hover:bg-purple-800/30 transition-colors duration-200">
                        <span className="text-gray-500 text-xs shrink-0 min-w-[65px] font-medium">{msg.timestamp}</span>
                        <span className={`leading-relaxed ${
                          msg.type === 'success' ? 'text-purple-300' :
                          msg.type === 'warning' ? 'text-yellow-400' :
                          msg.type === 'error' ? 'text-red-400' :
                          'text-gray-200'
                        }`}>
                          {msg.message}
                        </span>
                      </div>
                    ))
                  )}
                  
                  {/* Live cursor */}
                  {anilistStatus?.isActive && (
                    <div className="flex items-center text-purple-400 py-1 px-2 bg-purple-400/10 rounded border-l-2 border-purple-400 mt-2">
                      <span className="text-gray-500 text-xs mr-3 min-w-[65px] font-medium">{new Date().toLocaleTimeString()}</span>
                      <span className="text-purple-300 leading-relaxed">
                        {/* Determine current phase based on latest activity */}
                        {anilistConsoleMessages.some(msg => msg.message.includes("Phase 2")) ? 
                          `📄 Phase 2: Processing page ${anilistStatus.currentPage}...` :
                          anilistConsoleMessages.some(msg => msg.message.includes("Phase 1")) && 
                          !anilistConsoleMessages.some(msg => msg.message.includes("Phase 1 Complete")) ? 
                          "📋 Phase 1: Updating existing anime..." :
                          anilistStatus.currentPage === 0 ? 
                          "🔄 Health check and setup..." : 
                          "🔄 Processing with migration detection..."
                        }
                      </span>
                      <span className="ml-2 animate-pulse text-purple-400 font-bold">▊</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Console Controls */}
              <div className="mt-3 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">
                  <Terminal className="inline w-3 h-3 mr-1" />
                  {anilistConsoleMessages.length} messages logged
                </span>
                <button 
                  onClick={() => setAnilistConsoleMessages([])}
                  className="px-3 py-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors duration-200 font-medium"
                  data-testid="clear-anilist-console"
                >
                  Clear Console
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Statistics */}
        <Card className="mt-6" data-testid="card-statistics">
          <CardHeader>
            <CardTitle>Import Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600" data-testid="stat-tvmaze">
                  {tvmazeContent?.count || 0}
                </div>
                <div className="text-sm text-gray-500">TVmaze TV Shows</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-tmdb">
                  0
                </div>
                <div className="text-sm text-gray-500">TMDB Movies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600" data-testid="stat-anilist">
                  {anilistContent?.count || 0}
                </div>
                <div className="text-sm text-gray-500">AniList Anime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600" data-testid="stat-total">
                  {tvmazeContent?.count || 0}
                </div>
                <div className="text-sm text-gray-500">Total Content</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Import;