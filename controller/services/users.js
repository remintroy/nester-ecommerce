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

// update userdata ---
export const updateUserData = async (UID, { fNameInput, lNameInput, displayNameInput, emailInput, phoneInput, currentPasswordInput, newPasswordInput, confirmPasswordInput }) => {
    try {

        // getting and formatting first name and last name to one field
        let name = fNameInput && lNameInput
            ? fNameInput?.trim() + " " + lNameInput?.trim()
            : fNameInput ?? lNameInput;

        // validating incoming userData 
        let userOutput = await auth.validatior({
            UID: UID,
            name: name,
            email: emailInput,
            phone: phoneInput,
        }, {}, 'updateUser');

        // validating and assigning display name to main user output
        const validataDisplayName = await auth.validatior({ name: displayNameInput });
        userOutput = { ...userOutput, displayName: validataDisplayName.name };

        // fetching user data from db
        let userDataFromDb;

        try {
            userDataFromDb = await db.users.find({ UID: userOutput.UID });
        } catch (error) {
            // handling error
            throw 'Error fetching user data';
        };

        // checks if there is something on current password
        if (currentPasswordInput) {
            // checks and only continue if user is a login with email user
            if (userDataFromDb[0].loginProvider != 'email') throw "Your are not logged in with email so you can't edit password";
            // validating password
            const passwordChecker = await auth.validatior({ UID: UID, password: currentPasswordInput }, {}, 'login');
            // finding wrong password
            if (!passwordChecker.password) throw 'Incorrect password';
            // cheks if confirm password matchers with new password
            if (newPasswordInput != confirmPasswordInput) throw "Confirm password doesn't match"
            // creating hash for new password
            const newPassword = await auth.validatior({ password: confirmPasswordInput }, {}, 'updateLogin');
            // adding new password to main user object
            userOutput = { ...userOutput, password: newPassword.password };
        };


        const dataToSave = {};
        const keys = Object.keys(userOutput);

        if (userOutput['email'] && userDataFromDb[0].loginProvider != 'email') {
            throw 'Editing email is not availabe for your account';
        };

        // filtering empty keys from userOutput object 
        for (const key of keys) {
            if (userOutput[key]) dataToSave[key] = userOutput[key];
        };

        try {
            // updaitng userData;
            const updated = await db.users.updateOne({ UID: userOutput.UID }, {
                $set: dataToSave
            });

            // response with message
            return 'Updated succesfully';

        } catch (error) {
            // handling error while user data updation
            throw 'Failed to update user data';
        };

    } catch (error) {
        // handling error
        throw error;
    };
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