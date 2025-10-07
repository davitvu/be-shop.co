'use strict';
const {
  Model
} = require('sequelize');
const product = require('./product');

module.exports = (sequelize, DataTypes) => {
  class Tag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Product, {
        through: models.ProductTag,
        foreignKey: 'tagId',
        otherKey: 'productId',
        as: 'products',
      });
    }
  }
  Tag.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
  }, {
    sequelize,
    modelName: 'Tag',
    hooks: {
      beforeValidate: async (tag) => {
        if (tag.name && tag.changed('name')) {
          const baseSlug = slugify(tag.name, { lower: true, strict: true });
          let uniqueSlug = baseSlug;
          let count = 1;

          while (await product.findOne({ where: { slug: uniqueSlug } })) {
            count++;
            uniqueSlug = `${baseSlug}-${count}`
          }

          tag.slug = uniqueSlug;
        }
      }
    }
  });
  return Tag;
};