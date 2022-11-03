import * as db from './schema.js';
import { randomId } from './util.js';
import fs from 'fs';

const __dirname = process.cwd();

/**
 * @param {Object} data
 * @param {String} data.title
 * @param {Number} data.price
 * @param {String} data.description
 * @param {Number} data.offer
 * @param {Number} data.stock
 * @param {String} data.category
 * @param {String} data.PID
 * @param {File} data.files
 * @param {Object} requiredIn
 * @param {Boolean} requiredIn.title
 * @param {Boolean} requiredIn.price
 * @param {Boolean} requiredIn.description
 * @param {Boolean} requiredIn.offer
 * @param {Boolean} requiredIn.stock
 * @param {Boolean} requiredIn.category
 * @param {Boolean} requiredIn.PID
 * @param {Boolean} requiredIn.files
 * @param {Boolean} requiredIn.filesLength
 * @param {string} typeOfValidation
 */
export function validatior(data, requiredIn, typeOfValidation) {

    let {
        title = '',
        price = '',
        description = '',
        offer = '',
        stock = '',
        category = '',
        files = {},
        PID = ''
    } = data;

    title = title ? title.trim() : '';
    description = description ? description.trim() : '';
    category = category ? category.trim().toLocaleLowerCase() : '';
    price = price ? price : '';
    offer = offer ? offer : '';
    stock = stock ? stock : '';
    PID = PID ? PID : '';
    files = files ? files : {};

    const titleRequired = requiredIn?.title ? true : false;
    const priceRequired = requiredIn?.price ? true : false;
    const descriptionRequired = requiredIn?.description ? true : false;
    const offerRequired = requiredIn?.offer ? true : false;
    const stockRequired = requiredIn?.stock ? true : false;
    const categoryRequired = requiredIn?.category ? true : false;
    const filesRequired = requiredIn?.files ? true : false;
    const PIDRequired = requiredIn?.PID ? true : false;

    const FILES_MIN_LENGTH = requiredIn?.filesLength ? requiredIn.filesLength : 1;
    const PID_LENGTH = 20;
    const TITLE_LENGHT = 10;
    const DESCRIPTION_LENGTH = 20;

    const output = {
        title: null,
        price: null,
        description: null,
        offer: null,
        stock: null,
        category: null,
        files: null,
        PID: null
    };

    return new Promise(async (resolve, reject) => {
        // title validation
        if (title.length != 0 || titleRequired) {
            if (title.length == 0) {
                reject("Title required"); return 0;
            } else if (title.length < TITLE_LENGHT) {
                reject(`Title must be ${TITLE_LENGHT} characters`); return 0;
            } else {
                output.title = title;
            };
        };
        // price validation
        if (price.length != 0 || priceRequired) {
            if (price.length == 0) {
                reject("Price required"); return 0;
            } else if (price < 0) {
                reject("Price is not valid"); return 0;
            } else {
                output.price = price;
            };
        };
        // description validation
        if (description.length != 0 || descriptionRequired) {
            if (description.length == 0) {
                reject("Description required"); return 0;
            } else if (description.length < DESCRIPTION_LENGTH) {
                reject(`Description must contain atleast ${DESCRIPTION_LENGTH} characters`); return 0;
            } else {
                output.description = description;
            };
        };
        // offer validation
        if (offer?.length || offerRequired) {
            if (offer.length == 0) {
                reject("Offer required"); return 0;
            } else if (offer < 0) {
                reject("Enter a valid offer"); return 0;
            } else {
                output.offer = offer;
            };
        };
        // stock validation
        if (stock.length != 0 || stockRequired) {
            if (stock.length == 0) {
                reject("Stock required"); return 0;
            } else if (stock < 0) {
                reject("Enter a valid Stock"); return 0;
            } else {
                output.stock = stock;
            };
        };
        // catorgary validation
        if (category.length != 0 || categoryRequired) {
            if (category.length == 0) {
                reject("Category required"); return 0;
            } else {

                try {

                    const catogeryFromDb = await db.category.find({ category: category });

                    if (typeOfValidation == 'createCategory') {
                        if (catogeryFromDb.length == 0) {
                            output.category = category;
                        } else {
                            reject('Category already exists');
                        }
                    } else {
                        if (catogeryFromDb.length > 0) {
                            output.category = category;
                        } else {
                            reject("Invalid category"); return 0;
                        };
                    }
                } catch (error) {
                    console.error("ERROR_FETCHING_CATOGERY_VALIDATOR_PRODUCTS => ", error);
                    reject("Error fetching catogery form db"); return 0;
                };

            };
        };
        // files validation 
        if (Object.keys(files).length != 0 || filesRequired) {
            if (Object.keys(files).length < FILES_MIN_LENGTH) {
                reject("File Required"); return 0;
            } else {
                output.files = files;
            };
        };
        // PID Creation
        if (PID.length != 0 || PIDRequired) {
            if (typeOfValidation == 'addproduct') {
                do {
                    PID = randomId(PID_LENGTH);
                } while ((await db.products.find({ PID: PID })).length != 0);
                output.PID = PID;
            } else if (typeOfValidation = 'updateproduct') {
                let PID_FORM_DB = await db.products.find({ PID: PID });
                if (PID_FORM_DB.length == 0) {
                    reject("Invalid PID");
                } else {
                    output.PID = PID;
                };
            } else {
                if (PID.length == 0) {
                    reject("PID Required"); return 0;
                } else if (PID.length != PID_LENGTH) {
                    reject("Invalid PID"); return 0;
                } else {
                    output.PID = PID;
                };
            };
        };

        resolve(output);
    });
};
export const addCategory = ({ category }) => {
    return new Promise(async (resolve, reject) => {
        try {

            const output = await validatior(
                {
                    category: category?.trim()
                },
                {
                    category: true
                },
                'createCategory'
            );

            try {
                let categoryCreated = await db.category({
                    category: output.category
                });
                categoryCreated.save();
                resolve(categoryCreated);
            } catch (error) {
                console.log('Create_Catogery_PRODUCTS_DB => ', error);
                reject("Error creating catogery"); return 0;
            };

        } catch (error) {
            reject(error); return 0;
        };
    });
};
export const editCategory = ({ category, ID }) => {
    return new Promise(async (resolve, reject) => {
        try {

            category = category?.trim().toLocaleLowerCase();

            if (category.length < 2) {
                throw 'invalid category';
            };

            try {

                const existingDataFormDb = await db.category.find({ category: category });

                if (existingDataFormDb.length > 0 && existingDataFormDb[0]?._id != ID) {
                    reject('Category already exists');
                } else {
                    try {

                        const updated = await db.category.updateOne({ _id: ID }, {
                            $set: {
                                category: category
                            }
                        });

                        resolve('Category updated successfully');

                    } catch (error) {
                        console.log('EDIT_CATEGORY_UPDATE_DB => ', error);
                        reject('Error updating category 3'); return 0;
                    };
                };

            } catch (error) {
                console.log('EDIT_CATEGORY_DB_IN => ', error);
                reject('Error updating category 2'); return 0;
            };


        } catch (error) {
            console.log('EDIT_CATEGORY_DB => ', error);
            reject('Error updating category'); return 0;
        };
    });
};
export const deleteCategory = ({ ID }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const afterDelete = await db.category.deleteOne({ _id: ID });
            resolve("Category successfully deleted");
        } catch (error) {
            reject('Error deleteing category'); return 0;
        };
    });
};

