import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";

const OrderItem = ({ order, onPress }) => {
  return (
    <TouchableOpacity style={styles.orderContainer} onPress={onPress}>
      <Image
        source={{ uri: order.restaurantImage }}
        style={styles.restaurantImage}
        resizeMode="cover"
      />

      <View style={styles.detailsContainer}>
        <Text style={styles.restaurantName}>{order.restaurantName}</Text>
        <Text style={styles.restaurantAddress}>{order.restaurantAddress}</Text>

        <Text style={styles.deliveryLabel}>Delivery Details:</Text>
        <Text style={styles.deliveryText}>
          {order.userFirstName} {order.userLastName}
        </Text>
        <Text style={styles.deliveryText}>{order.userAddress}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default OrderItem;

const styles = StyleSheet.create({
  orderContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 15,
    borderColor: "#3FC060",
    borderWidth: 2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  restaurantImage: {
    width: "30%",
    height: "100%",
    minHeight: 110,
  },
  detailsContainer: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
    color: "#333",
  },
  restaurantAddress: {
    color: "grey",
    fontWeight: "500",
    marginBottom: 6,
  },
  deliveryLabel: {
    fontWeight: "600",
    marginTop: 5,
    color: "#444",
  },
  deliveryText: {
    color: "grey",
    fontWeight: "500",
  },
});

