import Express from 'express';
import ExpressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import ConnectMongoDBSession from 'connect-mongodb-session';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import Logger from 'morgan';

import * as paypal from './app/services/paypal.js';

import { randomId } from './app/services/util.js';
import * as db from './app/services/schema.js';
import * as auth from './app/services/auth.js';
import * as adminRouter from './routes/admin.js';
import * as adminAPIRouter from './routes/admin_api.js';


dotenv.config();

// -- admin -- app
export const AdminAppConfig = {
    name: "Reminz",
    port: process.env.PORT | 8081
};
const __dirname = process.cwd();
const adminApp = Express();
const mongoDbSesson2 = new ConnectMongoDBSession(session);

// adminApp.use(Logger('dev'));
adminApp.set("view engine", "ejs");
adminApp.use(session({
    saveUninitialized: false,
    secret: process.env.SECRET_KEY,
    resave: false,
    store: new mongoDbSesson2({
        uri: process.env.USERDB_URL,
        collection: "session2"
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 10 // 10 days
    }
}));
adminApp.use(fileUpload());
adminApp.use(Express.json());
adminApp.use(ExpressLayouts);
adminApp.use('/product_images', Express.static(`${__dirname}/public/product_images`));
adminApp.use(Express.static(`${__dirname}/public/adminTemplate`)); // TODO: change the folder name to admin after compltely changed the layout
adminApp.use(auth.initAuth);

adminApp.use('/api', adminAPIRouter.default);
adminApp.use('/', adminRouter.default);

adminApp.use(function (req, res, next) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});


adminApp.listen(AdminAppConfig.port, () => {
    console.log(`[-] Admin Server started on port : ${AdminAppConfig.port}`);
});

