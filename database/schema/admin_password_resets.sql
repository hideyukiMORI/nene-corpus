CREATE TABLE `admin_password_resets` (
    `id`            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `token_hash`    VARCHAR(64)  NOT NULL COMMENT 'SHA-256 hex of the raw reset token',
    `admin_user_id` INT          NOT NULL,
    `expires_at`    DATETIME     NOT NULL,
    `used_at`       DATETIME     NULL DEFAULT NULL COMMENT 'Set when token is consumed',
    `created_at`    DATETIME     NOT NULL,
    UNIQUE KEY `uniq_admin_password_resets_token_hash` (`token_hash`),
    KEY `idx_admin_password_resets_admin_user_id` (`admin_user_id`)
);
