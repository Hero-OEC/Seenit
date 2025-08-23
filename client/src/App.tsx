import { Route, Switch, useLocation } from "wouter";
import Home from "@/pages/Home";
import ComponentsPage from "@/pages/components";
import Discover from "@/pages/Discover";
import Schedule from "@/pages/Schedule";
import ContentDetails from "@/pages/ContentDetails";
import SignIn from "@/pages/SignIn";
import Watchlist from "@/pages/Watchlist";
import Navbar from "@/components/Navbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function AppContent() {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    // Navigate to discover page with search
    setLocation(`/discover?search=${encodeURIComponent(query)}`);
  };

  const handleGetStarted = () => {
    setLocation("/signin");
  };

  const handleWatchlist = () => {
    setLocation("/watchlist");
  };

  const handleProfile = () => {
    // TODO: Navigate to profile page when implemented
    console.log("Navigate to profile");
  };

  // Don't show navbar on signin page
  const showNavbar = location !== "/signin";

  return (
    <>
      {showNavbar && (
        <Navbar
          isSignedIn={!!user}
          userName={user?.name}
          onGetStarted={handleGetStarted}
          onWatchlist={handleWatchlist}
          onProfile={handleProfile}
          onSignOut={signOut}
          onSearch={handleSearch}
        />
      )}
      <div className={showNavbar ? "pt-16" : ""}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/discover" component={Discover} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/watchlist" component={Watchlist} />
          <Route path="/content/:id" component={ContentDetails} />
          <Route path="/signin" component={SignIn} />
          <Route path="/components" component={ComponentsPage} />
          <Route>
            <div className="min-h-screen flex items-center justify-center bg-retro-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-retro-900 mb-4">Page Not Found</h1>
                <p className="text-retro-700">The page you're looking for doesn't exist.</p>
              </div>
            </div>
          </Route>
        </Switch>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;