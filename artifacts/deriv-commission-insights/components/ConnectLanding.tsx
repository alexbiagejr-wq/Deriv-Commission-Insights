import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ConnectPanel } from '@/components/ConnectPanel';
import { InlineMessage, PageHeader, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';

export function ConnectLanding() {
  const colors = useColors();

  return (
    <Screen>
      <PageHeader
        eyebrow="DERIV PARTNER INSIGHTS"
        title="Your commissions, clearly."
        subtitle="Sign in to view partner commissions, registered app markup, and activity reports."
      />
      <ConnectPanel />
      <InlineMessage>
        This app reads Deriv partner reports only. It does not place trades or
        access live account balances.
      </InlineMessage>
      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        Sign in with your Deriv account to continue.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
  },
});
