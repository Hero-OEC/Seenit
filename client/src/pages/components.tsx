import { useState } from "react";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";

export default function ComponentsPage() {
  const [clickedButton, setClickedButton] = useState<string>("");
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [navbarDemo, setNavbarDemo] = useState<string>("not-signed-in");

  const handleButtonClick = (buttonName: string) => {
    setClickedButton(buttonName);
    setTimeout(() => setClickedButton(""), 2000);
  };

  const toggleSignInState = () => {
    setIsSignedIn(!isSignedIn);
    setNavbarDemo(isSignedIn ? "not-signed-in" : "signed-in");
  };
  return (
    <div className="min-h-screen bg-retro-50">
      {/* Demo Navbar */}
      <Navbar 
        isSignedIn={isSignedIn}
        userName="Alex Morgan"
        onGetStarted={() => alert("Get started clicked!")}
        onHome={() => alert("Home clicked!")}
        onWatchlist={() => alert("Watchlist clicked!")}
        onBrowse={(type) => alert(`Browse ${type} clicked!`)}
        onSchedule={() => alert("Schedule clicked!")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 bg-retro-500 rounded-2xl flex items-center justify-center">
              <span className="font-headline text-white text-4xl">S</span>
            </div>
            <div>
              <h1 className="font-headline text-4xl text-retro-500 mb-2">
                Seenit Components
              </h1>
              <p className="text-retro-900 text-lg">
                A showcase of all reusable components for the Seenit platform
              </p>
            </div>
          </div>
        </div>

        {/* Button Component Showcase */}
        <div className="bg-retro-100 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-2xl text-retro-900 mb-4">
            Button Component
          </h2>
          <p className="text-gray-600 mb-8">
            Versatile button component with multiple variants, sizes, and states using our retro design system.
          </p>
          
          <div className="space-y-8">
            {/* Button Variants */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Variants</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button 
                  variant="default" 
                  onClick={() => handleButtonClick("Default")}
                  data-testid="button-default"
                >
                  Default
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleButtonClick("Secondary")}
                  data-testid="button-secondary"
                >
                  Secondary
                </Button>
                <Button 
                  variant="accent" 
                  onClick={() => handleButtonClick("Accent")}
                  data-testid="button-accent"
                >
                  Accent
                </Button>
                <Button 
                  variant="cream" 
                  onClick={() => handleButtonClick("Cream")}
                  data-testid="button-cream"
                >
                  Cream
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleButtonClick("Outline")}
                  data-testid="button-outline"
                >
                  Outline
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleButtonClick("Ghost")}
                  data-testid="button-ghost"
                >
                  Ghost
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => handleButtonClick("Link")}
                  data-testid="button-link"
                >
                  Link
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleButtonClick("Destructive")}
                  data-testid="button-destructive"
                >
                  Destructive
                </Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  size="sm" 
                  onClick={() => handleButtonClick("Small")}
                  data-testid="button-size-sm"
                >
                  Small
                </Button>
                <Button 
                  size="default" 
                  onClick={() => handleButtonClick("Default")}
                  data-testid="button-size-default"
                >
                  Default
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => handleButtonClick("Large")}
                  data-testid="button-size-lg"
                >
                  Large
                </Button>
                <Button 
                  size="xl" 
                  onClick={() => handleButtonClick("Extra Large")}
                  data-testid="button-size-xl"
                >
                  Extra Large
                </Button>
                <Button 
                  size="icon" 
                  onClick={() => handleButtonClick("Icon")}
                  data-testid="button-size-icon"
                  title="Icon Button"
                >
                  ⭐
                </Button>
              </div>
            </div>

            {/* Button States */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">States</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button 
                  onClick={() => handleButtonClick("Normal")}
                  data-testid="button-state-normal"
                >
                  Normal
                </Button>
                <Button 
                  disabled
                  data-testid="button-state-disabled"
                >
                  Disabled
                </Button>
                <Button 
                  variant="accent"
                  onClick={() => handleButtonClick("Loading")}
                  data-testid="button-state-loading"
                >
                  Loading...
                </Button>
              </div>
            </div>

            {/* Color Combinations */}
            <div>
              <h3 className="font-medium text-lg text-retro-dark mb-4">Color Combinations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={() => handleButtonClick("Primary Action")}
                  data-testid="button-combo-primary"
                >
                  Primary Action
                </Button>
                <Button 
                  variant="cream" 
                  size="lg"
                  onClick={() => handleButtonClick("Soft Action")}
                  data-testid="button-combo-soft"
                >
                  Soft Action
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => handleButtonClick("Secondary Action")}
                  data-testid="button-combo-secondary"
                >
                  Secondary Action
                </Button>
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={() => handleButtonClick("Delete Action")}
                  data-testid="button-combo-delete"
                >
                  Delete Action
                </Button>
              </div>
            </div>

            {/* Click Feedback */}
            {clickedButton && (
              <div className="mt-6 p-4 bg-retro-main/10 border border-retro-main rounded-lg">
                <p className="text-retro-dark font-medium">
                  ✨ You clicked: <strong>{clickedButton}</strong> button!
                </p>
              </div>
            )}

            {/* Usage Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Usage Examples</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Import the Button component
import Button from "@/components/Button";

// Basic usage
<Button>Click me</Button>

// With variant and size
<Button variant="accent" size="lg">
  Large Accent Button
</Button>

// With click handler
<Button 
  variant="outline" 
  onClick={() => console.log("Clicked!")}
>
  Outlined Button
</Button>

// Disabled state
<Button disabled>
  Disabled Button
</Button>`}
                </pre>
              </div>
            </div>

            {/* Navbar Demo Controls */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Interactive Demo</h3>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Current state:</span>
                <span className="font-medium text-retro-900">
                  {isSignedIn ? "Signed In (Alex Morgan)" : "Not Signed In"}
                </span>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={toggleSignInState}
                  data-testid="toggle-signin-state"
                >
                  Toggle to {isSignedIn ? "Sign Out" : "Sign In"}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Try clicking the user avatar when signed in to see the dropdown menu, or the "Get Started" button when signed out.
              </p>
            </div>
          </div>
        </div>

        {/* Navbar Component Showcase */}
        <div className="bg-retro-100 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-2xl text-retro-900 mb-4">
            Navbar Component
          </h2>
          <p className="text-gray-600 mb-8">
            Clean navigation bar with navigation menu and browse dropdown for signed-in users, action buttons for not signed-in users.
          </p>
          
          <div className="space-y-8">
            {/* Navbar Features */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Features</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-retro-900">Signed In State:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Navigation menu: Home, Watchlist, Browse, Schedule</li>
                    <li>• Browse dropdown with Movies, TV Shows, Anime</li>
                    <li>• User name and avatar display</li>
                    <li>• Clean white background design</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-retro-900">Not Signed In State:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Get Started button (outline style)</li>
                    <li>• Sign In button (primary style)</li>
                    <li>• Clean minimal design</li>
                    <li>• Focus on authentication actions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Usage Examples</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Import the Navbar component
import Navbar from "@/components/Navbar";

// Not signed in state
<Navbar 
  isSignedIn={false}
  onGetStarted={() => navigate('/signup')}
/>

// Signed in state with navigation
<Navbar 
  isSignedIn={true}
  userName="John Doe"
  onHome={() => navigate('/home')}
  onWatchlist={() => navigate('/watchlist')}
  onBrowse={(type) => navigate(\`/browse/\${type.toLowerCase()}\`)}
  onSchedule={() => navigate('/schedule')}
/>

// Full customization
<Navbar 
  isSignedIn={user?.isAuthenticated}
  userName={user?.name}
  onGetStarted={() => router.push('/auth')}
  onHome={() => router.push('/home')}
  onWatchlist={() => router.push('/watchlist')}
  onBrowse={(type) => handleBrowse(type)}
  onSchedule={() => router.push('/schedule')}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}