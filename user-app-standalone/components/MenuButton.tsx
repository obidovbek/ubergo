/**
 * Menu Button
 *
 * Hamburger that jumps straight to the menu (the "Home" route, which renders
 * MenuScreen). The app has no drawer navigator and no shared header component —
 * each screen builds its own header — so this is the one piece that gets reused,
 * rather than repeating the same TouchableOpacity in every screen.
 *
 * Sits in the left slot of the SECONDARY screens, next to their back arrow.
 * Deliberately NOT used on screens where the user is mid-task (forms), because
 * navigating away would discard what they typed.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';

interface MenuButtonProps {
  /** Icon colour — screens differ, so the caller decides. Defaults to the usual header grey. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const MenuButton: React.FC<MenuButtonProps> = ({ color = '#111827', style }) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => navigation.navigate('Home')}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('menu.openMenu')}
    >
      <Ionicons name="menu" size={24} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Matches the backButton sizing the secondary screens already use, so the two
  // sit side by side without any per-screen tweaking.
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MenuButton;
