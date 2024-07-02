import { Db } from 'mongodb';

module.exports = {
  async up(db: Db) {
    return db.collection('users').updateMany(
      {},
      {
        $set: {
          role: [
            'BACK_DELETE',
            'BACK_EDIT',
            'STOCK_IN',
            'STOCK_OUT',
            'STOCK_SALE_OUT',
            'ORDER_CREATE',
            'ORDER_EDIT',
            'ORDER_DELETE',
            'SALE_CREATE',
            'SALE_EDIT',
            'SALE_DELETE',
            'ADMIN_ACCESS',
            'ADMIN_ACCOUNT',
            'ADMIN_DELIVERY',
            'ADMIN_LOG',
          ],
        },
      },
    );
  },
};
