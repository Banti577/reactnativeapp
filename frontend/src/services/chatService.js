// services/chatService.js

import { Client } from '@twilio/conversations';

// Emulator:
// http://10.0.2.2:3000

// Real Device:
// http://192.168.x.x:3000

const BACKEND_URL = 'http://192.168.4.200:3000';

let twilioClient = null;

// ─────────────────────────────────────────────
// INIT CHAT
// ─────────────────────────────────────────────
export async function initChat(identity) {

    try {

        // IMPORTANT:
        // DO NOT shutdown old client
        // Twilio SDK RN me unstable ho jata hai

        twilioClient = null;

        console.log(
            'INIT CHAT:',
            JSON.stringify(identity)
        );

        const res = await fetch(
            `${BACKEND_URL}/voice/token?identity=${identity}`
        );

        if (!res.ok) {

            const err =
                await res.json()
                    .catch(() => ({}));

            throw new Error(
                err.error ||
                `Token fetch failed ${res.status}`
            );
        }

        const { token } =
            await res.json();

        // ─────────────────────────
        // CREATE CLIENT
        // ─────────────────────────
        twilioClient =
            new Client(token);

        // ─────────────────────────
        // WAIT FOR INIT
        // ─────────────────────────
        await new Promise(
            (resolve, reject) => {

                let done = false;

                twilioClient.on(
                    'initialized',
                    () => {

                        if (done) return;

                        done = true;

                        console.log(
                            'TWILIO INITIALIZED'
                        );

                        resolve();
                    }
                );

                twilioClient.on(
                    'initFailed',
                    ({ error }) => {

                        if (done) return;

                        done = true;

                        console.log(
                            'INIT FAILED',
                            error
                        );

                        reject(
                            error ||
                            new Error(
                                'Init failed'
                            )
                        );
                    }
                );
            }
        );

        // ─────────────────────────
        // WAIT FOR CONNECTION
        // ─────────────────────────
        await new Promise((resolve) => {

            if (
                twilioClient.connectionState ===
                'connected'
            ) {

                console.log(
                    'ALREADY CONNECTED'
                );

                resolve();

                return;
            }

            twilioClient.on(
                'connectionStateChanged',
                state => {

                    console.log(
                        'STATE:',
                        state
                    );

                    if (state === 'connected') {

                        console.log(
                            'NOW CONNECTED'
                        );

                        resolve();
                    }
                }
            );
        });

        // ─────────────────────────
        // EXTRA WAIT
        // ─────────────────────────
        await new Promise(r =>
            setTimeout(r, 5000)
        );

        // ─────────────────────────
        // DEBUG EVENTS
        // ─────────────────────────
        twilioClient.on(
            'conversationJoined',
            conversation => {

                console.log(
                    'JOINED:',
                    conversation.sid
                );
            }
        );

        console.log(
            'CONNECTION:',
            twilioClient.connectionState
        );

        console.log(
            '✅ CHAT READY:',
            identity
        );

        return twilioClient;

    } catch (err) {

        console.log(
            'INIT CHAT ERROR:',
            err.message
        );

        throw err;
    }
}

// ─────────────────────────────────────────────
// GET CONVERSATION
// ─────────────────────────────────────────────
export async function getConversation(
    user1,
    user2
) {

    try {

        if (!twilioClient) {

            throw new Error(
                'initChat first'
            );
        }

        const uniqueName =
            [user1, user2]
                .sort()
                .join('__');

        console.log(
            'UNIQUE:',
            uniqueName
        );

        // ─────────────────────────
        // CREATE/FETCH FROM BACKEND
        // ─────────────────────────
        const res = await fetch(
            `${BACKEND_URL}/conversation`,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json',
                },

                body: JSON.stringify({
                    user1,
                    user2,
                }),
            }
        );

        const raw =
            await res.text();

        console.log(
            'BACKEND:',
            raw
        );

        if (!res.ok) {

            throw new Error(raw);
        }

        const data =
            JSON.parse(raw);

        // ─────────────────────────
        // DEBUG SUBSCRIPTIONS
        // ─────────────────────────
        const subscribed =
            await twilioClient
                .getSubscribedConversations();

        console.log(
            'SUBSCRIBED:',
            subscribed.items.map(c => ({
                sid: c.sid,
                uniqueName:
                    c.uniqueName,
            }))
        );

        // ─────────────────────────
        // WAIT FOR PROPAGATION
        // ─────────────────────────
        await new Promise(r =>
            setTimeout(r, 15000)
        );

        let convo = null;

        // ─────────────────────────
        // RETRY LOOP
        // ─────────────────────────
        for (let i = 0; i < 20; i++) {

            try {

                console.log(
                    `RETRY ${i + 1}`
                );

                convo =
                    await twilioClient
                        .getConversationBySid(
                            data.conversationSid
                        );

                console.log(
                    '✅ SYNCED:',
                    convo.sid
                );

                break;

            } catch (err) {

                console.log(
                    '❌ FAILED:',
                    err.message
                );

                await new Promise(r =>
                    setTimeout(r, 2000)
                );
            }
        }

        if (!convo) {

            throw new Error(
                'Conversation sync timeout'
            );
        }

        return convo;

    } catch (err) {

        console.log(
            'GET CONVERSATION ERROR:',
            err.message
        );

        throw err;
    }
}

// ─────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────
export async function sendMessage(
    conversation,
    text
) {

    if (!conversation) {

        throw new Error(
            'Conversation missing'
        );
    }

    if (!text?.trim()) {
        return;
    }

    await conversation.sendMessage(
        text.trim()
    );
}

// ─────────────────────────────────────────────
// SHUTDOWN CHAT
// ─────────────────────────────────────────────
export async function shutdownChat() {

    try {

        twilioClient = null;

        console.log(
            '🔌 CHAT RESET'
        );

    } catch (err) {

        console.log(
            'SHUTDOWN ERROR:',
            err.message
        );
    }
}