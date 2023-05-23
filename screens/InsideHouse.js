// import React, { Component } from "react";
// import { View, Text, FlatList, ActivityIndicator } from "react-native";
// import firebase from "../config";

// class TaskList extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       tasks: [],
//       loading: true,
//       errorMessage: "",
//     };
//   }

//   componentDidMount() {
//     this.fetchTasks();
//   }

//   fetchTasks = () => {
//     const houseId = "your_house_id"; // Replace with the actual house ID that the user is a member of

//     this.unsubscribe = firebase
//       .firestore()
//       .collection("houses")
//       .doc(houseId)
//       .collection("tasks")
//       .onSnapshot(
//         (tasksSnapshot) => {
//           const tasks = tasksSnapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//           }));

//           this.setState({ tasks, loading: false });
//         },
//         (error) => {
//           console.error("Error fetching tasks:", error);
//         }
//       );
//   };

//   componentWillUnmount() {
//     // Detach the listener when the component is unmounted
//     if (this.unsubscribe) {
//       this.unsubscribe();
//     }
//   }

//   markTaskAsComplete = async (taskId) => {
//     const houseId = "your_house_id"; // Replace with the actual house ID that the user is a member of

//     try {
//       await firestore()
//         .collection("houses")
//         .doc(houseId)
//         .collection("tasks")
//         .doc(taskId)
//         .update({
//           lastCompleted: firestore.Timestamp.now(),
//         });

//       console.log("Task marked as complete");
//       // Update the task list
//       this.fetchTasks();
//     } catch (error) {
//       console.error("Error marking task as complete:", error);
//     }
//   };

//   renderItem = ({ item }) => (
//     <View>
//       <Text>{item.name}</Text>
//       <Text>Assigned to: {item.assignedTo}</Text>
//       <Text>Description: {item.description}</Text>
//       <Text>
//         Last completed:{" "}
//         {item.lastCompleted ? item.lastCompleted.toDate().toString() : "Never"}
//       </Text>
//       <Button
//         title="Mark as complete"
//         onPress={() => this.markTaskAsComplete(item.id)}
//       />
//     </View>
//   );

//   render() {
//     const { tasks, loading, errorMessage } = this.state;

//     if (loading) {
//       return <ActivityIndicator />;
//     }

//     return (
//       <View>
//         <Text>Task List</Text>
//         {errorMessage ? (
//           <Text style={{ color: "red" }}>{errorMessage}</Text>
//         ) : null}

//         <FlatList
//           data={tasks}
//           renderItem={this.renderItem}
//           keyExtractor={(item) => item.id}
//         />
//       </View>
//     );
//   }
// }

// export default TaskList;

// import React, { Component } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Modal,
//   TextInput,
//   Picker,
// } from "react-native";
// import firebase from "../config";

// class InsideHouseScreen extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       roomId: this.props.route.params.roomId,
//       roomData: {},
//       tasks: [],
//       isModalVisible: false,
//       taskName: "",
//     };
//   }

//   componentDidMount() {
//     this.loadRoomData();
//     this.loadTasks();
//   }

//   loadRoomData = async () => {
//     try {
//       const roomRef = firebase
//         .firestore()
//         .collection("rooms")
//         .doc(this.state.roomId);
//       const roomData = await roomRef.get();
//       if (roomData.exists) {
//         this.setState({ roomData: roomData.data() });
//       }
//       console.log(roomData.data().members);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   loadTasks = async () => {
//     console.log(this.state.roomId);
//     const roomId = this.state.roomId;
//     firebase
//       .firestore()
//       .collection(`rooms/${roomId}/tasks`)
//       .get()
//       .then((querySnapshot) => {
//         const tasks = [];
//         querySnapshot.forEach((doc) => {
//           tasks.push({ id: doc.id, ...doc.data() });
//         });
//         this.setState({ tasks });
//         console.log(tasks);
//       });
//   };

