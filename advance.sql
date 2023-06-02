-- Adminer 4.8.1 MySQL 5.5.5-10.3.37-MariaDB-0ubuntu0.20.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

CREATE TABLE `beatmaps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `beatmapid` int(32) NOT NULL,
  `beatmapsetid` int(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `artist` varchar(255) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `creatorid` int(32) NOT NULL,
  `version` varchar(255) NOT NULL,
  `length` int(32) NOT NULL,
  `ranked` int(11) NOT NULL,
  `last_update` int(32) NOT NULL,
  `added` int(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `beatmapSearch` (`beatmapid`,`beatmapsetid`,`creatorid`,`creator`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


CREATE TABLE `beatmapsets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setid` int(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `artist` varchar(255) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `creatorid` int(32) NOT NULL,
  `last_update` int(32) NOT NULL,
  `added` int(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


CREATE TABLE `scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` int(11) NOT NULL,
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
  `time` int(32) DEFAULT NULL,
  `rank` varchar(3) DEFAULT NULL,
  `pp` float DEFAULT 0,
  `mode` tinyint(4) NOT NULL,
  `calculated` tinyint(4) NOT NULL DEFAULT 0,
  `added` int(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `scoreSearch` (`user`,`beatmap`,`scoreid`,`mods`,`time`,`rank`,`pp`,`mode`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


CREATE TABLE `stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` int(11) NOT NULL,
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
  `time` int(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `statsSearch` (`user`,`global`,`pp`,`playcount`,`playtime`,`mode`,`time`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `username_safe` varchar(255) NOT NULL,
  `country` char(2) NOT NULL,
  `added` varchar(255) NOT NULL,
  `available` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


-- 2023-06-02 14:43:23
