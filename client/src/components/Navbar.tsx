import { useState } from "react";
import Button from "@/components/Button";

interface NavbarProps {
  isSignedIn?: boolean;
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
  onGetStarted?: () => void;
  onProfile?: () => void;
}

export default function Navbar({ 
  isSignedIn = false, 
  userName = "John Doe",
  userEmail = "john@example.com",
  onSignOut = () => console.log("Sign out clicked"),
  onGetStarted = () => console.log("Get started clicked"),
  onProfile = () => console.log("Profile clicked")
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleUserIconClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSignOut = () => {
    setIsDropdownOpen(false);
    onSignOut();
  };

  const handleProfile = () => {
    setIsDropdownOpen(false);
    onProfile();
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-retro-cream shadow-sm border-b-2 border-retro-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-retro-main rounded-lg flex items-center justify-center">
              <span className="font-headline text-white text-lg">S</span>
            </div>
            <div>
              <h1 className="font-headline text-xl text-retro-dark">Seenit</h1>
              <p className="text-xs text-gray-600">Entertainment Tracker</p>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              /* Signed In State */
              <div className="relative">
                <button
                  onClick={handleUserIconClick}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-retro-secondary transition-colors"
                  data-testid="user-menu-button"
                >
                  <div className="w-8 h-8 bg-retro-main rounded-full flex items-center justify-center">
                    <span className="font-headline text-white text-sm">
                      {getUserInitials(userName)}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-headline text-retro-dark">{userName}</p>
                    <p className="text-xs text-gray-600">{userEmail}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <button
                        onClick={handleProfile}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-retro-secondary transition-colors flex items-center gap-3"
                        data-testid="profile-menu-item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                        data-testid="signout-menu-item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}

                {/* Backdrop to close dropdown when clicking outside */}
                {isDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                    data-testid="dropdown-backdrop"
                  />
                )}
              </div>
            ) : (
              /* Not Signed In State */
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGetStarted}
                  data-testid="get-started-button"
                >
                  Get Started
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onGetStarted}
                  data-testid="sign-in-button"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}