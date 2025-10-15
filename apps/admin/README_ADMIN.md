# 🚗 UberGo Admin Panel

A modern, scalable React admin panel built with TypeScript, Vite, and React Router.

## 📋 Overview

This admin panel is built following the proven architecture from ferpiControl, adapted for a ride-sharing platform administration.

## 🏗️ Structure

Based on the ferpiControl frontend structure with these key directories:

- **`/api`** - API client functions
- **`/components`** - Reusable UI components
- **`/config`** - Configuration files
- **`/contexts`** - React Context providers
- **`/hooks`** - Custom React hooks
- **`/layout`** - Layout components
- **`/pages`** - Page components
- **`/routes`** - Routing configuration
- **`/themes`** - Theme system
- **`/utils`** - Utility functions

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## 📦 Dependencies

### Core
- React 19.1.1
- React DOM 19.1.1
- TypeScript 5.9.3
- Vite 7.1.7

### Routing & State
- React Router DOM 7.1.3
- Zustand 5.0.3

## 🔑 Features

- ✅ Authentication system with protected routes
- ✅ Dashboard with statistics
- ✅ Responsive layout with sidebar
- ✅ Theme system
- ✅ TypeScript support
- ✅ Form validation
- ✅ API integration layer
- ✅ Custom hooks
- ✅ Reusable components

## 📚 Documentation

- **STRUCTURE_GUIDE.md** - Detailed structure explanation
- **PROJECT_SETUP.md** - Setup and configuration guide

## 🛠️ Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🎨 Customization

### Theme

Edit `src/themes/index.ts` to customize colors, typography, and spacing.

### API Endpoints

Edit `src/config/api.ts` to configure API endpoints.

## 📱 Pages

- **Login** - `/login` - User authentication
- **Dashboard** - `/dashboard` - Overview and statistics
- **Users** - `/users` - User management (coming soon)
- **Drivers** - `/drivers` - Driver management (coming soon)
- **Rides** - `/rides` - Ride management (coming soon)
- **Settings** - `/settings` - Application settings (coming soon)

## 🔐 Authentication

The app uses Context API with useReducer for authentication state management. Auth state is persisted in localStorage.

## 🤝 Contributing

1. Follow the existing structure
2. Use TypeScript for type safety
3. Keep components small and focused
4. Write reusable utility functions
5. Follow the established naming conventions

## 📄 License

Private - UberGo Project

---

Built with ❤️ using React + TypeScript + Vite

