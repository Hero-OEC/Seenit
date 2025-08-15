# Seenit - Entertainment Tracker

## Overview

Seenit is a modern web application for tracking movies, TV shows, and anime with a retro aesthetic. Built with React and TypeScript frontend communicating with an Express.js backend, it allows users to browse content, manage personal watchlists, and track viewing progress. The application features a clean, retro-styled interface with warm colors and rounded elements, providing an engaging user experience for entertainment enthusiasts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with a custom retro theme featuring warm colors (oranges, creams, blues)
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **Data Storage**: In-memory storage implementation (MemStorage class) for development
- **Database Ready**: Configured for PostgreSQL with Drizzle ORM and migration support
- **API Design**: RESTful endpoints for content management and user interactions

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect configured
- **Schema**: Shared schema definitions between frontend and backend using Zod for validation
- **Tables**: Users, content (movies/TV/anime), and user-content tracking relationships
- **Validation**: Drizzle-Zod integration for type-safe database operations

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

### Key Features
- **Content Browsing**: Search and filter movies, TV shows, and anime by type and genre
- **User Lists**: Personal watchlists with status tracking (watching, watched, want to watch)
- **Progress Tracking**: Episode progress and user ratings for tracked content
- **Responsive Design**: Mobile-first approach with retro-inspired UI components
- **Category Tabs**: Quick navigation between different content types

## External Dependencies

### UI and Styling
- **Radix UI**: Comprehensive set of accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom retro color scheme
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for creating component variants

### Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL via @neondatabase/serverless
- **Zod**: Schema validation for data integrity

### Development Tools
- **Vite**: Fast build tool with React plugin and development server
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Plugins**: Development environment integration for runtime error handling

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod Resolvers**: Integration between React Hook Form and Zod validation

The application is designed to be easily deployable on Replit with the database URL configured through environment variables, making it ready for both development and production environments.