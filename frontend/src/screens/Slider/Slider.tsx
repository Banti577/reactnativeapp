import { Image, View, StyleSheet, TouchableOpacity, Text } from "react-native";

import CustomButton from "../../components/CustomButton";

function Slider() {
    const genre = ['Action', 'Crime', 'Thriller']

    const handlePlayOnPress = () => {

    }
    return (

        <View style={styles.SliderParent}>
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: 'https://variety.com/wp-content/uploads/2026/03/Dhurandhar-2-poster.jpg?w=1000&h=667&crop=1&resize=681%2C454' }}
                    style={styles.image}
                />
                <View style={styles.genre}>
                    {genre.map((gen) => (
                        <TouchableOpacity key={gen}>
                            <Text style={styles.genreText} >{gen}</Text>
                        </TouchableOpacity>
                    ))}

                </View>

                <View style={styles.sliderMainButtonParent}>

                    < CustomButton

                        title="Play"
                        bgColor="#fff"
                        textColor="black"
                        onPress={handlePlayOnPress}
                         horizontalPadding={40}
                    />


                    < CustomButton
                        title="+ My List"
                        bgColor="black"
                        textColor="#fff"
                        onPress={handlePlayOnPress}
                        loading={false}
                        horizontalPadding={40}
                    />

                </View>
            </View>
        </View>

    )

}

export default Slider;

const styles = StyleSheet.create({
    SliderParent: {
        backgroundColor: 'rgba(106, 1, 1, 0.95)',
    },
    imageContainer: {
        display: 'flex',
        width: '90%',
        position: 'relative',
        height: 600,
        justifyContent: 'center',

        alignItems: 'center',
        alignSelf: 'center',

    },
    image: {
        width: '100%',
        height: '100%',

        borderWidth: 1,


    },

    genre: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 20,
        zIndex: 200,

    },
    genreText: {
        color: 'white',
        marginRight: 10,
        fontWeight: 'bold'

    }

    ,
    sliderMainButtonParent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignContent: 'center',
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        paddingHorizontal:10

    },
    Btn: {

        paddingTop: 20,
        paddingLeft: 40,
        paddingRight: 40,
        paddingBottom: 20,
        fontSize: 20,
        borderRadius: 15,
        cursor: 'pointer'


    },
    Playbtn: {
        backgroundColor: 'white',
        cursor: 'pointer'

    },
    ListBtn: {
        backgroundColor: 'black',
        color: 'white'
    }

})