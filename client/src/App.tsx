import { Route, Switch } from "wouter";
import HomePage from "@/pages/HomePage";
import ComponentsPage from "@/pages/components";

function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/components" component={ComponentsPage} />
      <Route>
        <div className="min-h-screen bg-retro-bg flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-retro text-retro-main mb-4">Page Not Found</h1>
            <p className="text-retro-dark mb-4">The page you're looking for doesn't exist.</p>
            <a href="/" className="text-retro-accent hover:underline">Go back home</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default App;