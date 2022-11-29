import * as db from './schema.js';
import { randomId, getCountryByName, nameFormatter, getCountryBycode } from './util.js';
import bCrypt from 'bcryptjs';
import * as firebase from './firebase.js';
import * as util from './util.js';
import * as emailService from './email.js';

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

    // check admin account logged in or not
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

    // check user account logged in or not
    if (req.session.user) {
        try {

            let user = await db.users.find({ UID: req.session.user }, { password: 0 });

            function blockedChecker(userData) {
                return userData?.blocked ? falseMaker() : userData;
            };

            req.user = user.length != 0 ?
                blockedChecker(user[0]) :
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
 * @param {String} data.country
 * @param {Object} requiredIn
 * @param {string} requiredIn.emailRequired
 * @param {string} requiredIn.passwordRequired
 * @param {string} requiredIn.roleRequired
 * @param {string} requiredIn.UIDRequired
 * @param {string} requiredIn.nameRequired
 * @param {string} requiredIn.phoneRequired
 * @param {string} requiredIn.cartRequired
 * @param {string} requiredIn.countryRequired
 * @param {string} typeOfValidation
 */
export function validatior(data, requiredIn, typeOfValidation) {

    const email = data.email ? data.email.toLocaleLowerCase() : "";
    const password = data.password ? data.password : '';
    const role = data.role ? data.role : '';
    const UID = data.UID ? data.UID : '';
    const name = data.name ? nameFormatter(data.name) : '';
    const phone = data.phone ? data.phone : '';
    const cart = data.cart ? data.cart : '';
    const country = data.country ? data.country : '';

    const required = requiredIn ? requiredIn : {};
    const emailRequired = required.emailRequired ? true : false;
    const passwordRequired = required.passwordRequired ? true : false;
    const roleRequired = required.roleRequired ? true : false;
    const UIDRequired = required.UIDRequired ? true : false;
    const nameRequired = required.nameRequired ? true : false;
    const phoneRequired = required.phoneRequired ? true : false;
    const cartRequired = required.cartRequired ? true : false;
    const countryRequired = required.countryRequired ? true : false;

    let output = {
        name: null,
        email: null,
        password: null,
        UID: null,
        role: null,
        phone: null,
        cart: null,
        country: null,
    };

    const MIN_NAME_LENGTH = 2;
    const UID_LENGTH = 25;
    const GOOGLE_UID_LENGTH = 28;
    const PHONE_UID_LENGTH = 28;
    const CARTID_LENGTH = 34;
    const MIN_PASSWORD_LENGTH = 6;

    return new Promise(async (resolve, reject) => {

        // validates all uid accordin to the type of validation
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

                    const lengthTOCheck = typeOfValidation == 'google' ?
                        GOOGLE_UID_LENGTH :
                        typeOfValidation == 'phone' ?
                            PHONE_UID_LENGTH :
                            UID_LENGTH;

                    if (
                        UID.length == GOOGLE_UID_LENGTH ||
                        UID.length == PHONE_UID_LENGTH ||
                        UID.length == UID_LENGTH
                    ) {
                        // good UID

                        if (typeOfValidation == 'google' || typeOfValidation == 'phone') {
                            // UID from google or UID from phone } firebase;

                        } else {
                            let UIDFromDB = typeOfValidation == 'adminLoign' ?
                                await db.adminUser.find({ adminID: UID }) :
                                await db.users.find({ UID: UID });

                            if (UIDFromDB.length > 0) {
                                // good UID
                            } else {
                                reject("UID is not valid"); return 0;
                            };
                        };
                        //...
                        output.UID = UID;
                    } else {
                        reject("Invalid UID"); return 0;
                    };
                };
            };
        };

        // email validation accordin to the type of validation
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
                                // let rejectMessage = emailIn[0].UID == UID && emailIn[0].email == email ?
                                //     'Enter a different email to update' :
                                //     'Email aready exists';
                                // reject(rejectMessage); return 0;

                                if (emailIn[0].UID == UID && emailIn[0].email == email) {

                                } else {
                                    reject('Email already exists'); return 0;
                                };
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
                    //...
                    output.email = email;
                } else {
                    reject("Enter a valid email");
                    return 0;
                };
            };
        };

        // password validation also creates and compare hashesh
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
                            if (passwordHashFromDb) {
                                let matched = await bCrypt.compare(password, passwordHashFromDb?.password);
                                output.password = matched;
                            } else {
                                let matched = false;
                                output.password = matched;
                            };
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

        // name validation
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

        // role validation admin or user
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

        // phone number validation according to type of validation
        if (phone || phoneRequired) {
            if (phone.length == 0) {
                reject('Phone number required'); return 0;
            } else if ((phone + "").length == 10) {

                if ((phone + "").match(/^\+?[1-9][0-9]{7,14}$/)) {

                    if (typeOfValidation == "updateUser" || typeOfValidation == 'signup' || typeOfValidation == 'google') {
                        try {

                            const phoneIn = await db.users.find({ phone: phone });

                            if (phoneIn.length > 0 && typeOfValidation != 'phone') {
                                // let rejectMessage = phoneIn[0].UID == UID && phoneIn[0].phone == phone ?
                                //     'Enter a different phone number to update' :
                                //     'Phone number already registered';
                                // reject(rejectMessage); return 0;
                                if (phoneIn[0].UID == UID && phoneIn[0]?.phone == phone) {

                                } else {
                                    reject('Phone number already registerd'); return 0;
                                };
                            };
                        } catch (error) {
                            console.error('ValidatorPhoneUpdateUser_DB err => ', error); return 0;
                        };
                    } else if (typeOfValidation == 'login') {
                        const phoneIn = await db.users.find({ phone: phone });
                        if (phoneIn.length == 0) { reject('Account not exist'); return 0; }
                    };

                    //..
                    output.phone = phone;
                } else {
                    reject('Enter your phone number correctly, No country code needed'); return 0;
                };
            } else {
                reject('Phone number must contain 10 characters'); return 0;
            };
        };

        // valdiate card id also creates cart id
        if (cart || cartRequired) {
            if (typeOfValidation == 'signup') {

                let ID = '';

                do {
                    ID = randomId(CARTID_LENGTH);
                } while (await db.users.find({ cart: ID }).length > 0);
                //...
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

        // country name validator
        if (country || countryRequired) {
            if ((country + "").length == 0) {
                reject('Country required');
            } else if ((country + "").length == 2) {
                const data = await getCountryBycode(country);
                if (data != null) {
                    output.country = data.name;
                } else {
                    reject('Invalid country');
                };
            } else {
                const data = await getCountryByName(country);
                if (data != null) {
                    output.country = nameFormatter(country);
                } else {
                    reject('Invalid country');
                };
            };
        };

        // return promise with results after validation
        resolve(output);
    });
};


