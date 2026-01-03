# React Native Theme System

Theme configuration with NativeWind CSS variables for light/dark mode support.

---

## Theme Structure

### Light Theme
```typescript
import { vars } from 'nativewind';

export const lightTheme = vars({
  // Page backgrounds
  '--background': '255 255 255',        // #FFFFFF - Page background
  '--foreground': '23 23 23',           // #171717 - Primary text

  // Card surfaces
  '--card': '255 255 255',              // #FFFFFF - Card background
  '--card-foreground': '23 23 23',      // #171717 - Card text

  // Primary actions (buttons, links)
  '--primary': '24 24 27',              // #18181B - Primary buttons
  '--primary-foreground': '250 250 250', // #FAFAFA - Text on primary

  // Secondary actions
  '--secondary': '244 244 245',         // #F4F4F5 - Secondary buttons
  '--secondary-foreground': '24 24 27', // #18181B - Text on secondary

  // Muted/subtle elements
  '--muted': '244 244 245',             // #F4F4F5 - Muted backgrounds
  '--muted-foreground': '113 113 122',  // #71717A - Subtle text

  // Accent highlights
  '--accent': '244 244 245',            // #F4F4F5 - Accent backgrounds
  '--accent-foreground': '24 24 27',    // #18181B - Text on accent

  // Destructive/danger
  '--destructive': '220 38 38',         // #DC2626 - Error actions

  // Borders & inputs
  '--border': '228 228 231',            // #E4E4E7 - Borders
  '--input': '228 228 231',             // #E4E4E7 - Input backgrounds
  '--ring': '161 161 170',              // #A1A1AA - Focus rings

  // Border radius
  '--radius': '10',                     // Base radius in pixels
});
```

### Dark Theme
```typescript
export const darkTheme = vars({
  // Page backgrounds
  '--background': '23 23 23',           // #171717 - Page background
  '--foreground': '250 250 250',        // #FAFAFA - Primary text

  // Card surfaces
  '--card': '30 30 30',                 // #1E1E1E - Card background
  '--card-foreground': '250 250 250',   // #FAFAFA - Card text

  // Primary actions
  '--primary': '228 228 231',           // #E4E4E7 - Primary buttons
  '--primary-foreground': '24 24 27',   // #18181B - Text on primary

  // Secondary actions
  '--secondary': '39 39 42',            // #27272A - Secondary buttons
  '--secondary-foreground': '250 250 250', // #FAFAFA - Text on secondary

  // Muted/subtle elements
  '--muted': '39 39 42',                // #27272A - Muted backgrounds
  '--muted-foreground': '161 161 170',  // #A1A1AA - Subtle text

  // Accent highlights
  '--accent': '39 39 42',               // #27272A - Accent backgrounds
  '--accent-foreground': '250 250 250', // #FAFAFA - Text on accent

  // Destructive/danger
  '--destructive': '239 68 68',         // #EF4444 - Error actions (lighter for dark)

  // Borders & inputs
  '--border': '39 39 42',               // #27272A - Borders
  '--input': '39 39 42',                // #27272A - Input backgrounds
  '--ring': '161 161 170',              // #A1A1AA - Focus rings

  // Border radius
  '--radius': '10',
});
```

---

## Brand Color Themes

