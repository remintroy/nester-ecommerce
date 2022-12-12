import express from 'express';
import * as admin from '../controller/admin.js';
import * as auth from '../controller/services/auth.js';
import * as apiRouter from './admin_api.js';

const adminApp = express.Router();
const layout = `admin_layout`;
const pagesBase = `admin`;

adminApp.use('/test', (req, res) => {
    res.render(pagesBase + '/test', { layout: 'admin/testLayout' })
})

adminApp.use('/api', auth.mustLoginAsAdmin, apiRouter.default);

// admin auth routes
adminApp.get('/admin_login', auth.mustLogoutAsAdmin, admin.login);
// api for admin login 
adminApp.post('/admin_login', auth.mustLogoutAsAdminAPI, admin.loginApi);
// api for admin logout
adminApp.post('/admin_logout', auth.mustLoginAsAdminAPI, auth.adminLogout);

// api for edit user data
adminApp.put('/user_management/edit_user/', auth.mustLoginAsAdminAPI, admin.editUserAPI);
// api for add products
adminApp.post('/products/add_product', auth.mustLoginAsAdminAPI, admin.addProductsAPI);
// api for edit products
adminApp.put('/products/edit_product/', auth.mustLoginAsAdminAPI, admin.editProductAPI);
// api for adding caegory
adminApp.post('/category/add_category', auth.mustLoginAsAdminAPI, admin.addCategoryAPI);
// api for edit category
adminApp.put('/category/edit_category', auth.mustLoginAsAdminAPI, admin.editCategoryAPI);
// api for delete category
adminApp.delete('/category/delete_category', auth.mustLoginAsAdminAPI, admin.deleteCategoryAPI);
// api for delete products
adminApp.delete('/products/delete_product/', auth.mustLoginAsAdminAPI, admin.deleteProductAPI);
// api for cancell orders
adminApp.put('/orders/cancel/', auth.mustLoginAsAdminAPI, admin.cancelOrderAPI);
// api for update order status
adminApp.put('/orders/update_status', auth.mustLoginAsAdminAPI, admin.updateStatusOrderAPI);
// api for add coupen 
adminApp.post('/coupen/add_coupen', auth.mustLoginAsAdminAPI, admin.AddcoupenAPI);
// api for delete coupon
adminApp.delete('/coupen/delete_coupen', auth.mustLoginAsAdminAPI, admin.DeletecoupenAPI);
// api for add banner 
adminApp.post('/banner/add', auth.mustLoginAsAdminAPI, admin.bannerAddAPI);
// api for remove banner
adminApp.delete('/banner/:id', auth.mustLoginAsAdmin, admin.removeBannerApi);


// auth checker 
adminApp.use(auth.mustLoginAsAdmin);
// render helper by setting locals
adminApp.use(admin.localsForAdmin);

adminApp.get('/report/year/pdf', admin.createReportPDF);

// dashboard routes
adminApp.get(['/', '/index.html'], admin.dashboard);
// all users listing
adminApp.get('/user_management', admin.users);
// disabled users listing
adminApp.get('/user_management/disabled_users', admin.disabledUsers);
// active users listing
adminApp.get('/user_management/active_users', admin.activeUsers);
// all products
adminApp.get('/products/all', admin.allProducts);
// all category listing
adminApp.get('/category', admin.category);
// products Home
adminApp.get('/products', admin.productHome);
// add products
adminApp.get('/products/add_product', admin.addProducts);
// edit products
adminApp.get('/products/edit_product/:id', admin.editProduct);
// view products
adminApp.get('/products/view_product/:id', admin.viewProduct);
// all orders
adminApp.get('/orders', admin.ordres);
// order full data page
adminApp.get('/orders/:id', admin.ordresFromID);
// coupen 
adminApp.get('/coupon', admin.coupen)
// add coupon 
adminApp.get('/coupon/add_coupon', admin.Addcoupen);
// banners 
adminApp.get('/banner', admin.banner);
// banner management add banner
adminApp.get('/banner/add', admin.addBanner)
// reports
adminApp.get('/report', admin.report);

// test page 
adminApp.get('/test', admin.test);

// edit user
// adminApp.get('/user_management/edit_user/:UID', admin.editUser); // this route is disabled due to sequrity


// routes is now depricated are listed below - start

// add category
// adminApp.get('/products/add_category', admin.addCategory); // relaced to 
/** TO => */ adminApp.get('/products/add_category', admin.depricationWarn);

// routes is now depricated are listed below - end

// 404 for admin
adminApp.use((req, res) => {
    res.status(404);
    res.render(pagesBase + '/404', { layout: layout, message: 'Page Not Found !' })
});

export default adminApp;