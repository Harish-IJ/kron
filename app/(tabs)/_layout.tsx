import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Icon } from '../../src/components/ui/Icon';
import { colors, borders } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.ink,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: colors.base },
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        headerTintColor: colors.ink,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'HOME', tabBarIcon: ({ color }) => <Icon name="home" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: 'FEED', tabBarIcon: ({ color }) => <Icon name="layers" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: 'ANALYTICS', tabBarIcon: ({ color }) => <Icon name="chart" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'SETTINGS', tabBarIcon: ({ color }) => <Icon name="settings" size={22} color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.base,
    borderTopWidth: borders.divider.borderWidth,
    borderTopColor: borders.divider.borderColor,
    height: 60,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: { fontFamily: 'Inter-Bold', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 13, letterSpacing: 1.4, textTransform: 'uppercase' },
});
