-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 09. Jun 2023 um 02:36
-- Server-Version: 10.4.24-MariaDB
-- PHP-Version: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `advance`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `beatmaps`
--

DROP TABLE IF EXISTS `beatmaps`;
CREATE TABLE `beatmaps` (
  `id` int(11) NOT NULL,
  `beatmapid` int(32) NOT NULL,
  `beatmapsetid` int(32) NOT NULL,
  `playcount` int(11) NOT NULL DEFAULT 1,
  `passcount` int(11) NOT NULL DEFAULT 1,
  `title` varchar(255) NOT NULL,
  `artist` varchar(255) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `creatorid` int(32) NOT NULL,
  `version` varchar(255) NOT NULL,
  `length` int(11) NOT NULL,
  `ranked` int(11) NOT NULL,
  `last_update` int(32) NOT NULL,
  `added` int(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `beatmapsets`
--

DROP TABLE IF EXISTS `beatmapsets`;
CREATE TABLE `beatmapsets` (
  `id` int(11) NOT NULL,
  `setid` int(32) NOT NULL,
  `playcount` int(11) NOT NULL DEFAULT 1,
  `passcount` int(11) NOT NULL DEFAULT 1,
  `title` varchar(255) NOT NULL,
  `artist` varchar(255) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `creatorid` int(32) NOT NULL,
  `last_update` int(32) NOT NULL,
  `added` int(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `scores`
--

DROP TABLE IF EXISTS `scores`;
CREATE TABLE `scores` (
  `id` int(32) NOT NULL,
  `user` int(16) NOT NULL,
  `beatmap` varchar(255) DEFAULT NULL,
  `scoreid` varchar(255) DEFAULT NULL,
  `score` int(32) DEFAULT NULL,
  `accuracy` float NOT NULL,
  `maxcombo` int(11) DEFAULT NULL,
  `count50` int(11) DEFAULT NULL,
  `count100` int(11) DEFAULT NULL,
  `count300` int(11) DEFAULT NULL,
  `countmiss` int(11) DEFAULT NULL,
  `countkatu` int(11) DEFAULT NULL,
  `countgeki` int(11) DEFAULT NULL,
  `fc` tinyint(4) DEFAULT NULL,
  `mods` int(11) DEFAULT NULL,
  `time` varchar(255) DEFAULT NULL,
  `rank` varchar(3) DEFAULT NULL,
  `passed` tinyint(4) NOT NULL,
  `pp` float DEFAULT 0,
  `mode` tinyint(4) NOT NULL,
  `calculated` tinyint(4) NOT NULL DEFAULT 0,
  `added` int(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `stats`
--

DROP TABLE IF EXISTS `stats`;
CREATE TABLE `stats` (
  `id` int(11) NOT NULL,
  `user` int(16) NOT NULL,
  `global` int(11) DEFAULT NULL,
  `country` int(11) DEFAULT NULL,
  `pp` int(11) DEFAULT NULL,
  `accuracy` float NOT NULL,
  `playcount` int(11) NOT NULL,
  `playtime` int(11) NOT NULL,
  `score` bigint(32) NOT NULL,
  `hits` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `progress` int(11) NOT NULL,
  `mode` tinyint(4) NOT NULL,
  `time` int(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tokens`
--

DROP TABLE IF EXISTS `tokens`;
CREATE TABLE `tokens` (
  `user` int(16) NOT NULL,
  `access` text NOT NULL,
  `refresh` text NOT NULL,
  `expires` int(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `userid` int(16) NOT NULL,
  `username` varchar(255) NOT NULL,
  `username_safe` varchar(255) NOT NULL,
  `country` char(2) NOT NULL,
  `added` varchar(255) NOT NULL,
  `restricted` tinyint(4) NOT NULL,
  `available` tinyint(4) NOT NULL DEFAULT 1,
  `discord` varchar(20) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `beatmaps`
--
ALTER TABLE `beatmaps`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `beatmapsets`
--
ALTER TABLE `beatmapsets`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `scores`
--
ALTER TABLE `scores`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `stats`
--
ALTER TABLE `stats`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`user`),
  ADD KEY `user` (`user`);

--
-- Indizes für die Tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `beatmaps`
--
ALTER TABLE `beatmaps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `beatmapsets`
--
ALTER TABLE `beatmapsets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `scores`
--
ALTER TABLE `scores`
  MODIFY `id` int(32) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `stats`
--
ALTER TABLE `stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
