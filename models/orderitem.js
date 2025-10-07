'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Variant, { foreignKey: 'variantId', as: 'variant' })
      this.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' })
      this.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' })
    }
  }
  OrderItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID
    },
    variantId: {
      type: DataTypes.UUID
    },
    productId: {
      type: DataTypes.UUID
    },
    quantity: {
      type: DataTypes.INTEGER
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'OrderItem',
  });
  return OrderItem;
};