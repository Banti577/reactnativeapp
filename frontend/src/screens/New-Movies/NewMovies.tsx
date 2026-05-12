import { View, Text, Image, StyleSheet, ScrollView } from "react-native";

import { useEffect, useState } from 'react';


function NewMoviesSlider() {

    const [movies, setMovies] = useState([]);

    const fetchMovies = async () => {
        try {
            const response = await fetch(
                "https://netflix54.p.rapidapi.com/season/episodes/?ids=80077209%2C80117715&offset=0&limit=25&lang=en",
                {
                    method: "GET",
                    headers: {
                        'x-rapidapi-key': 'edf0693351mshd354ae5a9952206p10eb5ejsn27fbcdeb3178',
                        'x-rapidapi-host': "netflix54.p.rapidapi.com",
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = await response.json();

            console.log('this is data', data);

            // save movies
            setMovies(data.movies || []);
        } catch (error) {
            console.log(error);
        }
    };


    useEffect(() => {
        fetchMovies();
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.title}>New On Netflix</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {/* {commingSoonOTTApps.map((item) => (
                          <View key={item.name} style={styles.iconWrapper}>
                              <Image
                                  source={{ uri: item.icon }}
                                  style={styles.ottIcon}
                                  resizeMode="contain"
                              />
                          </View>
                      ))} */}
            </ScrollView>
        </View>
    )

}

export default NewMoviesSlider;



const styles = StyleSheet.create({
    container: {
        padding: 20,

        paddingHorizontal: 20,
        backgroundColor: 'black',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#fff',
    },
    scrollContainer: {
        paddingHorizontal: 10,
        alignItems: 'center'
    },
    iconWrapper: {
        margin: 10,
    },
    ottIcon: {
        width: 100,
        height: 90,
        borderRadius: 20,
        objectFit: 'cover'


    }
});
