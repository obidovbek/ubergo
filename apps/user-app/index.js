/**
 * Entry Point
 * Main entry for the app using React Navigation
 */

// Keep entry lean; avoid early global overrides that can break TurboModules

import { registerRootComponent } from 'expo';

// Import App after registerRootComponent to ensure proper initialization order
import App from './App';

// Register the main App component
registerRootComponent(App);

