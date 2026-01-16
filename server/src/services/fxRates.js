import config from '../config/env.js';
import { FxRate } from '../models/index.js';

/**
 * FX Rate Service
 * Fetches rates from frankfurter.app and manages rate storage
 */

const FX_API_BASE = config.fx.apiUrl;

/**
 * Fetch latest FX rates from frankfurter.app
 * @param {string} baseCurrency - Base currency code (default: EUR since frankfurter uses EUR)
 * @returns {Object} Rate data
 */
export const fetchLatestRates = async (baseCurrency = 'EUR') => {
    try {
        const response = await fetch(`${FX_API_BASE}/latest?from=${baseCurrency}`);

        if (!response.ok) {
            throw new Error(`FX API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            base: data.base,
            date: data.date,
            rates: data.rates,
        };
    } catch (error) {
        console.error('Failed to fetch FX rates:', error.message);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Update FX rates in database from API
 * Converts all rates to base currency (FJD)
 */
export const refreshFxRates = async () => {
    try {
        // Frankfurter uses EUR as base, so we need to get EUR rates and convert
        const result = await fetchLatestRates('EUR');

        if (!result.success) {
            return { success: false, error: result.error };
        }

        const { rates, date } = result;
        const baseCurrency = config.app.baseCurrency; // FJD

        // Get FJD rate relative to EUR
        const fjdRate = rates[baseCurrency] || 2.4; // Fallback if not available

        const updatedRates = [];
        const now = new Date();

        // Convert each currency to FJD base
        for (const [currency, eurRate] of Object.entries(rates)) {
            if (currency === baseCurrency) continue;

            // Rate to convert 1 unit of currency to FJD
            // If 1 EUR = 2.4 FJD and 1 EUR = 1.6 NZD
            // Then 1 NZD = 2.4/1.6 = 1.5 FJD
            const rateToFjd = fjdRate / eurRate;

            await FxRate.upsert({
                currency,
                rateToBase: rateToFjd,
                lastUpdated: now,
                source: 'frankfurter',
            });

            updatedRates.push({
                currency,
                rateToBase: rateToFjd,
            });
        }

        // Also add EUR rate to FJD
        await FxRate.upsert({
            currency: 'EUR',
            rateToBase: fjdRate,
            lastUpdated: now,
            source: 'frankfurter',
        });

        return {
            success: true,
            updatedCount: updatedRates.length + 1,
            date,
            rates: updatedRates,
        };
    } catch (error) {
        console.error('Failed to refresh FX rates:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Get FX rate for a currency
 * @param {string} currency - Currency code
 * @returns {Object} Rate info or null
 */
export const getRate = async (currency) => {
    const rate = await FxRate.findByPk(currency);
    if (!rate) {
        return null;
    }

    return {
        currency: rate.currency,
        rateToBase: parseFloat(rate.rateToBase),
        lastUpdated: rate.lastUpdated,
        isStale: rate.isStale(config.fx.staleHours),
    };
};

/**
 * Get all FX rates with staleness info
 */
export const getAllRates = async () => {
    const rates = await FxRate.findAll({
        order: [['currency', 'ASC']],
    });

    return rates.map(rate => ({
        currency: rate.currency,
        rateToBase: parseFloat(rate.rateToBase),
        lastUpdated: rate.lastUpdated,
        source: rate.source,
        isStale: rate.isStale(config.fx.staleHours),
    }));
};

/**
 * Check if any rates are stale
 */
export const hasStaleRates = async () => {
    const rates = await FxRate.findAll();
    return rates.some(rate => rate.isStale(config.fx.staleHours));
};

export default {
    fetchLatestRates,
    refreshFxRates,
    getRate,
    getAllRates,
    hasStaleRates,
};