//   handleJoinRoom = async () => {
//     try {
//       const currentUser = firebase.auth().currentUser;
//       const roomId = this.state.roomId.trim();

//       // check if the room ID exists
//       const roomRef = await firebase
//         .firestore()
//         .collection("rooms")
//         .doc(roomId)
//         .get();
//       if (!roomRef.exists) {
//         console.log("Room does not exist");
//         return;
//       }

//       // add user to members of the room
//       await roomRef.ref.update({
//         members: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
//       });

//       console.log("Joined room successfully!");
//       this.props.navigation.navigate("insideHouse", { roomId });
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   handleCreateTask = async () => {
//     try {
//       const taskName = this.state.taskName.trim();
//       if (!taskName) {
//         console.log("Task name cannot be empty");
//         return;
//       }

//       const currentUser = firebase.auth().currentUser;
//       const taskData = {
//         taskName,
//         roomId: this.state.roomId,
//         createdBy: currentUser.uid,
//         createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//         members: this.state.roomData.members,
//       };

//       await firebase
//         .firestore()
//         .collection(`rooms/${this.state.roomId}/tasks`)
//         .add(taskData);

//       console.log("Task created successfully!");
//       this.setState({ isModalVisible: false, taskName: "" });
//       this.loadTasks();
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   render() {
//     const { roomData, tasks, newTaskName } = this.state;
//     return (
//       <View style={styles.container}>
//         <Text style={styles.heading}>{roomData.roomName}</Text>
//         <Text style={styles.subheading}>Description:</Text>
//         <Text style={styles.description}>{roomData.description}</Text>
//         <Text style={styles.subheading}>Tasks:</Text>
//         {tasks.map((task) => (
//           <View key={task.id} style={styles.taskRow}>
//             <Text style={styles.taskName}>{task.taskName}</Text>
//             <Picker
//               selectedValue={task.assignedTo}
//               onValueChange={(itemValue) => {
//                 // update the task document in Firebase with the new assignedTo value
//                 firebase
//                   .firestore()
//                   .collection(`rooms/${this.state.roomId}/tasks`)
//                   .doc(task.id)
//                   .update({
//                     assignedTo: itemValue,
//                   })
//                   .then(() => {
//                     console.log("Task assigned successfully!");
//                   })
//                   .catch((error) => {
//                     console.log(error);
//                   });
//               }}
//             >
//               <Picker.Item label="Select member" value="" />
//               {roomData.members.map((member) => (
//                 <Picker.Item key={member} label={member} value={member} />
//               ))}
//             </Picker>
//           </View>
//         ))}

//         <View style={styles.taskForm}>
//           <TextInput
//             style={styles.taskInput}
//             onChangeText={(text) => this.setState({ taskName: text })}
//             value={this.state.taskName}
//             placeholder="New Task Name"
//           />
//           <TouchableOpacity
//             style={styles.taskButton}
//             onPress={this.handleCreateTask}
//           >
//             <Text style={styles.taskButtonText}>Add Task</Text>
//           </TouchableOpacity>
//         </View>
//         <TouchableOpacity style={styles.button} onPress={this.handleJoinRoom}>
//           <Text style={styles.buttonText}>Join Room</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 20,
//     flex: 1,
//   },
//   heading: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   subheading: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginTop: 10,
//     marginBottom: 5,
//   },
//   description: {
//     fontSize: 14,
//     marginBottom: 10,
//   },
//   button: {
//     backgroundColor: "#20B2AA",
//     borderRadius: 5,
//     padding: 10,
//     marginTop: 10,
//     width: "100%",
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   taskForm: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 10,
//     marginBottom: 10,
//   },
//   taskInput: {
//     flex: 1,
//     backgroundColor: "#f7f7f7",
//     borderRadius: 5,
//     padding: 10,
//     marginRight: 10,
//   },
//   taskButton: {
//     backgroundColor: "#20B2AA",
//     borderRadius: 5,
//     padding: 10,
//   },
//   taskButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
// });

// export default InsideHouseScreen;
