import * as cart from './cart.js';
import * as address from './address.js';
import * as orders from './orders.js';

// cart 
export const addProductToCart = (UID, PID, quantity) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await cart.addProduct(UID, PID, quantity);
            resolve(result);
        } catch (error) {
            reject(error);
        };
    });
};
export const deleteFormCart = (UID, PID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await cart.deleteProduct(UID, PID);
            resolve(result);
        } catch (error) {
            reject(error);
        };
    });
};
export const getAllCartProducts = (UID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const products = await cart.getAllProductsWithTotal(UID);
            resolve(products);
        } catch (error) {
            reject(error);
        };
    });
};

// address
export const addUserAddress = (UID, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const output = await address.add(UID, body);
            resolve(output);
        } catch (error) {
            reject(error);
        };
    });
};
export const updateUserAddress = (UID, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const output = await address.update(UID, body);
            resolve(output);
        } catch (error) {
            reject(error);
        };
    });
};
export const deleteUserAddress = (UID, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const addressOutput = await address.deleteAddress(UID, body);
            resolve(addressOutput);
        } catch (error) {
            reject(error); return 0;
        };
    });
};
export const getAllAddress = (UID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userOutput = await address.getAll(UID);
            resolve(userOutput);
        } catch (error) {
            reject(error);
        };
    });
};

// orders
export const checkoutCart = (UID, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await orders.checkout(UID, body);
            resolve(result);
        } catch (error) {
            reject(error);
        };
    });
};
export const veryfyPayment = (UID, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await orders.paymentConfirmRazorpay(UID, body);
            resolve(result);
        } catch (error) {
            reject(error);
        };
    });
};
export const cancelOrder = (UID, orderID, PID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await orders.cancelOrderProductWithUID(UID, orderID, PID);
            resolve(result);
        } catch (error) {
            reject(error);
        };
    });
};