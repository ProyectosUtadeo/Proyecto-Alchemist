package repository

import (
	"backend-avanzada/models"
	"errors"
	"strings"
	"time"

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

func (r *MissionRepository) FindStale(before time.Time, closedStatuses []string) ([]*models.Mission, error) {
	var list []*models.Mission
	query := r.db.Preload("AssignedTo")
	if len(closedStatuses) > 0 {
		upper := make([]string, 0, len(closedStatuses))
		for _, st := range closedStatuses {
			upper = append(upper, strings.ToUpper(st))
		}
		query = query.Where("UPPER(status) NOT IN ?", upper)
	}
	if !before.IsZero() {
		query = query.Where("updated_at <= ?", before)
	}
	if err := query.Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