### Blue Theme (Ocean)
```typescript
export const lightTheme = vars({
  '--radius': '12',

  // Blue-tinted backgrounds
  '--background': '248 250 252',        // slate-50
  '--foreground': '15 23 42',           // slate-900

  '--card': '255 255 255',
  '--card-foreground': '15 23 42',

  // Blue primary
  '--primary': '59 130 246',            // blue-500
  '--primary-foreground': '255 255 255',

  // Light blue secondary
  '--secondary': '219 234 254',         // blue-100
  '--secondary-foreground': '30 64 175', // blue-800

  '--muted': '241 245 249',             // slate-100
  '--muted-foreground': '100 116 139',  // slate-500

  '--accent': '219 234 254',            // blue-100
  '--accent-foreground': '30 64 175',

  '--destructive': '239 68 68',

  '--border': '226 232 240',            // slate-200
  '--input': '226 232 240',
  '--ring': '59 130 246',               // blue-500
});

export const darkTheme = vars({
  '--radius': '12',

  '--background': '15 23 42',           // slate-900
  '--foreground': '248 250 252',        // slate-50

  '--card': '30 41 59',                 // slate-800
  '--card-foreground': '248 250 252',

  '--primary': '96 165 250',            // blue-400
  '--primary-foreground': '15 23 42',

  '--secondary': '51 65 85',            // slate-700
  '--secondary-foreground': '248 250 252',

  '--muted': '51 65 85',
  '--muted-foreground': '148 163 184',  // slate-400

  '--accent': '51 65 85',
  '--accent-foreground': '248 250 252',

  '--destructive': '248 113 113',       // red-400

  '--border': '51 65 85',
  '--input': '51 65 85',
  '--ring': '96 165 250',
});
```

### Green Theme (Nature)
```typescript
export const lightTheme = vars({
  '--radius': '14',

  '--background': '250 253 250',        // Custom light green tint
  '--foreground': '20 30 20',

  '--card': '255 255 255',
  '--card-foreground': '20 30 20',

  // Green primary
  '--primary': '34 197 94',             // green-500
  '--primary-foreground': '255 255 255',

  '--secondary': '220 252 231',         // green-100
  '--secondary-foreground': '22 101 52', // green-800

  '--muted': '240 253 244',             // green-50
  '--muted-foreground': '74 124 89',

  '--accent': '187 247 208',            // green-200
  '--accent-foreground': '22 101 52',

  '--destructive': '239 68 68',

  '--border': '220 252 231',
  '--input': '240 253 244',
  '--ring': '34 197 94',
});
```

### Purple Theme (Creative)
```typescript
export const lightTheme = vars({
  '--radius': '16',

  '--background': '250 250 255',
  '--foreground': '30 20 40',

  '--card': '255 255 255',
  '--card-foreground': '30 20 40',

  // Purple primary
  '--primary': '147 51 234',            // purple-600
  '--primary-foreground': '255 255 255',

  '--secondary': '243 232 255',         // purple-100
  '--secondary-foreground': '107 33 168', // purple-800

  '--muted': '245 243 255',
  '--muted-foreground': '113 100 140',

  '--accent': '233 213 255',            // purple-200
  '--accent-foreground': '107 33 168',

  '--destructive': '239 68 68',

  '--border': '233 213 255',
  '--input': '245 243 255',
  '--ring': '147 51 234',
});
```

### Coral Theme (Warm)
```typescript
export const lightTheme = vars({
  '--radius': '12',

  '--background': '255 251 250',
  '--foreground': '40 20 20',

  '--card': '255 255 255',
  '--card-foreground': '40 20 20',

  // Coral/red primary (Airbnb style)
  '--primary': '255 90 95',             // Coral
  '--primary-foreground': '255 255 255',

  '--secondary': '255 241 240',
  '--secondary-foreground': '180 50 55',

  '--muted': '255 245 245',
  '--muted-foreground': '140 100 100',

  '--accent': '255 228 225',
  '--accent-foreground': '180 50 55',

  '--destructive': '220 38 38',

  '--border': '255 228 225',
  '--input': '255 245 245',
  '--ring': '255 90 95',
});
```

---

## Theme Provider

```tsx
// components/ThemeProvider.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/constants/theme';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}>({
  theme: 'system',
  setTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('system');

  const isDark = theme === 'system'
    ? systemColorScheme === 'dark'
    : theme === 'dark';

  const themeVars = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      <View style={[{ flex: 1 }, themeVars]}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Theme Toggle Component
```tsx
// components/ThemeToggle.tsx
import { TouchableOpacity } from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const Icon = theme === 'system' ? Monitor : isDark ? Moon : Sun;

  return (
    <TouchableOpacity onPress={cycleTheme}>
      <Icon className="text-foreground" size={24} />
    </TouchableOpacity>
  );
}
```

---

## Tailwind Config

```javascript
// tailwind.config.js
const { platformSelect } = require('nativewind/theme');

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
    },
  },
  plugins: [],
};
```

---

## Usage Examples

### Semantic Color Classes
```tsx
// Backgrounds
<View className="bg-background">       // Page background
<View className="bg-card">             // Card surfaces
<View className="bg-muted">            // Subtle backgrounds
<View className="bg-primary">          // Primary action bg
<View className="bg-secondary">        // Secondary action bg
<View className="bg-destructive">      // Error/danger bg

