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

export const saleCommonMatchWithMallId = (mallId: string) => ({
  orderStatus: '출고완료',
  productCode: { $exists: true },
  $expr: {
    $and: [
      { $ne: [{ $type: '$type' }, 'missing'] }, // 필드 존재 여부 확인
      { $not: { $in: ['$mallId', ['로켓그로스', '정글북']] } }, // 특정 값 제외
      { $in: ['$mallId', [mallId]] }, // 특정 mallId 포함 여부 확인
    ],
  },
  count: { $exists: true },
  payCost: { $exists: true },
  wonCost: { $exists: true },
  totalPayment: { $exists: true },
});
