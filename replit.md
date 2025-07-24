# EmailFlow - Client Email Automation Platform

## Overview

EmailFlow is a full-stack web application for managing client communications through automated email campaigns. The platform provides a comprehensive solution for client management, multilingual email template creation, automated scheduling, and detailed analytics tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state and caching
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Email Service**: SendGrid for transactional emails
- **Session Management**: Express sessions with PostgreSQL storage
- **API Pattern**: RESTful endpoints with JSON responses

### Database Design
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Key Tables**:
  - `users`: Authentication and user management
  - `clients`: Customer contact information with multilingual support
  - `email_templates`: Multilingual email templates with variable substitution
  - `scheduled_emails`: Email automation scheduling with status tracking
  - `email_logs`: Comprehensive email delivery and engagement tracking

## Key Components

### Client Management System
- CRUD operations for client contacts
- Custom field support for flexible data storage
- Language preference tracking for personalized communications
- Company and contact information management

### Email Template Engine
- Multilingual template support (English, Spanish, French)
- Variable substitution system for personalization
- Template usage analytics and optimization
- Rich content support with HTML and plain text options

### Automation Scheduler
- Background email processing with configurable intervals
- Status tracking (pending, sent, failed, cancelled)
- Error handling and retry mechanisms
- Real-time scheduling updates

### Analytics Dashboard
- Email delivery metrics and engagement tracking
- Client interaction history and patterns
- Template performance analytics
- System-wide statistics and reporting

## Data Flow

1. **Client Onboarding**: Clients are added through the management interface with language preferences and custom fields
2. **Template Creation**: Multilingual email templates are created with variable placeholders for personalization
3. **Email Scheduling**: Automated emails are scheduled based on client preferences and template selections
4. **Background Processing**: A scheduler service processes pending emails at regular intervals
5. **Delivery Tracking**: Email status and engagement metrics are logged for analytics
6. **Dashboard Updates**: Real-time updates provide visibility into system performance and client engagement

## External Dependencies

### Email Service Integration
- **SendGrid**: Production email delivery with API key authentication
- **Fallback Handling**: Graceful degradation when email service is unavailable
- **Template Personalization**: Dynamic content insertion based on client data

### Database Connectivity
- **Neon Serverless PostgreSQL**: Cloud-hosted database with connection pooling
- **Environment Configuration**: DATABASE_URL environment variable for connection management
- **Migration Management**: Automated schema updates through Drizzle Kit

### UI Component Library
- **shadcn/ui**: Pre-built accessible components with Tailwind CSS
- **Radix UI Primitives**: Headless UI components for complex interactions
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite development server with HMR support
- **API Proxy**: Development server proxies API requests to Express backend
- **Database Seeding**: Development database with sample data for testing

### Production Build
- **Static Assets**: Vite builds optimized frontend assets
- **Server Bundle**: esbuild creates production server bundle
- **Environment Variables**: Production configuration through environment variables
- **Process Management**: Node.js server with proper error handling and logging

### Configuration Management
- **Environment Files**: Separate configuration for development and production
- **Database Migrations**: Automated schema updates on deployment
- **Asset Optimization**: Minified and compressed static assets for production