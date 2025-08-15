import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative">
      <div className="h-96 bg-gradient-to-r from-retro-main via-retro-secondary to-retro-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl">
            <h2 className="font-retro text-5xl sm:text-6xl text-white mb-4">
              Your Retro<br />Entertainment<br />Journey
            </h2>
            <p className="text-xl text-retro-bg mb-8 leading-relaxed">
              Track your favorite movies, TV shows, and anime with vintage style.
              Discover what's airing, mark what you've watched, and never miss an episode.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/browse">
                <Button 
                  className="bg-retro-bg text-retro-main px-8 py-3 rounded-full font-semibold hover:bg-retro-secondary transition-colors shadow-lg"
                  data-testid="button-start-browsing"
                >
                  Start Browsing
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="border-2 border-retro-bg text-retro-bg px-8 py-3 rounded-full font-semibold hover:bg-retro-bg hover:text-retro-main transition-colors"
                data-testid="button-join-free"
              >
                Join Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
