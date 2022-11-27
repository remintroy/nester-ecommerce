import * as cart from './cart.js';
import * as address from './address.js';
import * as orders from './orders.js';
import * as auth from './auth.js';
import * as db from './schema.js';

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
export const veryfyPayment2 = (UID, id, orderID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await orders.paymentConfirmPaypal(UID, id, orderID);
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
export const returnOrder = async (UID, orderID, PID) => {
    try {
        return await orders.returnOrderByUID(UID, orderID, PID);
    } catch (error) {
        throw error;
    }
}
export const updateUserData = (UID, { fNameInput, lNameInput, displayNameInput, emailInput, phoneInput, currentPasswordInput, newPasswordInput, confirmPasswordInput }) => {
    return new Promise(async (resolve, reject) => {
        try {
            // stage one of validatior
            let name = '';
            if (fNameInput && lNameInput) {
                name = fNameInput?.trim() + " " + lNameInput?.trim();
            } else if (fNameInput || lNameInput) {
                throw 'First name and last name required';
            };
            const userOutputA = await auth.validatior({
                UID: UID,
                name: name,
                email: emailInput,
                phone: phoneInput,
            }, {}, 'updateUser');
            try {
                // statge two of validation
                const userOutputB = await auth.validatior({ name: displayNameInput });

                if (userOutputB?.name) userOutputA.displayName = userOutputB.name;

                try { // stage three of validation --password
                    const userOutputC = await auth.validatior({ email: userOutputA.email, password: currentPasswordInput }, {}, 'login');

                    if (userOutputC.password) {
                        try { // stage four of validation
                            if (newPasswordInput == confirmPasswordInput) {
                                const newPassword = await auth.validatior({ password: confirmPasswordInput }, {}, 'updateLogin');
                                userOutputA.password = newPassword?.password;
                            } else {
                                throw `password dosen't match`;
                            };
                        } catch (error) { // stage 4 err
                            reject('Bad password');
                        };
                    } else if (currentPasswordInput) {
                        reject('Incorrect password');
                    };

                } catch (error) { // stage 3 err
                    // do nothing
                };

                try { // final stage

                    const dataToSave = {};

                    Object.keys(userOutputA).forEach(key => {
                        if (userOutputA[key]) dataToSave[key] = userOutputA[key];
                    });

                    const updated = await db.users.updateOne({ UID: userOutputA.UID }, {
                        $set: dataToSave
                    });

                    resolve('Updated succesfully');

                } catch (error) { // final stage err
                    reject('Error updating data');
                };

            } catch (error) { // statge 2 err
                reject('Enter a valid display name');
            };
        } catch (error) { // stage 1 err
            reject(error);
        };
        resolve('men at work')
    });
};

async function test() {
    try {
        const data = await auth.validatior({
            UID: '6pxw23gPVG0AlKh3IE6or782V',
            password: 'haiplzgivemeahash'
        }, {
            UIDRequired: true
        }, 'login');
        console.log('TEST_RESULT => ', data);
    } catch (error) {
        console.log("TEST_ERR => ", error);
    };
};
// test()