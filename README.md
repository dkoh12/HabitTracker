# HabitTracker

A modern habit tracking application built with Next.js, Prisma, and PostgreSQL.

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd HabitTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the PostgreSQL database**
   ```bash
   docker-compose up -d
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed with test data
   npm run seed
   npm run seed:badges
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Test Account
- **Email**: `david@io`
- **Password**: `david`

## Database Development Workflow

### Docker Commands
```bash
# Start PostgreSQL container
docker-compose up -d

# Stop PostgreSQL container
docker-compose down

# Stop and remove all data (complete reset)
docker-compose down -v

# View container status
docker ps

# View container logs
docker logs habittracker_postgres
```

### Database Commands
```bash
# Run migrations (apply schema changes)
npm run db:migrate

# Reset database (wipe everything & reseed)
npm run db:reset

# Push schema changes without migrations
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with test data
npm run seed

# Seed badges
npm run seed:badges
```

### Database Info
- **Database**: PostgreSQL 17
- **Connection**: `postgresql://postgres:password@localhost:5432/habittracker_dev`
- **Container Name**: `habittracker_postgres`
- **Port**: `5432`

## Project Structure

```
├── prisma/              # Database schema & migrations
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Test data seeding
│   └── migrations/      # Database migrations
├── src/
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   ├── lib/             # Utilities & configurations
│   └── types/           # TypeScript types
├── docker-compose.yml   # PostgreSQL container setup
└── package.json         # Dependencies & scripts
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database scripts
npm run db:migrate   # Apply database migrations
npm run db:reset     # Reset database completely
npm run db:push      # Push schema without migrations
npm run db:studio    # Open Prisma Studio
npm run seed         # Seed test data
npm run seed:badges  # Seed badges
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL 17 with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons
- **Development**: Docker for PostgreSQL, TypeScript

## Production Deployment

This project is designed to work with:
- **Frontend**: Vercel
- **Database**: Neon (PostgreSQL)

The development environment uses Docker PostgreSQL which perfectly matches the production Neon PostgreSQL setup.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
