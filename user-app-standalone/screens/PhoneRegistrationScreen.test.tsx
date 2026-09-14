/**
 * T-118 step 11 — the passenger's login flow (CHECKLIST §2): phone → OTP, as far as a test
 * can go. The SMS autofill itself (OR-003) is a phone-only check and stays on the checklist;
 * what CAN be pinned is everything around it:
 *   ① an incomplete number is refused before any OTP is sent;
 *   ② a complete number sends the OTP for the E.164 phone over SMS and lands on the OTP
 *      screen — a REAL navigation, the OTP screen is registered in the harness;
 *   ③ on the OTP screen, continuing with fewer than 4 digits is refused; a pasted/autofilled
 *      4-digit code verifies at once for THAT phone with THAT code; a wrong code reports the
 *      remaining attempts and clears the boxes; typing a right code digit by digit verifies.
 *
 * Auth is the harness stub, signed OUT: `sendOtp` / `verifyOtp` are the `jest.fn()`s the
 * screens call. Countries come from a mocked API; Google sign-in is mocked away.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { getCountries, type CountryResponse } from '../api/countries';
import { renderScreen, type AuthValue } from '../test/render';
import uz from '../translations/uz';
import { showToast } from '../utils/toast';
import { OTPVerificationScreen } from './OTPVerificationScreen';
import { PhoneRegistrationScreen } from './PhoneRegistrationScreen';

jest.mock('../api/countries');
jest.mock('../utils/toast');
jest.mock('../services/GoogleSignInService', () => ({
  useGoogleSignIn: () => ({ signIn: async () => null, isReady: false }),
  GoogleSignInServiceNative: { signIn: async () => null },
}));

const UZBEKISTAN: CountryResponse = {
  id: 'uz',
  name: 'Ozbekiston',
  code: '+998',
  flag: null,
  local_length: 9,
  pattern: 'uz',
  sort_order: 1,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};
const PHONE = '+998901234567';

let sendOtp: jest.Mock<AuthValue['sendOtp']>;
let verifyOtp: jest.Mock<AuthValue['verifyOtp']>;

beforeEach(() => {
  jest.mocked(getCountries).mockResolvedValue([UZBEKISTAN]);
  sendOtp = jest.fn<AuthValue['sendOtp']>();
  sendOtp.mockResolvedValue({
    success: true,
    data: { sent: true, channel: 'sms', expiresInSec: 120, cooldownSec: 60 },
    message: 'Verification code sent via sms',
  });
  verifyOtp = jest.fn<AuthValue['verifyOtp']>();
  verifyOtp.mockResolvedValue(undefined);
});

const mount = async () => {
  await renderScreen(<PhoneRegistrationScreen />, {
    auth: { user: null, token: null, isAuthenticated: false, sendOtp, verifyOtp },
    screens: { OTPVerification: OTPVerificationScreen },
  });
  await waitFor(() => expect(getCountries).toHaveBeenCalledTimes(1));
  await screen.findByText(UZBEKISTAN.code);
};

/** Both screens carry a "Davom etish"; the one on top is the last in the tree. */
const pressContinue = () => {
  const all = screen.getAllByText(uz.common.continue);
  fireEvent.press(all[all.length - 1]);
};

/** The four OTP boxes — the only empty inputs once the OTP screen is on top. */
const otpBoxes = () => screen.getAllByDisplayValue('').slice(-4);

const goToOtp = async () => {
  fireEvent.changeText(screen.getByPlaceholderText(uz.phoneRegistration.phonePlaceholder), '901234567');
  pressContinue();
  await waitFor(() => expect(sendOtp).toHaveBeenCalledWith(PHONE, 'sms'));
  expect(await screen.findByText(uz.otpVerification.title)).toBeOnTheScreen();
  expect(otpBoxes()).toHaveLength(4);
};

describe('login: phone → OTP', () => {
  it('keeps "continue" disabled until the number is complete, so nothing is sent', async () => {
    await mount();
    // MEASURED: the button is `disabled` below the country's local length, so the screen's
    // "incomplete number" warning cannot be reached from the UI — the gate is the button.
    const button = screen.getByText(uz.common.continue);
    expect(button).toBeDisabled();
    fireEvent.changeText(screen.getByPlaceholderText(uz.phoneRegistration.phonePlaceholder), '90123');
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(sendOtp).not.toHaveBeenCalled();
    expect(screen.queryByText(uz.otpVerification.title)).not.toBeOnTheScreen();

    fireEvent.changeText(screen.getByPlaceholderText(uz.phoneRegistration.phonePlaceholder), '901234567');
    expect(button).toBeEnabled();
  });

  it('sends the OTP for the E.164 phone over SMS and opens the OTP screen', async () => {
    await mount();
    await goToOtp();
    expect(sendOtp).toHaveBeenCalledTimes(1);
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('refuses fewer than 4 digits, reports a wrong code and clears, then accepts a right one', async () => {
    await mount();
    await goToOtp();

    // Below four digits "continue" is DISABLED (measured — the incomplete-code warning is
    // unreachable from the UI): nothing is sent.
    const continues = screen.getAllByText(uz.common.continue);
    const otpContinue = continues[continues.length - 1];
    expect(otpContinue).toBeDisabled();
    fireEvent.changeText(otpBoxes()[0], '1');
    fireEvent.changeText(otpBoxes()[0], '2');
    expect(otpContinue).toBeDisabled();
    pressContinue();
    expect(verifyOtp).not.toHaveBeenCalled();

    // A 4-digit paste (the autofill path) verifies at once — and this one is wrong.
    verifyOtp.mockRejectedValueOnce(new Error('wrong code'));
    const firstBox = screen.getAllByDisplayValue('2')[0];
    fireEvent.changeText(firstBox, '1234');
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith(PHONE, '1234'));
    await waitFor(() =>
      expect(showToast.error).toHaveBeenCalledWith(uz.common.error, `${uz.otpVerification.errorIncorrect}2`),
    );
    // Still on the OTP screen, boxes cleared.
    expect(screen.getByText(uz.otpVerification.title)).toBeOnTheScreen();
    await waitFor(() => expect(otpBoxes()).toHaveLength(4));

    // The right code, typed digit by digit, verifies on the fourth digit.
    const boxes = otpBoxes();
    fireEvent.changeText(boxes[0], '5');
    fireEvent.changeText(boxes[1], '6');
    fireEvent.changeText(boxes[2], '7');
    fireEvent.changeText(boxes[3], '8');
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith(PHONE, '5678'));
    await waitFor(() => expect(showToast.success).toHaveBeenCalledWith(uz.common.success, uz.otpVerification.title));
    expect(verifyOtp).toHaveBeenCalledTimes(2);
  });
});
