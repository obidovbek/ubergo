/**
 * Scrolling a long registration form to the field that is actually wrong.
 *
 * T-061 — the owner's report was *"malumotlarda hatolik bo'ldi deyapdi qaysi
 * qatordaligini ko'rsatmayapdi"*: the form says something is wrong and does not
 * show where. Naming the field in the toast (the API half of that card) only
 * half-answers it — on a form this long the offending input is usually several
 * screens away, so the app has to go there.
 *
 * Modelled on the user app's `UserDetailsScreen`, which already remembers each
 * field's y and scrolls to it on focus. This generalises that into something
 * the five driver registration screens can share, and adds the piece the user
 * app never needed: jump to the FIRST field that has an error.
 */

import { useCallback, useRef } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';

/** Leave room above the field so its label stays readable. */
const FIELD_SCROLL_MARGIN = 24;

export const useFieldScroll = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef<Record<string, number>>({});
  /**
   * `onLayout` reports y relative to the PARENT, not to the scroll content —
   * and on every one of these screens the fields sit inside a `<View
   * style={styles.form}>` below the header. Without this base, every scroll
   * would land short by the height of that header.
   *
   * ⚠️ One level of nesting is all this handles. If a field is ever wrapped in
   * a further container, register that container instead, or the offset is
   * wrong again — silently, since a scroll that goes to the wrong place still
   * looks like it worked.
   */
  const containerOffset = useRef(0);

  const rememberContainerOffset = useCallback((event: LayoutChangeEvent) => {
    containerOffset.current = event.nativeEvent.layout.y;
  }, []);

  const rememberFieldOffset = useCallback(
    (key: string) => (event: LayoutChangeEvent) => {
      fieldOffsets.current[key] = event.nativeEvent.layout.y;
    },
    []
  );

  const scrollToOffset = useCallback((offset: number) => {
    scrollViewRef.current?.scrollTo({
      y: Math.max(containerOffset.current + offset - FIELD_SCROLL_MARGIN, 0),
      animated: true,
    });
  }, []);

  const scrollToField = useCallback(
    (key: string) => () => {
      const offset = fieldOffsets.current[key];
      if (offset === undefined) {
        return;
      }
      scrollToOffset(offset);
    },
    [scrollToOffset]
  );

  /**
   * Scroll to the topmost field carrying an error.
   *
   * "Topmost" is decided by the recorded offsets, not by a hand-kept list of
   * field names — so a screen can reorder or rename its inputs and this keeps
   * working. A field whose offset was never recorded (never laid out, e.g.
   * inside a collapsed section) is skipped rather than guessed at.
   */
  const scrollToFirstError = useCallback(
    (errors: Record<string, string | undefined>) => {
      let target: number | undefined;

      Object.keys(errors).forEach((key) => {
        if (!errors[key]) {
          return;
        }
        const offset = fieldOffsets.current[key];
        if (offset === undefined) {
          return;
        }
        if (target === undefined || offset < target) {
          target = offset;
        }
      });

      if (target === undefined) {
        return;
      }
      scrollToOffset(target);
    },
    [scrollToOffset]
  );

  return {
    scrollViewRef,
    rememberContainerOffset,
    rememberFieldOffset,
    scrollToField,
    scrollToFirstError,
  };
};
