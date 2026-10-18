package com.hrplatform.app.modules.audit.repository;

import com.hrplatform.app.modules.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

//En étendant JpaRepository<AuditLog, UUID>,
// Spring va automatiquement générer toutes les opérations d'écriture et de lecture classiques
// (sauvegarder un log, trouver par clé primaire, etc.) sans que nous n'ayons à écrire une seule ligne de SQL.
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    // 1. Récupère tous les logs triés par date (du plus récent au plus ancien)
    List<AuditLog> findAllByOrderByTimestampDesc();

    // 2. Filtre les logs pour un utilisateur spécifique
    List<AuditLog> findByUserEmailOrderByTimestampDesc(String email);

    // 3. Filtre les logs par type d'action (ex: voir toutes les connexions)
    List<AuditLog> findByActionOrderByTimestampDesc(String action);
}