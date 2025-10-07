'use strict';
const slugify = require('slugify');

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Variant, { foreignKey: 'productId', as: 'variants' });
      this.hasMany(models.Image, { foreignKey: 'productId', as: 'images' });
      this.hasMany(models.Review, { foreignKey: 'brandId', as: 'reviews' });
      this.belongsTo(models.Brand, { foreignKey: 'productId', as: 'brand' });
      this.hasMany(models.OrderItem, { foreignKey: 'orderItem', as: 'orderItems' })

      this.belongsToMany(models.Tag, {
        through: models.ProductTag, // bảng trung gian thì dùng cái này
        foreignKey: 'product_id', // cái này là khóa ngoại từ bảng trung gian trỏ về bảng hiện tại
        otherKey: 'tag_id', // cái này là khóa ngoại từ bảng trung gian trỏ về bảng còn lại
        as: 'tags' // bí danh (alias) là tên cột xuất hiện lúc truy vấn
      })
    }
  }
  Product.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imagePath: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0
      }
    },
    discountPrice: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0
      }
    },
    discountType: {
      type: DataTypes.ENUM('percent', 'cash'),
      defaultValue: 'percent'
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    tagsId: DataTypes.UUID,
    brandId: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Product',
  });

  Product.addHook('beforeValidate', async (product) => {
    if (product.name && product.changed('name')) {
      const baseSlug = slugify(product.name, { lower: true, strict: true });
      let uniqueSlug = baseSlug;
      let count = 1;

      while (await Product.findOne({ where: { slug: uniqueSlug } })) {
        count++;
        uniqueSlug = `${baseSlug}-${count}`
      }

      product.slug = uniqueSlug;
    }
  })
  return Product;
};