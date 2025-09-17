import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RefreshCw, Database, Calendar, Clock, Trash2, Terminal, AlertTriangle } from "lucide-react";
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


interface JikanContent {
  count: number;
  content: Array<{
    id: string;
    title: string;
    year: number | null;
    rating: number | null;
    episodes: number | null;
    studio: string | null;
  }>;
}

interface TMDBContent {
  count: number;
  content: Array<{
    id: string;
    title: string;
    type: string;
    year: number | null;
    rating: number | null;
    genres: string[] | null;
  }>;
}

function Import() {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [tvmazeConsoleMessages, setTvmazeConsoleMessages] = useState<Array<{id: number, timestamp: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([]);
  const [jikanConsoleMessages, setJikanConsoleMessages] = useState<Array<{id: number, timestamp: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([]);
  const [tmdbConsoleMessages, setTmdbConsoleMessages] = useState<Array<{id: number, timestamp: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([]);
  const tvmazeConsoleRef = useRef<HTMLDivElement>(null);
  const jikanConsoleRef = useRef<HTMLDivElement>(null);
  const tmdbConsoleRef = useRef<HTMLDivElement>(null);
  const lastStatusRef = useRef<ImportStatus | null>(null);
  const lastJikanStatusRef = useRef<ImportStatus | null>(null);
  const lastTmdbStatusRef = useRef<ImportStatus | null>(null);

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    source: string;
    action: (() => void) | null;
  }>({
    isOpen: false,
    source: '',
    action: null
  });

  const [isModalVisible, setIsModalVisible] = useState(false);

  // Query for TVmaze import status
  const { data: tvmazeStatus, isLoading: statusLoading } = useQuery<ImportStatus | null>({
    queryKey: ['/api/import/tvmaze/status'],
    refetchInterval: 3000, // Fixed 3s polling to ensure consistent updates
    staleTime: 0, // Always refetch, don't use stale data
  });


  // Query for Jikan import status
  const { data: jikanStatus, isLoading: jikanStatusLoading } = useQuery<ImportStatus | null>({
    queryKey: ['/api/import/jikan/status'],
    refetchInterval: 3000, // Fixed 3s polling to ensure consistent updates
    staleTime: 0, // Always refetch, don't use stale data
  });

  // Query for TMDB import status
  const { data: tmdbStatus, isLoading: tmdbStatusLoading } = useQuery<ImportStatus | null>({
    queryKey: ['/api/import/tmdb/status'],
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


  // Add console message for Jikan
  const addJikanConsoleMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setJikanConsoleMessages(prev => {
      const newMessages = [...prev, { id: Date.now() + Math.random(), timestamp, message, type }];
      // Keep only last 50 messages
      return newMessages.slice(-50);
    });
  };

  // Add console message for TMDB
  const addTmdbConsoleMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTmdbConsoleMessages(prev => {
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
    if (jikanConsoleRef.current) {
      jikanConsoleRef.current.scrollTop = jikanConsoleRef.current.scrollHeight;
    }
  }, [jikanConsoleMessages]);

  useEffect(() => {
    if (tmdbConsoleRef.current) {
      tmdbConsoleRef.current.scrollTop = tmdbConsoleRef.current.scrollHeight;
    }
  }, [tmdbConsoleMessages]);

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


  // Watch for Jikan status changes and generate console messages
  useEffect(() => {
    if (!jikanStatus) return;

    const lastStatus = lastJikanStatusRef.current;
    lastJikanStatusRef.current = jikanStatus;

    // Don't log on first load
    if (!lastStatus) {
      if (jikanStatus.isActive) {
        addJikanConsoleMessage("🔄 Jikan import is currently active", 'info');
        addJikanConsoleMessage("📋 Phase 1: Updating existing anime with new episodes", 'info');
      } else {
        addJikanConsoleMessage("⏸️ Jikan import is paused", 'warning');
      }
      addJikanConsoleMessage(`📊 Current status: ${jikanStatus.totalImported} anime imported`, 'info');
      return;
    }

    // Status changed from inactive to active
    if (!lastStatus.isActive && jikanStatus.isActive) {
      addJikanConsoleMessage("🚀 Jikan import started", 'success');
      addJikanConsoleMessage("🔍 Running health check to verify database consistency", 'info');
    }

    // Status changed from active to inactive
    if (lastStatus.isActive && !jikanStatus.isActive) {
      addJikanConsoleMessage("⏹️ Jikan import stopped", 'warning');
    }

    // Page progress - only log actual page changes for Phase 2
    if (lastStatus.currentPage !== jikanStatus.currentPage && jikanStatus.isActive) {
      if (jikanStatus.currentPage === 0) {
        addJikanConsoleMessage("📋 Starting Phase 1: Updating existing anime with new episodes", 'info');
      } else if (jikanStatus.currentPage > 1) {
        addJikanConsoleMessage(`📄 Phase 2: Processing page ${jikanStatus.currentPage} (importing new anime)`, 'info');
      }
    }

    // Import count increased
    if (lastStatus.totalImported < jikanStatus.totalImported) {
      const diff = jikanStatus.totalImported - lastStatus.totalImported;
      addJikanConsoleMessage(`✅ Imported/updated ${diff} anime (Total: ${jikanStatus.totalImported})`, 'success');
    }

    // Phase 1 progress updated
    if (lastStatus.phase1Progress !== jikanStatus.phase1Progress && jikanStatus.phase1Progress) {
      if (jikanStatus.phase1Progress.includes('Phase 1 Complete')) {
        addJikanConsoleMessage(`✅ ${jikanStatus.phase1Progress}`, 'success');
      } else {
        addJikanConsoleMessage(`📋 Phase 1 Progress: ${jikanStatus.phase1Progress}`, 'info');
      }
    }

    // Phase 2 progress updated
    if (lastStatus.phase2Progress !== jikanStatus.phase2Progress && jikanStatus.phase2Progress) {
      if (jikanStatus.phase2Progress.includes('Complete')) {
        addJikanConsoleMessage(`🎉 ${jikanStatus.phase2Progress}`, 'success');
        addJikanConsoleMessage(`🔄 Starting Phase 3: Migration - searching for anime in TV shows...`, 'info');
      } else {
        addJikanConsoleMessage(`📄 Phase 2: ${jikanStatus.phase2Progress}`, 'info');
      }
    }

    // Phase 3 progress updated
    // @ts-ignore - temporary fix for type loading
    if (lastStatus.phase3Progress !== jikanStatus.phase3Progress && jikanStatus.phase3Progress) {
      // @ts-ignore
      if (jikanStatus.phase3Progress.includes('Phase 3 Complete')) {
        // @ts-ignore
        addJikanConsoleMessage(`✅ ${jikanStatus.phase3Progress}`, 'success');
      } else {
        // @ts-ignore
        addJikanConsoleMessage(`🔄 Phase 3: ${jikanStatus.phase3Progress}`, 'info');
      }
    }

    // Errors
    if (jikanStatus.errors && jikanStatus.errors.length > (lastStatus.errors?.length || 0)) {
      const newErrors = jikanStatus.errors.slice(lastStatus.errors?.length || 0);
      newErrors.forEach(error => {
        addJikanConsoleMessage(`❌ Jikan Error: ${error}`, 'error');
      });
    }
  }, [jikanStatus]); // Track Jikan phase updates

  // Watch for TMDB status changes and generate console messages
  useEffect(() => {
    if (!tmdbStatus) return;

    const lastStatus = lastTmdbStatusRef.current;
    lastTmdbStatusRef.current = tmdbStatus;

    // Don't log on first load
    if (!lastStatus) {
      if (tmdbStatus.isActive) {
        addTmdbConsoleMessage("🔄 TMDB import is currently active", 'info');
        addTmdbConsoleMessage("🎬 Importing popular movies from TMDB", 'info');
      } else {
        addTmdbConsoleMessage("⏸️ TMDB import is paused", 'warning');
      }
      addTmdbConsoleMessage(`📊 Current status: ${tmdbStatus.totalImported} movies imported`, 'info');
      return;
    }

    // Status changed from inactive to active
    if (!lastStatus.isActive && tmdbStatus.isActive) {
      addTmdbConsoleMessage("🚀 TMDB import started", 'success');
      addTmdbConsoleMessage("🔍 Running health check to verify database consistency", 'info');
    }

    // Status changed from active to inactive
    if (lastStatus.isActive && !tmdbStatus.isActive) {
      addTmdbConsoleMessage("⏹️ TMDB import stopped", 'warning');
    }

    // Page progress
    if (lastStatus.currentPage !== tmdbStatus.currentPage && tmdbStatus.isActive) {
      addTmdbConsoleMessage(`📄 Processing page ${tmdbStatus.currentPage} (importing movies)`, 'info');
    }

    // Import count increased
    if (lastStatus.totalImported < tmdbStatus.totalImported) {
      const diff = tmdbStatus.totalImported - lastStatus.totalImported;
      addTmdbConsoleMessage(`✅ Imported ${diff} movies (Total: ${tmdbStatus.totalImported})`, 'success');
    }

    // Phase 1 progress updated
    if (lastStatus.phase1Progress !== tmdbStatus.phase1Progress && tmdbStatus.phase1Progress) {
      if (tmdbStatus.phase1Progress.includes('complete')) {
        addTmdbConsoleMessage(`✅ ${tmdbStatus.phase1Progress}`, 'success');
      } else {
        addTmdbConsoleMessage(`🎬 ${tmdbStatus.phase1Progress}`, 'info');
      }
    }

    // Errors
    if (tmdbStatus.errors && tmdbStatus.errors.length > (lastStatus.errors?.length || 0)) {
      const newErrors = tmdbStatus.errors.slice(lastStatus.errors?.length || 0);
      newErrors.forEach(error => {
        addTmdbConsoleMessage(`❌ TMDB Error: ${error}`, 'error');
      });
    }
  }, [tmdbStatus]);

  // Query for TVmaze content stats
  const { data: tvmazeContent } = useQuery<TVMazeContent>({
    queryKey: ['/api/import/tvmaze/content'],
    refetchInterval: 10000, // Fixed 10s polling for content
    staleTime: 5000, // Allow some stale data for content
  });


  // Query for Jikan content
  const { data: jikanContent } = useQuery<JikanContent>({
    queryKey: ['/api/import/jikan/content'],
    refetchInterval: 10000, // Fixed 10s polling for content
    staleTime: 5000, // Allow some stale data for content
  });

  // Query for TMDB content
  const { data: tmdbContent } = useQuery<TMDBContent>({
    queryKey: ['/api/import/tmdb/content'],
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


  // Jikan mutations
  const startJikanImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/jikan/start'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/jikan/status'] });
    },
  });

  const pauseJikanImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/jikan/pause'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/jikan/status'] });
    },
  });

  const deleteJikanData = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/import/jikan/data'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/jikan/content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content/type/anime'] });
      setRefreshKey(prev => prev + 1);
    },
  });

  // TMDB mutations
  const startTmdbImport = useMutation({
    mutationFn: (data?: { maxPages?: number }) => apiRequest('POST', '/api/import/tmdb/movies', data || { maxPages: 50 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/tmdb/status'] });
    },
  });

  const startComprehensiveImport = useMutation({
    mutationFn: (data?: { maxPages?: number }) => apiRequest('POST', '/api/import/tmdb/comprehensive', data || { maxPages: 200 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/tmdb/status'] });
    },
  });

  const pauseTmdbImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/tmdb/pause'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/tmdb/status'] });
    },
  });

  const deleteTmdbData = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/import/tmdb/data'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/type/movie'] });
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
    setDeleteDialog({
      isOpen: true,
      source,
      action
    });
    // Trigger animation after state update
    setTimeout(() => setIsModalVisible(true), 10);
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.action) {
      deleteDialog.action();
    }
    closeModal();
  };

  const handleDeleteCancel = () => {
    closeModal();
  };

  const closeModal = () => {
    setIsModalVisible(false);
    // Wait for animation to complete before hiding modal
    setTimeout(() => {
      setDeleteDialog({ isOpen: false, source: '', action: null });
    }, 200);
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
              queryClient.invalidateQueries({ queryKey: ['/api/import/jikan/status'] });
              queryClient.invalidateQueries({ queryKey: ['/api/import/jikan/content'] });
              queryClient.invalidateQueries({ queryKey: ['/api/import/tmdb/status'] });
              queryClient.invalidateQueries({ queryKey: ['/api/content/type/movie'] });
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
                {getStatusBadge(
                  tmdbStatus?.isActive || false, 
                  (tmdbContent?.count || 0) > 0,
                  tmdbStatusLoading && !tmdbStatus
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-sm text-gray-500" data-testid="text-tmdb-sync">
                  {formatDate(tmdbStatus?.lastSyncAt || null)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Content:</span>
                <span className="font-medium text-blue-600" data-testid="text-tmdb-count">
                  {tmdbContent?.count || 0}
                </span>
              </div>
              {tmdbStatus?.errors && tmdbStatus.errors.length > 0 && (
                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-red-600">
                      {tmdbStatus.errors.length} error(s)
                    </summary>
                    <div className="mt-1 text-xs text-red-500 max-h-20 overflow-y-auto">
                      {tmdbStatus.errors.slice(-3).map((error, i) => (
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
                  onClick={() => confirmDelete('TMDB', () => deleteTmdbData.mutate())}
                  disabled={deleteTmdbData.isPending || tmdbStatus?.isActive}
                  className="w-full flex items-center gap-2"
                  data-testid="button-delete-tmdb"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteTmdbData.isPending ? 'Deleting...' : 'Delete All TMDB Data'}
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

          {/* Jikan Section */}
          <Card data-testid="card-jikan">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Jikan (Anime)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                {getStatusBadge(
                  jikanStatus?.isActive || false, 
                  (jikanContent?.count || 0) > 0,
                  jikanStatusLoading && !jikanStatus
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-sm text-gray-500" data-testid="text-jikan-sync">
                  {formatDate(jikanStatus?.lastSyncAt || null)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Content:</span>
                <span className="font-medium text-orange-600" data-testid="text-jikan-count">
                  {jikanContent?.count || 0}
                </span>
              </div>
              {jikanStatus?.errors && jikanStatus.errors.length > 0 && (
                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-red-600">
                      {jikanStatus.errors.length} error(s)
                    </summary>
                    <div className="mt-1 text-xs text-red-500 max-h-20 overflow-y-auto">
                      {jikanStatus.errors.slice(-3).map((error, i) => (
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
                  onClick={() => confirmDelete('Jikan', () => deleteJikanData.mutate())}
                  disabled={deleteJikanData.isPending || jikanStatus?.isActive}
                  className="w-full flex items-center gap-2"
                  data-testid="button-delete-jikan-card"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteJikanData.isPending ? 'Deleting...' : 'Delete All Jikan Data'}
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


        {/* TMDB Controls Section */}
        <Card className="mt-8" data-testid="card-tmdb-controls">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              TMDB Import Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex gap-2">
                {tmdbStatus?.isActive ? (
                  <Button
                    variant="outline"
                    onClick={() => pauseTmdbImport.mutate()}
                    disabled={pauseTmdbImport.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-stop-tmdb-import"
                  >
                    <Pause className="w-4 h-4" />
                    {pauseTmdbImport.isPending ? 'Stopping...' : 'Stop Import'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => startComprehensiveImport.mutate({ maxPages: 500 })}
                    disabled={startComprehensiveImport.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-start-tmdb-import"
                  >
                    <Play className="w-4 h-4" />
                    {startComprehensiveImport.isPending ? 'Starting...' : 'Import Movies'}
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete('TMDB', () => deleteTmdbData.mutate())}
                  disabled={deleteTmdbData.isPending || tmdbStatus?.isActive}
                  data-testid="button-delete-tmdb-control"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Comprehensive Import: Popular + Top Rated + Recent movies</span>
                </div>
                <div>Rate Limited: 45 requests per second, 950 requests per day (TMDB Free Tier)</div>
                <div className="text-xs mt-1">Imports ~940 movies per day (Free tier: 1,000 daily requests)</div>
                {tmdbStatus?.isActive && (
                  <div className="mt-2 text-blue-600 dark:text-blue-400">
                    Currently importing movies from TMDB API...
                  </div>
                )}
              </div>
            </div>

            {/* Live Import Console */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4" />
                <h3 className="font-medium">TMDB Import Console</h3>
                <Badge variant="outline" className={tmdbStatus?.isActive ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}>
                  {tmdbStatus?.isActive ? 'Active' : 'Idle'}
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg border border-blue-700 shadow-inner h-80 overflow-hidden">
                <div 
                  ref={tmdbConsoleRef}
                  className="h-full overflow-y-auto space-y-1 font-mono text-sm p-4 console-scrollbar"
                  data-testid="tmdb-console"
                >
                  {tmdbConsoleMessages.length === 0 ? (
                    <div className="text-gray-400 flex items-center gap-2">
                      <span className="text-blue-400 font-semibold">seenit@tmdb:~$</span> 
                      <span className="text-gray-500">Waiting for TMDB import activity...</span>
                      <span className="animate-pulse text-blue-400">▊</span>
                    </div>
                  ) : (
                    tmdbConsoleMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-3 py-1 px-2 rounded hover:bg-blue-800/30 transition-colors duration-200">
                        <span className="text-gray-500 text-xs shrink-0 min-w-[65px] font-medium">{msg.timestamp}</span>
                        <span className={`leading-relaxed ${
                          msg.type === 'success' ? 'text-blue-300' :
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
                  {tmdbStatus?.isActive && (
                    <div className="flex items-center text-blue-400 py-1 px-2 bg-blue-400/10 rounded border-l-2 border-blue-400 mt-2">
                      <span className="text-gray-500 text-xs mr-3 min-w-[65px] font-medium">{new Date().toLocaleTimeString()}</span>
                      <span className="text-blue-300 leading-relaxed">
                        🎬 Processing TMDB movies page {tmdbStatus.currentPage}...
                      </span>
                      <span className="ml-2 animate-pulse text-blue-400 font-bold">▊</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Console Controls */}
              <div className="mt-3 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">
                  <Terminal className="inline w-3 h-3 mr-1" />
                  {tmdbConsoleMessages.length} messages logged
                </span>
                <button 
                  onClick={() => setTmdbConsoleMessages([])}
                  className="px-3 py-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors duration-200 font-medium"
                  data-testid="clear-tmdb-console"
                >
                  Clear Console
                </button>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Jikan Controls Section */}
        <Card className="mt-8" data-testid="card-jikan-controls">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Jikan Import Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex gap-2">
                {jikanStatus?.isActive ? (
                  <Button
                    variant="outline"
                    onClick={() => pauseJikanImport.mutate()}
                    disabled={pauseJikanImport.isPending}
                    data-testid="button-pause-jikan"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Jikan Import
                  </Button>
                ) : (
                  <Button
                    onClick={() => startJikanImport.mutate()}
                    disabled={startJikanImport.isPending || jikanStatusLoading}
                    data-testid="button-start-jikan"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Jikan Import
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete('Jikan', () => deleteJikanData.mutate())}
                  disabled={deleteJikanData.isPending || jikanStatus?.isActive}
                  data-testid="button-delete-jikan"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </div>

              {(jikanStatus?.lastSyncAt || jikanContent) && (
                <div className="text-sm text-gray-500 space-y-1">
                  <div>Last Run: {formatDate(jikanStatus?.lastSyncAt || null)}</div>
                  <div>Imported: {jikanContent?.count || 0} anime</div>
                </div>
              )}
            </div>

            {/* Jikan Import Console */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4" />
                <h3 className="font-medium">Jikan Import Console</h3>
                <Badge variant="outline" className={jikanStatus?.isActive ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-500'}>
                  {jikanStatus?.isActive ? 'Active' : 'Idle'}
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg border border-orange-700 shadow-inner h-80 overflow-hidden">
                <div 
                  ref={jikanConsoleRef}
                  className="h-full overflow-y-auto space-y-1 font-mono text-sm p-4 console-scrollbar"
                  data-testid="jikan-console"
                >
                  {jikanConsoleMessages.length === 0 ? (
                    <div className="text-gray-400 flex items-center gap-2">
                      <span className="text-orange-400 font-semibold">seenit@jikan:~$</span> 
                      <span className="text-gray-500">Waiting for Jikan import activity...</span>
                      <span className="animate-pulse text-orange-400">▊</span>
                    </div>
                  ) : (
                    jikanConsoleMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-3 py-1 px-2 rounded hover:bg-orange-800/30 transition-colors duration-200">
                        <span className="text-gray-500 text-xs shrink-0 min-w-[65px] font-medium">{msg.timestamp}</span>
                        <span className={`leading-relaxed ${
                          msg.type === 'success' ? 'text-orange-300' :
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
                  {jikanStatus?.isActive && (
                    <div className="flex items-center text-orange-400 py-1 px-2 bg-orange-400/10 rounded border-l-2 border-orange-400 mt-2">
                      <span className="text-gray-500 text-xs mr-3 min-w-[65px] font-medium">{new Date().toLocaleTimeString()}</span>
                      <span className="text-orange-300 leading-relaxed">
                        {/* Determine current phase based on latest activity */}
                        {jikanConsoleMessages.some(msg => msg.message.includes("Phase 2")) ? 
                          `📄 Phase 2: Processing page ${jikanStatus.currentPage}...` :
                          jikanConsoleMessages.some(msg => msg.message.includes("Phase 1")) && 
                          !jikanConsoleMessages.some(msg => msg.message.includes("Phase 1 Complete")) ? 
                          "📋 Phase 1: Updating existing anime..." :
                          jikanStatus.currentPage === 0 ? 
                          "🔄 Health check and setup..." : 
                          "🔄 Processing with migration detection..."
                        }
                      </span>
                      <span className="ml-2 animate-pulse text-orange-400 font-bold">▊</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Console Controls */}
              <div className="mt-3 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">
                  <Terminal className="inline w-3 h-3 mr-1" />
                  {jikanConsoleMessages.length} messages logged
                </span>
                <button 
                  onClick={() => setJikanConsoleMessages([])}
                  className="px-3 py-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors duration-200 font-medium"
                  data-testid="clear-jikan-console"
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
                <div className="text-2xl font-bold text-blue-600" data-testid="stat-tmdb">
                  {tmdbContent?.count || 0}
                </div>
                <div className="text-sm text-gray-500">TMDB Movies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600" data-testid="stat-jikan">
                  {jikanContent?.count || 0}
                </div>
                <div className="text-sm text-gray-500">Jikan Anime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200" data-testid="stat-total">
                  {(tvmazeContent?.count || 0) + (jikanContent?.count || 0) + (tmdbContent?.count || 0)}
                </div>
                <div className="text-sm text-gray-500">Total Content</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteDialog.isOpen && (
        <div 
          className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-all duration-200 ease-out ${
            isModalVisible ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          data-testid="delete-confirmation-modal"
        >
          <Card 
            className={`w-full max-w-md mx-4 transition-all duration-200 ease-out ${
              isModalVisible 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 translate-y-4'
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <strong>ALL {deleteDialog.source} data</strong>?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  className="flex-1"
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="flex-1"
                  data-testid="button-confirm-delete"
                >
                  Delete All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Import;