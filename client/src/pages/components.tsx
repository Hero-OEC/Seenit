import { useState } from "react";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import Input from "@/components/Input";
import RadioButton from "@/components/RadioButton";
import Checkbox from "@/components/Checkbox";
import Toggle from "@/components/Toggle";
import ContentDisplay from "@/components/ContentDisplay";
import Tags, { Tag, MOVIE_GENRES, TV_GENRES, ANIME_GENRES } from "@/components/Tags";
import { HeroSection } from "@/components/HeroSection";

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
        onProfile={() => alert("Profile clicked!")}
        onSignOut={() => alert("Sign out clicked!")}
        onSearch={(query) => alert(`Searching for: ${query}`)}
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
                      <RadioButton name="rating" value="good" label="Good" />
                      <RadioButton name="rating" value="great" label="Great" />
                      <RadioButton name="rating" value="excellent" label="Excellent" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Checkboxes</label>
                    <div className="space-y-2">
                      <Checkbox label="Movies" />
                      <Checkbox label="TV Shows" />
                      <Checkbox label="Anime" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Toggle Switch</label>
                    <Toggle label="Enable notifications" />
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

        {/* Content Display Component Showcase */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="font-semibold text-2xl text-retro-900 mb-6">
            Content Display Component
          </h2>
          <p className="text-gray-600 mb-6">
            Display movie, TV show, and anime content with poster images, titles, type badges, status indicators, and episode information.
          </p>

          <div className="space-y-8">
            {/* Basic Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Basic Content Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"
                  title="Avatar: The Way of Water"
                  type="movie"
                  status="finished"
                  onClick={() => alert("Clicked Avatar movie!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/1qpUk27LVI9UoTS7S0EixUBj5aR.jpg"
                  title="The Last of Us"
                  type="tv"
                  status="finished"
                  season={1}
                  episode={9}
                  onClick={() => alert("Clicked The Last of Us!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/tL4McUK15VMrQWiuxG9VkdTOpaR.jpg"
                  title="Attack on Titan"
                  type="anime"
                  status="finished"
                  season={4}
                  episode={28}
                  onClick={() => alert("Clicked Attack on Titan!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/9yBVqNruk6Ykrwc32qrK2TIE5xw.jpg"
                  title="Dune: Part Two"
                  type="movie"
                  status="coming-soon"
                  onClick={() => alert("Clicked Dune Part Two!")}
                />
              </div>
            </div>

            {/* Status Variations */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Status Variations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"
                  title="Stranger Things"
                  type="tv"
                  status="ongoing"
                  season={5}
                  episode={3}
                  onClick={() => alert("Ongoing series!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg"
                  title="The Batman 2"
                  type="movie"
                  status="coming-soon"
                  onClick={() => alert("Coming soon!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg"
                  title="Game of Thrones"
                  type="tv"
                  status="finished"
                  season={8}
                  episode={6}
                  onClick={() => alert("Finished series!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/fuVuDYrs8sxvEolnYr0wCSvtyTi.jpg"
                  title="Cowboy Bebop Live Action"
                  type="tv"
                  status="canceled"
                  season={1}
                  episode={10}
                  onClick={() => alert("Canceled series!")}
                />
              </div>
            </div>

            {/* Episode Information Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Episode Information Display</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/qZtAf4Z1lazGQoYVXiHlSLIThtw.jpg"
                  title="One Piece"
                  type="anime"
                  status="ongoing"
                  season={20}
                  episode={1086}
                  onClick={() => alert("Long running anime!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/4EYPN5mVIhKLfxGruy7Dy41dTVn.jpg"
                  title="Breaking Bad"
                  type="tv"
                  status="finished"
                  season={5}
                  episode={16}
                  onClick={() => alert("Classic finished series!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/z2yahl2uefxDCl0nogcRBstwruJ.jpg"
                  title="Your Name"
                  type="anime"
                  status="finished"
                  onClick={() => alert("Anime movie!")}
                />
              </div>
            </div>

            {/* Long Title Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Long Title Handling</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/rweIrveL43TaxUN0akQEaAXL6x0.jpg"
                  title="Spider-Man: Across the Spider-Verse"
                  type="movie"
                  status="finished"
                  onClick={() => alert("Long movie title!")}
                />
                <ContentDisplay
                  posterUrl="https://image.tmdb.org/t/p/w300/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg"
                  title="That Time I Got Reincarnated as a Slime"
                  type="anime"
                  status="ongoing"
                  season={3}
                  episode={12}
                  onClick={() => alert("Very long anime title!")}
                />
              </div>
            </div>

            {/* Size Variations */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Size Variations</h3>
              <div className="space-y-6">
                {/* Default Size */}
                <div>
                  <h4 className="font-medium text-retro-900 mb-3">Default Size</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <ContentDisplay
                      posterUrl="https://image.tmdb.org/t/p/w300/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"
                      title="Avatar: The Way of Water"
                      type="movie"
                      status="finished"
                      size="default"
                      onClick={() => alert("Default size movie!")}
                    />
                    <ContentDisplay
                      posterUrl="https://image.tmdb.org/t/p/w300/1qpUk27LVI9UoTS7S0EixUBj5aR.jpg"
                      title="The Last of Us"
                      type="tv"
                      status="finished"
                      season={1}
                      episode={9}
                      size="default"
                      onClick={() => alert("Default size TV show!")}
                    />
                  </div>
                </div>

                {/* Small Size */}
                <div>
                  <h4 className="font-medium text-retro-900 mb-3">Small Size (50% smaller)</h4>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    <ContentDisplay
                      posterUrl="https://image.tmdb.org/t/p/w300/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"
                      title="Avatar: The Way of Water"
                      type="movie"
                      status="finished"
                      size="small"
                      onClick={() => alert("Small size movie!")}
                    />
                    <ContentDisplay
                      posterUrl="https://image.tmdb.org/t/p/w300/1qpUk27LVI9UoTS7S0EixUBj5aR.jpg"
                      title="The Last of Us"
                      type="tv"
                      status="finished"
                      season={1}
                      episode={9}
                      size="small"
                      onClick={() => alert("Small size TV show!")}
                    />
                    <ContentDisplay
                      posterUrl="https://image.tmdb.org/t/p/w300/tL4McUK15VMrQWiuxG9VkdTOpaR.jpg"
                      title="Attack on Titan"
                      type="anime"
                      status="finished"
                      season={4}
                      episode={28}
                      size="small"
                      onClick={() => alert("Small size anime!")}
                    />
                    <ContentDisplay
                      posterUrl="https://image.tmdb.org/t/p/w300/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"
                      title="Stranger Things"
                      type="tv"
                      status="ongoing"
                      season={5}
                      episode={3}
                      size="small"
                      onClick={() => alert("Small ongoing!")}
                    />
                    <ContentDisplay
                      posterUrl="https://image.tmdb.org/t/p/w300/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg"
                      title="The Batman 2"
                      type="movie"
                      status="coming-soon"
                      size="small"
                      onClick={() => alert("Small coming soon!")}
                    />
                    <ContentDisplay
                      posterUrl="https://image.tmdb.org/t/p/w300/fuVuDYrs8sxvEolnYr0wCSvtyTi.jpg"
                      title="Cowboy Bebop Live Action"
                      type="tv"
                      status="canceled"
                      season={1}
                      episode={10}
                      size="small"
                      onClick={() => alert("Small canceled!")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Usage Examples</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Import the ContentDisplay component
import ContentDisplay from "@/components/ContentDisplay";

// Basic movie
<ContentDisplay
  posterUrl="https://example.com/poster.jpg"
  title="Movie Title"
  type="movie"
  status="finished"
  onClick={() => handleClick()}
/>

// TV show with episode info
<ContentDisplay
  posterUrl="https://example.com/poster.jpg"
  title="TV Show Title"
  type="tv"
  status="ongoing"
  season={2}
  episode={5}
  onClick={() => handleClick()}
/>

// Anime with all info
<ContentDisplay
  posterUrl="https://example.com/poster.jpg"
  title="Anime Title"
  type="anime"
  status="finished"
  season={1}
  episode={24}
  onClick={() => handleClick()}
/>

// Coming soon content
<ContentDisplay
  posterUrl="https://example.com/poster.jpg"
  title="Upcoming Movie"
  type="movie"
  status="coming-soon"
  onClick={() => handleClick()}
/>

// Small size variant
<ContentDisplay
  posterUrl="https://example.com/poster.jpg"
  title="Compact Movie"
  type="movie"
  status="finished"
  size="small"
  onClick={() => handleClick()}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Component Showcase */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="font-semibold text-2xl text-retro-900 mb-6">
            Tags Component
          </h2>
          <p className="text-gray-600 mb-6">
            Display genre tags, categories, and labels with various styles and interactive features for content organization.
          </p>

          <div className="space-y-8">
            {/* Basic Tag Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Basic Tags</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-retro-700">Single Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    <Tag>Action</Tag>
                    <Tag>Comedy</Tag>
                    <Tag>Drama</Tag>
                    <Tag>Sci-Fi</Tag>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-retro-700">Clickable Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    <Tag clickable onTagClick={() => alert("Action clicked!")}>Action</Tag>
                    <Tag clickable onTagClick={() => alert("Adventure clicked!")}>Adventure</Tag>
                    <Tag clickable onTagClick={() => alert("Animation clicked!")}>Animation</Tag>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-retro-700">Removable Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    <Tag removable onRemove={() => alert("Fantasy removed!")}>Fantasy</Tag>
                    <Tag removable onRemove={() => alert("Horror removed!")}>Horror</Tag>
                    <Tag removable onRemove={() => alert("Mystery removed!")}>Mystery</Tag>
                  </div>
                </div>
              </div>
            </div>

            {/* Tag Variants */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Tag Variants</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Tag variant="default">Default</Tag>
                    <Tag variant="primary">Primary</Tag>
                    <Tag variant="secondary">Secondary</Tag>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Tag variant="success">Success</Tag>
                    <Tag variant="warning">Warning</Tag>
                    <Tag variant="error">Error</Tag>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Tag variant="outline">Outline</Tag>
                    <Tag variant="ghost">Ghost</Tag>
                  </div>
                </div>
              </div>
            </div>

            {/* Tag Sizes */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Tag Sizes</h3>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag size="sm">Small</Tag>
                  <Tag size="default">Default</Tag>
                  <Tag size="lg">Large</Tag>
                </div>
              </div>
            </div>

            {/* Genre Collections */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Genre Collections</h3>
              <div className="space-y-6">
                {/* Movie Genres */}
                <div>
                  <h4 className="font-medium text-retro-900 mb-3">Movie Genres</h4>
                  <Tags
                    tags={MOVIE_GENRES.slice(0, 8)}
                    variant="default"
                    clickable
                    onTagClick={(id, tag) => alert(`Movie genre clicked: ${tag.label}`)}
                  />
                </div>

                {/* TV Show Genres */}
                <div>
                  <h4 className="font-medium text-retro-900 mb-3">TV Show Genres</h4>
                  <Tags
                    tags={TV_GENRES.slice(0, 6)}
                    variant="outline"
                    clickable
                    onTagClick={(id, tag) => alert(`TV genre clicked: ${tag.label}`)}
                  />
                </div>

                {/* Anime Genres */}
                <div>
                  <h4 className="font-medium text-retro-900 mb-3">Anime Genres</h4>
                  <Tags
                    tags={ANIME_GENRES.slice(0, 7)}
                    variant="primary"
                    size="sm"
                    clickable
                    onTagClick={(id, tag) => alert(`Anime genre clicked: ${tag.label}`)}
                  />
                </div>
              </div>
            </div>

            {/* Tags with Show More */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Expandable Tag Collections</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-retro-700 mb-2">All Movie Genres (Limited to 5, expandable)</h4>
                  <Tags
                    tags={MOVIE_GENRES}
                    variant="default"
                    maxVisible={5}
                    clickable
                    onTagClick={(id, tag) => alert(`Genre: ${tag.label}`)}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-retro-700 mb-2">All Anime Genres (Limited to 8, expandable)</h4>
                  <Tags
                    tags={ANIME_GENRES}
                    variant="outline"
                    size="sm"
                    maxVisible={8}
                    clickable
                    onTagClick={(id, tag) => alert(`Anime Genre: ${tag.label}`)}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Example */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Interactive Example</h3>
              <div className="p-6 bg-retro-50 rounded-lg border border-retro-200">
                <h4 className="font-medium text-retro-900 mb-3">Selected Genres (Click to remove)</h4>
                <Tags
                  tags={[
                    { id: "action", label: "Action", variant: "primary" },
                    { id: "adventure", label: "Adventure", variant: "success" },
                    { id: "comedy", label: "Comedy", variant: "warning" },
                    { id: "drama", label: "Drama", variant: "default" },
                  ]}
                  removable
                  onTagRemove={(id, tag) => alert(`Removed: ${tag.label}`)}
                />
              </div>
            </div>

            {/* Real-world Usage */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Real-world Examples</h3>
              <div className="space-y-6">
                {/* Content Filter Example */}
                <div className="p-6 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-retro-900 mb-4">Content Filters</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Content Type:</span>
                      <Tags
                        tags={[
                          { id: "movies", label: "Movies", variant: "primary" },
                          { id: "tv", label: "TV Shows", variant: "outline" },
                          { id: "anime", label: "Anime", variant: "outline" },
                        ]}
                        clickable
                        onTagClick={(id, tag) => alert(`Filter: ${tag.label}`)}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Selected Genres:</span>
                      <Tags
                        tags={[
                          { id: "action", label: "Action" },
                          { id: "sci-fi", label: "Sci-Fi" },
                          { id: "thriller", label: "Thriller" },
                        ]}
                        variant="success"
                        removable
                        onTagRemove={(id, tag) => alert(`Remove filter: ${tag.label}`)}
                      />
                    </div>
                  </div>
                </div>

                {/* User Profile Example */}
                <div className="p-6 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-retro-900 mb-4">User Profile - Favorite Genres</h4>
                  <Tags
                    tags={[
                      { id: "action", label: "Action", variant: "primary" },
                      { id: "comedy", label: "Comedy", variant: "primary" },
                      { id: "drama", label: "Drama", variant: "primary" },
                      { id: "sci-fi", label: "Science Fiction", variant: "primary" },
                      { id: "thriller", label: "Thriller", variant: "primary" },
                    ]}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div>
              <h3 className="font-medium text-lg text-retro-900 mb-4">Usage Examples</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Import the Tags components
import Tags, { Tag, MOVIE_GENRES } from "@/components/Tags";

// Single tag
<Tag>Action</Tag>

// Clickable tag
<Tag clickable onTagClick={() => handleClick()}>
  Comedy
</Tag>

// Removable tag
<Tag removable onRemove={() => handleRemove()}>
  Drama
</Tag>

// Tag with variant and size
<Tag variant="primary" size="lg">
  Featured Genre
</Tag>

// Collection of tags
<Tags
  tags={[
    { id: "action", label: "Action" },
    { id: "comedy", label: "Comedy" },
    { id: "drama", label: "Drama" }
  ]}
  variant="default"
  clickable
  onTagClick={(id, tag) => handleTagClick(id, tag)}
/>

// Expandable tag collection
<Tags
  tags={MOVIE_GENRES}
  maxVisible={5}
  variant="outline"
  clickable
  onTagClick={(id, tag) => console.log(tag.label)}
/>

// Removable tag collection
<Tags
  tags={selectedGenres}
  variant="primary"
  removable
  onTagRemove={(id, tag) => removeGenre(id)}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section Component */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-2xl text-retro-900 mb-4">
            Hero Section Component
          </h2>
          <p className="text-gray-600 mb-6">
            Full-screen video background hero section with content overlay, similar to A24 Films and other streaming platforms.
          </p>
          
          <div className="space-y-6">
            {/* Demo Hero */}
            <div className="relative h-[600px] overflow-hidden -mx-6">
              <HeroSection
                content={{
                  id: "demo-movie",
                  title: "Dune: Part Two",
                  description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
                  year: 2024,
                  rating: "PG-13",
                  duration: "2h 46m",
                  genres: ["Sci-Fi", "Adventure", "Drama"],
                  platforms: ["HBO Max", "Prime Video", "Apple TV+", "Vudu"],
                  trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                  posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"
                }}
                onAddToList={() => alert("Add to Watchlist clicked!")}
                onViewDetails={() => alert("View Details clicked!")}
              />
            </div>

            {/* Features List */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-lg text-retro-900 mb-3">Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Full-screen video background with poster fallback</li>
                  <li>• Minimal clean design with essential information only</li>
                  <li>• Dark gradient overlay for text readability</li>
                  <li>• Play/pause and mute/unmute controls</li>
                  <li>• Progress indicator for video timeline</li>
                  <li>• Two primary actions: Add to Watchlist and View Details</li>
                  <li>• Content positioned at bottom for better visibility</li>
                  <li>• Responsive design for all screen sizes</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-retro-900 mb-3">Usage Example</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Import the HeroSection component
import { HeroSection } from "@/components/HeroSection";

// Use with content data
<HeroSection
  content={{
    id: "movie-id",
    title: "Movie Title",
    description: "Movie description...",
    year: 2024,
    rating: "PG-13",
    duration: "2h 30m",
    genres: ["Action", "Sci-Fi"],
    platforms: ["Netflix", "Prime Video"],
    trailerUrl: "/path/to/trailer.mp4",
    posterUrl: "/path/to/poster.jpg",
    logoUrl: "/path/to/logo.png" // optional
  }}
  onAddToList={() => addToWatchlist()}
  onViewDetails={() => showDetails()}
/>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}