import axios from 'axios';

import {
    PermissionsAndroid,
    Platform,
} from 'react-native';

import {
    Voice,
} from '@twilio/voice-react-native-sdk';

const BACKEND_URL =
    'http://192.168.4.200:3000';

export const voice = new Voice();

let voiceToken = null;


// AUDIO PERMISSION
async function requestAudioPermission() {

    if (Platform.OS !== 'android') {
        return true;
    }

    const granted =
        await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

    return (
        granted ===
        PermissionsAndroid.RESULTS.GRANTED
    );
}


// REGISTER VOICE
export async function registerVoice(
    identity
) {
    try {

        const hasPermission =
            await requestAudioPermission();

        if (!hasPermission) {
            throw new Error(
                'Microphone permission denied'
            );
        }

        const res = await axios.get(
            `${BACKEND_URL}/voice/token`,
            {
                params: {
                    identity,
                },
            }
        );

        voiceToken = res.data.token;

        await Voice.register(voiceToken);

        console.log(
            'VOICE REGISTERED'
        );

    } catch (err) {

        console.log(
            'VOICE REGISTER ERROR'
        );

        console.log(err);
    }
}


// MAKE CALL
export async function makeVoiceCall(
    phoneNumber
) {
    try {

        if (!voiceToken) {
            throw new Error(
                'Voice token missing'
            );
        }

        const call =
            await voice.connect(
                voiceToken,
                {
                    params: {
                        To: phoneNumber,
                    },
                }
            );
        console.log(
            'VOICE CALL STARTED'
        );

        return call;

    } catch (err) {

        console.log(
            'VOICE CALL ERROR'
        );

        console.log(err);
    }
}