import { View, Text, Image, StyleSheet, ScrollView } from "react-native";

function OttApps() {
    const commingSoonOTTApps = [
        { name: 'netflix', icon: 'https://images.ctfassets.net/4cd45et68cgf/Rx83JoRDMkYNlMC9MKzcB/2b14d5a59fc3937afd3f03191e19502d/Netflix-Symbol.png?w=700&h=456' },
        { name: 'prime video', icon: 'https://cdn2.steamgriddb.com/icon/a0b39ebccc9fd36dab289696b78dd758/32/256x256.png' },
        { name: 'Disnep+', icon: 'https://m.media-amazon.com/images/I/41F9mjnTWpL._SL1080_.jpg' },
        { name: 'jio hotstar', icon: 'https://images.goodreturns.in/img/2025/04/hotstardownload1-1744126282.jpg' }
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>More OTT Apps Coming Soon</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {commingSoonOTTApps.map((item) => (
                    <View key={item.name} style={styles.iconWrapper}>
                        <Image
                            source={{ uri: item.icon }}
                            style={styles.ottIcon}
                            resizeMode="contain"
                        />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: 'black',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#fff',
    },
    scrollContainer: {
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    iconWrapper: {
        margin: 8,
    },
    ottIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        objectFit: 'cover'


    }
});

export default OttApps;
