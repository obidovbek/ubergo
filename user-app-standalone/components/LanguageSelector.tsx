import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { AVAILABLE_LANGUAGES, Language } from '../config/languages';
import { createTheme } from '../themes';
import { ModalList, type ModalListOption } from './ModalList';

const theme = createTheme('light');

// Only three entries, all proper nouns in their own language — no search box, and the
// flag rides along in the label rather than needing its own slot (T-036).
const LANGUAGE_OPTIONS: ModalListOption[] = AVAILABLE_LANGUAGES.map((lang) => ({
    id: lang.code,
    label: `${lang.flag}  ${lang.name}`,
}));

export const LanguageSelector: React.FC = () => {
    const { t, currentLanguage, changeLanguage } = useTranslation();
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

            <ModalList
                visible={showModal}
                title={t('common.selectLanguage')}
                options={LANGUAGE_OPTIONS}
                selectedId={currentLanguage}
                searchable={false}
                onSelect={(option) => {
                    changeLanguage(option.id as Language);
                    setShowModal(false);
                }}
                onClose={() => setShowModal(false)}
            />
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
});
