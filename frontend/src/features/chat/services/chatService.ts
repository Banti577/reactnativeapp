import { Client } from '@twilio/conversations';

const BACKEND_URL = 'http://192.168.4.199:3000';

// Timeout constants — change in one place
const INIT_TIMEOUT_MS = 15_000;
const SYNC_TIMEOUT_MS = 20_000;
const SYNC_RETRY_DELAY = 1_000;
const SYNC_MAX_RETRIES = 10;

// Max file size: 150MB (Twilio MCS limit)
const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024;

type TwilioClient = InstanceType<typeof Client>;
type Conversation = any;
type ChatMessage = any;
type UploadFile = {
    uri: string;
    name: string;
    type: string;
    size?: number;
};
type UploadProgressCallback = (percent: number) => void;

let twilioClient: TwilioClient | null = null;

const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
};

/**
 * Returns a promise that rejects after `ms` milliseconds.
 */
function timeout(ms: number, label = 'Operation'): Promise<never> {
    return new Promise((_, reject) =>
        setTimeout(
            () => reject(new Error(`${label} timed out after ${ms}ms`)),
            ms
        )
    );
}

function waitForEvent(
    emitter: any,
    event: string,
    ms: number,
    label: string,
) {
    return Promise.race([
        new Promise(resolve => emitter.once(event, resolve)),
        timeout(ms, label),
    ]);
}


export async function initChat(
    identity: string,
    fcmToken?: string,
): Promise<TwilioClient> {

    // Cleanup any existing client first
    await shutdownChat();

    console.log('INIT CHAT:', identity);

    try {

        const res = await fetch(
            `${BACKEND_URL}/voice/token?identity=${encodeURIComponent(identity)}`
        );

        if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error || `Token fetch failed: ${res.status}`);
        }

        const { token } = await res.json() as { token: string };

        // ─────────────────────────
        // CREATE CLIENT
        // ─────────────────────────
        twilioClient = new Client(token);


        // ─────────────────────────
        // WAIT FOR INITIALIZED
        // ─────────────────────────
        await Promise.race([
            new Promise<void>((resolve, reject) => {
                twilioClient?.once('initialized', () => resolve());
                twilioClient?.once('initFailed', ({ error }: { error?: unknown }) =>
                    reject(error || new Error('Twilio init failed'))
                );
            }),
            timeout(INIT_TIMEOUT_MS, 'Twilio init'),
        ]);

        console.log('TWILIO INITIALIZED');

        if (fcmToken) {

            try {

                await twilioClient.setPushRegistrationId(
                    'fcm',
                    fcmToken
                );

                console.log('Push registered');

            } catch (err) {

                console.log('Push registration failed', err);
            }
        }

        // ─────────────────────────
        // WAIT FOR CONNECTION
        // ─────────────────────────
        if (twilioClient.connectionState !== 'connected') {
            await waitForEvent(
                twilioClient,
                'connectionStateChanged',
                INIT_TIMEOUT_MS,
                'Twilio connection'
            );
        }

        console.log('CHAT READY:', identity);

        console.log('CHAT READY:', identity);

        return twilioClient;

    } catch (err) {
        await shutdownChat();
        console.log('this is full err', err)
        console.log('INIT CHAT ERROR:', getErrorMessage(err, 'Init chat failed'));
        throw err;
    }
}


