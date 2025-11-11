package repository

import (
	"backend-avanzada/models"
	"errors"

	"gorm.io/gorm"
)

type AlchemistRepository struct{ db *gorm.DB }

func NewAlchemistRepository(db *gorm.DB) *AlchemistRepository { return &AlchemistRepository{db} }

func (r *AlchemistRepository) FindAll() ([]*models.Alchemist, error) {
	var list []*models.Alchemist
	return list, r.db.Find(&list).Error
}
func (r *AlchemistRepository) FindById(id int) (*models.Alchemist, error) {
	var m models.Alchemist
	err := r.db.Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &m, err
}
func (r *AlchemistRepository) Save(m *models.Alchemist) (*models.Alchemist, error) {
	return m, r.db.Save(m).Error
}
func (r *AlchemistRepository) Delete(m *models.Alchemist) error {
	return r.db.Delete(m).Error
}
