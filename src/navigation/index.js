import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrdersDeliveryScreen from '../screens/OrderDelivery';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} />
        <Stack.Screen name="OrdersScreen" component={OrdersScreen} />
        <Stack.Screen name="OrdersDeliveryScreen" component={OrdersDeliveryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
