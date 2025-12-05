# Decision Documents UI

A Vue 3 application with TypeScript and Vuetify for managing and viewing decision documents.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vuetify 3** - Material Design component framework
- **Vite** - Next generation frontend tooling
- **Material Design Icons** - Icon library

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development Server

Start the development server with hot-reload:

```bash
bun run dev
```

The app will be available at `http://localhost:5173/`

### Build for Production

```bash
bun run build
```

### Preview Production Build

```bash
bun run preview
```

## Project Structure

```
ui-decision/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Vue components
│   ├── App.vue          # Root component
│   ├── main.ts          # Application entry point
│   └── style.css        # Global styles
├── public/              # Public static files
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Features

- Material Design UI with Vuetify
- Responsive navigation drawer
- TypeScript support for type safety
- Hot module replacement for fast development
- Optimized production builds

## Next Steps

- Add routing with Vue Router
- Integrate with decision documents API
- Create decision list and detail views
- Add decision comparison features
