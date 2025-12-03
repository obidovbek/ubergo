import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, DEFAULT_LANGUAGE } from '../config/languages';

interface LanguageContextType {
    currentLanguage: Language;
    changeLanguage: (language: Language) => Promise<void>;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (storedLanguage) {
                setCurrentLanguage(storedLanguage as Language);
            }
        } catch (error) {
            console.error('Failed to load language', error);
        } finally {
            setIsLoading(false);
        }
    };

    const changeLanguage = async (language: Language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
            setCurrentLanguage(language);
        } catch (error) {
            console.error('Failed to save language', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguageContext = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguageContext must be used within a LanguageProvider');
    }
    return context;
};
