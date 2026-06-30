import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth';
import { IconHome, IconBook, IconUsers, IconWallet, IconChart } from '../components/icons';

// Auth screens
import { WelcomeScreen } from '../screens/Auth/WelcomeScreen';
import { PasswordScreen } from '../screens/Auth/PasswordScreen';
import { SetupScreen } from '../screens/Auth/SetupScreen';

// Tab screens
import { HomeScreen } from '../screens/Home/HomeScreen';
import { ClassesScreen } from '../screens/Classes/ClassesScreen';
import { StudentsTabScreen } from '../screens/Student/StudentsTabScreen';
import { TuitionTabScreen } from '../screens/Tuition/TuitionTabScreen';
import { ReportTabScreen } from '../screens/Report/ReportTabScreen';

// Stack screens
import { ClassDetailScreen } from '../screens/Class/ClassDetailScreen';
import { CreateClassScreen } from '../screens/Class/CreateClassScreen';
import { ArchivedClassesScreen } from '../screens/Class/ArchivedClassesScreen';
import { AttendanceScreen } from '../screens/Attendance/AttendanceScreen';
import { CancelClassScreen } from '../screens/Announce/CancelClassScreen';
import { MakeupPollScreen } from '../screens/Announce/MakeupPollScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { CalendarScreen } from '../screens/Calendar/CalendarScreen';
import { TaxScreen } from '../screens/Tax/TaxScreen';
import { NotificationSettings } from '../screens/Settings/NotificationSettings';
import { ClassSettingsScreen } from '../screens/Class/ClassSettingsScreen';
import { ClassTuitionScreen } from '../screens/Class/ClassTuitionScreen';
import { ClassReportScreen } from '../screens/Class/ClassReportScreen';
import { ClassStudentsScreen } from '../screens/Class/ClassStudentsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Custom Tab Bar ──
type TabIconProps = { label: string; Icon: any; focused: boolean };
function TabIcon({ label, Icon, focused }: TabIconProps) {
  return (
    <View style={tb.tab}>
      <Icon size={24} color={focused ? '#3d8760' : '#9e9e9e'} />
      <Text style={[tb.label, focused && tb.labelActive]}>{label}</Text>
    </View>
  );
}

const tb = StyleSheet.create({
  tab: { alignItems: 'center', gap: 2, paddingTop: 6 },
  label: { fontSize: 10, fontWeight: '500', color: '#9e9e9e' },
  labelActive: { color: '#3d8760', fontWeight: '700' },
});

// ── Main Tab Navigator ──
function MainTabs() {
  const insets = useSafeAreaInsets();
  // Reserve room for the device's bottom inset (Samsung/Android nav bar, iOS home indicator)
  // so the tab bar isn't covered by the system navigation buttons.
  const bottomPad = Math.max(insets.bottom, 10);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + bottomPad,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderTopWidth: 1,
          borderTopColor: '#e8e4da',
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#3d8760',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Hôm nay" Icon={IconHome} focused={focused} /> }}
      />
      <Tab.Screen
        name="Classes"
        component={ClassesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Lớp học" Icon={IconBook} focused={focused} /> }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsTabScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Học sinh" Icon={IconUsers} focused={focused} /> }}
      />
      <Tab.Screen
        name="Tuition"
        component={TuitionTabScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Học phí" Icon={IconWallet} focused={focused} /> }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportTabScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Báo cáo" Icon={IconChart} focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ── Root Navigator ──
export function AppNavigator() {
  const { teacher, token, loadMe } = useAuthStore();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    loadMe().finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf8f2' }}>
        <ActivityIndicator color="#4a9e72" size="large" />
      </View>
    );
  }

  const needsSetup = token && teacher && !teacher.name;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Password" component={PasswordScreen} />
          </>
        ) : needsSetup ? (
          <Stack.Screen name="Setup" component={SetupScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="ClassDetail"
              component={ClassDetailScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: route.params?.className || 'Lớp học',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#3d8760',
                headerTitleStyle: { fontWeight: '700' },
              })}
            />
            <Stack.Screen
              name="CreateClass"
              component={CreateClassScreen}
              options={{ headerShown: true, title: 'Tạo lớp mới', headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#3d8760', headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="Attendance"
              component={AttendanceScreen}
              options={{ headerShown: true, title: 'Điểm danh', headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#3d8760', headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="CancelClass"
              component={CancelClassScreen}
              options={{ headerShown: true, title: 'Báo nghỉ', headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#3d8760', headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="MakeupPoll"
              component={MakeupPollScreen}
              options={{ headerShown: true, title: 'Poll học bù', headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#3d8760', headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Calendar" component={CalendarScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Tax"
              component={TaxScreen}
              options={{ headerShown: true, title: 'Thuế TNCN', headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#3d8760', headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettings}
              options={{ headerShown: true, title: 'Cài đặt thông báo', headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#3d8760', headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="ArchivedClasses"
              component={ArchivedClassesScreen}
              options={{ headerShown: true, title: 'Lớp đã lưu trữ', headerStyle: { backgroundColor: '#ffffff' }, headerTintColor: '#3d8760', headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="ClassSettings"
              component={ClassSettingsScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: `Cài đặt · ${route.params?.className || 'Lớp học'}`,
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#3d8760',
                headerTitleStyle: { fontWeight: '700' },
              })}
            />
            <Stack.Screen
              name="ClassTuition"
              component={ClassTuitionScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: `Thu tiền · ${route.params?.className || 'Lớp học'}`,
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#3d8760',
                headerTitleStyle: { fontWeight: '700' },
              })}
            />
            <Stack.Screen
              name="ClassReport"
              component={ClassReportScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: `Báo cáo · ${route.params?.className || 'Lớp học'}`,
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#3d8760',
                headerTitleStyle: { fontWeight: '700' },
              })}
            />
            <Stack.Screen
              name="ClassStudents"
              component={ClassStudentsScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: `Học sinh · ${route.params?.className || 'Lớp học'}`,
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#3d8760',
                headerTitleStyle: { fontWeight: '700' },
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
