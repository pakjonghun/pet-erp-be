import { Db } from 'mongodb';

module.exports = {
  async up(db: Db) {
    return db.collection('products').updateMany(
      {},
      {
        $set: {
          isFreeDeliveryFee: true,
        },
      },
    );
  },
};
