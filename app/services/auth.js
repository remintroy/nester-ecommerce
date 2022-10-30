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
        let adminUser = await db.adminUser.find({ adminID: req.session.admin }, { password: 0 });
        req.admin = adminUser.length != 0 ?
            adminUser[0] :
            falseMaker();
    } else {
        req.admin = falseMaker();
    };

    if (req.session.user) {
        let user = await db.users.find({ UID: req.session.user }, { password: 0 });
        req.user = user.length != 0 ?
            user[0] :
            falseMaker();
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
        res.redirect('/login');
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
 * @param {Object} requiredIn
 * @param {string} requiredIn.emailRequired
 * @param {string} requiredIn.passwordRequired
 * @param {string} requiredIn.roleRequired
 * @param {string} requiredIn.UIDRequired
 * @param {string} requiredIn.nameRequired
 * @param {string} typeOfValidation
 */
export function validatior(data, requiredIn, typeOfValidation) {

    const email = data.email ? data.email.toLocaleLowerCase() : "";
    const password = data.password ? data.password : '';
    const role = data.role ? data.role : '';
    const UID = data.UID ? data.UID : '';
    const name = data.name ? data.name : '';

    const required = requiredIn ? requiredIn : {};
    const emailRequired = required.emailRequired ? true : false;
    const passwordRequired = required.passwordRequired ? true : false;
    const roleRequired = required.roleRequired ? true : false;
    const UIDRequired = required.UIDRequired ? true : false;
    const nameRequired = required.nameRequired ? true : false;

    let output = {
        name: null,
        email: null,
        password: null,
        UID: null,
        role: null
    };

    return new Promise(async (resolve, reject) => {

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
                                reject('Email aready exists');
                                return 0;
                            };
                        } catch (error) {
                            console.error(error)
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

        if (passwordRequired || password.length >= 6) {
            if (password.length == 0) {
                reject("password field cannot be empty");
                return 0;
            } else if (password.length >= 6) {
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
                reject('Password must contain 6 characters');
                return 0;
            };
        };

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

                    if (UID.length == 25) {
                        // good UID

                        let UIDFromDB = typeOfValidation == 'adminLoign' ?
                            await db.adminUser.find({ adminID: UID }) :
                            await db.users.find({ UID: UID });

                        if (UIDFromDB.length > 0) {
                            // good UID
                        } else {
                            reject("UID is not valid");
                            return 0;
                        };
                        output.UID = UID;
                    };
                };
            };
        };

        if (nameRequired || name.length > 0) {
            if (name.length == 0) {
                reject("Name is required");
                return 0;
            } else {
                output.name = name;
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

export const adminLogout = (req,res) => {
    req.session.admin = null;
    res.send({status:'error',message:"Logout success"});
};



export const signInWithGoogle = ({ idToken, accessToken, typeOfLogin }) => {
    firebase.signInWithGoogleSDK({ idToken: idToken })
};



// test playgound --dev
async function test() {
    try {

        let output = await validatior(
            {
                email: 'remin@gmail.com',
                password: 'reminremin'
            },
            {
                emailRequired: true,
                passwordRequired: true
            },
            "adminLogin"
        );

        console.log(output)

    } catch (error) {
        console.log('Error => ', error);
    }
}

// test();