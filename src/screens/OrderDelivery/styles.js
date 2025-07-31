import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    backgroundColor: "#e0f7ff", // light blue
    flex: 1,
  },

  // Header + Logout
  topBar: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    elevation: 5,
  },
  userText: {
    fontSize: 16,
  },

  // Bottom Sheet Indicators
  handleIndicatorContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  handleIndicator: {
    backgroundColor: "grey",
    width: 100,
    height: 5,
    borderRadius: 10,
    alignSelf: "center",
    marginVertical: 10,
  },

  // Section Titles
  routeDetailsText: {
    fontSize: 22,
    letterSpacing: 0.7,
    fontWeight: "600",
  },

  // OrderItem styling
  orderItemContainer: {
    flexDirection: "row",
    margin: 10,
    borderColor: "#3FC060",
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  orderImage: {
    width: "25%",
    height: "100%",
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
  },
  orderInfo: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 10,
    paddingRight: 5,
  },
  restaurantName: {
    fontWeight: "bold",
    fontSize: 18,
  },
  restaurantAddress: {
    color: "grey",
    fontWeight: "500",
  },
  deliveryText: {
    color: "grey",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  orderCheckIcon: {
    backgroundColor: "#3FC060",
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },

  // Bottom Sheet Order Counter
  bottomSheetHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  onlineText: {
    fontSize: 20,
    fontWeight: "600",
    paddingBottom: 5,
  },
  orderCountText: {
    color: "grey",
  },

  // Delivery screen (if reused)
  deliveryDetailsContainer: {
    paddingHorizontal: 20,
  },
  addressContainer: {
    flexDirection: "row",
    marginBottom: 18,
    alignItems: "center",
  },
  addressText: {
    fontSize: 18,
    color: "#555",
    fontWeight: "500",
    letterSpacing: 0.5,
    marginLeft: 12,
  },
  orderDetailsContainer: {
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 20,
    marginTop: 10,
  },
  orderItemText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: "auto",
    marginVertical: 30,
    marginHorizontal: 15,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "#3FC060",
  },
});
