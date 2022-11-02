import express from 'express';
import * as admin from '../app/admin.js';
import * as auth from '../app/services/auth.js';

const adminApp = express.Router();


// dashboard routes
adminApp.get('/', auth.mustLoginAsAdmin, admin.dashboard);

adminApp.get('/user_management', auth.mustLoginAsAdmin, admin.users);

adminApp.get('/user_management/disabled_users', auth.mustLoginAsAdmin, admin.disabledUsers);

adminApp.get('/user_management/edit_user/:UID', auth.mustLoginAsAdmin, admin.editUser);

adminApp.put('/user_management/edit_user/:UID', auth.mustLoginAsAdminAPI, admin.editUserAPI);

adminApp.get('/products', auth.mustLoginAsAdmin, admin.products_disp);

adminApp.get('/products/add_product', auth.mustLoginAsAdmin, admin.addProducts);

adminApp.post('/products/add_product', auth.mustLoginAsAdminAPI, admin.addProductsAPI);

adminApp.get('/products/add_category', auth.mustLoginAsAdmin, admin.addCategory);

adminApp.post('/products/add_category', auth.mustLoginAsAdminAPI, admin.addCategoryAPI);

adminApp.get('/products/categorys', auth.mustLoginAsAdminAPI, admin.category);

adminApp.put('/products/edit_category', auth.mustLoginAsAdminAPI, admin.editCategoryAPI);

adminApp.delete('/products/delete_category', auth.mustLoginAsAdminAPI, admin.deleteCategoryAPI);


adminApp.use((req, res) => {
    res.render('admin/404', { layout: 'admin_layout', message: 'Page Not Found !' })
})

export default adminApp;