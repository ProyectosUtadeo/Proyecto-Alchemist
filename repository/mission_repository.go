package repository

import (
	"backend-avanzada/models"
	"errors"

	"gorm.io/gorm"
)

type MissionRepository struct{ db *gorm.DB }

func NewMissionRepository(db *gorm.DB) *MissionRepository { return &MissionRepository{db} }

func (r *MissionRepository) FindAll() ([]*models.Mission, error) {
	var list []*models.Mission
	return list, r.db.Preload("AssignedTo").Find(&list).Error
}
func (r *MissionRepository) FindById(id int) (*models.Mission, error) {
	var m models.Mission
	err := r.db.Preload("AssignedTo").Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &m, err
}
func (r *MissionRepository) Save(m *models.Mission) (*models.Mission, error) {
	return m, r.db.Save(m).Error
}
func (r *MissionRepository) Delete(m *models.Mission) error {
	return r.db.Delete(m).Error
}
