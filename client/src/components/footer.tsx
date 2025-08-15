import { Link } from "wouter";
import { Tv } from "lucide-react";

export default function Footer() {
  const quickLinks = [
    { href: "/browse", label: "Browse Movies" },
    { href: "/browse?type=tv", label: "TV Shows" },
    { href: "/browse?type=anime", label: "Anime" },
    { href: "/my-lists", label: "My Lists" },
    { href: "/browse", label: "Trending" }
  ];

  const supportLinks = [
    { href: "#", label: "Help Center" },
    { href: "#", label: "Contact Us" },
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "API" }
  ];

  const socialLinks = [
    { href: "#", icon: "🐦", label: "Twitter" },
    { href: "#", icon: "📸", label: "Instagram" },
    { href: "#", icon: "💬", label: "Discord" }
  ];

  return (
    <footer className="bg-retro-main text-retro-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-retro-bg rounded-full p-2">
                <Tv className="text-retro-main h-6 w-6" />
              </div>
              <h2 className="font-retro text-3xl">Seenit</h2>
            </div>
            <p className="text-retro-secondary mb-6 max-w-md">
              Your ultimate retro entertainment companion. Track what you watch, discover what's next, 
              and never miss an episode with vintage style.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.label}
                  href={social.href} 
                  className="text-retro-bg hover:text-retro-secondary transition-colors text-xl"
                  aria-label={social.label}
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-retro-secondary hover:text-retro-bg transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <a 
                    href={link.href}
                    className="text-retro-secondary hover:text-retro-bg transition-colors"
                    data-testid={`link-support-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-retro-secondary mt-8 pt-8 text-center text-retro-secondary">
          <p>&copy; 2024 Seenit. All rights reserved. Made with ❤️ for entertainment lovers.</p>
          <p className="mt-2 text-sm">Affiliate partnerships help us keep Seenit free for everyone.</p>
        </div>
      </div>
    </footer>
  );
}
