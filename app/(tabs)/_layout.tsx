import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { Home, ClipboardList, Package, FileText } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: Colors.brown,
        tabBarInactiveTintColor: Colors.brownMuted,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => <Package size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size }) => <FileText size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="movers" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: 'Fustat',
    fontWeight: '600',
    fontSize: 10,
  },
  item: {
    paddingTop: 8,
  },
});
