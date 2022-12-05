import * as auth from './services/auth.js';
import { randomId, dataToReadable } from './services/util.js';
import * as db from './services/schema.js';
import * as products from './services/products.js';
import * as orders from './services/orders.js';
import * as util from './services/util.js';
import * as coupenService from './services/coupens.js';
import * as pdfService from './services/pdf.js';
import * as path from 'path';
import * as apiService from './api/admin_api.js';

const layout = `admin_layout`;
const pagesBase = `admin`;

// set up all common locals for render
export const localsForAdmin = async (req, res, next) => {
    res.locals.layout = layout;
    res.locals.title = `Admin-panel`;
    res.locals.admin = req.admin;
    res.locals.util = util;
    next();
};
// warns deprication of a route
export const depricationWarn = async (req, res) => {
    res.locals.message = 'This page is currently unavailable or changed path';
    res.locals.code = 404;
    res.render(pagesBase + '/404');
};
// admin dashboard
export const dashboard = async (req, res) => {
    try {
        res.locals.title = `Admin-panel`;
        res.locals.admin = req.admin;
        res.locals.currentPage = 'dashboard';
        res.render(pagesBase + '/dashboard');
    } catch (error) {
        console.error(error);
        res.locals.message = `Internal error`;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
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

        res.render(pagesBase + '/users');
    } catch (error) {
        res.locals.message = `Can't read user data from db `;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
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

        res.render(pagesBase + '/users');
    } catch (error) {
        res.locals.message = `Can't read user data from db `;
        res.locals.message = 500;
        res.render(pagesBase + '/404');
    };
};
// all active users
export const activeUsers = async (req, res) => {
    try {
        const allUsers = await db.users.find({}, { password: 0 });
        const userData = [];

        for (let i = 0; i < allUsers.length; i++) {
            const output = {};

            if (allUsers[i]?.blocked) continue;

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
        res.locals.currentPage = 'activeUsers';
        res.locals.currentPageA = 'users';

        res.render(pagesBase + '/users');
    } catch (error) {
        res.locals.message = `Can't read user data from db `;
        res.locals.message = 500;
        res.render(pagesBase + '/404');
    };
};
// all products
export const allProducts = async (req, res) => {
    try {
        const productData = await db.products.find();
        res.locals.currentPage = 'allProducts';
        res.locals.currentPageA = 'products';
        res.locals.products = productData;
        res.render(pagesBase + '/products_all');
    } catch (error) {
        res.locals.message = `Faild to fetch product data from db `;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
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
        res.render(pagesBase + '/products_add');
    } catch (error) {
        console.error(error);
        res.locals.message = `Interal error`;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
    };
};
// products home
export const productHome = async (req, res) => {
    try {
        const pageNo = req.query.page && Number(req.query.page) > 1 ? req.query.page : 1;
        const productData = await apiService.getProductInPages(pageNo);
        res.locals.products = productData;
        res.locals.currentPage = 'products';
        res.locals.currentPageA = 'products';
        res.render(pagesBase + '/products');
    } catch (error) {
        res.locals.message = error;
        res.locals.code = 400;
        res.render(pagesBase + '/404');
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

            if (!product) {
                res.locals.code = 404;
                res.locals.message = `Can't find product with this PID`;
                res.render(pagesBase + '/404');
                return 0;
            };

            const keys = Object.keys(product?._doc);
            const result = {};

            for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = keys[i] == 'creationTime' ? dataToReadable(product.creationTime) : product[keys[i]];
            };

            res.locals.currentPage = 'editProduct';
            res.locals.currentPageA = 'products';
            res.locals.product = result;
            res.locals.category = categorys;
            res.render(pagesBase + '/products_edit');
        } catch (error) {
            res.locals.code = 500;
            res.locals.message = "Error fetching product data form db"
            res.render(pagesBase + '/404');
        };
    } catch (error) {
        res.locals.message = error;
        res.render(pagesBase + '/404');
    };
};
// view each product details
export const viewProduct = async (req, res) => {
    try {
        const PID = req.params.id;
        const output = await products.validatior({ PID: PID });
        try {
            const product = await db.products.findOne({ PID: output.PID });
            res.locals.currentPage = 'editProduct';
            res.locals.currentPageA = 'products';
            res.locals.product = product;
            res.render(pagesBase + '/products_view');
        } catch (error) {
            res.locals.code = 500;
            res.locals.message = "Error fetching product data form db"
            res.render(pagesBase + '/404');
        };
    } catch (error) {
        res.locals.message = error;
        res.render(pagesBase + '/404');
    };
}
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

        res.send({ status: 'good', message: output, action: '/products/' });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
