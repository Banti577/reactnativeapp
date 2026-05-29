type Listener = (invite: any | null) => void;
type ActiveCallListener = (call: any | null) => void;

let incomingInvite: any | null = null;
let activeCall: any | null = null;
const listeners = new Set<Listener>();
const activeCallListeners = new Set<ActiveCallListener>();

export const setStoredIncomingInvite = (invite: any | null) => {
  incomingInvite = invite;
  listeners.forEach(listener => listener(incomingInvite));
};

export const getStoredIncomingInvite = () => incomingInvite;

export const setStoredActiveCall = (call: any | null) => {
  activeCall = call;
  activeCallListeners.forEach(listener => listener(activeCall));
};

export const getStoredActiveCall = () => activeCall;

export const subscribeToIncomingInvite = (listener: Listener) => {
  listeners.add(listener);
  listener(incomingInvite);

  return () => {
    listeners.delete(listener);
  };
};

export const subscribeToActiveCall = (listener: ActiveCallListener) => {
  activeCallListeners.add(listener);
  listener(activeCall);

  return () => {
    activeCallListeners.delete(listener);
  };
};
