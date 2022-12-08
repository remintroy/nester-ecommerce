import * as auth from "./services/auth.js";
import * as db from "./services/schema.js";
import * as userService from "./services/users.js";
import * as util from "./services/util.js";
import { appConfig } from "../index.js";
import * as orders from "./services/orders.js";
import * as address from "./services/address.js";
import * as analyticsService from './services/analytics.js';
import * as productService from './services/products.js';
import * as walletService from "./services/wallet.js";
import DeviceDectector from 'device-detector-js';

const device = new DeviceDectector();

// locals for users
export const localsForUser = async (req, res, next) => {
  try {
    if (req.user) res.locals.cartProducts = await userService.getAllCartProducts(req.user?.UID);
    res.locals.categorys = await db.category.find();
    res.locals.user = req.user;
    res.locals.appName = appConfig.name;
    res.locals.util = util;
    res.locals.layout = 'client_layout';
    next();
  } catch (error) {
    console.log(error);
  }
};
// url history for login
export const urlHistory = async (req, res, next) => {
  if (!req.user) req.session.userUrlHistory = req.url;
  next();
};
// analytics for users pages
export const analytics = (req, res, next) => {
  try {
    db.analytics.updateOne({ title: 'user_page_request' }, {
      $push: {
        data: new Date()
      }
    }).then(res => {
      if (res.matchedCount == 0) {
        db.analytics({
          title: 'user_page_request',
          data: [
            new Date()
          ]
        })
          .save();
      };
    });

    next();
  } catch (error) {
    next();
  };
};

