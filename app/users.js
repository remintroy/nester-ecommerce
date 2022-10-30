

export const home = (req, res, next) => {
    res.render('users/index', {
        currentPage: 'home'
    });
};
export const shop = (req, res, next) => {
    const currentPage = 'shop';
    res.render('users/shop', {
        currentPage
    });
};
export const product = (req, res, next) => {
    const currentPage = 'product';
    res.render('users/product', {
        currentPage
    });
};
export const cart = (req, res, next) => {
    const currentPage = 'cart';
    res.render('users/cart', {
        currentPage
    });
};
export const wishlist = (req, res, next) => {
    const currentPage = 'wishlist';
    res.render('users/wishlist', {
        currentPage
    });
};
export const dashboard = (req, res, next) => {
    const currentPage = 'dashboard';
    res.render('users/dashboard', {
        currentPage
    });
};
export const login = (req, res, next) => {
    const currentPage = 'login';
    const layout = 'users/auth/layout';
    res.render('users/auth/login', {
        currentPage,
        layout
    });
};