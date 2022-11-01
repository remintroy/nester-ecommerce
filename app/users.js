import * as auth from './services/auth.js';


export const home = (req, res) => {
    res.render('users/index', {
        currentPage: 'home',
        user: req.user
    });
};
export const shop = (req, res) => {
    const currentPage = 'shop';
    res.render('users/shop', {
        currentPage,
        user: req.user
    });
};
export const product = (req, res) => {
    const currentPage = 'product';
    res.render('users/product', {
        currentPage,
        user: req.user
    });
};
export const cart = (req, res) => {
    const currentPage = 'cart';
    res.render('users/cart', {
        currentPage,
        user: req.user
    });
};
export const wishlist = (req, res) => {
    const currentPage = 'wishlist';
    res.render('users/wishlist', {
        currentPage,
        user: req.user
    });
};
export const dashboard = (req, res) => {
    const currentPage = 'dashboard';
    res.render('users/dashboard', {
        currentPage,
        user: req.user
    });
};
export const checkout = (req, res) => {
    const currentPage = 'checkout';
    res.render('users/checkout', {
        currentPage,
        user: req.user
    });
};
export const login = (req, res) => {
    const currentPage = 'login';
    const layout = 'users/auth/layout';
    res.render('users/auth/login', {
        currentPage,
        layout
    });
};
export const signup = async (req, res) => {
    const currentPage = 'signup';
    const layout = 'users/auth/layout';
    res.render('users/auth/signup', {
        currentPage: currentPage,
        layout: layout
    });
};
export const signupAPI = async (req, res) => {
    try {

        let result = await auth.userSignupWithEmail(req.body);

        req.session.user = result.UID;

        res.send({ status: 'good', message: "Login success", action: '/' });

    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const loginAPI = async (req, res) => {
    try {

        let result = await auth.userLoginWithEmail(req.body);

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
export const loginWithOtp = (req, res) => {
    res.render('users/auth/otp', {
        layout: 'users/auth/layout'
    });
};
export const loginWithOtpAPI = async (req, res) => {
    try {

        const userDataFromOTP = await auth.signInWithOTP({ idToken: req.body.idToken });

        req.session.user = userDataFromOTP;

        res.send({ status: 'good', message: 'added user', action: '/' });

    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};