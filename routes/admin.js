import express from 'express';
import * as admin from '../app/admin.js';
import * as auth from '../app/services/auth.js';

const adminApp = express.Router();


// api for edit user data
adminApp.put('/user_management/edit_user/', auth.mustLoginAsAdminAPI, admin.editUserAPI);
// api for add products
adminApp.post('/products/add_product', auth.mustLoginAsAdminAPI, admin.addProductsAPI);
// api for edit products
adminApp.put('/products/edit_product/', auth.mustLoginAsAdminAPI, admin.editProductAPI);
// api for adding caegory
adminApp.post('/products/add_category', auth.mustLoginAsAdminAPI, admin.addCategoryAPI); 
// all category listing
adminApp.get('/products/categorys', auth.mustLoginAsAdminAPI, admin.category);
// api for edit category
adminApp.put('/products/edit_category', auth.mustLoginAsAdminAPI, admin.editCategoryAPI);
// api for delete category
adminApp.delete('/products/delete_category', auth.mustLoginAsAdminAPI, admin.deleteCategoryAPI);
// api for delete products
adminApp.delete('/products/delete_product/', auth.mustLoginAsAdminAPI, admin.deleteProductAPI);


adminApp.use(auth.mustLoginAsAdmin);

// dashboard routes
adminApp.get('/', admin.dashboard);
// all users listing
adminApp.get('/user_management', admin.users);
// disabled users listing
adminApp.get('/user_management/disabled_users', admin.disabledUsers);
// edit user
adminApp.get('/user_management/edit_user/:UID', admin.editUser);
// all products
adminApp.get('/products', admin.products_disp);
// add products
adminApp.get('/products/add_product', admin.addProducts);
// edit products
adminApp.get('/products/edit_product/:id', admin.editProduct);


// routes is now depricated are listed below - start

// add category
// adminApp.get('/products/add_category', admin.addCategory); // relaced to 
/** TO => */ adminApp.get('/products/add_category', admin.depricationWarn);

// routes is now depricated are listed below - end

// 404 for admin
adminApp.use((req, res) => {
    res.render('admin/404', { layout: 'admin_layout', message: 'Page Not Found !' })
})

export default adminApp;