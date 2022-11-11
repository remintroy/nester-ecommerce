import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const dbLatencyLoggerTime = new Date();
const dbLatencyLogger = () => console.log(`[-] Database connected in : ${new Date() - dbLatencyLoggerTime}ms`);

const db = mongoose.createConnection(process.env.USERDB_URL);

db.on('error', (error) => console.error(error));
db.once('open', () => dbLatencyLogger());

export const ObjectID = mongoose.Types.ObjectId;
export const users = db.model("user", new mongoose.Schema({
    name: String,
    email: String,
    displayName:String,
    phone: Number,
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

export const products = db.model("products", new mongoose.Schema({
    PID: String,
    title: String,
    description: String,
    category: Array,
    price: Number,
    creationTime: {
        type: Date,
        default: new Date()
    },
    offer: {
        type: Number,
        default: 0
    },
    stock: Number
}));

export const category = db.model("category", new mongoose.Schema({
    category: String,
    creationTime: {
        type: Date,
        default: new Date()
    },
    disabled: {
        type: Boolean,
        default: false
    }
}));

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
        }
    ]
}));

export const orders = db.model("orders", new mongoose.Schema({
    UID: String,
    orders: [
        {
            products: Array,
            address: Object,
            trackingID: String,
            status: {
                type: String,
                default: 'pending'
            },
            paymentType: String,
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