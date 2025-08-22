import { Route, Switch } from "wouter";
import Home from "@/pages/Home";
import ComponentsPage from "@/pages/components";
import Discover from "@/pages/Discover";
import Schedule from "@/pages/Schedule";
import ContentDetails from "@/pages/ContentDetails";
import SignIn from "@/pages/SignIn";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/discover" component={Discover} />
        <Route path="/schedule" component={Schedule} />
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
    </AuthProvider>
  );
}

export default App;