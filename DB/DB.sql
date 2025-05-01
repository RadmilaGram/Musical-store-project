CREATE DATABASE  IF NOT EXISTS `music_shop_db` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `music_shop_db`;
-- MySQL dump 10.13  Distrib 8.0.33, for Win64 (x86_64)
--
-- Host: localhost    Database: music_shop_db
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `brand`
--

DROP TABLE IF EXISTS `brand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brand` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brand`
--

LOCK TABLES `brand` WRITE;
/*!40000 ALTER TABLE `brand` DISABLE KEYS */;
INSERT INTO `brand` VALUES (70,'Charvel'),(76,'Epiphone'),(69,'ESP'),(67,'Fender'),(65,'Gibson'),(75,'Harley Benton'),(64,'Korg'),(77,'Marcus Miller'),(66,'Martin Guitar'),(79,'Novation'),(68,'Taylor'),(78,'Thomann'),(63,'Yamaha');
/*!40000 ALTER TABLE `brand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status`
--

DROP TABLE IF EXISTS `order_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status`
--

LOCK TABLES `order_status` WRITE;
/*!40000 ALTER TABLE `order_status` DISABLE KEYS */;
INSERT INTO `order_status` VALUES (1,'new'),(2,'confirmed'),(3,'done'),(4,'delivery'),(5,'canceled');
/*!40000 ALTER TABLE `order_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producer`
--

DROP TABLE IF EXISTS `producer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producer`
--

LOCK TABLES `producer` WRITE;
/*!40000 ALTER TABLE `producer` DISABLE KEYS */;
INSERT INTO `producer` VALUES (1,'Sony');
/*!40000 ALTER TABLE `producer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(300) DEFAULT NULL,
  `img` varchar(100) DEFAULT NULL,
  `price` float NOT NULL,
  `special_filds` varchar(1000) DEFAULT NULL,
  `brand` int NOT NULL,
  `status` int NOT NULL,
  `type` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `brand_idx` (`brand`),
  KEY `status_idx` (`status`),
  KEY `type_idx` (`type`),
  CONSTRAINT `brand` FOREIGN KEY (`brand`) REFERENCES `brand` (`id`),
  CONSTRAINT `status` FOREIGN KEY (`status`) REFERENCES `product_status` (`id`),
  CONSTRAINT `type` FOREIGN KEY (`type`) REFERENCES `product_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (17,'D-120CE NT','The Harley Benton D-120CE NT is a typical steel-string guitar with a robust dovetail construction, which also allows solo playing with its cutaway. Not only are the neck and headstock of this dreadnought guitar made of mahogany, its back and sides are made of mahogany as well.','/uploads/1746079453647.jpg',85,'{\"Number of strings\":\"6\",\"Body Shape\":\"Dreadnought\",\"Top Material\":\"Spruce\",\"Fretboard Material\":\"Rosewood\"}',75,1,21),(18,'Hummingbird Standard','Made in USA','/uploads/1746079994831.png',3333,'{\"Number of strings\":\"6\",\"Body Shape\":\"Dreadnought\",\"Top Material\":\"Spruce\",\"Fretboard Material\":\"Rosewood\"}',65,1,21),(19,'J-200 EC Studio BK','Nut width: 4.27 cm\r\nGold-plated hardware\r\nColour: Black','/uploads/1746080376548.png',469,'{\"Number of strings\":\"6\",\"Body Shape\":\"Jumbo\",\"Top Material\":\"Spruce\",\"Fretboard Material\":\"Rosewood\"}',76,1,21),(20,'552ce 12-Fret Urban Ironbark','Style: Grand Concert with cutaway, Back and sides: solid Urban Ironbark, Nut width: 47.6 mm, Colour: Natural Shaded Edgeburst, Made in USA','/uploads/1746082774126.png',2190,'{\"Number of strings\":\"12\",\"Body Shape\":\"Dreadnought\",\"Top Material\":\"Spruce\",\"Fretboard Material\":\"Rosewood\"}',68,1,21),(21,'C40','Bridge: Rosewood (Dalbergia latifolia), \r\nNut width: 52 mm, \r\nBody depth: 43 - 100 mm, \r\nScale: 650 mm (25.59\"), \r\nColour: Natural High-gloss','/uploads/1746082985929.png',111,'{\"Fretboard Material\":\"Rosewood\"}',63,1,22),(22,'Academy Series 12e-N','Top: Lutz spruce, solid, \r\nNut width: 47.6 mm, \r\nColour: Natural, \r\nIncludes Taylor gigbag, \r\nMade in Mexico','/uploads/1746083127249.png',733,'{\"Fretboard Material\":\"Rosewood\"}',68,1,22),(23,'Player II Tele RW SPKL3TS','6-Saddle tele bridge with strings-thru-body and block saddles, \r\nFender ClassicGear machine heads, \r\nNickel/chrome hardware, \r\nStrings: Fender USA 250L Nickel Plated Steel .009-.042, \r\nColour: Sparkle 3-Colour Sunburst','/uploads/1746083796490.png',825,'{\"Number of strings\":\"6\",\"Body Shape\":\"Telecaster\",\"Pickup Configuration\":\"SSS\",\"Top Material\":\"Spruce\",\"Fretboard Material\":\"Ebony\"}',67,1,23),(24,'LTD TE-200 SW','Pickups: ESP-designed LH-150N (neck) and ESP-designed LH-150B (bridge) humbuckers, \r\n1 x Volume control and 1 x tone control (Push-Pull), \r\n3-Way toggle switch, \r\nLTD fixed bridge with string-thru design','/uploads/1746085005965.png',499,'{\"Number of strings\":\"6\",\"Body Shape\":\"Telecaster\",\"Pickup Configuration\":\"SSS\",\"Top Material\":\"Spruce\",\"Fretboard Material\":\"Ebony\"}',69,1,23),(25,'V5 Alder-4 TS','Nut width: 38 mm, \r\nBone nut, \r\nPickup: 2x Marcus Vintage-J Revolution Jazz Single Coils, \r\n2 Volume and 1 Tone control, \r\nVintage bridge','/uploads/1746085276465.png',419,'{\"Number of strings\":\"6\",\"Body Shape\":\"Telecaster\",\"Pickup Configuration\":\"SSS\",\"Top Material\":\"Spruce\",\"Fretboard Material\":\"Ebony\"}',77,1,24),(27,'P8-5 TS','Pickups: Marcus Super P Revolution Split Coil (neck) and Marcus Super J Revolution Single Coil (bridge), \r\nMarcus Heritage-3 Preamplifier with Mid Frequency Control, \r\nControls: Volume/Tone (Dual Pot), Pickup Blender, Treble, Middle/Middle Frequency (Dual Pot) and Bass, ','/uploads/1746091513573.png',825,'{\"Number of strings\":\"5\",\"Fretboard Material\":\"Maple\",\"Top Material\":\"Maple\",\"Body Shape\":\"Strat\"}',77,1,24),(28,'DP-95 B','500 Sounds, \r\n200 Styles, \r\n60 Internal songs, \r\n2 Demo songs, \r\nLCD, \r\n128 Voice polyphony, ','/uploads/1746093114064.png',549,'{\"Number of Keys\":\"88\"}',78,1,17),(29,'NP-15 Piaggero Black','15 Sounds, \r\n64 Voices polyphony, \r\nDual / Layer function, \r\nReverb, \r\n15 Voice Demo Songs, \r\n10 Piano Preset Songs, \r\nMetronome, \r\nTransposer, \r\nRecording function','/uploads/1746093283954.png',175,'{\"Number of Keys\":\"61\"}',63,1,17),(30,'P-145 B','Tone generator: Yamaha CFIIIS with damper resonance, \r\n64-voice polyphony, \r\n10 instrument presets, \r\n50 internal song presets + 303 additional songs to learn via the Smart Pianist app, \r\nDual / Duo modes','/uploads/1746093409345.png',379,'{\"Power Source\":\"Adapter\",\"Number of Keys\":\"88\"}',63,1,19),(31,'DP-26','20 Sounds, \r\n2 Demo songs, \r\n50 Styles, \r\n128 Voice polyphony, \r\nLED display, \r\nLayer mode, \r\nSplit mode, \r\nDuo mode, \r\nMaster EQ','/uploads/1746093524774.png',315,'{\"Number of Keys\":\"88\",\"Power Source\":\"Battery\",\"Touch Sensitivity\":true}',78,1,19),(32,'MODX7+','Velocity-sensitive semi-weighted keyboard, \r\nMotion control synthesis, \r\nSample-based AWM2 synthesis with 128 voices, \r\n5.67 GB waveform ROM & 1.75 GB flash ROM for user waveforms, \r\nFM-X synthesis with 128 voices','/uploads/1746093694073.png',1.529,'{\"Number of Keys\":\"76\",\"Power Source\":\"Adapter\"}',63,1,18),(33,'Launchkey 49 MK4','Buttons for octave up/down, arp/scale/fixed chord, play/stop/record/loop, track navigation, stop/solo/mute, capture MIDI/quantisation/click/undo, scene start as well as device selection and device lock functions, \r\nSplit and Layer function, \r\nDimensions (W x H x D): 730 x 93 x 263.5 mm','/uploads/1746093828261.png',248,'{\"Number of Keys\":\"49\",\"Touch Sensitivity\":true,\"Power Source\":\"Battery\"}',79,1,20),(34,'49SL MKIII','Dimensions: 816.6 x 299.6 x 100 mm, \r\nWeight: 5.36 kg, \r\nIncludes power supply (12V DC), USB cable, Ableton Live Lite, 4 GB Loopmasters Sounds, XLN Audio Addictive Keys','/uploads/1746093932894.png',495,'{\"Power Source\":\"Adapter\",\"Number of Keys\":\"49\"}',79,1,20);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_status`
