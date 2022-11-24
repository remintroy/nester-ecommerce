import * as db from './schema.js';
import RandomID from 'random-id';

// no dependencies --- start
/**
 * Generates a random id with length control
 * controll id length by providing length to function (< length limit >);
 * if length not provided function returns id of default length of 10
 *
 * @param {number} length - Length of returning id
 * @returns - random ID e.g.. randomID(10) => AdF6ui-_oD
 */
export function randomId(length, pattern) {
    length = length ? length : 10;

    if (pattern) {
        return RandomID(length, pattern);
    } else {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('');
        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        };
        return str;
    };
};

export const nameFormatter = (name) => {
    let arryOfEachName = name?.split(' ') ? name.split(' ') : [];
    let arrayAfterFomatting = arryOfEachName.map(name => {
        let first = name.charAt(0).toUpperCase();
        let rest = name.slice(1).toLowerCase();
        return first + rest;
    });
    let resultName = arrayAfterFomatting.join(' ');
    return resultName;
};
export const countryCodeFormatter = (code) => {
    const codeArray = (code + "").split('+');
    const formattedCode = codeArray[codeArray.length - 1];
    if (isNaN(Number(formattedCode))) {
        return null;
    } else {
        const output = `+${formattedCode}`;
        return output;
    };
};
export const dataToReadable = (date) => {
    const date_ = new Date(date);
    let dd = date_.getDate();
    let mm = date_.getMonth() + 1;
    let yyyy = date_.getFullYear();
    return `${isNaN(dd) ? '00' : dd}-${isNaN(mm) ? '00' : mm}-${isNaN(yyyy) ? '0000' : yyyy}`;
};
// no dependencies --- end


// uses db --- start
export const getAllCountries = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await db.countries.aggregate([
                {
                    $project: {
                        _id: 0,
                    }
                },
                {
                    $sort: {
                        name: 1
                    }
                }
            ]);
            resolve(data);
        } catch (error) {
            reject('Error while fectching country data form db');
        };
    });
};
export const getAllCountriesName = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await db.countries.aggregate([
                {
                    $group: {
                        _id: 'allCounties',
                        names: {
                            $addToSet: '$name'
                        }
                    }
                },
                {
                    $project: {
                        name: {
                            $sortArray: {
                                input: '$names',
                                sortBy: 1
                            }
                        },
                        _id: 0
                    }
                },
                {
                    $unwind: "$name"
                }

            ]);
            resolve(data);
        } catch (error) {
            reject('Error while fectching country data form db');
        };
    });
};
export const getCountryByName = (name) => {
    return new Promise(async (resolve, reject) => {
        if (typeof name == 'string') {
            try {
                const data = await db.countries.findOne({ name: nameFormatter(name) }, { _id: 0, __v: 0 });
                resolve(data);
            } catch (error) {
                reject('Error while fetching country data form db');
            };
        } else {
            reject('Name must be a string');
        };
    });
};
export const getCountryBycode = (code) => {
    return new Promise(async (resolve, reject) => {
        if (typeof code == 'string') {
            try {
                const data = await db.countries.findOne({ code: code.toUpperCase() }, { _id: 0, __v: 0 });
                resolve(data);
            } catch (error) {
                reject('Error while fetching country data form db');
            };
        } else {
            reject('Code must me string');
        };
    });
};
export const getCountryByMobileCode = (code) => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await db.countries.findOne(
                { mobileCode: countryCodeFormatter(code) },
                { _id: 0, __v: 0 }
            );
            resolve(data);
        } catch (error) {
            reject('Error fetching data form db');
        };
    });
};
// uses db --- end




// test --- below
const test = async () => {
    const data = await RandomID(10, 'A');
    console.log(data)
};
// test();
