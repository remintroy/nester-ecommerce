import * as db from './schema.js';
import { randomId } from './util.js';
import bCrypt from 'bcryptjs';
import * as firebase from './firebase.js';

/**
 * this function runs as the first level middleware
 * this function initialize authentication by adding auth state to request object
 * @param {Request} request
 */
export const initAuth = async (req, res, next) => {

    let falseCounter = 0;

    const falseMaker = () => {
        falseCounter = falseCounter + 1;
        return false;
    };

    if (req.session.admin) {
        try {
            let adminUser = await db.adminUser.find({ adminID: req.session.admin }, { password: 0 });
            req.admin = adminUser.length != 0 ?
                adminUser[0] :
                falseMaker();
        } catch (error) {
            console.error('InitAuth_ADMIN => ', error);
            req.admin = falseMaker();
        };
    } else {
        req.admin = falseMaker();
    };

    if (req.session.user) {
        try {
            let user = await db.users.find({ UID: req.session.user }, { password: 0 });
            req.user = user.length != 0 ?
                user[0] :
                falseMaker();
        } catch (error) {
            console.error('InitAuth_USER => ', error);
            req.user = falseMaker();
        };
    } else {
        req.user = falseMaker();
    };

    req.isLoggedIn = req.session.loggedIn && falseCounter < 2 ? true : false;

    next();
};



export const mustLoginAsAdmin = (req, res, next) => {
    if (req.isLoggedIn && req.admin) {
        next();
    } else {
        res.status(401);
        res.redirect('/admin_login');
    };
};

export const mustLoginAsAdminAPI = (req, res, next) => {
    if (req.isLoggedIn && req.admin) {
        next();
    } else {
        res.status(401);
        res.send({ status: "error", message: 'Unauthorized action' });
    };
};

export const mustLogoutAsAdmin = (req, res, next) => {
    if (!req.admin) {
        next();
    } else {
        res.status(403);
        res.redirect('/admin_panel/');
    };
};

export const mustLogoutAsAdminAPI = (req, res, next) => {
    if (!req.admin) {
        next();
    } else {
        res.status(403);
        res.send({ status: 'error', message: "Permission denied" });
    };
};



export const mustLoginAsUser = (req, res, next) => {
    if (req.isLoggedIn && req.user) {
        next();
    } else {
        res.status(401);
        res.redirect('/user_signin');
    };
};

export const mustLoginAsUserAPI = (req, res, next) => {
    if (req.isLoggedIn && req.user) {
        next();
    } else {
        res.status(401);
        res.send({ status: 'error', message: 'Unauthorized action' });
    };
};

export const mustLogoutAsUser = (req, res, next) => {
    if (!req.user) {
        next();
    } else {
        res.status(401);
        res.redirect('/');
    };
};

export const mustLogoutAsUserAPI = (req, res, next) => {
    if (!req.user) {
        next();
    } else {
        res.status(403);
        res.send({ status: 'error', message: 'Access denied' });
    };
};



/**
 * this funciton is used to validate form data form client
 * @param {Object} data
 * @param {String} data.email
 * @param {String} data.password
 * @param {String} data.role
 * @param {String} data.UID
 * @param {String} data.name
 * @param {Number} data.phone
 * @param {String} data.cart
 * @param {String} data.address
 * @param {String} data.orders
 * @param {String} data.wishList
 * @param {Object} requiredIn
 * @param {string} requiredIn.emailRequired
 * @param {string} requiredIn.passwordRequired
 * @param {string} requiredIn.roleRequired
 * @param {string} requiredIn.UIDRequired
 * @param {string} requiredIn.nameRequired
 * @param {string} requiredIn.phoneRequired
 * @param {string} requiredIn.cartRequired
 * @param {string} requiredIn.addressRequired
 * @param {string} requiredIn.ordersRequired
 * @param {string} requiredIn.wishListRequired
 * @param {string} typeOfValidation
 */
