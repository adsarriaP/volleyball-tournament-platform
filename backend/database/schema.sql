-- ============================================================================
-- SCRIPT DDL MYSQL / MARIADB (XAMPP) - V2.0
-- PLATAFORMA DE TORNEOS Y PLANILLERO DE VOLEIBOL EN TIEMPO REAL
-- ============================================================================

CREATE DATABASE IF NOT EXISTS volleyball_tournaments
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE volleyball_tournaments;

-- Usuarios y Autenticación (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'REFEREE', 'TEAM_REP') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Torneos y Configuración de Reglas + Cupos + Auto-Scheduler (8:00 AM a 6:00 PM)
CREATE TABLE IF NOT EXISTS tournaments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    format_type ENUM('LEAGUE_ONLY', 'KNOCKOUT_ONLY', 'GROUPS_THEN_KNOCKOUT') NOT NULL,
    max_teams SMALLINT UNSIGNED DEFAULT 20,
    groups_count TINYINT UNSIGNED DEFAULT 2,
    max_sets TINYINT UNSIGNED DEFAULT 3,
    points_regular_set TINYINT UNSIGNED DEFAULT 25,
    points_final_set TINYINT UNSIGNED DEFAULT 15,
    points_difference TINYINT UNSIGNED DEFAULT 2,
    qualifiers_per_group TINYINT UNSIGNED DEFAULT 2,
    start_date DATE NULL,
    end_date DATE NULL,
    daily_start_hour TINYINT UNSIGNED DEFAULT 8,
    daily_end_hour TINYINT UNSIGNED DEFAULT 18,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fases y Grupos (Liguillas o Llaves)
CREATE TABLE IF NOT EXISTS tournament_phases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournament_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    phase_order TINYINT UNSIGNED NOT NULL,
    phase_type ENUM('ROUND_ROBIN', 'SINGLE_ELIMINATION') NOT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phase_groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phase_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(50) NOT NULL,
    FOREIGN KEY (phase_id) REFERENCES tournament_phases(id) ON DELETE CASCADE
);

-- Equipos (Con Delegado, Icono/Escudo guardado en Backend y Torneo asociado)
CREATE TABLE IF NOT EXISTS teams (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournament_id BIGINT UNSIGNED NULL,
    name VARCHAR(150) NOT NULL,
    delegate_name VARCHAR(150) NULL,
    logo_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS team_group_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (group_id) REFERENCES phase_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS players (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    jersey_number SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Partidos (Con Cancha String y Link de Google Maps)
CREATE TABLE IF NOT EXISTS matches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournament_id BIGINT UNSIGNED NOT NULL,
    phase_id BIGINT UNSIGNED NOT NULL,
    home_team_id BIGINT UNSIGNED NOT NULL,
    away_team_id BIGINT UNSIGNED NOT NULL,
    referee_id BIGINT UNSIGNED NULL,
    scheduled_at DATETIME NULL,
    court_number VARCHAR(120) NULL,
    court_map_url VARCHAR(500) NULL,
    status ENUM('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED') DEFAULT 'SCHEDULED',
    home_sets_won TINYINT UNSIGNED DEFAULT 0,
    away_sets_won TINYINT UNSIGNED DEFAULT 0,
    winner_team_id BIGINT UNSIGNED NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES tournament_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id),
    FOREIGN KEY (referee_id) REFERENCES users(id),
    FOREIGN KEY (winner_team_id) REFERENCES teams(id)
);

-- Sets y Alineaciones con Rotación
CREATE TABLE IF NOT EXISTS match_sets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    match_id BIGINT UNSIGNED NOT NULL,
    set_number TINYINT UNSIGNED NOT NULL,
    home_score SMALLINT UNSIGNED DEFAULT 0,
    away_score SMALLINT UNSIGNED DEFAULT 0,
    serving_team_id BIGINT UNSIGNED NULL,
    status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    winner_team_id BIGINT UNSIGNED NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (serving_team_id) REFERENCES teams(id),
    FOREIGN KEY (winner_team_id) REFERENCES teams(id)
);

-- Registro de posiciones 1 a 6 de cada set para la rotación
CREATE TABLE IF NOT EXISTS set_lineups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    set_id BIGINT UNSIGNED NOT NULL,
    team_id BIGINT UNSIGNED NOT NULL,
    pos_1_player_id BIGINT UNSIGNED NOT NULL,
    pos_2_player_id BIGINT UNSIGNED NOT NULL,
    pos_3_player_id BIGINT UNSIGNED NOT NULL,
    pos_4_player_id BIGINT UNSIGNED NOT NULL,
    pos_5_player_id BIGINT UNSIGNED NOT NULL,
    pos_6_player_id BIGINT UNSIGNED NOT NULL,
    UNIQUE KEY uq_set_team_lineup (set_id, team_id),
    FOREIGN KEY (set_id) REFERENCES match_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (pos_1_player_id) REFERENCES players(id),
    FOREIGN KEY (pos_2_player_id) REFERENCES players(id),
    FOREIGN KEY (pos_3_player_id) REFERENCES players(id),
    FOREIGN KEY (pos_4_player_id) REFERENCES players(id),
    FOREIGN KEY (pos_5_player_id) REFERENCES players(id),
    FOREIGN KEY (pos_6_player_id) REFERENCES players(id)
);
