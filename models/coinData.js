const { Schema, model } = require('mongoose');

const coinDataSchema = new Schema({
    coin: {
        type: Object,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }


}
    , {
        timestamps: true
    })

module.exports = model('CoinData', coinDataSchema);