// Text
<Text className="text-foreground">     // Primary text
<Text className="text-muted-foreground"> // Subtle/secondary text
<Text className="text-primary">        // Accent text
<Text className="text-primary-foreground"> // Text on primary bg
<Text className="text-destructive">    // Error text

// Borders
<View className="border border-border"> // Standard border
<View className="border border-input">  // Input border
```

### Button Variants
```tsx
// Primary button
<TouchableOpacity className="bg-primary rounded-lg px-6 py-3">
  <Text className="text-primary-foreground font-semibold text-center">
    Primary Action
  </Text>
</TouchableOpacity>

// Secondary button
<TouchableOpacity className="bg-secondary rounded-lg px-6 py-3">
  <Text className="text-secondary-foreground font-semibold text-center">
    Secondary Action
  </Text>
</TouchableOpacity>

// Outline button
<TouchableOpacity className="border border-border rounded-lg px-6 py-3">
  <Text className="text-foreground font-semibold text-center">
    Outline
  </Text>
</TouchableOpacity>

// Destructive button
<TouchableOpacity className="bg-destructive rounded-lg px-6 py-3">
  <Text className="text-white font-semibold text-center">
    Delete
  </Text>
</TouchableOpacity>
```

### Card Component
```tsx
<View className="bg-card rounded-xl p-4 border border-border">
  <Text className="text-card-foreground font-semibold">Card Title</Text>
  <Text className="text-muted-foreground mt-1">Card description text</Text>
</View>
```

### Input Component
```tsx
<View className="bg-input border border-border rounded-lg px-4 py-3">
  <TextInput
    className="text-foreground"
    placeholderTextColor="rgb(var(--muted-foreground))"
    placeholder="Enter text..."
  />
</View>
```

---

## Best Practices

### DO
```tsx
// ✅ Use semantic color tokens
<View className="bg-background">
<Text className="text-foreground">
<Text className="text-muted-foreground">

// ✅ Use CSS variable-based radius
<View className="rounded-lg">  // Uses --radius

// ✅ Provide both light and dark themes
// ✅ Use opacity modifiers when needed
<View className="bg-primary/10">  // 10% opacity primary
```

### DON'T
```tsx
// ❌ Hardcode colors
<View className="bg-white">
<Text className="text-gray-500">
<View className="bg-[#3B82F6]">

// ❌ Use non-semantic colors
<View className="bg-zinc-100">
<Text className="text-slate-600">

// ❌ Forget dark mode support
// ❌ Mix semantic and hardcoded colors
```

---

## Color Reference

### Zinc (Neutral - Default)
```
50:  #FAFAFA  (250 250 250)
100: #F4F4F5  (244 244 245)
200: #E4E4E7  (228 228 231)
300: #D4D4D8  (212 212 216)
400: #A1A1AA  (161 161 170)
500: #71717A  (113 113 122)
600: #52525B  (82 82 91)
700: #3F3F46  (63 63 70)
800: #27272A  (39 39 42)
900: #18181B  (24 24 27)
950: #09090B  (9 9 11)
```

### Blue
```
400: #60A5FA  (96 165 250)
500: #3B82F6  (59 130 246)
600: #2563EB  (37 99 235)
```

### Green
```
400: #4ADE80  (74 222 128)
500: #22C55E  (34 197 94)
600: #16A34A  (22 163 74)
```

### Red (Destructive)
```
400: #F87171  (248 113 113)
500: #EF4444  (239 68 68)
600: #DC2626  (220 38 38)
```
