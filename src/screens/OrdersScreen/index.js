import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "@gorhom/bottom-sheet";
import MapView, { Marker } from "react-native-maps";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { db } from "../../../firebase/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import OrderItem from "../../components/OrderItem";

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [isUserReady, setIsUserReady] = useState(false);
  const navigation = useNavigation();
  const bottomSheetRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const snapPoints = useMemo(() => ["30%", "90%"], []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigation.replace("Login");
      } else {
        setUserEmail(user.email);
        setIsUserReady(true);
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!isUserReady) return;

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("status", "==", "READY"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ ...doc.data(), id: doc.id });
      });
      setOrders(items);
    });

    return unsubscribe;
  }, [isUserReady]);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  const handleGetLocation = (order) => {
    if (order?.restaurantLatitude && order?.restaurantLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${order.restaurantLatitude},${order.restaurantLongitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Location Missing", "Restaurant coordinates are missing.");
    }
  };

  const handleShowOrder = (order) => {
    navigation.navigate("OrdersDeliveryScreen", { order });
  };

  if (!isUserReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Top User Info Bar */}
        <View
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            right: 20,
            zIndex: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 10,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 16 }}>👤 {userEmail}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="red" />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <MapView
          style={{ width, height }}
          showsUserLocation
          followsUserLocation
        >
          {orders.map((order, index) => {
            const lat = Number(order.restaurantLatitude);
            const lng = Number(order.restaurantLongitude);

            if (!isNaN(lat) && !isNaN(lng)) {
              return (
                <Marker
                  key={order.id || index}
                  title={order.restaurantName}
                  description={order.restaurantAddress}
                  coordinate={{ latitude: lat, longitude: lng }}
                >
                  <View
                    style={{
                      backgroundColor: "green",
                      padding: 5,
                      borderRadius: 20,
                    }}
                  >
                    <Entypo name="shop" size={24} color="white" />
                  </View>
                </Marker>
              );
            }
            return null;
          })}
        </MapView>

        {/* Orders Bottom Sheet */}
        <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints}>
          {/* Handle Indicator */}
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "grey",
                width: 100,
                height: 5,
                borderRadius: 10,
              }}
            />
          </View>

          {/* Header */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              letterSpacing: 0.5,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            You're Online
          </Text>
          <Text
            style={{
              color: "grey",
              letterSpacing: 0.3,
              textAlign: "center",
              marginBottom: 15,
            }}
          >
            Available Orders: {orders.length}
          </Text>

          {/* Order List */}
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderItem order={item} onPress={() => handleShowOrder(item)} />
            )}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default OrdersScreen;
