module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    firsts: DataTypes.STRING,
    lastname: DataTypes.STRING,
    studentnumber: DataTypes.STRING
  }, {})
  User.associate = (models) => {
    User.hasMany(models.StudentInstance, {
      foreignKey: 'userId',
      as: 'users'
    })
  }
  return User
}