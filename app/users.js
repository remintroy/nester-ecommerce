import * as auth from './services/auth.js';
import * as db from './services/schema.js';
import * as userService from './services/users.js';
import { getAllCountries, getAllCountriesName } from './services/util.js';
import { appConfig } from '../index.js';
import * as orders from './services/orders.js';
import * as address from './services/address.js';

// locals for users
export const localsForUser = async (req, res, next) => {
    try {
        if (req.user) res.locals.cartProducts = await userService.getAllCartProducts(req.user?.UID);
        res.locals.categorys = await db.category.find();
        res.locals.user = req.user;
        res.locals.appName = appConfig.name;
        next();
    } catch (error) {
        console.log(error)
    };
};

// auth - pages
export const login = (req, res) => {
    res.locals.currentPage = 'login';
    res.locals.layout = 'users/auth/layout';
    res.render('users/auth/login');
};
export const signup = async (req, res) => {
    res.locals.currentPage = 'signup';
    res.locals.layout = 'users/auth/layout';
    res.render('users/auth/signup');
};
export const loginWithOtp = (req, res) => {
    res.locals.layout = 'users/auth/layout';
    res.render('users/auth/otp');
};

// auth - api's
export const signupAPI = async (req, res) => {
    try {
        const result = await auth.userSignupWithEmail(req.body);
        req.session.user = result.UID;
        res.send({ status: 'good', message: "Login success", action: '/' });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const loginAPI = async (req, res) => {
    try {
        const result = await auth.userLoginWithEmail(req.body);
        req.session.user = result.UID;
        res.send({ status: 'good', message: "Login success", action: '/' });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const logoutAPI = async (req, res) => {
    try {
        req.session.user = false;
        res.send({ status: 'good', message: "Logout success", action: '/user_signin' });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const loginWithGoogleAPI = async (req, res) => {
    try {
        const idToken = req.body.idToken;
        const output = await auth.signInWithGoogle({ idToken: idToken });
        req.session.user = output;
        res.send({ status: 'good', message: 'Login success', action: '/' });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const loginWithOtpAPI = async (req, res) => {
    try {
        const userDataFromOTP = await auth.signInWithOTP({ idToken: req.body.idToken });
        req.session.user = userDataFromOTP;
        res.send({ status: 'good', message: 'SignIn success', action: '/' });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};

// common - pages
export const home = (req, res) => {
    res.locals.user = req.user;
    res.currentPage = 'home';
    res.render('users/index');
};
export const shop = async (req, res) => {
    try {
        const products = await db.products.find();
        res.locals.currentPage = 'shop';
        res.locals.products = products;
        res.render('users/shop');
    } catch (error) {
        res.locals.message = `Can't read product data from db `;
        res.locals.code = 500;
        res.render('users/404');
    };
};
export const product = async (req, res) => {

    const currentPage = 'product';
    const PID = req.params.id;

    try {

        const productData = await db.products.findOne({ PID: PID });

        res.render('users/product', {
            currentPage,
            user: req.user,
            product: productData
        });

    } catch (error) {
        res.render('users/404', {
            message: `Can't read product data from db `,
            code: 500
        });
    };



};
export const cart = async (req, res) => {
    res.locals.currentPage = 'cart';
    try {
        res.render('users/cart');
    } catch (error) {
        res.locals.message = `Can't read product data from db `;
        res.code = 500;
        res.render('users/404');
    };
};
export const wishlist = (req, res) => {
    res.locals.currentPage = 'wishlist';
    res.render('users/wishlist');
};
export const dashboard = async (req, res) => {
    try {
        res.locals.orders = await orders.getByUID(req?.user?.UID);
        res.locals.currentPage = 'dashboard';
        res.render('users/dashboard');
    } catch (error) {
        res.locals.code = '500';
        res.locals.message = error;
        res.render('users/404');
    };
};
export const checkout = async (req, res) => {
    try {
        const UID = req.user.UID;
        res.locals.country = await getAllCountries();
        res.locals.address = await userService.getAllAddress(UID);
        res.locals.currentPage = 'checkout';
        res.render('users/checkout');
    } catch (error) {
        res.locals.message = "Cant display this page now...";
        res.locals.error = 'Faild to fetch address related data form database'
        res.render('users/404');
    };
};
export const ordersPg = async (req, res) => {
    try {
        res.locals.orders = await orders.getByUIDEach(req?.user?.UID);
        res.locals.currentPageA = 'dashboard';
        res.locals.currentPage = 'orders';
        res.render('users/dashboard');
    } catch (error) {
        res.locals.message = "Cant display this page now...";
        res.locals.error = 'Faild to fetch orders related data form database'
        res.render('users/404');
    };
};
export const addressPg = async (req, res) => {
    try {
        res.locals.address = await address.getAll(req?.user?.UID);
        res.locals.currentPageA = 'dashboard';
        res.locals.currentPage = 'address';
        res.render('users/dashboard');
    } catch (error) {
        res.locals.message = "Cant display this page now...";
        res.locals.error = 'Faild to fetch address related data form database'
        res.render('users/404');
    };
};

// common - api's
export const addTOCartAPI = async (req, res) => {
    try {
        const PID = req.body.PID; // form request
        const UID = req.user.UID; // form session
        const quantity = req.body?.quantity ? req.body.quantity : null; // from request

        // adds product to cart or if exist updates the quantity
        const output = await userService.addProductToCart(UID, PID, quantity);

        res.send({ status: 'good', message: output });

    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const deleteFormCartAPI = async (req, res) => {
    try {
        const PID = req.body.PID; // form request
        const UID = req.user.UID; // form session

        // adds product to cart or if exist updates the quantity
        const output = await userService.deleteFormCart(UID, PID);

        res.send({ status: 'good', message: output });

    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const getAllProductsFormCartAPI = async (req, res) => {
    try {
        const UID = req.user.UID; // form session

        // adds product to cart or if exist updates the quantity
        const output = await userService.getAllCartProducts(UID);

        res.send({ status: 'good', message: output });

    } catch (error) {
        console.log('error => ', error);
        res.send({ status: 'error', message: error });
    };
};
export const addUserAddressAPI = async (req, res) => {
    try {
        const UID = req.user.UID; // form session
        // adds product to cart or if exist updates the quantity
        const output = await userService.addUserAddress(UID, req.body);

        res.send({ status: 'good', message: output });
    } catch (error) {
        console.log('error => ', error);
        res.send({ status: 'error', message: error });
    };
};
export const updateUserAddressAPI = async (req, res) => {
    try {
        const UID = req.user.UID; // form session
        // adds product to cart or if exist updates the quantity
        const output = await userService.updateUserAddress(UID, req.body);

        res.send({ status: 'good', message: output });
    } catch (error) {
        console.log('error => ', error);
        res.send({ status: 'error', message: error });
    };
};
export const deleteUserAddressAPI = async (req, res) => {
    try {
        const UID = req.user.UID; // form session
        // adds product to cart or if exist updates the quantity
        const output = await userService.deleteUserAddress(UID, req.body);

        res.send({ status: 'good', message: output });
    } catch (error) {
        console.log('error => ', error);
        res.send({ status: 'error', message: error });
    };
};
export const checkoutCartProductsAPI = async (req, res) => {
    try {
        const UID = req.user.UID; // form session
        // adds product to cart or if exist updates the quantity
        const output = await userService.checkoutCart(UID, req.body);
        res.send({ status: 'success', message: output, action: '/dashboard/orders' });
    } catch (error) {
        console.log('error => ', error);
        res.send({ status: 'error', message: error });
    };
};
export const cancelOrderAPI = async (req, res) => {
    try {
        // UID form session 
        const UID = req.user.UID;
        //...
        const result = await userService.cancelOrder(UID, req.body.orderID, req.body.PID);
        res.send({ status: 'good', message: result });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};