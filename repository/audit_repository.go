package repository

import (
	"backend-avanzada/models"
	"errors"

	"gorm.io/gorm"
)

type AuditRepository struct{ db *gorm.DB }

func NewAuditRepository(db *gorm.DB) *AuditRepository { return &AuditRepository{db} }

func (r *AuditRepository) FindAll() ([]*models.Audit, error) {
	var list []*models.Audit
	return list, r.db.Find(&list).Error
}
func (r *AuditRepository) FindById(id int) (*models.Audit, error) {
	var m models.Audit
	err := r.db.Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &m, err
}
func (r *AuditRepository) Save(m *models.Audit) (*models.Audit, error) {
	return m, r.db.Save(m).Error
}
func (r *AuditRepository) Delete(m *models.Audit) error {
	return r.db.Delete(m).Error
}