// all orders page
export const ordres = async (req, res) => {
    try {
        const page = req.query.page;
        res.locals.orders = await orders.getAllWithFromattedDate(page);
        res.locals.currentPage = 'orders';
        res.locals.currentPageA = 'orders';
        res.render(pagesBase + '/orders');
    } catch (error) {
        res.locals.message = error;
        res.locals.code = 400;
        res.render(pagesBase + '/404');
    };
};
// order 
export const ordresFromID = async (req, res) => {
    try {

        const orderID = req?.params?.id;
        const orderFormDb = await orders.getByOrderID(orderID);
        if (orderFormDb.length == 0) throw 'Order not found';

        try {
            res.locals.orders = orderFormDb;
            res.locals.currentPage = 'viewOrder';
            res.locals.currentPageA = 'orders';
            res.render(pagesBase + '/viewOrder');
        } catch (error) {
            console.log('ALL_ORDERS_PAGE_DB => ', error);
            res.locals.message = `Can't get order's from db `;
            res.locals.code = 500;
            res.render(pagesBase + '/404');
        };
    } catch (error) {
        res.locals.message = error;
        res.locals.code = 404;
        res.render(pagesBase + '/404');
    };
};
// api for cancel order
export const cancelOrderAPI = async (req, res) => {
    try {
        const resp = await orders.cancelOrder(req.body.orderID);
        res.send({ status: "good", message: "Order cancelled" });
    } catch (error) {
        res.send({ status: "error", message: error });
    };
};
export const updateStatusOrderAPI = async (req, res) => {
    try {
        const PID = req?.body?.PID;
        const orderID = req?.body?.orderID;
        const status = req?.body?.status;
        const resp = await orders.updateOrderStatus(PID, orderID, status);
        res.send({ status: "good", message: "Order status successfully updated" });
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
        res.locals.currentPage = 'category';
        res.locals.currentPageA = 'category';
        res.render(pagesBase + '/category');
    } catch (error) {
        console.log('ALL_CATEGORY_PAGE_DB => ', error);
        res.locals.message = `Can't read category's from db `;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
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
        res.render(pagesBase + '/404');
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
    res.locals.layout = pagesBase + '/auth/layout';
    res.render(pagesBase + '/auth/login');
};
// api for login
export const loginApi = async (req, res) => {
    try {
        const userData = await auth.adminLogin(req.body);

        req.session.loggedIn = true;
        req.session.admin = userData.adminID;
        res.send({ status: "good", message: 'Login success', action: "/" });
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
            res.render(pagesBase + '/404');
        };
    } catch (error) {
        res.locals.message = error;
        res.locals.code = 400;
        res.render(pagesBase + '/404');
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
// coupens
export const coupen = async (req, res) => {
    try {
        const coupens = await db.coupens.find({});
        res.locals.coupens = coupens;
        res.locals.currentPage = 'coupen';
        res.locals.currentPageA = 'coupen';
        res.render(pagesBase + '/coupen');
    } catch (error) {
        console.log('ALL_ORDERS_PAGE_DB => ', error);
        res.locals.message = `Can't get coupen's from db `;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
    };
};
// add coupen
export const Addcoupen = async (req, res) => {
    try {
        const allCategory = await db.category.find({});
        res.locals.category = allCategory;
        res.locals.currentPage = 'addCoupen';
        res.locals.currentPageA = 'coupen';
        res.render(pagesBase + '/coupen_add');
    } catch (error) {
        console.log('ALL_ORDERS_PAGE_DB => ', error);
        res.locals.message = `Can't get coupen's from db `;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
    };
};
// add coupen api
export const AddcoupenAPI = async (req, res) => {
    try {
        const output = await coupenService.add(req.body);
        res.send({ status: 'good', message: output });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const DeletecoupenAPI = async (req, res) => {
    try {
        const output = await coupenService.remove(req.body.ID);
        res.send({ status: 'good', message: output });
    } catch (error) {
        res.send({ status: 'error', message: error });
    };
};
export const createReportPDF = async (req, res) => {
    await pdfService.createPdf();
    res.sendFile(path.join(process.cwd(), '/reports/report.pdf'));
};
export const banner = async (req, res) => {
    try {

        res.locals.currentPage = 'banner';
        res.locals.currentPageA = 'banner';
        res.render(pagesBase + '/banner');

    } catch (error) {
        res.locals.message = `Can't get banner's from db `;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
    };
};

// sales report
export const report = async (req,res)=>{
    try {
        
        res.render(pagesBase+'/reports');

    } catch (error) {
        // handling errors
        res.locals.message = `Can't get sales data from db `;
        res.locals.code = 500;
        res.render(pagesBase + '/404');
    };
};

// test -- fucntion
export const test = async (req, res) => {
    res.render('admin/test');
};