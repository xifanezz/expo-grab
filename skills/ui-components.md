# NativeWind UI Components

Production-ready UI components for React Native with NativeWind (Tailwind CSS).

---

## Typography

### Heading Component
```tsx
import { Text, TextProps } from 'react-native';
import { cn } from '@/lib/utils';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

interface HeadingProps extends TextProps {
  level?: HeadingLevel;
}

const headingStyles: Record<HeadingLevel, string> = {
  h1: 'text-3xl font-bold text-foreground',
  h2: 'text-2xl font-bold text-foreground',
  h3: 'text-xl font-semibold text-foreground',
  h4: 'text-lg font-semibold text-foreground',
};

export function Heading({ level = 'h2', className, ...props }: HeadingProps) {
  return (
    <Text className={cn(headingStyles[level], className)} {...props} />
  );
}
```

### Text Variants
```tsx
type TextVariant = 'default' | 'muted' | 'label' | 'error';

const textVariants: Record<TextVariant, string> = {
  default: 'text-base text-foreground',
  muted: 'text-sm text-muted-foreground',
  label: 'text-sm font-medium text-foreground',
  error: 'text-sm text-destructive',
};

export function Text({ variant = 'default', className, ...props }) {
  return (
    <RNText className={cn(textVariants[variant], className)} {...props} />
  );
}
```

---

## Buttons

### Primary Button
```tsx
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'bg-transparent border border-border',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

const textVariants = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-white',
};

const sizes = {
  sm: 'py-2 px-4',
  md: 'py-3 px-6',
  lg: 'py-4 px-8',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'rounded-xl flex-row items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-50'
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#000'} />
      ) : (
        <>
          {icon}
          <Text className={cn('font-semibold', textVariants[variant])}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
```

### Icon Button
```tsx
interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'muted' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

const iconSizes = { sm: 32, md: 40, lg: 48 };

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  size = 'md',
}: IconButtonProps) {
  const s = iconSizes[size];
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'items-center justify-center rounded-full',
        variant === 'default' && 'bg-muted',
        variant === 'muted' && 'bg-transparent',
        variant === 'primary' && 'bg-primary'
      )}
      style={{ width: s, height: s }}
    >
      {icon}
    </Pressable>
  );
}
```

### Pill Button (Filter Chip)
```tsx
interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function Chip({ label, active = false, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-2 px-4 py-2 rounded-full border',
        active
          ? 'bg-primary border-primary'
          : 'bg-transparent border-border'
      )}
    >
      {icon}
      <Text
        className={cn(
          'text-sm font-medium',
          active ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Usage
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <View className="flex-row gap-2 px-4">
    <Chip label="All" active />
    <Chip label="Popular" />
    <Chip label="New" icon={<Sparkles size={14} />} />
  </View>
</ScrollView>
```

---

## Cards

### Basic Card
```tsx
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outline';
}

export function Card({ variant = 'default', className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl p-4',
        variant === 'default' && 'bg-card',
        variant === 'elevated' && 'bg-card shadow-md',
        variant === 'outline' && 'bg-transparent border border-border',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('mb-3', className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn(className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex-row items-center mt-4 pt-4 border-t border-border', className)}
      {...props}
    />
  );
}
```

### Image Card (Airbnb style)
```tsx
interface ImageCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  badge?: string;
  rating?: number;
  onPress?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function ImageCard({
  imageUrl,
  title,
  subtitle,
  badge,
  rating,
  onPress,
  onFavorite,
  isFavorite,
}: ImageCardProps) {
  return (
    <Pressable onPress={onPress} className="w-64">
      <View className="relative">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-44 rounded-xl bg-muted"
        />
        {badge && (
          <View className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold">{badge}</Text>
          </View>
        )}
        {onFavorite && (
          <Pressable
            onPress={onFavorite}
            className="absolute top-3 right-3"
          >
            <Heart
              size={24}
              color="#fff"
              fill={isFavorite ? '#FF385C' : 'transparent'}
            />
          </Pressable>
        )}
      </View>
      <Text className="text-base font-semibold mt-2">{title}</Text>
      {subtitle && (
        <Text className="text-muted-foreground text-sm">{subtitle}</Text>
      )}
      {rating && (
        <View className="flex-row items-center gap-1 mt-1">
          <Star size={14} fill="#000" />
          <Text className="text-sm">{rating}</Text>
        </View>
      )}
    </Pressable>
  );
}
```

