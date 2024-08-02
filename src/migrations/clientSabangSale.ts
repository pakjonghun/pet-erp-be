import { Db } from 'mongodb';

module.exports = {
  async up(db: Db) {
    return db.collection('clients').updateMany(
      {},
      {
        $set: {
          isSabangService: false,
        },
      },
    );
  },
};
