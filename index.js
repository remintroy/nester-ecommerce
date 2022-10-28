import Express from 'express'; 
import ExpressLayouts from 'express-ejs-layouts'; 
import session from 'express-session'; 
import ConnectMongoDBSession from 'connect-mongodb-session'; 
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import Logger from 'morgan';
import path from 'path';

import * as db from './app/services/schema.js';
import * as auth from './app/services/auth.js';
import adminRoute from './routes/admin.js';
import usersRoute from './routes/user.js';
import { randomId } from './app/services/util.js';

dotenv.config();

const app = Express();
const __dirname = process.cwd();
const appConfig = {
    name: "Odio",
    port: process.env.PORT | 8080
};
const mongoDbSesson = new ConnectMongoDBSession(session);

app.use(Logger('dev'));
app.set("view engine", "ejs");
app.use(session({
    saveUninitialized: false,
    secret: process.env.SECRET_KEY,
    resave:false,
    store:new mongoDbSesson({
        uri:process.env.USERDB_URL,
        collection:"session"
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 10 // 10 days
    }
}));
app.use(fileUpload());
app.use(Express.json()); 
app.use(ExpressLayouts); 
app.use(Express.static(`${__dirname}/public`)); 
app.use(auth.initAuth);

app.use('/admin',adminRoute);
app.use('/',usersRoute);

app.use((req,res)=>{
    res.status(404);
    res.render('errorMessage',{message:'404 page not found !'});
});

app.listen(appConfig.port,()=>{
    console.log(`[-] Server started on port : ${appConfig.port}`);
});