### Stats Card
```tsx
interface StatsCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export function StatsCard({ icon, value, label, trend, trendValue }: StatsCardProps) {
  return (
    <Card className="flex-1">
      <CardContent className="items-center py-4">
        <View className="mb-2">{icon}</View>
        <Text className="text-2xl font-bold">{value}</Text>
        <Text className="text-muted-foreground text-sm">{label}</Text>
        {trend && (
          <View className="flex-row items-center mt-2">
            {trend === 'up' ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <Text
              className={cn(
                'text-xs ml-1',
                trend === 'up' ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trendValue}
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Inputs

### Text Input
```tsx
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'pill';
}

export function Input({
  label,
  error,
  icon,
  variant = 'default',
  className,
  ...props
}: InputProps) {
  return (
    <View className="gap-2">
      {label && (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      )}
      <View
        className={cn(
          'flex-row items-center bg-input border px-4',
          variant === 'default' && 'rounded-xl py-3',
          variant === 'pill' && 'rounded-full py-3',
          error ? 'border-destructive' : 'border-border',
          className
        )}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className="flex-1 text-foreground text-base"
          placeholderTextColor="rgb(var(--muted-foreground))"
          {...props}
        />
      </View>
      {error && <Text className="text-destructive text-sm">{error}</Text>}
    </View>
  );
}
```

### Search Input
```tsx
export function SearchInput({ value, onChangeText, placeholder = 'Search...' }) {
  return (
    <View className="flex-row items-center bg-muted rounded-full px-4 py-3">
      <Search size={20} className="text-muted-foreground mr-3" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgb(var(--muted-foreground))"
        className="flex-1 text-foreground text-base"
      />
      {value?.length > 0 && (
        <Pressable onPress={() => onChangeText('')}>
          <X size={20} className="text-muted-foreground" />
        </Pressable>
      )}
    </View>
  );
}
```

### Textarea
```tsx
export function Textarea({ label, error, ...props }) {
  return (
    <View className="gap-2">
      {label && (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      )}
      <TextInput
        multiline
        textAlignVertical="top"
        className={cn(
          'bg-input border rounded-xl px-4 py-3 text-foreground text-base min-h-[120px]',
          error ? 'border-destructive' : 'border-border'
        )}
        placeholderTextColor="rgb(var(--muted-foreground))"
        {...props}
      />
      {error && <Text className="text-destructive text-sm">{error}</Text>}
    </View>
  );
}
```

---

## Avatar

### Basic Avatar
```tsx
interface AvatarProps {
  source?: { uri: string };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
}

const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 96,
};

