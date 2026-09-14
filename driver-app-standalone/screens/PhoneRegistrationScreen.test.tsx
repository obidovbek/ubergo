/**
 * T-118 step 11 — the driver's login flow (CHECKLIST §2 / §9): phone OR user id → a push OTP
 * to the passenger app → the OTP screen. T-076 removed social sign-in; T-061 added the id
 * path and the "register in the passenger app first" hand-off. What this pins:
 *   ① nothing entered → refused before any OTP is sent;
 *   ② a complete phone → `sendOtp(E.164, 'push', { userId: undefined })` → the OTP screen (a
 *      REAL navigation; the OTP screen is registered in the harness);
 *   ③ an id alone → `sendOtp(undefined, 'push', { userId })`, and the OTP screen then verifies
 *      with an EMPTY phone and that id — the shape the API contract needs;
 *   ④ `USER_NOT_REGISTERED` from the API → the RegisterFirst hand-off, carrying the store URLs;
 *   ⑤ on the OTP screen a wrong code reports the remaining attempts and clears the boxes, a
 *      right one verifies with THAT phone, THAT code and THAT id.
 */
import React from 'react';
import { Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderScreen, type AuthValue } from '../test/render';
import uz from '../translations/uz';
import { showToast } from '../utils/toast';
import { OTPVerificationScreen } from './OTPVerificationScreen';
import { PhoneRegistrationScreen } from './PhoneRegistrationScreen';

jest.mock('../utils/toast');

const PHONE = '+998901234567';
const USER_ID = '1001117';

/** Stands in for `RegisterFirstScreen`; echoes its params so the hand-off can be asserted. */
const RegisterFirstStub = () => {
  const route = useRoute();
  return <Text>{`register-first:${JSON.stringify(route.params)}`}</Text>;
};

let sendOtp: jest.Mock<AuthValue['sendOtp']>;
let verifyOtp: jest.Mock<AuthValue['verifyOtp']>;

beforeEach(() => {
  sendOtp = jest.fn<AuthValue['sendOtp']>();
  sendOtp.mockResolvedValue({
    success: true,
    data: { sent: true, channel: 'push', expiresInSec: 120, cooldownSec: 60 },
    message: 'Verification code sent via push',
  });
  verifyOtp = jest.fn<AuthValue['verifyOtp']>();
  verifyOtp.mockResolvedValue(undefined);
});

const mount = async () => {
  await renderScreen(<PhoneRegistrationScreen />, {
    auth: { user: null, token: null, isAuthenticated: false, sendOtp, verifyOtp },
    screens: { OTPVerification: OTPVerificationScreen, RegisterFirst: RegisterFirstStub },
  });
  await screen.findByPlaceholderText(uz.phoneRegistration.phonePlaceholder);
};

const pressContinue = () => {
  const all = screen.getAllByText(uz.common.continue);
  fireEvent.press(all[all.length - 1]);
};

/** The four OTP boxes: the last four empty inputs once the OTP screen is on top. */
const otpBoxes = () => screen.getAllByDisplayValue('').slice(-4);

const expectOtpScreen = async () => {
  expect(await screen.findByText(uz.otpVerification.title)).toBeOnTheScreen();
  expect(otpBoxes()).toHaveLength(4);
};

const typeCode = (code: string) => {
  const boxes = otpBoxes();
  code.split('').forEach((digit, i) => fireEvent.changeText(boxes[i], digit));
};

describe('driver login: phone or id → push OTP', () => {
  it('keeps "continue" disabled until a full phone OR an id is entered, so nothing is sent', async () => {
    await mount();
    // MEASURED: the button is `disabled` until the phone reaches the local length or an id is
    // present, so the screen's "incomplete" warning cannot be reached from the UI.
    const button = screen.getByText(uz.common.continue);
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(sendOtp).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByPlaceholderText(uz.phoneRegistration.phonePlaceholder), '90123');
    expect(button).toBeDisabled();
    fireEvent.changeText(screen.getByPlaceholderText(uz.userDetails.userIdPlaceholder), USER_ID);
    expect(button).toBeEnabled();
  });

  it('a complete phone sends a push OTP for the E.164 number and opens the OTP screen', async () => {
    await mount();
    fireEvent.changeText(screen.getByPlaceholderText(uz.phoneRegistration.phonePlaceholder), '901234567');
    pressContinue();
    await waitFor(() => expect(sendOtp).toHaveBeenCalledWith(PHONE, 'push', { userId: undefined }));
    await expectOtpScreen();
  });

  it('an id alone sends the OTP by id, and the OTP screen verifies with an empty phone and that id', async () => {
    await mount();
    fireEvent.changeText(screen.getByPlaceholderText(uz.userDetails.userIdPlaceholder), ` ${USER_ID} `);
    pressContinue();
    await waitFor(() => expect(sendOtp).toHaveBeenCalledWith(undefined, 'push', { userId: USER_ID }));
    await expectOtpScreen();

    typeCode('5678');
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith('', '5678', { userId: USER_ID }));
    await waitFor(() =>
      expect(showToast.success).toHaveBeenCalledWith(uz.common.success, uz.otpVerification.phoneVerified),
    );
  });

  it('USER_NOT_REGISTERED hands the driver to RegisterFirst with the store links', async () => {
    await mount();
    sendOtp.mockRejectedValueOnce({
      response: {
        data: { data: { code: 'USER_NOT_REGISTERED', app_store_urls: { android: 'https://play/x', ios: null } } },
      },
    });
    fireEvent.changeText(screen.getByPlaceholderText(uz.phoneRegistration.phonePlaceholder), '901234567');
    pressContinue();
    expect(await screen.findByText(/^register-first:/)).toHaveTextContent(/https:\/\/play\/x/);
    expect(screen.queryByText(uz.otpVerification.title)).not.toBeOnTheScreen();
  });

  it('a wrong code reports the remaining attempts and clears; the right one verifies for that phone', async () => {
    await mount();
    fireEvent.changeText(screen.getByPlaceholderText(uz.phoneRegistration.phonePlaceholder), '901234567');
    pressContinue();
    await expectOtpScreen();

    verifyOtp.mockRejectedValueOnce(new Error('wrong code'));
    typeCode('1234');
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith(PHONE, '1234', { userId: undefined }));
    await waitFor(() =>
      expect(showToast.error).toHaveBeenCalledWith(uz.common.error, `${uz.otpVerification.errorIncorrect}2`),
    );
    await waitFor(() => expect(otpBoxes()).toHaveLength(4));

    typeCode('5678');
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith(PHONE, '5678', { userId: undefined }));
    expect(verifyOtp).toHaveBeenCalledTimes(2);
  });
});
