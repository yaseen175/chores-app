import React, { Component } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import firebase from "../config";
import Icon from "react-native-vector-icons/FontAwesome";

const db = firebase.firestore();

class ShoppingListScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      newItem: "",
      houseId: null,
      error: "",
    };
  }

  componentDidMount() {
    this.fetchItems();
  }

  fetchItems = () => {
    const userId = firebase.auth().currentUser.uid;

    db.collection("users")
      .doc(userId)
      .onSnapshot(async (userSnapshot) => {
        const houseId = userSnapshot.data().houseId;
        this.setState({ houseId });

        if (houseId) {
          db.collection("houses")
            .doc(houseId)
            .collection("shoppingList")
            .onSnapshot((querySnapshot) => {
              const items = querySnapshot.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
              });
              this.setState({ items });
            });
        }
      });
  };

  addItem = async () => {
    const { newItem } = this.state;
    const userId = firebase.auth().currentUser.uid;

    if (newItem.trim() === "") {
      this.setState({
        error: "Error Item name cannot be empty",
      });
      return;
    }

    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;

    if (houseId) {
      await db
        .collection("houses")
        .doc(houseId)
        .collection("shoppingList")
        .add({
          name: newItem,
          bought: false,
        });

      this.setState({ newItem: "" });
    }
  };

  toggleItemBought = async (itemId) => {
    const { items } = this.state;
    const item = items.find((i) => i.id === itemId);
    const userId = firebase.auth().currentUser.uid;
    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;

    if (houseId) {
      await db
        .collection("houses")
        .doc(houseId)
        .collection("shoppingList")
        .doc(itemId)
        .update({
          bought: !item.bought,
        });
    }
  };

  deleteItem = async (itemId) => {
    const userId = firebase.auth().currentUser.uid;
    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;

    if (houseId) {
      await db
        .collection("houses")
        .doc(houseId)
        .collection("shoppingList")
        .doc(itemId)
        .delete();
    }
  };

  render() {
    const { items, newItem, houseId } = this.state;

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
        <Text style={styles.title}>Shopping List</Text>
        <TextInput
          style={styles.input}
          placeholder="New Item"
          onChangeText={(newItem) => this.setState({ newItem })}
          value={newItem}
        />
        <TouchableOpacity style={styles.button} onPress={this.addItem}>
          <Text style={styles.buttonText}>Add Item</Text>
        </TouchableOpacity>
        <>
          {this.state.error && (
            <Text style={styles.error}>{this.state.error}</Text>
          )}
        </>
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Text
                style={[styles.item, item.bought ? styles.boughtItem : null]}
              >
                {item.name}
              </Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => this.toggleItemBought(item.id)}
              >
                <Text style={styles.toggleButtonText}>
                  {item.bought ? "Unmark" : "Mark as Bought"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => this.deleteItem(item.id)}
              >
                <Icon name="trash" size={20} color="Black" />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#20B2AA",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#20B2AA",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  item: {
    flex: 1,
    fontSize: 16,
  },
  boughtItem: {
    textDecorationLine: "line-through",
    color: "gray",
  },
  toggleButton: {
    backgroundColor: "#20B2AA",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  toggleButtonBought: {
    backgroundColor: "gray",
  },
  toggleButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  error: {
    color: "red",
    fontWeight: "900",
    textAlign: "center",
  },
});

export default ShoppingListScreen;
