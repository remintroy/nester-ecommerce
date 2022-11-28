import * as auth from "./services/auth.js";
import * as db from "./services/schema.js";
import * as userService from "./services/users.js";
import * as util from "./services/util.js";
import { appConfig } from "../index.js";
import * as orders from "./services/orders.js";
import * as address from "./services/address.js";
import * as analyticsService from './services/analytics.js';

// locals for users
export const localsForUser = async (req, res, next) => {
  try {
    if (req.user)
      res.locals.cartProducts = await userService.getAllCartProducts(
        req.user?.UID
      );
    res.locals.categorys = await db.category.find();
    res.locals.user = req.user;
    res.locals.appName = appConfig.name;
    res.locals.util = util;
    next();
  } catch (error) {
    console.log(error);
  }
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
      code: 400
    };

    //..
    res.locals.layout = "client/auth/layout";

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
}
// old
export const signup = async (req, res) => {
  res.locals.currentPage = "signup";
  res.locals.layout = "users/auth/layout";
  res.render("users/auth/signup");
};
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
  }
};
// old 
export const signupAPI = async (req, res) => {
  try {
    const result = await auth.userSignupWithEmail(req.body);
    req.session.user = result.UID;
    res.send({ status: "good", message: "Login success", action: "/" });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
export const loginAPI = async (req, res) => {
  try {
    const result = await auth.userLoginWithEmail(req.body);
    req.session.user = result.UID;
    res.send({ status: "good", message: "Login success", action: "/" });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
};
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
    const idToken = req.body.idToken;
    const output = await auth.signInWithGoogle({ idToken: idToken });
    req.session.user = output;
    res.send({ status: "good", message: "Login success", action: "/" });
  } catch (error) {
    res.send({ status: "error", message: error });
  }
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

// common - pages
export const home = async (req, res) => {
  res.locals.user = req.user;
  res.locals.currentPage = "home";
  res.locals.layout = 'client_layout';
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
    res.locals.products = products;
    res.render("users/shop");
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
    res.locals.currentPage = "product";
    res.locals.product = productData;
    res.render("users/product");
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
    res.render("users/cart");
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
  res.render("users/wishlist");
  try {
    await analyticsService.addUserPageRequests('user_wishlist_GET');
  } catch (error) {
    //...
  };
};
export const dashboard = async (req, res) => {
  try {
    res.locals.orders = await orders.getByUID(req?.user?.UID);
    res.locals.currentPage = "dashboard";
    res.render("users/dashboard");
    try {
      await analyticsService.addUserPageRequests('user_dashboard_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.code = "500";
    res.locals.message = error;
    res.render("users/404");
  }
};
export const checkout = async (req, res) => {
  try {
    const UID = req.user.UID;
    res.locals.country = await util.getAllCountries();
    res.locals.address = await userService?.getAllAddress(UID);
    res.locals.currentPage = "checkout";
    res.render("users/checkout");
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
export const ordersPg = async (req, res) => {
  try {
    res.locals.orders = await orders.getByUIDEach(req?.user?.UID);
    res.locals.currentPageA = "dashboard";
    res.locals.currentPage = "orders";
    res.render("users/dashboard");
    try {
      await analyticsService.addUserPageRequests('user_dash/orders_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = "Cant display this page now...";
    res.locals.error = "Faild to fetch orders related data form database";
    res.render("users/404");
  }
};
export const addressPg = async (req, res) => {
  try {
    res.locals.address = await address.getAll(req?.user?.UID);
    res.locals.country = await util.getAllCountries();
    res.locals.currentPageA = "dashboard";
    res.locals.currentPage = "address";
    res.render("users/dashboard");
    try {
      await analyticsService.addUserPageRequests('user_dash/address_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = "Cant display this page now...";
    res.locals.error = "Faild to fetch address related data form database";
    res.render("users/404");
  }
};
export const accountPg = async (req, res) => {
  try {
    res.locals.currentPageA = "dashboard";
    res.locals.currentPage = "account";
    res.render("users/dashboard");
    try {
      await analyticsService.addUserPageRequests('user_dash/account_GET');
    } catch (error) {
      //...
    };
  } catch (error) {
    res.locals.message = "Cant display this page now...";
    res.locals.error = "Faild to fetch account related data form database";
    res.render("users/404");
  };
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
