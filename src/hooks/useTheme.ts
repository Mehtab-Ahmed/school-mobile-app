import { useColorScheme } from 'react-native';
import { Colors } from '../theme/colors';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  return { theme, isDark, scheme };
}
