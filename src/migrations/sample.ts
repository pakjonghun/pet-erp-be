import { Db } from 'mongodb';

module.exports = {
  async up(db: Db) {
    return db.collection('users').createIndex({ id: 1 }, { unique: true });
  },
};
