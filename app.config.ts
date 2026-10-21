import type { ConfigContext, ExpoConfig } from 'expo/config';

// Основна конфігурація — у app.json. Тут лише те, що залежить від змінних оточення.
export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins = [...(config.plugins ?? [])];

  // Без Firebase плагін Google Sign-In потрібен лише iOS: він реєструє iosUrlScheme —
  // iOS client ID «навиворіт». Без ID плагін падає під час збірки, а Android він
  // не потрібен, тож додаємо його, лише коли ID задано.
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (iosClientId) {
    const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return {
    ...config,
    name: config.name ?? 'Purrly',
    slug: config.slug ?? 'purrly',
    plugins,
  };
};
