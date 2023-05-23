import React, { Component } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import Modal from "react-native-modal";
import firebase from "../config";

const db = firebase.firestore();

class CostsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      costs: [],
      newCostName: "",
      newCostAmount: "",
      members: [],
      showAddModal: false,
      houseId: null,
    };
  }

  componentDidMount() {
    this.fetchCosts();
  }

  fetchCosts = () => {
    const userId = firebase.auth().currentUser.uid;

    db.collection("users")
      .doc(userId)
      .onSnapshot(async (userSnapshot) => {
        const houseId = userSnapshot.data().houseId;
        this.setState({ houseId });

        if (houseId) {
          db.collection("houses")
            .doc(houseId)
            .onSnapshot(async (houseSnapshot) => {
              let members = houseSnapshot.data().members;
              // Ensure members is always an array
              if (!Array.isArray(members)) {
                members = [members];
              }

              // Fetch user names for all members
              const memberPromises = members.map((memberId) =>
                db.collection("users").doc(memberId).get()
              );
              const memberDocs = await Promise.all(memberPromises);
              const membersWithName = memberDocs.map((doc) => ({
                userId: doc.id,
                displayName: doc.data().displayName,
              }));

              this.setState({ members: membersWithName });
            });

          db.collection("houses")
            .doc(houseId)
            .collection("costs")
            .onSnapshot((querySnapshot) => {
              const costs = querySnapshot.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
              });
              this.setState({ costs });
            });
        }
      });
  };

  addCost = async () => {
    const { newCostName, newCostAmount } = this.state;
    const userId = firebase.auth().currentUser.uid;

    if (newCostName.trim() === "" || newCostAmount.trim() === "") {
      window.alert("Error Cost name and amount cannot be empty");
      return;
    }

    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;

    if (houseId) {
      await db
        .collection("houses")
        .doc(houseId)
        .collection("costs")
        .add({
          name: newCostName,
          amount: parseFloat(newCostAmount),
          addedBy: userId,
        });

      this.setState({ newCostName: "", newCostAmount: "" });
    }
  };

  deleteCost = async (costId) => {
    const userId = firebase.auth().currentUser.uid;
    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;

    if (houseId) {
      await db
        .collection("houses")
        .doc(houseId)
        .collection("costs")
        .doc(costId)
        .delete();
    }
  };

  calculateTotalCost = () => {
    const { costs } = this.state;
    const costPerUser = {};

    costs.forEach((cost) => {
      if (costPerUser[cost.addedBy]) {
        costPerUser[cost.addedBy] += cost.amount;
      } else {
        costPerUser[cost.addedBy] = cost.amount;
      }
    });

    return costPerUser;
  };

  calculateSplitCost = () => {
    const { costs, members } = this.state;
    const totalCost = costs.reduce((total, cost) => total + cost.amount, 0);
    const splitCost = totalCost / members.length;

    return splitCost;
  };

  render() {
    const { costs, newCostName, newCostAmount, showAddModal, houseId } =
      this.state;
    const totalCostPerUser = this.calculateTotalCost();
    const splitCost = this.calculateSplitCost();

    if (!houseId) {
      return (
        <View style={styles.container}>
          <Text>
            You are not part of a house yet. Please create a house or tell
            someone to add you.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <FlatList
          data={costs}
          renderItem={({ item }) => (
            <View style={styles.costContainer}>
              <Text style={styles.costName}>{item.name}</Text>
              <Text style={styles.costAmount}>${item.amount.toFixed(2)}</Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => this.deleteCost(item.id)}
              >
                <Icon name="trash" size={20} color="Black" />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />

        <View style={styles.costSummaryContainer}>
          <Text style={styles.CostTitle}>Total Cost:</Text>
          {Object.entries(totalCostPerUser).map(([userId, totalCost]) => (
            <View key={userId} style={styles.costSummaryItem}>
              <Text style={styles.costSummaryAmount}>
                ${totalCost.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.splitCostContainer}>
          <Text style={styles.CostTitle}>Split Cost:</Text>
          {this.state.members.map((member) => (
            <View key={member.userId} style={styles.splitCostItem}>
              <Text style={styles.splitCostUserId}>{member.displayName}:</Text>
              <Text style={styles.splitCostAmount}>
                ${(splitCost || 0).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
        <Modal
          isVisible={showAddModal}
          onBackdropPress={() =>
            this.setState({
              showAddModal: false,
            })
          }
          animationIn="slideInRight"
          animationOut="slideOutRight"
        >
          <View style={styles.draftsModal}>
            <Text style={styles.modalTitle}>Shared Costs</Text>

            <TextInput
              style={styles.input}
              placeholder="New Cost Name"
              onChangeText={(newCostName) => this.setState({ newCostName })}
              value={newCostName}
            />
            <TextInput
              style={styles.input}
              placeholder="New Cost Amount"
              onChangeText={(newCostAmount) => this.setState({ newCostAmount })}
              value={newCostAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.button} onPress={this.addCost}>
              <Text style={styles.buttonText}>Add Cost</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <TouchableOpacity
          onPress={() => this.setState({ showAddModal: true })}
          style={[styles.addButtonContainer]}
        >
          <Icon name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    justifyContent: "space-between",
  },
  costContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  costName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  costAmount: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "white",
  },
  costSummaryContainer: {
    marginTop: 20,
  },
  costSummaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  costSummaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  costSummaryUserId: {
    fontWeight: "bold",
  },
  costSummaryAmount: {
    fontSize: 14,
  },
  splitCostContainer: {
    marginTop: 20,
  },
  CostTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#20B2AA",
  },
  splitCostItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  splitCostUserId: {
    fontWeight: "bold",
  },
  splitCostAmount: {
    fontSize: 14,
  },
  addButtonContainer: {
    alignSelf: "center",
    backgroundColor: "#1ACB97",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // For Android shadow
    shadowColor: "#000", // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  draftsModal: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: "100%",
  },
  button: {
    backgroundColor: "#1ACB97",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CostsScreen;
