import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import styles from './styles';

const HomeScreen = ({ navigation, route }) => {
  const { identificadorUsuario, serverUrl, usuario } = route.params;
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
          <Ionicons name="log-out" size={24} color="black" />
        </TouchableOpacity>
      ),
    });

    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(`${serverUrl}/consultaUsuarios`);
        setUsuarios(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchUsuarios();

    const intervalId = setInterval(fetchUsuarios, 5000);

    return () => clearInterval(intervalId);
  }, [navigation, serverUrl, identificadorUsuario]);

  const handleLogout = async () => {
    try {
      await axios.post(`${serverUrl}/encerraChat`, { identificadorUsuario });
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erro ao encerrar chat:', error);
      Alert.alert('Erro', 'Não foi possível encerrar a sessão. Tente novamente.');
    }
  };

  const handleSelectUser = (user) => {
    setModalVisible(false);
    navigation.navigate('Chat', { identificadorUsuario, serverUrl, usuario, chatMode: user.identificador });
  };

  const handleOpenChatGeral = () => {
    navigation.navigate('Chat', { identificadorUsuario, serverUrl, usuario, chatMode: 'geral' });
  };

  const renderUsuarioItem = ({ item }) => {
    const isCurrentUser = item.identificador === identificadorUsuario;

    return (
      <TouchableOpacity key={item.identificador} onPress={() => handleSelectUser(item)}>
        <View style={styles.userContainer}>
          <Text style={styles.userText}>
            {isCurrentUser ? `${item.usuario} (você)` : item.usuario}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const sortedUsers = usuarios.sort((a, b) => a.usuario.localeCompare(b.usuario));

  return (
    <View style={[styles.container, styles.homeScreenContainer]}>
      <Text>Bem-vindo ao Chat App, {usuario}!</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleOpenChatGeral}
        >
          <Text style={styles.buttonText}>Chat Geral</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>DM</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalView}>
            <FlatList
              data={sortedUsers}
              renderItem={renderUsuarioItem}
              keyExtractor={item => item.identificador}
              style={styles.userList}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;
