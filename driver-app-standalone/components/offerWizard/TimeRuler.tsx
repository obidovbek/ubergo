/**
 * The departure-window ruler — T-101 step 16c-2.
 *
 * 192 fifteen-minute blocks (two days) that the driver drags across to say "I leave
 * between 08:00 and 11:00". The artboard's `trackDown`/`trackMove`/`trackUp`.
 *
 * 🔴 EVERY RULE IT OBEYS LIVES IN `utils/offerSchedule.ts`, NOT HERE. Which slot a
 * pointer is over, where a drag anchors, how the 24-hour cap is applied, what counts
 * as past — all of it is pure and asserted in `scripts/check-offer-schedule.mjs`.
 * This file owns pixels and gestures only.
 *
 * *That split is the point of the step: on the passenger side these same rules lived
 * inline among a form's state, and three of the four defects step 8f found were
 * invisible until they were pulled out where they could be executed.*
 *
 * ⚠️ `PanResponder`, not `Pressable`. The gesture is a drag across many children, so
 * the touch must be claimed by the track itself; per-block press handlers would each
 * see only their own tap and the drag would never form.
 */

import React, { useMemo, useRef } from 'react';
import {
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { theme, typography, borderRadius, space, sizes } from '../../themes';
import {
  SPAN_SLOTS,
  SLOTS_PER_DAY,
  clampSlot,
  dragAnchorFor,
  firstSelectableSlotToday,
  normalizeWindow,
  slotToLabel,
  type WindowSelection,
} from '../../utils/offerSchedule';

/** Block width in px. The artboard uses 22; the hit maths derives from this alone. */
const BLOCK_W = 22;

interface TimeRulerProps {
  window: WindowSelection;
  onChange: (next: WindowSelection) => void;
  /** Blocks before this are drawn as past and cannot be selected. */
  now: Date;
  /** True when the chosen day is today — only then does the past exist. */
  isToday: boolean;
  disabled?: boolean;
  nextDayLabel: string;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({
  window,
  onChange,
  now,
  isToday,
  disabled = false,
  nextDayLabel,
}) => {
  // Refs, not state: these change on every pointer frame and must not re-render.
  const trackX = useRef(0);
  const scrollX = useRef(0);
  const anchor = useRef(0);
  const live = useRef<WindowSelection>(window);

  const minSlot = isToday ? firstSelectableSlotToday(now) : 0;

  /** A page X coordinate -> a slot index, accounting for the scroll offset. */
  const slotAt = (pageX: number) =>
    clampSlot(Math.floor((pageX - trackX.current + scrollX.current) / BLOCK_W));

  /** Nothing before `minSlot` on day one is selectable; day two is always free. */
  const legal = (slot: number) => (slot < SLOTS_PER_DAY ? Math.max(slot, minSlot) : slot);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (e) => {
          const slot = legal(slotAt(e.nativeEvent.pageX));
          // Grabbing near an edge MOVES that edge instead of starting a new window.
          anchor.current = dragAnchorFor(slot, live.current);
          const next = normalizeWindow(anchor.current, slot);
          live.current = next;
          onChange(next);
        },
        onPanResponderMove: (e) => {
          const slot = legal(slotAt(e.nativeEvent.pageX));
          const next = normalizeWindow(anchor.current, slot);
          live.current = next;
          onChange(next);
        },
      }),
    // `onChange` and `disabled` are the only things the handlers close over that can
    // change; the rest are refs precisely so the responder need not be rebuilt.
    [disabled, onChange, minSlot],
  );

  live.current = window;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    e.target.measure?.((_x, _y, _w, _h, pageX) => {
      trackX.current = pageX;
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={styles.readout}>
          {slotToLabel(window.start)} – {slotToLabel(window.end)}
        </Text>
        {window.end >= SLOTS_PER_DAY && (
          <Text style={styles.nextDay}>{nextDayLabel}</Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!disabled}
        onScroll={(e) => {
          scrollX.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={styles.track}
      >
        <View
          style={styles.blocks}
          onLayout={onTrackLayout}
          {...responder.panHandlers}
        >
          {Array.from({ length: SPAN_SLOTS }, (_, i) => {
            const inRange = i >= window.start && i <= window.end;
            const past = i < SLOTS_PER_DAY && i < minSlot;
            return (
              <View
                key={i}
                style={[
                  styles.block,
                  past && styles.blockPast,
                  inRange && !past && styles.blockOn,
                  // Every full hour gets a taller tick, or 192 identical boxes read as
                  // one grey stripe and the driver cannot tell 08:00 from 14:00.
                  i % 4 === 0 && styles.blockHour,
                ]}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.scale}>
        {Array.from({ length: 8 }, (_, i) => (
          <Text key={i} style={styles.scaleLabel}>
            {slotToLabel(i * 12)}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  headRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
  },
  readout: {
    ...typography.monoValue,
    color: theme.palette.text.primary,
  },
  nextDay: {
    ...typography.monoTiny,
    color: theme.palette.text.tertiary,
  },
  track: { paddingVertical: space.xs },
  blocks: { flexDirection: 'row', gap: 0 },
  block: {
    width: BLOCK_W,
    height: 34,
    borderWidth: sizes.borderHairline,
    borderColor: theme.palette.borders.emphasis,
    backgroundColor: theme.palette.surface,
  },
  blockHour: { height: 44 },
  blockOn: {
    backgroundColor: theme.palette.action,
    borderColor: theme.palette.action,
  },
  // Past blocks are a filled grey, not merely dimmed: "unavailable" has to survive
  // being next to a selected block, and opacity alone does not.
  blockPast: {
    backgroundColor: theme.palette.disabled,
    borderColor: theme.palette.borders.chrome,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: {
    ...typography.monoTiny,
    color: theme.palette.text.tertiary,
  },
  blockRadius: { borderRadius: borderRadius.xs },
});

export default TimeRuler;
