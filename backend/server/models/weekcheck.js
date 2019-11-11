module.exports = (sequelize, DataTypes) => {
  const WeekCheck = sequelize.define(
    'WeekCheck',
    {
      checklistItemId: DataTypes.INTEGER,
      checked: DataTypes.BOOLEAN
    },
    {
      timestamps: false
    }
  )
  WeekCheck.associate = (models) => {
    WeekCheck.belongsTo(models.Week, {
      foreignKey: 'weekId',
      onDelete: 'CASCADE'
    })
  }
  return WeekCheck
}