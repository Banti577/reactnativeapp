import React, { useState } from 'react';

import auth from '@react-native-firebase/auth';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';

function Register({ navigation }: any) {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {

        if (!name || !email || !password) {

            Alert.alert(
                'Error',
                'Please fill all fields'
            );

            return;
        }

        if (password.length < 6) {

            Alert.alert(
                'Error',
                'Password must be at least 6 characters'
            );

            return;
        }

        try {

            const userCredential =
                await auth().createUserWithEmailAndPassword(
                    email,
                    password
                );

            await userCredential.user.updateProfile({
                displayName: name,
            });

            console.log(
                'Registered User:',
                userCredential.user
            );

            Alert.alert(
                'Success',
                'Registration Successful'
            );

            navigation.replace('Home');

        } catch (error: any) {

            console.log(error);

            Alert.alert(
                'Register Error',
                error.message
            );
        }
    };

    return (

        <View style={styles.container}>

            <Text style={styles.heading}>
                Register
            </Text>

            <TextInput
                placeholder="Enter Name"
                placeholderTextColor="#999"
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

            <TextInput
                placeholder="Enter Email"
                placeholderTextColor="#999"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />

            <TextInput
                placeholder="Enter Password"
                placeholderTextColor="#999"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
            >
                <Text style={styles.buttonText}>
                    Register
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.loginText}>
                    Already have an account? Login
                </Text>
            </TouchableOpacity>

        </View>
    );
}

export default Register;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        padding: 20,
    },

    heading: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 30,
    },

    input: {
        backgroundColor: '#1e1e1e',
        color: '#fff',
        height: 60,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 18,
    },

    button: {
        backgroundColor: 'red',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 20,
    },

    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },

    loginText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },

});