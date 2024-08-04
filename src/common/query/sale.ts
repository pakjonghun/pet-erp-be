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
