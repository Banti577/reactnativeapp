import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';

import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../../../redux/slices/authSlice';
import CustomButton from '../../components/CustomButton';

function Header({ navigation }: any) {

    const dispatch = useDispatch();

    const menu = [
        'Tv Shows',
        'Movies',
        'Categories'
    ];

    const user =
        useSelector(
            (store: any) => store.auth.user
        );

    const handleLogout = async () => {

        try {

            await auth().signOut();

            dispatch(clearUser());

        } catch (error) {

            console.log('Logout Error', error);
        }
    }
    return (

        <View style={styles.container}>

            <View style={styles.topHeader}>

                <Text style={styles.logoText}>
                    NetMirror
                </Text>

                <View style={styles.rightSection}>

                    <TouchableOpacity
                        onPress={() =>


                            navigation.navigate('VoiceScreen')
                        }
                    >
                        <Icon
                            name="search"
                            size={28}
                            color="white"
                        />
                    </TouchableOpacity>

                    {

                        user.isAuthenticated ? (

                            <View style={styles.profileSection}>

                                <TouchableOpacity
                                    style={styles.profileCircle}
                                >

                                    <Text style={styles.profileText}>
                                        {user?.name?.charAt(0)}
                                    </Text>

                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleLogout}
                                >

                                    <Text style={styles.logoutText}>
                                        Logout
                                    </Text>

                                </TouchableOpacity>

                            </View>
                        ) : (

                            <View style={styles.authButtons}>

                                <CustomButton
                                    title="Login"
                                    onPress={() =>
                                        navigation.navigate('Login')
                                    }
                                />

                                <CustomButton
                                    title="Register"
                                    onPress={() =>
                                        navigation.navigate('Register')
                                    }
                                />

                            </View>
                        )
                    }

                </View>

            </View>


            <View style={styles.menuContainer}>

                {
                    menu.map((item, index) => (

                        <TouchableOpacity
                            key={index}
                            style={styles.menuButton}
                        >

                            <Text style={styles.menuText}>
                                {item}
                            </Text>

                        </TouchableOpacity>
                    ))
                }

            </View>

        </View>
    );
}

export default Header;

const styles = StyleSheet.create({

    container: {
        backgroundColor: '#000',
        paddingHorizontal: 15,
        paddingBottom: 15,

    },

    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

    },

    logoText: {
        color: 'red',
        fontSize: 30,
        fontWeight: 'bold',
    },

    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },

    authButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    authText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    profileCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'yellow',
        justifyContent: 'center',
        alignItems: 'center',
    },

    profileText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },

    menuContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },

    menuButton: {
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },

    menuText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    logoutText: {
        color: '#fff',
        fontWeight: '600',
    },

});