package repository

import (
	"backend-avanzada/models"
	"errors"

	"gorm.io/gorm"
)

type TransmutationRepository struct {
	db *gorm.DB
}

func NewTransmutationRepository(db *gorm.DB) *TransmutationRepository {
	return &TransmutationRepository{db: db}
}

func (r *TransmutationRepository) FindAll() ([]*models.Transmutation, error) {
	var items []*models.Transmutation
	err := r.db.Preload("Alchemist").Order("id DESC").Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

func (r *TransmutationRepository) FindById(id int) (*models.Transmutation, error) {
	var t models.Transmutation
	err := r.db.Preload("Alchemist").Where("id = ?", id).First(&t).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &t, nil
}

func (r *TransmutationRepository) Save(data *models.Transmutation) (*models.Transmutation, error) {
	err := r.db.Save(data).Error
	if err != nil {
		return nil, err
	}
	return data, nil
}

func (r *TransmutationRepository) UpdateStatus(id uint, status string) error {
	return r.db.Model(&models.Transmutation{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *TransmutationRepository) Delete(data *models.Transmutation) error {
	return r.db.Delete(data).Error
}