--

DROP TABLE IF EXISTS `product_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_status`
--

LOCK TABLES `product_status` WRITE;
/*!40000 ALTER TABLE `product_status` DISABLE KEYS */;
INSERT INTO `product_status` VALUES (3,'hiden'),(1,'in stock'),(2,'out of stock');
/*!40000 ALTER TABLE `product_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_type`
--

DROP TABLE IF EXISTS `product_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_type`
--

LOCK TABLES `product_type` WRITE;
/*!40000 ALTER TABLE `product_type` DISABLE KEYS */;
INSERT INTO `product_type` VALUES (21,'Acoustic Guitars'),(24,'Bass Guitars'),(22,'Classical Guitars'),(17,'Digital piano'),(23,'Electric Guitars'),(20,'MIDI controller'),(19,'Stage piano'),(18,'Synthesizer'),(25,'Ukulele');
/*!40000 ALTER TABLE `product_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_type_special_field`
--

DROP TABLE IF EXISTS `product_type_special_field`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_type_special_field` (
  `type_id` int NOT NULL,
  `spec_fild_id` int NOT NULL,
  KEY `type_id_idx` (`type_id`),
  KEY `field_id_idx` (`spec_fild_id`),
  CONSTRAINT `product_type_id` FOREIGN KEY (`type_id`) REFERENCES `product_type` (`id`),
  CONSTRAINT `special_field_id` FOREIGN KEY (`spec_fild_id`) REFERENCES `special_field` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_type_special_field`
--

LOCK TABLES `product_type_special_field` WRITE;
/*!40000 ALTER TABLE `product_type_special_field` DISABLE KEYS */;
INSERT INTO `product_type_special_field` VALUES (21,19),(21,11),(21,21),(21,22),(22,22),(23,19),(23,11),(23,20),(23,21),(23,22),(24,22),(24,21),(24,11),(24,19),(17,14),(18,14),(18,15),(18,18),(20,18),(20,14),(20,15),(19,15),(19,14),(19,18);
/*!40000 ALTER TABLE `product_type_special_field` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `product_type_special_fields`
--

DROP TABLE IF EXISTS `product_type_special_fields`;
/*!50001 DROP VIEW IF EXISTS `product_type_special_fields`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `product_type_special_fields` AS SELECT 
 1 AS `type_name`,
 1 AS `field_name`,
 1 AS `type_id`,
 1 AS `field_id`,
 1 AS `field_dt`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `product_view`
--

DROP TABLE IF EXISTS `product_view`;
/*!50001 DROP VIEW IF EXISTS `product_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `product_view` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `description`,
 1 AS `img`,
 1 AS `price`,
 1 AS `special_fields`,
 1 AS `brand_name`,
 1 AS `status_name`,
 1 AS `type_name`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `special_field`
--

DROP TABLE IF EXISTS `special_field`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `special_field` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `datatype` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `datatype_idx` (`datatype`),
  CONSTRAINT `datatype` FOREIGN KEY (`datatype`) REFERENCES `special_field_datatype` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `special_field`
--

LOCK TABLES `special_field` WRITE;
/*!40000 ALTER TABLE `special_field` DISABLE KEYS */;
INSERT INTO `special_field` VALUES (11,'Number of strings',2),(12,'is there a case included',1),(13,'Neck size',4),(14,'Number of Keys',2),(15,'Touch Sensitivity',1),(16,'Weighted Keys',1),(17,'Built-in Speakers',1),(18,'Power Source',4),(19,'Body Shape',4),(20,'Pickup Configuration',4),(21,'Top Material',4),(22,'Fretboard Material',4);
/*!40000 ALTER TABLE `special_field` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `special_field_datatype`
--

DROP TABLE IF EXISTS `special_field_datatype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `special_field_datatype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `special_field_datatype`
--

LOCK TABLES `special_field_datatype` WRITE;
/*!40000 ALTER TABLE `special_field_datatype` DISABLE KEYS */;
INSERT INTO `special_field_datatype` VALUES (1,'boolean'),(2,'integer'),(3,'decimal'),(4,'string');
/*!40000 ALTER TABLE `special_field_datatype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `special_field_values`
--

DROP TABLE IF EXISTS `special_field_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `special_field_values` (
  `field_id` int NOT NULL,
  `value` varchar(45) NOT NULL,
  KEY `field_id_idx` (`field_id`),
  CONSTRAINT `field_id` FOREIGN KEY (`field_id`) REFERENCES `special_field` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `special_field_values`
--

LOCK TABLES `special_field_values` WRITE;
/*!40000 ALTER TABLE `special_field_values` DISABLE KEYS */;
INSERT INTO `special_field_values` VALUES (13,'3/4'),(13,'4/4'),(18,'Battery'),(18,'Adapter'),(19,'Dreadnought'),(19,'Jumbo'),(19,'Strat'),(19,'Les Paul'),(20,'SSS'),(20,'HSS'),(20,'HH'),(21,'Spruce'),(21,'Maple'),(21,'Mahogany'),(22,'Rosewood'),(22,'Maple'),(22,'Ebony'),(19,'Telecaster');
/*!40000 ALTER TABLE `special_field_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tradein`
--

DROP TABLE IF EXISTS `tradein`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tradein` (
  `product_id` int NOT NULL,
  `discont` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tradein`
--

LOCK TABLES `tradein` WRITE;
/*!40000 ALTER TABLE `tradein` DISABLE KEYS */;
/*!40000 ALTER TABLE `tradein` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `tradein_product_view`
--

DROP TABLE IF EXISTS `tradein_product_view`;
/*!50001 DROP VIEW IF EXISTS `tradein_product_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `tradein_product_view` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `img`,
 1 AS `brand_name`,
 1 AS `type_name`,
 1 AS `discount`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `user_role`
--

DROP TABLE IF EXISTS `user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role`
--

LOCK TABLES `user_role` WRITE;
/*!40000 ALTER TABLE `user_role` DISABLE KEYS */;
INSERT INTO `user_role` VALUES (1,'admin'),(2,'client');
/*!40000 ALTER TABLE `user_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(45) NOT NULL,
  `password` varchar(128) NOT NULL,
  `address` varchar(500) NOT NULL,
  `role` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `user_fole_fk_idx` (`role`),
  CONSTRAINT `user_fole_fk` FOREIGN KEY (`role`) REFERENCES `user_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Boss Just','boss_just@mailforspam.com','+373 14444','$2b$12$wxlmp8oCfrXRqwDVMl12VOmx.z4a.F6D133JlBjzg2QvbZRtusgNm','or. Chisinau Strada Circului 33',1),(2,'Lonely Klay','lonely_klay@mailforspam.com','+373 14222','$2b$12$bitELebR.iSOV216H8zureawD5ifER/cD4II2cBNmWyfqNdNWEuHu','or. Chisinau Bulevardul Dacia 80/3',2);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'music_shop_db'
--

--
-- Final view structure for view `product_type_special_fields`
--

/*!50001 DROP VIEW IF EXISTS `product_type_special_fields`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `product_type_special_fields` AS select `pt`.`name` AS `type_name`,`sf`.`name` AS `field_name`,`pt`.`id` AS `type_id`,`sf`.`id` AS `field_id`,`sf`.`datatype` AS `field_dt` from ((`product_type` `pt` join `product_type_special_field` `pt_sf` on((`pt`.`id` = `pt_sf`.`type_id`))) join `special_field` `sf` on((`sf`.`id` = `pt_sf`.`spec_fild_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `product_view`
--

/*!50001 DROP VIEW IF EXISTS `product_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `product_view` AS select `p`.`id` AS `id`,`p`.`name` AS `name`,`p`.`description` AS `description`,`p`.`img` AS `img`,`p`.`price` AS `price`,`p`.`special_filds` AS `special_fields`,`b`.`name` AS `brand_name`,`s`.`name` AS `status_name`,`t`.`name` AS `type_name` from (((`product` `p` left join `brand` `b` on((`p`.`brand` = `b`.`id`))) left join `product_status` `s` on((`p`.`status` = `s`.`id`))) left join `product_type` `t` on((`p`.`type` = `t`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `tradein_product_view`
--

/*!50001 DROP VIEW IF EXISTS `tradein_product_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `tradein_product_view` AS select `pv`.`id` AS `id`,`pv`.`name` AS `name`,`pv`.`img` AS `img`,`pv`.`brand_name` AS `brand_name`,`pv`.`type_name` AS `type_name`,`t`.`discont` AS `discount` from (`product_view` `pv` join `tradein` `t` on((`pv`.`id` = `t`.`product_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-01 13:08:59