export const mustLoginAsAdmin = (req, res, next) => {
    if (req.admin) {
        next();
    } else {
        res.status(401);
        res.redirect('/admin_login');
    };
};
export const mustLoginAsAdminAPI = (req, res, next) => {
    if (req.admin) {
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
        res.redirect('/');
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
    if (req.user) {
        next();
    } else {
        res.status(401);
        res.redirect('/user_signin');
    };
};
export const mustLoginAsUserAPI = (req, res, next) => {
    if (req.user) {
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
export const userDataUpdate = ({ UID, email, password, name, phone, state }) => {
    return new Promise(async (resolve, reject) => {
        try {
            // updatable: email, password, name, phone, state
            const output = await validatior(
                {
                    UID: UID?.trim(),

                    // 01 of 02 !!! code commented below give permission api to edit sensitive user data 
                    // 01 0f 02 !!! now api only have permisson to block or unblock user 
                    // 01 of 02 !!! if neede remove commented code below

                    // email: email?.trim(),
                    // password: password?.trim(),
                    // name: name?.trim(),
                    // phone: phone?.trim(),
                },
                {

                },
                'updateUser'
            );

            try {
                const result = {};

                // 02 of 02 !!! code commented below give permission api to edit sensitive user data 
                // 02 of 02 !!! now api only have permisson to block or unblock user 
                // 02 of 02 !!! if neede remove commented code below

                // const keys = Object.keys(output);

                // for (let i = 0; i < keys.length; i++) {
                //     if (output[keys[i]] && keys[i] != "UID") {
                //         result[keys[i]] = output[keys[i]];
                //     };
                // };

                if (state) {
                    result.blocked = state == 'disabled' ? true : false;
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
                    resolve('Updated Successfully');
                    // console.log('updated => ', updated);
                    // console.log('output => ', output);
                    // console.log('result => ', result);
                } catch (error) {
                    console.error("UpdateUserData_DB err => ", error);
                };

            } catch (error) {
                reject("Internal error"); return 0;
            };

        } catch (error) {
            reject(error); return 0;
        };
    });
};


export const signInWithGoogle = ({ idToken }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userDataFromGoogle = await firebase.signInWithGoogleSDK({ idToken: idToken });

            const output = await validatior(
                {
                    UID: userDataFromGoogle.uid,
                    email: userDataFromGoogle.email,
                    name: userDataFromGoogle.displayName,
                },
                {
                    UIDRequired: true,
                    emailRequired: true,
                },
                'google'
            );

            try {

                let userDataFromDB = await db.users.find({ email: output.email });

                // email exists
                if (userDataFromDB.length > 0) {

                    // confirms that the user is a google user
                    if (userDataFromDB[0].loginProvider == 'google') {

                        try {

                            const userdata = await db.users.findOne({ UID: output.UID });

                            if (userdata.blocked) {

                                reject("You account is disabled"); return 0;

                            } else {

                                try {
                                    let userDataForLogin = db.users.updateOne(
                                        {
                                            UID: output.UID
                                        },
                                        {
                                            $set: {
                                                lastLogin: new Date()
                                            }
                                        }
                                    );
                                    resolve(userDataFromDB[0].UID);
                                } catch (error) {
                                    console.log('LoginWithGoogle_AuthPG_userUpdate => ', error);
                                    reject('Error Login with google'); return 0;
                                };

                            };

                        } catch (error) {
                            console.log("Blocked_Check_GOOGLE_DB => ", error);
                            reject("Error fetching user data"); return 0;
                        };

                    } else {
                        reject('Email already exist'); return 0;
                    };
                } else {
                    try {

                        let phoneNumberAfterValidaton;

                        try {
                            phoneNumberAfterValidaton = await validatior({ phone: userDataFromGoogle.phoneNumber });
                            phoneNumberAfterValidaton = phoneNumberAfterValidaton.phone;
                        } catch (error) {
                            reject(error); return 0;
                        };

                        let userDataForLogin = db.users({
                            name: output.name,
                            email: output.email,
                            loginProvider: 'google',
                            UID: output.UID,
                            phone: phoneNumberAfterValidaton,
                            emailVerified: userDataFromGoogle.emailVerified,
                        });
                        userDataForLogin.save();
                        resolve(userDataForLogin.UID);
                    } catch (error) {
                        console.log('LoginWithGoogle_AuthPG_userUpdate => ', error);
                        reject('Error creating account with google'); return 0;
                    };
                };

            } catch (error) {
                console.error("LoginWithGoogle_AuthPG_userCheck => ", error);
                reject('Error Login with google'); return 0;
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};

export const signInWithOTP = ({ idToken }) => {
    return new Promise(async (resolve, reject) => {
        try {

            const userDataFromOTP = await firebase.signInWithOTPSDK({ idToken: idToken });

            const phoneNumber = userDataFromOTP.phoneNumber.slice(3);

            const output = await validatior(
                {
                    UID: userDataFromOTP.uid,
                    phone: phoneNumber,
                },
                {
                    UIDRequired: true
                },
                'phone'
            );

            try {

                const userDataFromDB = await db.users.find({ UID: output.UID });

                if (userDataFromDB.length > 0) {
                    // update user

                    if (userDataFromDB[0]?.blocked) {
                        reject("You account is disabled"); return 0;
                    };

                    try {
                        const updateUserData = await db.users.updateOne({ UID: output.UID }, {
                            $set: {
                                lastLogin: new Date()
                            }
                        });

                        resolve(userDataFromDB[0].UID); return 0; // 

                    } catch (error) {
                        console.error('AUTH_OTP_DB_UPDATE => ', error);
                        reject('Error updating user data');
                    };

                } else {
                    // create user
                    try {

                        const toFindExistingPhoneNumber = await db.users.find({ phone: output.phone });

                        if (toFindExistingPhoneNumber.length > 0) {
                            reject('Phone number already registerd');
                        } else {

                            try {

                                const creatingNewUser = await db.users({
                                    phone: output.phone,
                                    email: output.email,
                                    loginProvider: 'phone',
                                    UID: output.UID
                                });

                                creatingNewUser.save();

                                resolve(creatingNewUser.UID); //

                            } catch (error) {
                                console.error('AUTH_OTP_DB_Number_Create => ', error);
                                reject('Error user account');
                            };
                        };

                    } catch (error) {
                        console.error('AUTH_OTP_DB_Number_dup => ', error);
                        reject('Error fetching user data');
                    };
                };

            } catch (error) {
                console.error('AUTH_OTP_DB => ', error);
                reject('Error fectching user data'); return 0;
            };


        } catch (error) {
            reject(error);
        };
    });
};

// login user -------
export const signInInit = async ({ data, type }) => {
    try {
        // primary layer of validation's
        if (!data) throw `Can't signin user with empty data`;
        if (data.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) || data.match(/^\+?[1-9][0-9]{7,14}$/)) { } else throw 'Enter a valid email or Phone number';

        // for find the type of data form input 
        const typeOfIncomingData = data.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) ? 'email' : 'phone';

        const urlID = randomId(20, 'A0');

        // if login type is email
        if (typeOfIncomingData == 'email') {

            // validate data
            const userData = await validatior({ email: data }, { emailRequired: true }, 'login');

            const dataFromDb = await db.users.findOne({ email: userData.email });

            // check if this user is blocked or not
            if (dataFromDb.blocked) throw 'Your account is disabled';

            return {
                data: userData.email,
                code: urlID,
                UID: dataFromDb.UID,
                type: typeOfIncomingData,
                action: `/user_signin/${urlID}`
            };

        } else {
            // if type of ligin is phone

            // validate data
            const userData = await validatior({ phone: data }, { phoneRequired: true }, 'login');

            const dataFromDb = await db.users.findOne({ phone: userData.phone });

            // check if this user is blocked or not
            if (dataFromDb.blocked) throw 'Your account is disabled';

            return {
                data: userData.phone,
                UID: dataFromDb.UID,
                code: urlID,
                type: typeOfIncomingData,
                action: `/user_signin/${urlID}`
            };

        };

    } catch (error) {
        throw error;
    };
};
export const signInPassword = async (data, type, password) => {
    try {

        let email = data?.trim();

        if (type == 'phone') {
            const dataFromDb = await db.users.findOne({ phone: data?.trim() });
            email = dataFromDb.email;
        };

        const userData = await db.users.findOne({ email: email });

        if (userData.blocked) throw 'Your account is disabled';

        let output = await validatior({
            email: email,
            password: password
        }, {
            emailRequired: true,
            passwordRequired: true,
        },
            'login'
        );

        if (!output.password) throw 'Incorrect password';


        return {
            message: 'Login success',
            action: '/',
            UID: userData.UID
        };

        // return  message, action, UID
    } catch (error) {
        throw error;
    };
};
export const sendPasswordForgetEmail = async (data, type, authID) => {

    // generate otp
    const OTP = util.randomId(6, '0');

    try {
        if (type == 'email') {
            const userData = await db.users.findOne({ UID: data.UID });
            const result = await emailService.sendFrogetPasswordOtp(userData.email, OTP);
            if (result.accepted[0]) {
                return {
                    message: 'OTP send',
                    action: `/forget_passowrd/email/${authID}`,
                    OTP: OTP
                };
            } else {
                throw 'Faild to send OTP';
            };
        } else { // TODO : add sms otp
            throw 'Faild to send please try after sometime';
        };
    } catch (error) {
        throw error;
    };
};
export const verfyEmailOTP = async (data, code, authID) => {
    try {
        if (data?.OTP) {

            if (data.OTP == code?.trim()) {

                const resetPasswordID = `${authID}_${util.randomId(30, "A0")}`;

                return {
                    message: 'code vefication success',
                    code: resetPasswordID,
                    action: `/reset_password/${resetPasswordID}`,
                }

            } else {
                throw 'Incorrect code';
            };

        } else {
            throw 'Faild to validate please retry after sometimes';
        };
    } catch (error) {
        throw error;
    };
};
export const resetPasswordUser = async (data, password, resetID) => {
    try {
        if (!data.UID) throw 'Falid to change password please try after sometime';
        const userOutput = await validatior({ password: password });

        try {

            const updatedData = await db.users.updateOne({ UID: data.UID }, {
                $set: {
                    password: userOutput.password
                }
            });

            return {
                UID: data.UID,
                action: '/',
                message: 'password successfully updated'
            };

        } catch (error) {
            console.log(error);
            throw 'Faild to update password kindly retry after sometime';
        };

    } catch (error) {
        throw error;
    };
};