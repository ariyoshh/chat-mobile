import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import moment from 'moment';

const ChatScreen = ({ route }) => {
  const { identificadorUsuario, serverUrl } = route.params;
  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const flatListRef = useRef();

  useEffect(() => {
    const fetchMensagens = async () => {
      try {
        const response = await axios.get(`${serverUrl}/consultaMensagens`, { params: { identificadorUsuario } });
        setMensagens(response.data.reverse()); // Inverter a ordem das mensagens para exibir da mais antiga para a mais recente
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      }
    };

    fetchMensagens();
    const intervalId = setInterval(fetchMensagens, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(intervalId); // Limpar intervalo ao desmontar
  }, []);

  const handleSend = async () => {
    if (mensagem.trim() === '') {
      return; // Não enviar mensagens vazias
    }

    try {
      await axios.post(`${serverUrl}/msgAll`, { identificadorUsuario, msg: mensagem });
      setMensagem('');
      const response = await axios.get(`${serverUrl}/consultaMensagens`, { params: { identificadorUsuario } });
      setMensagens(response.data.reverse()); // Inverter a ordem das mensagens para exibir da mais antiga para a mais recente
      flatListRef.current.scrollToEnd({ animated: true }); // Rolar para a mensagem mais recente
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const renderItem = ({ item }) => {
    const isCurrentUser = item.identificadorUsuarioRemetente === identificadorUsuario;
    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
        <Text style={styles.sender}>{item.remetente}:</Text>
        <Text style={styles.message}>{item.msg}</Text>
        <Text style={styles.timestamp}>{moment(item.dataHoraMsg).format('HH:mm')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={mensagens}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
});

export default ChatScreen;
