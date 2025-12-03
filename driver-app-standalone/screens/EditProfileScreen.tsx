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
} from 'react-native';
import { createTheme } from '../themes';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';

const theme = createTheme('light');

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();

    const menuItems = [
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
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← {t('common.back')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('profile.editProfile')}</Text>
                </View>

                <View style={styles.menuSection}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => {
                                (navigation as any).navigate(item.navigate, { isEditing: true });
                            }}
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
        backgroundColor: theme.palette.background.default,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: theme.spacing(2),
        backgroundColor: theme.palette.background.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.palette.divider,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: theme.spacing(2),
    },
    backButtonText: {
        ...theme.typography.button,
        color: theme.palette.primary.main,
    },
    title: {
        ...theme.typography.h3,
        color: theme.palette.text.primary,
    },
    menuSection: {
        marginTop: theme.spacing(2),
        backgroundColor: theme.palette.background.card,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.palette.divider,
    },
    menuIcon: {
        fontSize: 24,
        marginRight: theme.spacing(2),
    },
    menuTitle: {
        ...theme.typography.body1,
        color: theme.palette.text.primary,
        flex: 1,
    },
    menuArrow: {
        fontSize: 24,
        color: theme.palette.text.secondary,
    },
});
