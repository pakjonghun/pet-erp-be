export const profit = {
  $addFields: {
    accProfit: {
      $subtract: [
        { $subtract: ['$accPayCost', '$accWonCost'] },
        '$accDeliveryCost',
      ],
    },
  },
};

export const profitRate = {
  $addFields: {
    accProfitRate: {
      $round: [
        {
          $multiply: [
            {
              $divide: [
                '$accProfit',
                {
                  $cond: [
                    {
                      $or: [
                        {
                          $eq: ['$accTotalPayment', 0],
                        },
                        {
                          $eq: ['$accTotalPayment', null],
                        },
                      ],
                    },
                    1,
                    '$accTotalPayment',
                  ],
                },
              ],
            },
            100,
          ],
        },
        2,
      ],
    },
  },
};

export const saleCommonMatch = {
  orderStatus: '출고완료',
  productCode: { $exists: true },
  mallId: {
    $exists: true,
    $nin: ['로켓그로스', '정글북'],
  },
  count: { $exists: true },
  payCost: { $exists: true },
  wonCost: { $exists: true },
  totalPayment: { $exists: true },
};
