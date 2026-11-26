<?php
/**
 * CDC Management System - Hardened Unified PDO Database Layer
 * Used identically by Admin, Student, and Faculty portals so all three portals
 * store and retrieve data using real prepared statements, strict types, and ACID transactions.
 */

declare(strict_types=1);

final class Database
{
    private static ?PDO $instance = null;
    private static array $config = [];

    public static function init(array $config): void
    {
        self::$config = $config;
        date_default_timezone_set($config['timezone'] ?? 'Asia/Kolkata');
    }

    public static function getConnection(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        if (empty(self::$config)) {
            self::$config = require __DIR__ . '/config.php';
        }

        $db = self::$config['db'];
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $db['host'],
            $db['port'],
            $db['database'],
            $db['charset']
        );

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false, // Enforce native MySQL prepared statements
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ];

        self::$instance = new PDO($dsn, $db['username'], $db['password'], $options);
        self::$instance->exec("SET time_zone = '+05:30'");
        return self::$instance;
    }

    /**
     * Execute a parameterized SELECT query and return all rows.
     */
    public static function fetchAll(string $sql, array $params = []): array
    {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Execute a parameterized SELECT query and return a single row or null.
     */
    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /**
     * Execute a parameterized INSERT/UPDATE/DELETE and return affected row count.
     */
    public static function execute(string $sql, array $params = []): int
    {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    public static function lastInsertId(): int
    {
        return (int)self::getConnection()->lastInsertId();
    }

    /**
     * Run a callback safely inside a MySQL ACID transaction.
     */
    public static function transaction(callable $callback): mixed
    {
        $pdo = self::getConnection();
        $pdo->beginTransaction();
        try {
            $result = $callback($pdo);
            $pdo->commit();
            return $result;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }
}
