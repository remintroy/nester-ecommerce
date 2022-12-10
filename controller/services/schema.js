import mongoose from "mongoose";
import mongoosePaginator, { paginate } from 'mongoose-paginate-v2';
import dotenv from 'dotenv';

dotenv.config();

const dbLatencyLoggerTime = new Date();
const dbLatencyLogger = () => console.log(`[-] Database connected in : ${new Date() - dbLatencyLoggerTime}ms`);

const db = mongoose.createConnection(process.env.USERDB_URL);

db.on('error', (error) => console.error(error));
db.once('open', () => dbLatencyLogger());

export const DB = db;

export const ObjectID = mongoose.Types.ObjectId;
export const users = db.model("user", new mongoose.Schema({
    name: String,
    email: String,
    displayName: String,
    phone: Number,
    referal: String,
    referedBy: String,
    phoneVerified: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    password: String,
    UID: String,
    creationTime: {
        type: Date,
        default: new Date()
    },
    lastLogin: {
        type: Date,
        default: new Date()
    },
    loginProvider: String,
    blocked: {
        type: Boolean,
        default: false
    },
    address: String,
    orders: String,
    cart: String,
    wishList: String,
    payment: Object
}));

export const address = db.model("address", new mongoose.Schema({
    UID: String,
    address: [
        {
            type: {
                type: String,
                default: 'secondary'
            },
            name: String,
            country: String,
            phone: Number,
            postalCode: Number,
            houseNumber: String,
            streetNumber: String,
            town: String,
            state: String,
            landmark: String,
            email: String
        }
    ]
}));

// products 
const productsSchema = new mongoose.Schema({
    PID: String,
    title: String,
    description: String,
    category: String,
    price: Number,
    views: Array,
    addedToCart: Array,
    interactions: Array,
    reachedCheckout: Array,
    productsListingViews: Array,
    impressions: Array,
    purchased: Array,
    cancelled: Array,
    purchaseCompleted: Array,
    lastPurchased: Date,
    creationTime: {
        type: Date,
        default: new Date()
    },
    offer: {
        type: Number,
        default: 0
    },
    stock: Number
});

productsSchema.plugin(mongoosePaginator);

export const products = db.model("products", productsSchema);

// category
const categorySchema = new mongoose.Schema({
    category: String,
    subCategorys: Array,
    creationTime: {
        type: Date,
        default: new Date()
    },
    disabled: {
        type: Boolean,
        default: false
    },
    offer: String,
});

categorySchema.plugin(mongoosePaginator);

export const category = db.model("category", categorySchema);

export const cart = db.model("cart", new mongoose.Schema({
    UID: String,
    products: [
        {
            PID: String,
            quantity: {
                type: Number,
                default: 1
            },
            updated: {
                type: Date,
                default: new Date()
            },
            status: {
                type: String,
                default: 'cart'
            },
            orderID: String
        }
    ]
}));

// orderes
const ordersSchema = new mongoose.Schema({
    UID: String,
    orders: [
        {
            orderID: String,
            products: Array,
            address: Object,
            trackingID: String,
            couponCode: String,
            status: {
                type: String,
                default: 'pending'
            },
            paymentType: String,
            paymentDate: {
                type: Date,
                default: new Date()
            },
            paymentError: Object,
            paymentDetails: Object,
            statusUpdate: {
                0: { status: String, date: Date },
                1: { status: String, date: Date },
                2: { status: String, date: Date },
                3: { status: String, date: Date },
                4: { status: String, date: Date }
            },
            update: {
                type: Date,
                default: new Date()
            },
            paymentStatus: {
                type: String,
                default: 'pending'
            },
            dateOFOrder: {
                type: Date,
                default: new Date()
            }
        }
    ]
});

ordersSchema.plugin(mongoosePaginator);

export const orders = db.model("orders", ordersSchema);


// banner 
const bannerSchema = new mongoose.Schema({
    disabled: {
        type: Boolean,
        default: false
    },
    title: String,
    description: String,
    titleTop: String,
    titleBottom: String,
    btnName: String,
    btnAction: String,
    img: String,
    bannerID: String,
    bg: String,
    color: String
});
// banner plugin's
bannerSchema.plugin(mongoosePaginator);
// creating model
export const banners = db.model('banners', bannerSchema);


export const analytics = db.model("analytics", new mongoose.Schema({
    title: String,
    data: Array,
    created: {
        type: Date,
        default: new Date
    },
}));

export const wishList = db.model("wishList", new mongoose.Schema({
    wishListID: String,
    UID: String,
    products: [
        {
            PID: String,
            addedAt: Date
        }
    ]
}));

export const adminUser = db.model("admin", new mongoose.Schema(
    {
        adminID: String,
        password: String,
        email: String,
        createdAt: {
            type: String,
            default: new Date
        },
        name: String
    }
));

export const countries = db.model("countries", new mongoose.Schema(
    {
        name: String,
        code: String,
        timezone: String,
        utc: String,
        mobileCode: String
    }
));

export const wallets = db.model('wallets', new mongoose.Schema({
    UID: String,
    amount: Number,
    transactions: [{
        amount: Number,
        flow: String,
        date: Date,
        message: String,
        remarks: String
    }]
}));

export const coupens = db.model('coupens', new mongoose.Schema({
    code: String,
    title: String,
    value: Number,
    valueType: String,
    expiry: Date,
    minSpend: Number,
    maxSpend: Number,
    category: String,
    product: String,
    maxUsage: Number,
    used: Number
}))