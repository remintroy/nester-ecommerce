import * as auth from './services/auth.js';
import { randomId, dataToReadable } from './services/util.js';
import * as db from './services/schema.js';
import * as products from './services/products.js';
import * as orders from './services/orders.js';

const layout = `admin_layout`;

// set up all common locals for render
export const localsForAdmin = async (req, res, next) => {
    res.locals.layout = `admin_layout`;
    res.locals.title = `Admin-panel`;
    res.locals.admin = req.admin;
    next();
};
// warns deprication of a route
export const depricationWarn = async (req, res) => {
    res.locals.message = 'This page is currently unavailable or changed path';
    res.locals.code = 404;
    res.render('admin/404');
};
// admin dashboard
export const dashboard = async (req, res) => {
    try {
        res.locals.title = `Admin-panel`;
        res.locals.admin = req.admin;
        res.locals.currentPage = 'dashboard';
        res.render('admin/dashboard');
    } catch (error) {
        console.error(error);
        res.locals.message = `Internal error`;
        res.locals.code = 500;
        res.render('admin/404');
    };
};
// all user 
export const users = async (req, res) => {
    try {
        const allUsers = await db.users.find({}, { password: 0 });
        const userData = [];

        for (let i = 0; i < allUsers.length; i++) {
            const output = {};

            output.name = allUsers[i].name;
            output.phone = allUsers[i].phone;
            output.email = allUsers[i].email;
            output.loginProvider = allUsers[i].loginProvider;
            output.creationTime = dataToReadable(allUsers[i].creationTime);
            output.lastLogin = dataToReadable(allUsers[i].lastLogin);
            output.blocked = allUsers[i].blocked;
            output.UID = allUsers[i].UID;

            userData.push(output);
        };

        res.locals.users = userData;
        res.locals.currentPage = 'users';
        res.locals.currentPageA = 'users';

        res.render('admin/users');
    } catch (error) {
        res.locals.message = `Can't read user data from db `;
        res.locals.code = 500;
        res.render('admin/404');
    };
};
// all desabled users
export const disabledUsers = async (req, res) => {
    try {
        const allUsers = await db.users.find({}, { password: 0 });
        const userData = [];

        for (let i = 0; i < allUsers.length; i++) {
            const output = {};

            if (!allUsers[i]?.blocked) continue;

            output.name = allUsers[i].name;
            output.phone = allUsers[i].phone;
            output.email = allUsers[i].email;
            output.loginProvider = allUsers[i].loginProvider;
            output.creationTime = dataToReadable(allUsers[i].creationTime);
            output.lastLogin = dataToReadable(allUsers[i].lastLogin);
            output.blocked = allUsers[i].blocked;
            output.UID = allUsers[i].UID;

            userData.push(output);
        };

        res.locals.users = userData;
        res.locals.currentPage = 'diabledUsers';
        res.locals.currentPageA = 'users';

        res.render('admin/users');
    } catch (error) {
        res.locals.message = `Can't read user data from db `;
        res.locals.message = 500;
        res.render('admin/404');
    };
};
// all products
export const products_disp = async (req, res) => {
    try {
        const productData = await db.products.find();
        const output = [];

        productData.forEach((element, index, array) => {
            const keys = Object.keys(element._doc);
            const result = {};

            for (let i = 0; i < keys.length; i++) {
                const CONST_MAX_TITLE_LEN = 50;
                const CONST_MAX_DESCRIPTION_LEN = 30;
                // key is creation time
                result[keys[i]] = keys[i] == 'creationTime' ? // --if-- key is creation time
                    // formatted time to readable
                    dataToReadable(element.creationTime) :
                    result[keys[i]] = keys[i] == 'title' ? // -- else if --
                        // title is more than title len
                        element[keys[i]].length > CONST_MAX_TITLE_LEN ? // --if--
                            // creationTime true and title is above the limit
                            element[keys[i]].slice(0, CONST_MAX_TITLE_LEN) + '...' : // --inner else--
                            // return same value
                            element[keys[i]] : // -- else if--
                        result[keys[i]] = keys[i] == 'description' ? // --if--
                            element[keys[i]].length > CONST_MAX_DESCRIPTION_LEN ? // --inner if--
                                element[keys[i]].slice(0, CONST_MAX_DESCRIPTION_LEN) + '...' : // --inner else--
                                element[keys[i]] : // -- else --
                            element[keys[i]];
            };
            output.push(result);
        });
        res.locals.currentPage = 'products';
        res.locals.currentPageA = 'products';
        res.locals.products = output;

        res.render('admin/products');
    } catch (error) {
        res.locals.message = `Faild to fetch product data from db `;
        res.locals.code = 500;
        res.render('admin/404');
    };
};
// add product
export const addProducts = async (req, res) => {
    try {
        // get all categoy form db
        const category = await db.category.find({});
        res.locals.currentPageA = 'products';
        res.locals.currentPage = 'addProducts';
        res.locals.category = category;
        res.render('admin/add_products');
    } catch (error) {
        console.error(error);
        res.locals.message = `Interal error`;
        res.locals.code = 500;
        res.render('admin/404');
    };
};
// api for adding product
export const addProductsAPI = async (req, res) => {
    const data = req.body?.data ? JSON.parse(req.body.data) : null;
    const files = req.files;

    try {
        const output = await products.addProduct(data, files);

        res.send({ status: 'good', message: 'Product added' });
    } catch (error) {
        res.send({ status: "error", message: error });
    };
};
// edit product
export const editProduct = async (req, res) => {
    try {
        const PID = req.params.id;
        const output = await products.validatior({ PID: PID });
        try {
            const product = await db.products.findOne({ PID: output.PID });
            const categorys = await db.category.find();
            const keys = Object.keys(product._doc);
            const result = {};

            for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = keys[i] == 'creationTime' ? dataToReadable(product.creationTime) : product[keys[i]];
            };

            res.locals.currentPage = 'editProduct';
            res.locals.currentPageA = 'products';
            res.locals.product = result;
            res.locals.category = categorys;
            res.render('admin/editProduct');
        } catch (error) {
            console.log(error);
            res.locals.code = 500;
            res.locals.message = "Error fetching product data form db"
            res.render('admin/404');
        };
    } catch (error) {
        res.locals.message = error;
        res.render('admin/404');
    };
};
// api for edit product
export const editProductAPI = async (req, res) => {
    try {
        const output = await products.editProduct(req.body, req.files);

        res.send({ status: 'good', message: output });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
// api for delete product
export const deleteProductAPI = async (req, res) => {
    try {
        const output = await products.deleteProduct(req.body.PID);

        res.send({ status: 'good', message: output, action: '/admin_panel/products/' });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
// all orders page
export const ordres = async (req, res) => {
    try {
        res.locals.orders = await orders.getAllWithFromattedDate();
        res.locals.currentPage = 'orders';
        res.locals.currentPageA = 'orders';
        res.render('admin/orders');
    } catch (error) {
        console.log('ALL_ORDERS_PAGE_DB => ', error);
        res.locals.message = `Can't get order's from db `;
        res.locals.code = 500;
        res.render('admin/404');
    };
};
// api for cancel order
export const cancelOrderAPI = async (req, res) => {
    try {
        const resp = await orders.cancelOrder(req.body.orderID);
        res.send({ status: "success", message: "Order cancelled" });
    } catch (error) {
        res.send({ status: "error", message: error });
    };
};
// all category
export const category = async (req, res) => {
    try {
        const allCategory = await db.category.find({});
        const output = [];

        allCategory.forEach(element => {
            const keys = Object.keys(element._doc);
            const result = {};

            for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = keys[i] == 'creationTime' ? dataToReadable(element.creationTime) : element[keys[i]];
            };

            output.push(result);
        });

        res.locals.categorys = output;
        res.locals.currentPage = 'allCategory';
        res.locals.currentPageA = 'products';
        res.render('admin/allCategory');
    } catch (error) {
        console.log('ALL_CATEGORY_PAGE_DB => ', error);
        res.locals.message = `Can't read category's from db `;
        res.locals.code = 500;
        res.render('admin/404');
    };
};
// add category
export const addCategory = async (req, res) => {
    try {
        const category = await db.category.find({});

        res.locals.currentPageA = 'products';
        res.locals.currentPage = 'addCategory';
        res.locals.category = category;
        res.render('admin/addCategory');
    } catch (error) {
        console.error(error);
        res.locals.message = `Internal error`;
        res.locals.code = 500;
        res.render('admin/404');
    };
};
// api for adding category 
export const addCategoryAPI = async (req, res) => {
    try {
        const output = await products.addCategory(req.body);

        res.send({ status: 'good', message: 'Successfully added category' });
    } catch (error) {
        res.send({ status: "error", message: error });
    };
};
// api for editing category
export const editCategoryAPI = async (req, res) => {
    try {
        const output = await products.editCategory(req.body);

        res.send({ status: 'good', message: output });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
// api for deleting category
export const deleteCategoryAPI = async (req, res) => {
    try {
        const output = await products.deleteCategory(req.body);

        res.send({ status: 'good', message: output });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
// login page
export const login = (req, res) => {
    res.locals.layout = 'admin_auth_layout';
    res.render('admin/login');
};
// api for login
export const loginApi = async (req, res) => {
    try {
        const userData = await auth.adminLogin(req.body);

        req.session.loggedIn = true;
        req.session.admin = userData.adminID;
        res.send({ status: "good", message: 'Login success', action: "/admin_panel/" });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
// edit user
export const editUser = async (req, res) => {
    try {
        const output = await auth.validatior({ UID: req.params.UID });

        try {
            const userData = await db.users.findOne({ UID: output.UID });

            res.locals.user = userData;
            res.currentPageA = 'users';
            res.render('admin/editUser');
        } catch (error) {
            console.log(error);
            res.locals.message = 'Unable to fetch userdata';
            res.locals.code = 500;
            res.render('admin/404');
        };
    } catch (error) {
        res.locals.message = error;
        res.locals.code = 400;
        res.render('admin/404');
    };
};
// api for edit user
export const editUserAPI = async (req, res) => {
    try {
        const output = await auth.userDataUpdate(req.body);

        res.send({ status: 'good', message: 'User data updated' });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};

export const productHome = async (req, res) => {
    res.render('admin/productsHome');
};

export const test = async (req, res) => {
    res.render('admin/test');
}