import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Tv, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { href: "/browse", label: "Browse" },
    { href: "/my-lists", label: "My Lists" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to browse page with search query
      window.location.href = `/browse?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-retro-main shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="bg-retro-bg rounded-full p-2">
              <Tv className="text-retro-main text-2xl h-6 w-6" />
            </div>
            <h1 className="font-retro text-3xl text-retro-bg">Seenit</h1>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search movies, shows, anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-retro-bg border-2 border-retro-secondary rounded-full focus:border-retro-accent transition-colors"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-retro-main h-5 w-5" />
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-retro-bg hover:text-retro-secondary transition-colors font-medium ${
                  location === item.href ? 'text-retro-secondary' : ''
                }`}
                data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {item.label}
              </Link>
            ))}
            <Button 
              className="bg-retro-accent text-retro-dark px-4 py-2 rounded-full hover:bg-retro-secondary transition-colors font-medium"
              data-testid="button-user"
            >
              <User className="h-4 w-4 mr-2" />
              John
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            className="md:hidden text-retro-bg hover:text-retro-secondary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-retro-secondary py-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-retro-bg border-2 border-retro-secondary rounded-full focus:border-retro-accent"
                data-testid="input-mobile-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-retro-main h-5 w-5" />
            </form>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block text-retro-bg hover:text-retro-secondary transition-colors font-medium py-2 ${
                    location === item.href ? 'text-retro-secondary' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  data-testid={`link-mobile-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Link>
              ))}
              <Button 
                className="w-full mt-4 bg-retro-accent text-retro-dark hover:bg-retro-secondary transition-colors font-medium"
                data-testid="button-mobile-user"
              >
                <User className="h-4 w-4 mr-2" />
                John
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
