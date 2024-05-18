import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import axios from 'axios';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ route, navigation }) => {
  const { identificadorUsuario, serverUrl } = route.params;
  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [chatMode, setChatMode] = useState('geral'); // 'geral' ou identificador do usuário
  const [unreadMessages, setUnreadMessages] = useState([]);
  const flatListRef = useRef();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginRight: 10 }}>
            <Ionicons name="people" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
            <Ionicons name="log-out" size={24} color="black" />
          </TouchableOpacity>
          {unreadMessages.length > 0 && (
            <TouchableOpacity style={{ marginRight: 10 }} onPress={handleShowUnread}>
              <Ionicons name="notifications" size={24} color="red" />
              <Text style={styles.unreadCount}>{unreadMessages.length}</Text>
            </TouchableOpacity>
          )}
        </View>
      ),
    });

    const fetchMensagens = async () => {
      try {
        const response = await axios.get(`${serverUrl}/consultaMensagens`, { params: { identificadorUsuario } });
        const mensagens = response.data;
        setMensagens(mensagens.reverse()); // Inverter a ordem das mensagens para exibir da mais antiga para a mais recente

        const unread = mensagens.filter(m => m.identificadorUsuarioDestinatario === identificadorUsuario && !m.lida);
        setUnreadMessages(unread);
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      }
    };

    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(`${serverUrl}/consultaUsuarios`);
        setUsuarios(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchMensagens();
    fetchUsuarios();
    const intervalId = setInterval(() => {
      fetchMensagens();
      fetchUsuarios();
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(intervalId); // Limpar intervalo ao desmontar
  }, [identificadorUsuario, serverUrl, navigation]);

  useEffect(() => {
    const fetchMensagens = async () => {
      try {
        const response = await axios.get(`${serverUrl}/consultaMensagens`, { params: { identificadorUsuario } });
        const mensagens = response.data;
        setMensagens(mensagens.reverse()); // Inverter a ordem das mensagens para exibir da mais antiga para a mais recente

        const unread = mensagens.filter(m => m.identificadorUsuarioDestinatario === identificadorUsuario && !m.lida);
        setUnreadMessages(unread);
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      }
    };

    fetchMensagens();
  }, [chatMode]);

  const handleSend = async () => {
    if (mensagem.trim() === '') {
      return; // Não enviar mensagens vazias
    }

    try {
      const endpoint = chatMode === 'geral' ? `${serverUrl}/msgAll` : `${serverUrl}/msg`;
      const body = { identificadorUsuario, msg: mensagem };
      if (chatMode !== 'geral') {
        body.identificadorUsuarioDestino = chatMode;
      }
      await axios.post(endpoint, body);
      setMensagem('');
      const response = await axios.get(`${serverUrl}/consultaMensagens`, { params: { identificadorUsuario } });
      const mensagens = response.data;
      setMensagens(mensagens.reverse()); // Inverter a ordem das mensagens para exibir da mais antiga para a mais recente

      const unread = mensagens.filter(m => m.identificadorUsuarioDestinatario === identificadorUsuario && !m.lida);
      setUnreadMessages(unread);
      flatListRef.current.scrollToEnd({ animated: true }); // Rolar para a mensagem mais recente
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

  const handleShowUnread = () => {
    Alert.alert('Mensagens Não Lidas', `Você tem ${unreadMessages.length} mensagens não lidas.`);
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

  const renderGeralItem = () => (
    <TouchableOpacity onPress={() => { setModalVisible(false); setChatMode('geral'); }}>
      <View style={styles.userContainer}>
        <Text style={styles.userText}>Chat Geral</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.chatModeContainer}>
        <Button title="Chat Geral" onPress={() => setChatMode('geral')} />
        {chatMode !== 'geral' && (
          <Text style={styles.chatModeText}>Conversando com: {usuarios.find(u => u.identificador === chatMode)?.usuario}</Text>
        )}
      </View>
      <FlatList
        ref={flatListRef}
        data={chatMode === 'geral' ? mensagens.filter(m => !m.identificadorUsuarioDestinatario) : mensagens.filter(m => (
          (m.identificadorUsuarioRemetente === chatMode && m.identificadorUsuarioDestinatario === identificadorUsuario) ||
          (m.identificadorUsuarioRemetente === identificadorUsuario && m.identificadorUsuarioDestinatario === chatMode)
        ))}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })} // Rolar para a mensagem mais recente quando o conteúdo mudar
        onLayout={() => flatListRef.current.scrollToEnd({ animated: true })} // Rolar para a mensagem mais recente quando o layout mudar
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
        <View style={styles.modalView}>
          <FlatList
            data={[{ identificador: 'geral', usuario: 'Chat Geral' }, ...usuarios]}
            renderItem={({ item }) => item.identificador === 'geral' ? renderGeralItem() : renderUsuarioItem({ item })}
            keyExtractor={item => item.identificador}
            style={styles.userList}
          />
          <Button title="Fechar" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  chatModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatModeText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  messageList: {
    flex: 1,
    marginBottom: 20,
  },
  messageContainer: {
    flexDirection: 'column',
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  currentUserMessage: {
    backgroundColor: '#DCF8C6', // Verde
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    backgroundColor: '#ADD8E6', // Azul
    alignSelf: 'flex-start',
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
    alignSelf: 'flex-end',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  userText: {
    fontSize: 18,
  },
  userList: {
    width: '100%',
  },
  unreadCount: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'red',
    color: 'white',
    borderRadius: 10,
    padding: 2,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ChatScreen;
