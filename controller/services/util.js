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

export const errorMessage = (error, code) => {
    const output = {};
    const defaultErrCode = 500;
    output.error = error ? (error + "").trim() : 'Oops thats an error';
    output.code = code ? code : defaultErrCode;
    var statusMessages = {
        '200': 'OK',
        '201': 'Created',
        '200': 'OK',
        '201': 'Created',
        '202': 'Accepted',
        '203': 'Non-Authoritative Information',
        '204': 'No Content',
        '205': 'Reset Content',
        '206': 'Partial Content',
        '207': 'Multi-Status (WebDAV)',
        '208': 'Already Reported (WebDAV)',
        '226': 'IM Used',
        '300': 'Multiple Choices',
        '301': 'Moved Permanently',
        '302': 'Found',
        '303': 'See Other',
        '304': 'Not Modified',
        '305': 'Use Proxy',
        '306': '(Unused)',
        '307': 'Temporary Redirect',
        '308': 'Permanent Redirect (experimental)',
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '402': 'Payment Required',
        '403': 'Forbidden',
        '404': 'Not Found',
        '405': 'Method Not Allowed',
        '406': 'Not Acceptable',
        '407': 'Proxy Authentication Required',
        '408': 'Request Timeout',
        '409': 'Conflict',
        '410': 'Gone',
        '411': 'Length Required',
        '412': 'Precondition Failed',
        '413': 'Request Entity Too Large',
        '414': 'Request-URI Too Long',
        '415': 'Unsupported Media Type',
        '416': 'Requested Range Not Satisfiable',
        '417': 'Expectation Failed',
        '418': `I'm a teapot (RFC 2324)`,
        '420': 'Enhance Your Calm (Twitter)',
        '422': 'Unprocessable Entity (WebDAV)',
        '423': 'Locked (WebDAV)',
        '424': 'Failed Dependency (WebDAV)',
        '425': 'Reserved for WebDAV',
        '426': 'Upgrade Required',
        '428': 'Precondition Required',
        '429': 'Too Many Requests',
        '431': 'Request Header Fields Too Large',
        '444': 'No Response (Nginx)',
        '449': 'Retry With (Microsoft)',
        '450': 'Blocked by Windows Parental Controls (Microsoft)',
        '451': 'Unavailable For Legal Reasons',
        '499': 'Client Closed Request (Nginx)',
        '500': 'Internal Server Error',
        '501': 'Not Implemented',
        '502': 'Bad Gateway',
        '503': 'Service Unavailable',
        '504': 'Gateway Timeout',
        '505': 'HTTP Version Not Supported',
        '506': 'Variant Also Negotiates (Experimental)',
        '507': 'Insufficient Storage (WebDAV)',
        '508': 'Loop Detected (WebDAV)',
        '509': 'Bandwidth Limit Exceeded (Apache)',
        '510': 'Not Extended',
        '511': 'Network Authentication Required',
        '598': 'Network read timeout error',
        '599': 'Network connect timeout error',
    };
    output.message = statusMessages[code ? code : defaultErrCode];
    return output;
};

export const dateIsValid = (date) => {
    return date instanceof Date && !isNaN(date);
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
export const dateToReadable = (date) => {
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
