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
// import RNPickerSelect from "react-native-picker-select";
import { Picker } from "@react-native-picker/picker";
import Modal from "react-native-modal";
import Icon from "react-native-vector-icons/FontAwesome";

const db = firebase.firestore();

export default class TasksScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newTask: "",
      newTaskDescription: "",
      assignedTo: "",
      members: [],
      cooldown: 24,
      showAddModal: false,
      houseId: null,
      error: "",
    };
  }

  componentDidMount() {
    this.fetchTasks();
  }

  fetchTasks = () => {
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
              if (!Array.isArray(members)) {
                members = [members];
              }
              const memberPromises = members.map((memberId) =>
                db.collection("users").doc(memberId).get()
              );

              const memberDocs = await Promise.all(memberPromises);
              this.setState({
                members: memberDocs.map((doc) => ({
                  userId: doc.id,
                  displayName: doc.data().displayName,
                })),
              });
            });

          db.collection("houses")
            .doc(houseId)
            .collection("tasks")
            .onSnapshot((querySnapshot) => {
              const tasks = querySnapshot.docs.map((doc) => {
                return { id: doc.id, ...doc.data() };
              });
              this.setState({ tasks });
            });
        }
      });
  };

  addTask = async () => {
    this.setState({ error: "" });

    const { newTask, newTaskDescription, assignedTo } = this.state;
    const userId = firebase.auth().currentUser.uid;

    if (newTask.trim() === "" || assignedTo.trim() === "") {
      this.setState({
        error: "Error Task name and assigned user cannot be empt",
      });
      return;
    }

    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;

    if (houseId) {
      await db.collection("houses").doc(houseId).collection("tasks").add({
        name: newTask,
        description: newTaskDescription,
        assignedTo: assignedTo,
        completed: false,
        completedAt: null,
        completedBy: null,
      });

      this.setState({ newTask: "", newTaskDescription: "", assignedTo: "" });
    }
  };

  getRemainingCooldown = (completedAt) => {
    const { cooldown } = this.state;
    if (!completedAt) {
      return { hours: 0, minutes: 0 };
    }

    const currentTime = new Date();
    const timeDifferenceInMinutes =
      (currentTime - completedAt.toDate()) / (1000 * 60);

    const remainingCooldownInMinutes = cooldown * 60 - timeDifferenceInMinutes;
    if (remainingCooldownInMinutes > 0) {
      const hours = Math.floor(remainingCooldownInMinutes / 60);
      const minutes = Math.floor(remainingCooldownInMinutes % 60);
      return { hours, minutes };
    } else {
      return { hours: 0, minutes: 0 };
    }
  };

  render() {
    const {
      tasks,
      newTask,
      newTaskDescription,
      assignedTo,
      members,
      cooldown,
      showAddModal,
      houseId,
    } = this.state;

    const memberItems = members.map((member) => ({
      label: member.displayName,
      value: member.userId,
    }));

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
          data={tasks}
          renderItem={({ item }) => (
            <TaskItem
              item={item}
              cooldown={cooldown}
              getRemainingCooldown={this.getRemainingCooldown}
            />
          )}
          keyExtractor={(item) => item.id}
        />
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
            <Text style={styles.modalTitle}>Tasks</Text>
            <TextInput
              style={styles.input}
              placeholder="New Task"
              onChangeText={(newTask) => this.setState({ newTask })}
              value={newTask}
            />
            <TextInput
              style={styles.input}
              placeholder="Task Description"
              onChangeText={(newTaskDescription) =>
                this.setState({ newTaskDescription })
              }
              value={newTaskDescription}
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Assign to:</Text>
              <Picker
                style={styles.picker}
                selectedValue={assignedTo}
                onValueChange={(value) => this.setState({ assignedTo: value })}
              >
                <Picker.Item label="Select a member..." value={null} />
                {members.map((member) => (
                  <Picker.Item
                    key={member.userId}
                    label={member.displayName}
                    value={member.userId}
                  />
                ))}
              </Picker>
            </View>
            <TouchableOpacity style={styles.button} onPress={this.addTask}>
              <Text style={styles.buttonText}>Add Task</Text>
            </TouchableOpacity>{" "}
            <>
              {this.state.error && (
                <Text style={styles.error}>{this.state.error}</Text>
              )}
            </>
          </View>
        </Modal>
        <TouchableOpacity
          onPress={() => this.setState({ showAddModal: true })}
          style={[styles.addButtonContainer]}
        >
          <Icon name="plus" size={24} color="black" />
        </TouchableOpacity>
      </View>
    );
  }
}

class TaskItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      taskName: this.props.item.name,
      taskDescription: this.props.item.description,
      remainingCooldown: this.props.getRemainingCooldown(
        this.props.item.completedAt
      ),
    };
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({
        remainingCooldown: this.props.getRemainingCooldown(
          this.props.item.completedAt
        ),
      });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  completeTask = async (taskId, assignedTo, completedAt) => {
    const { cooldown } = this.props;
    const userId = firebase.auth().currentUser.uid;
    if (completedAt) {
      const diffInHours =
        (Date.now() - completedAt.toDate()) / (1000 * 60 * 60);
      if (diffInHours < cooldown) {
        window.alert("The task is still on cooldown");
        return;
      }
    }
    if (assignedTo !== userId) {
      window.alert("Error You are not allowed to complete this task");
      return;
    }
    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;
    if (houseId) {
      if (completedAt) {
        await db
          .collection("houses")
          .doc(houseId)
          .collection("tasks")
          .doc(taskId)
          .update({
            completed: false,
            completedAt: null,
            completedBy: null,
          });
      } else {
        await db
          .collection("houses")
          .doc(houseId)
          .collection("tasks")
          .doc(taskId)
          .update({
            completed: true,
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            completedBy: userId,
          });
      }
      this.setState({
        completed: !completedAt,
        completedAt: completedAt ? null : new Date(),
        completedBy: completedAt ? null : userId,
      });
    }
  };

  handleTaskNameChange = (text) => {
    this.setState({ taskName: text });
  };

  handleTaskDescriptionChange = (text) => {
    this.setState({ taskDescription: text });
  };

  editTask = async (taskId, updatedName, updatedDescription) => {
    const userId = firebase.auth().currentUser.uid;
    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;

    if (houseId) {
      await db
        .collection("houses")
        .doc(houseId)
        .collection("tasks")
        .doc(taskId)
        .update({
          name: updatedName,
          description: updatedDescription,
        });
    }
  };

  deleteTask = async (taskId) => {
    const userId = firebase.auth().currentUser.uid;
    const userSnapshot = await db.collection("users").doc(userId).get();
    const houseId = userSnapshot.data().houseId;

    if (houseId) {
      await db
        .collection("houses")
        .doc(houseId)
        .collection("tasks")
        .doc(taskId)
        .delete();
    }
  };

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  };

  render() {
    const { item } = this.props;
    const { remainingCooldown, modalVisible, taskName, taskDescription } =
      this.state;
    return (
      <View style={styles.taskContainer}>
        <Modal
          isVisible={modalVisible}
          onBackdropPress={() =>
            this.setState({
              modalVisible: false,
            })
          }
          animationIn="slideInRight"
          animationOut="slideOutRight"
        >
          <View style={styles.draftsModal}>
            <Text style={styles.modalText}>Edit Task</Text>
            <TextInput
              style={styles.input}
              onChangeText={this.handleTaskNameChange}
              value={taskName}
              placeholder="Task Name"
            />
            <TextInput
              style={styles.input}
              onChangeText={this.handleTaskDescriptionChange}
              value={taskDescription}
              placeholder="Task Description"
              multiline
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                this.editTask(item.id, taskName, taskDescription);
                this.setModalVisible(!modalVisible);
              }}
            >
              <Text style={styles.textStyle}>Save</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <TouchableOpacity
          style={[styles.task, item.completed ? styles.completedTask : null]}
          onPress={() => {
            this.setModalVisible(true);
          }}
        >
          <Text>{item.name}</Text>
        </TouchableOpacity>
        <Text style={styles.remainingCooldown}>
          {remainingCooldown.hours > 0 || remainingCooldown.minutes > 0
            ? `Cooldown: ${remainingCooldown.hours}h ${remainingCooldown.minutes}m`
            : ""}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => this.deleteTask(item.id)}
        >
          <Icon name="trash" size={20} color="Black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() =>
            this.completeTask(item.id, item.assignedTo, item.completedAt)
          }
        >
          <Text style={styles.completeButtonText}>
            {item.completed ? "Reset" : "Complete"}
          </Text>
        </TouchableOpacity>
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
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: "100%",
  },
  addButtonContainer: {
    alignSelf: "center",
    backgroundColor: "#1ACB97",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  taskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  task: {
    flex: 1,
    fontSize: 16,
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: "gray",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerLabel: {
    marginRight: 10,
  },
  picker: {
    flexGrow: 1,
  },
  remainingCooldown: {
    fontSize: 14,
    color: "gray",
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: "right",
    flex: 1,
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
  editButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 5,
  },
  editButtonText: {
    color: "white",
  },
  deleteButton: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 5,
  },
  deleteButtonText: {
    color: "white",
  },
  completeButton: {
    backgroundColor: "#20B2AA",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 5,
  },
  completeButtonText: {
    color: "white",
  },
  error: {
    color: "red",
    fontWeight: "900",
    textAlign: "center",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
});
