import React, { Component } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import firebase from "../config";

const db = firebase.firestore();

class HouseScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      houseName: "",
      inviteEmail: "",
      houseId: null,
      members: [],
      error: "",
    };
  }

  componentDidMount() {
    this.fetchHouseInfo();
  }

  fetchHouseInfo = () => {
    const userId = firebase.auth().currentUser.uid;

    db.collection("users")
      .doc(userId)
      .onSnapshot(async (userSnapshot) => {
        const houseId = userSnapshot.data().houseId;

        if (houseId) {
          const houseSnapshot = await db
            .collection("houses")
            .doc(houseId)
            .get();
          const members = await this.fetchHouseMembers(houseId);

          this.setState({
            houseId,
            houseName: houseSnapshot.data().houseName,
            members,
          });
        }
      });
  };

  fetchHouseMembers = async (houseId) => {
    const membersSnapshot = await db
      .collection("users")
      .where("houseId", "==", houseId)
      .get();

    return membersSnapshot.docs.map((doc) => doc.data());
  };

  createHouse = async () => {
    const { houseName } = this.state;
    const currentUser = firebase.auth().currentUser;

    if (houseName.trim() === "") {
      window.alert("Error House name cannot be empty");
      return;
    }

    const houseRef = await db.collection("houses").add({
      houseName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      members: [currentUser.uid],
    });

    await db.collection("users").doc(currentUser.uid).update({
      houseId: houseRef.id,
    });

    this.setState({ houseId: houseRef.id }, this.fetchHouseInfo);
  };

  leaveHouse = async () => {
    const { houseId } = this.state;
    const currentUser = firebase.auth().currentUser;

    await db.collection("users").doc(currentUser.uid).update({
      houseId: null,
    });

    await db
      .collection("houses")
      .doc(houseId)
      .update({
        members: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
      });

    this.setState({ houseId: null }, this.fetchHouseInfo);
  };

  inviteMember = async () => {
    const { inviteEmail, houseId } = this.state;

    if (inviteEmail.trim() === "") {
      this.setState({ error: "Error Email cannot be empty" });
      return;
    }

    const userSnapshot = await db
      .collection("users")
      .where("email", "==", inviteEmail)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      this.setState({ error: "Error No user found with this email" });
      return;
    }

    const userDoc = userSnapshot.docs[0];

    if (userDoc.data().houseId) {
      this.setState({ error: "Error This user is already part of a house" });
      return;
    }

    await db.collection("users").doc(userDoc.id).update({ houseId });
    await db
      .collection("houses")
      .doc(houseId)
      .update({
        members: firebase.firestore.FieldValue.arrayUnion(userDoc.id),
      });

    this.fetchHouseInfo();
    this.setState({ inviteEmail: "" });
  };

  render() {
    const { houseName, inviteEmail, members } = this.state;

    return (
      <View style={styles.container}>
        {!this.state.houseId && (
          <>
            <Text style={styles.title}>Create a House</Text>
            <TextInput
              style={styles.input}
              placeholder="House Name"
              onChangeText={(houseName) => this.setState({ houseName })}
              value={houseName}
            />
            <TouchableOpacity style={styles.button} onPress={this.createHouse}>
              <Text style={styles.buttonText}>Create House</Text>
            </TouchableOpacity>
          </>
        )}
        {this.state.houseId && (
          <>
            <Text style={styles.title}>{houseName}</Text>
            <Text style={styles.subtitle}>Invite a Member</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              onChangeText={(inviteEmail) => this.setState({ inviteEmail })}
              value={inviteEmail}
            />
            <>
              {this.state.error && (
                <Text style={styles.error}>{this.state.error}</Text>
              )}
            </>
            <TouchableOpacity style={styles.button} onPress={this.inviteMember}>
              <Text style={styles.buttonText}>Invite</Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>Members</Text>
            <FlatList
              data={members}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={styles.member}>{item.displayName}</Text>
                </View>
              )}
              keyExtractor={(item) => item.uid}
            />
            <TouchableOpacity
              style={styles.leaveIconContainer}
              onPress={this.leaveHouse}
            >
              <Image
                source="https://pic.onlinewebfonts.com/svg/img_380770.png"
                style={styles.leaveIcon}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#20B2AA",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#20B2AA",
  },
  input: {
    height: 40,
    borderColor: "#999",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#20B2AA",
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  leaveButton: {
    backgroundColor: "#cc0000",
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  leaveButtonText: {
    color: "white",
    fontSize: 18,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
  },
  member: {
    fontSize: 16,
    marginBottom: 10,
  },
  leaveIcon: {
    position: "absolute",
    bottom: 16,
    right: 1,
    width: 40,
    height: 40,
  },
  error: {
    color: "red",
    fontWeight: "900",
    textAlign: "center",
  },
});

export default HouseScreen;
