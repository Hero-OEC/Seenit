import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Input from "@/components/Input";
import { Check, Play, Star, TrendingUp, Heart, Clock } from "lucide-react";
import seenitLogo from "@/assets/Seenit.svg";

export default function SignIn() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate sign in process
    setTimeout(() => {
      setIsLoading(false);
      navigate("/");
    }, 1500);
  };

  const features = [
    {
      icon: <Star className="w-5 h-5 text-white" />,
      title: "Personal Ratings & Reviews",
      description: "Rate and review your favorite movies, TV shows, and anime"
    },
    {
      icon: <Heart className="w-5 h-5 text-white" />,
      title: "Custom Watchlists",
      description: "Create and organize your want-to-watch, watching, and watched lists"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      title: "Trending Content",
      description: "Discover what's popular and trending across all platforms"
    },
    {
      icon: <Clock className="w-5 h-5 text-white" />,
      title: "Track Your Progress",
      description: "Keep track of episodes watched and your viewing progress"
    },
    {
      icon: <Play className="w-5 h-5 text-white" />,
      title: "Streaming Links",
      description: "Find where to watch your content across different platforms"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-retro-50 to-retro-100 flex">
      {/* Left Panel - Features Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-retro-500 to-retro-600 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">
            Welcome to <span className="text-retro-200">Seenit</span>
          </h1>
          <p className="text-xl mb-8 text-retro-100">
            Your personal entertainment tracker for movies, TV shows, and anime
          </p>
          
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-retro-200 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-retro-200 text-sm">Movies & Shows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">5K+</div>
              <div className="text-retro-200 text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">98%</div>
              <div className="text-retro-200 text-sm">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={seenitLogo} 
              alt="Seenit Logo" 
              className="h-20 w-auto mx-auto"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-retro-900 mb-2">Welcome back!</h2>
              <p className="text-retro-600">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-retro-900 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full"
                  required
                  data-testid="signin-email-input"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-retro-900 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full"
                  required
                  data-testid="signin-password-input"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-retro-600 focus:ring-retro-500 border-retro-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-retro-700">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-retro-600 hover:text-retro-800 transition-colors"
                  onClick={() => console.log("Forgot password clicked")}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-retro-500 hover:bg-retro-600 text-white py-3"
                disabled={isLoading}
                data-testid="signin-submit-button"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Temporary Demo Button */}
              <Button
                type="button"
                onClick={() => navigate("/")}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 mt-3"
                data-testid="demo-signin-button"
              >
                Demo Sign In (Skip Authentication)
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-retro-600">
                Don't have an account?{" "}
                <button
                  onClick={() => console.log("Sign up clicked")}
                  className="text-retro-600 hover:text-retro-800 font-medium transition-colors"
                >
                  Sign up for free
                </button>
              </p>
            </div>

            {/* Social Sign In */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-retro-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-retro-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-retro-300 rounded-md shadow-sm bg-white text-sm font-medium text-retro-700 hover:bg-retro-50 transition-colors"
                  onClick={() => console.log("Google sign in")}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>

                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-retro-300 rounded-md shadow-sm bg-white text-sm font-medium text-retro-700 hover:bg-retro-50 transition-colors"
                  onClick={() => console.log("Apple sign in")}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span className="ml-2">Apple</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Features Preview */}
          <div className="lg:hidden mt-8 bg-white rounded-xl p-6 shadow-lg">
            <h3 className="font-semibold text-retro-900 mb-4 text-center">Why join Seenit?</h3>
            <div className="grid grid-cols-1 gap-4">
              {features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-retro-100 rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-retro-600 text-xs">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}