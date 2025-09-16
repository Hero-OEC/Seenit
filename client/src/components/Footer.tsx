export default function Footer() {
  return (
    <footer className="mt-auto bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-3">
          {/* TMDB Attribution */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center space-y-2">
            <p className="font-medium">
              This product uses the TMDb API but is not endorsed or certified by TMDb.
            </p>
            <div className="flex items-center justify-center gap-2">
              <span>Data provided by</span>
              <a 
                href="https://www.themoviedb.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 underline font-medium"
                data-testid="link-tmdb-attribution"
              >
                <img 
                  src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                  alt="TMDb Logo"
                  className="h-6 w-auto"
                />
                The Movie Database (TMDb)
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-xs text-gray-500 text-center">
            © 2025 Seenit. Built for entertainment tracking.
          </div>
        </div>
      </div>
    </footer>
  );
}