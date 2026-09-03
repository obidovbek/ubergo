/**
 * BottomSheet — the artboards' sheet shell. T-101 step 8e.
 *
 * Every sheet in the design is the same frame: scrim, `maxHeight: 78%`, 26px top
 * corners, a grabber, then a header of back · title + crumb · close. Extracted from
 * `GeoSheet`, which had it inline, when the time picker became the second screen to
 * need it (owner, 2026-09-01: *"calender appears from bottom like county/city/..."*).
 *
 * 🔴 THE SAFE-AREA PADDING IS LOAD-BEARING, NOT COSMETIC — and it is the real reason
 * this is a shared component rather than copied markup. The system navigation bar sits
 * OVER the sheet; without the inset the last row is half-hidden behind the home/back
 * buttons. Reported on an S24 Ultra, where that bar is ~48px.
 *
 * `Modal` renders outside the app's SafeAreaProvider layout, so the inset has to be
 * applied here by hand — nothing upstream does it. A fixed padding cannot work: the bar
 * is 0 on some devices, ~24px with gestures and ~48px with three-button navigation.
 * **A second hand-rolled sheet would have re-introduced that bug**, which is exactly
 * what happened to the geo cascade seven times before `GeoSheet` existed.
 */

import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../themes";

interface BottomSheetProps {
  visible: boolean;
  title: string;
  /** The mono sub-line under the title, e.g. "1/4 · Viloyat tanlang". */
  crumb?: string;
  /** Omit to hide the back button — a sheet with only one step has nowhere to go. */
  onBack?: () => void;
  onClose: () => void;
  children: React.ReactNode;
  /** Applied to the content area below the header. */
  contentStyle?: StyleProp<ViewStyle>;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  title,
  crumb,
  onBack,
  onClose,
  children,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityLabel="Yopish"
        />

        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 8) }]}
        >
          <View style={styles.grabber} />

          <View style={styles.header}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Ortga"
              >
                <Text style={styles.headerBack}>‹</Text>
              </Pressable>
            ) : (
              // Keeps the title optically centred when there is no back button, which
              // is what the artboards' `1fr auto 1fr` header does.
              <View style={styles.headerButtonSpacer} />
            )}

            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {!!crumb && (
                <Text style={styles.crumb} numberOfLines={1}>
                  {crumb}
                </Text>
              )}
            </View>

            <Pressable
              onPress={onClose}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Yopish"
            >
              <Text style={styles.headerClose}>✕</Text>
            </Pressable>
          </View>

          <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.palette.scrim.sheet,
  },

  sheet: {
    maxHeight: "78%",
    backgroundColor: theme.palette.ground,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
  },
  grabber: {
    alignSelf: "center",
    width: theme.modal.grabber.width,
    height: theme.modal.grabber.height,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.modal.grabber.color,
    marginTop: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.palette.borders.chrome,
  },
  headerButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.borderRadius.control,
    backgroundColor: theme.palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.default,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonSpacer: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
  },
  headerBack: {
    ...theme.typography.cardTitle,
    color: theme.palette.text.primary,
  },
  headerClose: {
    ...theme.typography.cardTitle,
    color: theme.palette.text.primary,
  },
  headerText: { flex: 1, minWidth: 0, gap: 1 },
  title: { ...theme.typography.sheetTitle, color: theme.palette.text.primary },
  crumb: { ...theme.typography.monoTiny, color: theme.palette.text.tertiary },

  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 26 },
});

export default BottomSheet;
