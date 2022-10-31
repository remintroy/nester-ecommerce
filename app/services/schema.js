import mongoose from "mongoose";
import dotenv from 'dotenv';
import * as util from './util.js';

dotenv.config();

const dbLatencyLoggerTime = new Date();
const dbLatencyLogger = () => console.log(`[-] Database connected in : ${new Date() - dbLatencyLoggerTime}ms`);

const db = mongoose.createConnection(process.env.USERDB_URL);

db.on('error', (error) => console.error(error));
db.once('open', () => dbLatencyLogger());

export const users = db.model("user", new mongoose.Schema({
    name: String,
    email: String,
    phone: Number,
    phoneVerified: {
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
    blocked: Boolean,
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
            country: String,
            phone: Number,
            pin: Number,
            state: String,
            landmark: String,
            locality: String,
            email: String
        }
    ]
}));

export const products = db.model("products", new mongoose.Schema({
    PID: String,
    title: String,
    description: String,
    img: Array,
    category: Array,
    price: Number,
    creationTime: {
        type: Date,
        default: new Date()
    },
    offer: Number,
    stock: Number
}));

export const cart = db.model("cart", new mongoose.Schema({
    cartID: String,
    UID: String,
    products: [
        {
            PID: String,
            quantity: Number,
            addedAt: Date,
        }
    ]
}));

export const orders = db.model("orders", new mongoose.Schema({
    orderID: String,
    UID: String,
    products: [
        {
            orderID: String,
            PID: String,
            product: {
            },
            formAddress: String,
            toAdress: String,
            trackingID: String,
            status: String,
            dateOFOrder: Date
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


