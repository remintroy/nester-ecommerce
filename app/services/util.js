/**
 * Generates a random id with length control
 * controll id length by providing length to function (< length limit >);
 * if length not provided function returns id of default length of 10
 *
 * @param {number} length - Length of returning id
 * @returns - random ID e.g.. randomID(10) => AdF6ui-_oD
 */
export function randomId(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('');
    var str = '';

    if (!length) {
        length = 10;
    };

    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    };

    return str;

};

export const dataToReadable = (date) => {

    const date_ = new Date(date);

    let dd = date_.getDate();
    let mm = date_.getMonth() + 1;
    let yyyy = date_.getFullYear();

    return `${isNaN(dd) ? '00' : dd}-${isNaN(mm) ? '00' : mm}-${isNaN(yyyy) ? '0000' : yyyy}`;
};