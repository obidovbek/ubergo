import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { AVAILABLE_LANGUAGES, Language } from '../config/languages';
import { createTheme } from '../themes';

const theme = createTheme('light');

export const LanguageSelector: React.FC = () => {
    const { currentLanguage, changeLanguage } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const activeLanguage = AVAILABLE_LANGUAGES.find(l => l.code === currentLanguage);

    return (
        <>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowModal(true)}
            >
                <Text style={styles.flag}>{activeLanguage?.flag}</Text>
                <Text style={styles.code}>{activeLanguage?.code.toUpperCase()}</Text>
            </TouchableOpacity>

            <Modal
                transparent
                animationType="fade"
                visible={showModal}
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.modalContent}>
                                <Text style={styles.title}>Select Language</Text>
                                {AVAILABLE_LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.option,
                                            currentLanguage === lang.code && styles.activeOption,
                                        ]}
                                        onPress={() => {
                                            changeLanguage(lang.code);
                                            setShowModal(false);
                                        }}
                                    >
                                        <Text style={styles.optionFlag}>{lang.flag}</Text>
                                        <Text style={[
                                            styles.optionName,
                                            currentLanguage === lang.code && styles.activeOptionText
                                        ]}>
                                            {lang.name}
                                        </Text>
                                        {currentLanguage === lang.code && (
                                            <Text style={styles.check}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing(1),
        backgroundColor: theme.palette.background.card,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.palette.border,
    },
    flag: {
        fontSize: 20,
        marginRight: theme.spacing(1),
    },
    code: {
        ...theme.typography.caption,
        fontWeight: '600',
        color: theme.palette.text.primary,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing(3),
    },
    modalContent: {
        width: '100%',
        maxWidth: 300,
        backgroundColor: theme.palette.background.card,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing(2),
        ...theme.shadows.lg,
    },
    title: {
        ...theme.typography.h4,
        marginBottom: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.primary,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing(2),
        borderRadius: theme.borderRadius.sm,
        marginBottom: theme.spacing(1),
    },
    activeOption: {
        backgroundColor: theme.palette.primary.light + '20', // 20% opacity
    },
    optionFlag: {
        fontSize: 24,
        marginRight: theme.spacing(2),
    },
    optionName: {
        ...theme.typography.body1,
        flex: 1,
        color: theme.palette.text.primary,
    },
    activeOptionText: {
        color: theme.palette.primary.main,
        fontWeight: '600',
    },
    check: {
        color: theme.palette.primary.main,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
