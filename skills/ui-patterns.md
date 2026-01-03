# React Native/Expo UI Patterns

Premium mobile UI patterns learned from top apps: Monzo, DoorDash, Airbnb, Shop, Spotify, Luma, Clubhouse, Fable, Lemon8.

## Core Principles

1. **Restraint over excess** - Use accent colors sparingly, let whitespace breathe
2. **Elevation creates hierarchy** - Subtle shadows, not colored backgrounds
3. **Consistency builds trust** - Same spacing, radii, typography everywhere
4. **Details matter** - Micro-interactions, proper padding, pixel-perfect alignment

---

## Spacing System

```typescript
// Use consistent spacing scale
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Screen padding: always 16-24px
<View style={{ paddingHorizontal: 16 }}>

// Card internal padding: 16-20px
<View style={{ padding: 16 }}>

// Section spacing: 24-32px between sections
<View style={{ marginTop: 24 }}>
```

---

## Card Patterns

### Basic Elevated Card
```tsx
// DO: White/cream background + subtle shadow
const Card = ({ children }) => (
  <View style={{
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Android shadow
    elevation: 3,
  }}>
    {children}
  </View>
);

// DON'T: Colored background cards (looks dated)
// DON'T: Heavy shadows (shadowOpacity > 0.15)
// DON'T: Sharp corners (borderRadius < 12)
```

### Hero Card (Monzo style)
```tsx
// Bold brand color card for primary info
const HeroCard = ({ balance, brand }) => (
  <View style={{
    backgroundColor: brand.primary, // e.g., '#FF5A5F' coral
    borderRadius: 20,
    padding: 20,
  }}>
    <Text style={{ color: '#FFF', fontSize: 14, opacity: 0.9 }}>
      Balance
    </Text>
    <Text style={{ color: '#FFF', fontSize: 36, fontWeight: '700' }}>
      ${balance}
    </Text>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
      <PillButton title="Add money" light />
      <PillButton title="Card" light />
    </View>
  </View>
);
```

### Gradient Card (Shop/Believe style)
```tsx
import { LinearGradient } from 'expo-linear-gradient';

const GradientCard = ({ children }) => (
  <LinearGradient
    colors={['#A8E6CF', '#56C596']} // Soft green gradient
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{ borderRadius: 16, padding: 20 }}
  >
    {children}
  </LinearGradient>
);
```

---

## Button Patterns

### Primary Button (Pill)
```tsx
const PrimaryButton = ({ title, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      backgroundColor: pressed ? '#1a1a1a' : '#000000',
      borderRadius: 100, // Full pill
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: 'center',
    })}
  >
    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
      {title}
    </Text>
  </Pressable>
);
```

### Secondary Button (Outlined)
```tsx
const SecondaryButton = ({ title, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{
      backgroundColor: '#F5F5F5',
      borderRadius: 100,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: 'center',
    }}
  >
    <Text style={{ color: '#000', fontSize: 16, fontWeight: '600' }}>
      {title}
    </Text>
  </Pressable>
);
```

### Social Auth Buttons
```tsx
const SocialButton = ({ provider, icon, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: provider === 'apple' ? '#000' : '#FFF',
      borderRadius: 100,
      paddingVertical: 14,
      borderWidth: provider === 'apple' ? 0 : 1,
      borderColor: '#E5E5E5',
      gap: 8,
    }}
  >
    {icon}
    <Text style={{
      color: provider === 'apple' ? '#FFF' : '#000',
      fontSize: 16,
      fontWeight: '600'
    }}>
      Continue with {provider}
    </Text>
  </Pressable>
);

// Usage - stack vertically with 12px gap
<View style={{ gap: 12 }}>
  <SocialButton provider="apple" icon={<AppleIcon />} />
  <SocialButton provider="google" icon={<GoogleIcon />} />
  <SocialButton provider="facebook" icon={<FacebookIcon />} />
</View>
```

### Filter Chips/Pills (DoorDash style)
```tsx
const FilterChip = ({ label, active, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{
      backgroundColor: active ? '#000' : '#FFF',
      borderRadius: 100,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: active ? '#000' : '#E5E5E5',
    }}
  >
    <Text style={{
      color: active ? '#FFF' : '#000',
      fontSize: 14,
      fontWeight: '500'
    }}>
      {label}
    </Text>
  </Pressable>
);

// Horizontal scrolling filter row
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
    <FilterChip label="All" active />
    <FilterChip label="DashPass" />
    <FilterChip label="Pickup" />
    <FilterChip label="Deals" />
  </View>
</ScrollView>
```

---

## Typography

### Type Scale
```typescript
const typography = {
  // Headlines
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },

  // Body
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },

  // Labels
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: '500', color: '#666' },
};
```

### Section Header Pattern
```tsx
const SectionHeader = ({ title, actionText, onAction }) => (
  <View style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  }}>
    <Text style={{ fontSize: 20, fontWeight: '700' }}>{title}</Text>
    {actionText && (
      <Pressable onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#007AFF', fontWeight: '600' }}>
          {actionText}
        </Text>
        <ChevronRight size={16} color="#007AFF" />
      </Pressable>
    )}
  </View>
);

// Usage
<SectionHeader title="Popular near you" actionText="See all" onAction={() => {}} />
```

