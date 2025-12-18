import { Product } from '../models/product.model';

export const mockProducts: Product[] = [

    {
        id: '2',
        name: 'Pearl Elegance Necklace',
        price: 0,
        images: [
            '/images/jewelry/necklace-1.jpg',
            '/images/jewelry/necklace-1.jpg'
        ],
        description: 'An exquisite necklace featuring cultured pearls and rose gold accents. Handcrafted for sophisticated elegance.',
        category: 'necklaces',
        materials: ['gold', 'gemstones'],
        metalType: ['Gold', 'Silver'],
        weight: 12.0,
        purity: '18K',
        makingCharges: 800,
        wastagePercentage: 0.15,
        stonePrice: 5000,
        variants: [
            { id: '2-1', material: '18k Rose Gold', price: 0, stock: 8 },
            { id: '2-2', material: 'Sterling Silver', price: 0, stock: 6 }
        ],
        featured: true,
        bestseller: false,
        rating: 4.6,
        reviewCount: 89,
        inStock: true,
        createdAt: '2024-02-10'
    },

    {
        id: '6',
        name: 'Minimalist Chain Necklace',
        price: 0,
        images: [
            '/images/jewelry/necklace-1.jpg',
            '/images/jewelry/necklace-1.jpg'
        ],
        description: 'A delicate chain necklace perfect for everyday wear. Available in multiple metals for versatile styling.',
        category: 'necklaces',
        materials: ['gold', 'silver'],
        metalType: ['Gold', 'Silver'],
        weight: 15.0,
        purity: '22K',
        makingCharges: 900,
        wastagePercentage: 0.16,
        stonePrice: 0,
        variants: [
            { id: '6-1', material: '18k Rose Gold', price: 0, stock: 15 },
            { id: '6-2', material: 'Sterling Silver', price: 0, stock: 20 },
            { id: '6-3', material: '18k Yellow Gold', price: 0, stock: 10 }
        ],
        featured: false,
        bestseller: true,
        rating: 4.5,
        reviewCount: 203,
        inStock: true,
        createdAt: '2024-01-08'
    },

    {
        id: '1',
        name: 'Classic Diamond Solitaire',
        price: 0,
        images: ['/images/jewelry/ring-1.jpg'],
        description: 'A timeless solitaire diamond ring set in 18k gold.',
        category: 'rings',
        materials: ['gold', 'diamond'],
        metalType: ['Gold'],
        weight: 4.5,
        purity: '18K',
        makingCharges: 1500,
        wastagePercentage: 0.12,
        stonePrice: 45000,
        variants: [],
        featured: true,
        bestseller: true,
        rating: 4.9,
        reviewCount: 150,
        inStock: true,
        createdAt: '2024-01-15'
    },
    {
        id: '3',
        name: 'Gold Stud Earrings',
        price: 0,
        images: ['/images/jewelry/earrings-1.jpg'],
        description: 'Simple and elegant gold stud earrings for every occasion.',
        category: 'earrings',
        materials: ['gold'],
        metalType: ['Gold'],
        weight: 3.0,
        purity: '22K',
        makingCharges: 600,
        wastagePercentage: 0.10,
        stonePrice: 0,
        variants: [],
        featured: false,
        bestseller: false,
        rating: 4.4,
        reviewCount: 45,
        inStock: true,
        createdAt: '2024-02-01'
    },
    {
        id: '4',
        name: 'Elegant Gold Bracelet',
        price: 0,
        images: ['/images/jewelry/bracelet-1.jpg'],
        description: 'A sophisticated gold bracelet that adds a touch of luxury.',
        category: 'bracelets',
        materials: ['gold'],
        metalType: ['Gold'],
        weight: 12.0,
        purity: '22K',
        makingCharges: 2000,
        wastagePercentage: 0.14,
        stonePrice: 0,
        variants: [],
        featured: true,
        bestseller: false,
        rating: 4.7,
        reviewCount: 78,
        inStock: true,
        createdAt: '2024-02-15'
    },
    {
        id: '5',
        name: 'Sapphire Drop Earrings',
        price: 0,
        images: ['/images/jewelry/earrings-1.jpg'],
        description: 'Stunning drop earrings featuring deep blue sapphires.',
        category: 'earrings',
        materials: ['gold', 'sapphire'],
        metalType: ['Gold'],
        weight: 5.5,
        purity: '18K',
        makingCharges: 1200,
        wastagePercentage: 0.12,
        stonePrice: 25000,
        variants: [],
        featured: false,
        bestseller: true,
        rating: 4.8,
        reviewCount: 112,
        inStock: true,
        createdAt: '2024-03-01'
    },
    {
        id: '7',
        name: 'Silver Charm Bracelet',
        price: 0,
        images: ['/images/jewelry/bracelet-1.jpg'],
        description: 'A sterling silver bracelet ready for your favorite charms.',
        category: 'bracelets',
        materials: ['silver'],
        metalType: ['Silver'],
        weight: 15.0,
        purity: '925 Silver',
        makingCharges: 500,
        wastagePercentage: 0.08,
        stonePrice: 0,
        variants: [],
        featured: false,
        bestseller: false,
        rating: 4.3,
        reviewCount: 32,
        inStock: true,
        createdAt: '2024-03-10'
    },
    {
        id: '8',
        name: 'Vintage Ruby Ring',
        price: 0,
        images: ['/images/jewelry/ring-1.jpg'],
        description: 'An antique-style ring centered with a radiant ruby.',
        category: 'rings',
        materials: ['gold', 'ruby'],
        metalType: ['Gold'],
        weight: 6.0,
        purity: '22K',
        makingCharges: 1800,
        wastagePercentage: 0.15,
        stonePrice: 35000,
        variants: [],
        featured: true,
        bestseller: false,
        rating: 5.0,
        reviewCount: 22,
        inStock: true,
        createdAt: '2024-03-20'
    }
];

export const featuredCollections = [
    {
        id: 'engagement',
        name: 'Engagement Rings',
        description: 'Symbols of eternal love and commitment',
        image: '/images/collection-1.jpg'
    },
    {
        id: 'bridal',
        name: 'Bridal Collection',
        description: 'Complete your wedding day look',
        image: '/images/collection-1.jpg'
    },
    {
        id: 'everyday',
        name: 'Everyday Luxury',
        description: 'Elegant pieces for daily wear',
        image: '/images/collection-1.jpg'
    },
    {
        id: 'vintage',
        name: 'Vintage Inspired',
        description: 'Timeless designs with historical charm',
        image: '/images/collection-1.jpg'
    }
];
