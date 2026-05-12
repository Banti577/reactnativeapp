import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

function Footer() {
    const menu = [
        { name: "Home", icon: "home" },
        { name: "Series", icon: "tv" },
        { name: "N", icon: "play-circle-filled" },
        { name: "Movies", icon: "movie" },
        { name: "Settings", icon: "settings" },
    ];

    return (
        <View style={styles.container}>
            {menu.map((item, index) => (
                <TouchableOpacity key={index} style={styles.menuItem}>
                    <Icon name={item.icon} size={26} color="#fff" />
                    <Text style={styles.menuText}>{item.name}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default Footer;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'black',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    menuItem: {
        alignItems: 'center',
    },
    menuText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    }
});