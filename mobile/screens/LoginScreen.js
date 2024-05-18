import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const LoginScreen = ({ navigation }) => {
  const [usuario, setUsuario] = useState('');
  const serverUrl = 'http://192.168.15.13:3000'; 

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${serverUrl}/iniciaChat`, { usuario });
      const { identificador } = response.data;
      navigation.navigate('Chat', { identificadorUsuario: identificador, serverUrl });
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default LoginScreen;
