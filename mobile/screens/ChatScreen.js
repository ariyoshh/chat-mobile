import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Modal } from 'react-native';
import axios from 'axios';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';

const ChatScreen = ({ route, navigation }) => {
  const { identificadorUsuario, serverUrl, chatMode } = route.params;
  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(`${serverUrl}/consultaUsuarios`);
        setUsuarios(response.data);
        updateHeaderTitle(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    const fetchMensagens = async () => {
      try {
        const response = await axios.get(`${serverUrl}/consultaMensagens`, { params: { identificadorUsuario, chatMode } });
        const mensagens = response.data;
        setMensagens(mensagens);
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      }
    };

    const markMessagesAsRead = async () => {
      try {
        await axios.post(`${serverUrl}/marcaMensagensComoLidas`, { identificadorUsuario, chatMode });
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      }
    };

    fetchUsuarios();
    fetchMensagens();
    markMessagesAsRead();

    const intervalId = setInterval(() => {
      fetchUsuarios();
      fetchMensagens();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [identificadorUsuario, serverUrl, navigation, chatMode]);

  const updateHeaderTitle = (users) => {
    const user = users.find(u => u.identificador === chatMode);
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginRight: 10 }}>
            <Ionicons name="people" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
            <Ionicons name="log-out" size={24} color="black" />
          </TouchableOpacity>
        </View>
      ),
      title: chatMode === 'geral' ? 'Chat Geral' : `Conversando com: ${user ? user.usuario : 'Desconhecido'}`,
    });
  };

  const handleSend = async () => {
    if (mensagem.trim() === '') {
      return;
    }

    try {
      const endpoint = chatMode === 'geral' ? `${serverUrl}/msgAll` : `${serverUrl}/msg`;
      const body = { identificadorUsuario, msg: mensagem };
      if (chatMode !== 'geral') {
        body.identificadorUsuarioDestino = chatMode;
      }
      await axios.post(endpoint, body);
      setMensagem('');
      const response = await axios.get(`${serverUrl}/consultaMensagens`, { params: { identificadorUsuario, chatMode } });
      const mensagens = response.data;
      setMensagens(mensagens);
      flatListRef.current.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${serverUrl}/encerraChat`, { identificadorUsuario });
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erro ao encerrar chat:', error);
    }
  };

  const renderItem = ({ item }) => {
    const isCurrentUser = item.identificadorUsuarioRemetente === identificadorUsuario;
    const isDirectMessage = item.identificadorUsuarioDestinatario && item.identificadorUsuarioDestinatario !== 'null';
    const isChatModeMatch = chatMode === 'geral' ? !isDirectMessage : (
      chatMode === item.identificadorUsuarioRemetente || 
      chatMode === item.identificadorUsuarioDestinatario
    );

    if (!isChatModeMatch) return null;

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
        <Text style={styles.sender}>{item.remetente}:</Text>
        <Text style={styles.message}>{item.msg}</Text>
        <Text style={styles.timestamp}>{moment(item.dataHoraMsg).format('HH:mm')}</Text>
      </View>
    );
  };

  const renderUsuarioItem = ({ item }) => (
    <TouchableOpacity onPress={() => { setModalVisible(false); setChatMode(item.identificador); }}>
      <View style={styles.userContainer}>
        <Text style={styles.userText}>{item.identificador === identificadorUsuario ? `${item.usuario} (você)` : item.usuario}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.chatModeContainer}>
        {chatMode !== 'geral' && (
          <Text style={styles.chatModeText}>Conversando com: {usuarios.find(u => u.identificador === chatMode)?.usuario}</Text>
        )}
      </View>
      <FlatList
        ref={flatListRef}
        data={mensagens}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
        style={styles.messageList}
      />
      <TextInput
        style={styles.input}
        placeholder="Mensagem"
        value={mensagem}
        onChangeText={setMensagem}
      />
      <Button title="Enviar" onPress={handleSend} />

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
              data={usuarios}
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

export default ChatScreen;
