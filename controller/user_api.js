import * as util from './services/util.js';
import * as search from './services/search.js';

export const searchAPI = async (req, res) => {
    try {

        const { q, pages } = req.query;

        const data = await search.search(q, pages);

        res.send({ status: 'good', message: data });

    } catch (error) {
        res.send(
            error.message ?
                { status: 'error', ...error } :
                { status: 'error', ...util.errorMessage(error ? error : 'Oops something went wrong', 500) }
        );
    };
};