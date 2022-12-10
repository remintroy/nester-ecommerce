import * as db from './schema.js';
import { randomId } from './util.js';
import path, { resolve } from 'path';

const BANNER_ID_LENGTH = 7;
const folderPath = path.join(process.cwd(), 'public', 'banner_images');

// creates banner id 
const createBannerID = async () => {
    try {

        let id = '';

        // check if banner id exists to avoid duplicate ids
        do {
            id = randomId(BANNER_ID_LENGTH, 'A0');
        } while ((await db.banners.find({ bannerID: id })).length > 0);

        return id;

    } catch (error) {
        throw 'Error creating bannerID';
    };
};

// adds new banner to db and saves image
export const add = async (data, files) => {
    try {

        // getting valuse in a desired way
        const { title, description, titleTop, titleBottom, btnName, btnAction, bg, color } = data;

        // basic validatin
        if ((title + "").trim().length == 0) throw 'Title is required';
        if ((description + "").trim().length == 0) throw 'Description is required';
        if ((btnName + "").trim().length == 0) throw 'Button name is required';
        if ((btnAction + "").trim().length == 0) throw 'Button action path is required';

        // creates banner id 
        const bannerID = await createBannerID();

        // creates document to save
        const dataToSave = await db.banners({
            title: title,
            description: description,
            titleTop: titleTop,
            titleBottom: titleBottom,
            btnName: btnName,
            btnAction: btnAction,
            bannerID: bannerID,
            bg: bg,
            color: color
        });


        try {

            // saves images
            const saveImg = () => {
                // reutrns promise after saving
                return new Promise((resolve, reject) => {
                    files?.img.mv(path.join(folderPath, bannerID + '.jpg'), (err) => {
                        // handling error
                        if (err) reject(err);
                        else resolve(true);
                        //..
                    });

                });
            };

            if (files?.img) {
                // saves imgae if exist
                const saved = await saveImg();
            };

        } catch (error) {
            // handling error
            throw 'Error saving banner image';
        };

        // finally saves data to db;
        dataToSave.save();

        return 'Banner added successfully';

    } catch (error) {
        // handling error
        throw error;
    };
};

// get all banners
export const getByPage = async (page) => {
    try {

        // validate and set's default value if invalid page number passed
        page = isNaN(Number(page)) ? 1 : page;

        // getting data from db
        const data = await db.banners.paginate({}, {
            // paginate options
            limit: 10,
            page: page
        });

        // output data
        return data;

    } catch (error) {
        // handling error
        throw 'Faild to bannerI fetch data';
    };
};


// test 
const test = async () => {
    try {
        const result = await getByPage(1);
        console.log('TEST_RESULT => ', result);
    } catch (error) {
        console.log("TEST_ERR => ", error);
    };
};
// test();