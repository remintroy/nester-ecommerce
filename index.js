import Express from "express";
import ExpressLayouts from "express-ejs-layouts";
import session from "express-session";
import ConnectMongoDBSession from "connect-mongodb-session";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import Logger from "morgan";

import * as auth from "./controller/services/auth.js";
import usersRoute from "./routes/user.js";
import DeviceDetetor from 'device-detector-js';

const deviceDetetor = new DeviceDetetor();

dotenv.config();

const app = Express();
const __dirname = process.cwd();
export const appConfig = {
  name: "Nester",
  port: process.env.PORT | 8080,
};
const mongoDbSesson = new ConnectMongoDBSession(session);

// -- user -- app
// app.use(Logger('dev'));
app.set("view engine", "ejs");
app.use(
  session({
    saveUninitialized: false,
    secret: process.env.SECRET_KEY,
    resave: false,
    store: new mongoDbSesson({
      uri: process.env.USERDB_URL,
      collection: "session",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
    },
  })
);
app.use(fileUpload());
app.use(Express.json());
app.use(ExpressLayouts);
app.use(Express.static(`${__dirname}/public`));
app.use(Express.static(`${__dirname}/public/templates`));
app.use(Express.static(`${__dirname}/public/client`));
app.use(Express.static(`${__dirname}/public/material_kit`));
app.use(auth.initAuth);

app.use(function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

// app.use((req, res, next) => {
//   const userAgent = deviceDetetor.parse(req.headers['user-agent']);

//   if(userAgent?.device?.type == 'smartphone'){
//     res.send(`This site is currently not available on smartphone's`);
//   }else next();

// });

// for admin
app.use("/", usersRoute);

app.use((req, res) => {
  res.locals.layout = 'blank_layout';
  res.locals.appName = appConfig.name;
  res.status(404);
  res.render("client/404", { message: "404 !" });
});

app.listen(appConfig.port, 'localhost', () => {
  console.log(`[-] User Server started on port : ${appConfig.port}`);
});

// --------------------------------------------------

import * as adminRouter from "./routes/admin.js";
import * as adminAPIRouter from "./routes/admin_api.js";

// -- admin -- app
export const AdminAppConfig = {
  name: "Nester",
  port: process.env.PORT | 8081,
};
// const __dirname = process.cwd();
const adminApp = Express();
const mongoDbSesson2 = new ConnectMongoDBSession(session);

// adminApp.use(Logger('dev'));
adminApp.set("view engine", "ejs");
adminApp.use(
  session({
    saveUninitialized: false,
    secret: process.env.SECRET_KEY,
    resave: false,
    store: new mongoDbSesson2({
      uri: process.env.USERDB_URL,
      collection: "session",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
    },
  })
);
// new --- config for file upload
adminApp.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));
adminApp.use(Express.json());
adminApp.use(ExpressLayouts);
adminApp.use(
  "/product_images",
  Express.static(`${__dirname}/public/product_images`)
);
adminApp.use(Express.static(`${__dirname}/public/admin`));
adminApp.use(auth.initAuth);

adminApp.use(function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

adminApp.use("/api", adminAPIRouter.default);
adminApp.use("/", adminRouter.default);


adminApp.listen(AdminAppConfig.port, () => {
  console.log(`[-] Admin Server started on port : ${AdminAppConfig.port}`);
});
