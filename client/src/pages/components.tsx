import { useState } from "react";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import Input from "@/components/Input";

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
        {/* Interactive Demo Controls */}
        <div className="bg-retro-100 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-2xl text-retro-900 mb-4">
            Interactive Demo
          </h2>
          <p className="text-gray-600 mb-6">
            Test the navbar functionality by toggling between signed-in and not signed-in states.
          </p>
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
            Try the navigation menu and Browse dropdown when signed in, or the "Get Started" button when signed out.
          </p>
        </div>
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


          </div>
        </div>

        {/* Input Component Showcase */}
        <div className="bg-retro-100 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-2xl text-retro-900 mb-4">
            Input Component
          </h2>
          <p className="text-gray-600 mb-8">
            Flexible input component with multiple variants, sizes, states, and support for icons, labels, and validation messages.
          </p>
          
          <div className="space-y-8">
            {/* Input Variants */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Variants</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    variant="default" 
                    placeholder="Default input"
                    data-testid="input-default"
                  />
                  <Input 
                    variant="retro" 
                    placeholder="Retro styled input"
                    data-testid="input-retro"
                  />
                  <Input 
                    variant="accent" 
                    placeholder="Accent input"
                    data-testid="input-accent"
                  />
                </div>
                <div className="space-y-4">
                  <Input 
                    variant="error" 
                    placeholder="Error state input"
                    data-testid="input-error"
                  />
                  <Input 
                    variant="success" 
                    placeholder="Success state input"
                    data-testid="input-success"
                  />
                </div>
              </div>
            </div>

            {/* Input Sizes */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Sizes</h3>
              <div className="space-y-4">
                <Input 
                  size="sm" 
                  placeholder="Small input"
                  data-testid="input-small"
                />
                <Input 
                  size="default" 
                  placeholder="Default input"
                  data-testid="input-default-size"
                />
                <Input 
                  size="lg" 
                  placeholder="Large input"
                  data-testid="input-large"
                />
                <Input 
                  size="xl" 
                  placeholder="Extra large input"
                  data-testid="input-extra-large"
                />
              </div>
            </div>

            {/* Input with Labels and Messages */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Labels & Messages</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    label="Email Address"
                    placeholder="Enter your email"
                    helper="We'll never share your email"
                    type="email"
                    data-testid="input-with-label"
                  />
                  <Input 
                    label="Password"
                    placeholder="Enter password"
                    error="Password must be at least 8 characters"
                    type="password"
                    variant="error"
                    data-testid="input-with-error"
                  />
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Username"
                    placeholder="Choose a username"
                    success="Username is available!"
                    variant="success"
                    data-testid="input-with-success"
                  />
                  <Input 
                    label="Full Name"
                    placeholder="Enter your full name"
                    variant="retro"
                    data-testid="input-retro-label"
                  />
                </div>
              </div>
            </div>

            {/* Input with Icons */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">With Icons</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    label="Search"
                    placeholder="Search movies, shows..."
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                    data-testid="input-search-icon"
                  />
                  <Input 
                    label="Email"
                    placeholder="your@email.com"
                    type="email"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    }
                    data-testid="input-email-icon"
                  />
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Amount"
                    placeholder="0.00"
                    type="number"
                    leftIcon={
                      <span className="text-gray-500 font-medium">$</span>
                    }
                    rightIcon={
                      <span className="text-gray-400 text-sm">USD</span>
                    }
                    data-testid="input-currency"
                  />
                  <Input 
                    label="Website"
                    placeholder="example.com"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    }
                    data-testid="input-website-icon"
                  />
                </div>
              </div>
            </div>

            {/* Input Types & Special Features */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Input Types & Special Features</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    label="Password with Toggle"
                    placeholder="Enter password"
                    type="password"
                    showPasswordToggle={true}
                    data-testid="input-password-toggle"
                  />
                  <Input 
                    label="Date"
                    type="date"
                    data-testid="input-date"
                  />
                  <Input 
                    label="Time"
                    type="time"
                    data-testid="input-time"
                  />
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Phone Number"
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                    data-testid="input-phone"
                  />
                  <Input 
                    label="Age"
                    placeholder="25"
                    type="number"
                    min="0"
                    max="120"
                    data-testid="input-number"
                  />
                  <Input 
                    label="Disabled Input"
                    placeholder="Cannot edit this"
                    disabled
                    data-testid="input-disabled"
                  />
                </div>
              </div>
            </div>

            {/* Real-world Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Real-world Examples</h3>
              <div className="space-y-6">
                {/* Login Form Example */}
                <div className="p-6 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-retro-900 mb-4">Login Form</h4>
                  <div className="space-y-4 max-w-md">
                    <Input 
                      label="Email"
                      type="email"
                      placeholder="your@email.com"
                      variant="retro"
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      }
                      data-testid="login-email"
                    />
                    <Input 
                      label="Password"
                      type="password"
                      placeholder="Enter your password"
                      variant="retro"
                      showPasswordToggle={true}
                      data-testid="login-password"
                    />
                  </div>
                </div>

                {/* Search Example */}
                <div className="p-6 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-retro-900 mb-4">Search Bar</h4>
                  <Input 
                    placeholder="Search for movies, TV shows, or anime..."
                    variant="accent"
                    size="lg"
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                    data-testid="search-bar"
                  />
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Usage Examples</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Import the Input component
import Input from "@/components/Input";

// Basic usage
<Input placeholder="Enter text" />

// With label and helper text
<Input 
  label="Email" 
  placeholder="your@email.com"
  helper="We'll never share your email"
/>

// With validation
<Input 
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  variant="error"
/>

// With icons
<Input 
  placeholder="Search..."
  leftIcon={<SearchIcon />}
  variant="accent"
/>

// Password with toggle
<Input 
  type="password"
  showPasswordToggle={true}
  placeholder="Enter password"
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Navbar Component Showcase */}
        <div className="bg-retro-100 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="font-semibold text-2xl text-retro-900 mb-4">
            Navbar Component
          </h2>
          <p className="text-gray-600 mb-8">
            Clean navigation bar with full navigation menu and browse dropdown available to all users, with personalized features for signed-in users.
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
                    <li>• Personalized navigation experience</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-retro-900">Not Signed In State:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Navigation menu: Home, Discover, Browse, Schedule</li>
                    <li>• Browse dropdown with Movies, TV Shows, Anime</li>
                    <li>• Get Started button (primary call-to-action)</li>
                    <li>• Full site navigation without sign-up requirement</li>
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

// Not signed in state - single call-to-action
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