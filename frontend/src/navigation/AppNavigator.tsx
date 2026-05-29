import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";


import { NavigationContainer } from '@react-navigation/native';

import auth from '@react-native-firebase/auth';

import { setUser, clearUser } from '../../redux/slices/authSlice';

import AuthNavigator from "./authNavigator";
import MainNavigator from "./MainNavigator";
import { flushPendingNavigation, navigationRef } from './navigationService';



export default function AppNavigator() {

    const dispatch = useDispatch();


    const user =
        useSelector(
            (store: any) => store.auth.user
        );


    useEffect(() => {

        const unsubscribe =
            auth().onAuthStateChanged(
                async firebaseUser => {

                    if (firebaseUser) {

                        const token =
                            await firebaseUser.getIdToken();

                        dispatch(setUser({

                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: firebaseUser.displayName,
                            token,

                        }));

                    } else {

                        dispatch(clearUser());
                    }
                });

        return unsubscribe;

    }, [dispatch]);

    return (

        <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}>

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
