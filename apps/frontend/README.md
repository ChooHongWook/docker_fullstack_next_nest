# Posts CRUD Frontend

A modern, production-ready Next.js 14 frontend application for managing posts with full CRUD functionality.

## Features

- **Complete CRUD Operations**: Create, Read, Update, and Delete posts
- **Modern Tech Stack**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Real-time Updates**: SWR for data fetching with automatic caching and revalidation
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Form Validation**: Client-side validation with user-friendly error messages
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Error Handling**: Comprehensive error handling and user feedback
- **Docker Ready**: Both development and production Docker configurations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR (stale-while-revalidate)
- **HTTP Client**: Axios
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Docker

### Development Mode (with hot reload)

```bash
docker build -f Dockerfile.dev -t posts-frontend-dev .
docker run -p 3000:3000 -v $(pwd):/app posts-frontend-dev
```

### Production Mode

```bash
docker build -t posts-frontend .
docker run -p 3000:3000 posts-frontend
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   └── posts/              # Posts routes
│       ├── page.tsx        # List all posts
│       ├── new/
│       │   └── page.tsx    # Create new post
│       └── [id]/
│           ├── page.tsx    # View single post
│           └── edit/
│               └── page.tsx # Edit post
├── components/             # Reusable React components
│   ├── PostCard.tsx        # Post card component
│   ├── PostForm.tsx        # Create/edit form
│   └── PostList.tsx        # Posts grid layout
├── lib/                    # Utilities and helpers
│   ├── api.ts              # API client (Axios)
│   └── types.ts            # TypeScript type definitions
└── hooks/                  # Custom React hooks
    └── usePosts.ts         # SWR data fetching hooks
```

## API Integration

The frontend connects to a NestJS backend API with the following endpoints:

- `GET /posts` - Fetch all posts
- `GET /posts/:id` - Fetch single post
- `POST /posts` - Create new post
- `PATCH /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

Configure the API URL via the `NEXT_PUBLIC_API_URL` environment variable.

## Features Detail

### Posts List Page
- Grid layout (responsive: 1/2/3 columns)
- Empty state when no posts
- Loading skeletons
- Delete with confirmation
- Create new post button

### Create Post Page
- Form validation
- Required fields: title, content
- Optional field: author
- Error handling
- Success redirect

### View Post Page
- Full post details
- Author and date information
- Edit and delete actions
- Back navigation
- 404 handling

### Edit Post Page
- Pre-filled form with post data
- Same validation as create
- Update confirmation
- Post metadata display

## Performance Optimizations

- **SWR Caching**: Automatic request deduplication and caching
- **Optimistic Updates**: UI updates immediately, rollback on error
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component (when applicable)
- **Standalone Build**: Minimal production Docker image

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