// auth - pages
// new
export const login = (req, res) => {
  res.locals.title = 'Login';
  res.locals.currentPage = "login";
  res.locals.layout = "client/auth/layout";
  res.render("client/auth/login");
};
export const loginSecond = async (req, res) => {
  try {

    const id = req.params.id;

    // check for authentic request from login initated user from login page
    if (!req.session?.login?.code) throw 'Unautherized action';
    if (req.session?.login?.code != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    //..
    res.locals.title = 'Password confirmation';
    res.locals.layout = "client/auth/layout";
    res.locals.authID = id;
    // page to enter password
    res.render('client/auth/password');

  } catch (error) {
    res.locals.message = error?.message ? error.message : 'Unautherized action';
    res.locals.code = error?.code ? error.code : 401;
    res.locals.layout = 'blank_layout';
    res.locals.action = '/user_signin';
    res.locals.action_message = 'Go to login page';
    res.locals.error = 'You dont have permission to access this route !';
    res.render('client/404');
  };
};
export const forgetPassword = async (req, res) => {
  try {

    const id = req.params.id;

    // check for authentic request from login initated user from login page
    if (!req.session?.login?.code) throw 'Unautherized action';
    if (req.session?.login?.code != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    //..
    res.locals.layout = "client/auth/layout";
    res.locals.title = 'Forget Password';
    res.locals.authID = id;

    // page to enter password
    res.render('client/auth/forget');

  } catch (error) {
    res.locals.message = error?.message ? error.message : 'Unautherized action';
    res.locals.code = error?.code ? error.code : 401;
    res.locals.layout = 'blank_layout';
    res.locals.action = '/user_signin';
    res.locals.action_message = 'Go to login page';
    res.locals.error = 'You dont have permission to access this route ! you may consider retrying';
    res.render('client/404');
  };
};
export const verifyEmailOTP = async (req, res) => {
  try {

    const id = req.params.id;

    // check for authentic request from login initated user from login page
    if (!req.session?.login?.code) throw 'Unautherized action';
    if (req.session?.login?.code != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    //..
    res.locals.layout = "client/auth/layout";
    res.locals.title = 'Verfy using email';
    res.locals.authID = id;

    // page to enter password
    res.render('client/auth/email_verify');

  } catch (error) {
    res.locals.message = error?.message ? error.message : 'Unautherized action';
    res.locals.code = error?.code ? error.code : 401;
    res.locals.layout = 'blank_layout';
    res.locals.action = '/user_signin';
    res.locals.action_message = 'Go to login page';
    res.locals.error = 'You dont have permission to access this route !';
    res.render('client/404');
  };
};
export const resetPassword = async (req, res) => {
  try {

    const id = req.params.id;

    // check for authentic request from login initated user from login page
    if (!req.session?.login?.resetCode) throw 'Unautherized action';
    if (req.session?.login?.resetCode != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    //..
    res.locals.layout = "client/auth/layout";
    res.locals.title = 'Reset password';
    res.locals.authID = id;
    res.locals.resetID = req.session.login.resetCode;

    // page to enter password
    res.render('client/auth/reset_password');

  } catch (error) {
    res.locals.message = error?.message ? error.message : 'Unautherized action';
    res.locals.code = error?.code ? error.code : 401;
    res.locals.layout = 'blank_layout';
    res.locals.action = '/user_signin';
    res.locals.action_message = 'Go to login page';
    res.locals.error = 'You dont have permission to access this route !';
    res.render('client/404');
  };
};

// new
export const signup = async (req, res) => {
  if (req.session.referalInfo) {
    res.locals.referalInfo = req.session.referalInfo;
  };
  res.locals.title = 'Signup';
  res.locals.currentPage = "signup";
  res.locals.layout = "client/auth/layout";
  res.render("client/auth/register");
};
export const signupStepTwo = async (req, res) => {
  try {

    const id = req.params.id;

    // check for authentic request from login initated user from login page
    if (!req.session?.signup?.regID) throw 'Unautherized action';
    if (req.session?.signup?.regID != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    if (req.session.referalInfo) {
      res.locals.referalInfo = req.session.referalInfo;
    };

    //..
    res.locals.title = 'Password & Name';
    res.locals.layout = "client/auth/layout";
    res.locals.regID = id;
    // page to enter password and name
    res.render('client/auth/register_two');

  } catch (error) {
    res.locals.message = error?.message ? error.message : 'Unautherized action';
    res.locals.code = error?.code ? error.code : 401;
    res.locals.layout = 'blank_layout';
    res.locals.action = '/user_signin';
    res.locals.action_message = 'Go to login page';
    res.locals.error = 'You dont have permission to access this route !';
    res.render('client/404');
  };
};

// old
export const loginWithOtp = (req, res) => {
  res.locals.layout = "users/auth/layout";
  res.render("users/auth/otp");
};

// auth - api's
// new
export const signInInitAPI = async (req, res) => {
  try {
    const result = await auth.signInInit(req.body);
    req.session.login = result;
    res.send({ status: "good", message: "Sign in initiated", action: result.action });
  } catch (error) {
    res.send({ status: "error", message: error });
  };
};
export const signInWithPasswordAPI = async (req, res) => {
  try {
    const id = req.params.id;
    // check for authentic request from login initated user from login page
    if (!req.session?.login?.code) throw 'Unautherized action';
    if (req.session?.login?.code != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };
    const data = req.session.login.data;
    const type = req.session.login.type;
    const password = req.body.password;
    const result = await auth.signInPassword(data, type, password);
    const action = req.session.userUrlHistory ? req.session.userUrlHistory : result.action;

    req.session.user = result.UID;
    req.session.userLogin = { ...device.parse(req.headers['user-agent']), date: new Date() };
    req.session.login = null;
    req.session.userUrlHistory = null;
    req.session.referalInfo = null;
    res.send({ status: 'good', message: result.message, action: action });

  } catch (error) {
    res.send({ status: "error", message: error.message ? error.message : error, code: error.code ? error.code : 400 });
  }
}
export const signInRecoveryPasswordAPI = async (req, res) => {
  try {
    const id = req.params.id;
    // check for authentic request from login initated user from login page
    if (!req.session?.login?.code) throw 'Unautherized action';
    if (req.session?.login?.code != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    const data = req.session.login;
    const type = req.body.type;
    const result = await auth.sendPasswordForgetEmail(data, type, id);

    req.session.login.OTP = result.OTP;

    res.send({ status: 'good', message: result?.message ? result.message : result, action: result.action });
  } catch (error) {
    res.send({ status: "error", message: error.message ? error.message : error, code: error.code ? error.code : 400 });
  };
};
export const verifyEmailOTPAPI = async (req, res) => {
  try {
    const id = req.params.id;
    // check for authentic request from login initated user from login page
    if (!req.session?.login?.code) throw 'Unautherized action';
    if (req.session?.login?.code != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    // validating data
    const data = req.session.login;
    const varificationCode = req.body.OTP;

    // verifying otp
    const result = await auth.verfyEmailOTP(data, varificationCode, id);

    // saving reset password code to email
    req.session.login.OTP = null;
    req.session.login.resetCode = result.code;

    // response
    res.send({ status: 'good', message: result?.message ? result.message : result, action: result.action });
  } catch (error) {
    res.send({ status: "error", message: error.message ? error.message : error, code: error.code ? error.code : 400 });
  };
};
export const resetPasswordAPI = async (req, res) => {
  try {
    const id = req.params.id;
    // check for authentic request from login initated user from login page
    if (!req.session?.login?.resetCode) throw 'Unautherized action';
    if (req.session?.login?.resetCode != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    // validating data
    const data = req.session.login;
    const password = req.body.password;

    // verifying otp
    const result = await auth.resetPasswordUser(data, password, id);
    const action = req.session.userUrlHistory ? req.session.userUrlHistory : result.action;

    // logs in user
    req.session.login = null;
    req.session.user = result.UID;
    req.session.userUrlHistory = null;
    req.session.referalInfo = null;
    req.session.userLogin = { ...device.parse(req.headers['user-agent']), date: new Date() };

    // response
    res.send({ status: 'good', message: result?.message ? result.message : result, action: action });
  } catch (error) {
    res.send({ status: "error", message: error.message ? error.message : error, code: error.code ? error.code : 400 });
  };
};
export const signupAPI = async (req, res) => {
  try {
    const result = await auth.signUpInit(req.body);
    req.session.signup = result;
    // response
    res.send({ status: 'good', message: result?.message ? result.message : result, action: result.action });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const signupSetpTwoAPI = async (req, res) => {
  try {
    const id = req.params.id;

    // check for authentic request from login initated user from login page
    if (!req.session?.signup?.regID) throw 'Unautherized action';
    if (req.session?.signup?.regID != id) throw {
      message: 'Invalid Authentication ID',
      code: 401
    };

    let referalInfo = req.session.referalInfo ? req.session.referalInfo : null;

    // validating data
    const { password, name } = req.body;
    const data = { ...req.session.signup, password, name, referalInfo };

    // verifying otp
    const result = await auth.signUpStepTwo(data);
    const action = req.session.userUrlHistory ? req.session.userUrlHistory : result.action;

    // logs in user
    req.session.signup = null;
    req.session.user = result.UID;
    req.session.referalInfo = null;
    req.session.userUrlHistory = null;
    req.session.userLogin = { ...device.parse(req.headers['user-agent']), date: new Date() };

    // response
    res.send({ status: 'good', message: result?.message ? result.message : result, action: action });
  } catch (error) {
    res.send({ status: "error", message: error.message ? error.message : error, code: error.code ? error.code : 400 });
  };
};

// old 
export const logoutAPI = async (req, res) => {
  try {
    req.session.user = false;
    res.send({
      status: "good",
      message: "Logout success",
      action: "/user_signin",
    });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const loginWithGoogleAPI = async (req, res) => {
  try {
    // getting user id tocken form reqeuest body
    const idToken = req.body.idToken;
    // referal code details
    const referalInfo = req.session.referalInfo ? req.session.referalInfo : null;
    // validatinga and creating user
    const result = await auth.signInWithGoogle({ idToken: idToken, referalInfo });
    // action
    const action = req.session.userUrlHistory ? req.session.userUrlHistory : result.action;

    // addign user session
    req.session.user = result.UID;

    // clearing data only nesseary for login from session
    req.session.referalInfo = null;
    req.session.login = null;
    req.session.userUrlHistory = null;

    // login success
    res.send({ status: "good", message: result.message, action });
  } catch (error) {
    // handling error by sending error response
    res.send({ status: "error", message: error });
  };
};
export const loginWithOtpAPI = async (req, res) => {
  try {
    const userDataFromOTP = await auth.signInWithOTP({
      idToken: req.body.idToken,
    });
    req.session.user = userDataFromOTP;
    res.send({ status: "good", message: "SignIn success", action: "/" });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const logoutSessionAPI = async (req, res) => {
  try {
    const sessionID = req.params.id?.trim();

    if (sessionID == req.sessionID) throw 'You cannot logout of you own device form this menu!';

    if (sessionID) {

      const updatedData = await db.DB.db.collection('session').deleteOne({ _id: sessionID });

      if (updatedData.deletedCount) {
        res.send({ status: "good", message: 'Successfully logged out' });
      } else {
        res.send({ status: 'error', message: `Failed to logout` });
      };

      return 0;

    } else throw 'Invalid session id';

  } catch (error) {
    res.send({ status: 'error', message: error });
  };
};

// common - pages
export const home = async (req, res) => {
  res.locals.topSellingProducts = await productService.topSellingProducts(10);
  res.locals.currentPage = "home";
  res.render("client/home");
  try {
    await analyticsService.addUserPageRequests('user_home_GET');
  } catch (error) {
    //...
  };
};
export const shop = async (req, res) => {
  try {
    const products = await db.products.find();
    res.locals.currentPage = "shop";
    res.locals.topProducts = await productService.topSellingProducts(10);
    res.locals.products = products;
    res.render("client/shop");
    try {
      await analyticsService.addUserPageRequests('user_shop_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = `Can't read product data from db `;
    res.locals.code = 500;
    res.render("users/404");
  }
};
export const product = async (req, res) => {
  const PID = req.params.id;
  try {
    const productData = await db.products.findOne({ PID: PID });
    res.locals.topProducts = await productService.topSellingProducts(4);
    res.locals.currentPage = "product";
    res.locals.product = productData;
    res.render("client/product");
    try {
      await analyticsService.addUserPageRequests('user_product_GET');
      await analyticsService.addProductViews(PID);
      await analyticsService.addProductImpressions(PID);
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = `Can't read product data from db`;
    res.locals.code = 500;
    res.render("users/404");
  }
};
export const cart = async (req, res) => {
  res.locals.currentPage = "cart";
  try {
    res.render("client/cart");
    try {
      await analyticsService.addUserPageRequests('user_cart_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = `Can't read product data from db `;
    res.code = 500;
    res.render("users/404");
  }
};
export const wishlist = async (req, res) => {
  res.locals.currentPage = "wishlist";
  res.render("client/wishlist");
  try {
    await analyticsService.addUserPageRequests('user_wishlist_GET');
  } catch (error) {
    //...
  };
};
export const checkout = async (req, res) => {
  try {
    const UID = req.user.UID;
    res.locals.country = await util.getAllCountries();
    res.locals.address = await userService?.getAllAddress(UID);
    res.locals.currentPage = "checkout";
    res.render("client/checkout");
    try {
      await analyticsService.addUserPageRequests('user_checkout_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = "Cant display this page now...";
    res.locals.error = "Faild to fetch address related data form database";
    res.render("users/404");
  }
};
export const dashboard = async (req, res) => {
  try {
    res.locals.currentPage = "account";
    res.locals.currentPageA = "dashboard";
    res.render("client/dashboard");
    try {
      await analyticsService.addUserPageRequests('user_dashboard_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.code = "500";
    res.locals.message = error;
    res.locals.layout = 'blank_layout';
    res.render("client/404");
  }
};
export const dashboard_mb = async (req, res) => {
  try {
    res.locals.currentPage = "dashboardMB";
    res.locals.currentPageA = "dashboard";
    res.render("client/dash_mb");
    try {
      await analyticsService.addUserPageRequests('user_dashboard_mb_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.code = "500";
    res.locals.message = error;
    res.locals.layout = 'blank_layout';
    res.render("client/404");
  };
};
export const walletPg = async (req, res) => {
  try {
    res.locals.wallet = await walletService.getWalletInfo(req.user.UID);
    res.locals.currentPage = "wallet";
    res.locals.currentPageA = "dashboard";
    res.render("client/dash_wallet");
  } catch (error) {
    res.locals.code = "500";
    res.locals.layout = 'blank_layout';
    res.locals.message = error;
    res.render("client/404");
  };
};
export const ordersPg = async (req, res) => {
  try {
    res.locals.orders = await orders.getByUIDEach(req?.user?.UID);
    res.locals.currentPageA = "dashboard";
    res.locals.currentPage = "orders";
    res.render("client/dash_orders");
    try {
      await analyticsService.addUserPageRequests('user_dash/orders_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = "Cant display this page now...";
    res.locals.error = "Faild to fetch orders related data form database";
    res.locals.layout = 'blank_layout';
    res.render("client/404");
  }
};
export const addressPg = async (req, res) => {
  try {
    res.locals.address = await address.getAll(req?.user?.UID);
    res.locals.country = await util.getAllCountries();
    res.locals.currentPageA = "dashboard";
    res.locals.currentPage = "address";
    res.render("client/dash_addresss");
    try {
      await analyticsService.addUserPageRequests('user_dash/address_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = "Cant display this page now...";
    res.locals.error = "Faild to fetch address related data form database";
    res.locals.layout = 'blank_layout';
    res.render("client/404");
  }
};
export const securityPg = async (req, res) => {
  try {
    res.locals.session = req.sessionID;
    res.locals.security = await db.DB.db.collection('session').find({ 'session.user': req?.user?.UID }).toArray();
    res.locals.currentPageA = "dashboard";
    res.locals.currentPage = "security";
    res.render("client/dash_security");

  } catch (error) {
    console.log(error);
    res.locals.code = 500;
    res.locals.message = "Cant display this page now...";
    res.locals.error = "Faild to fetch security related data form database";
    res.locals.layout = 'blank_layout';
    res.render("client/404");
  };
};
export const category = async (req, res) => {
  try {

    // get category from request
    const categoryInput = req.params?.id;

    let existingData;

    try {
      // getting products with same category
      existingData = await db.products.find({ category: categoryInput });
    } catch (error) {
      // handling error
      throw 'Failed to fetch product data from db';
    };

    let topProducts;

    try {
      // gettign top products data
      topProducts = await productService.topSellingProducts(10)
    } catch (error) {
      // handling error
      throw 'Error while fetchig product data';
    };

    res.locals.category = categoryInput;
    res.locals.products = existingData;
    res.locals.topProducts = topProducts;
    res.locals.currentPageA = 'shop';
    res.locals.currentPage = 'category';
    res.render('client/category');

  } catch (error) {
    res.locals.message = "Cant Find product here...";
    res.locals.error = "Faild to fetch category related data form database";
    res.locals.layout = 'blank_layout';
    res.render('client/404');
  }
};


// common - api's
export const addTOCartAPI = async (req, res) => {
  try {
    const PID = req.body.PID; // form request
    const UID = req.user.UID; // form session
    const quantity = req.body?.quantity ? req.body.quantity : null; // from request
    // adds product to cart or if exist updates the quantity
    const output = await userService.addProductToCart(UID, PID, quantity);
    res.send({ status: "good", message: output });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const deleteFormCartAPI = async (req, res) => {
  try {
    const PID = req.body.PID; // form request
    const UID = req.user.UID; // form session

    // adds product to cart or if exist updates the quantity
    const output = await userService.deleteFormCart(UID, PID);

    res.send({ status: "good", message: output });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const getAllProductsFormCartAPI = async (req, res) => {
  try {
    const UID = req.user.UID; // form session

    // adds product to cart or if exist updates the quantity
    const output = await userService.getAllCartProducts(UID);

    res.send({ status: "good", message: output });
  } catch (error) {
    console.log("error => ", error);
    res.send({ status: "error", message: error });
  }
};
export const addUserAddressAPI = async (req, res) => {
  try {
    const UID = req.user.UID; // form session
    // adds product to cart or if exist updates the quantity
    const output = await userService.addUserAddress(UID, req.body);

    res.send({ status: "good", message: output });
  } catch (error) {
    console.log("error => ", error);
    res.send({ status: "error", message: error });
  }
};
export const updateUserAddressAPI = async (req, res) => {
  try {
    const UID = req.user.UID; // form session
    // adds product to cart or if exist updates the quantity
    const output = await userService.updateUserAddress(UID, req.body);

    res.send({ status: "good", message: output });
  } catch (error) {
    console.log("error => ", error);
    res.send({ status: "error", message: error });
  }
};
export const deleteUserAddressAPI = async (req, res) => {
  try {
    const UID = req.user.UID; // form session
    // adds product to cart or if exist updates the quantity
    const output = await userService.deleteUserAddress(UID, req.body);

    res.send({ status: "good", message: output });
  } catch (error) {
    console.log("error => ", error);
    res.send({ status: "error", message: error });
  }
};
export const checkoutCartProductsAPI = async (req, res) => {
  try {
    const UID = req.user.UID; // form session
    // adds product to cart or if exist updates the quantity
    const output = await userService.checkoutCart(UID, req.body);
    res.send({ status: "good", message: output, action: "/dashboard/orders" });
  } catch (error) {
    console.log("error => ", error);
    res.send({ status: "error", message: error });
  }
};
export const checkOutVerifyRazorpayAPI = async (req, res) => {
  try {
    const UID = req.user.UID; // form session
    // adds product to cart or if exist updates the quantity
    const output = await userService.veryfyPayment(UID, req.body);
    res.send({ status: "good", message: output, action: "/dashboard/orders" });
  } catch (error) {
    console.log("error => ", error);
    res.send({ status: "error", message: error });
  }
};
export const checkOutVerifyPaypalAPI = async (req, res) => {
  try {
    const UID = req.user.UID; // form session
    const id = req.params.id;
    const orderID = req.params.orderID;
    const output = await userService.veryfyPayment2(UID, id, orderID);
    res.send({ status: "good", message: output, action: "/dashboard/orders" });
  } catch (error) {
    console.log("error => ", error);
    res.send({ status: "error", message: error });
  }
};
export const getAddressByAddressID = async (req, res) => {
  try {
    const UID = req.user.UID; // form session
    // adds product to cart or if exist updates the quantity
    const id = req.params.id;
    const output = await address.getByID(UID, req?.body?.addressID);
    res.send({ status: "good", message: output, action: "/dashboard/orders" });
  } catch (error) {
    console.log("error => ", error);
    res.send({ status: "error", message: error });
  }
};
export const cancelOrderAPI = async (req, res) => {
  try {
    // UID form session
    const UID = req.user.UID;
    //...
    const result = await userService.cancelOrder(
      UID,
      req.body.orderID,
      req.body.PID
    );
    res.send({ status: "good", message: result });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const returnOrderAPI = async (req, res) => {
  try {
    // UID form session
    const UID = req.user.UID;
    //...
    const result = await userService.returnOrder(
      UID,
      req.body.orderID,
      req.body.PID
    );
    res.send({ status: "good", message: result });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const updateUserDataAPI = async (req, res) => {
  try {
    // UID form session
    const UID = req.user.UID;
    //...
    const result = await userService.updateUserData(UID, req.body);
    res.send({ status: "good", message: result });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const failedOrders = async (req, res) => {
  try {

    const orderID = req.params.id;
    const dataFromDb = await db.orders.find({ 'orders.orderID': orderID });

    // getting index 
    const index = dataFromDb[0].orders.map(e => e.orderID == orderID).indexOf(true);

    if (dataFromDb[0].orders[index].paymentStatus != 'pending') throw 'Cant delete paid orders';

    if (index != -1) {

      // deleteing order
      const dataAfterDelete = await db.orders.updateOne({ 'orders.orderID': orderID }, {
        $unset: {
          [`orders.orderID.${index}`]: 1
        }
      });

      res.send({ stauts: 'good', message: 'Payment cancelled' });

    } else {
      // order not found !
    };

  } catch (error) {
    console.log(error)
    res.send({ stauts: 'error', message: error });
  };
};
export const referalInit = async (req, res) => {
  try {

    // referal code
    const referalCode = req.query.usr;

    // checking if referal code is valid
    const dataFromReferal = await db.users.find({ referal: referalCode });

    if (dataFromReferal.length == 0) throw 'Invalid referal code';

    // checks if user is logged in or not
    if (!req.user) {

      // assigning value to make referal signup possible
      req.session.referalInfo = {
        referal: dataFromReferal[0].referal,
        email: dataFromReferal[0].email,
        name: dataFromReferal[0].name
      };

      // redirecting user to signup page
      res.redirect('/user_registration');
    } else {

      // render user is already logged in 
      if (req.user.referal == referalCode) {
        res.render('client/auth/referal_my');
      } else {
        res.send("hmmm you are good but not here")
      };

    };

  } catch (error) {
    // error while hadling or adding referal code
    res.send('Invalid code');
  };
};