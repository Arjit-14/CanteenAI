/**
 * Seed script to populate database with sample data
 * Run: node utils/seed.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Canteen = require('../models/Canteen');
const MenuItem = require('../models/MenuItem');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canteen_rush_ai';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Student.deleteMany({});
        await Canteen.deleteMany({});
        await MenuItem.deleteMany({});
        console.log('Cleared existing data');

        // Create students
        const students = await Student.create([
            {
                name: 'John Doe',
                email: 'john@university.edu',
                password: 'password123',
                phone: '+91-9876543210',
                studentId: 'STU2024001',
                department: 'Computer Science',
                role: 'student'
            },
            {
                name: 'Jane Smith',
                email: 'jane@university.edu',
                password: 'password123',
                phone: '+91-9876543211',
                studentId: 'STU2024002',
                department: 'Electronics',
                role: 'student'
            },
            {
                name: 'Vendor Kumar',
                email: 'vendor@canteen.edu',
                password: 'vendor123',
                phone: '+91-9876543220',
                studentId: 'VND001',
                department: 'Food Services',
                role: 'vendor'
            },
            {
                name: 'Admin User',
                email: 'admin@university.edu',
                password: 'admin123',
                phone: '+91-9876543200',
                studentId: 'ADM001',
                department: 'Administration',
                role: 'admin'
            }
        ]);
        console.log('Created students and vendor accounts');

        // Get vendor ID
        const vendor = students.find(s => s.role === 'vendor');

        // Create canteens
        const canteens = await Canteen.create([
            {
                name: 'Main Block Canteen',
                location: 'Block A, Ground Floor',
                image: '/images/canteen-main.jpg',
                openTime: '08:00',
                closeTime: '18:00',
                kitchenCapacity: 5,
                isActive: true,
                vendorId: vendor._id
            },
            {
                name: 'Engineering Block Cafe',
                location: 'Block B, First Floor',
                image: '/images/canteen-eng.jpg',
                openTime: '08:30',
                closeTime: '17:00',
                kitchenCapacity: 4,
                isActive: true,
                vendorId: vendor._id
            },
            {
                name: 'Library Snack Corner',
                location: 'Central Library, Ground Floor',
                image: '/images/canteen-lib.jpg',
                openTime: '09:00',
                closeTime: '20:00',
                kitchenCapacity: 3,
                isActive: true,
                vendorId: vendor._id
            }
        ]);
        console.log('Created canteens');

        // Create menu items for Main Block Canteen
        const mainCanteen = canteens[0];
        await MenuItem.create([
            // Breakfast
            {
                canteenId: mainCanteen._id,
                name: 'Masala Dosa',
                description: 'Crispy dosa with spiced potato filling, served with chutney and sambar',
                price: 50,
                category: 'Breakfast',
                prepTime: 8,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Idli Sambar',
                description: 'Soft steamed idlis (3 pcs) with sambar and coconut chutney',
                price: 35,
                category: 'Breakfast',
                prepTime: 5,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Poha',
                description: 'Flattened rice with peanuts, onions, and spices',
                price: 30,
                category: 'Breakfast',
                prepTime: 6,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Aloo Paratha',
                description: 'Stuffed potato paratha with curd and pickle',
                price: 45,
                category: 'Breakfast',
                prepTime: 10,
                isAvailable: true
            },

            // Lunch
            {
                canteenId: mainCanteen._id,
                name: 'Veg Thali',
                description: 'Complete meal with rice, roti, dal, sabzi, salad, and dessert',
                price: 80,
                category: 'Lunch',
                prepTime: 12,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Chole Bhature',
                description: 'Spicy chickpea curry with fried bread',
                price: 60,
                category: 'Lunch',
                prepTime: 10,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Rajma Chawal',
                description: 'Kidney bean curry with steamed rice',
                price: 55,
                category: 'Lunch',
                prepTime: 8,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Paneer Butter Masala',
                description: 'Cottage cheese in rich tomato gravy with naan',
                price: 90,
                category: 'Lunch',
                prepTime: 15,
                isAvailable: true
            },

            // Snacks
            {
                canteenId: mainCanteen._id,
                name: 'Samosa',
                description: 'Crispy potato-filled pastry (2 pcs)',
                price: 20,
                category: 'Snacks',
                prepTime: 3,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Vada Pav',
                description: 'Mumbai style spicy potato fritter in bread',
                price: 25,
                category: 'Snacks',
                prepTime: 4,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Pav Bhaji',
                description: 'Mashed vegetable curry with buttered bread',
                price: 50,
                category: 'Snacks',
                prepTime: 8,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Maggi Noodles',
                description: 'Quick made instant noodles',
                price: 35,
                category: 'Snacks',
                prepTime: 5,
                isAvailable: true
            },

            // Beverages
            {
                canteenId: mainCanteen._id,
                name: 'Masala Chai',
                description: 'Hot spiced Indian tea',
                price: 15,
                category: 'Beverages',
                prepTime: 3,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Filter Coffee',
                description: 'South Indian style filter coffee',
                price: 20,
                category: 'Beverages',
                prepTime: 4,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Mango Lassi',
                description: 'Sweet mango yogurt drink',
                price: 40,
                category: 'Beverages',
                prepTime: 3,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Cold Coffee',
                description: 'Iced coffee with cream',
                price: 45,
                category: 'Beverages',
                prepTime: 4,
                isAvailable: true
            },

            // Desserts
            {
                canteenId: mainCanteen._id,
                name: 'Gulab Jamun',
                description: 'Sweet milk dumplings in sugar syrup (2 pcs)',
                price: 30,
                category: 'Desserts',
                prepTime: 2,
                isAvailable: true
            },
            {
                canteenId: mainCanteen._id,
                name: 'Rasgulla',
                description: 'Soft cheese balls in sugar syrup (2 pcs)',
                price: 30,
                category: 'Desserts',
                prepTime: 2,
                isAvailable: true
            }
        ]);
        console.log('Created menu items for Main Block Canteen');

        // Create menu items for Engineering Block Cafe
        const engCanteen = canteens[1];
        await MenuItem.create([
            // Breakfast
            {
                canteenId: engCanteen._id,
                name: 'Bread Omelette',
                description: 'Fluffy egg omelette with toast and butter',
                price: 40,
                category: 'Breakfast',
                prepTime: 6,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Upma',
                description: 'South Indian semolina breakfast with vegetables',
                price: 30,
                category: 'Breakfast',
                prepTime: 5,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Sandwich',
                description: 'Grilled vegetable sandwich with cheese',
                price: 45,
                category: 'Breakfast',
                prepTime: 7,
                isAvailable: true
            },

            // Lunch
            {
                canteenId: engCanteen._id,
                name: 'Chicken Biryani',
                description: 'Aromatic basmati rice with spiced chicken',
                price: 120,
                category: 'Lunch',
                prepTime: 15,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Veg Fried Rice',
                description: 'Chinese style fried rice with vegetables',
                price: 60,
                category: 'Lunch',
                prepTime: 10,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Dal Rice',
                description: 'Yellow dal with steamed rice and pickle',
                price: 45,
                category: 'Lunch',
                prepTime: 8,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Egg Curry Rice',
                description: 'Boiled eggs in spicy gravy with rice',
                price: 65,
                category: 'Lunch',
                prepTime: 12,
                isAvailable: true
            },

            // Snacks
            {
                canteenId: engCanteen._id,
                name: 'French Fries',
                description: 'Crispy golden fries with ketchup',
                price: 50,
                category: 'Snacks',
                prepTime: 8,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Burger',
                description: 'Veg burger with cheese and sauce',
                price: 60,
                category: 'Snacks',
                prepTime: 10,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Momos',
                description: 'Steamed vegetable dumplings with spicy sauce',
                price: 50,
                category: 'Snacks',
                prepTime: 8,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Spring Roll',
                description: 'Crispy rolls with vegetable filling',
                price: 45,
                category: 'Snacks',
                prepTime: 6,
                isAvailable: true
            },

            // Beverages
            {
                canteenId: engCanteen._id,
                name: 'Hot Chocolate',
                description: 'Rich creamy hot chocolate',
                price: 50,
                category: 'Beverages',
                prepTime: 4,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Lemonade',
                description: 'Fresh lime juice with mint',
                price: 25,
                category: 'Beverages',
                prepTime: 3,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Milkshake',
                description: 'Creamy vanilla milkshake',
                price: 55,
                category: 'Beverages',
                prepTime: 4,
                isAvailable: true
            },

            // Desserts
            {
                canteenId: engCanteen._id,
                name: 'Brownie',
                description: 'Chocolate brownie with ice cream',
                price: 60,
                category: 'Desserts',
                prepTime: 3,
                isAvailable: true
            },
            {
                canteenId: engCanteen._id,
                name: 'Ice Cream',
                description: 'Double scoop chocolate/vanilla',
                price: 40,
                category: 'Desserts',
                prepTime: 2,
                isAvailable: true
            }
        ]);
        console.log('Created menu items for Engineering Block Cafe');

        // Create menu items for Library Snack Corner
        const libCanteen = canteens[2];
        await MenuItem.create([
            // Snacks (Quick bites)
            {
                canteenId: libCanteen._id,
                name: 'Samosa',
                description: 'Crispy potato samosas (2 pcs)',
                price: 20,
                category: 'Snacks',
                prepTime: 2,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Bread Pakora',
                description: 'Fried bread slices with potato filling',
                price: 25,
                category: 'Snacks',
                prepTime: 4,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Chips',
                description: 'Packed potato chips',
                price: 20,
                category: 'Snacks',
                prepTime: 1,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Biscuit Packet',
                description: 'Assorted cream biscuits',
                price: 15,
                category: 'Snacks',
                prepTime: 1,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Puff',
                description: 'Vegetable puff pastry',
                price: 25,
                category: 'Snacks',
                prepTime: 2,
                isAvailable: true
            },

            // Beverages
            {
                canteenId: libCanteen._id,
                name: 'Tea',
                description: 'Regular hot tea',
                price: 10,
                category: 'Beverages',
                prepTime: 2,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Coffee',
                description: 'Instant coffee',
                price: 15,
                category: 'Beverages',
                prepTime: 2,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Juice',
                description: 'Fresh orange/apple juice',
                price: 35,
                category: 'Beverages',
                prepTime: 3,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Buttermilk',
                description: 'Spiced traditional buttermilk',
                price: 20,
                category: 'Beverages',
                prepTime: 2,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Smoothie',
                description: 'Mixed fruit smoothie',
                price: 50,
                category: 'Beverages',
                prepTime: 4,
                isAvailable: true
            },

            // Light Meals
            {
                canteenId: libCanteen._id,
                name: 'Maggi',
                description: 'Quick instant noodles',
                price: 30,
                category: 'Snacks',
                prepTime: 5,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Cup Noodles',
                description: 'Instant cup noodles',
                price: 40,
                category: 'Snacks',
                prepTime: 3,
                isAvailable: true
            },

            // Desserts
            {
                canteenId: libCanteen._id,
                name: 'Cake Slice',
                description: 'Fresh chocolate/vanilla cake',
                price: 45,
                category: 'Desserts',
                prepTime: 1,
                isAvailable: true
            },
            {
                canteenId: libCanteen._id,
                name: 'Pastry',
                description: 'Cream pastry',
                price: 35,
                category: 'Desserts',
                prepTime: 1,
                isAvailable: true
            }
        ]);
        console.log('Created menu items for Library Snack Corner');

        console.log('\n✅ Database seeded successfully!\n');
        console.log('Test Accounts:');
        console.log('- Student: john@university.edu / password123');
        console.log('- Vendor: vendor@canteen.edu / vendor123');
        console.log('- Admin: admin@university.edu / admin123\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
