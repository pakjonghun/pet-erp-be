import { Db } from 'mongodb';

module.exports = {
  async up(db: Db) {
    return db.collection('sales').updateMany(
      {},
      {
        $set: {
          isOut: true,
        },
      },
    );
  },
};
