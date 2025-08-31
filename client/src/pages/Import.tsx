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

function Import() {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [consoleMessages, setConsoleMessages] = useState<Array<{id: number, timestamp: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const lastStatusRef = useRef<ImportStatus | null>(null);

  // Query for TVmaze import status
  const { data: tvmazeStatus, isLoading: statusLoading } = useQuery<ImportStatus | null>({
    queryKey: ['/api/import/tvmaze/status'],
    refetchInterval: 3000, // Fixed 3s polling to ensure consistent updates
    staleTime: 0, // Always refetch, don't use stale data
  });

  // Add console message
  const addConsoleMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleMessages(prev => {
      const newMessages = [...prev, { id: Date.now(), timestamp, message, type }];
      // Keep only last 50 messages
      return newMessages.slice(-50);
    });
  };

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleMessages]);

  // Watch for status changes and generate console messages
  useEffect(() => {
    if (!tvmazeStatus) return;
    
    const lastStatus = lastStatusRef.current;
    lastStatusRef.current = tvmazeStatus;
    
    // Don't log on first load
    if (!lastStatus) {
      if (tvmazeStatus.isActive) {
        addConsoleMessage("🔄 TVmaze import is currently active", 'info');
        // Since page 26 is stuck from previous sync, assume Phase 1 on first load when active
        addConsoleMessage("📋 Phase 1: Updating existing shows with new episodes", 'info');
      } else {
        addConsoleMessage("⏸️ TVmaze import is paused", 'warning');
      }
      addConsoleMessage(`📊 Current status: ${tvmazeStatus.totalImported} shows imported`, 'info');
      return;
    }

    // Status changed from inactive to active
    if (!lastStatus.isActive && tvmazeStatus.isActive) {
      addConsoleMessage("🚀 TVmaze import started", 'success');
      addConsoleMessage("🔍 Running health check to verify database consistency", 'info');
    }

    // Status changed from active to inactive
    if (lastStatus.isActive && !tvmazeStatus.isActive) {
      addConsoleMessage("⏹️ TVmaze import stopped", 'warning');
    }

    // Page progress - only log actual page changes for Phase 2
    if (lastStatus.currentPage !== tvmazeStatus.currentPage && tvmazeStatus.isActive) {
      if (tvmazeStatus.currentPage === 0) {
        addConsoleMessage("📋 Starting Phase 1: Updating existing shows with new episodes", 'info');
      } else if (tvmazeStatus.currentPage > 26) {
        // Only show page progress when we're actually past the stuck page 26
        addConsoleMessage(`📄 Phase 2: Processing page ${tvmazeStatus.currentPage} (importing new shows)`, 'info');
      }
    }

    // Import count increased
    if (lastStatus.totalImported < tvmazeStatus.totalImported) {
      const diff = tvmazeStatus.totalImported - lastStatus.totalImported;
      addConsoleMessage(`✅ Imported/updated ${diff} shows (Total: ${tvmazeStatus.totalImported})`, 'success');
    }

    // Errors detected
    if (tvmazeStatus.errors.length > lastStatus.errors.length) {
      const newErrors = tvmazeStatus.errors.slice(lastStatus.errors.length);
      newErrors.forEach(error => {
        addConsoleMessage(`❌ Error: ${error}`, 'error');
      });
    }

  }, [tvmazeStatus]);

  // Query for TVmaze content stats
  const { data: tvmazeContent } = useQuery<TVMazeContent>({
    queryKey: ['/api/import/tvmaze/content'],
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
                <Badge className="bg-gray-100 text-gray-800" data-testid="status-anilist">Not Configured</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-gray-400" data-testid="text-anilist-sync">Never</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Content:</span>
                <span className="text-gray-400" data-testid="text-anilist-count">0</span>
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
              
              <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-hidden">
                <div 
                  ref={consoleRef}
                  className="h-full overflow-y-auto space-y-1 font-mono text-sm"
                  data-testid="import-console"
                >
                  {consoleMessages.length === 0 ? (
                    <div className="text-gray-500">
                      <span className="text-green-400">seenit@import:~$</span> Waiting for import activity...
                    </div>
                  ) : (
                    consoleMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <span className="text-gray-500 text-xs shrink-0">{msg.timestamp}</span>
                        <span className={`${
                          msg.type === 'success' ? 'text-green-400' :
                          msg.type === 'warning' ? 'text-yellow-400' :
                          msg.type === 'error' ? 'text-red-400' :
                          'text-gray-300'
                        }`}>
                          {msg.message}
                        </span>
                      </div>
                    ))
                  )}
                  
                  {/* Live cursor */}
                  {tvmazeStatus?.isActive && (
                    <div className="flex items-center text-green-400">
                      <span className="text-gray-500 text-xs mr-2">{new Date().toLocaleTimeString()}</span>
                      <span>
                        {/* Show Phase 1 if we have Phase 1 activity in console */}
                        {consoleMessages.some(msg => msg.message.includes("Phase 1")) && 
                         !consoleMessages.some(msg => msg.message.includes("Phase 2")) ? 
                          "📋 Phase 1: Updating existing shows..." :
                          tvmazeStatus.currentPage === 0 ? 
                          "🔄 Health check and setup..." : 
                          consoleMessages.some(msg => msg.message.includes("Phase 2")) ?
                          `📄 Phase 2: Processing page ${tvmazeStatus.currentPage}...` :
                          "📋 Phase 1: Updating existing shows..."
                        }
                      </span>
                      <span className="ml-1 animate-pulse">▊</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Console Controls */}
              <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                <span>{consoleMessages.length} messages logged</span>
                <button 
                  onClick={() => setConsoleMessages([])}
                  className="hover:text-gray-700 underline"
                  data-testid="clear-console"
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
                  0
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