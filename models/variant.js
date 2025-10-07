'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Variant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' })
      this.hasMany(models.OrderItem, { foreignKey: 'variantId', as: 'variants' })
    }
  }
  Variant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID
    },
    attributes: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    sku: {
      type: DataTypes.STRING
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0
      }
    },
    stock: {
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'Variant',
  });
  return Variant;
};