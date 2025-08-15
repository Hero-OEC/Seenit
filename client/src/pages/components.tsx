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
            Comprehensive input component supporting multiple interaction types, selection methods, and state feedback with consistent styling.
          </p>
          
          <div className="space-y-8">
            {/* 1. By Interaction Type */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">1. By Interaction Type</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    label="Text Field"
                    placeholder="Enter your name"
                    data-testid="input-text"
                  />
                  <Input 
                    label="Password Field"
                    type="password"
                    placeholder="Enter password"
                    showPasswordToggle={true}
                    data-testid="input-password"
                  />
                  <Input 
                    label="Email Field"
                    type="email"
                    placeholder="your@email.com"
                    data-testid="input-email"
                  />
                  <Input 
                    label="Number Field"
                    type="number"
                    placeholder="123"
                    min="0"
                    max="999"
                    data-testid="input-number"
                  />
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Search Field"
                    type="search"
                    placeholder="Search movies..."
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                    data-testid="input-search"
                  />
                  <Input 
                    label="Phone Number"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    data-testid="input-phone"
                  />
                  <Input 
                    label="Website URL"
                    type="url"
                    placeholder="https://example.com"
                    data-testid="input-url"
                  />
                  <Input 
                    label="Textarea"
                    inputType="textarea"
                    placeholder="Enter multiple lines of text..."
                    rows={3}
                    data-testid="input-textarea"
                  />
                </div>
              </div>
            </div>

            {/* 2. By Selection Type */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">2. By Selection Type</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    label="Dropdown / Select Menu"
                    inputType="select"
                    placeholder="Choose a genre"
                    options={[
                      { value: "action", label: "Action" },
                      { value: "comedy", label: "Comedy" },
                      { value: "drama", label: "Drama" },
                      { value: "horror", label: "Horror" },
                      { value: "sci-fi", label: "Science Fiction" }
                    ]}
                    data-testid="input-select"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Radio Buttons</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="rating" value="good" className="text-retro-500" />
                        <span className="text-sm">Good</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="rating" value="great" className="text-retro-500" />
                        <span className="text-sm">Great</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="rating" value="excellent" className="text-retro-500" />
                        <span className="text-sm">Excellent</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Checkboxes</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded text-retro-500" />
                        <span className="text-sm">Movies</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded text-retro-500" />
                        <span className="text-sm">TV Shows</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded text-retro-500" />
                        <span className="text-sm">Anime</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Toggle Switch</label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="sr-only" />
                      <div className="relative w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-retro-500">
                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                      </div>
                      <span className="text-sm">Enable notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. By Data & Media Input */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">3. By Data & Media Input</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    label="File Upload"
                    type="file"
                    data-testid="input-file"
                  />
                  <Input 
                    label="Image Upload"
                    type="file"
                    accept="image/*"
                    data-testid="input-image"
                  />
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Date Picker"
                    type="date"
                    data-testid="input-date"
                  />
                  <Input 
                    label="Time Picker"
                    type="time"
                    data-testid="input-time"
                  />
                </div>
              </div>
            </div>

            {/* 4. By State Feedback */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">4. By State Feedback</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    label="Default State"
                    placeholder="Normal input field"
                    helper="This is a helper message"
                    data-testid="input-default-state"
                  />
                  <Input 
                    label="Hover State"
                    placeholder="Hover over this input"
                    helper="Hover effects show on desktop"
                    data-testid="input-hover-state"
                  />
                  <Input 
                    label="Focus State"
                    placeholder="Click to focus this input"
                    helper="Focus ring appears when active"
                    data-testid="input-focus-state"
                  />
                  <Input 
                    label="Disabled State"
                    placeholder="Cannot interact with this"
                    disabled
                    data-testid="input-disabled-state"
                  />
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Error State"
                    placeholder="This has an error"
                    error="This field is required"
                    variant="error"
                    data-testid="input-error-state"
                  />
                  <Input 
                    label="Warning State"
                    placeholder="This has a warning"
                    warning="Password strength is weak"
                    variant="warning"
                    data-testid="input-warning-state"
                  />
                  <Input 
                    label="Success State"
                    placeholder="This is validated"
                    success="Email format is correct"
                    variant="success"
                    data-testid="input-success-state"
                  />
                </div>
              </div>
            </div>

            {/* 5. Sizes */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">5. Input Sizes</h3>
              <div className="space-y-4">
                <Input 
                  label="Small Size"
                  placeholder="Small input"
                  inputSize="sm"
                  data-testid="input-size-small"
                />
                <Input 
                  label="Default Size"
                  placeholder="Default input"
                  inputSize="default"
                  data-testid="input-size-default"
                />
                <Input 
                  label="Large Size"
                  placeholder="Large input"
                  inputSize="lg"
                  data-testid="input-size-large"
                />
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

// Basic text input
<Input placeholder="Enter text" />

// With state feedback
<Input 
  label="Email" 
  type="email"
  placeholder="your@email.com"
  variant="success"
  success="Email format is valid"
/>

// Password with toggle
<Input 
  label="Password"
  type="password"
  showPasswordToggle={true}
  placeholder="Enter password"
/>

// Textarea for long text
<Input 
  label="Description"
  inputType="textarea"
  placeholder="Enter description..."
  rows={4}
/>

// Select dropdown
<Input 
  label="Category"
  inputType="select"
  placeholder="Choose category"
  options={[
    { value: "movies", label: "Movies" },
    { value: "tv", label: "TV Shows" }
  ]}
/>

// With icons and sizes
<Input 
  label="Search"
  leftIcon={<SearchIcon />}
  inputSize="lg"
  placeholder="Search content..."
/>

// Error state with warning
<Input 
  label="Username"
  variant="warning"
  warning="Username may already exist"
  placeholder="Enter username"
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