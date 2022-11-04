import * as auth from './services/auth.js';
import * as db from './services/schema.js';
import * as userService from './services/users.js';

const getCategorys = async () => {
    return await db.category.find();
};


// auth - pages
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
export const loginWithOtp = (req, res) => {
    res.render('users/auth/otp', {
        layout: 'users/auth/layout'
    });
};

// auth - api's
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
    getCategorys().then(categorys => {
        res.render('users/index', {
            currentPage: 'home',
            user: req.user,
            categorys: categorys
        });
    });
};
export const shop = async (req, res) => {
    const currentPage = 'shop';

    try {

        let products = await db.products.find();

        getCategorys().then(categorys => {

            res.render('users/shop', {
                currentPage,
                user: req.user,
                products: products,
                categorys
            });

        });

    } catch (error) {
        res.render('users/404', {
            message: `Can't read product data from db `,
            code: 500
        });
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
export const cart = (req, res) => {
    const currentPage = 'cart';
    getCategorys().then(categorys => {
        res.render('users/cart', {
            currentPage,
            user: req.user,
            categorys
        });
    });
};
export const wishlist = (req, res) => {
    const currentPage = 'wishlist';
    getCategorys().then(categorys => {
        res.render('users/wishlist', {
            currentPage,
            user: req.user,
            categorys
        });
    });
};
export const dashboard = (req, res) => {
    const currentPage = 'dashboard';
    getCategorys().then(categorys => {
        res.render('users/dashboard', {
            currentPage,
            user: req.user,
            categorys: categorys
        });
    })
};
export const checkout = (req, res) => {
    const currentPage = 'checkout';
    getCategorys().then(categorys => {
        res.render('users/checkout', {
            currentPage,
            user: req.user,
            categorys
        });
    });
};

// common - api's
export const addTOCartAPI = async (req, res) => {

    try {

        const PID = req.body.PID; // form request
        const UID = req.user.UID; // form session
        const quantity = req.body?.quantity ? req.body.quantity : null;

        // adds product to cart or if exist updates the quantity
        const output = await userService.addProductToCart(UID, PID, quantity);

        res.send({ status: 'good', message: output });

    } catch (error) {
        console.log('error => ', error);
        res.send({ status: 'error', message: error });
    };
    
};