export function validatior(data, requiredIn, typeOfValidation) {

    const email = data.email ? data.email.toLocaleLowerCase() : "";
    const password = data.password ? data.password : '';
    const role = data.role ? data.role : '';
    const UID = data.UID ? data.UID : '';
    const name = data.name ? data.name.toLocaleLowerCase() : '';
    const phone = data.phone ? data.phone : '';
    const cart = data.cart ? data.cart : '';
    const address = data.address ? data.address : '';
    const orders = data.orders ? data.orders : '';
    const wishList = data.wishList ? data.wishList : '';

    const required = requiredIn ? requiredIn : {};
    const emailRequired = required.emailRequired ? true : false;
    const passwordRequired = required.passwordRequired ? true : false;
    const roleRequired = required.roleRequired ? true : false;
    const UIDRequired = required.UIDRequired ? true : false;
    const nameRequired = required.nameRequired ? true : false;
    const phoneRequired = required.phoneRequired ? true : false;
    const cartRequired = required.cartRequired ? true : false;
    const addressRequired = required.addressRequired ? true : false;
    const ordersRequired = required.ordersRequired ? true : false;
    const wishListRequired = required.wishListRequired ? true : false;

    let output = {
        name: null,
        email: null,
        password: null,
        UID: null,
        role: null,
        phone: null,
        cart: null,
        address: null,
        orders: null,
        wishList: null
    };

    const MIN_NAME_LENGTH = 2;
    const UID_LENGTH = 25;
    const CARTID_LENGTH = 34;
    const ADDRESSID_LENGTH = 10;
    const ORDERID_LENGTH = 34;
    const WISHLISTID_LENGTH = 34;
    const MIN_PASSWORD_LENGTH = 6;

    return new Promise(async (resolve, reject) => {

        if (UIDRequired || UID.length > 0 || typeOfValidation == 'signup') {
            if (typeOfValidation == 'signup') {

                let uid = '';
                do {
                    uid = randomId(25);
                } while (await db.users.find({ UID: uid }).length > 0);

                output.UID = uid;
            } else {

                if (UID.length == 0) {
                    reject("UID required");
                    return 0;
                } else {

                    if (UID.length == UID_LENGTH) {
                        // good UID

                        let UIDFromDB = typeOfValidation == 'adminLoign' ?
                            await db.adminUser.find({ adminID: UID }) :
                            await db.users.find({ UID: UID });

                        if (UIDFromDB.length > 0) {
                            // good UID
                        } else {
                            reject("UID is not valid"); return 0;
                        };
                        output.UID = UID;
                    } else {
                        reject("Invalid UID"); return 0;
                    };
                };
            };
        };

        if (emailRequired || email.length >= 5) {

            if (email.length == 0) {
                reject("Email field cannot be empty");
                return 0;
            } else {

                if (email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {

                    if (typeOfValidation == 'signup' || typeOfValidation == 'updateUser') {
                        try {

                            let emailIn = await db.users.find({ email: email });

                            if (emailIn.length > 0) {
                                let rejectMessage = emailIn[0].UID == UID && emailIn[0].email == email ?
                                    'Enter a different email to update' :
                                    'Email aready exists';
                                reject(rejectMessage); return 0;
                            };
                        } catch (error) {
                            console.error('validatorUpateEmail_DB err => ', error)
                        };
                    };

                    if (typeOfValidation == 'login' || typeOfValidation == 'adminLogin') {
                        try {

                            let emailIn = typeOfValidation == 'adminLogin' ?
                                await db.adminUser.find({ email: email }) :
                                await db.users.find({ email: email });

                            if (emailIn.length == 0) {
                                reject('Account not exists');
                                return 0;
                            };

                        } catch (error) {
                            console.error(error)
                        };
                    };

                    output.email = email;
                } else {
                    reject("Enter a valid email");
                    return 0;
                };
            };
        };

        if (passwordRequired || password.length > 0) {
            if (password.length == 0) {
                reject("Password field cannot be empty");
                return 0;
            } else if (password.length >= MIN_PASSWORD_LENGTH) {
                // good password
                if (typeOfValidation == 'login' || typeOfValidation == 'adminLogin') {
                    try {

                        let passwordHashFromDb = typeOfValidation == 'adminLogin' ?
                            await db.adminUser.findOne({ email: email }, { password: 1, _id: 0 }) :
                            await db.users.findOne({ email: email }, { password: 1, _id: 0 });

                        try {

                            let matched = await bCrypt.compare(password, passwordHashFromDb.password);

                            output.password = matched;

                        } catch (error) {
                            console.log(error);
                        };

                    } catch (error) {
                        console.error(error);
                    };

                } else {
                    let passwordHash = await bCrypt.hash(password, 10);
                    output.password = passwordHash;
                };
            } else {
                reject(`Password must contain ${MIN_PASSWORD_LENGTH} characters`);
                return 0;
            };
        };

        if (nameRequired || name.length > 0) {
            if (name.length == 0) {
                reject("Name is required"); return 0;
            } else if (name.length >= MIN_NAME_LENGTH) {

                if (name.match(/^[a-zA-Z]+(([a-zA-Z ])?[a-zA-Z]*)*$/g)) {
                    output.name = name;
                } else {
                    reject('Enter a valid name'); return 0;
                };

            } else {
                reject(`Name must contain ${MIN_NAME_LENGTH} characters`); return 0;
            };
        };

        if (roleRequired || role.length > 0) {

            if (role.length == 0) {
                reject("Role required");
                return 0;
            } else {

                if (role == 'A' || role == 'U') {
                    // good role
                    output.role = role;
                } else {
                    reject("Invalid role");
                    return 0;
                };

            };

        };

        if (phone || phoneRequired) {
            if (phone.length == 0) {
                reject('Phone number required'); return 0;
            } else if (phone.length >= 10) {

                if (phone.match(/^\+?[1-9][0-9]{7,14}$/)) {

                    if (typeOfValidation == "updateUser" || typeOfValidation == 'signup') {
                        try {

                            const phoneIn = await db.users.find({ phone: phone });

                            if (phoneIn.length > 0) {
                                let rejectMessage = phoneIn[0].UID == UID && phoneIn[0].phone == phone ?
                                    'Enter a different phone number to update' :
                                    'Phone number already registered';
                                reject(rejectMessage); return 0;
                            };

                        } catch (error) {
                            console.error('ValidatorPhoneUpdateUser_DB err => ', error); return 0;
                        };
                    };

                    output.phone = phone;

                } else {
                    reject('Enter your phone number correctly, No country code needed'); return 0;
                };
            } else {
                reject('Phone number must contain 10 characters'); return 0;
            };
        };

        if (cart || cartRequired) {
            if (typeOfValidation == 'signup') {

                let ID = '';

                do {
                    ID = randomId(CARTID_LENGTH);
                } while (await db.users.find({ cart: ID }).length > 0);

                output.cart = ID;

            } else {
                if (cart.length == 0) {
                    reject('CartID Required'); return 0;
                } else if (cart.length == CARTID_LENGTH) {
                    output.cart = cart;
                } else {
                    reject('Provide a valid CartID'); return 0;
                };
            };
        };

        if (address || addressRequired) {
            if (typeOfValidation == 'signup') {

                let ID = '';

                do {
                    ID = randomId(ADDRESSID_LENGTH);
                } while (await db.users.find({ address: ID }).length > 0);

                output.address = ID;

            } else {
                if (typeOfValidation == 'addressUpdate' && address.length == 0) {
                    output.address = randomId(ADDRESSID_LENGTH);
                } else {
                    if (address.length == 0) {
                        reject('AddressID Required'); return 0;
                    } else if (address.length == ADDRESSID_LENGTH) {
                        output.address = address;
                    } else {
                        reject('Provide a valid AddressID'); return 0;
                    };
                }
            };
        };

        if (orders || ordersRequired) {
            if (typeOfValidation == 'signup') {

                let ID = '';

                do {
                    ID = randomId(ORDERID_LENGTH);
                } while (await db.users.find({ orders: ID }).length > 0);

                output.orders = ID;

            } else {
                if (orders.length == 0) {
                    reject('OrderID Required'); return 0;
                } else if (orders.length == ORDERID_LENGTH) {
                    output.orders = orders;
                } else {
                    reject('Provide a valid OrderID'); return 0;
                };
            };
        };

        if (wishList || wishListRequired) {
            if (typeOfValidation == 'signup') {

                let wishID = '';

                do {
                    wishID = randomId(WISHLISTID_LENGTH);
                } while (await db.users.find({ wishList: wishID }).length > 0);

                output.wishList = wishID;

            } else {

                if (wishList.length == 0) {
                    reject('WishListID Required'); return 0;
                } else {
                    if (wishList.length == WISHLISTID_LENGTH) {
                        output.wishList = wishList;
                    } else {
                        reject('Provide a valid WishListID'); return 0;
                    };
                };

            };
        };

        resolve(output);
    });
};

/**
 * 
 * @param {Object} requestBody 
 * @param {string} requestBody.email
 * @param {string} requestBody.password
 * @returns userdata if good, else errors
 */
export const adminLogin = ({ email, password }) => {
    return new Promise(async (resolve, reject) => {

        try {

            let output = await validatior(
                {
                    email: email,
                    password: password
                },
                {
                    emailRequired: true,
                    passwordRequired: true
                },
                'adminLogin'
            );

            if (output.password) {
                resolve(await db.adminUser.findOne({ email: output.email }));
            } else {
                reject('Wrong password');
            };

        } catch (error) {
            console.log('Error => ', error);
            reject(error);
        };

    });
};

export const adminLogout = (req, res) => {
    req.session.admin = null;
    res.send({ status: 'good', message: "Logout success" });
};

export const userLoginWithEmail = ({ email, password }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let output = await validatior(
                {
                    email: email,
                    password: password
                },
                {
                    emailRequired: true,
                    passwordRequired: true
                },
                'login'
            );

            if (output.password == true) {
                try {

                    let userdata = await db.users.findOne({ email: email }, { password: 0 });
                    resolve(userdata);

                } catch (error) {
                    console.error('UserLogin_DB err => ', error);
                };
            } else {
                reject('Incorrect password'); return 0;
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};

export const userSignupWithEmail = ({ email, name, password, phone }) => {
    return new Promise(async (resolve, reject) => {
        try {

            let output = await validatior(
                {
                    email: email,
                    name: name,
                    password: password,
                    phone: phone,
                },
                {
                    emailRequired: true,
                    nameRequired: true,
                    passwordRequired: true,
                    phoneRequired: true,
                    UIDRequired: true,
                },
                'signup'
            );

            let userData = await db.users({
                email: output.email,
                password: output.password,
                name: output.name,
                phone: output.phone,
                UID: output.UID,
                loginProvider: 'email',
            });

            userData.save();

            resolve(userData); return 0;

        } catch (error) {
            reject(error); return 0;
        };
    });
};

export const userDataUpdate = ({ UID, email, password, name, phone, blocked }) => {
    return new Promise(async (resolve, reject) => {

        try {

            // updatable: email, password, name, phone, blocked
            const output = await validatior(
                {
                    UID: UID,
                    email: email,
                    password: password,
                    name: name,
                    phone: phone,
                },
                {
                    UIDRequired: true
                },
                'updateUser'
            );

            const result = {};
            const keys = Object.keys(output);

            for (let i = 0; i < keys.length; i++) {
                if (output[keys[i]] && keys[i] != "UID") {
                    result[keys[i]] = output[keys[i]];
                };
            };

            if (blocked) {
                result.blocked = blocked == true ? true : false;
            };

            if (Object.keys(result).length <= 0) {
                reject('Nothing to Update'); return 0;
            };

            try {
                const updated = await db.users.updateOne(
                    {
                        UID: output.UID
                    },
                    {
                        $set: result
                    }
                );
                // console.log('updated => ', updated);
                // console.log('output => ', output);
                // console.log('result => ', result);
            } catch (error) {
                console.error("UpdateUserData_DB err => ", error);
            };

        } catch (error) {
            reject(error);
        };

    });
};


export const signInWithGoogle = ({ idToken }) => {
    firebase.signInWithGoogleSDK({ idToken: idToken })
};
