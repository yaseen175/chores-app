import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TextInput,
  TouchableOpacity,
} from "react-native";
import firebase from "../config";

class LoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
    };
    this.handleSignIn = this.handleSignIn.bind(this);
  }

  handleSignIn = async () => {
    const { email, password } = this.state;
    if (!email || !password) {
      this.setState({ error: "All fields are required", submitted: true });
    } else {
      try {
        await firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(() => {
            console.log("User has signed in");
            // Navigate to the home page
            this.props.navigation.navigate("Home");
          })
          .catch((error) => {
            console.log(error);
            this.setState({ error: error.message });
          });
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
          <TextInput
            style={styles.input}
            placeholder="Email"
            onChangeText={(email) => this.setState({ email })}
            defaultValue={this.state.email}
          />
          {this.state.submitted && !this.state.email && (
            <Text style={styles.error}>*Email is required</Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={(password) => this.setState({ password })}
            defaultValue={this.state.password}
          />
          {this.state.submitted && !this.state.password && (
            <Text style={styles.error}>*Password is required</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={this.handleSignIn}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          {this.state.error && (
            <Text style={styles.error}>{this.state.error}</Text>
          )}
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => this.props.navigation.navigate("Signup")}
          >
            <Text style={styles.createAccountButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
  error: {
    color: "red",
    fontWeight: "900",
    textAlign: "center",
  },
});

export default LoginScreen;
