import { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TextInput, Platform, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const statusBarHeight = StatusBar.currentHeight 

const [loading, setLoading]= useState(true);
const [travel, setTravel]= useState("");

export default function App() {
  return (
    <View style={styles.container}>
      
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="#F1F1F1"  />

      <text style={styles.heading}>Roteirizando</text>

      <view style={styles.form}>

        <text style={styles.label}>Cidade Destino</text>
        <TextInput placeholder='Ex: São Paulo, SP' style={styles.input} />

        <text style={styles.label}>Tempo de estadia: <text style={styles.days}>10</text> dias</text>

        <Slider
          minimumValue={1}
          maximumValue={7}
          minimumTrackTintColor='#009688'
          maximumTrackTintColor='#000000'
        />
      </view>

      <Pressable style={styles.button}>
        <text style={styles.buttonText}>Gerar Roteiro</text>
        <MaterialIcons name="travel-explore" size={24} color="#fff" />
      </Pressable>

      <ScrollView contentContainerStyle={{paddingBottom: 24, marginTop: 4 }} style={styles.containerScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Roteiro da viagem 👇</Text>
          <Text>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium nemo asperiores veritatis iusto quae. Magnam ullam, ex consequatur numquam, nostrum deleniti pariatur, blanditiis in neque sequi nam exercitationem illo qui?
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    paddingTop: 20,
  },

  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingTop: Platform.OS === 'android' ? statusBarHeight : 54
  }, 

  form: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  label: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderRadius: 4,
    borderColor: '#94a3b8',
    padding: 8,
    fontSize: 16,
    marginBottom: 16,
  },

  days: {
    backgroundColor: '#f1f1f1',
  },

  button: {
    backgroundColor: '#ff5656',
    width: '90%',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },

  content: {
    backgroundColor: '#fff',
    padding: 16,
    width: '100%',
    marginTop: 16,
    borderRadius: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },

  containerScroll: {
    width: '90%',
    marginTop: 8,
  }
});
