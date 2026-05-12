import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";


import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import auth from '@react-native-firebase/auth';

import { setUser, clearUser } from '../../redux/slices/authSlice';

import AuthNavigator from "./authNavigator";
import MainNavigator from "./MainNavigator";




const Stack = createNativeStackNavigator();

export default function AppNavigator() {

    const dispatch = useDispatch();


    const user =
        useSelector(
            (store: any) => store.auth.user
        );


    useEffect(() => {

        const unsubscribe =
            auth().onAuthStateChanged(
                async user => {

                    if (user) {

                        const token =
                            await user.getIdToken();

                        dispatch(setUser({

                            uid: user.uid,
                            email: user.email,
                            name: user.displayName,
                            token,

                        }));

                    } else {

                        dispatch(clearUser());
                    }
                });

        return unsubscribe;

    }, []);

    return (

        <NavigationContainer>

            {
                !user?.isAuthenticated ? (
                    <MainNavigator />
                ) : (
                    <AuthNavigator />
                )
            }

        </NavigationContainer>
    );
}