---

## Color Palettes

### Light Theme (Default)
```typescript
const lightTheme = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8F8F8',
  backgroundTertiary: '#F0F0F0',

  // Cream alternative (Clubhouse style)
  cream: '#FDF8F3',
  creamSecondary: '#F5EDE4',

  // Text
  textPrimary: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',

  // Borders
  border: '#E5E5E5',
  borderLight: '#F0F0F0',

  // Accent (pick ONE for your brand)
  accent: '#007AFF', // Blue
  // accent: '#FF5A5F', // Coral (Airbnb)
  // accent: '#1DB954', // Green (Spotify)
  // accent: '#FFD60A', // Yellow (Lemon8)

  // Semantic
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
};
```

### Dark Theme
```typescript
const darkTheme = {
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',

  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5', // 60% opacity
  textTertiary: '#EBEBF5', // 30% opacity

  border: '#38383A',

  // Accent colors pop more on dark
  accent: '#1DB954', // Spotify green
};
```

---

## Avatar Patterns

### Basic Avatar
```tsx
const Avatar = ({ uri, size = 40, badge }) => (
  <View>
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E5E5E5',
      }}
    />
    {badge && (
      <View style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#1DB954',
        borderWidth: 2,
        borderColor: '#FFF',
      }} />
    )}
  </View>
);
```

### Avatar Group (Clubhouse style)
```tsx
const AvatarGroup = ({ users, max = 3 }) => {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <View style={{ flexDirection: 'row' }}>
      {visible.map((user, i) => (
        <Image
          key={user.id}
          source={{ uri: user.avatar }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#FFF',
            marginLeft: i > 0 ? -10 : 0, // Overlap
          }}
        />
      ))}
      {overflow > 0 && (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#E5E5E5',
          marginLeft: -10,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#FFF',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600' }}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
};
```

---

## List Patterns

### Activity List Item (Monzo style)
```tsx
const ActivityItem = ({ icon, title, subtitle, amount, positive }) => (
  <Pressable style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  }}>
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F5F5F5',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {icon}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '500' }}>{title}</Text>
      <Text style={{ fontSize: 13, color: '#666' }}>{subtitle}</Text>
    </View>
    <Text style={{
      fontSize: 16,
      fontWeight: '600',
      color: positive ? '#34C759' : '#000',
    }}>
      {positive && '+'}{amount}
    </Text>
  </Pressable>
);
```

### Room Card (Clubhouse style)
```tsx
const RoomCard = ({ title, host, speakers, participants }) => (
  <Pressable style={{
    backgroundColor: '#FDF8F3', // Cream
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  }}>
    <Text style={{ fontSize: 12, color: '#666' }}>{host}</Text>
    <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 4 }}>{title}</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
      <AvatarGroup users={speakers} />
      <Text style={{ fontSize: 13, color: '#666' }}>+{participants}</Text>
    </View>
  </Pressable>
);
```

---

## Image Patterns

### Image Card with Overlay Badge (Airbnb style)
```tsx
const ImageCard = ({ uri, badge, title, subtitle, rating }) => (
  <Pressable style={{ width: 280 }}>
    <View>
      <Image
        source={{ uri }}
        style={{
          width: '100%',
          height: 180,
          borderRadius: 12,
          backgroundColor: '#E5E5E5',
        }}
      />
      {badge && (
        <View style={{
          position: 'absolute',
          top: 12,
          left: 12,
          backgroundColor: '#FFF',
          borderRadius: 100,
          paddingVertical: 4,
          paddingHorizontal: 10,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>{badge}</Text>
        </View>
      )}
      <Pressable style={{
        position: 'absolute',
        top: 12,
        right: 12,
      }}>
        <Heart size={24} color="#FFF" fill="transparent" />
      </Pressable>
    </View>
    <Text style={{ fontSize: 15, fontWeight: '600', marginTop: 8 }}>{title}</Text>
    <Text style={{ fontSize: 14, color: '#666' }}>{subtitle}</Text>
    {rating && (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Star size={14} color="#000" fill="#000" />
        <Text style={{ fontSize: 14, marginLeft: 4 }}>{rating}</Text>
      </View>
    )}
  </Pressable>
);
```

### Masonry Grid (Lemon8/Pinterest style)
```tsx
import MasonryList from '@react-native-seoul/masonry-list';

const MasonryFeed = ({ posts }) => (
  <MasonryList
    data={posts}
    keyExtractor={(item) => item.id}
    numColumns={2}
    contentContainerStyle={{ paddingHorizontal: 8 }}
    renderItem={({ item }) => (
      <Pressable style={{ padding: 4 }}>
        <Image
          source={{ uri: item.image }}
          style={{
            width: '100%',
            height: item.height, // Variable height
            borderRadius: 8,
          }}
        />
        <Text style={{ fontSize: 14, fontWeight: '500', marginTop: 8 }}>
          {item.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Avatar uri={item.author.avatar} size={20} />
          <Text style={{ fontSize: 12, color: '#666', marginLeft: 6 }}>
            {item.author.name}
          </Text>
          <Heart size={12} color="#666" style={{ marginLeft: 'auto' }} />
          <Text style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>
            {item.likes}
          </Text>
        </View>
      </Pressable>
    )}
  />
);
```

