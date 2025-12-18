import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';

export interface PriceBreakdown {
    metalRate: number; // Rate per gram
    metalValue: number; // weight * rate
    wastageAmount: number; // metalValue * wastagePercentage
    makingCharges: number;
    stoneCharges: number;
    taxableValue: number;
    gstAmount: number;
    finalPrice: number;
}

@Injectable({
    providedIn: 'root'
})
export class PriceService {
    // Hardcoded rates for now. In a real app, these would come from an API.
    private readonly RATES = {
        '24K': 7200,
        '22K': 6650,
        '18K': 5450,
        'PLATINUM': 3200, // 950 Platinum
        'SILVER': 90 // 925 Silver
    };

    private readonly GST_RATE = 0.03; // 3%

    constructor() { }

    getRateForPurity(purity: string, metalType: string[]): number {
        if (metalType.includes('Platinum')) return this.RATES['PLATINUM'];
        if (metalType.includes('Silver')) return this.RATES['SILVER'];

        // Default to Gold logic
        if (purity === '24K') return this.RATES['24K'];
        if (purity === '18K') return this.RATES['18K'];
        return this.RATES['22K']; // Default 22K for Gold
    }

    calculatePrice(product: Product): PriceBreakdown {
        const rate = this.getRateForPurity(product.purity, product.metalType);
        const metalValue = product.weight * rate;
        const wastageAmount = metalValue * product.wastagePercentage;
        const stoneCharges = product.stonePrice || 0;

        // Taxable Value = Metal Value + Wastage + Making Charges + Stone Charges
        const taxableValue = metalValue + wastageAmount + product.makingCharges + stoneCharges;

        const gstAmount = taxableValue * this.GST_RATE;
        const finalPrice = Math.round(taxableValue + gstAmount);

        return {
            metalRate: rate,
            metalValue,
            wastageAmount,
            makingCharges: product.makingCharges,
            stoneCharges,
            taxableValue,
            gstAmount,
            finalPrice
        };
    }
}
