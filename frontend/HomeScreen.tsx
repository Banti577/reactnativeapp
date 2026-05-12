import {
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';

import Header from './src/screens/header/Header';
import Slider from './src/screens/Slider/Slider';
import Footer from './src/screens/footer/footer';
import OttApps from './src/screens/commingSoon/OttApps';
import NewMoviesSlider from './src/screens/New-Movies/NewMovies';


function HomeScreen({ navigation }: any) {

  return (

    <View style={styles.container}>

      <Header navigation={navigation} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: 60,
        }}
      >

        <Slider />

        <OttApps />
        <NewMoviesSlider />

      </ScrollView>

      <Footer />

    </View>
  );
}
export default HomeScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  content: {
    flex: 1,
  },

});