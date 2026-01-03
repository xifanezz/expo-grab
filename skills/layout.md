# React Native Layout Patterns

Layout patterns for React Native with NativeWind (Tailwind CSS).

---

## Screen Structure

### Basic Screen Template
```tsx
import { View, SafeAreaView, ScrollView } from 'react-native';
import { Heading, Text } from '@/components/ui';

export default function MyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="pb-32">
        {/* Header */}
        <View className="p-6">
          <Heading level="h2">Screen Title</Heading>
        </View>

        {/* Content */}
        <View className="px-6 gap-4">
          {/* Your content here */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

### Root Layout (expo-router)
```tsx
import { Stack } from "expo-router";
import { ThemeProvider } from "@/components/ThemeProvider";
import "@/global.css";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
```

### Tab Layout
```tsx
import { Tabs } from 'expo-router';
import { Home, Search, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Home
              className={focused ? 'text-primary' : 'text-muted-foreground'}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <Search
              className={focused ? 'text-primary' : 'text-muted-foreground'}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <User
              className={focused ? 'text-primary' : 'text-muted-foreground'}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## Common Layout Patterns

### Header with Actions
```tsx
<View className="p-6 flex-row justify-between items-center">
  <View>
    <Text className="text-muted-foreground">Welcome back,</Text>
    <Heading level="h2">User Name</Heading>
  </View>
  <View className="flex-row items-center gap-4">
    <ThemeToggle />
    <TouchableOpacity>
      <Bell className="text-foreground" size={24} />
    </TouchableOpacity>
  </View>
</View>
```

### Section with Title
```tsx
<View className="mb-6">
  <Heading level="h3" className="px-6 mb-4">Section Title</Heading>
  {/* Section content */}
</View>
```

### Horizontal Scroll List
```tsx
<FlatList
  data={items}
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerClassName="px-6 gap-4"
  renderItem={({ item }) => (
    <Card className="w-64">
      {/* Card content */}
    </Card>
  )}
/>
```

### Two-Column Grid
```tsx
<View className="flex-row flex-wrap gap-4 px-6">
  {items.map((item) => (
    <View key={item.id} className="basis-[48%]">
      <Card>
        {/* Card content */}
      </Card>
    </View>
  ))}
</View>
```

### Stats Row
```tsx
<View className="px-6">
  <View className="flex-row gap-4">
    <Card className="flex-1">
      <CardContent className="items-center py-4">
        <Icon className="text-primary mb-2" size={24} />
        <Text className="font-bold text-xl">42</Text>
        <Text className="text-muted-foreground text-sm">Label</Text>
      </CardContent>
    </Card>
    <Card className="flex-1">
      <CardContent className="items-center py-4">
        <Icon className="text-primary mb-2" size={24} />
        <Text className="font-bold text-xl">128</Text>
        <Text className="text-muted-foreground text-sm">Label</Text>
      </CardContent>
    </Card>
  </View>
</View>
```

### Menu List
```tsx
<View className="px-6 gap-2">
  <Heading level="h4" className="mb-2">Settings</Heading>
  <TouchableOpacity>
    <Card>
      <CardContent className="flex-row items-center justify-between py-3">
        <Text>Menu Item</Text>
        <ChevronRight className="text-muted-foreground" size={20} />
      </CardContent>
    </Card>
  </TouchableOpacity>
  {/* More items */}
</View>
```

### Profile Header
```tsx
<View className="px-6 mb-6">
  <Card>
    <CardContent className="items-center py-6">
      <Avatar size="2xl" source={{ uri: user.avatar }} />
      <Heading level="h3" className="mt-4">{user.name}</Heading>
      <Text className="text-muted-foreground text-center mt-1">
        {user.bio}
      </Text>
    </CardContent>
  </Card>
</View>
```

### Hero Image with Floating Search
```tsx
<View className="px-6 mb-8">
  <HeroImage source={{ uri: imageUrl }} title="Hero Title" />
  {/* Floating search bar */}
  <View className="mt-[-28px] mx-4">
    <Input
      variant="pill"
      placeholder="Search..."
      icon={<Search className="text-primary" size={20} />}
    />
  </View>
</View>
```

---

## State Screens

### Loading State
```tsx
if (loading) {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" />
    </SafeAreaView>
  );
}
```

### Empty State
```tsx
<View className="flex-1 items-center justify-center p-6">
  <Icon className="text-muted-foreground mb-4" size={48} />
  <Heading level="h3" className="text-center">No Items</Heading>
  <Text className="text-muted-foreground text-center mt-2">
    You haven't added any items yet.
  </Text>
  <Button className="mt-6">Add First Item</Button>
</View>
```

---

## Responsive Layouts

### Detect Screen Size
```tsx
import { Dimensions, useWindowDimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Adjust columns based on width
const columns = isTablet ? 3 : 2;
const basisClass = isTablet ? 'basis-[31%]' : 'basis-[48%]';
```

### Dynamic Dimensions Hook
```tsx
function MyComponent() {
  const { width, height } = useWindowDimensions();
  // Component re-renders when dimensions change

  return (
    <View className={width >= 768 ? 'flex-row' : 'flex-col'}>
      {/* Content */}
    </View>
  );
}
```

---

## Common Mistakes

### Grid Layout
```tsx
// ❌ CSS Grid is NOT supported in React Native
<View className="grid grid-cols-2">

// ✅ Use flex-row flex-wrap instead
<View className="flex-row flex-wrap gap-4">
  <View className="basis-[48%]">
```

### Flex with Wrap
```tsx
// ❌ flex-1 doesn't work well with wrap
<View className="flex-row flex-wrap">
  <View className="flex-1">  // Won't work as expected

// ✅ Use explicit basis percentage
<View className="flex-row flex-wrap">
  <View className="basis-[48%]">
```

### Tab Bar Overlap
```tsx
// ❌ Content will be hidden behind tab bar
<ScrollView>

// ✅ Add padding to clear the tab bar
<ScrollView contentContainerClassName="pb-32">
```

### Hardcoded Colors
```tsx
// ❌ Won't adapt to theme
<View className="bg-white">
<Text className="text-gray-500">

// ✅ Use semantic theme colors
<View className="bg-background">
<Text className="text-muted-foreground">
```

### Spacing with Margins
```tsx
// ❌ Margin on each item is repetitive
<View>
  <Card className="mb-4">
  <Card className="mb-4">
  <Card className="mb-4">  // Last one doesn't need margin

// ✅ Gap handles spacing cleanly
<View className="gap-4">
  <Card>
  <Card>
  <Card>
```

---

## Full Screen Examples

### List Screen
```tsx
export default function ListScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={items}
        contentContainerClassName="p-6 pb-32 gap-4"
        ListHeaderComponent={
          <Heading level="h2" className="mb-4">Items</Heading>
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted-foreground">No items found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card>{/* Item content */}</Card>
        )}
      />
    </SafeAreaView>
  );
}
```

### Detail Screen
```tsx
export default function DetailScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="pb-32">
        {/* Hero/Image */}
        <HeroImage source={{ uri: imageUrl }} height="h-72" />

        {/* Content */}
        <View className="p-6 gap-6">
          <View>
            <Heading level="h1">{title}</Heading>
            <Text className="text-muted-foreground mt-2">{subtitle}</Text>
          </View>

          <View className="gap-4">
            <Heading level="h3">Details</Heading>
            <Text>{description}</Text>
          </View>
        </View>

        {/* Bottom action */}
        <View className="p-6">
          <Button fullWidth>Take Action</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

### Form Screen
```tsx
export default function FormScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-6 pb-32">
        <Heading level="h2" className="mb-6">Form Title</Heading>

        <View className="gap-4">
          <View>
            <Text className="text-muted-foreground text-sm mb-2">
              Field Label
            </Text>
            <Input placeholder="Enter value..." />
          </View>

          <View>
            <Text className="text-muted-foreground text-sm mb-2">
              Another Field
            </Text>
            <Input placeholder="Enter value..." />
          </View>

          <Button fullWidth className="mt-4">Submit</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## NativeWind Setup

```bash
bun add nativewind tailwindcss
bunx tailwindcss init
```

```js
// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```
