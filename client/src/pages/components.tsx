import { useState } from "react";
import { Link } from "wouter";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Logo from "@/components/Logo";

export default function ComponentsPage() {
  const [clickedButton, setClickedButton] = useState("");

  const handleButtonClick = (buttonName: string) => {
    setClickedButton(buttonName);
    setTimeout(() => setClickedButton(""), 2000);
  };

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

        <div className="grid gap-8">
          {/* Logo Component Showcase */}
          <Card>
            <h2 className="font-semibold text-xl text-retro-dark mb-4">
              Logo Component
            </h2>
            <p className="text-gray-600 mb-6">
              The Seenit brand logo in different sizes, perfect for headers, footers, and navigation.
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-retro-dark mb-3">Logo Sizes</h3>
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <Logo size="small" />
                    <span className="text-sm text-gray-600">Small (80px)</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Logo size="medium" />
                    <span className="text-sm text-gray-600">Medium (128px)</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Logo size="large" />
                    <span className="text-sm text-gray-600">Large (192px)</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-retro-dark mb-3">Usage Example</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm text-gray-800">
                    &lt;Logo size="medium" className="my-custom-class" /&gt;
                  </code>
                </div>
              </div>
            </div>
          </Card>

          {/* Button Component Showcase */}
          <Card>
            <h2 className="font-semibold text-xl text-retro-dark mb-4">
              Button Component
            </h2>
            <p className="text-gray-600 mb-6">
              Reusable button with different variants and sizes using our retro color palette.
            </p>
            
            <div className="space-y-6">
              {/* Button Variants */}
              <div>
                <h3 className="font-medium text-retro-dark mb-3">Variants</h3>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="primary" 
                    onClick={() => handleButtonClick("Primary")}
                  >
                    Primary Button
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => handleButtonClick("Secondary")}
                  >
                    Secondary Button
                  </Button>
                  <Button 
                    variant="accent" 
                    onClick={() => handleButtonClick("Accent")}
                  >
                    Accent Button
                  </Button>
                </div>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="font-medium text-retro-dark mb-3">Sizes</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button 
                    size="sm" 
                    onClick={() => handleButtonClick("Small")}
                  >
                    Small
                  </Button>
                  <Button 
                    size="md" 
                    onClick={() => handleButtonClick("Medium")}
                  >
                    Medium
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={() => handleButtonClick("Large")}
                  >
                    Large
                  </Button>
                </div>
              </div>

              {/* Button States */}
              <div>
                <h3 className="font-medium text-retro-dark mb-3">States</h3>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => handleButtonClick("Normal")}>
                    Normal
                  </Button>
                  <Button disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              {clickedButton && (
                <div className="mt-4 p-3 bg-retro-secondary rounded-xl">
                  <p className="text-retro-dark">
                    You clicked: <strong>{clickedButton}</strong> button!
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Card Component Showcase */}
          <Card>
            <h2 className="font-semibold text-xl text-retro-dark mb-4">
              Card Component
            </h2>
            <p className="text-gray-600 mb-6">
              Flexible card container with different padding options, shadows, and hover effects.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card padding="sm" hover>
                <h3 className="font-medium text-retro-dark mb-2">Small Padding</h3>
                <p className="text-gray-600 text-sm">
                  This card uses small padding and has hover effects.
                </p>
              </Card>

              <Card padding="md">
                <h3 className="font-medium text-retro-dark mb-2">Medium Padding</h3>
                <p className="text-gray-600 text-sm">
                  Default card with medium padding.
                </p>
              </Card>

              <Card padding="lg" shadow={false}>
                <h3 className="font-medium text-retro-dark mb-2">Large Padding</h3>
                <p className="text-gray-600 text-sm">
                  Large padding with no shadow.
                </p>
              </Card>
            </div>
          </Card>

          {/* Instructions Card */}
          <Card padding="lg">
            <h2 className="font-semibold text-xl text-retro-dark mb-4">
              How to Use Components
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                All components are located in the <code className="bg-retro-secondary px-2 py-1 rounded">client/src/components/</code> folder.
              </p>
              <p>
                Import them in your pages like this:
              </p>
              <div className="bg-gray-100 p-4 rounded-xl font-mono text-sm">
                <div>import Button from "@/components/Button";</div>
                <div>import Card from "@/components/Card";</div>
              </div>
              <p>
                Each component follows our retro design system with consistent colors and styling.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}