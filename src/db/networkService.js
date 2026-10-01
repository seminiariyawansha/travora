// db/networkService.js
import NetInfo from "@react-native-community/netinfo";

export function subscribeToConnectivity(onChange) {
  const unsubscribe = NetInfo.addEventListener((state) => {
    onChange(!!state.isConnected);
  });
  return unsubscribe;
}

export async function isOnlineNow() {
  const state = await NetInfo.fetch();
  return !!state.isConnected;
}
