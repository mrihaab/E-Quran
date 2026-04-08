# Toast Notification System

A modern, responsive toast notification system for the E-Quran Academy React application.

## Features

- **Multiple Types**: Success, Error, Warning, and Info toasts
- **Auto-dismiss**: Toasts automatically disappear after 5 seconds (configurable)
- **Manual Dismiss**: Users can close toasts with the X button
- **Stacking**: Multiple toasts stack without overlapping
- **Smooth Animations**: Powered by Framer Motion
- **Responsive Design**: Works on all screen sizes
- **Global State**: Accessible from anywhere in the app via React Context

## Usage

### Basic Usage

```tsx
import { useToast } from '../contexts/ToastContext';

const MyComponent = () => {
  const { addToast } = useToast();

  const handleAction = () => {
    addToast('success', 'Success!', 'Your action was completed successfully.');
  };

  return (
    <button onClick={handleAction}>Do Something</button>
  );
};
```

### Toast Types

- `'success'` - Green toast with checkmark icon
- `'error'` - Red toast with X icon
- `'warning'` - Yellow toast with alert triangle icon
- `'info'` - Blue toast with info icon

### Parameters

```tsx
addToast(type: ToastType, title: string, message?: string, duration?: number)
```

- `type`: One of 'success', 'error', 'warning', 'info'
- `title`: The main heading of the toast
- `message`: Optional descriptive text
- `duration`: Auto-dismiss duration in milliseconds (default: 5000)

### Examples

```tsx
// Success toast
addToast('success', 'Profile Updated', 'Your profile has been saved successfully.');

// Error toast
addToast('error', 'Login Failed', 'Please check your credentials and try again.');

// Warning toast
addToast('warning', 'Session Expiring', 'Your session will expire in 5 minutes.');

// Info toast
addToast('info', 'New Feature', 'Check out our new dashboard features!');
```

## Architecture

### Components

- **ToastProvider**: Context provider that manages toast state
- **ToastContainer**: Renders all active toasts in a fixed position
- **Toast**: Individual toast component with animations and interactions

### Context API

The `ToastContext` provides:
- `toasts`: Array of current toast objects
- `addToast`: Function to add a new toast
- `removeToast`: Function to manually remove a toast

### Styling

Built with Tailwind CSS for consistent theming and responsive design. Uses:
- Dark background with white text for contrast
- Colored icon backgrounds for type indication
- Smooth transitions and shadows
- Framer Motion for entrance/exit animations

## Integration

The toast system is automatically integrated into the main App component. No additional setup required for new components - just import and use the `useToast` hook.