---

## Navigation Patterns

### Bottom Tab Bar
```tsx
const TabBar = ({ state, navigation }) => (
  <View style={{
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingBottom: 34, // Safe area
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  }}>
    {state.routes.map((route, index) => {
      const isFocused = state.index === index;
      const Icon = getIcon(route.name);

      return (
        <Pressable
          key={route.key}
          onPress={() => navigation.navigate(route.name)}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Icon
            size={24}
            color={isFocused ? '#000' : '#999'}
            fill={isFocused ? '#000' : 'transparent'}
          />
          <Text style={{
            fontSize: 10,
            marginTop: 4,
            color: isFocused ? '#000' : '#999',
            fontWeight: isFocused ? '600' : '400',
          }}>
            {route.name}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
```

### Floating Action Button
```tsx
const FAB = ({ onPress, color = '#007AFF' }) => (
  <Pressable
    onPress={onPress}
    style={{
      position: 'absolute',
      bottom: 100,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: color,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    }}
  >
    <Plus size={24} color="#FFF" />
  </Pressable>
);
```

---

## Bottom Sheet Pattern

```tsx
import BottomSheet from '@gorhom/bottom-sheet';

const AuthSheet = ({ onClose }) => {
  const snapPoints = useMemo(() => ['50%', '75%'], []);

  return (
    <BottomSheet
      snapPoints={snapPoints}
      handleIndicatorStyle={{ backgroundColor: '#E5E5E5', width: 40 }}
      backgroundStyle={{ borderRadius: 24 }}
    >
      <View style={{ padding: 24 }}>
        {/* Close button */}
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          <X size={24} color="#999" />
        </Pressable>

        {/* Icon */}
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: '#F5F5F5',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Sparkles size={24} color="#000" />
        </View>

        {/* Content */}
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Get Started</Text>
        <Text style={{ fontSize: 15, color: '#666', marginTop: 8 }}>
          Sign up to access all features
        </Text>

        {/* Buttons */}
        <View style={{ marginTop: 24, gap: 12 }}>
          <PrimaryButton title="Continue with Phone" />
          <SecondaryButton title="Continue with Email" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SocialIconButton provider="apple" style={{ flex: 1 }} />
            <SocialIconButton provider="google" style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};
```

---

## Onboarding Screen Pattern

```tsx
const OnboardingScreen = () => (
  <View style={{ flex: 1 }}>
    {/* Gradient background */}
    <LinearGradient
      colors={['#E8F4F8', '#FDF2F8', '#FEF3E7']}
      style={StyleSheet.absoluteFill}
    />

    {/* Hero illustration area - 60% of screen */}
    <View style={{ flex: 0.6, alignItems: 'center', justifyContent: 'center' }}>
      {/* 3D illustration or animation here */}
      <LottieAnimation source={require('./onboarding.json')} />
    </View>

    {/* Content area */}
    <View style={{ flex: 0.4, paddingHorizontal: 24 }}>
      {/* Logo */}
      <View style={{ alignItems: 'center' }}>
        <Logo />
      </View>

      {/* Headlines */}
      <Text style={{
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 16,
      }}>
        Delightful Events
      </Text>
      <Text style={{
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        color: '#FF6B6B', // Gradient text effect
      }}>
        Start Here
      </Text>

      {/* CTA */}
      <View style={{ marginTop: 32 }}>
        <PrimaryButton title="Get Started" onPress={() => {}} />
      </View>
    </View>
  </View>
);
```

---

## Quick Reference: Do's and Don'ts

### DO
- Use 16-24px padding consistently
- Use borderRadius 12-20px for cards
- Use subtle shadows (opacity 0.08-0.12)
- Use ONE accent color throughout
- Use horizontal ScrollViews for categories
- Use pill-shaped buttons (borderRadius: 100)
- Use cream/beige as white alternative
- Use avatar clusters with +N overflow

### DON'T
- Use multiple bright colors competing
- Use heavy drop shadows
- Use sharp corners (< 8px radius)
- Use colored card backgrounds (looks dated)
- Use tiny text (< 12px)
- Use icon-only buttons without labels
- Use borders when shadows work better
- Forget safe area padding on iOS

---

## Recommended Libraries

```bash
# UI Components
bun add @gorhom/bottom-sheet
bun add react-native-reanimated
bun add expo-linear-gradient

# Icons
bun add lucide-react-native

# Images
bun add expo-image

# Lists
bun add @shopify/flash-list
bun add @react-native-seoul/masonry-list

# Animations
bun add lottie-react-native
bun add moti
```
