import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Alert, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import LoginScreen from '../screens/LoginScreen';
import ChatScreen from '../screens/ChatScreen';
import HomeScreen from '../screens/HomeScreen';
import ConfigScreen from '../screens/ConfigScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const encerrarChat = async (serverUrl, identificadorUsuario, navigation) => {
    try {
      await axios.post(`${serverUrl}/encerraChat`, { identificadorUsuario });
      Alert.alert('Sucesso', 'Você foi desconectado.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      Alert.alert('Erro', 'Não foi possível desconectar.');
    }
  };

  const limparConversas = async (serverUrl, identificadorUsuario) => {
    try {
      await axios.post(`${serverUrl}/limparConversas`, { identificadorUsuario });
      Alert.alert('Sucesso', 'Seu chat foi limpo.');
    } catch (error) {
      console.error('Erro ao limpar as mensagens:', error);
      Alert.alert('Erro', 'Não foi possível limpar as mensagens.');
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
        />
        <Stack.Screen 
          name="Config" 
          component={ConfigScreen} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={({ route, navigation }) => ({
            title: 'Chat',
            headerRight: () => (
              <View style={{ flexDirection: 'row', marginRight: 10 }}>
                <TouchableOpacity onPress={() => limparConversas(route.params.serverUrl, route.params.identificadorUsuario)} style={{ marginRight: 10 }}>
                  <Icon name="trash" size={25} color="#FFA500" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => encerrarChat(route.params.serverUrl, route.params.identificadorUsuario, navigation)}>
                  <Icon name="power-off" size={25} color="#FF0000" />
                </TouchableOpacity>
              </View>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