export async function getConversation(user1: string, user2: string): Promise<Conversation> {

    if (!twilioClient) {
        throw new Error('Call initChat() first');
    }

    const uniqueName = [user1, user2].sort().join('__');
    console.log('UNIQUE NAME:', uniqueName);


    const res = await fetch(`${BACKEND_URL}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1, user2 }),
    });

    const raw = await res.text();
    console.log('BACKEND RESPONSE:', raw);

    if (!res.ok) throw new Error(raw);

    const { conversationSid } = JSON.parse(raw);


    const convo = await Promise.race([

        // Path 1: SDK fires the event — instant
        new Promise(resolve => {
            function onJoined(c: Conversation) {
                if (c.sid === conversationSid) {
                    twilioClient?.off('conversationJoined', onJoined);
                    console.log('SYNCED via event:', c.sid);
                    resolve(c);
                }
            }
            twilioClient?.on('conversationJoined', onJoined);
        }),

        // Path 2: Polling fallback (rare — SDK already joined before listener)
        (async () => {
            for (let i = 0; i < SYNC_MAX_RETRIES; i++) {
                await new Promise(r => setTimeout(r, SYNC_RETRY_DELAY));
                try {
                    const c = await twilioClient.getConversationBySid(conversationSid);
                    console.log(`SYNCED via poll (attempt ${i + 1}):`, c.sid);
                    return c;
                } catch {
                    console.log(`POLL ${i + 1}/${SYNC_MAX_RETRIES} — not yet synced`);
                }
            }
            throw new Error('Conversation sync failed after retries');
        })(),

        timeout(SYNC_TIMEOUT_MS, 'Conversation sync'),
    ]);

    return convo;
}


// SEND TEXT MESSAGE

export async function sendMessage(conversation: Conversation, text: string): Promise<void> {

    if (!conversation) throw new Error('Conversation missing');

    const trimmed = text?.trim();
    if (!trimmed) return;

    await conversation.sendMessage(trimmed);
}



//SENDING DOC AND FILE
export async function sendFile(
    conversation: Conversation,
    file: UploadFile,
    onProgress?: UploadProgressCallback,
): Promise<number> {

    if (!conversation) throw new Error('Conversation missing');

    if (!file?.uri || !file?.name || !file?.type) {
        throw new Error('file must have uri, name, and type');
    }

    if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(
            `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max is 150MB.`
        );
    }

    console.log('SENDING FILE:', file.name, file.type);

    // ─────────────────────────
    // BUILD FormData
    // Twilio SDK accepts FormData for media messages
    // ─────────────────────────
    const formData = new FormData();

    formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
    });

    // ─────────────────────────
    // SEND WITH OPTIONAL PROGRESS
    // ─────────────────────────
    const messageIndex = await conversation.sendMessage(formData, {
        contentType: file.type,

        onProgress: onProgress
            ? (bytes: number, total: number) => {
                if (total > 0) {
                    onProgress(Math.round((bytes / total) * 100));
                }
            }
            : undefined,
    });

    console.log('FILE SENT, index:', messageIndex);

    return messageIndex;
}


// DELETE MESSAGE

export async function deleteMessage(
    conversation: Conversation,
    message: ChatMessage,
): Promise<void> {

    if (!conversation) throw new Error('Conversation missing');
    if (!message) throw new Error('Message missing');

    await message.remove();

    console.log(' MESSAGE DELETED, index:', message.index);
}

export async function deleteMessageByIndex(
    conversation: Conversation,
    messageIndex: number,
): Promise<void> {

    if (!conversation) throw new Error('Conversation missing');

    const paginator = await conversation.getMessages();

    const message = paginator.items.find((m: ChatMessage) => m.index === messageIndex);

    if (!message) {
        throw new Error(`Message with index ${messageIndex} not found`);
    }

    await deleteMessage(conversation, message);
}


export async function getMessages(conversation: Conversation, pageSize = 30) {

    if (!conversation) throw new Error('Conversation missing');

    return conversation.getMessages(pageSize);
}

// ─────────────────────────────────────────────
// SHUTDOWN CHAT
// ─────────────────────────────────────────────
export async function shutdownChat(): Promise<void> {

    if (!twilioClient) return;

    try {
        await twilioClient.shutdown();
        console.log('CHAT SHUTDOWN');
    } catch (err) {
        console.log('SHUTDOWN ERROR:', getErrorMessage(err, 'Shutdown failed'));
    } finally {
        twilioClient = null;
    }
}


// ─────────────────────────────────────────────
// GET ALL CONVERSATIONS
// ─────────────────────────────────────────────
export async function getAllConversations(): Promise<Conversation[]> {

    if (!twilioClient) {
        throw new Error('Call initChat() first');
    }

    try {

        const paginator =
            await twilioClient.getSubscribedConversations();

        console.log(
            'ALL CONVERSATIONS:',
            paginator.items.length
        );

        return paginator.items;

    } catch (err) {

        console.log(
            'GET CONVERSATIONS ERROR:',
            err
        );

        throw err;
    }
}
