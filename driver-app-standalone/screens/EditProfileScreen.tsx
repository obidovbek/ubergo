/**
 * Edit Profile Screen
 * Menu to select which part of the profile to edit
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Platform,
    StatusBar,
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import type { MainNavigationProp, EditableStep } from '../navigation/types';
import { useTranslation } from '../hooks/useTranslation';
import { BackButton } from '../components/BackButton';

const theme = createTheme('light');

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<MainNavigationProp>();
    const { t } = useTranslation();

    /*
     * T-028 — `navigate` is a route NAME, so it is typed as one.
     *
     * ⚠️ Narrowed to the six registration steps because every one of them is
     * opened here with `{ isEditing: true }` — a route that does not accept
     * that param now fails to compile instead of being cast away.
     */
    const menuItems: {
        id: string;
        title: string;
        icon: string;
        navigate: EditableStep;
    }[] = [
        {
            id: 'personal',
            title: t('editProfile.personalInfo'),
            icon: '👤',
            navigate: 'DriverPersonalInfo'
        },
        {
            id: 'passport',
            title: t('editProfile.passport'),
            icon: '🆔',
            navigate: 'DriverPassport'
        },
        {
            id: 'license',
            title: t('editProfile.license'),
            icon: '🪪',
            navigate: 'DriverLicense'
        },
        {
            id: 'vehicle',
            title: t('editProfile.vehicle'),
            icon: '🚗',
            navigate: 'DriverVehicle'
        },
        {
            id: 'taxi_license',
            title: t('editProfile.taxiLicense'),
            icon: '🚕',
            navigate: 'DriverTaxiLicense'
        },
        {
            id: 'details',
            title: t('editProfile.driverType'),
            icon: '📋',
            navigate: 'DriverDetails'
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                {/* T-071 — was a green `←` that scaled with the system font. */}
                <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />
                <Text style={styles.headerTitle}>{t('profile.editProfile')}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => {
                                navigation.navigate(item.navigate, { isEditing: true });
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    // T-071 — layout only; the tile itself comes from <BackButton />.
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    headerSpacer: {
        width: 60,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        marginVertical: 4,
        marginHorizontal: 4,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },
    menuArrow: {
        fontSize: 24,
        color: '#6B7280',
        fontWeight: '300',
    },
});
