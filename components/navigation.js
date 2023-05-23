import React, { Component } from "react";
import HouseScreen from "../screens/House";
import ProfileScreen from "../screens/Profile";
import { StyleSheet } from "react-native";
import TasksScreen from "../screens/tasks";
import ShoppingListScreen from "../screens/Shopping";
import CostsScreen from "../screens/Cost";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

export default class HomeNavigation extends Component {
  render() {
    return (
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          headerStyle: {
            backgroundColor: "#20B2AA",
          },
          headerTitleStyle: styles.headerTitleStyle,
        })}
      >
        <Tab.Screen name="House" component={HouseScreen} />
        <Tab.Screen name="Task" component={TasksScreen} />
        <Tab.Screen name="Shopping" component={ShoppingListScreen} />
        <Tab.Screen name="Cost" component={CostsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }
}
const styles = StyleSheet.create({
  headerTitleStyle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    height: 60,
  },

  headerIcon: {
    marginRight: 10,
  },
});
