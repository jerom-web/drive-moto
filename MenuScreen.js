import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { db, storage } from '../firebase/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';

const MenuScreen = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [restaurantId, setRestaurantId] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Dish Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  
  // Edit Dish Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUri, setEditImageUri] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Theme-aware styles
  const containerBg = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBg = isDark ? '#374151' : '#FFFFFF';
  const modalBg = isDark ? '#1F2937' : '#FFFFFF';

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos of dishes.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Request storage permission for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to select images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Image picker options
  const imagePickerOptions = {
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    includeBase64: false,
    saveToPhotos: false,
  };

  // Helper function to handle image picker response
  const handleImagePickerResponse = (response, isEdit = false) => {
    console.log('Image picker response:', response);
    
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }
    
    if (response.errorCode) {
      console.error('Image picker error:', response.errorMessage);
      Alert.alert('Error', `Failed to select image: ${response.errorMessage}`);
      return;
    }
    
    if (response.errorMessage) {
      console.error('Image picker error:', response.errorMessage);
      Alert.alert('Error', `Failed to select image: ${response.errorMessage}`);
      return;
    }

    // Handle different response structures
    let selectedImage = null;
    
    if (response.assets && response.assets.length > 0) {
      selectedImage = response.assets[0];
    } else if (response.uri) {
      selectedImage = response;
    } else if (response.length > 0) {
      selectedImage = response[0];
    }

    if (selectedImage && selectedImage.uri) {
      console.log('Selected image URI:', selectedImage.uri);
      if (isEdit) {
        setEditImageUri(selectedImage.uri);
      } else {
        setImageUri(selectedImage.uri);
      }
    } else {
      console.error('No valid image selected');
      Alert.alert('Error', 'No valid image was selected');
    }
  };

  // Updated selectImage function with camera and gallery options
  const selectImage = (isEdit = false) => {
    Alert.alert(
      'Select Image',
      'Choose an option to select a dish image',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(isEdit),
        },
        {
          text: 'Gallery',
          onPress: () => openGallery(isEdit),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Open camera
  const openCamera = async (isEdit = false) => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await launchCamera(imagePickerOptions);
      handleImagePickerResponse(result, isEdit);
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  // Open gallery
  const openGallery = async (isEdit = false) => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required to select images.');
        return;
      }

      const result = await launchImageLibrary(imagePickerOptions);
      handleImagePickerResponse(result, isEdit);
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  // Fetch restaurant ID
  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        if (!user?.uid) return;
        const q = query(collection(db, 'restaurants'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setRestaurantId(snapshot.docs[0].id);
        } else {
          Alert.alert('Error', 'No restaurant found for this user.');
        }
      } catch (error) {
        console.error('Failed to fetch restaurant ID:', error);
        Alert.alert('Error', 'Failed to fetch restaurant information');
      }
    };

    fetchRestaurantId();
  }, [user]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        const catList = snap.docs.map(doc => doc.data());
        setCategories(catList);
      } catch (err) {
        console.error('Error loading categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch dishes
  useEffect(() => {
    const fetchDishes = async () => {
      if (!restaurantId) return;
      try {
        setLoading(true);
        const q = query(collection(db, 'dishes'), where('restaurantId', '==', restaurantId));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDishes(items);
      } catch (err) {
        console.error('Failed to fetch dishes:', err);
        Alert.alert('Error', 'Failed to fetch dishes');
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, [restaurantId]);

  // Upload image to Firebase Storage
  const uploadImage = async (uri) => {
    try {
      if (!uri) return null;

      // Create a unique filename
      const filename = `dishes/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload the blob
      await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image');
    }
  };

  // Add new dish
  const handleAddDish = async () => {
    if (!name || !price || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setAddLoading(true);
      
      // Upload image if selected
      let imageUrl = 'https://via.placeholder.com/300x200/10B981/ffffff?text=No+Image';
      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
      }

      await addDoc(collection(db, 'dishes'), {
        name,
        price,
        description,
        image: imageUrl,
        restaurantId,
        uid: user.uid,
        category: selectedCategory,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setName('');
      setPrice('');
      setDescription('');
      setImageUri(null);
      setSelectedCategory('');
      setShowAddModal(false);
      
      Alert.alert('Success', 'Dish added successfully!');
      
      // Refresh dishes list
      const q = query(collection(db, 'dishes'), where('restaurantId', '==', restaurantId));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDishes(items);
    } catch (error) {
      console.error('Add dish failed:', error);
      Alert.alert('Error', 'Failed to add dish. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (dish) => {
    setEditingDish(dish);
    setEditName(dish.name || '');
    setEditPrice(dish.price || '');
    setEditDescription(dish.description || '');
    setEditImageUri(null);
    setShowEditModal(true);
  };

  // Update dish
  const handleUpdateDish = async () => {
    if (!editName || !editPrice) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      setEditLoading(true);
      let imageUrl = editingDish.image;

      if (editImageUri) {
        imageUrl = await uploadImage(editImageUri);
      }

      const dishRef = doc(db, 'dishes', editingDish.id);
      await updateDoc(dishRef, {
        name: editName,
        price: editPrice,
        description: editDescription,
        image: imageUrl,
        updatedAt: serverTimestamp(),
      });

      setShowEditModal(false);
      Alert.alert('Success', 'Dish updated successfully!');
      
      // Refresh dishes list
      const q = query(collection(db, 'dishes'), where('restaurantId', '==', restaurantId));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDishes(items);
    } catch (error) {
      console.error('Update failed:', error);
      Alert.alert('Error', 'Failed to update dish. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete dish
  const handleDeleteDish = (dishId) => {
    Alert.alert(
      'Delete Dish',
      'Are you sure you want to delete this dish?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'dishes', dishId));
              setDishes(dishes.filter(dish => dish.id !== dishId));
              Alert.alert('Success', 'Dish deleted successfully!');
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', 'Failed to delete dish');
            }
          }
        }
      ]
    );
  };

  // Render dish item
  const renderDishItem = ({ item }) => (
    <View style={[styles.dishItem, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.dishContent}>
        <Image source={{ uri: item.image }} style={styles.dishImage} />
        <View style={styles.dishInfo}>
          <Text style={[styles.dishName, { color: textColor }]}>{item.name}</Text>
          <Text style={styles.dishPrice}>DZ. {item.price}</Text>
          {item.description && (
            <Text style={[styles.dishDescription, { color: subtextColor }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteDish(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={[styles.loadingText, { color: subtextColor }]}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('edit & add dishes')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Dish</Text>
        </TouchableOpacity>
      </View>

      {/* Dishes List */}
      <FlatList
        data={dishes}
        renderItem={renderDishItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: subtextColor }]}>No dishes added yet</Text>
            <Text style={[styles.emptySubtext, { color: subtextColor }]}>Add your first dish to get started!</Text>
          </View>
        }
      />

      {/* Add Dish Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: modalBg }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Add New Dish</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={[styles.closeButtonText, { color: subtextColor }]}>×</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="Dish Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor={subtextColor}
              />

              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="Price (DZ)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor={subtextColor}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={subtextColor}
              />

              {/* Category Picker */}
              <View style={styles.pickerContainer}>
                <Text style={[styles.pickerLabel, { color: textColor }]}>Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((cat, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.categoryItem,
                        { borderColor: borderColor, backgroundColor: selectedCategory === cat.name ? '#10B981' : inputBg }
                      ]}
                      onPress={() => setSelectedCategory(cat.name)}
                    >
                      <Text style={[
                        styles.categoryText,
                        { color: selectedCategory === cat.name ? '#FFFFFF' : textColor }
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Image Selection */}
              <TouchableOpacity 
                style={[styles.imageButton, { borderColor, backgroundColor: inputBg }]} 
                onPress={() => selectImage(false)}
              >
                <Text style={[styles.imageButtonText, { color: subtextColor }]}>
                  {imageUri ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>

              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              )}

              <TouchableOpacity
                style={[styles.submitButton, addLoading && styles.disabledButton]}
                onPress={handleAddDish}
                disabled={addLoading}
              >
                {addLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Dish</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Dish Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: modalBg }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Edit Dish</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={[styles.closeButtonText, { color: subtextColor }]}>×</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="Dish Name"
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={subtextColor}
              />

              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="Price (DZ)"
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
                placeholderTextColor={subtextColor}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="Description (optional)"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={subtextColor}
              />

              {/* Current Image */}
              {editingDish?.image && !editImageUri && (
                <Image source={{ uri: editingDish.image }} style={styles.previewImage} />
              )}

              {/* New Image Preview */}
              {editImageUri && (
                <Image source={{ uri: editImageUri }} style={styles.previewImage} />
              )}

              <TouchableOpacity 
                style={[styles.imageButton, { borderColor, backgroundColor: inputBg }]} 
                onPress={() => selectImage(true)}
              >
                <Text style={[styles.imageButtonText, { color: subtextColor }]}>Change Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, editLoading && styles.disabledButton]}
                onPress={handleUpdateDish}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Dish</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  dishItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dishContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dishImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  editButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
  },
  imageButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MenuScreen;