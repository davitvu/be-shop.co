'use stric';

const statusCodes = require('./statusCodes');
const reasonPhrases = require('./reasonPhrases');

class SuccessResponse {
    constructor({ success = true, message, statusCode = statusCodes.OK, reasonPhrasesCode = reasonPhrases.OK, data = {} }) {
        this.success = success;
        this.message = !message ? reasonPhrasesCode : message;
        this.statusCode = statusCode;
        this.data = data;
    }

    send(res, header = {}) {
        return res.status(this.statusCode).json(this);
    }
}

class OK extends SuccessResponse {
    constructor({ message, statusCode = statusCodes.OK, reasonPhrasesCode = reasonPhrases.OK, data }) {
        super({ message, statusCode, reasonPhrasesCode, data });
    }
}

class Created extends SuccessResponse {
    constructor({ message, statusCode = statusCodes.CREATED, reasonPhrasesCode = reasonPhrases.CREATED, data }) {
        super({ message, statusCode, reasonPhrasesCode, data });
    }
}

module.exports = {
    OK,
    Created,
};