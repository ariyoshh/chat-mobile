import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';
import styles from './styles';

const LoginScreen = ({ navigation }) => {
  const [usuario, setUsuario] = useState('');
  const serverUrl = 'http://192.168.15.20:3000'; //troca pro seu ip ai

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${serverUrl}/iniciaChat`, { usuario });
      const { identificador } = response.data;
      navigation.navigate('Home', { identificadorUsuario: identificador, serverUrl, usuario });
    } catch (error) {
      console.error('Erro ao tentar logar:', error);
      Alert.alert('Erro', 'Nome de usuário já está em uso ou ocorreu um erro ao tentar logar.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Usuário"
        value={usuario}
        onChangeText={setUsuario}
      />
      <Button title="Iniciar Chat" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
