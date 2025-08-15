import { Link } from "wouter";
import Button from "@/components/Button";
import Logo from "@/components/Logo";

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-retro-bg">
      {/* Header */}
      <header className="bg-retro-cream shadow-sm border-b-2 border-retro-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="medium" />
              <div>
                <h1 className="font-retro text-2xl text-retro-dark">Seenit</h1>
                <p className="text-sm text-gray-600">Component Library</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/" data-testid="link-home">
                <Button variant="secondary" size="sm">Home</Button>
              </Link>
              <Link href="/components" data-testid="link-components">
                <Button variant="accent" size="sm">Components</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <Logo size="large" />
            <div>
              <h1 className="font-retro text-4xl text-retro-main mb-2">
                Seenit Components
              </h1>
              <p className="text-retro-dark text-lg">
                A showcase of all reusable components for the Seenit platform
              </p>
            </div>
          </div>
        </div>

        {/* Components will be added here */}
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg">Ready to build components!</p>
          <p className="text-sm mt-2">Components will be showcased here as we create them.</p>
        </div>
      </div>
    </div>
  );
}