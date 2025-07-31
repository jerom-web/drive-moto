import { useRef, useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5, Fontisto, MaterialIcons } from "@expo/vector-icons";
import {
  updateDoc,
  doc,
  collection,
  where,
  query,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import DishInfo from "../../components/DishInfo";
import styles from "./styles.js";

const OrderDelivery = ({ route }) => {
  const { order } = route.params;
  const [driverLocation, setDriverLocation] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [dishInfo, setDishInfo] = useState([]);
  const [restaurantLocation, setRestaurantLocation] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState("READY");
  const navigation = useNavigation();

  const bottomSheetRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const snapPoints = useMemo(() => ["50%", "40%", "90%"], []);
  const mapRef = useRef(null);

  const deliveryLocation = {
    latitude: parseFloat(order.userLatitude),
    longitude: parseFloat(order.userLongitude),
  };

  useEffect(() => {
    getDriverLocation();
    getDishId();
    fetchRestaurantLocation();

    let foregroundSubscription;
    (async () => {
      try {
        foregroundSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 100,
          },
          (updatedLocation) => {
            setDriverLocation({
              latitude: updatedLocation.coords.latitude,
              longitude: updatedLocation.coords.longitude,
            });
          }
        );
      } catch (e) {
        if (__DEV__) {
          console.warn("watchPositionAsync error:", e);
        }
      }
    })();

    const orderRef = doc(db, "orders", order.id);
    updateDoc(orderRef, {
      status: deliveryStatus,
    });

    return () => {
      if (foregroundSubscription) {
        foregroundSubscription.remove();
      }
    };
  }, [deliveryStatus]);

  const fetchRestaurantLocation = async () => {
    try {
      const restaurantRef = doc(db, "restaurants", order.restaurantId);
      const snapshot = await getDoc(restaurantRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRestaurantLocation({
          latitude: parseFloat(data.restaurantLatitude),
          longitude: parseFloat(data.restaurantLongitude),
        });
      }
    } catch (err) {
      if (__DEV__) {
        console.warn("Error fetching restaurant location:", err);
      }
    }
  };

  const getDriverLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (__DEV__) {
          console.warn("Location permission not granted");
        }
        return;
      }

      let location = await Location.getCurrentPositionAsync();
      setDriverLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (e) {
      if (__DEV__) {
        console.warn("getDriverLocation error:", e);
      }
    }
  };

  const getDishId = async () => {
    try {
      const dishesRef = collection(db, "orderDishes");
      const q = query(dishesRef, where("orderId", "==", order.id));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((doc) => doc.data());
      setDishInfo(items);
    } catch (e) {
      if (__DEV__) {
        console.warn("getDishId error:", e);
      }
    }
  };

  if (!driverLocation || !restaurantLocation) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#3FC060" />
        <Text style={{ marginTop: 10 }}>Loading map...</Text>
      </View>
    );
  }

  const renderButtonTitle = () => {
    switch (deliveryStatus) {
      case "READY":
        return "Accept Order ✅";
      case "DRIVERACCEPTED":
        return "Pick-Up Order 🛵";
      case "DRIVERPICKEDUP":
        return "Payment Received 💵";
      case "COMPLETE":
        return "Complete Delivery 🎉";
      default:
        return "Next";
    }
  };

  const onButtonpressed = () => {
    bottomSheetRef.current?.collapse();
    switch (deliveryStatus) {
      case "READY":
        mapRef.current?.animateToRegion({
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setDeliveryStatus("DRIVERACCEPTED");
        break;
      case "DRIVERACCEPTED":
        setDeliveryStatus("DRIVERPICKEDUP");
        break;
      case "DRIVERPICKEDUP":
        setDeliveryStatus("COMPLETE");
        break;
      case "COMPLETE":
        navigation.goBack();
        Alert.alert("Order Delivered 🎉", "You delivered the order successfully!", [
          { text: "OK" },
        ]);
        break;
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={{ width, height }}
        provider="google"
        showsUserLocation
        followsUserLocation
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.07,
          longitudeDelta: 0.07,
        }}
      >
        <MapViewDirections
          origin={driverLocation}
          destination={
            deliveryStatus === "DRIVERACCEPTED"
              ? restaurantLocation
              : deliveryLocation
          }
          strokeWidth={5}
          waypoints={deliveryStatus === "READY" ? [restaurantLocation] : []}
          strokeColor="green"
          apikey="AIzaSyAPaVRYITE6xPAp04F2C0dXNQ9pkwNjqUM"
          onReady={(result) => {
            try {
              setTotalMinutes(result.duration);
              setTotalKm(result.distance);
            } catch (e) {
              if (__DEV__) {
                console.warn("Map directions error:", e);
              }
            }
          }}
        />

        <Marker
          coordinate={restaurantLocation}
          title={order.restaurantName}
          description={order.restaurantAddress}
        >
          <View style={{ backgroundColor: "green", padding: 5, borderRadius: 20 }}>
            <MaterialIcons name="restaurant" size={30} color="white" />
          </View>
        </Marker>

        <Marker
          coordinate={deliveryLocation}
          title={`${order.userFirstName} ${order.userLastName}`}
        >
          <View style={{ backgroundColor: "green", padding: 7, borderRadius: 20 }}>
            <FontAwesome5 name="user" size={28} color="white" />
          </View>
        </Marker>
      </MapView>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.handleIndicatorContainer}>
          <Text style={styles.routeDetailsText}>{totalMinutes.toFixed(0)} min</Text>
          <FontAwesome5
            name="shopping-bag"
            size={30}
            color="#3FC060"
            style={{ marginHorizontal: 10 }}
          />
          <Text style={styles.routeDetailsText}>{totalKm.toFixed(2)} km</Text>
        </View>

        <View style={styles.deliveryDetailsContainer}>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>

          <View style={styles.adressContainer}>
            <Fontisto name="shopping-store" size={22} color="grey" />
            <Text style={styles.adressText}>{order.restaurantAddress}</Text>
          </View>

          <View style={styles.adressContainer}>
            <FontAwesome5 name="user" size={28} color="grey" />
            <Text style={styles.adressText}>
              {order.userFirstName} {order.userLastName}
            </Text>
          </View>

          <View style={styles.adressContainer}>
            <FontAwesome5 name="map-marker-alt" size={30} color="grey" />
            <Text style={styles.adressText}>{order.userAddress}</Text>
          </View>

          <View style={styles.orderDetailsContainer}>
            {dishInfo.map((item, index) => (
              <DishInfo key={index} id={item.dishId} quantity={item.quantity} />
            ))}
          </View>
        </View>

        {deliveryStatus === "READY" && (
          <Pressable
            style={{
              ...styles.buttonContainer,
              backgroundColor: "#000",
              position: "absolute",
              bottom: 80,
              width: "95%",
            }}
            onPress={() => navigation.navigate("OrdersScreen")}
          >
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>
        )}

        <Pressable
          style={{
            ...styles.buttonContainer,
            backgroundColor: "#3FC060",
          }}
          onPress={onButtonpressed}
        >
          <Text style={styles.buttonText}>{renderButtonTitle()}</Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
};

export default OrderDelivery;
