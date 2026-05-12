import Icon from 'react-native-vector-icons/MaterialIcons';


import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';


function SearchPage() {
    const navigation = useNavigation<any>();

    return (

        <SafeAreaView style={styles.container}>

            <View style={styles.cross}>

                <TouchableOpacity


                    onPress={() => {

                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        }

                    }}
                >
                    <Icon name="close" size={35} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputs} >
                <TextInput

                    placeholder='Search For a Show, movie, genre, etc.'
                    style={styles.input}
                />
                < View style={styles.searchicon}>
                    <Icon name="search" size={28} color="white" />

                </View>

            </View>

            <View style={styles.resultBox}>
                <Text style={styles.heading}>Top Searches</Text>

                <ScrollView>
                    <TouchableOpacity style={styles.clickParent}>


                        <View style={styles.imageParent}>

                            <Image
                                source={{ uri: 'https://variety.com/wp-content/uploads/2026/03/Dhurandhar-2-poster.jpg?w=1000&h=667&crop=1&resize=681%2C454' }}
                                style={styles.image}
                            />
                        </View>
                        <View style={styles.titleParent}>
                            <Text style={{ color: 'white', fontSize: 20, }}>Ustad Bhagat Singh</Text>
                            <Icon name="play" size={30} color="#fff" />

                        </View>


                    </TouchableOpacity>



                    <TouchableOpacity style={styles.clickParent}>


                        <View style={styles.imageParent}>

                            <Image
                                source={{ uri: 'https://variety.com/wp-content/uploads/2026/03/Dhurandhar-2-poster.jpg?w=1000&h=667&crop=1&resize=681%2C454' }}
                                style={styles.image}
                            />
                        </View>
                        <View style={styles.titleParent}>
                            <Text style={{ color: 'white', fontSize: 20, }}>Ustad Bhagat Singh</Text>
                            <Icon name="play" size={30} color="#fff" />

                        </View>


                    </TouchableOpacity>




                    <TouchableOpacity style={styles.clickParent}>


                        <View style={styles.imageParent}>

                            <Image
                                source={{ uri: 'https://variety.com/wp-content/uploads/2026/03/Dhurandhar-2-poster.jpg?w=1000&h=667&crop=1&resize=681%2C454' }}
                                style={styles.image}
                            />
                        </View>
                        <View style={styles.titleParent}>
                            <Text style={{ color: 'white', fontSize: 20, }}>Ustad Bhagat Singh</Text>
                            <Icon name="play" size={30} color="#fff" />

                        </View>


                    </TouchableOpacity>





                    <TouchableOpacity style={styles.clickParent}>


                        <View style={styles.imageParent}>

                            <Image
                                source={{ uri: 'https://variety.com/wp-content/uploads/2026/03/Dhurandhar-2-poster.jpg?w=1000&h=667&crop=1&resize=681%2C454' }}
                                style={styles.image}
                            />
                        </View>
                        <View style={styles.titleParent}>
                            <Text style={{ color: 'white', fontSize: 20, }}>Ustad Bhagat Singh</Text>
                            <Icon name="play" size={30} color="#fff" />

                        </View>


                    </TouchableOpacity>




                    <TouchableOpacity style={styles.clickParent}>


                        <View style={styles.imageParent}>

                            <Image
                                source={{ uri: 'https://variety.com/wp-content/uploads/2026/03/Dhurandhar-2-poster.jpg?w=1000&h=667&crop=1&resize=681%2C454' }}
                                style={styles.image}
                            />
                        </View>
                        <View style={styles.titleParent}>
                            <Text style={{ color: 'white', fontSize: 20, }}>Ustad Bhagat Singh</Text>
                            <Icon name="play" size={30} color="#fff" />

                        </View>


                    </TouchableOpacity>




                    <TouchableOpacity style={styles.clickParent}>


                        <View style={styles.imageParent}>

                            <Image
                                source={{ uri: 'https://variety.com/wp-content/uploads/2026/03/Dhurandhar-2-poster.jpg?w=1000&h=667&crop=1&resize=681%2C454' }}
                                style={styles.image}
                            />
                        </View>
                        <View style={styles.titleParent}>
                            <Text style={{ color: 'white', fontSize: 20, }}>Ustad Bhagat Singh</Text>
                            <Icon name="play" size={30} color="#fff" />

                        </View>


                    </TouchableOpacity>



                    <TouchableOpacity style={styles.clickParent}>


                        <View style={styles.imageParent}>

                            <Image
                                source={{ uri: 'https://variety.com/wp-content/uploads/2026/03/Dhurandhar-2-poster.jpg?w=1000&h=667&crop=1&resize=681%2C454' }}
                                style={styles.image}
                            />
                        </View>
                        <View style={styles.titleParent}>
                            <Text style={{ color: 'white', fontSize: 20, }}>Ustad Bhagat Singh</Text>
                            <Icon name="play-circle-filled" size={50} color="white" />

                        </View>


                    </TouchableOpacity>

                </ScrollView>
            </View>

        </SafeAreaView>
    )

}

export default SearchPage;

const styles = StyleSheet.create({
    Safecontainer: {
        flex: 1,
        backgroundColor: 'black',
        padding: 15,

    },
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 13,
        color: 'white'

    },
    cross: {

        marginBottom: 20,
        alignSelf: 'flex-end',
    },
    inputs: {
        position: 'relative'
    },
    input: {
        backgroundColor: '#28292a',
        paddingHorizontal: 15,
        color: '#fff',
        height: 65,
        boxShadow: 'shadow',
        fontSize: 20,
        paddingLeft: 40
    },
    searchicon: {
        position: 'absolute',
        top: 20,
        bottom: 0,
        left: 5,
        backgroundColor: '#292a2a'


    },
    resultBox: {
        paddingVertical: 10,
        flex: 1

    },
    heading: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    imageParent: {
        width: '40%'

    },
    image: {
        width: '100%',
        height: 100

    },
    titleParent: {
        color: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '60%'
    },
    clickParent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignContent: 'center',
        alignSelf: 'center',
        paddingTop: 10,

    }
})