export function Avatar({ source, size = 'md', fallback }: AvatarProps) {
  const s = avatarSizes[size];

  if (!source?.uri) {
    return (
      <View
        className="bg-muted items-center justify-center rounded-full"
        style={{ width: s, height: s }}
      >
        <Text className="text-muted-foreground font-semibold">
          {fallback?.charAt(0) || '?'}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      className="rounded-full bg-muted"
      style={{ width: s, height: s }}
    />
  );
}
```

### Avatar with Badge
```tsx
interface AvatarBadgeProps extends AvatarProps {
  badge?: 'online' | 'offline' | 'away' | 'verified';
}

export function AvatarBadge({ badge, size = 'md', ...props }: AvatarBadgeProps) {
  const badgeColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    verified: 'bg-primary',
  };

  return (
    <View className="relative">
      <Avatar size={size} {...props} />
      {badge && (
        <View
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            badgeColors[badge]
          )}
          style={{
            width: avatarSizes[size] * 0.3,
            height: avatarSizes[size] * 0.3,
          }}
        >
          {badge === 'verified' && (
            <Check size={avatarSizes[size] * 0.2} color="#fff" />
          )}
        </View>
      )}
    </View>
  );
}
```

### Avatar Group
```tsx
interface AvatarGroupProps {
  users: Array<{ id: string; avatar?: string; name: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ users, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const s = avatarSizes[size];

  return (
    <View className="flex-row">
      {visible.map((user, i) => (
        <View
          key={user.id}
          style={{ marginLeft: i > 0 ? -s * 0.3 : 0 }}
        >
          <Avatar
            source={user.avatar ? { uri: user.avatar } : undefined}
            fallback={user.name}
            size={size}
          />
        </View>
      ))}
      {overflow > 0 && (
        <View
          className="bg-muted items-center justify-center rounded-full border-2 border-background"
          style={{ width: s, height: s, marginLeft: -s * 0.3 }}
        >
          <Text className="text-muted-foreground text-xs font-semibold">
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}
```

---

## Badges

### Badge Component
```tsx
interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

const badgeVariants = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <View
      className={cn(
        'rounded-full',
        size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1',
        badgeVariants[variant]
      )}
    >
      <Text
        className={cn(
          'font-medium',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}
      >
        {label}
      </Text>
    </View>
  );
}
```

### Notification Badge
```tsx
export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <View className="absolute -top-1 -right-1 bg-destructive min-w-[18px] h-[18px] rounded-full items-center justify-center px-1">
      <Text className="text-white text-xs font-bold">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}
```

---

## List Items

### Menu Item
```tsx
interface MenuItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
}

export function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
  destructive,
}: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 px-4 bg-card rounded-xl"
    >
      {icon && (
        <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
          {icon}
        </View>
      )}
      <View className="flex-1">
        <Text
          className={cn(
            'text-base font-medium',
            destructive ? 'text-destructive' : 'text-foreground'
          )}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-muted-foreground text-sm">{subtitle}</Text>
        )}
      </View>
      {trailing || <ChevronRight size={20} className="text-muted-foreground" />}
    </Pressable>
  );
}
```

### Activity Item (Monzo style)
```tsx
interface ActivityItemProps {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle: string;
  amount?: string;
  positive?: boolean;
  timestamp?: string;
}

export function ActivityItem({
  icon,
  iconBg = 'bg-muted',
  title,
  subtitle,
  amount,
  positive,
  timestamp,
}: ActivityItemProps) {
  return (
    <Pressable className="flex-row items-center py-3">
      <View className={cn('w-10 h-10 rounded-full items-center justify-center mr-3', iconBg)}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground">{title}</Text>
        <Text className="text-sm text-muted-foreground">{subtitle}</Text>
      </View>
      <View className="items-end">
        {amount && (
          <Text
            className={cn(
              'text-base font-semibold',
              positive ? 'text-green-600' : 'text-foreground'
            )}
          >
            {positive && '+'}{amount}
          </Text>
        )}
        {timestamp && (
          <Text className="text-xs text-muted-foreground">{timestamp}</Text>
        )}
      </View>
    </Pressable>
  );
}
```

---

## Divider

```tsx
interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <View className="flex-row items-center my-4">
        <View className="flex-1 h-px bg-border" />
        <Text className="px-4 text-muted-foreground text-sm">{label}</Text>
        <View className="flex-1 h-px bg-border" />
      </View>
    );
  }

  return <View className="h-px bg-border my-4" />;
}
```

---

## Switch / Toggle

```tsx
import { Switch as RNSwitch } from 'react-native';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ value, onValueChange, label, disabled }: SwitchProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      className="flex-row items-center justify-between py-2"
    >
      {label && <Text className="text-foreground flex-1">{label}</Text>}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: 'rgb(var(--muted))',
          true: 'rgb(var(--primary))',
        }}
        thumbColor="#fff"
      />
    </Pressable>
  );
}
```

---

## Progress

```tsx
interface ProgressProps {
  value: number; // 0-100
  color?: string;
  height?: number;
}

export function Progress({ value, color = 'bg-primary', height = 4 }: ProgressProps) {
  return (
    <View className="bg-muted rounded-full overflow-hidden" style={{ height }}>
      <View
        className={cn('h-full rounded-full', color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </View>
  );
}
```

---

## Empty State

```tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="mb-4 opacity-50">{icon}</View>
      <Heading level="h3" className="text-center">{title}</Heading>
      {description && (
        <Text className="text-muted-foreground text-center mt-2 max-w-[280px]">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} className="mt-6" />
      )}
    </View>
  );
}
```

---

## Utility: cn() helper

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Installation

```bash
bun add nativewind tailwindcss clsx tailwind-merge
bun add lucide-react-native  # For icons
```