export const addProduct = ({ title, description, price, quantity, offer, category }, files) => {
    return new Promise(async (resolve, reject) => {
        try {

            const output = await validatior(
                {
                    title: title,
                    description: description,
                    price: price,
                    stock: quantity,
                    offer: offer,
                    category: category,
                    files: files
                },
                {
                    files: true,
                    filesLength: 4,
                    PID: true,
                    description: true,
                    price: true,
                    title: true,
                    category: true,
                    stock: true
                },
                'addproduct'
            );

            try {

                const keys = Object.keys(output.files);

                keys.forEach((keyVal, index) => {
                    output.files[keyVal].mv(`${__dirname}/public/product_images/${output.PID + (index + 1)}.jpg`);
                });

                const addedData = await db.products({
                    PID: output.PID,
                    title: output.title,
                    description: output.description,
                    category: output.category,
                    price: output.price,
                    offer: output.offer,
                    stock: output.stock,
                });

                addedData.save();

                resolve(output.PID);

            } catch (error) {
                console.error("ERROR_ADDING_PRODUCTS => ", error);
                reject('Error adding product'); return 0;
            };

        } catch (error) {
            console.log(error)
            reject(error);
        };
    });
};
export const editProduct = (body, files) => {
    return new Promise(async (resolve, reject) => {
        try {

            const parsedBody = body?.data ? JSON.parse(body.data) : body ? body : {};

            const { title, description, price, quantity, offer, category, PID } = parsedBody;

            const output = await validatior(
                {
                    title: title,
                    description: description,
                    price: price,
                    stock: quantity,
                    offer: offer,
                    category: category,
                    files: files,
                    PID: PID?.trim()
                },
                {
                    PID: true,
                },
                'updateproduct'
            );

            try {

                if (output.files) {
                    output.files?.img1?.mv(`${__dirname}/public/product_images/${output.PID + 1}.jpg`);
                    output.files?.img2?.mv(`${__dirname}/public/product_images/${output.PID + 2}.jpg`);
                    output.files?.img3?.mv(`${__dirname}/public/product_images/${output.PID + 3}.jpg`);
                    output.files?.img4?.mv(`${__dirname}/public/product_images/${output.PID + 4}.jpg`);
                };

                const ExistingData = await db.products.findOne({ PID: PID });

                const addedData = await db.products.updateOne({ PID: PID }, {
                    $set: {
                        title: output.title ? output.title : ExistingData.title,
                        description: output.description ? output.description : ExistingData.description,
                        category: output.category ? output.category : ExistingData.category,
                        price: output.price ? output.price : ExistingData?.price ? ExistingData.price : 0,
                        offer: output.offer ? output.offer : ExistingData?.offer ? ExistingData.offer : 0,
                        stock: output.stock ? output.stock : ExistingData?.stock ? ExistingData.stock : 0,
                    }
                });

                resolve('Product update success');

            } catch (error) {
                console.error("ERROR_UPDATING_PRODUCTS => ", error);
                reject('Error updating product'); return 0;
            };

        } catch (error) {
            reject(error);
        };
    });
};
export const deleteProduct = (PID) => {
    return new Promise(async (resolve, reject) => {
        try {

            console.log(PID)

            let output = await validatior(
                {
                    PID: PID
                },
                {
                    PID: true
                },
                'updateproduct'
            );

            try {

                const afterDeleted = await db.products.deleteOne({ PID: PID });

                let img1 = fs.unlink(`${__dirname}/public/product_images/${output.PID}1.jpg`, () => {

                    let img2 = fs.unlink(`${__dirname}/public/product_images/${output.PID}2.jpg`, () => {

                        let img3 = fs.unlink(`${__dirname}/public/product_images/${output.PID}3.jpg`, () => {

                            let img4 = fs.unlink(`${__dirname}/public/product_images/${output.PID}4.jpg`, () => {

                                resolve("Product successfully deleted");
                            });
                        });
                    });
                });


            } catch (error) {
                console.error("DELETE_PRDUCT_DB => ", error);
                reject("Error deleting product"); return 0;
            };

        } catch (error) {
            reject(error);
        };
    });
};
