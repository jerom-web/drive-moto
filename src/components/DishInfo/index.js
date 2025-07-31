import { View, Text, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebase";

const DishInfo = ({ id, quantity }) => {
  const [dish, setDish] = useState(null);

  useEffect(() => {
    getDish();
  }, []);

  const getDish = async () => {
    try {
      const docRef = doc(db, "dishes", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setDish(data);
      } else {
        if (__DEV__) {
          console.warn("DishInfo: No such document for id:", id);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error("DishInfo: Failed to fetch dish:", error);
      }
    }
  };

  if (!dish) {
    return <View />;
  }

  return (
    <View style={styles.orderDetailsContainer}>
      <Text style={styles.orderItemText}>{dish.name}</Text>
      <Text style={styles.orderItemText}>x {quantity}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  orderDetailsContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderItemText: {
    fontSize: 20,
    color: "grey",
    fontWeight: "500",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
});

export default DishInfo;
