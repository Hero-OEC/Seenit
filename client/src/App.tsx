import { Route, Switch } from "wouter";
import Home from "@/pages/Home";
import ComponentsPage from "@/pages/components";
import Discover from "@/pages/Discover";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
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
  );
}

export default App;