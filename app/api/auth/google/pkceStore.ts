const verifierStore = new Map<string, string>();

export function setVerifier(state: string, verifier: string) {
    verifierStore.set(state, verifier);
    // auto-expire after 10 minutes
    setTimeout(() => verifierStore.delete(state), 10 * 60 * 1000);
}

export function getVerifier(state: string) {
    return verifierStore.get(state);
}

export function deleteVerifier(state: string) {
    verifierStore.delete(state);
}

export default verifierStore;
