import * as db from './schema.js';

// adds view count for each proudct
export const addProductViews = async (PID) => {
    try {
        // adds new date to views array
        return await db.products.updateOne({ PID: PID }, {
            $push: { views: new Date() }
        });
    } catch (error) {
        throw 'Error updating view count';
    };
};

// adds impressions to product array
export const addProductImpressions = async (PID) => {
    try {
        // adds new date to impressions array
        return await db.products.updateOne({ PID: PID }, {
            $push: { impressions: new Date() }
        });
    } catch (error) {
        throw 'Error updating imressions count';
    };
};

// add interactions to products array
export const addProductInteractions = async (PID) => {
    try {
        return await db.products.updateOne({ PID: PID }, {
            $push: { interactions: new Date() }
        });
    } catch (error) {
        throw 'Error updating interactions count';
    };
};

export const addProductReachedCheckout = async (PID) =>{
    try {
        return await db.products.updateOne({ PID: PID }, {
            $push: { reachedCheckout: new Date() }
        });
    } catch (error) {
        throw 'Error updating reached checkout count';
    };
};