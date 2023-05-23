import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import firebase from "../config";

class ProfileScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayName: "",
      familyName: "",
      email: "",
    };
    this.unsubscribe = null;
  }

  componentDidMount() {
    this.unsubscribe = firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.uid)
      .onSnapshot((doc) => {
        const { displayName, familyName, email } = doc.data();
        this.setState({ displayName, familyName, email });
      });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  handleUpdateProfile = async () => {
    try {
      const currentUser = firebase.auth().currentUser;
      await firebase
        .firestore()
        .collection("users")
        .doc(currentUser.uid)
        .update({
          displayName: this.state.displayName,
          familyName: this.state.familyName,
          email: this.state.email,
        });
      console.log("Profile updated successfully!");
    } catch (error) {
      console.log(error);
    }
  };

  handleSignOut = async () => {
    try {
      await firebase.auth().signOut();
      console.log("Sign out successful!");
      this.props.navigation.navigate("Login");
    } catch (error) {
      console.log(error);
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          onChangeText={(displayName) => this.setState({ displayName })}
          value={this.state.displayName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          onChangeText={(familyName) => this.setState({ familyName })}
          value={this.state.familyName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          onChangeText={(email) => this.setState({ email })}
          value={this.state.email}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={this.handleUpdateProfile}
        >
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={this.handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    width: "100%",
  },
  button: {
    backgroundColor: "#20B2AA",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ProfileScreen;
