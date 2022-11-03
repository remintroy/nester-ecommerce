import * as auth from './services/auth.js';
import { randomId, dataToReadable } from './services/util.js';
import * as db from './services/schema.js';
import * as products from './services/products.js';

const layout = `admin_layout`

// admin dashboard
export const dashboard = async (req, res) => {

    try {

        const data = {
            layout: layout
        };

        data.title = `Admin-panel`;
        data.admin = req.admin
        data.currentPage = 'dashboard';

        res.render('admin/dashboard', data);

    } catch (error) {
        console.error(error);

        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Internal error`,
            code: 500
        });
    };

};
// all user 
export const users = async (req, res) => {

    try {

        let allUsers = await db.users.find({}, { password: 0 });

        const userData = [];

        for (let i = 0; i < allUsers.length; i++) {

            let output = {};

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

        res.render('admin/users', {
            layout: layout,
            users: userData,
            admin: req.admin,
            currentPage: 'users',
            currentPageA: 'users'
        });

    } catch (error) {

        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Can't read user data from db `,
            code: 500
        });

    };

};
// all desabled users
export const disabledUsers = async (req, res) => {
    try {

        let allUsers = await db.users.find({}, { password: 0 });

        const userData = [];

        for (let i = 0; i < allUsers.length; i++) {

            let output = {};

            if (!allUsers[i]?.blocked) {
                continue;
            };

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

        res.render('admin/users', {
            layout: layout,
            users: userData,
            admin: req.admin,
            currentPage: 'diabledUsers',
            currentPageA: 'users'
        });

    } catch (error) {

        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Can't read user data from db `,
            code: 500
        });

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

        res.render('admin/products', {
            layout: layout,
            currentPageA: 'products',
            currentPage: 'products',
            products: output
        });

    } catch (error) {
        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Faild to fetch product data from db `,
            code: 500
        });
    };
};
// add product
export const addProducts = async (req, res) => {
    try {

        const category = await db.category.find({});

        const data = {
            layout: layout
        };

        data.title = `Admin-panel`;
        data.admin = req.admin
        data.currentPageA = 'products';
        data.currentPage = 'addProducts';
        data.category = category;

        res.render('admin/addProducts', data);

    } catch (error) {
        console.error(error);
        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Internal error`,
            code: 500
        });
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

        const output = await products.validatior({
            PID: PID
        });

        try {

            const productDataFromDb = await db.products.findOne({ PID: output.PID });
            const categoryDataFromDb = await db.category.find();
            const keys = Object.keys(productDataFromDb._doc);
            const result = {};

            for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = keys[i] == 'creationTime' ? dataToReadable(productDataFromDb.creationTime) : productDataFromDb[keys[i]];
            };

            res.render('admin/editProduct', {
                layout: layout,
                currentPageA: 'products',
                currentPage: 'editProduct',
                product: result,
                category: categoryDataFromDb
            });

        } catch (error) {
            console.log(error);
            res.render('admin/404', {
                code: 500,
                message: "Error fetching product data form db",
                layout: layout
            });
        };

    } catch (error) {
        res.render('admin/404', {
            code: 400,
            message: error,
            layout: layout
        });
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
// all category
export const category = async (req, res) => {
    try {

        const allCategoryFormDB = await db.category.find({});
        const output = [];

        allCategoryFormDB.forEach((element, index, array) => {

            const keys = Object.keys(element._doc);
            const result = {};

            for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = keys[i] == 'creationTime' ? dataToReadable(element.creationTime) : element[keys[i]];
            };
            output.push(result);
        });

        res.render('admin/allCategory', {
            layout: layout,
            categorys: output,
            currentPageA: 'products',
            currentPage: 'allCategory'
        });

    } catch (error) {
        console.log('ALL_CATEGORY_PAGE_DB => ', error);
        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Can't read category's from db `,
            code: 500
        });

    };
};
// add category
export const addCategory = async (req, res) => {
    try {

        const category = await db.category.find({});

        const data = {
            layout: layout
        };

        data.title = `Admin-panel`;
        data.admin = req.admin
        data.currentPageA = 'products';
        data.currentPage = 'addCategory';
        data.category = category;

        res.render('admin/addCategory', data);

    } catch (error) {
        console.error(error);
        res.render('admin/404', {
            layout: 'admin_layout',
            message: `Internal error`,
            code: 500
        });
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
    res.render('admin/login', {
        layout: 'admin_auth_layout'
    });
};
// api for login
export const loginApi = async (req, res) => {
    try {
        let userData = await auth.adminLogin(req.body);

        req.session.loggedIn = true;
        req.session.admin = userData.adminID;

        res.send({ status: "good", message: 'Login success', action: "/admin_panel/" });
    } catch (error) {
        res.send({ status: 'error', message: error });
    }
};
// edit user
export const editUser = async (req, res) => {

    try {

        const output = await auth.validatior({ UID: req.params.UID });

        try {

            const userData = await db.users.findOne({ UID: output.UID });

            res.render('admin/editUser', {
                layout: layout,
                currentPageA: 'users',
                user: userData
            });

        } catch (error) {
            console.log(error)
            res.render('admin/404', { layout: layout, message: 'Unable to fetch userdata', code: 500 })
        };

    } catch (error) {
        res.render('admin/404', { layout: layout, message: error, code: '400' })
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

