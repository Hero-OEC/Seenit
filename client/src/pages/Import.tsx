import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RefreshCw, Database, Calendar, Clock } from "lucide-react";
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
  }>;
}

function Import() {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  // Query for TVmaze import status
  const { data: tvmazeStatus, isLoading: statusLoading } = useQuery<ImportStatus | null>({
    queryKey: ['/api/import/tvmaze/status', refreshKey],
    refetchInterval: 5000, // Refetch every 5 seconds when active
  });

  // Query for TVmaze content stats
  const { data: tvmazeContent } = useQuery<TVMazeContent>({
    queryKey: ['/api/import/tvmaze/content'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Mutation to start TVmaze import
  const startImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/tvmaze/start'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/tvmaze/status'] });
      setRefreshKey(prev => prev + 1);
    },
  });

  // Mutation to pause TVmaze import
  const pauseImport = useMutation({
    mutationFn: () => apiRequest('POST', '/api/import/tvmaze/pause'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import/tvmaze/status'] });
      setRefreshKey(prev => prev + 1);
    },
  });

  // Auto-start import if no content exists yet
  useEffect(() => {
    if (tvmazeContent?.count === 0 && !tvmazeStatus?.isActive && !statusLoading) {
      console.log('No TVmaze content found, auto-starting import...');
      startImport.mutate();
    }
  }, [tvmazeContent?.count, tvmazeStatus?.isActive, statusLoading]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (isActive: boolean, hasContent: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800" data-testid="status-active">Active</Badge>;
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
              setRefreshKey(prev => prev + 1);
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
                {statusLoading ? (
                  <Badge className="bg-gray-100 text-gray-800">Loading...</Badge>
                ) : (
                  getStatusBadge(tvmazeStatus?.isActive || false, (tvmazeContent?.count || 0) > 0)
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
              {tvmazeStatus?.isActive && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress:</span>
                    <span>{tvmazeStatus.totalImported} imported</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Page {tvmazeStatus.currentPage}
                  </div>
                </div>
              )}
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
                <Button
                  onClick={() => startImport.mutate()}
                  disabled={tvmazeStatus?.isActive || startImport.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-start-import"
                >
                  <Play className="w-4 h-4" />
                  {startImport.isPending ? 'Starting...' : 'Start Import'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => pauseImport.mutate()}
                  disabled={!tvmazeStatus?.isActive || pauseImport.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-pause-import"
                >
                  <Pause className="w-4 h-4" />
                  {pauseImport.isPending ? 'Pausing...' : 'Pause Import'}
                </Button>
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
            
            {tvmazeContent && tvmazeContent.count > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">Recent Imports Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {tvmazeContent.content.slice(0, 8).map((item) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="font-medium text-sm truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.year} • {item.rating ? `★ ${item.rating}` : 'No rating'}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Statistics */}
        {tvmazeStatus && (
          <Card className="mt-6" data-testid="card-statistics">
            <CardHeader>
              <CardTitle>Import Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600" data-testid="stat-imported">
                    {tvmazeStatus.totalImported}
                  </div>
                  <div className="text-sm text-gray-500">Shows Imported</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600" data-testid="stat-page">
                    {tvmazeStatus.currentPage}
                  </div>
                  <div className="text-sm text-gray-500">Current Page</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600" data-testid="stat-errors">
                    {tvmazeStatus.errors?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Recent Errors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600" data-testid="stat-progress">
                    {calculateProgress().toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default Import;