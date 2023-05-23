import React, { Component } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  TextInput,
  View,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import firebase from "../config";

export default class SignUpScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayName: "",
      familyName: "",
      email: "",
      password: "",
      error: "",
      submitted: false,
    };
  }

  handleSignup = async (displayName, familyName, email, password) => {
    try {
      const { user } = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, password); // Add user to Firestore
      await firebase.firestore().collection("users").doc(user.uid).set({
        uid: user.uid,
        displayName,
        familyName,
        email,
        houseId: null,
      });

      console.log("user registered successfully");
      this.props.navigation.navigate("Login");
    } catch (error) {
      console.log(error.message);
    }
  };

  signUp = async () => {
    const { displayName, familyName, email, password } = this.state;
    if (!displayName || !familyName || !email || !password) {
      this.setState({ error: "All fields are required", submitted: true });
    } else {
      const { navigation } = this.props;
      try {
        await this.handleSignup(displayName, familyName, email, password);
        this.setState({ error: "" });
      } catch (error) {
        console.log(error);
        this.setState({ error: error.message });
      }
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={{
            uri: "https://www.bootdey.com/image/580x580/20B2AA/20B2AA",
          }}
          style={styles.header}
        >
          <Text style={styles.heading}>Chores App</Text>
        </ImageBackground>
        <View style={styles.card}>
          {this.state.error && (
            <Text style={styles.error}>{this.state.error}</Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            onChangeText={(displayName) => this.setState({ displayName })}
            value={this.state.displayName}
          />
          {this.state.submitted && !this.state.displayName && (
            <Text style={styles.error}>*Display Name is required</Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="Family Name"
            onChangeText={(familyName) => this.setState({ familyName })}
            value={this.state.familyName}
          />
          {this.state.submitted && !this.state.familyName && (
            <Text style={styles.error}>*Family Name is required</Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            onChangeText={(email) => this.setState({ email })}
            defaultValue={this.state.email}
          />

          <>
            {this.state.submitted && !this.state.email && (
              <Text style={styles.error}>*Email is required</Text>
            )}
          </>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            onChangeText={(password) => this.setState({ password })}
            defaultValue={this.state.password}
            secureTextEntry={true}
          />

          <>
            {this.state.submitted && !this.state.password && (
              <Text style={styles.error}>*Password is required</Text>
            )}
          </>

          <TouchableOpacity style={styles.button} onPress={this.signUp}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
          {this.state.error && (
            <Text style={styles.error}>{this.state.error}</Text>
          )}

          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => navigation.navigate("Signin")}
          >
            <Text style={styles.createAccountButtonText}>
              Already Have An Account?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  error: {
    color: "red",
    fontWeight: "900",
  },
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
    paddingBottom: 20,
    width: "100%",
    height: 200,
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  forgotPasswordButton: {
    width: "100%",
    textAlign: "flex-end",
  },
  forgotPasswordButtonText: {
    color: "#20B2AA",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    padding: 20,
    marginTop: 40,
    width: "90%",
    alignItems: "center",
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
  createAccountButton: {
    marginTop: 20,
  },
  createAccountButtonText: {
    color: "#20B2AA",
    fontSize: 12,
    fontWeight: "bold",
  },
});
