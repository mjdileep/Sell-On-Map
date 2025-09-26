"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { getCountryFromTimezone, getMonateryUnitFromCountry, getCountryZoom } from '@/lib/currencyUtils';

export interface AppConfig {
	country: string;
	currency: string;
	zoom: number;
}

const ConfigContext = createContext<AppConfig | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
	const country = useMemo(() => getCountryFromTimezone(), []);
	const currency = useMemo(() => getMonateryUnitFromCountry(), [country]);
	const zoom = useMemo(() => getCountryZoom(country), [country]);
	const value = useMemo<AppConfig>(() => ({ country, currency, zoom }), [country, currency, zoom]);
	return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
	const ctx = useContext(ConfigContext);
	if (!ctx) {
		throw new Error('useConfig must be used within a ConfigProvider');
	}
	return ctx;
}
