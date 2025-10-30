import React from 'react';
import { Linking, Platform, Pressable, Text } from 'react-native';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

type ExternalLinkProps = {
  href: string;
  children?: React.ReactNode;
  target?: '_blank' | '_self';
  style?: any;
};

export function ExternalLink({ href, children, target = '_blank', style }: ExternalLinkProps) {
  const onPress = async () => {
    if (Platform.OS === 'web') {
      window.open(href, target);
      return;
    }
    await openBrowserAsync(href, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  };

  return (
    <Pressable onPress={onPress} style={style} accessibilityRole="link">
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </Pressable>
  );
}
